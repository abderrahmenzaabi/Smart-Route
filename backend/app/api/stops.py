"""
GET /api/stops — list all stops in the database.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import StopOut

router = APIRouter(prefix="/api/stops", tags=["stops"])


@router.get("", response_model=list[StopOut])
def get_stops(db: Session = Depends(get_db)):
    """Return all transit stops (bus + train)."""
    return db.query(models.Stop).all()
