from pydantic import BaseModel, EmailStr

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    message: str