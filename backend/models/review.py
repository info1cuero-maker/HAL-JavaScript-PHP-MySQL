from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewBase(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str
    commentRu: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class Review(ReviewBase):
    id: str = Field(alias='_id')
    companyId: str
    userId: str
    userName: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True