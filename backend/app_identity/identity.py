from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from lib_identity.identity import get_current_user, login_user, register_user
from lib_identity.models.identity import Token, UserCreate, UserPublic
from lib_softtrack.tables import User
from web import get_session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(payload: UserCreate, session: Session = Depends(get_session)):
    return register_user(
        session=session,
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
    )


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    return login_user(
        session=session, email=form_data.username, password=form_data.password
    )


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return current_user
