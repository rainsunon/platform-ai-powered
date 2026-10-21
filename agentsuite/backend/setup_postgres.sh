#!/bin/bash

echo "Completely resetting PostgreSQL setup..."

# Step 1: Terminate all connections to bot_suite
sudo -u postgres psql -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'bot_suite' AND pid <> pg_backend_pid();"

# Step 2: Drop the database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS bot_suite;"

# Step 3: Drop the user (if exists)
sudo -u postgres psql -c "DROP USER IF EXISTS anuu;"

# Step 4: Create the user
sudo -u postgres psql -c "CREATE USER anuu WITH PASSWORD 'password' CREATEDB;"

# Step 5: Create the database WITH ANUU AS OWNER
sudo -u postgres psql -c "CREATE DATABASE bot_suite OWNER anuu;"

# Step 6: Connect as anuu and create schema
psql -U anuu -d bot_suite -c "CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION anuu;"

# Step 7: Grant all permissions
psql -U anuu -d bot_suite << 'EOF'
GRANT ALL ON SCHEMA public TO anuu;
GRANT ALL PRIVILEGES ON DATABASE bot_suite TO anuu;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anuu;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anuu;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anuu;
EOF

echo "Done! Now test the connection..."