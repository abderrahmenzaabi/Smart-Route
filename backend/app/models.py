"""
SQLAlchemy ORM models for the transit database.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Stop(Base):
    """A physical stop / station location."""
    __tablename__ = "stops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    # 'bus' | 'train'
    type = Column(String(20), nullable=False)

    stop_times = relationship("StopTime", back_populates="stop")

    def __repr__(self):
        return f"<Stop {self.name} ({self.type})>"


class TransitLine(Base):
    """A transit line (Bus Monastir→Sousse, Train 501…)."""
    __tablename__ = "transit_lines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    # 'bus' | 'train'
    type = Column(String(20), nullable=False)
    # 'monastir_sousse' | 'sousse_monastir'
    direction = Column(String(40), nullable=False)

    trips = relationship("Trip", back_populates="line")


class Trip(Base):
    """One scheduled run on a transit line."""
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    line_id = Column(Integer, ForeignKey("transit_lines.id"), nullable=False)
    # Identifier from source data (e.g. train number "501", or row index for bus)
    trip_ref = Column(String(20), nullable=True)

    line = relationship("TransitLine", back_populates="trips")
    stop_times = relationship("StopTime", back_populates="trip", order_by="StopTime.sequence")


class StopTime(Base):
    """A stop-time: when a trip visits a stop at a given sequence position."""
    __tablename__ = "stop_times"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    stop_id = Column(Integer, ForeignKey("stops.id"), nullable=False)
    # Position in the trip (0-based)
    sequence = Column(Integer, nullable=False)
    # HH:MM string (e.g. "08:30"), NULL if stop is skipped ("—")
    departure_time = Column(String(5), nullable=True)
    arrival_time = Column(String(5), nullable=True)

    trip = relationship("Trip", back_populates="stop_times")
    stop = relationship("Stop", back_populates="stop_times")

    __table_args__ = (
        UniqueConstraint("trip_id", "stop_id", "sequence", name="uq_tripstop"),
        Index("ix_stop_times_trip_id", "trip_id"),
        Index("ix_stop_times_stop_id", "stop_id"),
    )


class CarpoolOffer(Base):
    """A user-posted carpool / ride-share publication."""
    __tablename__ = "carpool_offers"

    id = Column(Integer, primary_key=True, index=True)
    author_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    from_label = Column(String(200), nullable=False)
    to_label = Column(String(200), nullable=False)
    from_lat = Column(Float, nullable=False)
    from_lng = Column(Float, nullable=False)
    to_lat = Column(Float, nullable=False)
    to_lng = Column(Float, nullable=False)
    departure_time = Column(String(5), nullable=False)      # "HH:MM"
    seats_available = Column(Integer, default=1)
    price_per_seat = Column(Float, default=0.0)              # TND, 0 = free
    vehicle_desc = Column(String(100), nullable=True)
    recurrence = Column(String(50), default="one-time")      # "daily"|"weekdays"|"one-time"
    is_active = Column(Boolean, default=True)
    created_at = Column(String(50), nullable=True)

    def __repr__(self):
        return f"<CarpoolOffer {self.from_label}→{self.to_label} by {self.author_name}>"
