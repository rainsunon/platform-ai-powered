"""initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Enable extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS timescaledb')
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    
    # Create tenants table
    op.create_table(
        'tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), unique=True, nullable=False),
        sa.Column('plan', sa.String(50), nullable=False, server_default='free'),
        sa.Column('settings', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', sa.Enum('admin', 'analyst', 'operator', 'auditor', name='user_role'), nullable=False, server_default='operator'),
        sa.Column('avatar_url', sa.Text()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('last_login_at', sa.DateTime(timezone=True)),
        sa.Column('refresh_token', sa.Text()),
        sa.Column('password_reset_token', sa.Text()),
        sa.Column('password_reset_expires', sa.DateTime(timezone=True)),
        sa.Column('password_changed_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create bot_agents table
    op.create_table(
        'bot_agents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.Enum('web', 'desktop', 'api', 'ai_agent', name='bot_type'), nullable=False),
        sa.Column('status', sa.Enum('idle', 'running', 'error', 'offline', 'maintenance', name='bot_status'), nullable=False, server_default='idle'),
        sa.Column('capabilities', postgresql.JSONB, nullable=False, server_default='[]'),
        sa.Column('configuration', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('metrics', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('last_heartbeat_at', sa.DateTime(timezone=True)),
        sa.Column('api_key_hash', sa.String(255)),
        sa.Column('version', sa.String(50)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create indexes
    op.create_index('idx_users_tenant', 'users', ['tenant_id'])
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_bot_agents_tenant', 'bot_agents', ['tenant_id', 'status'])

def downgrade():
    op.drop_table('bot_agents')
    op.drop_table('users')
    op.drop_table('tenants')
    op.execute('DROP TYPE IF EXISTS user_role')
    op.execute('DROP TYPE IF EXISTS bot_type')
    op.execute('DROP TYPE IF EXISTS bot_status')