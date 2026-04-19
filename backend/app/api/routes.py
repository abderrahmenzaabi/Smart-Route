"""
POST /api/routes — main routing endpoint.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.router import TransitGraph, RouteFinder
from app.schemas import RouteSearchRequest, RouteSearchResponse

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.post("", response_model=RouteSearchResponse)
def find_routes(req: RouteSearchRequest, db: Session = Depends(get_db)):
    """
    Find the best multi-modal routes between two coordinates.
    Returns up to 3+ routes: fastest, cheapest, balanced, and matching carpools.
    Enforces:
      - 15-minute safety margin on arrival deadline
      - Hard budget cap
      - Transit coverage check
    """
    # Default depart time to 08:00 if not given
    if req.depart_time:
        h, m = req.depart_time.split(":")
        depart_min = int(h) * 60 + int(m)
    else:
        depart_min = 8 * 60  # 08:00

    # Parse arrival deadline (if given)
    arrival_deadline_min = None
    if req.arrival_time:
        h, m = req.arrival_time.split(":")
        arrival_deadline_min = int(h) * 60 + int(m)

    graph = TransitGraph(db)
    finder = RouteFinder(graph)

    # Check coverage before routing
    max_walk = req.max_walking_m or 1500.0
    coverage = graph.check_coverage(
        req.from_lat, req.from_lng,
        req.to_lat, req.to_lng,
        max_walk,
    )

    routes = finder.find_routes(
        from_lat=req.from_lat,
        from_lng=req.from_lng,
        to_lat=req.to_lat,
        to_lng=req.to_lng,
        depart_time_min=depart_min,
        max_walking_m=max_walk,
        budget_tnd=req.budget or 20.0,
        arrival_deadline_min=arrival_deadline_min,
    )

    return RouteSearchResponse(
        routes=routes,
        coverage=coverage,
        safety_margin_min=15,
    )
