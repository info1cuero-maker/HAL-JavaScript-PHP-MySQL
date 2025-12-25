from pydantic import BaseModel
from datetime import datetime

class CompanyView(BaseModel):
    companyId: str
    userId: str = None  # Optional, для незарегистрированных
    ipAddress: str = None
    userAgent: str = None
    viewedAt: datetime = datetime.utcnow()

class CompanyStats(BaseModel):
    companyId: str
    totalViews: int = 0
    uniqueViews: int = 0
    totalReviews: int = 0
    averageRating: float = 0.0
    viewsThisWeek: int = 0
    viewsThisMonth: int = 0
    lastViewedAt: datetime = None
