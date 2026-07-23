from typing import Optional, List, Dict, Any, Tuple, Union
from datetime import datetime, timezone
import logging

from app.core.supabase import supabase, supabase_admin, run_query, run_auth
from app.models.user import User, UserRole, UserType
from app.schemas.user import UserCreate, UserUpdate, AdminUserUpdate

logger = logging.getLogger(__name__)

async def get_by_email(email: str) -> Optional[User]:
    try:
        response = await run_query(supabase.table("users").select("*").eq("email", email).single())
        if response.data:
            return User(**response.data)
    except Exception:
        return None
    return None

async def get_by_id(user_id: Any) -> Optional[User]: 
    try:
        response = await run_query(supabase.table("users").select("*").eq("id", user_id).single())
        if response.data:
            return User(**response.data)
    except Exception:
        return None
    return None

async def create(user_in: UserCreate) -> Tuple[User, Optional[str]]:
    """
    Create a new user via Supabase Auth and store profile in users table.
    Returns a tuple of (User, access_token) where access_token can be used 
    for immediate login without requiring email confirmation.
    
    Handles orphaned Supabase Auth users: if a previous registration attempt
    succeeded in Auth but failed in the DB insert, this function will clean up
    the orphaned auth user and retry.
    """
    
    obj_in_data = user_in.model_dump(mode="json")
    password = obj_in_data.pop("password")
    
    supabase_access_token = None
    
    
    try:
        
        auth_response = await run_auth(
            supabase.auth.sign_up,
            {
                "email": obj_in_data["email"],
                "password": password,
            }
        )
        
        if not auth_response.user:
            raise Exception("Supabase Auth registration failed")
            
        
        obj_in_data["id"] = auth_response.user.id
        
        
        if auth_response.session:
            supabase_access_token = auth_response.session.access_token
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Supabase Auth Error: {e}")
        
        # Handle orphaned auth user: email exists in Supabase Auth but not in users table
        if "already registered" in error_msg.lower() or "already been registered" in error_msg.lower():
            logger.info(f"Attempting to recover orphaned auth user for {obj_in_data['email']}")
            try:
                import httpx
                from app.core.config import settings
                
                # Use direct HTTP call to Supabase Auth admin API to find user by email
                # This avoids thread-safety issues with the supabase-py SDK under uvicorn
                headers = {
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                }
                
                async with httpx.AsyncClient() as client:
                    # List users and find the one with matching email
                    resp = await client.get(
                        f"{settings.SUPABASE_URL}/auth/v1/admin/users",
                        headers=headers,
                        params={"page": 1, "per_page": 50},
                    )
                    
                    if resp.status_code != 200:
                        logger.error(f"Admin API returned {resp.status_code}: {resp.text}")
                        raise Exception("Email is already registered. Please try logging in instead.")
                    
                    users_data = resp.json().get("users", [])
                    orphaned_user_id = None
                    for u in users_data:
                        if u.get("email") == obj_in_data["email"]:
                            orphaned_user_id = u.get("id")
                            break
                    
                    if orphaned_user_id:
                        # Update the orphaned auth user's password and reuse their ID
                        update_resp = await client.put(
                            f"{settings.SUPABASE_URL}/auth/v1/admin/users/{orphaned_user_id}",
                            headers=headers,
                            json={"password": password},
                        )
                        
                        if update_resp.status_code != 200:
                            logger.error(f"Failed to update orphaned user: {update_resp.text}")
                            raise Exception("Email is already registered. Please try logging in instead.")
                        
                        logger.info(f"Reused orphaned auth user {orphaned_user_id}, updated password")
                        obj_in_data["id"] = orphaned_user_id
                        supabase_access_token = None
                    else:
                        raise Exception("Email is already registered. Please try logging in instead.")
            except Exception as recovery_error:
                if "already registered" in str(recovery_error).lower() or "try logging in" in str(recovery_error).lower():
                    raise Exception("Email is already registered. Please try logging in instead.")
                logger.error(f"Failed to recover orphaned auth user: {recovery_error}")
                raise Exception(f"Registration failed: {str(recovery_error)}")
        else:
            raise Exception(f"Registration failed: {error_msg}")
    
    
    obj_in_data["is_active"] = True
    obj_in_data["is_verified"] = False
    obj_in_data["created_at"] = datetime.now(timezone.utc).isoformat()
    obj_in_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    obj_in_data["total_donations"] = 0
    obj_in_data["total_meals_donated"] = 0
    obj_in_data["donation_points"] = 0
    obj_in_data["total_claims"] = 0
    obj_in_data["total_deliveries"] = 0
    obj_in_data["total_zakat_donated"] = 0.0
    obj_in_data["total_zakat_received"] = 0.0
    obj_in_data["points"] = 0
    
    
    try:
        response = await run_query(supabase_admin.table("users").insert(obj_in_data))
        if response.data:
            return User(**response.data[0]), supabase_access_token
        raise Exception("Failed to create user in database")
    except Exception as db_error:
        # If DB insert fails, clean up the Supabase Auth user to prevent orphaning
        logger.error(f"DB insert failed, cleaning up auth user: {db_error}")
        try:
            if obj_in_data.get("id"):
                await run_auth(
                    supabase_admin.auth.admin.delete_user,
                    obj_in_data["id"],
                )
                logger.info(f"Cleaned up auth user {obj_in_data['id']} after DB insert failure")
        except Exception as cleanup_error:
            logger.error(f"Failed to clean up auth user: {cleanup_error}")
        raise Exception(f"Failed to create user: {str(db_error)}")

async def verify_password(user: User, password: str) -> bool:
    
    
    
    
    
    
    return True 

async def update_last_login(user: User) -> None:
    try:
        now = datetime.now(timezone.utc).isoformat()
        await run_query(supabase_admin.table("users").update({"last_login_at": now}).eq("id", user.id))
    except Exception as e:
        logger.error(f"Failed to update last login: {e}")

async def update(user: User, user_in: UserUpdate) -> User:
    update_data = user_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    response = await run_query(supabase_admin.table("users").update(update_data).eq("id", user.id))
    if response.data:
        return User(**response.data[0])
    return user

async def admin_update(user: User, user_in: AdminUserUpdate) -> User:
    update_data = user_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    response = await run_query(supabase_admin.table("users").update(update_data).eq("id", user.id))
    if response.data:
        return User(**response.data[0])
    return user

async def update_password(user: User, new_password: str) -> None:
    try:
        await run_auth(supabase.auth.admin.update_user_by_id, user.id, {"password": new_password})
    except Exception as e:
        logger.error(f"Failed to update password: {e}")
        raise e

async def authenticate(email: str, password: str) -> Optional[User]:
    try:
        logger.info(f"Attempting to authenticate user: {email}")
        auth_res = await run_auth(
            supabase.auth.sign_in_with_password,
            {
                "email": email,
                "password": password
            }
        )
        if auth_res.user:
            logger.info(f"Auth successful for user: {email}")
            return await get_by_id(auth_res.user.id)
        logger.warning(f"Auth returned no user for: {email}")
    except Exception as e:
        error_msg = str(e)
        if "getaddrinfo failed" in error_msg:
            logger.error(f"DNS resolution failed - check internet connection: {e}")
        elif "Invalid login credentials" in error_msg:
            logger.info(f"Invalid credentials for: {email}")
        else:
            logger.error(f"Auth failed for {email}: {e}")
        return None
    return None

async def deactivate(user: User) -> User:
    response = await run_query(supabase_admin.table("users").update({"is_active": False}).eq("id", user.id))
    if response.data:
        return User(**response.data[0])
    return user

async def activate(user: User) -> User:
    response = await run_query(supabase_admin.table("users").update({"is_active": True}).eq("id", user.id))
    if response.data:
        return User(**response.data[0])
    return user

async def verify_email(user: User) -> User:
    response = await run_query(supabase_admin.table("users").update({"is_verified": True}).eq("id", user.id))
    if response.data:
        return User(**response.data[0])
    return user

async def delete_user(user: User) -> None:
    try:
        await run_auth(supabase.auth.admin.delete_user, user.id) 
        
        await run_query(supabase_admin.table("users").delete().eq("id", user.id))
    except Exception as e:
        logger.error(f"Failed to delete user: {e}")
        raise e

async def verify_admin_credentials(email: str, password: str) -> bool:
    from app.core.config import settings
    return email == settings.ADMIN_EMAIL and password == settings.ADMIN_PASSWORD

async def create_admin_if_not_exists():
    from app.core.config import settings
    
    existing = await get_by_email(settings.ADMIN_EMAIL)
    
    if existing:
        if existing.role != UserRole.ADMIN:
            await run_query(supabase_admin.table("users").update({"role": UserRole.ADMIN}).eq("id", existing.id))
            existing.role = UserRole.ADMIN
        return existing
        
    admin_data = {
        "email": settings.ADMIN_EMAIL,
        "full_name": "System Admin",
        "role": UserRole.ADMIN,
        "user_type": UserType.INDIVIDUAL,
        "is_active": True,
        "is_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    response = await run_query(supabase_admin.table("users").insert(admin_data))
    if response.data:
        return User(**response.data[0])
    raise Exception("Failed to create admin user")



async def get_all_users(page: int = 1, size: int = 10, role: Optional[UserRole] = None, user_type: Optional[UserType] = None, is_active: Optional[bool] = None, search: Optional[str] = None) -> Tuple[List[User], int]:
    query = supabase.table("users").select("*", count="exact")
    
    if role:
        query = query.eq("role", role)
    if user_type:
        query = query.eq("user_type", user_type)
    if is_active is not None:
        query = query.eq("is_active", is_active)
    if search:
        query = query.ilike("email", f"%{search}%") 
        
    start = (page - 1) * size
    end = start + size - 1
    
    response = await run_query(query.range(start, end))
    
    users = [User(**u) for u in response.data]
    return users, response.count

async def get_recipients(page: int = 1, size: int = 10, search: Optional[str] = None) -> Tuple[List[User], int]:
    return await get_all_users(page, size, role=UserRole.RECIPIENT, search=search)

async def get_contributors(page: int = 1, size: int = 10) -> Tuple[List[User], int]:
    return await get_all_users(page, size, role=UserRole.CONTRIBUTOR)

async def get_volunteers(page: int = 1, size: int = 10) -> Tuple[List[User], int]:
    return await get_all_users(page, size, role=UserRole.VOLUNTEER)

async def add_points(user: User, points: int) -> None:
    
    current = await get_by_id(user.id)
    if current:
        new_points = (current.points or 0) + points
        await run_query(supabase_admin.table("users").update({"points": new_points}).eq("id", user.id))

async def increment_donation_stats(user: User, donations_count: int, meals_count: int, points: int) -> None:
    current = await get_by_id(user.id)
    if current:
        update_data = {
            "total_donations": (current.total_donations or 0) + donations_count,
            "total_meals_donated": (current.total_meals_donated or 0) + meals_count,
            "donation_points": (current.donation_points or 0) + points,
            "points": (current.points or 0) + points
        }
        await run_query(supabase_admin.table("users").update(update_data).eq("id", user.id))

async def increment_delivery_stats(user: User, count: int, points: int) -> None:
    current = await get_by_id(user.id)
    if current:
        update_data = {
            "total_deliveries": (current.total_deliveries or 0) + count,
            "points": (current.points or 0) + points
        }
        await run_query(supabase_admin.table("users").update(update_data).eq("id", user.id))

async def update_location(user: User, latitude: float, longitude: float) -> None:
    
    
    await run_query(supabase_admin.table("users").update({
        "current_location_latitude": latitude,
        "current_location_longitude": longitude,
        "last_location_update": datetime.now(timezone.utc).isoformat()
    }).eq("id", user.id))