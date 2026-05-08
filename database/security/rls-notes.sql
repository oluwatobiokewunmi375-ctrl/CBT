-- CORE-2 SECURITY DESIGN NOTES

-- All tables must include:
-- school_id for tenant isolation

-- RLS must be enabled on ALL tables
-- Policies enforce:
-- - school isolation
-- - role-based access
-- - user-level access control
