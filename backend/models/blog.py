from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BlogPostBase(BaseModel):
    titleUk: str
    titleRu: str
    contentUk: str
    contentRu: str
    excerptUk: str
    excerptRu: str
    image: str
    author: str = "HAL Team"

class BlogPostCreate(BlogPostBase):
    pass

class BlogPost(BlogPostBase):
    id: str = Field(alias='_id')
    publishedAt: datetime
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True