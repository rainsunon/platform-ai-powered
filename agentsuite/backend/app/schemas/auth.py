from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from .user import UserResponse

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    full_name: str = Field(min_length=1, max_length=255)
    tenant_name: Optional[str] = Field(None, max_length=255)
    
    # Allow camelCase from frontend
    @field_validator('full_name', mode='before')
    @classmethod
    def validate_full_name(cls, v):
        return v
    
    class Config:
        # This allows extra fields and maps camelCase to snake_case
        extra = "allow"
        populate_by_name = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenRefresh(BaseModel):
    refresh_token: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=100)