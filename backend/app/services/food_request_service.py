from typing import Optional, List, Tuple
from datetime import datetime, timezone
from app.core.supabase import supabase, supabase_admin, run_query
from app.models.food_request import FoodRequest, FoodRequestStatus
from app.models.user import User, UserRole
from app.models.notification import NotificationType
from app.schemas.food_request import FoodRequestCreate, FoodRequestUpdate
import logging

logger = logging.getLogger(__name__)

class FoodRequestService:
    def __init__(self, db=None):
        pass

    async def create(self, request_in: FoodRequestCreate, requester_id: str) -> FoodRequest:
        import json
        
        # Build insert data explicitly with only known DB columns
        data = {
            "requester_id": requester_id,
            "title": request_in.title,
            "description": request_in.description,
            "quantity_needed": request_in.quantity_needed,
            "unit": request_in.unit or "servings",
            "delivery_address": request_in.delivery_address,
            "city": request_in.city,
            "state": request_in.state,
            "country": request_in.country,
            "postal_code": request_in.postal_code,
            "latitude": request_in.latitude,
            "longitude": request_in.longitude,
            "urgency": request_in.urgency.value if hasattr(request_in.urgency, 'value') else str(request_in.urgency),
            "beneficiaries_count": request_in.beneficiaries_count,
            "requires_vegetarian": request_in.requires_vegetarian,
            "requires_vegan": request_in.requires_vegan,
            "requires_halal": request_in.requires_halal,
            "requires_gluten_free": request_in.requires_gluten_free,
            "status": FoodRequestStatus.PENDING.value,
            "quantity_fulfilled": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        # Handle optional category field
        if request_in.category:
            data["category"] = request_in.category.value if hasattr(request_in.category, 'value') else str(request_in.category)
        
        # Handle optional needed_by field
        if request_in.needed_by:
            data["needed_by"] = request_in.needed_by.isoformat() if hasattr(request_in.needed_by, 'isoformat') else str(request_in.needed_by)
        
        # Convert images list to JSON string for the text column
        if request_in.images and isinstance(request_in.images, list):
            data["images"] = json.dumps(request_in.images)

        logger.info(f"Inserting food request data: {data}")
        
        try:
            response = await run_query(supabase_admin.table("food_requests").insert(data))
            if response.data:
                return FoodRequest(**response.data[0])
            raise Exception("Failed to create food request - no data returned")
        except Exception as e:
            logger.error(f"Supabase insert error: {str(e)}")
            raise

    async def get_by_id(self, request_id: int) -> Optional[FoodRequest]:
        query = supabase.table("food_requests").select("*, requester:requester_id(id, email, full_name, role, user_type)").eq("id", request_id).single()
        response = await run_query(query)
        
        if response.data:
            return FoodRequest(**response.data)
        return None

    async def get_user_requests(self, user_id: str, status: str = None, page: int = 1, size: int = 10) -> Tuple[List[FoodRequest], int]:
        query = supabase.table("food_requests").select("*, requester:requester_id(id, email, full_name, role, user_type)", count="exact").eq("requester_id", user_id)
        
        if status:
            query = query.eq("status", status)
            
        start = (page - 1) * size
        end = start + size - 1
        
        response = await run_query(query.range(start, end))
        items = [FoodRequest(**item) for item in response.data]
        return items, response.count

    async def get_all_requests(self, page: int = 1, size: int = 10, status: str = None, city: str = None, urgency: str = None) -> Tuple[List[FoodRequest], int]:
        
        query = supabase.table("food_requests").select("*, requester:requester_id(id, email, full_name, role, user_type)", count="exact")
        
        if status:
            query = query.eq("status", status)
        if city:
            query = query.ilike("city", f"%{city}%")
        if urgency:
            query = query.eq("urgency", urgency)
            
        start = (page - 1) * size
        end = start + size - 1
        
        response = await run_query(query.range(start, end))
        items = [FoodRequest(**item) for item in response.data]
        return items, response.count

    async def get_pending_requests(self, page: int = 1, size: int = 10, city: str = None) -> Tuple[List[FoodRequest], int]:
        return await self.get_all_requests(page, size, status=FoodRequestStatus.PENDING, city=city)

    async def update(self, request: FoodRequest, request_in: FoodRequestUpdate) -> FoodRequest:
        update_data = request_in.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        
        for k, v in update_data.items():
            if isinstance(v, datetime):
                update_data[k] = v.isoformat()

        response = await run_query(supabase_admin.table("food_requests").update(update_data).eq("id", request.id))
        if response.data:
            return FoodRequest(**response.data[0])
        return request

    async def delete(self, request: FoodRequest) -> bool:
        await run_query(supabase_admin.table("food_requests").delete().eq("id", request.id))
        return True

    async def update_status(self, request: FoodRequest, status: FoodRequestStatus) -> FoodRequest:
        status_value = status.value if hasattr(status, 'value') else str(status)
        logger.info(f"Updating request {request.id} status to {status_value}")
        response = await run_query(supabase_admin.table("food_requests").update({"status": status_value}).eq("id", request.id))
        if response.data:
            logger.info(f"Update successful, response: {response.data[0]}")
            return FoodRequest(**response.data[0])
        logger.warning(f"Update returned no data for request {request.id}")
        return request

    async def notify_requester_submitted(self, request: FoodRequest):
        """Notify the requester that their food request was submitted"""
        from app.services.notification_service import NotificationService
        
        notification_service = NotificationService()
        
        try:
            await notification_service.create_notification(
                user_id=request.requester_id,
                notification_type=NotificationType.FOOD_REQUEST_CREATED,
                title="Food Request Submitted",
                message=f"Your food request '{request.title}' has been submitted successfully. Contributors and admins have been notified.",
                related_type="food_request",
                related_id=request.id,
                action_url="/recipient/request",
                is_urgent=False
            )
            logger.info(f"Notified requester {request.requester_id} that request {request.id} was submitted")
        except Exception as e:
            logger.error(f"Error notifying requester about submission: {e}")

    async def notify_admins_and_contributors(self, request: FoodRequest, requester_name: str):
        """Send notification to admins and contributors about new food request"""
        from app.services.notification_service import NotificationService
        
        notification_service = NotificationService()
        
        try:
            
            response = await run_query(
                supabase.table("users")
                .select("id, role")
                .in_("role", ["admin", "contributor"])
            )
            
            if response.data:
                for user in response.data:
                    await notification_service.create_notification(
                        user_id=user["id"],
                        notification_type=NotificationType.FOOD_REQUEST_CREATED,
                        title="New Food Request",
                        message=f"{requester_name} has requested food: {request.title}",
                        related_type="food_request",
                        related_id=request.id,
                        action_url="/dashboard/custom-requests",
                        is_urgent=request.urgency.value == "high" if hasattr(request.urgency, 'value') else request.urgency == "high"
                    )
                logger.info(f"Notified {len(response.data)} admins/contributors about food request {request.id}")
        except Exception as e:
            logger.error(f"Error notifying admins/contributors: {e}")

    async def notify_requester_approved(self, request: FoodRequest, contributor_name: str):
        """Notify the requester that their food request was approved"""
        from app.services.notification_service import NotificationService
        
        notification_service = NotificationService()
        
        logger.info(f"notify_requester_approved called for request {request.id}, requester_id: {request.requester_id}")
        
        try:
            result = await notification_service.create_notification(
                user_id=request.requester_id,
                notification_type=NotificationType.FOOD_REQUEST_APPROVED,
                title="Food Request Approved!",
                message=f"Great news! Your food request '{request.title}' has been approved by a contributor.",
                related_type="food_request",
                related_id=request.id,
                action_url="/recipient/my-requests",
                is_urgent=False
            )
            if result:
                logger.info(f"Successfully created approval notification for requester {request.requester_id}, request {request.id}")
            else:
                logger.warning(f"Failed to create approval notification for requester {request.requester_id}")
        except Exception as e:
            logger.error(f"Error notifying requester about approval: {e}", exc_info=True)

    async def notify_requester_rejected(self, request: FoodRequest, contributor_name: str):
        """Notify the requester that their food request was declined"""
        from app.services.notification_service import NotificationService
        
        notification_service = NotificationService()
        
        logger.info(f"notify_requester_rejected called for request {request.id}, requester_id: {request.requester_id}")
        
        try:
            result = await notification_service.create_notification(
                user_id=request.requester_id,
                notification_type=NotificationType.FOOD_REQUEST_REJECTED,
                title="Food Request Declined",
                message=f"Unfortunately, your food request '{request.title}' has been declined. Please try posting another request or contact support.",
                related_type="food_request",
                related_id=request.id,
                action_url="/recipient/my-requests",
                is_urgent=False
            )
            if result:
                logger.info(f"Successfully created rejection notification for requester {request.requester_id}")
            else:
                logger.warning(f"Failed to create rejection notification for requester {request.requester_id}")
        except Exception as e:
            logger.error(f"Error notifying requester about rejection: {e}", exc_info=True)