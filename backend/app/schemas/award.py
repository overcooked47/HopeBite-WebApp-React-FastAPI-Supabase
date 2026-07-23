from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.award import AwardType


class AwardCreate(BaseModel):
    receiver_id: str  
    award_type: AwardType = AwardType.THANK_YOU
    title: str = Field(..., min_length=2, max_length=255)
    message: Optional[str] = None
    points: int = Field(default=0, ge=0)
    related_type: Optional[str] = None  
    related_id: Optional[int] = None
    is_public: bool = True


class AwardResponse(BaseModel):
    id: int
    giver_id: str  
    receiver_id: str  
    award_type: AwardType
    title: str
    message: Optional[str]
    points: int
    related_type: Optional[str]
    related_id: Optional[int]
    is_public: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class AwardListResponse(BaseModel):
    items: List[AwardResponse]
    total: int
    page: int
    size: int
    pages: int
