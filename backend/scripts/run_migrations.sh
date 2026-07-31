#!/usr/bin/env bash
set -e
# run from project root
echo "Running SQL migrations..."
psql "$PG_CONN" -f internal/models/migrations/001_create_tables.sql
psql "$PG_CONN" -f internal/models/migrations/002_seed_admin.sql
echo "Done."