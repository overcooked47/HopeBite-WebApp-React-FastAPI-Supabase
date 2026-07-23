
import asyncio
from typing import Any, TypeVar
from supabase import create_client, Client
from app.core.config import settings

T = TypeVar("T")

def get_supabase_client() -> Client:
    """
    Initialize and return a Supabase Client.
    Uses credentials from settings (loaded from env).
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("Supabase URL and Anon Key must be set in environment variables.")
    
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

def get_supabase_admin_client() -> Client:
    """
    Initialize and return a Supabase Client with service role key.
    This bypasses Row Level Security (RLS) for admin operations.
    """
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    return create_client(settings.SUPABASE_URL, key)

supabase: Client = get_supabase_client()
supabase_admin: Client = get_supabase_admin_client()

async def run_query(query_builder: Any) -> Any:
    """
    Execute a Supabase query asynchronously using a thread pool.
    This prevents blocking the main event loop.
    """
    return await asyncio.to_thread(query_builder.execute)

async def run_auth(func: Any, *args, **kwargs) -> Any:
    """
    Execute a Supabase Auth function asynchronously using a thread pool.
    """
    return await asyncio.to_thread(func, *args, **kwargs)
