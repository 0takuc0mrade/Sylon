"""
Privy JWT token verification for FastAPI.
Validates access tokens issued by Privy using their JWKS endpoint.
"""

import os
import jwt
import requests
import ssl
from functools import lru_cache
from dotenv import load_dotenv

# macOS python SSL patch
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

load_dotenv()

PRIVY_APP_ID = os.environ.get("PRIVY_APP_ID", os.environ.get("NEXT_PUBLIC_PRIVY_APP_ID", ""))
PRIVY_JWKS_URL = f"https://auth.privy.io/api/v1/apps/{PRIVY_APP_ID}/jwks.json" if PRIVY_APP_ID else "https://auth.privy.io/.well-known/jwks.json"

_jwks_client = jwt.PyJWKClient(PRIVY_JWKS_URL, cache_keys=True)


def verify_privy_token(token: str) -> dict:
    """
    Verify a Privy access token and return decoded claims.
    
    Returns dict with at minimum:
      - sub: Privy user ID (e.g., "did:privy:xxxxx")
      - iss: "privy.io"
      - aud: the app ID
    
    Raises jwt.exceptions.* on invalid tokens.
    """
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=PRIVY_APP_ID,
            issuer="privy.io",
            leeway=60,  # Tolerate up to 60 seconds of clock skew
        )
        return decoded
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidAudienceError:
        raise ValueError("Token audience mismatch")
    except jwt.InvalidIssuerError:
        raise ValueError("Token issuer mismatch")
    except Exception as e:
        raise ValueError(f"Token verification failed: {e}")
