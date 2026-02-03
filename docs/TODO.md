# GripLab (그립랩) - 개발 TODO 리스트

> **Version**: v1.6
> **Last Updated**: 2026-02-03
> **Status**: MVP Development
> **참조 문서**: [PRD.md](./PRD.md) | [userflow.mermaid.md](./userflow.mermaid.md) | [setup_schema.sql](../supabase/migrations/setup_schema.sql)

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

| 카테고리             | 전체    | 완료  | 진행률 |
| -------------------- | ------- | ----- | ------ |
| 1. 기본 세팅         | 10      | 4     | 40%    |
| 2. 온보딩 플로우     | 25      | 0     | 0%     |
| 3. 메인 대시보드     | 15      | 0     | 0%     |
| 4. 루틴 빌더         | 20      | 0     | 0%     |
| 5. 워크아웃 플레이어 | 18      | 0     | 0%     |
| 6. 설정              | 10      | 0     | 0%     |
| 7. 게이미피케이션    | 8       | 0     | 0%     |
| **총계**             | **106** | **0** | **0%** |

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

- [ ] `app/onboarding/safety/page.tsx` 생성
  - [ ] 경고 아이콘 & 헤드라인
  - [ ] 스크롤 가능한 약관 텍스트 박스
  - [ ] 동의 체크박스
  - [ ] [시작하기] 버튼 (체크박스 선택 시 활성화)
- [ ] 로컬 스토리지에 안전 동의 상태 저장
- [ ] 미동의 시 앱 진입 차단 로직

### 2.2 ON-01: 홈짐 선택 (Gym Selection) `MVP`

> **PRD 참조**: 3.1 [Step 1] 홈짐 선택
> **DB 테이블**: gyms, gym_grade_scales

- [ ] `app/onboarding/gym-select/page.tsx` 생성
  - [ ] [건너뛰고 둘러보기] 버튼 → Guest 모드
  - [ ] 암장 검색창
  - [ ] 암장 리스트 (공식/커뮤니티 뱃지)
  - [ ] [+ 새 암장 등록] 버튼
- [ ] `components/onboarding/GymSearchList.tsx`
  - [ ] 실시간 검색 필터링
  - [ ] is_official 뱃지 표시
- [ ] `actions/gyms.ts` Server Actions
  - [ ] `getGyms(search?: string)` - 암장 목록 조회
  - [ ] `createGym(data)` - 새 암장 생성

### 2.3 ON-02: 커스텀 암장 등록 (Create Gym)

> **DB 테이블**: gyms, gym_grade_scales
> **라이브러리**: dnd-kit (드래그 앤 드롭)

- [ ] `app/onboarding/gym-create/page.tsx` 생성
  - [ ] 암장 이름 입력
  - [ ] 색상 추가 버튼 (+)
  - [ ] 6단계 티어 박스 (Silver~Grandmaster)
  - [ ] 드래그 앤 드롭 영역
  - [ ] [저장하기] 버튼
- [ ] `components/onboarding/GymCreator.tsx`
  - [ ] 색상 추가/삭제 (ColorPicker)
  - [ ] dnd-kit 드래그 앤 드롭 구현
  - [ ] 티어 매핑 시각화
- [ ] `actions/gyms.ts` 업데이트
  - [ ] `createGymWithScales(gymData, scales[])` - 암장 + 색상 함께 저장

### 2.4 ON-03: 티어 배정 (Tier Assignment) `MVP`

> **PRD 참조**: 3.1 [Step 2] 티어 배정
> **DB 필드**: profiles.current_tier (1~6)

| 티어        | 색상 범위 | 값  |
| ----------- | --------- | --- |
| Silver      | 흰~주     | 1   |
| Gold        | 초~파     | 2   |
| Platinum    | 빨~핑     | 3   |
| Diamond     | 보라~갈   | 4   |
| Master      | 회색      | 5   |
| Grandmaster | 검정      | 6   |

- [ ] `app/onboarding/tier-assign/page.tsx` 생성
  - [ ] 색상 그리드 (sort_order 기준 정렬)
  - [ ] 안내 문구: "한 세션에 50% 이상 완등 가능한 난이도"
  - [ ] 티어 뱃지 즉시 표시 (Bounce/Fade-in)
  - [ ] [다음] 버튼
- [ ] `components/onboarding/ColorGrid.tsx`
  - [ ] 선택한 홈짐의 색상 버튼 표시
  - [ ] 선택 상태 하이라이트
- [ ] `components/common/TierBadge.tsx`
  - [ ] 6단계 뱃지 디자인
  - [ ] 애니메이션 효과

### 2.5 ON-04: 수행 능력 측정 (Assessment) `MVP`

> **PRD 참조**: 3.1 [Step 3] 수행 능력 측정
> **DB 필드**: profiles.max_hang_1rm, profiles.no_hang_lift_1rm

- [ ] `app/onboarding/assessment/page.tsx` 생성
  - [ ] Phase 1: "1RM 수치를 이미 알고 있나요?"
    - [ ] Yes → 직접 입력 폼
    - [ ] No → Phase 2 이동
  - [ ] Phase 2: 장비 선택 카드
    - [ ] 행보드 이미지 (Max Hang 측정)
    - [ ] 로딩핀/블럭 이미지 (Lift 측정)
    - [ ] 없음/모름 (체중 기반 추정)
  - [ ] Phase 3: 측정 루틴 실행 (플레이어 연동)
  - [ ] 두 종목 측정 시 5분 강제 휴식 타이머
- [ ] `components/onboarding/AssessmentForm.tsx`
  - [ ] 탭/단계 전환 UI
  - [ ] 숫자 입력 검증
  - [ ] 장비 선택 카드 UI
- [ ] `actions/profiles.ts` Server Actions
  - [ ] `updateProfile(data)` - 프로필 업데이트

---

## 3. 메인 대시보드 (Home Dashboard) `MVP`

> **유저플로우 참조**: [userflow.mermaid.md - Section 3](./userflow.mermaid.md#3-메인-홈--대시보드-home-dashboard)
> **Gate Logic**: Guest vs Regular 분기 처리

### 3.1 HM-01: Guest 홈 화면 `MVP`

> **PRD 참조**: 3.4 [Guest Mode View]

- [ ] `app/(main)/page.tsx` Guest 분기
  - [ ] 상단 Sticky 배너: "내 티어 확인하고 AI 코칭 받기"
  - [ ] 티어 영역: ? 뱃지 또는 잠금 아이콘
  - [ ] 차트 영역: Sample Data + "데이터가 필요합니다"
  - [ ] [+ 새 루틴] 클릭 시 설정 유도 팝업
- [ ] `components/home/GuestBanner.tsx`
  - [ ] 온보딩 유도 배너
  - [ ] 클릭 시 온보딩 Step 1 이동
- [ ] `components/common/GatePopup.tsx`
  - [ ] "프로필을 완성해주세요" 팝업
  - [ ] [확인] → 온보딩 / [취소] → 닫기

### 3.2 HM-02: Regular User 홈 화면 `MVP`

> **PRD 참조**: 3.4 [Regular User View]
> **DB 테이블**: profiles, training_logs

- [ ] `app/(main)/page.tsx` Regular 분기
  - [ ] 히어로 섹션: 닉네임 + 티어 뱃지
  - [ ] 스트릭 위젯: 불꽃 + 연속 일수
  - [ ] 성과 차트 (필터: 1개월/3개월/전체)
  - [ ] FAB: [+ 새 루틴 만들기]
- [ ] `components/home/HeroSection.tsx`
  - [ ] 프로필 정보 표시
  - [ ] TierBadge 통합
- [ ] `components/home/StreakWidget.tsx`
  - [ ] current_streak 표시
  - [ ] 불꽃 아이콘 애니메이션
- [ ] `components/home/StatsChart.tsx`
  - [ ] 기간 필터 (1M/3M/All)
  - [ ] 선 그래프 (Daily Max) / 막대 그래프 (볼륨)
  - [ ] recharts 또는 chart.js 사용
- [ ] `actions/training-logs.ts`
  - [ ] `getTrainingStats(userId, period)` - 통계 조회

---

## 4. 루틴 빌더 (Routine Builder) `MVP`

> **유저플로우 참조**: [userflow.mermaid.md - Section 4](./userflow.mermaid.md#4-루틴-빌더-플로우-routine-builder)
> **Gate Logic**: Guest 유저 접근 시 설정 팝업 출력 후 차단

### 4.1 RB-01: 빌더 모드 선택 `MVP`

> **PRD 참조**: 3.2 루틴 빌더 Gate Logic

- [ ] `app/routine-builder/page.tsx` 생성
  - [ ] Guest 체크 → GatePopup 출력
  - [ ] 카드 A: AI 코치 (Gemini 아이콘)
  - [ ] 카드 B: 커스텀 빌더 (설정 아이콘)
- [ ] `components/routine-builder/ModeSelectCard.tsx`
  - [ ] 모드 선택 카드 UI

### 4.2 RB-02: AI 코치 (AI Coach) `MVP`

> **PRD 참조**: 3.2 A. AI Coach
> **Context 주입**: 티어, 체중, 지난 훈련 로그

- [ ] `app/routine-builder/ai-coach/page.tsx` 생성
  - [ ] 채팅 인터페이스
  - [ ] 퀵 리플라이 칩: [컨디션 좋음], [어깨 통증], [시간 부족]
  - [ ] 루틴 제안 카드
  - [ ] [빌더로 가져오기] 버튼
- [ ] `components/routine-builder/AIChat.tsx`
  - [ ] 채팅 메시지 렌더링
  - [ ] 스크롤 처리
  - [ ] 로딩 상태
- [ ] `components/routine-builder/RoutineSuggestionCard.tsx`
  - [ ] 예상 시간, 강도 표시
  - [ ] JSON 데이터 프리뷰
- [ ] `actions/ai.ts` Server Actions
  - [ ] `generateRoutine(context)` - Gemini API 호출
  - [ ] Strict JSON Schema 검증

### 4.3 RB-03: 루틴 에디터 (Block Editor) `MVP`

> **PRD 참조**: 3.2 B. Custom Builder
> **DB 필드**: routines.structure_json (중첩 블록 지원)

- [ ] `app/routine-builder/editor/page.tsx` 생성
  - [ ] 헤더: 뒤로가기, 루틴 이름, [저장] 버튼
  - [ ] 블록 리스트 (메인 영역)
  - [ ] 하단 고정 패널 (통계 + 추가 버튼)
- [ ] `components/routine-builder/BlockList.tsx`
  - [ ] 블록 렌더링 (dnd-kit)
  - [ ] 드래그 앤 드롭 핸들
- [ ] `components/routine-builder/BlockItem.tsx`
  - [ ] 단일 블록 (운동/휴식)
  - [ ] 그룹 블록 (Nested Loop)
  - [ ] 컬러 바 (운동-파랑, 휴식-초록)
  - [ ] 삭제(X) 버튼
- [ ] `components/routine-builder/EditorFooter.tsx`
  - [ ] 통계 그리드: 운동 수, 세트, TUT, 소요시간
  - [ ] 추가 버튼: [+ 운동], [+ 세트], [+ 휴식]
  - [ ] Visual Timeline
  - [ ] [루틴 생성 완료] 버튼
- [ ] `components/routine-builder/VisualTimeline.tsx`
  - [ ] 루틴 흐름 시각화
  - [ ] 강도 막대그래프

### 4.4 RB-04: 운동 선택 모달

- [ ] `components/routine-builder/ExercisePicker.tsx`
  - [ ] 검색창
  - [ ] 카테고리 탭: 행보드 / 리프트 / 턱걸이 / 코어
  - [ ] 클릭 시 블록 추가
- [ ] `lib/data/exercises.ts`
  - [ ] 운동 데이터베이스 (JSON)
  - [ ] 카테고리별 분류

### 4.5 루틴 API/Actions

- [ ] `actions/routines.ts` Server Actions
  - [ ] `getRoutines(userId)` - 루틴 목록
  - [ ] `getRoutine(routineId)` - 루틴 상세
  - [ ] `createRoutine(data)` - 루틴 생성
  - [ ] `updateRoutine(routineId, data)` - 루틴 수정
  - [ ] `deleteRoutine(routineId)` - 루틴 삭제
  - [ ] `duplicateRoutine(routineId)` - 루틴 복제

---

## 5. 워크아웃 플레이어 (Workout Player) `MVP`

> **유저플로우 참조**: [userflow.mermaid.md - Section 5](./userflow.mermaid.md#5-훈련-플레이어-플로우-training-player)
> **DB 테이블**: training_logs

### 5.1 PL-01: 모드 선택 `MVP`

> **PRD 참조**: 3.3 듀얼 모드 플레이어

- [ ] `app/workout/[routineId]/page.tsx` 생성
  - [ ] 모드 선택 모달
  - [ ] [⏱️ 타이머 모드] (Auto)
  - [ ] [📝 로거 모드] (Manual)
- [ ] `components/workout/ModeSelectModal.tsx`
  - [ ] 모드 선택 버튼 UI

### 5.2 PL-02: 타이머 모드 (Auto) `MVP`

> **PRD 참조**: 3.3 A. 타이머 모드
> **피드백 사운드**: Start("삐-"), End("삐-삐-"), Rest End("톡...톡...")

- [ ] `app/workout/[routineId]/timer/page.tsx` 생성
  - [ ] 5초 Ready 카운트다운
  - [ ] 메인 타이머 (분:초)
  - [ ] 원형 프로그레스 바
  - [ ] 세트 정보 (무게/엣지/그립)
  - [ ] 컨트롤: [일시정지], [휴식 스킵], [중단]
- [ ] `components/workout/TimerPlayer.tsx`
  - [ ] 타이머 UI
  - [ ] 프로그레스 애니메이션
- [ ] `hooks/useWorkoutTimer.ts`
  - [ ] 타이머 로직
  - [ ] 세트 진행 관리
  - [ ] 오디오 피드백
- [ ] `lib/audio/sounds.ts`
  - [ ] 비프음 재생 함수

### 5.3 PL-03: 로거 모드 (Manual) `MVP`

> **PRD 참조**: 3.3 B. 로거 모드

- [ ] `app/workout/[routineId]/logger/page.tsx` 생성
  - [ ] 세트 리스트 (현재 세트 강조)
  - [ ] 상태 버튼: ✅ 성공 / ⚠️ 절반 / ❌ 실패
  - [ ] 우상단 [중단] 버튼
- [ ] `components/workout/LoggerPlayer.tsx`
  - [ ] 세트 리스트 UI
  - [ ] 상태 버튼 처리

### 5.4 PL-04: 세션 종료 `MVP`

> **PRD 참조**: 3.3 C. 세션 관리
> **DB 필드**: training_logs.status, rpe, abort_reason

- [ ] `app/workout/[routineId]/end/page.tsx` 생성
  - [ ] 정상 완료 시: RPE 슬라이더 (1~10)
  - [ ] 중단 시: 사유 선택 (부상, 컨디션 난조 등)
  - [ ] [기록 저장하기] 버튼
- [ ] `components/workout/SessionEnd.tsx`
  - [ ] RPE 슬라이더
  - [ ] 피드백 텍스트 동적 변경
- [ ] `components/workout/AbortReasonPicker.tsx`
  - [ ] 중단 사유 선택 UI
- [ ] `actions/training-logs.ts`
  - [ ] `createTrainingLog(data)` - 훈련 기록 저장
  - [ ] `updateStreak(userId)` - 스트릭 업데이트

---

## 6. 설정 (Settings)

> **유저플로우 참조**: [userflow.mermaid.md - Section 6](./userflow.mermaid.md#6-설정-플로우-settings)

### 6.1 ST-01: 설정 메인 `MVP`

> **PRD 참조**: 3.5 설정

- [ ] `app/settings/page.tsx` 생성
  - [ ] 프로필 카드 (티어 뱃지, 소속 암장)
  - [ ] Guest: 프로필 완성 진행바
  - [ ] 앱 설정: 사운드, 다크모드
  - [ ] 계정 관리: 로그아웃, 탈퇴
- [ ] `components/settings/ProfileCard.tsx`
  - [ ] 프로필 정보 표시
  - [ ] [변경] 버튼 → 온보딩
- [ ] `components/settings/AppSettings.tsx`
  - [ ] 사운드 토글
  - [ ] 다크모드 토글 (localStorage)
- [ ] `components/settings/AccountSettings.tsx`
  - [ ] Clerk 로그아웃
  - [ ] 회원 탈퇴 (확인 모달)

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

## 10. Definition of Done (MVP 완료 조건)

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
