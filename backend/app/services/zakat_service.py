from typing import Optional, List, Tuple, Any
from datetime import datetime, timezone
import logging

from app.core.supabase import supabase, supabase_admin, run_query
from app.schemas.zakat import ZakatDonationCreate, ZakatRequestCreate
from app.models.zakat import ZakatStatus

logger = logging.getLogger(__name__)


class ZakatDonation:
    """Simple data class for zakat donations"""
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class ZakatRequest:
    """Simple data class for zakat requests"""
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class ZakatService:
    
    async def create(self, donation_data: ZakatDonationCreate, donor_id: str) -> ZakatDonation:
        """Create a new zakat donation"""
        now = datetime.now(timezone.utc).isoformat()
        data = {
            "donor_id": donor_id,
            "amount": donation_data.amount,
            "currency": donation_data.currency,
            "recipient_type": donation_data.recipient_type.value if hasattr(donation_data.recipient_type, 'value') else donation_data.recipient_type,
            "recipient_id": donation_data.recipient_id,
            "recipient_name": donation_data.recipient_name,
            "recipient_description": donation_data.recipient_description,
            "food_request_id": donation_data.food_request_id,
            "transaction_id": donation_data.transaction_id,
            "payment_method": donation_data.payment_method,
            "notes": donation_data.notes,
            "status": ZakatStatus.PENDING.value,
            "is_verified": False,
            "donated_at": now,
            "created_at": now,
        }
        
        
        response = await run_query(supabase_admin.table("zakat_donations").insert(data))
        if response.data:
            return ZakatDonation(**response.data[0])
        raise Exception("Failed to create zakat donation")
    
    async def get_by_id(self, donation_id: int) -> Optional[ZakatDonation]:
        """Get a zakat donation by ID"""
        try:
            response = await run_query(
                supabase.table("zakat_donations").select("*").eq("id", donation_id).single()
            )
            if response.data:
                return ZakatDonation(**response.data)
        except Exception:
            pass
        return None
    
    async def get_user_donations(self, user_id: str, page: int = 1, size: int = 10) -> Tuple[List[ZakatDonation], int, float]:
        """Get donations made by user (as donor) with pagination"""
        offset = (page - 1) * size
        
        
        count_response = await run_query(
            supabase.table("zakat_donations").select("id", count="exact").eq("donor_id", user_id)
        )
        total = count_response.count or 0
        
        
        amount_response = await run_query(
            supabase.table("zakat_donations").select("amount").eq("donor_id", user_id)
        )
        total_amount = sum(d.get("amount", 0) for d in (amount_response.data or []))
        
        
        response = await run_query(
            supabase.table("zakat_donations")
            .select("*")
            .eq("donor_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + size - 1)
        )
        
        donations = [ZakatDonation(**d) for d in (response.data or [])]
        return donations, total, total_amount
    
    async def get_received_donations(self, recipient_id: str, page: int = 1, size: int = 10) -> Tuple[List[ZakatDonation], int, float]:
        """Get donations received by user (as recipient) with pagination"""
        offset = (page - 1) * size
        
        
        count_response = await run_query(
            supabase.table("zakat_donations").select("id", count="exact").eq("recipient_id", recipient_id)
        )
        total = count_response.count or 0
        
        
        amount_response = await run_query(
            supabase.table("zakat_donations").select("amount").eq("recipient_id", recipient_id)
        )
        total_amount = sum(d.get("amount", 0) for d in (amount_response.data or []))
        
        
        response = await run_query(
            supabase.table("zakat_donations")
            .select("*")
            .eq("recipient_id", recipient_id)
            .order("created_at", desc=True)
            .range(offset, offset + size - 1)
        )
        
        donations = [ZakatDonation(**d) for d in (response.data or [])]
        return donations, total, total_amount
    
    async def get_user_stats(self, user_id: str) -> dict:
        """Get user's zakat donation statistics"""
        response = await run_query(
            supabase.table("zakat_donations").select("amount,status").eq("donor_id", user_id)
        )
        
        donations = response.data or []
        total_amount = sum(d.get("amount", 0) for d in donations)
        distributed = sum(d.get("amount", 0) for d in donations if d.get("status") == "distributed")
        
        return {
            "total_donations": len(donations),
            "total_amount": total_amount,
            "currency": "BDT",
            "total_distributed": distributed,
            "pending_amount": total_amount - distributed,
        }
    
    async def get_platform_stats(self) -> dict:
        """Get platform-wide zakat statistics"""
        response = await run_query(
            supabase.table("zakat_donations").select("amount,status")
        )
        
        donations = response.data or []
        total_amount = sum(d.get("amount", 0) for d in donations)
        distributed = sum(d.get("amount", 0) for d in donations if d.get("status") == "distributed")
        
        return {
            "total_donations": len(donations),
            "total_amount": total_amount,
            "currency": "BDT",
            "total_distributed": distributed,
            "pending_amount": total_amount - distributed,
        }
    
    async def delete(self, donation: ZakatDonation) -> None:
        """Delete a zakat donation"""
        await run_query(
            supabase_admin.table("zakat_donations").delete().eq("id", donation.id)
        )
    
    
    async def create_zakat_request(self, request_data: ZakatRequestCreate, requester_id: str) -> ZakatRequest:
        """Create a new zakat request"""
        now = datetime.now(timezone.utc).isoformat()
        data = {
            "requester_id": requester_id,
            "title": request_data.title,
            "description": request_data.description,
            "amount_needed": request_data.amount_needed,
            "amount_received": 0.0,
            "currency": request_data.currency,
            "purpose": request_data.purpose,
            "beneficiaries_count": request_data.beneficiaries_count,
            "status": ZakatStatus.PENDING.value,
            "is_verified": False,
            "supporting_documents": None,
            "created_at": now,
            "updated_at": now,
            "fulfilled_at": None,
        }
        
        
        response = await run_query(supabase_admin.table("zakat_requests").insert(data))
        if response.data:
            return ZakatRequest(**response.data[0])
        raise Exception("Failed to create zakat request")
    
    async def get_zakat_request_by_id(self, request_id: int) -> Optional[ZakatRequest]:
        """Get a zakat request by ID"""
        try:
            response = await run_query(
                supabase.table("zakat_requests").select("*").eq("id", request_id).single()
            )
            if response.data:
                return ZakatRequest(**response.data)
        except Exception:
            pass
        return None
    
    async def notify_admins_and_contributors_zakat_request(self, zakat_request: ZakatRequest, requester_name: str) -> None:
        """Send notifications to admins and contributors about new zakat request"""
        
        logger.info(f"New zakat request from {requester_name}: {zakat_request.title}")

    async def get_zakat_applicants(self, page: int = 1, size: int = 50) -> list:
        """Get list of zakat applicants (recipients who have pending/verified zakat requests)"""
        import app.services.user_service as user_service
        
        offset = (page - 1) * size
        
        
        response = await run_query(
            supabase.table("zakat_requests")
            .select("requester_id, title, amount_needed, status, created_at")
            .in_("status", ["pending", "verified"])
            .order("created_at", desc=True)
            .range(offset, offset + size - 1)
        )
        
        requests = response.data or []
        applicants = []
        
        
        seen_ids = set()
        for req in requests:
            requester_id = req.get("requester_id")
            if requester_id and requester_id not in seen_ids:
                seen_ids.add(requester_id)
                user = await user_service.get_by_id(requester_id)
                if user:
                    applicants.append({
                        "id": requester_id,
                        "full_name": user.full_name or "Zakat Applicant",
                        "email": user.email,
                        "organization_name": getattr(user, 'organization_name', None),
                        "request_title": req.get("title"),
                        "amount_needed": req.get("amount_needed"),
                        "status": req.get("status"),
                    })
        
        return applicants

    async def get_all_zakat_requests(self, page: int = 1, size: int = 10, status: str = None) -> Tuple[List[dict], int, float, float]:
        """Get all zakat requests with requester info for admin portal"""
        import app.services.user_service as user_service
        
        offset = (page - 1) * size
        
        
        query = supabase.table("zakat_requests").select("*", count="exact")
        
        if status:
            query = query.eq("status", status)
        
        query = query.order("created_at", desc=True).range(offset, offset + size - 1)
        response = await run_query(query)
        
        requests_data = response.data or []
        total = response.count or 0
        
        
        all_amounts_response = await run_query(
            supabase.table("zakat_requests").select("amount_needed, amount_received")
        )
        all_data = all_amounts_response.data or []
        total_amount_needed = sum(r.get("amount_needed", 0) for r in all_data)
        total_amount_received = sum(r.get("amount_received", 0) for r in all_data)
        
        
        enriched_requests = []
        for req in requests_data:
            requester_id = req.get("requester_id")
            requester = None
            if requester_id:
                user = await user_service.get_by_id(requester_id)
                if user:
                    requester = {
                        "id": user.id,
                        "email": user.email,
                        "full_name": user.full_name,
                        "organization_name": getattr(user, 'organization_name', None),
                        "user_type": user.user_type.value if hasattr(user.user_type, 'value') else user.user_type,
                    }
            
            enriched_requests.append({
                **req,
                "requester": requester,
            })
        
        return enriched_requests, total, total_amount_needed, total_amount_received

    async def get_zakat_request_with_requester(self, request_id: int) -> Optional[dict]:
        """Get a single zakat request with requester details"""
        import app.services.user_service as user_service
        
        try:
            response = await run_query(
                supabase.table("zakat_requests").select("*").eq("id", request_id).single()
            )
            if not response.data:
                return None
            
            req = response.data
            requester_id = req.get("requester_id")
            requester = None
            if requester_id:
                user = await user_service.get_by_id(requester_id)
                if user:
                    requester = {
                        "id": user.id,
                        "email": user.email,
                        "full_name": user.full_name,
                        "organization_name": getattr(user, 'organization_name', None),
                        "user_type": user.user_type.value if hasattr(user.user_type, 'value') else user.user_type,
                    }
            
            return {**req, "requester": requester}
        except Exception:
            return None

    async def approve_zakat_request(self, request_id: int) -> Optional[dict]:
        """Approve a zakat request - makes it visible to contributors"""
        now = datetime.now(timezone.utc).isoformat()
        
        
        await run_query(
            supabase_admin.table("zakat_requests")
            .update({"status": ZakatStatus.VERIFIED.value, "is_verified": True, "updated_at": now})
            .eq("id", request_id)
        )
        
        return await self.get_zakat_request_with_requester(request_id)

    async def reject_zakat_request(self, request_id: int, reason: str = None) -> Optional[dict]:
        """Reject a zakat request"""
        now = datetime.now(timezone.utc).isoformat()
        
        
        await run_query(
            supabase_admin.table("zakat_requests")
            .update({"status": ZakatStatus.REJECTED.value, "updated_at": now})
            .eq("id", request_id)
        )
        
        return await self.get_zakat_request_with_requester(request_id)

    async def get_approved_zakat_requests(self, page: int = 1, size: int = 50) -> Tuple[List[dict], int]:
        """Get approved (verified) zakat requests for contributors to see"""
        import app.services.user_service as user_service
        
        offset = (page - 1) * size
        
        
        response = await run_query(
            supabase.table("zakat_requests")
            .select("*", count="exact")
            .eq("status", ZakatStatus.VERIFIED.value)
            .order("created_at", desc=True)
            .range(offset, offset + size - 1)
        )
        
        requests_data = response.data or []
        total = response.count or 0
        
        
        enriched_requests = []
        for req in requests_data:
            requester_id = req.get("requester_id")
            requester = None
            if requester_id:
                user = await user_service.get_by_id(requester_id)
                if user:
                    requester = {
                        "id": user.id,
                        "email": user.email,
                        "full_name": user.full_name,
                        "organization_name": getattr(user, 'organization_name', None),
                        "user_type": user.user_type.value if hasattr(user.user_type, 'value') else user.user_type,
                    }
            
            enriched_requests.append({
                **req,
                "requester": requester,
            })
        
        return enriched_requests, total
