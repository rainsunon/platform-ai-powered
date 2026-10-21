-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application database if not exists
SELECT 'CREATE DATABASE automation_suite'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'automation_suite')\gexec

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE automation_suite TO automation;