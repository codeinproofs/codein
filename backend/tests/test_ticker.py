"""Tests for ticker normalization and DB-backed uniqueness resolution."""

from __future__ import annotations

from app.models import App, AppStatus
from app.services.code_builder import ensure_unique_ticker, normalize_ticker_core


def test_normalize_ticker_core_strips_and_uppercases():
    assert normalize_ticker_core("doge coin") == "DOGECOIN"


def test_normalize_ticker_core_strips_symbols():
    assert normalize_ticker_core("$Pump-Fun!!") == "PUMPFUN"


def test_normalize_ticker_core_min_length_padding():
    core = normalize_ticker_core("Go")
    assert len(core) == 3
    assert core.startswith("GO")


def test_normalize_ticker_core_empty_input_falls_back():
    assert normalize_ticker_core("") == "APP"
    assert normalize_ticker_core("!!!") == "APP"


def test_normalize_ticker_core_max_length_clamp():
    core = normalize_ticker_core("Supercalifragilisticexpialidocious")
    assert len(core) == 8
    assert core == "SUPERCAL"


async def test_ensure_unique_ticker_no_collision(db_session):
    ticker = await ensure_unique_ticker(db_session, "Rocket Dog")
    assert ticker == "$ROCKETDO"
    assert ticker.startswith("$")
    assert 3 <= len(ticker) - 1 <= 8


async def test_ensure_unique_ticker_resolves_collision(db_session):
    first = await ensure_unique_ticker(db_session, "Moon Cat")
    app1 = App(
        name="Moon Cat",
        ticker=first,
        idea="A cat that goes to the moon",
        status=AppStatus.BUILDING,
        status_detail="Queued",
    )
    db_session.add(app1)
    await db_session.commit()

    second = await ensure_unique_ticker(db_session, "Moon Cat")
    assert second != first
    assert second.startswith("$")
    assert len(second) - 1 <= 8

    app2 = App(
        name="Moon Cat 2",
        ticker=second,
        idea="Another moon cat",
        status=AppStatus.BUILDING,
        status_detail="Queued",
    )
    db_session.add(app2)
    await db_session.commit()

    third = await ensure_unique_ticker(db_session, "Moon Cat")
    assert third not in (first, second)


async def test_ensure_unique_ticker_handles_many_collisions(db_session):
    tickers = set()
    for i in range(12):
        ticker = await ensure_unique_ticker(db_session, "AAA")
        assert ticker not in tickers
        tickers.add(ticker)
        app = App(
            name=f"App {i}",
            ticker=ticker,
            idea="idea",
            status=AppStatus.BUILDING,
            status_detail="Queued",
        )
        db_session.add(app)
        await db_session.commit()

    assert len(tickers) == 12
    for ticker in tickers:
        assert ticker.startswith("$")
        assert len(ticker) - 1 <= 8
