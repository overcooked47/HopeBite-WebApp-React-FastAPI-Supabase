from typing import List, Tuple, Optional
from datetime import datetime, timezone
import logging
from app.core.supabase import supabase, supabase_admin, run_query
from app.models.notification import NotificationType

logger = logging.getLogger(__name__)


class Notification:
    """Notification model for Supabase data"""
    def __init__(self, **kwargs):
        self.id = kwargs.get('id')
        self.user_id = kwargs.get('user_id')
        self.type = kwargs.get('type')
        self.title = kwargs.get('title')
        self.message = kwargs.get('message')
        self.related_type = kwargs.get('related_type')
        self.related_id = kwargs.get('related_id')
        self.action_url = kwargs.get('action_url')
        self.is_read = kwargs.get('is_read', False)
        self.is_urgent = kwargs.get('is_urgent', False)
        self.created_at = kwargs.get('created_at')
        self.read_at = kwargs.get('read_at')


class NotificationService:
    def __init__(self, db=None):
        pass

    async def create_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        related_type: Optional[str] = None,
        related_id: Optional[int] = None,
        action_url: Optional[str] = None,
        is_urgent: bool = False
    ) -> Optional[Notification]:
        """Create a new notification for a user"""
        try:
            data = {
                "user_id": user_id,
                "type": notification_type.value if hasattr(notification_type, 'value') else str(notification_type),
                "title": title,
                "message": message,
                "related_type": related_type,
                "related_id": related_id,
                "action_url": action_url,
                "is_read": False,
                "is_urgent": is_urgent,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            
            
            response = await run_query(supabase_admin.table("notifications").insert(data))
            if response.data:
                logger.info(f"Created notification for user {user_id}: {title}")
                return Notification(**response.data[0])
            return None
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return None

    async def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        page: int = 1,
        size: int = 10
    ) -> Tuple[List[Notification], int, int]:
        """Get notifications for a user with pagination"""
        try:
            
            query = supabase.table("notifications").select("*", count="exact").eq("user_id", user_id)
            
            if unread_only:
                query = query.eq("is_read", False)
            
            
            query = query.order("created_at", desc=True)
            
            
            start = (page - 1) * size
            end = start + size - 1
            query = query.range(start, end)
            
            response = await run_query(query)
            
            notifications = [Notification(**item) for item in response.data] if response.data else []
            total = response.count or 0
            
            
            unread_query = supabase.table("notifications").select("id", count="exact").eq("user_id", user_id).eq("is_read", False)
            unread_response = await run_query(unread_query)
            unread_count = unread_response.count or 0
            
            return notifications, total, unread_count
        except Exception as e:
            logger.error(f"Error getting notifications for user {user_id}: {e}")
            return [], 0, 0

    async def get_by_id(self, notification_id: int) -> Optional[Notification]:
        """Get a notification by ID"""
        try:
            response = await run_query(
                supabase.table("notifications").select("*").eq("id", notification_id).single()
            )
            if response.data:
                return Notification(**response.data)
            return None
        except Exception as e:
            logger.error(f"Error getting notification {notification_id}: {e}")
            return None

    async def mark_as_read(self, notification) -> Optional[Notification]:
        """Mark a notification as read"""
        try:
            notification_id = notification.id if hasattr(notification, 'id') else notification
            response = await run_query(
                supabase_admin.table("notifications")
                .update({"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()})
                .eq("id", notification_id)
            )
            if response.data:
                return Notification(**response.data[0])
            return None
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return None

    async def mark_multiple_as_read(self, notification_ids: List[int], user_id: str) -> int:
        """Mark multiple notifications as read"""
        try:
            count = 0
            for nid in notification_ids:
                response = await run_query(
                    supabase_admin.table("notifications")
                    .update({"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()})
                    .eq("id", nid)
                    .eq("user_id", user_id)
                )
                if response.data:
                    count += 1
            return count
        except Exception as e:
            logger.error(f"Error marking multiple notifications as read: {e}")
            return 0

    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        try:
            response = await run_query(
                supabase_admin.table("notifications")
                .update({"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()})
                .eq("user_id", user_id)
                .eq("is_read", False)
            )
            return len(response.data) if response.data else 0
        except Exception as e:
            logger.error(f"Error marking all notifications as read for user {user_id}: {e}")
            return 0

    async def delete(self, notification) -> bool:
        """Delete a notification"""
        try:
            notification_id = notification.id if hasattr(notification, 'id') else notification
            await run_query(
                supabase_admin.table("notifications").delete().eq("id", notification_id)
            )
            return True
        except Exception as e:
            logger.error(f"Error deleting notification: {e}")
            return False

    
    async def notify_donation_claimed(
        self,
        donor_id: str,
        donation_title: str,
        claimer_name: str,
        claim_id: int
    ):
        """Notify donor that their donation was claimed"""
        await self.create_notification(
            user_id=donor_id,
            notification_type=NotificationType.DONATION_CLAIMED,
            title="Donation Claimed!",
            message=f"{claimer_name} has requested your donation: {donation_title}",
            related_type="claim",
            related_id=claim_id,
            action_url=f"/claims/{claim_id}",
        )

    async def notify_admins_food_requested(
        self,
        donation_title: str,
        requester_name: str,
        claim_id: int
    ):
        """Notify all admins about a food request"""
        try:
            
            response = await run_query(
                supabase.table("users").select("id").eq("role", "admin")
            )
            
            if response.data:
                for admin in response.data:
                    await self.create_notification(
                        user_id=admin["id"],
                        notification_type=NotificationType.FOOD_REQUEST_CREATED,
                        title="New Food Request",
                        message=f"{requester_name} has requested: {donation_title}",
                        related_type="claim",
                        related_id=claim_id,
                        action_url=f"/claims/{claim_id}",
                    )
                logger.info(f"Notified {len(response.data)} admins about food request")
        except Exception as e:
            logger.error(f"Error notifying admins: {e}")

    async def notify_contributors_food_requested(
        self,
        donation_title: str,
        requester_name: str,
        claim_id: int,
        donor_id: str
    ):
        """Notify the specific contributor (donor) about a food request"""
        await self.create_notification(
            user_id=donor_id,
            notification_type=NotificationType.DONATION_CLAIMED,
            title="Your Food Was Requested!",
            message=f"{requester_name} wants to claim your donation: {donation_title}",
            related_type="claim",
            related_id=claim_id,
            action_url=f"/claims/{claim_id}",
            is_urgent=True
        )

    async def notify_claim_approved(
        self,
        claimer_id: str,
        donation_title: str,
        claim_id: int
    ):
        """Notify claimer that their claim was approved"""
        await self.create_notification(
            user_id=claimer_id,
            notification_type=NotificationType.CLAIM_APPROVED,
            title="Claim Approved!",
            message=f"Your request for {donation_title} has been approved!",
            related_type="claim",
            related_id=claim_id,
            action_url=f"/claims/{claim_id}",
        )

    async def notify_food_request_approved(
        self,
        recipient_id: str,
        donation_title: str,
        claim_id: int
    ):
        """Notify recipient that their food request was approved by admin"""
        await self.create_notification(
            user_id=recipient_id,
            notification_type=NotificationType.CLAIM_APPROVED,
            title="Your food request was approved.",
            message=f"Your food request for {donation_title} has been approved. You can now collect your food.",
            related_type="claim",
            related_id=claim_id,
            action_url=f"/dashboard/my-requests",
        )

    async def notify_claim_rejected(
        self,
        claimer_id: str,
        donation_title: str,
        claim_id: int
    ):
        """Notify claimer that their claim was rejected"""
        await self.create_notification(
            user_id=claimer_id,
            notification_type=NotificationType.CLAIM_REJECTED,
            title="Request Declined",
            message=f"Your request for {donation_title} was not approved. Please try other available food.",
            related_type="claim",
            related_id=claim_id,
            action_url=f"/find-food",
        )

    async def notify_delivery_assigned(
        self,
        volunteer_id: str,
        donation_title: str,
        delivery_id: int
    ):
        """Notify volunteer about new delivery assignment"""
        await self.create_notification(
            user_id=volunteer_id,
            notification_type=NotificationType.VOLUNTEER_ASSIGNED,
            title="New Delivery Assignment",
            message=f"You have been assigned to deliver: {donation_title}",
            related_type="delivery",
            related_id=delivery_id,
            action_url=f"/volunteer/deliveries/{delivery_id}",
        )
