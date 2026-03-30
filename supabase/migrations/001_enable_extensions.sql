-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pg_cron is only available on Supabase hosted instances (not local dev)
-- CREATE EXTENSION IF NOT EXISTS "pg_cron";
