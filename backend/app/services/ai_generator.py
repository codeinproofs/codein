"""AI content generation: app metadata, icon art, and source code.

Implements the Adapter pattern required by the spec:

- `OpenAIGenerator` talks to the real OpenAI API (GPT-4o for text/code,
  DALL-E 3 for icons).
- `MockAIGenerator` is a fully deterministic, offline fallback that produces
  a small working React + Tailwind multi-file project. It requires no network
  access and no API keys, so unit tests and local dev work out of the box.

Use `get_ai_generator()` to obtain the correct implementation based on
`settings.openai_mock_enabled` (automatically mocked when `OPENAI_API_KEY`
is not configured, unless `MOCK_MODE` is explicitly set).
"""

from __future__ import annotations

import json
import logging
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List

from app.core.config import settings
from app.services.brand_dna import (
    normalize_template_key,
    pick_brand_variant,
    tech_icon_data_uri,
    template_app_jsx,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GeneratedFile:
    """A single source file produced by an AI generator."""

    path: str
    content: str


@dataclass(frozen=True)
class AppMetadata:
    """Structured metadata describing the app to be built."""

    name: str
    ticker: str
    description: str
    icon_prompt: str


# ---------------------------------------------------------------------------
# Interface
# ---------------------------------------------------------------------------


class AIGenerator(ABC):
    """Common interface implemented by every AI backend adapter."""

    @abstractmethod
    async def generate_metadata(self, idea: str, template: str | None = None) -> AppMetadata:
        """Turn a free-form idea (+ optional like-template) into structured metadata."""

    @abstractmethod
    async def generate_icon(self, metadata: AppMetadata) -> str | None:
        """Generate (or fabricate) an icon image URL for the app."""

    @abstractmethod
    async def generate_code(self, idea: str, metadata: AppMetadata, template: str) -> List[GeneratedFile]:
        """Generate the full set of source files for the app."""


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

_WORD_RE = re.compile(r"[A-Za-z0-9]+")


def _title_from_idea(idea: str) -> str:
    """Derive a short, human-friendly app name from a free-form idea string."""
    # Skip filler words so "an app like discord" does not become "An App Like Discord"
    stop = {
        "a", "an", "the", "app", "like", "for", "with", "and", "of", "to", "in",
        "build", "create", "make", "new",
    }
    words = [w for w in _WORD_RE.findall(idea) if w.lower() not in stop][:3]
    if not words:
        words = _WORD_RE.findall(idea)[:3] or ["Nova"]
    return " ".join(word.capitalize() for word in words)


def _ticker_seed_from_name(name: str) -> str:
    """Derive a raw alphanumeric ticker seed from an app name."""
    letters = re.sub(r"[^A-Za-z0-9]", "", name).upper()
    if not letters:
        letters = "APP"
    return letters[:8] if len(letters) >= 3 else (letters + "XXX")[:3]


def _icon_url_for(metadata: AppMetadata, template: str | None = None) -> str:
    """Technological launch icon unique per app — never a Start-From brand logo."""
    _ = template
    return tech_icon_data_uri(name=metadata.name, ticker=metadata.ticker)


def _metadata_from_template(idea: str, template: str | None) -> AppMetadata | None:
    picked = pick_brand_variant(template, idea)
    if not picked:
        return None
    key, dna = picked
    return AppMetadata(
        name=dna.name,
        ticker=dna.ticker,
        description=dna.description,
        icon_prompt=(
            f"Abstract technological app icon for {dna.name} (${dna.ticker}), "
            f"dark UI, neon circuit / mesh / orbital aesthetic, no text, no logos, "
            f"not resembling {key} brand"
        ),
    )


# ---------------------------------------------------------------------------
# Mock implementation (no network, no API keys required)
# ---------------------------------------------------------------------------


class MockAIGenerator(AIGenerator):
    """Deterministic offline generator used when no OpenAI key is configured."""

    async def generate_metadata(self, idea: str, template: str | None = None) -> AppMetadata:
        from_template = _metadata_from_template(idea, template)
        if from_template:
            return from_template
        name = _title_from_idea(idea)
        ticker = _ticker_seed_from_name(name)
        description = f"{name}: {idea.strip()[:140]}"
        icon_prompt = (
            f"Abstract technological app icon for {name}, dark neon mesh, no text, no brand logos"
        )
        return AppMetadata(name=name, ticker=ticker, description=description, icon_prompt=icon_prompt)

    async def generate_icon(self, metadata: AppMetadata) -> str | None:
        return _icon_url_for(metadata)
    async def generate_code(self, idea: str, metadata: AppMetadata, template: str) -> List[GeneratedFile]:
        name = metadata.name
        safe_idea = idea.strip().replace("`", "'")
        tmpl_key = normalize_template_key(template)
        files: List[GeneratedFile] = [
            GeneratedFile(
                path="package.json",
                content=json.dumps(
                    {
                        "name": _slugify(name),
                        "private": True,
                        "version": "0.1.0",
                        "type": "module",
                        "scripts": {
                            "dev": "vite",
                            "build": "vite build",
                            "preview": "vite preview",
                        },
                        "dependencies": {
                            "react": "^18.3.1",
                            "react-dom": "^18.3.1",
                        },
                        "devDependencies": {
                            "@vitejs/plugin-react": "^4.3.1",
                            "autoprefixer": "^10.4.19",
                            "postcss": "^8.4.38",
                            "tailwindcss": "^3.4.4",
                            "vite": "^5.3.1",
                        },
                    },
                    indent=2,
                ),
            ),
            GeneratedFile(
                path="index.html",
                content=(
                    "<!doctype html>\n"
                    '<html lang="en">\n'
                    "  <head>\n"
                    '    <meta charset="UTF-8" />\n'
                    f"    <title>{name}</title>\n"
                    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
                    "  </head>\n"
                    "  <body>\n"
                    '    <div id="root"></div>\n'
                    '    <script type="module" src="/src/main.jsx"></script>\n'
                    "  </body>\n"
                    "</html>\n"
                ),
            ),
            GeneratedFile(
                path="src/main.jsx",
                content=(
                    "import React from 'react'\n"
                    "import ReactDOM from 'react-dom/client'\n"
                    "import App from './App.jsx'\n"
                    "import './index.css'\n\n"
                    "ReactDOM.createRoot(document.getElementById('root')).render(\n"
                    "  <React.StrictMode>\n"
                    "    <App />\n"
                    "  </React.StrictMode>,\n"
                    ")\n"
                ),
            ),
            GeneratedFile(
                path="src/App.jsx",
                content=template_app_jsx(tmpl_key, name, safe_idea),
            ),
            GeneratedFile(
                path="src/index.css",
                content=(
                    "@tailwind base;\n"
                    "@tailwind components;\n"
                    "@tailwind utilities;\n"
                ),
            ),
            GeneratedFile(
                path="tailwind.config.js",
                content=(
                    "/** @type {import('tailwindcss').Config} */\n"
                    "export default {\n"
                    "  content: ['./index.html', './src/**/*.{js,jsx}'],\n"
                    "  theme: {\n"
                    "    extend: {},\n"
                    "  },\n"
                    "  plugins: [],\n"
                    "}\n"
                ),
            ),
            GeneratedFile(
                path="postcss.config.js",
                content=(
                    "export default {\n"
                    "  plugins: {\n"
                    "    tailwindcss: {},\n"
                    "    autoprefixer: {},\n"
                    "  },\n"
                    "}\n"
                ),
            ),
            GeneratedFile(
                path="vite.config.js",
                content=(
                    "import { defineConfig } from 'vite'\n"
                    "import react from '@vitejs/plugin-react'\n\n"
                    "export default defineConfig({\n"
                    "  plugins: [react()],\n"
                    "})\n"
                ),
            ),
            GeneratedFile(
                path="README.md",
                content=(
                    f"# {name}\n\n"
                    f"Generated by CodeIn (mock mode) from the idea:\n\n> {safe_idea}\n\n"
                    "## Run locally\n\n```bash\nnpm install\nnpm run dev\n```\n"
                ),
            ),
        ]
        return files


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "codein-app"


# ---------------------------------------------------------------------------
# Real OpenAI-backed implementation
# ---------------------------------------------------------------------------


class OpenAIGenerator(AIGenerator):
    """GPT-4o (text/code) + DALL-E 3 (icon) backed generator."""

    TEXT_MODEL = "gpt-4o"
    IMAGE_MODEL = "dall-e-3"

    def __init__(self) -> None:
        from openai import AsyncOpenAI

        self._text_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        # DALL-E may use a distinct key; fall back to the main OpenAI key.
        image_key = settings.dalle_api_key
        self._image_client = (
            AsyncOpenAI(api_key=image_key) if image_key != settings.OPENAI_API_KEY else self._text_client
        )

    async def generate_metadata(self, idea: str, template: str | None = None) -> AppMetadata:
        template_hint = ""
        key = normalize_template_key(template)
        if key:
            template_hint = (
                f" The product is inspired by {key}, but invent an ORIGINAL brand name "
                f"(not the word {key}). Ticker must feel unique to that brand.\n"
            )
        prompt = (
            "You are helping launch a tiny app+token on a crypto launchpad. "
            "Given the app idea below, respond with STRICT JSON only "
            '(no markdown fences) with keys: "name" (short catchy ORIGINAL app name, '
            '<= 3 words, never copy a famous brand name), "ticker" (3-8 uppercase '
            "alphanumeric characters, no $ sign), \"description\" (one sentence, <= 180 chars), "
            'and "icon_prompt" (short visual description for an abstract technological '
            "app icon: dark, neon, circuit/mesh/orbital, no text, no famous brand logos).\n"
            f"{template_hint}\n"
            f"Idea: {idea}\n"
            f"Template: {template or 'custom'}"
        )
        try:
            response = await self._text_client.chat.completions.create(
                model=self.TEXT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            raw = response.choices[0].message.content or "{}"
            data = json.loads(raw)
            name = str(data.get("name") or _title_from_idea(idea))
            ticker = str(data.get("ticker") or _ticker_seed_from_name(name))
            description = str(data.get("description") or f"{name} app")
            icon_prompt = str(data.get("icon_prompt") or f"App icon for {name}")
            return AppMetadata(name=name, ticker=ticker, description=description, icon_prompt=icon_prompt)
        except Exception:  # noqa: BLE001
            logger.exception("OpenAI metadata generation failed, falling back to heuristic metadata")
            name = _title_from_idea(idea)
            return AppMetadata(
                name=name,
                ticker=_ticker_seed_from_name(name),
                description=f"{name} — generated from: {idea.strip()[:160]}",
                icon_prompt=f"App icon for {name}",
            )

    async def generate_icon(self, metadata: AppMetadata) -> str | None:
        try:
            response = await self._image_client.images.generate(
                model=self.IMAGE_MODEL,
                prompt=metadata.icon_prompt,
                size="1024x1024",
                n=1,
            )
            if response.data:
                return response.data[0].url
        except Exception:  # noqa: BLE001
            logger.exception("DALL-E icon generation failed, falling back to tech SVG")
        return tech_icon_data_uri(name=metadata.name, ticker=metadata.ticker)

    async def generate_code(self, idea: str, metadata: AppMetadata, template: str) -> List[GeneratedFile]:
        prompt = (
            "Generate a small, working React + Tailwind CSS single-page app "
            f"for the idea: \"{idea}\" (app name: {metadata.name}, template: {template}). "
            "Respond with STRICT JSON only (no markdown fences): "
            '{"files": [{"path": "...", "content": "..."}, ...]}. '
            "Include at minimum: package.json, index.html, src/main.jsx, "
            "src/App.jsx, src/index.css, tailwind.config.js, postcss.config.js, "
            "vite.config.js. Keep the app small and functional."
        )
        try:
            response = await self._text_client.chat.completions.create(
                model=self.TEXT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.5,
            )
            raw = response.choices[0].message.content or "{}"
            data = json.loads(raw)
            files_data = data.get("files") or []
            files = [
                GeneratedFile(path=str(f["path"]), content=str(f.get("content", "")))
                for f in files_data
                if "path" in f
            ]
            if files:
                return files
            logger.warning("OpenAI returned no files, falling back to mock codegen")
        except Exception:  # noqa: BLE001
            logger.exception("OpenAI code generation failed, falling back to mock codegen")

        # Fall back to the deterministic mock generator rather than failing
        # the whole pipeline if the model returns something unusable.
        return await MockAIGenerator().generate_code(idea, metadata, template)


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------


def get_ai_generator() -> AIGenerator:
    """Return the AI generator adapter appropriate for the current config."""
    if settings.openai_mock_enabled:
        return MockAIGenerator()
    return OpenAIGenerator()
