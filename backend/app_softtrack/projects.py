from fastapi import APIRouter, Depends
from sqlmodel import Session

from lib_identity.identity import get_current_user
from lib_softtrack import projects as projects_service
from lib_softtrack.models.projects import ProjectCreate, ProjectRead
from lib_softtrack.tables import User
from web import get_session

router = APIRouter(tags=["projects"])


@router.post("/teams/{team_id}/projects", response_model=ProjectRead)
def create_project(
    team_id: int,
    payload: ProjectCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return projects_service.create_project(session, current_user, team_id, payload)


@router.get("/teams/{team_id}/projects", response_model=list[ProjectRead])
def list_projects(
    team_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return projects_service.list_projects(session, current_user, team_id)


@router.get("/projects/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return projects_service.get_project(session, current_user, project_id)
