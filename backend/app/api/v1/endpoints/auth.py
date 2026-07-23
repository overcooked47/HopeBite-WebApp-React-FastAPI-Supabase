from fastapi import APIRouter, status
from pydantic import BaseModel, EmailStr

router = APIRouter()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    
    return {"message": "User registered", "email": request.email, "username": request.username}
