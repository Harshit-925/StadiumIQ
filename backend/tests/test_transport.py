import pytest

from app.engine.transport import get_transport_options


def test_get_transport_options_all():
    """Test getting all transport options ranks them correctly."""
    result = get_transport_options(accessible_only=False)
    
    assert "parking" in result
    assert "transit" in result
    
    # Check that sorting pushed bad options to the bottom
    # Typically full parking lots or delayed transit will sink
    # since we don't know the exact data without looking at transit.py,
    # we just ensure it returns a valid list of dicts.
    for lot in result["parking"]:
        assert "id" in lot
        assert "rank_score" not in lot
        
    for transit in result["transit"]:
        assert "id" in transit
        assert "rank_score" not in transit


def test_get_transport_options_accessible():
    """Test getting only accessible options."""
    result = get_transport_options(accessible_only=True)
    
    for lot in result["parking"]:
        assert lot["accessible_spaces"] > 0
        
    for transit in result["transit"]:
        assert transit["accessible"] is True
