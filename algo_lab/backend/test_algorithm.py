from fastapi.testclient import TestClient

from app import SignalInput, app, classify, get_fixtures


def test_fixtures_have_required_keys():
    outputs = [classify(item) for item in get_fixtures()]
    for out in outputs:
        assert out.verdict
        assert out.direction
        assert out.phase
        assert out.timing
        assert out.confidence
        assert out.action in {"buy", "watch", "avoid", "take_profit", "sell"}
        assert out.source_mode == "offline_fixture_or_manual_payload"


def test_weak_context_not_strong_pump():
    beta = next(item for item in get_fixtures() if item.symbol == "BETA")
    result = classify(SignalInput.model_validate(beta.model_dump()))
    assert result.verdict != "strong_pump"
    assert result.dump_probability >= result.pump_probability


def test_how_to_test_explains_no_api_keys_required():
    client = TestClient(app)
    res = client.get("/how-to-test")
    assert res.status_code == 200
    payload = res.json()
    assert "why_no_api_keys_needed" in payload
    assert "where_output_appears" in payload
    assert "frontend_url" in payload["quickstart"]
