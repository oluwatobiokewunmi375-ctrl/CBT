-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default search path
ALTER DATABASE cbt_production SET search_path TO "$user", public;

-- Create indices for common queries (additional to Prisma)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_created ON "School"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_school_email ON "User"("schoolId", "email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_school_status ON "Exam"("schoolId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_exam_student ON "Submission"("examId", "studentId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_exam_student ON "Result"("examId", "studentId");

-- Set session timeout
ALTER DATABASE cbt_production SET idle_in_transaction_session_timeout = '5min';