"""
FastAPI dependencies for authentication.
"""

from fastapi import Header, HTTPException
from typing import Optional
from openserv.auth import verify_privy_token


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    FastAPI dependency that extracts and verifies the Privy JWT from the
    Authorization header. Returns decoded user claims.
    
    Usage:
        @app.post("/protected")
        async def endpoint(user: dict = Depends(get_current_user)):
            privy_user_id = user["sub"]
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format. Expected 'Bearer <token>'")
    
    token = authorization.removeprefix("Bearer ").strip()
    
    if not token:
        raise HTTPException(status_code=401, detail="Empty token")
    

    try:
        claims = verify_privy_token(token)
        return claims
    except ValueError as e:
        print(f"[Auth Error] {e}")
        raise HTTPException(status_code=401, detail=str(e))


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Same as get_current_user but returns None instead of raising 401 
    if no auth header is present. Use for endpoints that work with
    or without authentication.
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
