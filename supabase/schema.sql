-- =======================
-- SCHOOLS (MULTI TENANT)
-- =======================
create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text default 'free',
  created_at timestamp default now()
);

-- USERS
create table users (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id),
  email text unique,
  role text check (role in ('super_admin','school_admin','student')),
  full_name text,
  created_at timestamp default now()
);

-- EXAMS
create table exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id),
  title text,
  duration int default 60,
  created_at timestamp default now()
);

-- QUESTIONS
create table questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id),
  question text,
  options jsonb,
  answer text
);

-- SUBMISSIONS
create table submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid,
  user_id uuid,
  answers jsonb,
  score int default 0,
  status text default 'submitted',
  created_at timestamp default now()
);

-- CHEAT LOGS
create table cheat_logs (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid,
  user_id uuid,
  event text,
  created_at timestamp default now()
);