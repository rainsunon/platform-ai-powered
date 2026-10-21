from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User
from app.models.tenant import Tenant
from app.core.security import get_password_hash, verify_password
from app.schemas.auth import RegisterRequest

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = self.get_user_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user
    
    def register_user(self, request: RegisterRequest) -> User:
        # Create tenant if tenant_name provided
        tenant_id = None
        if request.tenant_name:
            tenant = Tenant(
                name=request.tenant_name,
                slug=request.tenant_name.lower().replace(" ", "-")
            )
            self.db.add(tenant)
            self.db.flush()
            tenant_id = tenant.id
        
        # Create user
        user = User(
            email=request.email,
            hashed_password=get_password_hash(request.password),
            full_name=request.full_name,
            role="admin",
            tenant_id=tenant_id,
            is_active=True
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def update_refresh_token(self, user_id, refresh_token: str):
        user = self.get_user_by_id(user_id)
        if user:
            user.refresh_token = refresh_token
            self.db.commit()
    
    def validate_refresh_token(self, token: str) -> Optional[User]:
        user = self.db.query(User).filter(User.refresh_token == token).first()
        if user:
            # Rotate refresh token
            user.refresh_token = None
            self.db.commit()
            return user
        return None
    
    def invalidate_refresh_token(self, user_id):
        user = self.get_user_by_id(user_id)
        if user:
            user.refresh_token = None
            self.db.commit()
    
    def send_password_reset_email(self, email: str, background_tasks=None):
        # Placeholder for email sending
        pass
    
    def reset_password(self, token: str, new_password: str) -> bool:
        # Placeholder for password reset
        return True