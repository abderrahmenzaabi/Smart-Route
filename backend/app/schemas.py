"""
Pydantic schemas — request / response shapes matching the frontend types exactly.
"""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel


# ── Request ──────────────────────────────────────────────────────────────────

class RouteSearchRequest(BaseModel):
    from_lat: float
    from_lng: float
    to_lat: float
    to_lng: float
    budget: Optional[float] = 20.0          # TND
    depart_time: Optional[str] = None       # "HH:MM"
    arrival_time: Optional[str] = None      # "HH:MM"
    max_walking_m: Optional[float] = 1500   # metres


# ── Response — mirrors frontend Route / RouteSegment types ────────────────────

TransportMode = Literal["walk", "bus", "train", "taxi", "carpool"]
RouteType = Literal["fastest", "cheapest", "balanced"]
CoverageStatus = Literal["full", "origin_only", "destination_only", "none"]


class RouteSegment(BaseModel):
    mode: TransportMode
    duration: int            # minutes
    distance: int            # metres
    details: str
    # optional enrichment
    line_name: Optional[str] = None
    depart_at: Optional[str] = None  # "HH:MM"
    arrive_at: Optional[str] = None  # "HH:MM"
    from_lat: Optional[float] = None
    from_lng: Optional[float] = None
    to_lat: Optional[float] = None
    to_lng: Optional[float] = None


class Route(BaseModel):
    id: str
    type: RouteType
    totalTime: int           # minutes
    totalCost: float         # TND
    walkingDistance: int      # metres
    segments: list[RouteSegment]
    badges: list[str]


class RouteSearchResponse(BaseModel):
    routes: list[Route]
    coverage: CoverageStatus = "full"
    safety_margin_min: int = 15


# ── Stops ─────────────────────────────────────────────────────────────────────

class StopOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    type: str

    model_config = {"from_attributes": True}


# ── Carpool Offers ────────────────────────────────────────────────────────────

class CarpoolOfferCreate(BaseModel):
    author_name: str
    phone: Optional[str] = None
    from_label: str
    to_label: str
    from_lat: float
    from_lng: float
    to_lat: float
    to_lng: float
    departure_time: str              # "HH:MM"
    seats_available: int = 1
    price_per_seat: float = 0.0      # TND, 0 = free
    vehicle_desc: Optional[str] = None
    recurrence: str = "one-time"


class CarpoolOfferOut(BaseModel):
    id: int
    author_name: str
    phone: Optional[str] = None
    from_label: str
    to_label: str
    from_lat: float
    from_lng: float
    to_lat: float
    to_lng: float
    departure_time: str
    seats_available: int
    price_per_seat: float
    vehicle_desc: Optional[str] = None
    recurrence: str
    is_active: bool
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}
