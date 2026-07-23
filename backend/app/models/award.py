from enum import Enum

class AwardType(str, Enum):
    BADGE = "badge"
    CERTIFICATE = "certificate"
    POINTS = "points"
    THANK_YOU = "thank_you"


class Award:
    pass
