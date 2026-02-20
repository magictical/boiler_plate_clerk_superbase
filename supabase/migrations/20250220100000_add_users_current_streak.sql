-- Add current_streak to users for Regular Home streak display (PRD 6.1)
alter table public.users
add column if not exists current_streak int default 0;
