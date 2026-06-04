-- Run in pgAdmin (Query Tool on the "postgres" database) or via psql.
-- Creates the database expected by DATABASE_URL in .env.

CREATE DATABASE purchase_dashboard
  ENCODING 'UTF8'
  TEMPLATE template0;
