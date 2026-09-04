"""Project services."""

from fastapi import HTTPException
from sqlmodel import Session, select

from lib_softtrack.models.projects import ProjectCreate
from lib_softtrack.tables import Project, User
from lib_softtrack.teams import get_team_or_404, require_team_member


def create_project(
    session: Session, current_user: User, team_id: int, payload: ProjectCreate
) -> Project:
    get_team_or_404(team_id, session)
    require_team_member(team_id, current_user, session)

    project = Project(team_id=team_id, **payload.model_dump())
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def list_projects(session: Session, current_user: User, team_id: int) -> list[Project]:
    get_team_or_404(team_id, session)
    require_team_member(team_id, current_user, session)
    return session.exec(select(Project).where(Project.team_id == team_id)).all()


def get_project(session: Session, current_user: User, project_id: int) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    require_team_member(project.team_id, current_user, session)
    return project
