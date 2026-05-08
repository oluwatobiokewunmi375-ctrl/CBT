-- ============================================
-- PHASE 12 SAAS EXTENSION (NON-DESTRUCTIVE)
-- ============================================

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid,
  amount int,
  status text,
  reference text,
  created_at timestamp default now()
);

alter table schools add column if not exists owner_id uuid;
alter table schools add column if not exists onboarding_complete boolean default false;
