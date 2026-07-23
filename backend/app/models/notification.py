from enum import Enum

class NotificationType(str, Enum):
    
    DONATION_CREATED = "donation_created"
    DONATION_CLAIMED = "donation_claimed"
    DONATION_EXPIRED = "donation_expired"
    
    
    CLAIM_APPROVED = "claim_approved"
    CLAIM_REJECTED = "claim_rejected"
    CLAIM_CANCELLED = "claim_cancelled"
    
    
    FOOD_REQUEST_CREATED = "food_request_created"
    FOOD_REQUEST_APPROVED = "food_request_approved"
    FOOD_REQUEST_REJECTED = "food_request_rejected"
    FOOD_REQUEST_FULFILLED = "food_request_fulfilled"
    FOOD_REQUEST_EXPIRED = "food_request_expired"
    
    
    VOLUNTEER_ASSIGNED = "volunteer_assigned"
    DELIVERY_STARTED = "delivery_started"
    DELIVERY_COMPLETED = "delivery_completed"
    DELIVERY_LOCATION_UPDATE = "delivery_location_update"
    
    
    ZAKAT_RECEIVED = "zakat_received"
    ZAKAT_REQUEST_CREATED = "zakat_request_created"
    ZAKAT_REQUEST_APPROVED = "zakat_request_approved"
    
    
    AWARD_RECEIVED = "award_received"
    AWARD_GIVEN = "award_given"
    
    
    POINTS_EARNED = "points_earned"
    BADGE_EARNED = "badge_earned"
    LEADERBOARD_UPDATE = "leaderboard_update"
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    RECEIPT_GENERATED = "receipt_generated"


class Notification:
    pass
