from typing import Optional, List, Tuple
from datetime import datetime, timezone
from app.core.supabase import supabase, run_query
from app.models.receipt import ReceiptType
from app.schemas.receipt import ReceiptResponse
import logging
import uuid

logger = logging.getLogger(__name__)


class ReceiptService:
    def __init__(self, db=None):
        pass

    def _generate_receipt_number(self, receipt_type: str, donation_id: int) -> str:
        """Generate a unique receipt number"""
        prefix = "ZKT" if receipt_type == "zakat" else "DON"
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
        return f"{prefix}-{timestamp}-{donation_id:06d}"

    async def get_user_receipts(
        self,
        user_id: str,
        page: int = 1,
        size: int = 10,
        receipt_type: Optional[ReceiptType] = None
    ) -> Tuple[List[ReceiptResponse], int]:
        """Get receipts for a user by fetching their zakat donations and converting to receipts"""
        try:
            receipts = []
            
            
            query = supabase.table("zakat_donations").select(
                "id, donor_id, recipient_id, amount, status, message, created_at, recipient:users!recipient_id(full_name, organization_name, user_type)"
            ).eq("donor_id", user_id).order("created_at", desc=True)
            
            if receipt_type and receipt_type != ReceiptType.ZAKAT:
                
                pass
            else:
                zakat_response = await run_query(query)
                
                if zakat_response.data:
                    for donation in zakat_response.data:
                        recipient = donation.get("recipient", {}) or {}
                        recipient_name = recipient.get("organization_name") or recipient.get("full_name") or "Anonymous Recipient"
                        recipient_type = recipient.get("user_type", "individual")
                        
                        receipt = ReceiptResponse(
                            id=donation["id"],
                            receipt_number=self._generate_receipt_number("zakat", donation["id"]),
                            donor_id=donation["donor_id"],
                            receipt_type=ReceiptType.ZAKAT,
                            donation_id=None,
                            zakat_donation_id=donation["id"],
                            description=f"Zakat donation to {recipient_name}",
                            amount=float(donation["amount"]),
                            currency="BDT",
                            food_items=None,
                            quantity=None,
                            quantity_unit=None,
                            recipient_name=recipient_name,
                            recipient_type=recipient_type,
                            issuer_name="HopeBite Platform",
                            issuer_address="Dhaka, Bangladesh",
                            is_verified=donation["status"] == "completed",
                            verified_at=datetime.fromisoformat(donation["created_at"].replace("Z", "+00:00")) if donation.get("created_at") else None,
                            receipt_pdf_url=None,
                            donation_date=datetime.fromisoformat(donation["created_at"].replace("Z", "+00:00")) if donation.get("created_at") else datetime.now(timezone.utc),
                            created_at=datetime.fromisoformat(donation["created_at"].replace("Z", "+00:00")) if donation.get("created_at") else datetime.now(timezone.utc),
                        )
                        receipts.append(receipt)
            
            
            
            total = len(receipts)
            start = (page - 1) * size
            end = start + size
            paginated_receipts = receipts[start:end]
            
            logger.info(f"Found {total} receipts for user {user_id}")
            return paginated_receipts, total
            
        except Exception as e:
            logger.error(f"Error fetching receipts: {e}", exc_info=True)
            return [], 0

    async def get_by_id(self, receipt_id: int) -> Optional[ReceiptResponse]:
        """Get a specific receipt by ID (from zakat_donations)"""
        try:
            response = await run_query(
                supabase.table("zakat_donations")
                .select("id, donor_id, recipient_id, amount, status, message, created_at, recipient:users!recipient_id(full_name, organization_name, user_type)")
                .eq("id", receipt_id)
                .single()
            )
            
            if response.data:
                donation = response.data
                recipient = donation.get("recipient", {}) or {}
                recipient_name = recipient.get("organization_name") or recipient.get("full_name") or "Anonymous Recipient"
                recipient_type = recipient.get("user_type", "individual")
                
                return ReceiptResponse(
                    id=donation["id"],
                    receipt_number=self._generate_receipt_number("zakat", donation["id"]),
                    donor_id=donation["donor_id"],
                    receipt_type=ReceiptType.ZAKAT,
                    donation_id=None,
                    zakat_donation_id=donation["id"],
                    description=f"Zakat donation to {recipient_name}",
                    amount=float(donation["amount"]),
                    currency="BDT",
                    food_items=None,
                    quantity=None,
                    quantity_unit=None,
                    recipient_name=recipient_name,
                    recipient_type=recipient_type,
                    issuer_name="HopeBite Platform",
                    issuer_address="Dhaka, Bangladesh",
                    is_verified=donation["status"] == "completed",
                    verified_at=datetime.fromisoformat(donation["created_at"].replace("Z", "+00:00")) if donation.get("created_at") else None,
                    receipt_pdf_url=None,
                    donation_date=datetime.fromisoformat(donation["created_at"].replace("Z", "+00:00")) if donation.get("created_at") else datetime.now(timezone.utc),
                    created_at=datetime.fromisoformat(donation["created_at"].replace("Z", "+00:00")) if donation.get("created_at") else datetime.now(timezone.utc),
                )
            return None
        except Exception as e:
            logger.error(f"Error fetching receipt by ID: {e}")
            return None

    async def get_by_receipt_number(self, receipt_number: str) -> Optional[ReceiptResponse]:
        """Get a receipt by its number"""
        
        try:
            parts = receipt_number.split("-")
            if len(parts) >= 3:
                donation_id = int(parts[-1])
                return await self.get_by_id(donation_id)
        except (ValueError, IndexError):
            pass
        return None
