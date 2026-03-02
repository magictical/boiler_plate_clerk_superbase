-- =========================================================================
-- 1. 설정 및 초기화 (Setup)
-- =========================================================================

-- UUID 생성 확장 기능 활성화 (public 스키마 혹은 extensions 스키마 명시)
create extension if not exists "uuid-ossp" with schema extensions;

-- Enum 타입 정의 (가독성 및 데이터 무결성 확보)
do $$ begin
    create type training_status as enum ('completed', 'aborted');
exception
    when duplicate_object then null;
end $$;

-- =========================================================================
-- 2. 테이블 생성 (DDL)
-- =========================================================================

-- [Table: profiles] 유저 정보 (Supabase auth.users 확장 - 원본 유지)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  nickname text,

  -- Guest 및 온보딩 데이터를 위한 필드
  weight_kg float,
  current_tier int check (current_tier between 1 and 6),
  home_gym_id uuid, -- (아래에서 FK 연결)

  -- Assessment Data (측정값)
  max_hang_1rm float,
  no_hang_lift_1rm float,

  -- Gamification
  current_streak int default 0,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- [Table: gyms] 암장 정보
create table public.gyms (
  id uuid default extensions.uuid_generate_v4() primary key,
  name text not null unique, -- 암장명 중복 방지
  is_official boolean default false, -- 공식/커뮤니티 구분
  -- 참조 FK는 아래 Relationship에서 추가
  created_by uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- [Table: users] Clerk 동기화용 테이블 (웹훅을 통해 관리)
-- 온보딩 정보, 측정값, 스트릭 모두 최신 컬럼 반영됨
create table if not exists public.users (
  id uuid default extensions.uuid_generate_v4() primary key,
  clerk_id text not null unique,
  name text,
  home_gym_id uuid references public.gyms(id) on delete set null,
  current_tier int check (current_tier between 1 and 6),
  weight_kg float,
  max_hang_1rm float,
  no_hang_lift_1rm float,
  current_streak int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- [Table: gym_grade_scales] 난이도 색상표
create table public.gym_grade_scales (
  id uuid default extensions.uuid_generate_v4() primary key,
  gym_id uuid references public.gyms(id) on delete cascade not null,

  color_name text not null, -- 예: "빨강"
  color_hex text not null,  -- 예: "#FF0000"
  tier_level int not null check (tier_level between 1 and 6), -- 매핑된 티어
  sort_order int not null default 0, -- UI 정렬 순서

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- [Table: routines] 운동 루틴 (Nested Structure 지원)
create table public.routines (
  id uuid default extensions.uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,

  title text not null default '나의 루틴',
  estimated_time int default 0, -- 예상 소요시간 (초)
  total_sets int default 0,     -- 총 세트 수

  structure_json jsonb not null default '[]'::jsonb, -- 루틴 구조 데이터

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- [Table: training_logs] 훈련 기록
create table public.training_logs (
  id uuid default extensions.uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  routine_id uuid references public.routines(id) on delete set null,

  status text check (status in ('completed', 'aborted')) not null,
  abort_reason text, -- 중단 사유

  rpe int check (rpe between 1 and 10), -- 운동 자각도
  set_results_json jsonb default '[]'::jsonb, -- 상세 결과

  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone
);

-- =========================================================================
-- 3. 관계 설정 (Foreign Keys)
-- =========================================================================

-- profiles 테이블의 home_gym_id 연결
alter table public.profiles
add constraint fk_home_gym
foreign key (home_gym_id) references public.gyms(id) on delete set null;

-- gyms 테이블의 created_by를 users로 연결
alter table public.gyms
add constraint fk_gyms_created_by
foreign key (created_by) references public.users(id) on delete set null;

-- =========================================================================
-- 4. 보안 정책 (Row Level Security)
-- =========================================================================

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.users enable row level security;
alter table public.gyms enable row level security;
alter table public.gym_grade_scales enable row level security;
alter table public.routines enable row level security;
alter table public.training_logs enable row level security;

-- [Profiles]
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- [Users]
create policy "Public users are viewable by everyone." on public.users for select using (true);
create policy "Users can update own users data." on public.users for update using (true);

-- [Gyms]
create policy "Gyms are viewable by everyone." on public.gyms for select using (true);
create policy "Authenticated users can create gyms." on public.gyms for insert with check (auth.role() = 'authenticated');

-- [Gym Scales]
create policy "Scales are viewable by everyone." on public.gym_grade_scales for select using (true);
create policy "Authenticated users can create scales." on public.gym_grade_scales for insert with check (auth.role() = 'authenticated');

-- [Routines] (Users 기반 CRUD, Service Role이 주로 사용하므로 기본 개방적 설정)
create policy "Users can CRUD own routines." on public.routines for all using (true);

-- [Logs]
create policy "Users can CRUD own logs." on public.training_logs for all using (true);

-- =========================================================================
-- 5. 자동화 트리거 (Triggers & Functions)
-- =========================================================================

-- Supabase Auth 회원가입 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, new.raw_user_meta_data->>'nickname');
  return new;
end;
$$ language plpgsql security definer;

-- 트리거 연결
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- 6. 스키마 검증 도구 (Helper Functions)
-- =========================================================================

create or replace function public.get_griplab_schema_checks()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  trigger_ok boolean;
  rls_result jsonb;
begin
  -- on_auth_user_created 트리거 존재 여부
  select exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'on_auth_user_created'
      and n.nspname = 'auth'
      and c.relname = 'users'
  ) into trigger_ok;

  -- 주요 테이블 RLS 활성화 여부
  select jsonb_object_agg(relname, relrowsecurity)
  into rls_result
  from pg_class
  where relnamespace = (select oid from pg_namespace where nspname = 'public')
    and relname in (
      'profiles', 'users', 'gyms', 'gym_grade_scales', 'routines', 'training_logs'
    );

  return jsonb_build_object(
    'trigger_on_auth_user_created', coalesce(trigger_ok, false),
    'rls', coalesce(rls_result, '{}'::jsonb)
  );
end;
$$;
