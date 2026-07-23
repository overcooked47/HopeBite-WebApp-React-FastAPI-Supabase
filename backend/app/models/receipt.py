from enum import Enum

class ReceiptType(str, Enum):
    DONATION = "donation"
    ZAKAT = "zakat"


class DonationReceipt:
    pass
