-- ============================================================
-- 수동 적용용: Supabase 대시보드 SQL Editor에 붙여 넣어 실행하세요.
-- 오류 "could not find the 'max_hang_1rm' or 'current_streak' column of 'users'" 해결.
-- (Clerk 연동을 위해 profiles 테이블을 무시하고 public.users 를 메인으로 사용하기 위한 조치)
-- ============================================================

-- users 테이블에 기초 신체/측정 데이터 및 스트릭(연속 훈련일수) 저장용 컬럼 추가
alter table public.users
add column if not exists weight_kg float,
add column if not exists max_hang_1rm float,
add column if not exists no_hang_lift_1rm float,
add column if not exists current_streak int default 0;
