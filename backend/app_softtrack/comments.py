from fastapi import APIRouter, Depends
from sqlmodel import Session

from lib_identity.identity import get_current_user
from lib_softtrack import comments as comments_service
from lib_softtrack.models.comments import CommentCreate, CommentRead
from lib_softtrack.tables import User
from web import get_session

router = APIRouter(tags=["comments"])


@router.post("/issues/{issue_id}/comments", response_model=CommentRead)
def create_comment(
    issue_id: int,
    payload: CommentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return comments_service.create_comment(session, current_user, issue_id, payload)


@router.get("/issues/{issue_id}/comments", response_model=list[CommentRead])
def list_comments(
    issue_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return comments_service.list_comments(session, current_user, issue_id)
