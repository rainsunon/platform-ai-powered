import asyncio
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine, Base

# Import ALL models - this is critical
from app.models.tenant import Tenant
from app.models.user import User
from app.models.bot import BotAgent
from app.models.workflow import WorkflowDefinition, WorkflowExecution
from app.models.task import HumanTask, NotificationConfig
from app.models.event import ExecutionEvent, AuditLedger, SemanticObject, PolicyViolation

async def create_tables():
    print("Creating database tables...")
    print(f"Tables to create: {list(Base.metadata.tables.keys())}")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ All tables created successfully!")
    
    # Verify tables exist
    async with engine.connect() as conn:
        for table_name in Base.metadata.tables.keys():
            try:
                result = await conn.execute(
                    f"SELECT COUNT(*) FROM {table_name}"
                )
                count = result.scalar()
                print(f"  ✓ {table_name}: {count} rows")
            except Exception as e:
                print(f"  ✗ {table_name}: {e}")

if __name__ == "__main__":
    asyncio.run(create_tables())