"""
Carpool offers CRUD — /api/carpools
Users can publish ride-share offers for free (e.g. "I have a car with a free seat from Sousse to Monastir").
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import CarpoolOfferCreate, CarpoolOfferOut

router = APIRouter(prefix="/api/carpools", tags=["carpools"])


@router.get("", response_model=list[CarpoolOfferOut])
def list_carpools(
    active_only: bool = True,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    """List carpool offers. Optionally filter by active status and search term."""
    q = db.query(models.CarpoolOffer)

    if active_only:
        q = q.filter(models.CarpoolOffer.is_active == True)

    if search:
        term = f"%{search.lower()}%"
        q = q.filter(
            (models.CarpoolOffer.from_label.ilike(term))
            | (models.CarpoolOffer.to_label.ilike(term))
            | (models.CarpoolOffer.author_name.ilike(term))
        )

    return q.order_by(models.CarpoolOffer.id.desc()).all()


@router.post("", response_model=CarpoolOfferOut, status_code=201)
def create_carpool(offer: CarpoolOfferCreate, db: Session = Depends(get_db)):
    """Create a new carpool offer. Free feature — no login required."""
    db_offer = models.CarpoolOffer(
        author_name=offer.author_name,
        phone=offer.phone,
        from_label=offer.from_label,
        to_label=offer.to_label,
        from_lat=offer.from_lat,
        from_lng=offer.from_lng,
        to_lat=offer.to_lat,
        to_lng=offer.to_lng,
        departure_time=offer.departure_time,
        seats_available=offer.seats_available,
        price_per_seat=offer.price_per_seat,
        vehicle_desc=offer.vehicle_desc,
        recurrence=offer.recurrence,
        is_active=True,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    return db_offer


@router.delete("/{offer_id}", status_code=204)
def delete_carpool(offer_id: int, db: Session = Depends(get_db)):
    """Deactivate a carpool offer (soft delete)."""
    offer = db.query(models.CarpoolOffer).filter(models.CarpoolOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Carpool offer not found")
    offer.is_active = False
    db.commit()


@router.get("/{offer_id}", response_model=CarpoolOfferOut)
def get_carpool(offer_id: int, db: Session = Depends(get_db)):
    """Get a single carpool offer by ID."""
    offer = db.query(models.CarpoolOffer).filter(models.CarpoolOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Carpool offer not found")
    return offer
