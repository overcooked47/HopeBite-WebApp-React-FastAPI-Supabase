from enum import Enum

class DeliveryStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VolunteerDelivery:
    pass

class VolunteerLocationLog:
    pass
