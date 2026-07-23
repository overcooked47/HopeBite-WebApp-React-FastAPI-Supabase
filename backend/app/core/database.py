from typing import AsyncGenerator
async def get_db():
    """
    DEPRECATED: Direct DB Access is disabled.
    Use app.core.supabase.supabase for database operations.
    """
    raise NotImplementedError("Direct SQL connection is disabled. Use Supabase SDK.")

async def init_db() -> None:
    """No-op: Direct DB initialization disabled."""
    pass

async def close_db() -> None:
    """No-op: Direct DB connection disabled."""
    pass
