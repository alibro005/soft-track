from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from lib_identity.models.identity import UserPublic
from lib_softtrack.models.labels import LabelRead
from lib_softtrack.tables import IssuePriority, IssueStatus


class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    status: IssueStatus = IssueStatus.backlog
    priority: IssuePriority = IssuePriority.no_priority
    assignee_id: Optional[int] = None
    label_ids: list[int] = []


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[int] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assignee_id: Optional[int] = None
    label_ids: Optional[list[int]] = None


class IssueRead(BaseModel):
    id: int
    team_id: int
    project_id: Optional[int] = None
    number: int
    identifier: str
    title: str
    description: Optional[str] = None
    status: IssueStatus
    priority: IssuePriority
    assignee: Optional[UserPublic] = None
    creator: UserPublic
    labels: list[LabelRead] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
