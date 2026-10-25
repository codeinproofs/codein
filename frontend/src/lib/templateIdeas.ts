/** Rich start-from prompts so each template produces a distinct draft. */

const TEMPLATE_IDEAS: Record<string, string> = {
  discord:
    "a realtime community chat with servers, channels, and voice rooms for creators",
  chrome: "a fast multi-tab browser with omnibox search, profiles, and synced spaces",
  chatgpt: "an AI chat studio with streaming replies, memory, and tool plugins",
  "premiere-pro": "a timeline video editor with magnetic cuts, transitions, and export presets",
  photoshop: "a layer-based image editor with masks, brushes, and nondestructive effects",
  notion: "a nested docs workspace with databases, slash commands, and team pages",
  spotify: "a music player with playlists, radio, lyrics, and social listening",
  figma: "a multiplayer design tool with frames, components, and developer handoff",
};

/** Extra spice so each Start From click feels like a fresh brief. */
const SPICES: Record<string, string[]> = {
  discord: [
    "focus on stage channels and reaction roles",
    "add threaded discussions and boost tiers",
    "prioritize low-latency voice and screen share",
    "ship mobile-first DMs and friends list",
  ],
  chrome: [
    "emphasize vertical tabs and workspace groups",
    "include reader mode and privacy shields",
    "add extension marketplace hooks",
    "optimize cold-start and memory profiles",
  ],
  chatgpt: [
    "add project folders and custom GPTs",
    "stream tool calls with citations",
    "include voice mode and canvas edits",
    "support multimodal paste and file drop",
  ],
  "premiere-pro": [
    "target short-form vertical export",
    "add ripple edit and nested sequences",
    "include LUTs and auto-reframe",
    "ship proxy workflow for 4K",
  ],
  photoshop: [
    "focus on generative fill and heal",
    "add adjustment layers and smart objects",
    "include pen tool paths and type",
    "ship non-destructive filter stacks",
  ],
  notion: [
    "add linked databases and rollups",
    "include AI summarize and Q&A",
    "ship wiki + tasks in one graph",
    "focus on templates and permissions",
  ],
  spotify: [
    "add collaborative playlists and blend",
    "include lyrics sync and queue radio",
    "ship podcasts alongside music",
    "focus on DJ mode and discovery",
  ],
  figma: [
    "add auto-layout and variants",
    "include FigJam sticky brainstorm",
    "ship Dev Mode inspect tokens",
    "focus on component libraries",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function ideaForTemplate(templateId: string): string {
  const base =
    TEMPLATE_IDEAS[templateId] ?? `a polished product inspired by ${templateId}`;
  const spices = SPICES[templateId];
  if (!spices?.length) return base;
  return `${base}; ${pick(spices)}`;
}

export function templateKeyFromField(template: string | null | undefined): string | null {
  if (!template) return null;
  const key = template.toLowerCase().replace(/-like$/, "");
  if (key in TEMPLATE_IDEAS) return key;
  for (const id of Object.keys(TEMPLATE_IDEAS)) {
    if (key.includes(id)) return id;
  }
  return null;
}
