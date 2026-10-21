from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth import (
    Token,
    RegisterRequest,
    TokenRefresh,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(request: Request, db: Session = Depends(get_db)):
    """Register a new user account."""
    try:
        body = await request.json()
        logger.info(f"Register request body: {body}")
        
        # Handle camelCase from frontend
        if 'fullName' in body:
            body['full_name'] = body.pop('fullName')
        if 'tenantName' in body:
            body['tenant_name'] = body.pop('tenantName')
        
        register_request = RegisterRequest(**body)
        
        auth_service = AuthService(db)
        
        if auth_service.get_user_by_email(register_request.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        user = auth_service.register_user(register_request)
        
        token_data = {
            "sub": str(user.id),
            "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            "role": user.role
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        auth_service.update_refresh_token(user.id, refresh_token)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        )
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise

@router.post("/login", response_model=Token)
async def login(request: Request, db: Session = Depends(get_db)):
    """Login with email and password."""
    try:
        content_type = request.headers.get("content-type", "")
        logger.info(f"Login content-type: {content_type}")
        
        if "application/x-www-form-urlencoded" in content_type:
            form_data = await request.form()
            email = form_data.get("username")
            password = form_data.get("password")
        else:
            body = await request.json()
            logger.info(f"Login body: {body}")
            email = body.get("email")
            password = body.get("password")
        
        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required"
            )
        
        auth_service = AuthService(db)
        user = auth_service.authenticate_user(email, password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user account"
            )
        
        from datetime import datetime
        user.last_login_at = datetime.utcnow()
        db.commit()
        
        token_data = {
            "sub": str(user.id),
            "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            "role": user.role
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        auth_service.update_refresh_token(user.id, refresh_token)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post("/refresh", response_model=Token)
async def refresh(request: Request, db: Session = Depends(get_db)):
    """Refresh access token."""
    body = await request.json()
    
    # Handle camelCase
    if 'refreshToken' in body:
        body['refresh_token'] = body.pop('refreshToken')
    
    token_refresh = TokenRefresh(**body)
    
    auth_service = AuthService(db)
    user = auth_service.validate_refresh_token(token_refresh.refresh_token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    token_data = {
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
        "role": user.role
    }
    
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    
    auth_service.update_refresh_token(user.id, new_refresh_token)
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user info."""
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(UUID(current_user["user_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout."""
    auth_service = AuthService(db)
    auth_service.invalidate_refresh_token(UUID(current_user["user_id"]))
    return {"message": "Successfully logged out"}