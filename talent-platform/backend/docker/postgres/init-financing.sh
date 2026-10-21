#!/bin/bash
set -euo pipefail

password="${FINANCING_DB_PASSWORD:-financing}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<EOSQL
create role financing with login password '${password}' nosuperuser nocreatedb nocreaterole;
create database financing owner financing;
revoke all on database financing from public;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname financing <<EOSQL
alter schema public owner to financing;
revoke all on schema public from public;
grant usage, create on schema public to financing;
EOSQL
