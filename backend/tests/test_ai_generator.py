"""Tests for the AI generator adapters (MockAI + factory selection).

These tests never hit the network and never require OPENAI_API_KEY to be
set -- `MockAIGenerator` is fully deterministic and offline, and
`get_ai_generator()` is verified to select it whenever no OpenAI key (or an
explicit MOCK_MODE) is configured.
"""

from __future__ import annotations

import json

from app.core.config import settings
from app.services.ai_generator import (
    AppMetadata,
    GeneratedFile,
    MockAIGenerator,
    OpenAIGenerator,
    get_ai_generator,
)
from app.services.brand_dna import all_tickers_for


async def test_mock_generator_metadata_shape():
    generator = MockAIGenerator()
    metadata = await generator.generate_metadata("A social network for houseplants")

    assert isinstance(metadata, AppMetadata)
    assert metadata.name
    assert metadata.ticker.isalnum()
    assert metadata.ticker == metadata.ticker.upper()
    assert 3 <= len(metadata.ticker) <= 8
    assert "houseplants" in metadata.description.lower() or "plant" in metadata.description.lower() or metadata.description


async def test_mock_generator_icon_is_unique_tech_svg():
    generator = MockAIGenerator()
    a = await generator.generate_metadata("Pixel art generator")
    b = await generator.generate_metadata("chat", "discord-like")
    icon_a = await generator.generate_icon(a)
    icon_b = await generator.generate_icon(b)

    assert icon_a and icon_a.startswith("data:image/svg+xml,")
    assert icon_b and icon_b.startswith("data:image/svg+xml,")
    assert icon_a != icon_b  # launches must not share one brand glyph


async def test_mock_generator_template_dna_is_distinct():
    generator = MockAIGenerator()
    discord = await generator.generate_metadata("chat", "discord-like")
    chrome = await generator.generate_metadata("browser", "chrome-like")
    chatgpt = await generator.generate_metadata("ai chat", "chatgpt-like")

    assert discord.ticker in all_tickers_for("discord")
    assert chrome.ticker in all_tickers_for("chrome")
    assert chatgpt.ticker in all_tickers_for("chatgpt")
    assert len({discord.ticker, chrome.ticker, chatgpt.ticker}) == 3
    assert discord.description != chrome.description
    assert discord.name != chrome.name


async def test_mock_generator_template_variants_diverge():
    """Same Start-From family can yield different brand variants across calls."""
    generator = MockAIGenerator()
    tickers = set()
    for i in range(24):
        meta = await generator.generate_metadata(f"community chat spice-{i}", "discord-like")
        tickers.add(meta.ticker)
    assert tickers <= all_tickers_for("discord")
    assert len(tickers) >= 2  # pool entropy should surface more than one brand


async def test_mock_generator_produces_valid_react_tailwind_project():
    generator = MockAIGenerator()
    metadata = await generator.generate_metadata("Habit tracker for climbers")
    files = await generator.generate_code("Habit tracker for climbers", metadata, "react-tailwind")

    assert len(files) >= 5
    assert all(isinstance(f, GeneratedFile) for f in files)

    paths = {f.path for f in files}
    for required in ("package.json", "index.html", "src/main.jsx", "src/App.jsx", "src/index.css"):
        assert required in paths

    package_json_content = next(f.content for f in files if f.path == "package.json")
    package_data = json.loads(package_json_content)
    assert "dependencies" in package_data
    assert "react" in package_data["dependencies"]

    app_jsx = next(f.content for f in files if f.path == "src/App.jsx")
    assert "export default function App" in app_jsx


async def test_mock_discord_code_has_channels_ui():
    generator = MockAIGenerator()
    metadata = await generator.generate_metadata("chat", "discord-like")
    files = await generator.generate_code("chat", metadata, "discord-like")
    app_jsx = next(f.content for f in files if f.path == "src/App.jsx")
    assert "CHANNELS" in app_jsx
    assert metadata.name in app_jsx


def test_get_ai_generator_defaults_to_mock_without_api_key(monkeypatch):
    monkeypatch.setattr(settings, "OPENAI_API_KEY", None)
    monkeypatch.setattr(settings, "MOCK_MODE", None)

    generator = get_ai_generator()

    assert isinstance(generator, MockAIGenerator)


def test_get_ai_generator_returns_openai_when_key_present(monkeypatch):
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "sk-fake-test-key")
    monkeypatch.setattr(settings, "MOCK_MODE", None)

    generator = get_ai_generator()

    assert isinstance(generator, OpenAIGenerator)


def test_get_ai_generator_mock_mode_forces_mock_even_with_key(monkeypatch):
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "sk-fake-test-key")
    monkeypatch.setattr(settings, "MOCK_MODE", True)

    generator = get_ai_generator()

    assert isinstance(generator, MockAIGenerator)
