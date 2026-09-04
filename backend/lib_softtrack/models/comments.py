from datetime import datetime

from pydantic import BaseModel, Field

from lib_identity.models.identity import UserPublic


class CommentCreate(BaseModel):
    body: str = Field(min_length=1)


class CommentRead(BaseModel):
    id: int
    issue_id: int
    body: str
    author: UserPublic
    created_at: datetime

    class Config:
        from_attributes = True
