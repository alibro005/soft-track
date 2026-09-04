"""Label services."""

from sqlmodel import Session, select

from lib_softtrack.models.labels import LabelCreate
from lib_softtrack.tables import Label, User
from lib_softtrack.teams import get_team_or_404, require_team_member


def create_label(
    session: Session, current_user: User, team_id: int, payload: LabelCreate
) -> Label:
    get_team_or_404(team_id, session)
    require_team_member(team_id, current_user, session)

    label = Label(team_id=team_id, **payload.model_dump())
    session.add(label)
    session.commit()
    session.refresh(label)
    return label


def list_labels(session: Session, current_user: User, team_id: int) -> list[Label]:
    get_team_or_404(team_id, session)
    require_team_member(team_id, current_user, session)
    return session.exec(select(Label).where(Label.team_id == team_id)).all()
