from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
import math


from app.core.security import get_current_user, get_current_contributor
from app.services.receipt_service import ReceiptService
from app.schemas.receipt import ReceiptCreate, ReceiptResponse, ReceiptListResponse
from app.models.user import User
from app.models.receipt import ReceiptType

router = APIRouter(tags=["Receipts"])


@router.get("/my", response_model=ReceiptListResponse)
async def get_my_receipts(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    receipt_type: Optional[ReceiptType] = None,
    current_user: User = Depends(get_current_contributor),
):
    """Get donation receipts for current user (Contributor only)."""
    receipt_service = ReceiptService()
    
    receipts, total = await receipt_service.get_user_receipts(
        user_id=current_user.id,
        page=page,
        size=size,
        receipt_type=receipt_type,
    )
    
    return ReceiptListResponse(
        items=receipts,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get a specific receipt."""
    receipt_service = ReceiptService()
    
    receipt = await receipt_service.get_by_id(receipt_id)
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    
    if receipt.donor_id != current_user.id and not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this receipt"
        )
    
    return receipt


@router.get("/number/{receipt_number}", response_model=ReceiptResponse)
async def get_receipt_by_number(
    receipt_number: str,
    current_user: User = Depends(get_current_user),
):
    """Get a receipt by its receipt number."""
    receipt_service = ReceiptService()
    
    receipt = await receipt_service.get_by_receipt_number(receipt_number)
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    
    if receipt.donor_id != current_user.id and not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this receipt"
        )
    
    return receipt
