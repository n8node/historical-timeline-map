from pydantic import BaseModel


class EraCount(BaseModel):
    era: str
    count: int


class StatsResponse(BaseModel):
    total_persons: int
    total_published: int
    by_era: list[EraCount]
    by_category: list[EraCount]


class EraResponse(BaseModel):
    name: str
    start_year: int
    end_year: int
    color: str
