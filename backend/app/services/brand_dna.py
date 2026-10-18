"""Start-From brand DNA: multiple launch variants + SVG marks per template family.

Each template (discord, chrome, …) has a pool of original product names/tickers.
Every preview/create picks a random variant so relaunches never feel copy-pasted.
Icons are inline SVG data URIs — distinct glyphs + brand colors, no CDN.
"""

from __future__ import annotations

import re
import secrets
from dataclasses import dataclass
from typing import Optional
from urllib.parse import quote


@dataclass(frozen=True)
class BrandVariant:
    name: str
    ticker: str
    description: str
    hue: str  # hex without #
    glyph: str


_BRAND_POOLS: dict[str, list[BrandVariant]] = {
    "discord": [
        BrandVariant("PulseCord", "PULSE", "Servers, voice rooms, and community chat for builders who ship live.", "5865F2", "pulse"),
        BrandVariant("RelayHQ", "RELAY", "Low-latency guilds, stages, and threaded chats for creator crews.", "4752C4", "relay"),
        BrandVariant("Clanwave", "CLAN", "Roles, boosts, and always-on voice lobbies for gaming communities.", "7289DA", "clan"),
        BrandVariant("NexusChat", "NEXUS", "Channels, DMs, and reaction culture without the clutter.", "404EED", "nexus"),
        BrandVariant("VoxLink", "VOX", "Screen share, stage events, and friends list built for live collab.", "5B6CFF", "vox"),
    ],
    "chrome": [
        BrandVariant("Orbit", "ORBIT", "Lightning tabs, omnibox search, and syncable workspace spaces.", "4285F4", "orbit"),
        BrandVariant("Aether", "AETHER", "Privacy-first browsing with profiles, reader mode, and vertical tabs.", "1A73E8", "aether"),
        BrandVariant("Tabforge", "TABFRG", "Grouped tabs, workspace switcher, and cold-start that stays snappy.", "EA4335", "tab"),
        BrandVariant("PrismNav", "PRISM", "Color-coded spaces, extensions, and a buttery omnibox.", "FBBC05", "prism"),
        BrandVariant("Swiftpane", "SWIFT", "Memory-smart profiles and one-click sync across devices.", "34A853", "swift"),
    ],
    "chatgpt": [
        BrandVariant("EchoMind", "ECHO", "Streaming AI chat with memory, tools, and a clean message canvas.", "10A37F", "echo"),
        BrandVariant("LumenAI", "LUMEN", "Multimodal studio for drafts, code, and cited tool calls.", "0D8F6E", "lumen"),
        BrandVariant("Sparkwire", "SPARK", "Custom agents, project folders, and voice-ready replies.", "12B886", "spark"),
        BrandVariant("CanvasIQ", "CVIQ", "Side-by-side chat and canvas edits with streaming tokens.", "087F5B", "canvas"),
        BrandVariant("Promptly", "PRMPT", "Fast chat with plugins, memory lanes, and paste-anything input.", "2B8A3E", "prompt"),
    ],
    "premiere-pro": [
        BrandVariant("Cutline", "CUTLN", "Magnetic timeline cuts, transitions, and one-click short-form export.", "00005B", "cut"),
        BrandVariant("FrameRush", "FRUSH", "Proxy-ready sequences, LUTs, and auto-reframe for vertical video.", "2D2D8F", "rush"),
        BrandVariant("Editbay", "EBAYX", "Ripple edits, nested sequences, and export presets that stick.", "4B4BA8", "bay"),
        BrandVariant("Reelgrid", "REEL", "Multi-track timeline for creators shipping daily cuts.", "9999FF", "reel"),
        BrandVariant("Clipforge", "CLIP", "Transitions, titles, and render queue tuned for social.", "5C5CE0", "clip"),
    ],
    "photoshop": [
        BrandVariant("Layerlab", "LAYER", "Pixel-precise layers, masks, and brushes in a modern web canvas.", "001E36", "layer"),
        BrandVariant("Maskroom", "MASK", "Nondestructive edits, heal tools, and smart object stacks.", "0D3A5C", "mask"),
        BrandVariant("Pixlforge", "PIXL", "Pen paths, type, and generative fill for campaign art.", "31A8FF", "pixl"),
        BrandVariant("Brushlane", "BRUSH", "Pressure brushes, filters, and adjustment layers that stay live.", "1473E6", "brush"),
        BrandVariant("Canvaslab", "CVLAB", "Retouch, composite, and export without destroying the source.", "2EC4FF", "cvs"),
    ],
    "notion": [
        BrandVariant("Blocknote", "BLOCK", "Nested docs, databases, and slash commands for team knowledge.", "111111", "block"),
        BrandVariant("Pagegraph", "PAGE", "Wikis, tasks, and linked databases in one permissioned graph.", "191919", "page"),
        BrandVariant("SlateHQ", "SLATE", "Templates, rollups, and AI summarize inside every workspace.", "2F2F2F", "slate"),
        BrandVariant("Nestwiki", "NEST", "Docs that branch, databases that roll up, teams that stay aligned.", "0A0A0A", "nest"),
        BrandVariant("Quillbase", "QUILL", "Slash-first writing with relations, views, and shared pages.", "3F3F3F", "quill"),
    ],
    "spotify": [
        BrandVariant("Waveform", "WAVE", "Playlists, radio, and a buttery player for music that never stops.", "1DB954", "wave"),
        BrandVariant("Groovekit", "GROOVE", "Blend playlists, lyrics sync, and discovery that actually lands.", "1ED760", "groove"),
        BrandVariant("Sonicbay", "SONIC", "Podcasts, DJ mode, and collaborative queues for every vibe.", "169C46", "sonic"),
        BrandVariant("Beatlane", "BEAT", "Radio seeds, social listening, and offline that just works.", "1AA34A", "beat"),
        BrandVariant("Amply", "AMPLY", "Artist radio, daily mixes, and a player built for long sessions.", "0F9D58", "amp"),
    ],
    "figma": [
        BrandVariant("Framekit", "FRAME", "Multiplayer frames, components, and handoff in the browser.", "A259FF", "frame"),
        BrandVariant("Vectorbay", "VECTR", "Auto-layout, variants, and Dev Mode tokens for product teams.", "F24E1E", "vector"),
        BrandVariant("ProtoLab", "PROTO", "Interactive prototypes, sticky brainstorms, and shared libraries.", "1ABCFE", "proto"),
        BrandVariant("Designops", "DOPS", "Component systems, inspect mode, and comment threads that ship.", "0ACF83", "dops"),
        BrandVariant("Boardly", "BOARD", "FigJam energy meets production frames and variant sets.", "FF7262", "board"),
    ],
}


def normalize_template_key(template: Optional[str]) -> Optional[str]:
    if not template:
        return None
    key = template.strip().lower()
    key = re.sub(r"-like$", "", key)
    key = key.replace("_", "-")
    if key in _BRAND_POOLS:
        return key
    for known in _BRAND_POOLS:
        if known in key:
            return known
    return None


def pick_brand_variant(template: Optional[str], idea: str = "") -> Optional[tuple[str, BrandVariant]]:
    """Pick a random brand variant for the template family."""
    key = normalize_template_key(template)
    if not key:
        return None
    pool = _BRAND_POOLS[key]
    # Bias by idea hash so the same brief tends toward a stable pick,
    # then flip with entropy so consecutive Start From clicks still diverge.
    if idea.strip():
        idx = sum(ord(c) for c in idea.strip().lower()) % len(pool)
        if secrets.randbelow(100) < 55:
            idx = secrets.randbelow(len(pool))
    else:
        idx = secrets.randbelow(len(pool))
    return key, pool[idx]


def all_tickers_for(template: str) -> set[str]:
    key = normalize_template_key(template)
    if not key:
        return set()
    return {v.ticker for v in _BRAND_POOLS[key]}


def find_variant(template: Optional[str], *, name: str = "", ticker: str = "") -> Optional[tuple[str, BrandVariant]]:
    """Resolve an exact brand variant by name/ticker within a template family."""
    key = normalize_template_key(template)
    if not key:
        return None
    core = re.sub(r"[^A-Za-z0-9]", "", ticker).upper()
    for v in _BRAND_POOLS[key]:
        if (core and v.ticker == core) or (name and v.name.lower() == name.lower()):
            return key, v
    return None


_TECH_PALETTES = [
    ("0B1220", "22D3EE", "6366F1"),  # cyan / indigo
    ("0F172A", "34D399", "A78BFA"),  # emerald / violet
    ("111827", "F472B6", "38BDF8"),  # pink / sky
    ("020617", "FBBF24", "F97316"),  # amber / orange
    ("0A0A0A", "4ADE80", "2DD4BF"),  # green / teal
    ("1A1033", "C084FC", "67E8F9"),  # purple / cyan
    ("0C1A1A", "2DD4BF", "FDE047"),  # teal / yellow
    ("1C1917", "FB7185", "94A3B8"),  # rose / slate
]


def _seed(s: str) -> int:
    h = 2166136261
    for ch in s:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def tech_icon_data_uri(*, name: str, ticker: str) -> str:
    """Unique technological app icon for Launches — never a Start-From brand logo."""
    seed = _seed(f"{ticker}:{name}")
    bg, a, b = _TECH_PALETTES[seed % len(_TECH_PALETTES)]
    style = seed % 6
    # Stable pseudo-random offsets from seed
    x1, y1 = 6 + (seed % 7), 6 + ((seed >> 3) % 7)
    x2, y2 = 18 + ((seed >> 5) % 8), 16 + ((seed >> 7) % 8)
    x3, y3 = 10 + ((seed >> 9) % 10), 20 + ((seed >> 11) % 6)
    r1 = 3 + (seed % 4)
    r2 = 5 + ((seed >> 2) % 5)

    if style == 0:
        # Circuit board
        inner = (
            f'<rect x="4" y="4" width="24" height="24" rx="3" fill="none" stroke="#{a}" stroke-width="0.6" opacity="0.35"/>'
            f'<path d="M6 {y1} H{x2} V{y2} H26" fill="none" stroke="#{a}" stroke-width="1.2" stroke-linecap="round"/>'
            f'<path d="M{x1} 6 V{y3} H{x3}" fill="none" stroke="#{b}" stroke-width="1.1" stroke-linecap="round"/>'
            f'<circle cx="{x2}" cy="{y1}" r="1.6" fill="#{a}"/>'
            f'<circle cx="{x3}" cy="{y3}" r="1.6" fill="#{b}"/>'
            f'<circle cx="24" cy="{y2}" r="2" fill="#{a}" opacity="0.85"/>'
            f'<rect x="8" y="22" width="6" height="3" rx="0.5" fill="#{b}" opacity="0.7"/>'
        )
    elif style == 1:
        # Orbital rings
        inner = (
            f'<circle cx="16" cy="16" r="{r2 + 6}" fill="none" stroke="#{a}" stroke-width="0.7" opacity="0.4"/>'
            f'<circle cx="16" cy="16" r="{r2 + 2}" fill="none" stroke="#{b}" stroke-width="1" opacity="0.7"/>'
            f'<circle cx="16" cy="16" r="{r1}" fill="#{a}"/>'
            f'<circle cx="{x2}" cy="{y1}" r="1.8" fill="#{b}"/>'
            f'<circle cx="{x1}" cy="{y2}" r="1.3" fill="#fff" opacity="0.8"/>'
        )
    elif style == 2:
        # Hex mesh / chip
        inner = (
            f'<polygon points="16,5 25,10 25,20 16,25 7,20 7,10" fill="none" stroke="#{a}" stroke-width="1.2"/>'
            f'<polygon points="16,9 21,12 21,18 16,21 11,18 11,12" fill="#{b}" opacity="0.35"/>'
            f'<rect x="14" y="14" width="4" height="4" rx="0.6" fill="#{a}"/>'
            f'<line x1="16" y1="5" x2="16" y2="9" stroke="#{b}" stroke-width="1"/>'
            f'<line x1="25" y1="10" x2="21" y2="12" stroke="#{a}" stroke-width="0.8"/>'
            f'<line x1="7" y1="20" x2="11" y2="18" stroke="#{b}" stroke-width="0.8"/>'
        )
    elif style == 3:
        # Neural nodes
        inner = (
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#{a}" stroke-width="1" opacity="0.7"/>'
            f'<line x1="{x2}" y1="{y2}" x2="{x3}" y2="{y3}" stroke="#{b}" stroke-width="1" opacity="0.7"/>'
            f'<line x1="{x1}" y1="{y1}" x2="{x3}" y2="{y3}" stroke="#fff" stroke-width="0.6" opacity="0.35"/>'
            f'<circle cx="{x1}" cy="{y1}" r="2.4" fill="#{a}"/>'
            f'<circle cx="{x2}" cy="{y2}" r="3" fill="#{b}"/>'
            f'<circle cx="{x3}" cy="{y3}" r="2" fill="#fff" opacity="0.85"/>'
            f'<circle cx="22" cy="8" r="1.2" fill="#{a}" opacity="0.6"/>'
        )
    elif style == 4:
        # Waveform / signal
        inner = (
            f'<rect x="5" y="5" width="22" height="22" rx="4" fill="#{a}" opacity="0.12"/>'
            f'<path d="M5 18 Q8 {10 + seed % 6} 11 16 T17 14 T23 17 T27 12" fill="none" stroke="#{a}" stroke-width="1.6" stroke-linecap="round"/>'
            f'<path d="M5 22 Q9 {14 + (seed >> 4) % 5} 13 20 T19 18 T27 20" fill="none" stroke="#{b}" stroke-width="1.2" opacity="0.8"/>'
            f'<circle cx="27" cy="12" r="1.5" fill="#{a}"/>'
        )
    else:
        # Isometric stack / layers
        inner = (
            f'<path d="M16 6 L26 12 L16 18 L6 12 Z" fill="#{a}" opacity="0.9"/>'
            f'<path d="M6 12 L16 18 L16 26 L6 20 Z" fill="#{b}" opacity="0.75"/>'
            f'<path d="M26 12 L16 18 L16 26 L26 20 Z" fill="#fff" opacity="0.25"/>'
            f'<path d="M16 10 L22 13.5 L16 17 L10 13.5 Z" fill="#0B1220" opacity="0.35"/>'
        )

    letter = (ticker or name or "A")[:1].upper()
    mono = (
        f'<text x="26" y="28" text-anchor="end" fill="#fff" font-family="ui-monospace,monospace" '
        f'font-size="5" font-weight="700" opacity="0.45">{letter}</text>'
    )

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
        f"<defs>"
        f'<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0%" stop-color="#{bg}"/>'
        f'<stop offset="100%" stop-color="#020617"/>'
        f"</linearGradient>"
        f"</defs>"
        f'<rect width="32" height="32" rx="7" fill="url(#g)"/>'
        f'<rect width="32" height="32" rx="7" fill="#{a}" opacity="0.08"/>'
        f"{inner}{mono}"
        f"</svg>"
    )
    return "data:image/svg+xml," + quote(svg, safe="")


def svg_icon_data_uri(variant: BrandVariant, template_key: str = "") -> str:
    """Back-compat wrapper: launches always get tech icons, not brand glyphs."""
    _ = template_key
    return tech_icon_data_uri(name=variant.name, ticker=variant.ticker)


def template_app_jsx(template_key: Optional[str], name: str, idea: str) -> str:
    """Distinct mock App.jsx shell so generated projects feel template-specific."""
    safe = idea.strip().replace("`", "'").replace("${", "\\${")[:180]
    key = template_key or "custom"

    if key == "discord":
        return f"""import {{ useState }} from 'react'

const CHANNELS = ['general', 'ship-log', 'voice-lobby', 'memes']

export default function App() {{
  const [channel, setChannel] = useState('general')
  const [msg, setMsg] = useState('')
  const [feed, setFeed] = useState([{{ who: 'system', text: 'Welcome to {name}' }}])

  return (
    <div className="min-h-screen bg-[#1e1f22] text-slate-100 flex">
      <aside className="w-52 bg-[#2b2d31] p-3 flex flex-col gap-1">
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">{name}</div>
        {{CHANNELS.map((c) => (
          <button key={{c}} onClick={{() => setChannel(c)}}
            className={{`text-left px-2 py-1.5 rounded text-sm ${{channel === c ? 'bg-[#404249] text-white' : 'text-slate-400 hover:bg-[#35373c]'}}`}}>
            # {{c}}
          </button>
        ))}}
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="border-b border-white/5 px-4 py-3 text-sm font-semibold"># {{channel}}</header>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {{feed.map((m, i) => (
            <div key={{i}}><span className="text-indigo-300 font-medium">{{m.who}}</span>
              <span className="text-slate-300 ml-2">{{m.text}}</span></div>
          ))}}
        </div>
        <form className="p-3" onSubmit={{(e) => {{ e.preventDefault(); if (!msg.trim()) return; setFeed((f) => [...f, {{ who: 'you', text: msg }}]); setMsg('') }}}}>
          <input value={{msg}} onChange={{(e) => setMsg(e.target.value)}} placeholder="Message #{{channel}}"
            className="w-full rounded-lg bg-[#383a40] px-3 py-2 text-sm outline-none" />
        </form>
        <p className="px-3 pb-3 text-[10px] text-slate-500">{safe}</p>
      </main>
    </div>
  )
}}
"""

    if key == "chrome":
        return f"""import {{ useState }} from 'react'

export default function App() {{
  const [url, setUrl] = useState('https://{name.lower().replace(" ", "")}.app')
  const [tabs, setTabs] = useState(['Home', 'Search', 'Docs'])
  const [active, setActive] = useState(0)

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 flex flex-col">
      <div className="flex gap-1 bg-slate-300 px-2 pt-2">
        {{tabs.map((t, i) => (
          <button key={{t}} onClick={{() => setActive(i)}}
            className={{`px-3 py-1.5 rounded-t text-xs ${{i === active ? 'bg-white' : 'bg-slate-300/80'}}`}}>{{t}}</button>
        ))}}
        <button onClick={{() => setTabs((t) => [...t, `Tab ${{t.length + 1}}`])}} className="px-2 text-xs">+</button>
      </div>
      <div className="bg-white flex items-center gap-2 px-3 py-2 border-b">
        <span className="text-xs text-slate-400">⟳</span>
        <input value={{url}} onChange={{(e) => setUrl(e.target.value)}}
          className="flex-1 rounded-full bg-slate-100 px-4 py-1.5 text-sm" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-6">
          <h1 className="text-3xl font-bold mb-2">{name}</h1>
          <p className="text-slate-500 text-sm">{safe}</p>
        </div>
      </div>
    </div>
  )
}}
"""

    if key == "chatgpt":
        return f"""import {{ useState }} from 'react'

export default function App() {{
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([{{ role: 'assistant', text: 'Hey — I am {name}. What are we building?' }}])

  function send(e) {{
    e.preventDefault()
    if (!input.trim()) return
    const q = input
    setMsgs((m) => [...m, {{ role: 'user', text: q }}, {{ role: 'assistant', text: `Streaming a take on: ${{q.slice(0, 80)}}…` }}])
    setInput('')
  }}

  return (
    <div className="min-h-screen bg-[#212121] text-slate-100 flex flex-col items-center">
      <header className="w-full max-w-2xl px-4 py-4 text-sm text-slate-400">{name}</header>
      <div className="flex-1 w-full max-w-2xl px-4 space-y-4 overflow-auto pb-4">
        {{msgs.map((m, i) => (
          <div key={{i}} className={{m.role === 'user' ? 'text-right' : ''}}>
            <div className={{`inline-block rounded-2xl px-4 py-2 text-sm max-w-[85%] ${{m.role === 'user' ? 'bg-[#2f2f2f]' : 'bg-transparent'}}`}}>
              {{m.text}}
            </div>
          </div>
        ))}}
      </div>
      <form onSubmit={{send}} className="w-full max-w-2xl px-4 pb-6">
        <input value={{input}} onChange={{(e) => setInput(e.target.value)}} placeholder="Message {name}"
          className="w-full rounded-2xl bg-[#2f2f2f] px-4 py-3 text-sm outline-none ring-1 ring-white/10" />
        <p className="mt-2 text-[10px] text-slate-500">{safe}</p>
      </form>
    </div>
  )
}}
"""

    if key == "spotify":
        return f"""import {{ useState }} from 'react'

const TRACKS = ['Midnight Run', 'Glass House', 'Neon Drift', 'Low Tide']

export default function App() {{
  const [track, setTrack] = useState(TRACKS[0])
  const [playing, setPlaying] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-1">{name}</h1>
        <p className="text-sm text-neutral-400 mb-8">{safe}</p>
        <div className="grid gap-2 max-w-md">
          {{TRACKS.map((t) => (
            <button key={{t}} onClick={{() => {{ setTrack(t); setPlaying(true) }}}}
              className={{`text-left px-3 py-2 rounded ${{t === track ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'hover:bg-white/5'}}`}}>
              {{t}}
            </button>
          ))}}
        </div>
      </div>
      <footer className="border-t border-white/10 px-6 py-4 flex items-center gap-4 bg-neutral-950">
        <button onClick={{() => setPlaying((p) => !p)}}
          className="h-10 w-10 rounded-full bg-[#1DB954] text-black font-bold">{{playing ? '❚❚' : '▶'}}</button>
        <div>
          <div className="text-sm font-medium">{{track}}</div>
          <div className="text-xs text-neutral-500">{name} Radio</div>
        </div>
      </footer>
    </div>
  )
}}
"""

    if key in ("premiere-pro", "photoshop", "figma", "notion"):
        accents = {
            "premiere-pro": ("#9999FF", "Timeline"),
            "photoshop": ("#31A8FF", "Layers"),
            "figma": ("#A259FF", "Frames"),
            "notion": ("#e5e5e5", "Pages"),
        }
        accent, panel = accents[key]
        return f"""import {{ useState }} from 'react'

export default function App() {{
  const [sel, setSel] = useState(0)
  const items = ['Draft A', 'Draft B', 'Export']

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-slate-100 flex">
      <aside className="w-44 border-r border-white/10 p-3 space-y-1">
        <div className="text-xs uppercase tracking-widest mb-3" style={{{{ color: '{accent}' }}}}>{panel}</div>
        {{items.map((it, i) => (
          <button key={{it}} onClick={{() => setSel(i)}}
            className={{`block w-full text-left text-sm px-2 py-1.5 rounded ${{sel === i ? 'bg-white/10' : 'hover:bg-white/5'}}`}}>
            {{it}}
          </button>
        ))}}
      </aside>
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg aspect-video rounded-lg border border-white/10 bg-black/40 flex items-center justify-center mb-4"
          style={{{{ boxShadow: `inset 0 0 0 1px {accent}33` }}}}>
          <span className="text-sm text-slate-400">{{items[sel]}} canvas</span>
        </div>
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="text-slate-400 text-sm mt-2 text-center max-w-md">{safe}</p>
      </main>
    </div>
  )
}}
"""

    # default
    return f"""import {{ useState }} from 'react'

export default function App() {{
  const [count, setCount] = useState(0)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight mb-3">{name}</h1>
        <p className="text-slate-400 leading-relaxed">{safe}</p>
      </div>
      <button onClick={{() => setCount((c) => c + 1)}}
        className="rounded-xl bg-indigo-500 hover:bg-indigo-400 px-6 py-3 font-semibold">
        Clicked {{count}} times
      </button>
    </div>
  )
}}
"""
