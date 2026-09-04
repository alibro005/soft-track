from fastapi import APIRouter, Depends
from sqlmodel import Session

from lib_identity.identity import get_current_user
from lib_softtrack import teams as teams_service
from lib_softtrack.models.teams import (
    TeamCreate,
    TeamMemberAdd,
    TeamMemberRead,
    TeamRead,
)
from lib_softtrack.tables import User
from web import get_session

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamRead)
def create_team(
    payload: TeamCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return teams_service.create_team(session, current_user, payload)


@router.get("", response_model=list[TeamRead])
def list_my_teams(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return teams_service.list_teams_for_user(session, current_user)


@router.get("/{team_id}", response_model=TeamRead)
def get_team(
    team_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return teams_service.get_team(session, current_user, team_id)


@router.get("/{team_id}/members", response_model=list[TeamMemberRead])
def list_team_members(
    team_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return teams_service.list_team_members(session, current_user, team_id)


@router.post("/{team_id}/members", response_model=TeamMemberRead)
def add_team_member(
    team_id: int,
    payload: TeamMemberAdd,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return teams_service.add_team_member(session, current_user, team_id, payload)
