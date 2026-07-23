from enum import Enum

class ZakatRecipientType(str, Enum):
    INDIVIDUAL = "individual"
    ORGANIZATION = "organization"
    MOSQUE = "mosque"
    HOPEBITE = "hopebite"

class ZakatStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    DISTRIBUTED = "distributed"
    REJECTED = "rejected"


class ZakatDonation:
    pass

class ZakatRequest:
    pass
