"""
StadiumIQ Prediction Engine.

Pure, deterministic, I/O-free functions for short-term crowd forecasting.

IMPORTANT: These are simple mathematical projections — NOT trained ML models.
They use linear/weighted extrapolation and basic queuing theory. They are
honest approximations suitable for real-time decision support in operations
where a directional signal is more useful than no signal.
"""
from __future__ import annotations


def predict_crowd_trend(
    historical_zone_data: list[float],
    minutes_ahead: int,
) -> float:
    """Project crowd density forward using weighted linear extrapolation.

    Uses a recency-weighted average of observed rates of change so that
    recent movement counts more than older readings.

    NOTE: This is a simple linear projection, not a trained model. Accuracy
    degrades significantly beyond ~30 minutes and should be treated as a
    directional signal only.

    Args:
        historical_zone_data: Ordered list of density readings (pax/m²),
            oldest first. Requires at least 2 readings.
        minutes_ahead: Number of minutes ahead to project.

    Returns:
        Projected density (pax/m²), clamped to [0.0, 10.0].

    Raises:
        ValueError: If fewer than 2 readings are provided or minutes_ahead < 1.
    """
    if len(historical_zone_data) < 2:
        raise ValueError("At least 2 historical readings are required to project a trend.")
    if minutes_ahead < 1:
        raise ValueError("minutes_ahead must be at least 1.")

    # Compute per-step deltas
    deltas = [
        historical_zone_data[i + 1] - historical_zone_data[i]
        for i in range(len(historical_zone_data) - 1)
    ]

    # Recency-weighted mean: weight[i] = i+1 so the last delta is heaviest
    total_weight = sum(range(1, len(deltas) + 1))
    weighted_delta = sum(d * (i + 1) for i, d in enumerate(deltas)) / total_weight

    projected = historical_zone_data[-1] + weighted_delta * minutes_ahead
    # Physical bounds: density must be between 0 and 10 pax/m² (G. Keith Still scale)
    return round(max(0.0, min(10.0, projected)), 3)


def predict_wait_time(current_queue: int, arrival_rate: float) -> int:
    """Estimate gate/entry wait time using Little's Law (L = λW → W = L/λ).

    Little's Law: The long-term average number of items in a system equals
    the long-term average arrival rate multiplied by the average time spent
    in the system. Rearranged: W = L / λ.

    NOTE: This assumes a steady-state queue with stable arrival rate. It is
    a useful operational estimate for planning purposes, not a simulation.

    Args:
        current_queue: Current number of people waiting in queue (L).
        arrival_rate: Average arrivals per minute (λ). Must be > 0.

    Returns:
        Estimated wait time in whole minutes (at least 1 if queue is non-empty,
        0 if queue is empty).

    Raises:
        ValueError: If current_queue is negative or arrival_rate is not > 0.
    """
    if current_queue < 0:
        raise ValueError("current_queue must be non-negative.")
    if arrival_rate <= 0:
        raise ValueError("arrival_rate must be greater than 0.")

    if current_queue == 0:
        return 0

    wait_minutes = current_queue / arrival_rate
    return max(1, round(wait_minutes))
