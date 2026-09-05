-- Runs only on first initialisation of an empty data volume.
-- Tables are owned by EF Core migrations - do NOT add DDL for tables here.

CREATE SCHEMA IF NOT EXISTS pasta AUTHORIZATION pastalist;

ALTER ROLE pastalist SET search_path TO pasta, public;

-- Useful for future full text search on item names.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
