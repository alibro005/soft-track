from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from lib_identity.models.identity import UserPublic
from lib_softtrack.tables import TeamRole


class TeamCreate(BaseModel):
    name: str
    key: str = Field(min_length=2, max_length=6, description="Short prefix, e.g. ENG")
    description: Optional[str] = None


class TeamRead(BaseModel):
    id: int
    name: str
    key: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TeamMemberAdd(BaseModel):
    email: EmailStr
    role: TeamRole = TeamRole.member


class TeamMemberRead(BaseModel):
    user: UserPublic
    role: TeamRole
