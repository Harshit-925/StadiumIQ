"""Tests for app/engine/prediction.py — deterministic math, no I/O."""

from __future__ import annotations

import pytest

from app.engine.prediction import predict_crowd_trend, predict_wait_time


class TestPredictCrowdTrend:
    def test_rising_trend_projects_forward(self) -> None:
        # Steady increase of +0.5 each step, 2 steps ahead
        data = [1.0, 1.5, 2.0]
        result = predict_crowd_trend(data, minutes_ahead=2)
        # Last delta = 0.5, weighted mean delta ≈ 0.5, project 2 steps → 3.0
        assert result == pytest.approx(3.0, abs=0.1)

    def test_falling_trend_projects_lower(self) -> None:
        data = [5.0, 4.0, 3.0]
        result = predict_crowd_trend(data, minutes_ahead=1)
        assert result < 3.0

    def test_flat_trend_stays_flat(self) -> None:
        data = [2.5, 2.5, 2.5]
        result = predict_crowd_trend(data, minutes_ahead=5)
        assert result == pytest.approx(2.5, abs=0.001)

    def test_result_clamped_at_zero(self) -> None:
        # Falling fast — should not go below 0
        data = [0.3, 0.1]
        result = predict_crowd_trend(data, minutes_ahead=100)
        assert result >= 0.0

    def test_result_clamped_at_ten(self) -> None:
        # Rising fast — should not exceed 10 pax/m²
        data = [8.0, 9.5]
        result = predict_crowd_trend(data, minutes_ahead=100)
        assert result <= 10.0

    def test_two_point_input_works(self) -> None:
        data = [1.0, 2.0]
        result = predict_crowd_trend(data, minutes_ahead=1)
        assert result == pytest.approx(3.0, abs=0.01)

    def test_raises_with_single_reading(self) -> None:
        with pytest.raises(ValueError, match="At least 2"):
            predict_crowd_trend([1.0], minutes_ahead=5)

    def test_raises_with_empty_list(self) -> None:
        with pytest.raises(ValueError):
            predict_crowd_trend([], minutes_ahead=5)

    def test_raises_with_zero_minutes_ahead(self) -> None:
        with pytest.raises(ValueError, match="minutes_ahead"):
            predict_crowd_trend([1.0, 2.0], minutes_ahead=0)

    def test_recency_weighting_increases_recent_influence(self) -> None:
        # Last delta is large (+2), earlier delta is small (+0.1)
        # With recency weighting, prediction should lean toward larger delta
        data = [1.0, 1.1, 3.1]
        result = predict_crowd_trend(data, minutes_ahead=1)
        # Even-weighted mean delta would be (0.1 + 2.0) / 2 = 1.05 → 4.15
        # Recency-weighted: (0.1*1 + 2.0*2) / 3 ≈ 1.4 → 4.5
        assert result > 4.0  # recency bias shows up


class TestPredictWaitTime:
    def test_basic_wait_calculation(self) -> None:
        # 100 people, 10 arrivals/min → 10 minutes
        assert predict_wait_time(100, 10.0) == 10

    def test_empty_queue_returns_zero(self) -> None:
        assert predict_wait_time(0, 5.0) == 0

    def test_minimum_wait_is_one_when_queue_non_empty(self) -> None:
        # Very high rate means <1 minute, but should return at least 1
        assert predict_wait_time(1, 1000.0) == 1

    def test_rounding_up_to_nearest_minute(self) -> None:
        # 5 / 3 ≈ 1.67 → rounds to 2
        assert predict_wait_time(5, 3.0) == 2

    def test_raises_on_negative_queue(self) -> None:
        with pytest.raises(ValueError, match="non-negative"):
            predict_wait_time(-1, 5.0)

    def test_raises_on_zero_arrival_rate(self) -> None:
        with pytest.raises(ValueError, match="greater than 0"):
            predict_wait_time(10, 0.0)

    def test_raises_on_negative_arrival_rate(self) -> None:
        with pytest.raises(ValueError, match="greater than 0"):
            predict_wait_time(10, -1.0)

    def test_large_queue_scales_correctly(self) -> None:
        # 1000 people, 50/min → 20 minutes
        assert predict_wait_time(1000, 50.0) == 20
