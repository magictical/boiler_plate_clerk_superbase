# GripLab (그립랩) - 개발 TODO 리스트

> **Version**: v1.6
> **Last Updated**: 2026-02-03
> **Status**: MVP Development
> **참조 문서**: [PRD.md](./PRD.md) | [userflow.mermaid.md](./userflow.mermaid.md) | [setup_schema.sql](../supabase/migrations/setup_schema.sql)
> **계획 문서**: 구현·기능별 계획서는 [docs/implementation-plans/](implementation-plans/README.md)에 저장·관리합니다.

---

## 진행 상태 범례

| 상태  | 설명                  |
| ----- | --------------------- |
| `[ ]` | TODO - 미착수         |
| `[~]` | IN PROGRESS - 진행 중 |
| `[x]` | DONE - 완료           |
| `[!]` | BLOCKED - 차단됨      |
| `MVP` | MVP 필수 기능         |

---

## 📊 진행 현황 요약

| 카테고리             | 전체    | 완료   | 진행률  |
| -------------------- | ------- | ------ | ------- |
| 1. 기본 세팅         | 10      | 4      | 40%     |
| 2. 온보딩 플로우     | 25      | 15     | 60%     |
| 3. 메인 대시보드     | 15      | 0      | 0%      |
| 4. 루틴 빌더         | 20      | 0      | 0%      |
| 5. 워크아웃 플레이어 | 18      | 0      | 0%      |
| 6. 설정              | 10      | 0      | 0%      |
| 7. 게이미피케이션    | 8       | 0      | 0%      |
| **총계**             | **106** | **19** | **18%** |

---

## 1. 기본 세팅 (Foundation)

### 1.1 데이터베이스 설정 `MVP` ✅

> **관련 테이블**: profiles, gyms, gym_grade_scales, routines, training_logs
> **참조**: [setup_schema.sql](../supabase/migrations/setup_schema.sql) | [db-migration.md](./db-migration.md)

- [x] Supabase 마이그레이션 적용 확인
  - [x] `setup_schema.sql` Supabase Dashboard에서 실행
  - [x] 테이블 5개 생성 확인 (profiles, gyms, gym_grade_scales, routines, training_logs)
  - [x] RLS 정책 적용 확인
  - [x] `handle_new_user()` 트리거 적용 확인 (Clerk 연동 시 동작 테스트는 별도)
- [x] 검증용 RPC 적용: `20250203100000_add_griplab_schema_checks.sql` → `get_griplab_schema_checks()`
- [x] check-db API 확장: 5개 테이블·users·Storage·schemaChecks(트리거·RLS)
- [x] `pnpm run check-db` 스크립트: 트리거·RLS 상태 출력

### 1.2 TypeScript 타입 정의 `MVP`

- [x] `database.types.ts` (프로젝트 루트): Supabase public 스키마 타입 수동 정의
  - profiles, gyms, gym_grade_scales, routines, training_logs Row/Insert/Update
  - `get_griplab_schema_checks` RPC 반환 타입, `training_status` enum
- [x] `types/database.ts` 생성
  - 테이블 Row 별칭: Profile, Gym, GymGradeScale, Routine, TrainingLog (+ Insert/Update)
  - JSON 컬럼용: RoutineBlock (structure_json), SetResult (set_results_json)
  - Database 재 export (Supabase 클라이언트 제네릭용)
- [~] Supabase 타입 자동 생성: `pnpm run gen:types` 사용 가능 (Supabase 로그인 후 재생성 시 `database.types.ts` 덮어씀)

<details>
<summary><strong>1.2 TypeScript 타입 정의 MVP — 구현계획</strong></summary>

| #   | 작업                          | 산출물/검증                                                                      |
| --- | ----------------------------- | -------------------------------------------------------------------------------- |
| 1   | DB 스키마 기준 타입 파일 유지 | `database.types.ts`: Tables Row/Insert/Update, Enums, Functions                  |
| 2   | 앱에서 사용할 별칭·JSON 타입  | `types/database.ts`: Profile, Gym, Routine, TrainingLog, RoutineBlock, SetResult |
| 3   | (선택) 타입 자동 생성         | `supabase login` 후 `pnpm run gen:types` → `database.types.ts` 갱신              |
| 4   | 루틴 빌더 구현 시             | RoutineBlock 구조 확정 후 타입 보강 (children, type 디스크리미네이트 등)         |
| 5   | 워크아웃 플레이어 구현 시     | SetResult 구조 확정 후 타입 보강 (세트별 필드)                                   |

**참조**: [AGENTS.md](../AGENTS.md) gen:types 스크립트, [setup_schema.sql](../supabase/migrations/setup_schema.sql)

</details>

### 1.3 환경 변수 설정

- [x] Google Gemini API 키 발급 및 설정
  - [x] `GEMINI_API_KEY` 환경 변수 추가
- [x] Supabase 환경 변수 (이미 설정됨)
- [x] Clerk 환경 변수 (이미 설정됨)

### 1.4 공통 유틸리티

> **구현계획**: [docs/implementation-plans/1.4-common-utils.md](implementation-plans/1.4-common-utils.md)

- [x] `lib/utils/tier.ts` - 티어 관련 유틸리티
  - [x] 티어 번호 ↔ 이름 변환 (1=Silver, 2=Gold, ...)
  - [x] 티어별 색상 코드
- [x] `lib/utils/routine.ts` - 루틴 계산 유틸리티
  - [x] TUT (Time Under Tension) 계산
  - [x] 총 소요시간 계산
  - [x] 총 세트 수 계산
- [x] `lib/ai/gemini.ts` - Gemini API 클라이언트
  - [x] API 클라이언트 초기화 (fetch + GEMINI_API_KEY)
  - [x] 프롬프트 템플릿 (buildRoutinePrompt)
  - [x] Strict JSON Schema 검증 (zod parseRoutineResponse)

<details>
<summary><strong>1.4 공통 유틸리티 — 구현 요약</strong></summary>

| 모듈       | 역할                                                                                                   | 의존성                      |
| ---------- | ------------------------------------------------------------------------------------------------------ | --------------------------- |
| tier.ts    | 티어 이름·번호·기본 색상 (getTierName, getTierLevel, getTierColor)                                     | 없음                        |
| routine.ts | TUT/총 소요시간/총 세트 수 (getRoutineTotalDurationSeconds, getRoutineTotalSets, getRoutineTUTSeconds) | types/database RoutineBlock |
| gemini.ts  | 루틴 생성 API (buildRoutinePrompt, generateRoutineContent, parseRoutineResponse)                       | GEMINI_API_KEY, zod         |

구현 순서: tier → routine → gemini. 상세: [implementation-plans/1.4-common-utils.md](implementation-plans/1.4-common-utils.md)

</details>

---

## 2. 온보딩 플로우 (Onboarding) `MVP`

> **유저플로우 참조**: [userflow.mermaid.md - Section 2](./userflow.mermaid.md#2-온보딩-상세-플로우-onboarding-flow)
> **상태 전이**: Anonymous → SafetyAgreed → Guest/RegularUser

### 2.1 ON-00: 안전 동의 (Safety Consent) `MVP`

> **PRD 참조**: 3.1 [Step 0] 안전 동의
> **Skip 불가** - 필수 동의
> **구현 계획**: [2.1-on-00-safety-consent.md](implementation-plans/2.1-on-00-safety-consent.md)

- [x] `app/onboarding/safety/page.tsx` 생성
  - [x] 경고 아이콘 & 헤드라인
  - [x] 스크롤 가능한 약관 텍스트 박스
  - [x] 동의 체크박스
  - [x] [시작하기] 버튼 (체크박스 선택 시 활성화)
- [x] 로컬 스토리지에 안전 동의 상태 저장
- [x] 미동의 시 앱 진입 차단 로직 (middleware 쿠키 검사 → `/onboarding/safety` 리다이렉트)

### 2.2 ON-01: 홈짐 선택 (Gym Selection) `MVP`

> **PRD 참조**: 3.1 [Step 1] 홈짐 선택
> **DB 테이블**: gyms, gym_grade_scales
> **구현 계획**: [2.2-on-01-gym-select.md](implementation-plans/2.2-on-01-gym-select.md)

- [x] `app/onboarding/gym-select/page.tsx` 생성
  - [x] [건너뛰고 둘러보기] 버튼 → Guest 모드
  - [x] 암장 검색창
  - [x] 암장 리스트 (공식/커뮤니티 뱃지)
  - [x] [+ 새 암장 등록] 버튼
- [x] `components/onboarding/GymSearchList.tsx`
  - [x] 실시간 검색 필터링
  - [x] is_official 뱃지 표시
- [x] `actions/gyms.ts` Server Actions
  - [x] `getGyms(search?: string)` - 암장 목록 조회
  - [x] `createGym(data)` - 새 암장 생성

### 2.3 ON-02: 커스텀 암장 등록 (Create Gym)

> **DB 테이블**: gyms, gym_grade_scales
> **라이브러리**: dnd-kit (드래그 앤 드롭)
> **구현 계획**: [2.3-on-02-create-gym.md](implementation-plans/2.3-on-02-create-gym.md)

- [x] `app/onboarding/gym-create/page.tsx` 생성
  - [x] 암장 이름 입력
  - [x] 색상 추가 버튼 (+)
  - [x] 6단계 티어 박스 (Silver~Grandmaster)
  - [x] 드래그 앤 드롭 영역
  - [x] [저장하기] 버튼
- [x] `components/onboarding/GymCreator.tsx`
  - [x] 색상 추가/삭제 (ColorPicker)
  - [x] dnd-kit 드래그 앤 드롭 구현
  - [x] 티어 매핑 시각화
- [x] `actions/gyms.ts` 업데이트
  - [x] `createGymWithScales(gymData, scales[])` - 암장 + 색상 함께 저장

### 2.4 ON-03: 티어 배정 (Tier Assignment) `MVP`

> **PRD 참조**: 3.1 [Step 2] 티어 배정
> **DB 필드**: profiles.current_tier (1~6)
> **구현 계획**: [2.4-on-03-tier-assign.md](implementation-plans/2.4-on-03-tier-assign.md)

| 티어        | 색상 범위 | 값  |
| ----------- | --------- | --- |
| Silver      | 흰~주     | 1   |
| Gold        | 초~파     | 2   |
| Platinum    | 빨~핑     | 3   |
| Diamond     | 보라~갈   | 4   |
| Master      | 회색      | 5   |
| Grandmaster | 검정      | 6   |

- [x] `app/onboarding/tier-assign/page.tsx` 생성
  - [x] 색상 그리드 (sort_order 기준 정렬)
  - [x] 안내 문구: "한 세션에 50% 이상 완등 가능한 난이도"
  - [x] 티어 뱃지 즉시 표시 (Bounce/Fade-in)
  - [x] [다음] 버튼
- [x] `components/onboarding/ColorGrid.tsx`
  - [x] 선택한 홈짐의 색상 버튼 표시
  - [x] 선택 상태 하이라이트
- [x] `components/common/TierBadge.tsx`
  - [x] 6단계 뱃지 디자인
  - [x] 애니메이션 효과

### 2.5 ON-04: 수행 능력 측정 (Assessment) `MVP`

> **PRD 참조**: 3.1 [Step 3] 수행 능력 측정
> **DB 필드**: users.weight_kg, users.max_hang_1rm, users.no_hang_lift_1rm (마이그레이션 추가)
> **구현 계획**: [2.5-on-04-assessment.md](implementation-plans/2.5-on-04-assessment.md)

- [x] `app/onboarding/assessment/page.tsx` 생성
  - [x] Phase 1: "1RM 수치를 이미 알고 있나요?"
    - [x] Yes → 직접 입력 폼
    - [x] No → Phase 2 이동
  - [x] Phase 2: 장비 선택 카드
    - [x] 행보드 (Max Hang 입력)
    - [x] 로딩핀/블럭 (Lift 입력)
    - [x] 없음/모름 (체중만 입력)
  - [x] Phase 3: 직접 입력 / 장비별 단일 입력 / 체중만 입력 → 저장 후 메인 홈
  - [ ] (선택) 두 종목 측정 시 5분 강제 휴식 타이머
- [x] `components/onboarding/AssessmentForm.tsx`
  - [x] 단계 전환 UI (Phase 1 → 2 → 3)
  - [x] 숫자 입력 검증 (react-hook-form + zod, 0.1~500 kg / 체중 20~300 kg)
  - [x] 장비 선택 카드 UI
- [x] `actions/profiles.ts` Server Actions
  - [x] `updateAssessment(data)` — users 테이블 측정값 업데이트
  - [x] `getCurrentUserTier()` — assessment 진입 조건 확인용
- [x] 마이그레이션 `20250203140000_add_users_assessment_columns.sql` — users에 weight_kg, max_hang_1rm, no_hang_lift_1rm 추가

---

## 3. 메인 대시보드 (Home Dashboard) `MVP`

> **유저플로우 참조**: [userflow.mermaid.md - Section 3](./userflow.mermaid.md#3-메인-홈--대시보드-home-dashboard)
> **Gate Logic**: Guest vs Regular 분기 처리

### 3.1 HM-01: Guest 홈 화면 `MVP`

> **PRD 참조**: 3.4 [Guest Mode View]
> **구현 계획**: [3.1-hm-01-guest-home.md](implementation-plans/3.1-hm-01-guest-home.md)

- [x] `app/page.tsx` Guest 분기
  - [x] 상단 Sticky 배너: "내 티어 확인하고 AI 코칭 받기"
  - [x] 티어 영역: ? 뱃지 또는 잠금 아이콘
  - [x] 차트 영역: Sample Data + "데이터가 필요합니다"
  - [x] [+ 새 루틴] 클릭 시 설정 유도 팝업
- [x] `components/home/GuestBanner.tsx`
  - [x] 온보딩 유도 배너
  - [x] 클릭 시 온보딩 Step 1 이동
- [x] `components/common/GatePopup.tsx`
  - [x] "프로필을 완성해주세요" 팝업
  - [x] [확인] → 온보딩 / [취소] → 닫기

### 3.2 HM-02: Regular User 홈 화면 `MVP`

> **PRD 참조**: 3.4 [Regular User View]
> **DB 테이블**: profiles, training_logs
> **구현 계획**: [3.2-hm-02-regular-home.md](implementation-plans/3.2-hm-02-regular-home.md)

- [x] `app/page.tsx` Regular 분기
  - [x] 히어로 섹션: 닉네임 + 티어 뱃지
  - [x] 스트릭 위젯: 불꽃 + 연속 일수
  - [x] 성과 차트 (필터: 1개월/3개월/전체)
  - [x] FAB: [+ 새 루틴 만들기]
- [x] `components/home/HeroSection.tsx`
  - [x] 프로필 정보 표시
  - [x] TierBadge 통합
- [x] `components/home/StreakWidget.tsx`
  - [x] current_streak 표시
  - [x] 불꽃 아이콘
- [x] `components/home/StatsChart.tsx`
  - [x] 기간 필터 (1M/3M/All)
  - [x] Recharts AreaChart
- [x] `actions/training-logs.ts`
  - [x] `getHomeMetrics()` - 홈 요약 메트릭
  - [x] `getTrainingStats(period)` - 통계 조회 (MVP는 빈 데이터)

### 3.2.1 HM-03: 메인 홈 루틴 퀵 액션 `MVP`

> **원인 분석**: 홈 화면에서 루틴빌더 / 내 루틴 리스트로 바로가는 화면 내 메뉴가 없음 (단순 FAB 외에 명시적인 컨텐츠 메뉴 필요).

- [x] `components/home/HomeRoutineActions.tsx` (신규 컴포넌트)
  - [x] StreakWidget 하단에 가로(수평) 또는 카드 형태의 UI 렌더링
  - [x] 버튼 1: [최근 루틴 / 내 루틴 보기] -> `/routines` 로 이동
  - [x] 버튼 2: [새 루틴 만들기 / 빌더 선택] -> `/routine-builder` 로 이동
- [x] `app/page.tsx` 연동
  - [x] Regular User 분기 화면(StreakWidget 아래)에 컴포넌트 추가 배치

---

## 4. 루틴 빌더 (Routine Builder) `MVP`

> **유저플로우 참조**: [userflow.mermaid.md - Section 4](./userflow.mermaid.md#4-루틴-빌더-플로우-routine-builder)
> **Gate Logic**: Guest 유저 접근 시 설정 팝업 출력 후 차단

### 4.1 RB-01: 빌더 모드 선택 `MVP`

> **PRD 참조**: 3.2 루틴 빌더 Gate Logic
> **구현 계획**: [4.1-rb-01-mode-select.md](implementation-plans/4.1-rb-01-mode-select.md)

- [x] `app/routine-builder/page.tsx` 생성
  - [x] Guest 체크 → GatePopup 출력
  - [x] 카드 A: AI 코치 (Gemini 아이콘)
  - [x] 카드 B: 커스텀 빌더 (설정 아이콘)
- [x] `components/routine-builder/ModeSelectCard.tsx`
  - [x] 모드 선택 카드 UI

### 4.2 RB-02: AI 코치 (AI Coach) `MVP`

> **PRD 참조**: 3.2 A. AI Coach
> **Context 주입**: 티어, 체중, 지난 훈련 로그
> **구현 계획**: [4.2-rb-02-ai-coach.md](implementation-plans/4.2-rb-02-ai-coach.md)

- [x] `app/routine-builder/ai-coach/page.tsx` 생성
  - [x] 채팅 인터페이스
  - [x] 퀵 리플라이 칩: [컨디션 좋음], [어깨 통증], [시간 부족]
  - [x] 루틴 제안 카드
  - [x] [빌더로 가져오기] 버튼
- [x] `components/routine-builder/AIChat.tsx`
  - [x] 채팅 메시지 렌더링
  - [x] 스크롤 처리
  - [x] 로딩 상태
- [x] `components/routine-builder/RoutineSuggestionCard.tsx`
  - [x] 예상 시간, 강도 표시
  - [x] JSON 데이터 프리뷰
- [x] `actions/ai.ts` Server Actions
  - [x] `generateRoutine(context)` - Gemini API 호출
  - [x] Strict JSON Schema 검증

### 4.3 RB-03: 루틴 에디터 (Block Editor) `MVP`

> **PRD 참조**: 3.2 B. Custom Builder
> **DB 필드**: routines.structure_json (중첩 블록 지원)

- [x] `app/routine-builder/editor/page.tsx` 생성
  - [x] 헤더: 뒤로가기, 루틴 이름, [저장] 버튼
  - [x] 블록 리스트 (메인 영역)
  - [x] 하단 고정 패널 (통계 + 추가 버튼)
- [x] `components/routine-builder/BlockList.tsx`
  - [x] 블록 렌더링 (dnd-kit)
  - [x] 드래그 앤 드롭 핸들
- [x] `components/routine-builder/BlockItem.tsx`
  - [x] 단일 블록 (운동/휴식)
  - [x] 그룹 블록 (Nested Loop)
  - [x] 컬러 바 (운동-파랑, 휴식-초록)
  - [x] 삭제(X) 버튼
- [x] `components/routine-builder/EditorFooter.tsx`
  - [x] 통계 그리드: 운동 수, 세트, TUT, 소요시간
  - [x] 추가 버튼: [+ 운동], [+ 세트], [+ 휴식]
  - [x] Visual Timeline
  - [x] [루틴 생성 완료] 버튼
- [x] `components/routine-builder/VisualTimeline.tsx` (EditorFooter 통합)
  - [x] 루틴 흐름 시각화
  - [x] 강도 막대그래프

### 4.4 RB-04: 운동 선택 모달

- [x] `components/routine-builder/ExercisePicker.tsx`
  - [x] 검색창
  - [x] 카테고리 탭: 행보드 / 리프트 / 턱걸이 / 코어
  - [x] 클릭 시 블록 추가
- [x] `lib/data/exercises.ts`
  - [x] 운동 데이터베이스 (JSON)
  - [x] 카테고리별 분류

### 4.5 루틴 API/Actions

- [x] `actions/routines.ts` Server Actions
  - [x] `getRoutines(userId)` - 루틴 목록
  - [x] `getRoutine(routineId)` - 루틴 상세
  - [x] `createRoutine(data)` - 루틴 생성
  - [x] `updateRoutine(routineId, data)` - 루틴 수정
  - [x] `deleteRoutine(routineId)` - 루틴 삭제
  - [x] `duplicateRoutine(routineId)` - 루틴 복제

---

## 5. 워크아웃 플레이어 (Workout Player) `MVP`

> **유저플로우 참조**: [userflow.mermaid.md - Section 5](./userflow.mermaid.md#5-훈련-플레이어-플로우-training-player)
> **DB 테이블**: training_logs

### 5.1 PL-01: 모드 선택 `MVP`

> **PRD 참조**: 3.3 듀얼 모드 플레이어

- [x] `app/workout/[routineId]/page.tsx` 생성
  - [x] 모드 선택 모달
  - [x] [⏱️ 타이머 모드] (Auto)
  - [x] [📝 로거 모드] (Manual)
- [x] `components/workout/ModeSelectModal.tsx`
  - [x] 모드 선택 버튼 UI

### 5.1.1 PL-01-A: 내 루틴 목록 페이지 (My Routines) `MVP`

> **원인 분석**: 유저플로우와 PRD 상에서 루틴 "생성"은 명시되어 있으나 생성된 커스텀 루틴들을 모아보고 훈련을 시작할 수 있는 "저장된 루틴 목록" 페이지에 대한 명확한 UI 플랜이 누락되어 있음. 플레이어 진입(PL-01) 전 단계로 필수적으로 요구됨.

- [x] `app/routines/page.tsx` 또는 `app/routine-builder/page.tsx` 확장
  - [x] 저장된 내 루틴 리스트 조회 (서버 액션 `getRoutines` 연동)
  - [x] 빈 상태(Empty State) 디자인: 루틴이 없을 때 "새 루틴 만들기" 유도
- [x] `components/routine-builder/RoutineList.tsx`
  - [x] 루틴 카드형 UI 렌더링 (루틴명, 소요시간, 세트수 표시)
  - [x] [▶️ 훈련 시작] 버튼 -> `/workout/[routineId]` 로 이동
  - [x] [새 루틴 만들기] 버튼 -> `/routine-builder/editor` 로 이동

### 5.1.2 PL-01-B: 홈 화면 루틴 진입 메뉴 (Routine Entry Menu) `MVP`

> **원인 분석**: 홈 화면에서 "내 루틴 목록"과 "새 루틴 만들기(AI/커스텀)"로 분기하여 이동할 수 있는 직관적인 진입점이 필요함.

- [x] `components/home/RoutineEntryMenu.tsx` (바텀 시트 모달)
  - [x] 메뉴 1: 내 루틴 목록 보기 (`/routines`)
  - [x] 메뉴 2: 새 루틴 만들기 (`/routine-builder`)
- [x] `components/home/RoutineFAB.tsx` 수정
  - [x] 기존 직접 이동 링크 대신 `RoutineEntryMenu` 모달 트리거로 변경

### 5.1.3 PL-01-C: 루틴 요약 화면 구조 시각화 (Routine Structure Preview) `MVP`

> **원인 분석**: 훈련 시작 전 요약 페이지(`/workout/[routineId]`)에서 예상 소요시간과 총 세트 수만 명시되고 있어, 어떤 운동들로 구성된 루틴인지 구체적인 컨텍스트를 파악하기 어려움. 플레이어 진입 전에 루틴의 세부 블록을 나열해주는 리스트(또는 타임라인) UI 추가가 필요.

- [x] `components/workout/RoutinePreviewList.tsx` 컴포넌트 생성
  - [x] 루틴 블록(`routine.structure_json`) 파싱 및 렌더링
  - [x] 그룹(Loop) 블록 및 개별 운동 블록(Exercise)을 계층적 혹은 평탄화된 목록형태로 가시화
  - [x] 휴식(Rest) 블록은 간단히 아이콘/시간으로 표시
- [x] `app/workout/[routineId]/WorkoutStartClient.tsx` 화면 확장
  - [x] 기존 Stats Grid 밑에 전체 루틴 구조를 미리볼 수 있는 `RoutinePreviewList` 컴포넌트 마운트
  - [x] 훈련 시작하기 버튼은 리스트 하단에 위치하도록 레이아웃 유지

### 5.2 PL-02: 타이머 모드 (Auto) `MVP`

> **PRD 참조**: 3.3 A. 타이머 모드
> **피드백 사운드**: Start("삐-"), End("삐-삐-"), Rest End("톡...톡...")

- [x] `app/workout/[routineId]/timer/page.tsx` 생성
  - [x] 5초 Ready 카운트다운
  - [x] 메인 타이머 (분:초)
  - [x] 원형 프로그레스 바
  - [x] 세트 정보 (무게/엣지/그립)
  - [x] 컨트롤: [일시정지], [휴식 스킵], [중단]
- [x] `components/workout/TimerPlayer.tsx`
  - [x] 타이머 UI
  - [x] 프로그레스 애니메이션
- [x] `hooks/useWorkoutTimer.ts`
  - [x] 타이머 로직
  - [x] 세트 진행 관리
  - [x] 오디오 피드백
- [x] `lib/audio/sounds.ts`
  - [x] 비프음 재생 함수

### 5.3 PL-03: 로거 모드 (Manual) `MVP`

> **PRD 참조**: 3.3 B. 로거 모드

- [x] `app/workout/[routineId]/logger/page.tsx` 생성
  - [x] 세트 리스트 (현재 세트 강조)
  - [x] 상태 버튼: ✅ 성공 / ⚠️ 절반 / ❌ 실패
  - [x] 우상단 [중단] 버튼
- [x] `components/workout/LoggerPlayer.tsx`
  - [x] 세트 리스트 UI
  - [x] 상태 버튼 처리

### 5.4 PL-04: 세션 종료 `MVP`

> **PRD 참조**: 3.3 C. 세션 관리
> **DB 필드**: training_logs.status, rpe, abort_reason

- [x] `app/workout/[routineId]/end/page.tsx` 생성
  - [x] 정상 완료 시: RPE 슬라이더 (1~10)
  - [x] 중단 시: 사유 선택 (부상, 컨디션 난조 등)
  - [x] [기록 저장하기] 버튼
- [x] `components/workout/SessionEndClient.tsx`
  - [x] RPE 슬라이더 / 중단 사유 선택 포함
  - [x] 피드백 텍스트 동적 변경
- [x] `actions/training-logs.ts`
  - [x] `createTrainingLog(data)` - 훈련 기록 저장
  - [x] `updateStreak(userId)` - 스트릭 업데이트

### 5.5 PL-05: 홈 화면 데이터 프로바이딩 (Home Stats Data Integration) `MVP`

> **원인 분석**: 현재 `actions/training-logs.ts`의 `getHomeMetrics()` 및 `getTrainingStats()` 함수가 UI 개발 속도를 높이기 위해 다음과 같이 **정적인 데이터 (또는 0, 빈 배열)** 를 반환하도록 하드코딩 되어 있습니다. 훈련 기록(로깅) 체계를 갖추었으므로 실제 저장된 `training_logs` 를 집계하여 홈 화면에 시각화 해야 합니다.

- [x] `actions/training-logs.ts` 보완 개발
  - [x] `getHomeMetrics` 리팩터링: 사용자가 최근 1주~1달 간 수행한 `session` 수 카운트, `totalReps` 집계 알고리즘 적용
  - [x] `getTrainingStats` 리팩터링: 실제 `training_logs` 의 `ended_at` 날짜 기반으로 데이터 그룹화하여 해당 기간(1M, 3M, ALL)의 `TrainingStatsPoint[]` 리스트 (볼륨/성공률 등) 반환
  - [x] `consistencyPercent` 계산: 설정한 주간 훈련 목표 대비 달성률 표시 (MVP 시 단순 계산)
- [x] `components/home/StatsChart.tsx` 동적 연동
  - [x] 클라이언트 혹은 서버 사이드에서 서버 액션(`getTrainingStats`)을 호출하여 동적으로 Recharts 차트를 렌더링하도록 통합
- [x] `app/page.tsx`
  - [x] 초기 데이터 로딩 시 실제 `getHomeMetrics` 에서 받은 지표(루틴 완료 수, 연속 일수 등)를 `MetricGrid` 와 `StreakWidget` 에 전달

---

## 6. 설정 (Settings)

> **유저플로우 참조**: [userflow.mermaid.md - Section 6](./userflow.mermaid.md#6-설정-플로우-settings)

### 6.1 ST-01: 설정 메인 `MVP`

> **PRD 참조**: 3.5 설정

- [x] `app/settings/page.tsx` 생성
  - [x] 프로필 카드 (티어 뱃지, 소속 암장)
  - [x] Guest: 프로필 완성 진행바
  - [x] 앱 설정: 사운드, 다크모드
  - [x] 계정 관리: 로그아웃, 탈퇴
- [x] `components/settings/ProfileCard.tsx`
  - [x] 프로필 정보 표시
  - [x] [변경] 버튼 → 온보딩
- [x] `components/settings/AppSettings.tsx`
  - [x] 사운드 토글
  - [x] 다크모드 토글 (localStorage)
- [x] `components/settings/AccountSettings.tsx`
  - [x] Clerk 로그아웃
  - [x] 회원 탈퇴 (확인 모달)

---

## 7. 게이미피케이션 (Gamification)

> **PRD 참조**: 5. Gamification

### 7.1 티어 뱃지 시스템 `MVP`

- [ ] `components/common/TierBadge.tsx` (2.4에서 생성)
  - [ ] 6단계 티어별 디자인
  - [ ] 애니메이션 효과

### 7.2 스트릭 시스템 `MVP`

- [ ] `components/home/StreakWidget.tsx` (3.2에서 생성)
  - [ ] 연속 운동 일수 표시
  - [ ] 불꽃 아이콘 강화 애니메이션

### 7.3 New Best 알림

- [ ] 기록 갱신 감지 로직
  - [ ] 이전 최고 기록과 비교
- [ ] `components/common/Confetti.tsx`
  - [ ] Confetti 애니메이션 (framer-motion)

### 7.4 Mercy Rule 메시지

- [ ] 격려 메시지 풀 정의
- [ ] 중단/실패 시 랜덤 메시지 출력

---

## 8. 공통 컴포넌트

### 8.1 레이아웃

- [ ] `components/layout/AppLayout.tsx`
  - [ ] 반응형 컨테이너
  - [ ] 하단 네비게이션 (모바일)
- [ ] `components/layout/BottomNav.tsx`
  - [ ] 홈 / 루틴 / 플레이어 / 설정 탭

### 8.2 UI 컴포넌트

- [ ] shadcn/ui 컴포넌트 설치
  - [ ] Button, Input, Dialog, Slider
  - [ ] Tabs, Accordion, Progress
  - [ ] Toast (알림)
- [ ] `components/ui/Skeleton.tsx` (로딩 상태)

### 8.3 에러 처리

- [ ] `components/common/ErrorBoundary.tsx`
- [ ] `components/common/ErrorMessage.tsx`

---

## 9. API/Server Actions 정리

### 9.1 프로필

| 경로                  | 메서드                | 설명                    |
| --------------------- | --------------------- | ----------------------- |
| `actions/profiles.ts` | `getProfile()`        | 현재 사용자 프로필 조회 |
|                       | `updateProfile(data)` | 프로필 업데이트         |

### 9.2 암장

| 경로              | 메서드                      | 설명             |
| ----------------- | --------------------------- | ---------------- |
| `actions/gyms.ts` | `getGyms(search?)`          | 암장 목록 조회   |
|                   | `getGym(gymId)`             | 암장 상세 조회   |
|                   | `createGymWithScales(data)` | 암장 + 색상 생성 |

### 9.3 루틴

| 경로                  | 메서드                    | 설명         |
| --------------------- | ------------------------- | ------------ |
| `actions/routines.ts` | `getRoutines()`           | 내 루틴 목록 |
|                       | `getRoutine(id)`          | 루틴 상세    |
|                       | `createRoutine(data)`     | 루틴 생성    |
|                       | `updateRoutine(id, data)` | 루틴 수정    |
|                       | `deleteRoutine(id)`       | 루틴 삭제    |

### 9.4 훈련 기록

| 경로                       | 메서드                     | 설명           |
| -------------------------- | -------------------------- | -------------- |
| `actions/training-logs.ts` | `getTrainingLogs()`        | 훈련 기록 목록 |
|                            | `getTrainingStats(period)` | 통계 조회      |
|                            | `createTrainingLog(data)`  | 훈련 기록 저장 |

### 9.5 AI

| 경로            | 메서드                     | 설명         |
| --------------- | -------------------------- | ------------ |
| `actions/ai.ts` | `generateRoutine(context)` | AI 루틴 생성 |

---

## 10. Routine Analytics & Personal Metrics (New)

> **PRD 참조**: (추가 기획안) 루틴 다회차 수행 분석 및 체중 기반 볼륨 추적

### 10.1 프로필 신체 스펙 측정 및 검증 (Backend/DB)
- [ ] `users` 및 `profiles` 테이블 스키마에 `height_cm`, `reach_cm` 컬럼 추가
- [ ] `routines` 테이블에 `energy_system`, `equipment_type` 컬럼 추가
- [ ] `actions/profiles.ts` 에 체중/신장/리치 업데이트 서버 액션 추가

### 10.2 프론트엔드 프로필 Guard 및 UI
- [ ] `app/onboarding/physical-metrics` 또는 기존 단계에 신체/체중 입력 폼 추가
- [ ] 훈련 시작 시 체중(weight_kg) 미입력 유저를 판별하는 `MissingWeightModal` 컴포넌트 추가
- [ ] `WorkoutStartClient` 및 `RoutineEditor` (저장 시)에서 체중 Guard 발동

### 10.3 루틴 카테고리화 UI
- [ ] `RoutineEditor` 최상단(루틴 이름 밑)에 에너지 시스템(2x2) 선택 UI 구현
- [ ] 훈련 기구 유형(7개) 가로 스크롤(Swipeable Chips) 선택 UI 구현

### 10.4 다회차 통계 분석 (Analytics) 차트
- [ ] `actions/training-logs.ts` 에 `getRoutineAnalytics(routineId)` API 신설
- [ ] `components/workout/RoutineAnalyticsChart.tsx` (recharts 사용) 개발
- [ ] `WorkoutStartClient` 에서 [훈련 구성]과 [통계 분석] 탭 전환 구현

---

## 11. Definition of Done (MVP 완료 조건)

> **PRD 참조**: 7. Definition of Done

- [ ] **Flow**: 온보딩 '건너뛰기' 시 Guest 상태로 홈 진입 및 배너 노출
- [ ] **Gating**: Guest 상태에서 AI 기능 접근 시 설정 팝업 작동
- [ ] **Onboarding**: 홈짐 검색/등록, 티어 배정(정렬), 장비 선택 및 측정 분기
- [ ] **Builder**: 비주얼 에디터 및 중첩 세트(Nested Loop) 구현
- [ ] **Player**: 타이머 모드 + 로거 모드 동작
- [ ] **Database**: 스키마 마이그레이션 완료
- [ ] **Visuals**: 티어 뱃지, 그래프, 컨페티 애니메이션
- [ ] **Safety**: 시작 전 안전 동의 필수

---

## 11. 테스트 체크리스트

### 11.1 온보딩 플로우

- [ ] 안전 동의 필수 확인 (Skip 불가)
- [ ] Guest 모드 진입 확인
- [ ] 온보딩 완료 후 프로필 저장 확인
- [ ] 티어 배정 로직 검증

### 11.2 Gate Logic

- [ ] Guest → 루틴 빌더 접근 시 팝업
- [ ] Guest → AI Coach 접근 시 팝업
- [ ] Regular User → 전체 기능 접근 가능

### 11.3 루틴 빌더

- [ ] 드래그 앤 드롭 동작
- [ ] 중첩 세트 저장/로드
- [ ] AI 루틴 제안 → 에디터 로드

### 11.4 플레이어

- [ ] 타이머 모드: 자동 진행 + 사운드
- [ ] 로거 모드: 수동 기록
- [ ] 세션 종료 → DB 저장

### 11.5 데이터 일관성

- [ ] 프로필 업데이트 반영
- [ ] 훈련 기록 저장 확인
- [ ] 스트릭 계산 정확성

---

## 12. 배포 준비

- [ ] 환경 변수 프로덕션 설정
- [ ] RLS 정책 프로덕션 모드 확인
- [ ] Vercel 배포 설정
- [ ] 프로덕션 빌드 테스트 (`pnpm build`)
- [ ] 성능 최적화 검토

---

## 변경 이력

| 버전 | 날짜       | 변경 내용                                   |
| ---- | ---------- | ------------------------------------------- |
| v1.0 | 2026-02-03 | PRD, DB 스키마, 유저플로우 기반 TODO 재구성 |
| -    | -          | MVP 필수 항목 표시, 진행 상태 범례 추가     |
| -    | -          | 유저플로우 섹션 참조 링크 추가              |
| -    | -          | Definition of Done 섹션 통합                |
