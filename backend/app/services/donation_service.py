from typing import Optional, List, Any, Tuple
from datetime import datetime, timezone
import logging
from app.core.supabase import supabase, supabase_admin, run_query
from app.models.donation import FoodDonation, DonationStatus, FoodCategory
from app.schemas.donation import DonationCreate, DonationUpdate, DonationFilter

logger = logging.getLogger(__name__)

class DonationService:
    def __init__(self, db=None):
        pass

    async def create(self, donation_in: DonationCreate, donor_id: str) -> FoodDonation:
        data = donation_in.model_dump(mode="json")
        data["donor_id"] = donor_id
        data["status"] = DonationStatus.AVAILABLE.value  
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        
        if data.get("category"):
            data["category"] = data["category"].value if hasattr(data["category"], 'value') else data["category"]
        
        
        if data.get("pickup_time_start"):
            data["pickup_time_start"] = data["pickup_time_start"].isoformat()
        if data.get("pickup_time_end"):
            data["pickup_time_end"] = data["pickup_time_end"].isoformat()
        if data.get("expiry_date"):
            data["expiry_date"] = data["expiry_date"].isoformat()

        logger.info(f"Inserting donation data: {data}")
        
        response = await run_query(supabase_admin.table("food_donations").insert(data))
        if response.data:
            logger.info(f"Donation inserted successfully: {response.data[0]}")
            return FoodDonation(**response.data[0])
        raise Exception("Failed to create donation")

    async def get_by_id(self, donation_id: int) -> Optional[FoodDonation]:
        response = await run_query(supabase.table("food_donations").select("*").eq("id", donation_id).single())
        if response.data:
            return FoodDonation(**response.data)
        return None

    async def get_list(self, filters: DonationFilter, page: int = 1, size: int = 10) -> Tuple[List[FoodDonation], int]:
        query = supabase.table("food_donations").select("*", count="exact")
        
        if filters.category:
            query = query.eq("category", filters.category)
        if filters.city:
            query = query.ilike("city", f"%{filters.city}%")
        if filters.status:
            query = query.eq("status", filters.status)
        if filters.is_vegetarian is not None:
            query = query.eq("is_vegetarian", filters.is_vegetarian)
        if filters.search:
            query = query.ilike("title", f"%{filters.search}%")

        start = (page - 1) * size
        end = start + size - 1
        
        response = await run_query(query.range(start, end))
        donations = [FoodDonation(**item) for item in response.data]
        return donations, response.count

    async def get_available_donations(self, city: str = None, category: str = None, page: int = 1, size: int = 10) -> Tuple[List[FoodDonation], int]:
        query = supabase.table("food_donations").select("*", count="exact").eq("status", DonationStatus.AVAILABLE)
        
        if city:
            query = query.ilike("city", f"%{city}%")
        if category:
            query = query.eq("category", category)
            
        start = (page - 1) * size
        end = start + size - 1
        
        response = await run_query(query.range(start, end))
        donations = [FoodDonation(**item) for item in response.data]
        return donations, response.count

    async def get_user_donations(self, user_id: str, status: str = None, page: int = 1, size: int = 10) -> Tuple[List[FoodDonation], int]:
        query = supabase.table("food_donations").select("*", count="exact").eq("donor_id", user_id)
        
        if status:
            query = query.eq("status", status)
            
        start = (page - 1) * size
        end = start + size - 1
        
        response = await run_query(query.range(start, end))
        donations = [FoodDonation(**item) for item in response.data]
        return donations, response.count

    async def update(self, donation: FoodDonation, donation_in: DonationUpdate) -> FoodDonation:
        update_data = donation_in.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        
        for k, v in update_data.items():
            if isinstance(v, datetime):
                update_data[k] = v.isoformat()

        response = await run_query(supabase_admin.table("food_donations").update(update_data).eq("id", donation.id))
        if response.data:
            return FoodDonation(**response.data[0])
        return donation

    async def delete(self, donation: FoodDonation) ->  bool:
        await run_query(supabase_admin.table("food_donations").delete().eq("id", donation.id))
        return True

    async def update_status(self, donation: FoodDonation, status: DonationStatus) -> FoodDonation:
        response = await run_query(supabase_admin.table("food_donations").update({"status": status.value}).eq("id", donation.id))
        if response.data:
            return FoodDonation(**response.data[0])
        return donation
    
    async def notify_admins_and_recipients_donation_created(self, donation: FoodDonation, donor_name: str):
        
        pass
        
    async def get_donation_stats(self, user_id: str):
        
        return {}
