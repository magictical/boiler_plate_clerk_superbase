-- Add new columns for routine analytics and personal metrics

-- 1. Profiles & Users: Add height_cm and reach_cm
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS height_cm FLOAT,
ADD COLUMN IF NOT EXISTS reach_cm FLOAT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS height_cm FLOAT,
ADD COLUMN IF NOT EXISTS reach_cm FLOAT;

-- 2. Routines: Add energy_system and equipment_type
ALTER TABLE public.routines
ADD COLUMN IF NOT EXISTS energy_system TEXT,
ADD COLUMN IF NOT EXISTS equipment_type TEXT;
