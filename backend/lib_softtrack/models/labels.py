from pydantic import BaseModel


class LabelCreate(BaseModel):
    name: str
    color: str = "#94a3b8"


class LabelRead(BaseModel):
    id: int
    team_id: int
    name: str
    color: str

    class Config:
        from_attributes = True
