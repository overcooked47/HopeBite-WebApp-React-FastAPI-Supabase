from typing import Optional, List, Tuple
from datetime import datetime, timezone
from app.core.supabase import supabase, supabase_admin, run_query
from app.models.claim import FoodClaim, ClaimStatus
from app.models.donation import FoodDonation
from app.models.user import User
from app.schemas.claim import ClaimCreate

class ClaimService:
    def __init__(self, db=None):
        pass

    async def create(self, claim_in: ClaimCreate, claimer_id: str) -> FoodClaim:
        
        data = {
            "donation_id": claim_in.donation_id,
            "quantity_claimed": claim_in.quantity_claimed,
            "notes": claim_in.notes,
            "claimer_id": claimer_id,
            "status": ClaimStatus.PENDING.value,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        
        response = await run_query(supabase_admin.table("food_claims").insert(data))
        if response.data:
            return FoodClaim(**response.data[0])
        raise Exception("Failed to create claim")

    async def get_by_id(self, claim_id: int) -> Optional[FoodClaim]:
        
        
        
        
        
        
        
        
        query = supabase.table("food_claims").select("*, donation:food_donations(*), claimer:users!claimer_id(*)").eq("id", claim_id).single()
        response = await run_query(query)
        
        if response.data:
            data = response.data
            
            
            if data.get("donation"):
                data["donation"] = FoodDonation(**data["donation"])
            if data.get("claimer"):
                data["claimer"] = User(**data["claimer"])
                
            return FoodClaim(**data)
        return None

    async def has_user_claimed_donation(self, user_id: str, donation_id: int) -> bool:
        response = await run_query(supabase.table("food_claims").select("id", count="exact").eq("claimer_id", user_id).eq("donation_id", donation_id))
        return response.count > 0

    async def get_user_claims(self, user_id: str, status: str = None, page: int = 1, size: int = 10) -> Tuple[List[FoodClaim], int]:
        query = supabase.table("food_claims").select("*, donation:food_donations(*)", count="exact").eq("claimer_id", user_id)
        
        if status:
            query = query.eq("status", status)
            
        start = (page - 1) * size
        end = start + size - 1
        
        response = await run_query(query.range(start, end))
        
        items = []
        for item in response.data:
             if item.get("donation"):
                item["donation"] = FoodDonation(**item["donation"])
             items.append(FoodClaim(**item))
             
        return items, response.count

    async def get_pending_claims_for_donor(self, donor_id: str, page: int = 1, size: int = 10) -> Tuple[List[FoodClaim], int]:
        
        
        
        query = supabase.table("food_claims").select("*, donation:food_donations!inner(*), claimer:users!claimer_id(*)", count="exact")
        query = query.eq("donation.donor_id", donor_id).eq("status", ClaimStatus.PENDING)
        
        start = (page - 1) * size
        end = start + size - 1
        
        response = await run_query(query.range(start, end))
        
        items = []
        for item in response.data:
             if item.get("donation"):
                item["donation"] = FoodDonation(**item["donation"])
             if item.get("claimer"):
                item["claimer"] = User(**item["claimer"])
             items.append(FoodClaim(**item))
             
        return items, response.count

    async def get_claims_for_donation(self, donation_id: int, status: str = None, page: int = 1, size: int = 10) -> Tuple[List[FoodClaim], int]:
        query = supabase.table("food_claims").select("*, claimer:users!claimer_id(*)", count="exact").eq("donation_id", donation_id)
        
        if status:
            query = query.eq("status", status)
        
        start = (page - 1) * size
        end = start + size - 1
        
        response = await run_query(query.range(start, end))
        
        items = []
        for item in response.data:
             if item.get("claimer"):
                item["claimer"] = User(**item["claimer"])
             items.append(FoodClaim(**item))
             
        return items, response.count

    async def get_all_claims(self, page: int = 1, size: int = 10, status: str = None) -> Tuple[List[FoodClaim], int]:
        """Get all claims with full recipient and donation details for admin portal"""
        query = supabase.table("food_claims").select("*, donation:food_donations(*), claimer:users!claimer_id(*)", count="exact")
        
        if status:
            query = query.eq("status", status)
        
        
        query = query.order("created_at", desc=True)
        
        start = (page - 1) * size
        end = start + size - 1
        
        response = await run_query(query.range(start, end))
        
        items = []
        for item in response.data:
            if item.get("donation"):
                item["donation"] = FoodDonation(**item["donation"])
            if item.get("claimer"):
                item["claimer"] = User(**item["claimer"])
            items.append(FoodClaim(**item))
             
        return items, response.count

    async def approve(self, claim: FoodClaim) -> FoodClaim:
        update_data = {
            "status": ClaimStatus.APPROVED.value,
            "approved_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await run_query(supabase_admin.table("food_claims").update(update_data).eq("id", claim.id))
        
        return await self.get_by_id(claim.id)

    async def reject(self, claim: FoodClaim, reason: str = None) -> FoodClaim:
        update_data = {
            "status": ClaimStatus.REJECTED.value,
            "rejection_reason": reason,
        }
        
        await run_query(supabase_admin.table("food_claims").update(update_data).eq("id", claim.id))
        
        return await self.get_by_id(claim.id)

    async def confirm_pickup(self, claim: FoodClaim, rating: Optional[int] = None, feedback: Optional[str] = None) -> FoodClaim:
        update_data = {
            "status": ClaimStatus.COMPLETED.value,
            "picked_up_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await run_query(supabase_admin.table("food_claims").update(update_data).eq("id", claim.id))
        
        return await self.get_by_id(claim.id)

    async def cancel(self, claim: FoodClaim) -> FoodClaim:
        
        await run_query(supabase_admin.table("food_claims").update({"status": ClaimStatus.CANCELLED.value}).eq("id", claim.id))
        
        return await self.get_by_id(claim.id)
