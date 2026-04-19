"""
Multi-modal routing engine for the Sousse–Monastir corridor.

Modes considered:
  - 🚶 Walk  : any two points, speed 1.4 m/s, free
  - 🚌 Bus   : scheduled Sousse↔Monastir bus (from XLSX)
  - 🚂 Train : SNCFT Métro du Sahel (from XLSX)
  - 🚕 Taxi  : always available, metered TND fare
  - 🚗 Carpool : user-posted ride-share offers from the DB

Algorithm: time-expanded Connection Scan + Dijkstra hybrid
  1. Build a graph of (stop, timeslot) nodes from schedule data
  2. Add walk edges between geographically close stop pairs
  3. Add taxi virtual edges for origin→nearest-stop and last-stop→destination
  4. Add carpool edges for matching ride-share offers
  5. Run 3 Dijkstra passes with different cost functions:
       fastest  = minimise total minutes
       cheapest = minimise total TND
       balanced = minimise 0.6×time_score + 0.4×cost_score

Constraints enforced:
  - 15-minute safety margin on arrival deadline
  - Hard budget cap (prune paths exceeding budget)
  - Coverage check (detect if origin/destination have nearby stops)
"""
from __future__ import annotations

import heapq
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app import models
from app.schemas import Route, RouteSegment

# ── Constants ─────────────────────────────────────────────────────────────────

WALK_SPEED_MPS = 1.4          # metres per second (~5 km/h)
WALK_COST_TND = 0.0
MAX_WALK_DEFAULT_M = 1500.0   # metres

# Bus fares (STS Monastir regional) — TND
BUS_FARE_TND = 1.5            # flat intercity ticket

# Train fares (SNCFT Métro du Sahel) — TND
TRAIN_FARE_TND = 1.0          # urban metro ticket

# Taxi (louage / individual taxi) — TND
TAXI_BASE_TND = 1.5           # flag fall
TAXI_PER_KM_TND = 0.900       # per km
TAXI_SPEED_KMH = 60.0         # average speed including traffic

# Penalty for walking at origin / destination (comfort)
WALK_PENALTY_MIN = 0

# Transfer / waiting buffer (model inaccuracy buffer)
MIN_TRANSFER_MIN = 2

# Safety margin — arrive this many minutes before deadline
SAFETY_MARGIN_MIN = 15

# Carpool matching — max detour to pick up / drop off
CARPOOL_MAX_DETOUR_M = 3000   # metres


# ── Helpers ───────────────────────────────────────────────────────────────────

def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in metres between two WGS-84 points."""
    R = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def time_to_minutes(t: str) -> int:
    """Convert 'HH:MM' string to minutes since midnight."""
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def minutes_to_hhmm(minutes: int) -> str:
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


def taxi_cost(distance_m: float) -> float:
    return TAXI_BASE_TND + (distance_m / 1000) * TAXI_PER_KM_TND


def taxi_time_min(distance_m: float) -> float:
    return (distance_m / 1000) / TAXI_SPEED_KMH * 60


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class StopNode:
    """A physical stop with coordinates."""
    db_id: int
    name: str
    lat: float
    lng: float
    type: str  # 'bus' | 'train'


@dataclass(order=False)
class DijkState:
    """Priority queue state for Dijkstra search."""
    cost: float
    time: int          # current clock (minutes since midnight)
    node_id: int       # stop id
    path: list         # list of PathEdge

    def __lt__(self, other: "DijkState"):
        return self.cost < other.cost


@dataclass
class PathEdge:
    """One edge in a found path."""
    mode: str          # walk | bus | train | taxi | carpool
    from_stop: Optional[StopNode]
    to_stop: Optional[StopNode]
    depart_min: Optional[int]
    arrive_min: Optional[int]
    distance_m: float
    cost_tnd: float
    line_name: Optional[str] = None


@dataclass
class CarpoolEdge:
    """A carpool offer that can be used as a routing edge."""
    offer_id: int
    author_name: str
    from_lat: float
    from_lng: float
    to_lat: float
    to_lng: float
    depart_min: int
    price_per_seat: float
    vehicle_desc: Optional[str]


# ── Graph builder ─────────────────────────────────────────────────────────────

class TransitGraph:
    """
    Builds a connection graph from the DB schedule.
    Edges are: scheduled departures + walk connections + carpool offers.
    """

    def __init__(self, db: Session):
        self.db = db
        self.stops: dict[int, StopNode] = {}
        self.carpool_edges: list[CarpoolEdge] = []
        self._load_stops()
        self._load_carpools()

    def _load_stops(self):
        rows = self.db.query(models.Stop).all()
        for s in rows:
            self.stops[s.id] = StopNode(
                db_id=s.id, name=s.name, lat=s.lat, lng=s.lng, type=s.type
            )

    def _load_carpools(self):
        """Load active carpool offers from DB."""
        offers = (
            self.db.query(models.CarpoolOffer)
            .filter(models.CarpoolOffer.is_active == True)
            .filter(models.CarpoolOffer.seats_available > 0)
            .all()
        )
        for o in offers:
            try:
                dep_min = time_to_minutes(o.departure_time)
            except (ValueError, AttributeError):
                continue
            self.carpool_edges.append(CarpoolEdge(
                offer_id=o.id,
                author_name=o.author_name,
                from_lat=o.from_lat,
                from_lng=o.from_lng,
                to_lat=o.to_lat,
                to_lng=o.to_lng,
                depart_min=dep_min,
                price_per_seat=o.price_per_seat,
                vehicle_desc=o.vehicle_desc,
            ))

    def get_nearest_stops(self, lat: float, lng: float, max_dist_m: float) -> list[tuple[StopNode, float]]:
        """Return stops within max_dist_m, sorted by distance."""
        result = []
        for stop in self.stops.values():
            d = haversine(lat, lng, stop.lat, stop.lng)
            if d <= max_dist_m:
                result.append((stop, d))
        result.sort(key=lambda x: x[1])
        return result

    def get_departures_from(self, stop_id: int, from_time_min: int) -> list[dict]:
        """
        Return all scheduled departures from a stop at/after from_time_min.
        Each item: {trip_id, line_name, mode, depart_min, stop_sequence}
        """
        rows = (
            self.db.query(models.StopTime, models.Trip, models.TransitLine)
            .join(models.Trip, models.StopTime.trip_id == models.Trip.id)
            .join(models.TransitLine, models.Trip.line_id == models.TransitLine.id)
            .filter(models.StopTime.stop_id == stop_id)
            .filter(models.StopTime.departure_time.isnot(None))
            .all()
        )
        departures = []
        for st, trip, line in rows:
            dep_min = time_to_minutes(st.departure_time)
            if dep_min >= from_time_min + MIN_TRANSFER_MIN:
                departures.append({
                    "trip_id": trip.id,
                    "line_name": line.name,
                    "mode": line.type,
                    "depart_min": dep_min,
                    "sequence": st.sequence,
                })
        departures.sort(key=lambda x: x["depart_min"])
        return departures

    def get_stop_times_for_trip(self, trip_id: int) -> list[dict]:
        """Return all stop-times for a trip, ordered by sequence."""
        rows = (
            self.db.query(models.StopTime, models.Stop)
            .join(models.Stop, models.StopTime.stop_id == models.Stop.id)
            .filter(models.StopTime.trip_id == trip_id)
            .order_by(models.StopTime.sequence)
            .all()
        )
        result = []
        for st, stop in rows:
            if st.departure_time:
                result.append({
                    "stop_id": stop.id,
                    "stop_name": stop.name,
                    "lat": stop.lat,
                    "lng": stop.lng,
                    "sequence": st.sequence,
                    "time_min": time_to_minutes(st.departure_time),
                })
        return result

    def get_matching_carpools(
        self,
        from_lat: float, from_lng: float,
        to_lat: float, to_lng: float,
        from_time_min: int,
    ) -> list[CarpoolEdge]:
        """
        Find carpool offers whose pickup/dropoff are close enough
        to the search origin/destination and depart at/after from_time_min.
        """
        matches = []
        for cp in self.carpool_edges:
            # Check departure time (must depart at/after search time)
            if cp.depart_min < from_time_min:
                continue
            # Check pickup proximity to search origin
            pickup_dist = haversine(from_lat, from_lng, cp.from_lat, cp.from_lng)
            if pickup_dist > CARPOOL_MAX_DETOUR_M:
                continue
            # Check dropoff proximity to search destination
            dropoff_dist = haversine(to_lat, to_lng, cp.to_lat, cp.to_lng)
            if dropoff_dist > CARPOOL_MAX_DETOUR_M:
                continue
            matches.append(cp)
        matches.sort(key=lambda x: x.depart_min)
        return matches

    def check_coverage(
        self,
        from_lat: float, from_lng: float,
        to_lat: float, to_lng: float,
        max_walk_m: float,
    ) -> str:
        """
        Check transit coverage for origin and destination.
        Returns: 'full' | 'origin_only' | 'destination_only' | 'none'
        """
        origin_stops = self.get_nearest_stops(from_lat, from_lng, max_walk_m)
        dest_stops = self.get_nearest_stops(to_lat, to_lng, max_walk_m)

        has_origin = len(origin_stops) > 0
        has_dest = len(dest_stops) > 0

        if has_origin and has_dest:
            return "full"
        elif has_origin:
            return "origin_only"
        elif has_dest:
            return "destination_only"
        else:
            return "none"


# ── Route finder ──────────────────────────────────────────────────────────────

class RouteFinder:
    def __init__(self, graph: TransitGraph):
        self.graph = graph

    def find_routes(
        self,
        from_lat: float, from_lng: float,
        to_lat: float, to_lng: float,
        depart_time_min: int,
        max_walking_m: float,
        budget_tnd: float,
        arrival_deadline_min: Optional[int] = None,
    ) -> list[Route]:
        """
        Run 3 searches and return up to 3 Route objects.
        Applies:
          - 15-minute safety margin on arrival_deadline
          - Hard budget enforcement (prune paths exceeding budget)
          - Carpool edges from matching offers
        """
        # Apply safety margin to arrival deadline
        effective_deadline = None
        if arrival_deadline_min is not None:
            effective_deadline = arrival_deadline_min - SAFETY_MARGIN_MIN

        results: list[Route] = []

        for route_type, cost_fn in [
            ("fastest",  self._cost_fastest),
            ("cheapest", self._cost_cheapest),
            ("balanced", self._cost_balanced),
        ]:
            path = self._dijkstra(
                from_lat, from_lng, to_lat, to_lng,
                depart_time_min, max_walking_m, cost_fn,
                budget_tnd=budget_tnd,
                deadline_min=effective_deadline,
            )
            if path is None:
                continue
            route = self._build_route(
                from_lat, from_lng, to_lat, to_lng,
                route_type, path, budget_tnd,
                arrival_deadline_min=arrival_deadline_min,
            )
            # Hard budget enforcement — skip routes that exceed budget
            if route.totalCost > budget_tnd:
                # Still include taxi-only as last resort but badge it
                if len(route.segments) == 1 and route.segments[0].mode == "taxi":
                    route.badges = [b for b in route.badges if b != "within-budget"]
                    route.badges.append("over-budget")
                else:
                    continue
            results.append(route)

        # Also try direct carpool routes
        carpool_routes = self._find_carpool_routes(
            from_lat, from_lng, to_lat, to_lng,
            depart_time_min, budget_tnd,
            effective_deadline,
        )
        results.extend(carpool_routes)

        return results

    # Cost functions (return scalar "cost" for the priority queue)
    @staticmethod
    def _cost_fastest(time_delta: float, money_delta: float) -> float:
        return time_delta

    @staticmethod
    def _cost_cheapest(time_delta: float, money_delta: float) -> float:
        return money_delta * 10 + time_delta * 0.05   # TND dominates

    @staticmethod
    def _cost_balanced(time_delta: float, money_delta: float) -> float:
        return 0.6 * time_delta + 0.4 * money_delta * 15

    def _dijkstra(
        self,
        from_lat, from_lng, to_lat, to_lng,
        start_min: int,
        max_walk_m: float,
        cost_fn,
        budget_tnd: float = 999.0,
        deadline_min: Optional[int] = None,
    ) -> Optional[list[PathEdge]]:
        """
        Modified Dijkstra over the stop graph.
        State: (cost, time_min, stop_id, path, accumulated_tnd)
        Also handles origin→stop walking and stop→destination walking.
        Returns list of PathEdge or None if no path found.

        Constraints:
          - accumulated_tnd must not exceed budget_tnd
          - arrival time must not exceed deadline_min (if set)
        """
        # Virtual node IDs
        ORIGIN_ID = -1
        DEST_ID = -2

        # Nearest stops to origin (within walking distance)
        origin_stops = self.graph.get_nearest_stops(from_lat, from_lng, max_walk_m)
        # Nearest stops to destination (within walking distance)
        dest_stops = self.graph.get_nearest_stops(to_lat, to_lng, max_walk_m)

        if not origin_stops:
            # No stops reachable on foot → taxi-only fallback
            return self._taxi_only(from_lat, from_lng, to_lat, to_lng, start_min)

        dest_stop_ids = {s.db_id for s, _ in dest_stops}
        dest_distances = {s.db_id: d for s, d in dest_stops}

        # Priority queue: (priority_cost, counter, time_min, stop_id, path, accumulated_tnd)
        INF = float("inf")
        best_cost: dict[int, float] = {}

        pq: list[tuple[float, int, int, int, list[PathEdge], float]] = []
        counter = 0

        # Seed with walking from origin to each reachable stop
        for stop, dist_m in origin_stops:
            walk_min = dist_m / WALK_SPEED_MPS / 60
            arrive_at = start_min + walk_min
            c = cost_fn(walk_min, 0.0)
            edge = PathEdge(
                mode="walk",
                from_stop=None,
                to_stop=stop,
                depart_min=start_min,
                arrive_min=int(arrive_at),
                distance_m=dist_m,
                cost_tnd=0.0,
            )
            counter += 1
            heapq.heappush(pq, (c, counter, int(arrive_at), stop.db_id, [edge], 0.0))

        # Also consider taking a taxi directly
        direct_dist = haversine(from_lat, from_lng, to_lat, to_lng)
        direct_taxi_min = taxi_time_min(direct_dist)
        direct_taxi_cost = taxi_cost(direct_dist)
        direct_taxi_edge = PathEdge(
            mode="taxi",
            from_stop=None, to_stop=None,
            depart_min=start_min,
            arrive_min=int(start_min + direct_taxi_min),
            distance_m=direct_dist,
            cost_tnd=direct_taxi_cost,
        )

        visited_dest: Optional[tuple[float, int, list[PathEdge]]] = None

        while pq:
            cost, _, cur_time, cur_stop_id, path, acc_tnd = heapq.heappop(pq)

            if best_cost.get(cur_stop_id, INF) <= cost:
                continue
            best_cost[cur_stop_id] = cost

            # ── Deadline check ────────────────────────────────────────────
            if deadline_min is not None and cur_time > deadline_min:
                continue  # This state already missed the deadline

            # ── Check if we can now walk to destination ───────────────────
            if cur_stop_id in dest_stop_ids:
                stop_node = self.graph.stops[cur_stop_id]
                last_dist_m = dest_distances[cur_stop_id]
                walk_min = last_dist_m / WALK_SPEED_MPS / 60
                total_time = cur_time + walk_min
                final_cost = cost + cost_fn(walk_min, 0.0)

                # Deadline check for the final arrival
                if deadline_min is not None and total_time > deadline_min:
                    pass  # Skip this destination — would arrive too late
                else:
                    final_edge = PathEdge(
                        mode="walk",
                        from_stop=stop_node,
                        to_stop=None,
                        depart_min=cur_time,
                        arrive_min=int(total_time),
                        distance_m=last_dist_m,
                        cost_tnd=0.0,
                    )
                    candidate = (final_cost, int(total_time), path + [final_edge])
                    if visited_dest is None or candidate[0] < visited_dest[0]:
                        visited_dest = candidate

            # ── Expand: take a scheduled departure ───────────────────────
            departures = self.graph.get_departures_from(cur_stop_id, cur_time)
            for dep in departures[:5]:  # top 5 next departures only
                trip_stoptimes = self.graph.get_stop_times_for_trip(dep["trip_id"])
                # Find our position in this trip
                our_seq_idx = None
                for idx, st in enumerate(trip_stoptimes):
                    if st["stop_id"] == cur_stop_id and st["time_min"] == dep["depart_min"]:
                        our_seq_idx = idx
                        break
                if our_seq_idx is None:
                    continue

                # Ride forward along the trip
                fare = BUS_FARE_TND if dep["mode"] == "bus" else TRAIN_FARE_TND
                prev_st = trip_stoptimes[our_seq_idx]

                # Budget check: would this fare exceed the budget?
                new_acc_tnd = acc_tnd + fare
                if new_acc_tnd > budget_tnd:
                    continue  # Prune — exceeds budget

                for next_st in trip_stoptimes[our_seq_idx + 1:]:
                    next_stop = self.graph.stops.get(next_st["stop_id"])
                    if next_stop is None:
                        continue
                    ride_dist = haversine(
                        prev_st["lat"], prev_st["lng"],
                        next_st["lat"], next_st["lng"],
                    )
                    ride_min = next_st["time_min"] - dep["depart_min"]
                    wait_min = dep["depart_min"] - cur_time
                    total_delta_min = wait_min + ride_min

                    # Deadline check
                    if deadline_min is not None and next_st["time_min"] > deadline_min:
                        continue

                    edge = PathEdge(
                        mode=dep["mode"],
                        from_stop=self.graph.stops.get(cur_stop_id),
                        to_stop=next_stop,
                        depart_min=dep["depart_min"],
                        arrive_min=next_st["time_min"],
                        distance_m=ride_dist,
                        cost_tnd=fare,
                        line_name=dep["line_name"],
                    )
                    new_cost = cost + cost_fn(total_delta_min, fare)
                    if best_cost.get(next_stop.db_id, INF) > new_cost:
                        counter += 1
                        heapq.heappush(
                            pq,
                            (new_cost, counter, next_st["time_min"], next_stop.db_id, path + [edge], new_acc_tnd)
                        )
                    prev_st = next_st

            # ── Expand: walk to nearby stops ─────────────────────────────
            cur_stop = self.graph.stops.get(cur_stop_id)
            if cur_stop:
                nearby = self.graph.get_nearest_stops(cur_stop.lat, cur_stop.lng, max_walk_m)
                for near_stop, dist_m in nearby[:6]:
                    if near_stop.db_id == cur_stop_id:
                        continue
                    walk_min = dist_m / WALK_SPEED_MPS / 60
                    new_time = cur_time + walk_min
                    new_cost = cost + cost_fn(walk_min, 0.0)

                    # Deadline check
                    if deadline_min is not None and new_time > deadline_min:
                        continue

                    if best_cost.get(near_stop.db_id, INF) > new_cost:
                        edge = PathEdge(
                            mode="walk",
                            from_stop=cur_stop,
                            to_stop=near_stop,
                            depart_min=cur_time,
                            arrive_min=int(new_time),
                            distance_m=dist_m,
                            cost_tnd=0.0,
                        )
                        counter += 1
                        heapq.heappush(
                            pq,
                            (new_cost, counter, int(new_time), near_stop.db_id, path + [edge], acc_tnd)
                        )

        if visited_dest:
            return visited_dest[2]

        # Fallback: taxi only
        return [direct_taxi_edge]

    def _taxi_only(self, from_lat, from_lng, to_lat, to_lng, start_min) -> list[PathEdge]:
        dist = haversine(from_lat, from_lng, to_lat, to_lng)
        return [PathEdge(
            mode="taxi",
            from_stop=None, to_stop=None,
            depart_min=start_min,
            arrive_min=int(start_min + taxi_time_min(dist)),
            distance_m=dist,
            cost_tnd=taxi_cost(dist),
        )]

    def _find_carpool_routes(
        self,
        from_lat: float, from_lng: float,
        to_lat: float, to_lng: float,
        depart_time_min: int,
        budget_tnd: float,
        deadline_min: Optional[int],
    ) -> list[Route]:
        """
        Find direct carpool routes from matching offers.
        Returns Route objects for any matching carpool rides.
        """
        matching = self.graph.get_matching_carpools(
            from_lat, from_lng, to_lat, to_lng, depart_time_min,
        )
        routes = []

        for cp in matching[:3]:  # max 3 carpool options
            # Budget check
            if cp.price_per_seat > budget_tnd:
                continue

            # Walk from origin to carpool pickup
            pickup_dist = haversine(from_lat, from_lng, cp.from_lat, cp.from_lng)
            walk_to_pickup_min = int(pickup_dist / WALK_SPEED_MPS / 60) if pickup_dist > 50 else 0

            # Carpool ride
            ride_dist = haversine(cp.from_lat, cp.from_lng, cp.to_lat, cp.to_lng)
            ride_min = int(taxi_time_min(ride_dist))  # similar speed to taxi
            carpool_arrive_min = cp.depart_min + ride_min

            # Walk from carpool dropoff to destination
            dropoff_dist = haversine(cp.to_lat, cp.to_lng, to_lat, to_lng)
            walk_from_dropoff_min = int(dropoff_dist / WALK_SPEED_MPS / 60) if dropoff_dist > 50 else 0

            total_arrive_min = carpool_arrive_min + walk_from_dropoff_min

            # Deadline check
            if deadline_min is not None and total_arrive_min > deadline_min:
                continue

            segments = []

            # Walk to pickup (if needed)
            if walk_to_pickup_min > 0:
                segments.append(RouteSegment(
                    mode="walk",
                    duration=walk_to_pickup_min,
                    distance=int(pickup_dist),
                    details="Walk to carpool pickup point",
                    depart_at=minutes_to_hhmm(cp.depart_min - walk_to_pickup_min),
                    arrive_at=minutes_to_hhmm(cp.depart_min),
                    from_lat=from_lat, from_lng=from_lng,
                    to_lat=cp.from_lat, to_lng=cp.from_lng,
                ))

            # Carpool ride
            vehicle_info = f" ({cp.vehicle_desc})" if cp.vehicle_desc else ""
            price_info = "Free" if cp.price_per_seat == 0 else f"{cp.price_per_seat:.1f} TND"
            segments.append(RouteSegment(
                mode="carpool",
                duration=ride_min,
                distance=int(ride_dist),
                details=f"Carpool with {cp.author_name}{vehicle_info} — {price_info}",
                line_name=f"Carpool #{cp.offer_id}",
                depart_at=minutes_to_hhmm(cp.depart_min),
                arrive_at=minutes_to_hhmm(carpool_arrive_min),
                from_lat=cp.from_lat, from_lng=cp.from_lng,
                to_lat=cp.to_lat, to_lng=cp.to_lng,
            ))

            # Walk from dropoff (if needed)
            if walk_from_dropoff_min > 0:
                segments.append(RouteSegment(
                    mode="walk",
                    duration=walk_from_dropoff_min,
                    distance=int(dropoff_dist),
                    details="Walk from carpool dropoff to destination",
                    depart_at=minutes_to_hhmm(carpool_arrive_min),
                    arrive_at=minutes_to_hhmm(total_arrive_min),
                    from_lat=cp.to_lat, from_lng=cp.to_lng,
                    to_lat=to_lat, to_lng=to_lng,
                ))

            total_time = total_arrive_min - (cp.depart_min - walk_to_pickup_min)
            total_walking = int(pickup_dist + dropoff_dist)

            badges = []
            if cp.price_per_seat <= budget_tnd:
                badges.append("within-budget")
            badges.append("eco-friendly")
            if cp.price_per_seat == 0:
                badges.append("free-ride")

            routes.append(Route(
                id=f"r-carpool-{cp.offer_id}",
                type="cheapest",
                totalTime=max(1, total_time),
                totalCost=round(cp.price_per_seat, 3),
                walkingDistance=total_walking,
                segments=segments,
                badges=badges,
            ))

        return routes

    def _build_route(
        self,
        from_lat: float, from_lng: float,
        to_lat: float, to_lng: float,
        route_type: str,
        path: list[PathEdge],
        budget_tnd: float,
        arrival_deadline_min: Optional[int] = None,
    ) -> Route:
        """Convert a list of PathEdge into a Route schema object."""
        total_time = 0
        total_cost = 0.0
        walking_dist = 0
        segments: list[RouteSegment] = []

        start_min = path[0].depart_min if path[0].depart_min is not None else 0
        end_min = path[-1].arrive_min if path[-1].arrive_min is not None else start_min

        for i, edge in enumerate(path):
            dur = 0
            if edge.depart_min is not None and edge.arrive_min is not None:
                dur = max(1, edge.arrive_min - edge.depart_min)
            elif edge.distance_m:
                dur = max(1, int(edge.distance_m / WALK_SPEED_MPS / 60))

            total_cost += edge.cost_tnd
            if edge.mode == "walk":
                walking_dist += int(edge.distance_m)

            frm_lat, frm_lng, tgt_lat, tgt_lng = None, None, None, None
            if edge.from_stop:
                frm_lat, frm_lng = edge.from_stop.lat, edge.from_stop.lng
            elif i == 0 or (i > 0 and path[i-1].mode == "taxi"):
                # First node is origin
                frm_lat, frm_lng = from_lat, from_lng
            
            if edge.to_stop:
                tgt_lat, tgt_lng = edge.to_stop.lat, edge.to_stop.lng
            elif i == len(path) - 1 or edge.mode == "taxi":
                # Last node is destination
                tgt_lat, tgt_lng = to_lat, to_lng

            # Build details string
            if edge.mode == "walk":
                if edge.from_stop is None:
                    details = f"Walk to {edge.to_stop.name}" if edge.to_stop else "Walk"
                elif edge.to_stop is None:
                    details = f"Walk from {edge.from_stop.name} to destination"
                else:
                    details = f"Walk: {edge.from_stop.name} → {edge.to_stop.name}"
            elif edge.mode == "bus":
                frm = edge.from_stop.name if edge.from_stop else "??"
                to = edge.to_stop.name if edge.to_stop else "??"
                details = f"Bus ({edge.line_name or 'STS'}) — {frm} → {to}"
            elif edge.mode == "train":
                frm = edge.from_stop.name if edge.from_stop else "??"
                to = edge.to_stop.name if edge.to_stop else "??"
                details = f"Métro du Sahel ({edge.line_name or 'SNCFT'}) — {frm} → {to}"
            elif edge.mode == "carpool":
                details = f"Carpool ({edge.line_name or 'shared ride'})"
            else:  # taxi
                details = "Taxi (louage / individual)"

            segments.append(RouteSegment(
                mode=edge.mode,
                duration=dur,
                distance=int(edge.distance_m),
                details=details,
                line_name=edge.line_name,
                depart_at=minutes_to_hhmm(edge.depart_min) if edge.depart_min is not None else None,
                arrive_at=minutes_to_hhmm(edge.arrive_min) if edge.arrive_min is not None else None,
                from_lat=frm_lat, from_lng=frm_lng,
                to_lat=tgt_lat, to_lng=tgt_lng,
            ))

        total_time = end_min - start_min if end_min > start_min else sum(s.duration for s in segments)

        # Build badges
        badges: list[str] = []
        if total_cost <= budget_tnd:
            badges.append("within-budget")
        if not any(s.mode == "taxi" for s in segments):
            badges.append("eco-friendly")
        if route_type == "cheapest":
            badges.append("lowest-price")
        if route_type == "fastest":
            badges.append("fastest")

        # Safety margin badge
        if arrival_deadline_min is not None:
            margin = arrival_deadline_min - end_min
            if margin >= SAFETY_MARGIN_MIN:
                badges.append("safe-arrival")
            elif margin >= 0:
                badges.append("tight-arrival")

        return Route(
            id=f"r-{route_type}",
            type=route_type,
            totalTime=max(1, total_time),
            totalCost=round(total_cost, 3),
            walkingDistance=walking_dist,
            segments=segments,
            badges=badges,
        )
