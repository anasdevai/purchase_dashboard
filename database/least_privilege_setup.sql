-- Database Least-Privilege Role Setup Script
-- This script creates a restricted database user 'app_user' with only DML privileges (SELECT, INSERT, UPDATE, DELETE)
-- on the public schema. This prevents the application from executing DDL operations (e.g., DROP TABLE, ALTER TABLE) in production.
--
-- INSTRUCTIONS:
-- 1. Run this script as the superuser (e.g. 'postgres') on your target database.
-- 2. Update the connection string in your .env file to use the new user:
--    DATABASE_URL="postgresql://app_user:change_this_to_a_strong_password_in_production@localhost:5432/purchase_dashboard?schema=public"
-- Note: For Prisma migrations (prisma migrate deploy/dev), you must still use the owner/superuser account.

-- Create the restricted user (modify password as appropriate)
CREATE USER app_user WITH PASSWORD 'change_this_to_a_strong_password_in_production';

-- Grant usage on the public schema to the restricted user
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant standard DML privileges on existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Grant usage on existing sequences (required for AUTO_INCREMENT / SERIAL ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Ensure that future tables/sequences created by migrations automatically grant these privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
