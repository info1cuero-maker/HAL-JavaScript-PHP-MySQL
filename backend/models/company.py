from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Location(BaseModel):
    city: str
    address: str
    coordinates: Optional[dict] = None

class Contacts(BaseModel):
    phone: str
    email: str
    website: Optional[str] = None

class CompanyBase(BaseModel):
    name: str
    nameRu: str
    description: str
    descriptionRu: str
    category: str
    location: Location
    contacts: Contacts
    image: str
    images: Optional[List[str]] = []
    isNew: bool = False
    isActive: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    nameRu: Optional[str] = None
    description: Optional[str] = None
    descriptionRu: Optional[str] = None
    category: Optional[str] = None
    location: Optional[Location] = None
    contacts: Optional[Contacts] = None
    image: Optional[str] = None
    images: Optional[List[str]] = None
    isNew: Optional[bool] = None
    isActive: Optional[bool] = None

class Company(CompanyBase):
    id: str = Field(alias='_id')
    rating: float = 0.0
    reviewCount: int = 0
    userId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "name": "Кондитерська Merry",
                "nameRu": "Кондитерская Merry",
                "description": "Найсмачніші торти",
                "descriptionRu": "Самые вкусные торты",
                "category": "cafe",
                "location": {
                    "city": "Kyiv",
                    "address": "вул. Хрещатик, 1"
                },
                "contacts": {
                    "phone": "+380441234567",
                    "email": "info@merry.ua"
                },
                "image": "https://example.com/image.jpg",
                "rating": 4.8,
                "reviewCount": 45,
                "isNew": True,
                "isActive": True,
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z"
            }
        }