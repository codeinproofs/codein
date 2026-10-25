/**
 * useCommandParser
 * -----------------
 * Parses terminal-style input of the shape:
 *
 *   create new --like discord
 *   create new "a chat app with voice"
 *   create new --like discord "with nitro features"
 *
 * Grammar (informal):
 *   <command>        := "create" | "help" | "clear"
 *   <subject>        := "new" | <anything>            (optional, "create" implies "new")
 *   --like <template> := flag, single bare word naming a reference app
 *   "<idea>"          := one or more quoted spans, concatenated with a space
 *
 * At least one of `--like <template>` or a quoted idea is required for a
 * "create" command to be considered complete / submittable.
 */
import { useMemo } from "react";
import type { AutocompleteSuggestion, ParsedCommand } from "@/types/app";

export const LIKE_TEMPLATES: AutocompleteSuggestion[] = [
  { label: "--like discord", value: "discord", description: "Chat, servers, voice channels" },
  { label: "--like chrome", value: "chrome", description: "Tabs, bookmarks, omnibox" },
  { label: "--like chatgpt", value: "chatgpt", description: "Chat UI with streaming replies" },
  { label: "--like premiere-pro", value: "premiere-pro", description: "Timeline, cuts, export" },
  { label: "--like photoshop", value: "photoshop", description: "Layers, canvas, tools" },
  { label: "--like notion", value: "notion", description: "Blocks, docs, nested pages" },
  { label: "--like spotify", value: "spotify", description: "Player, playlists, queue" },
  { label: "--like figma", value: "figma", description: "Frames, components, design" },
];

/** Tokenize while keeping "..." / '...' spans intact as single tokens. */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    const quoted = match[1] ?? match[2];
    if (quoted !== undefined) {
      tokens.push(`__QUOTED__${quoted}`);
    } else if (match[3]) {
      tokens.push(match[3]);
    }
  }
  return tokens;
}

export function parseCommand(raw: string): ParsedCommand {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return {
      raw,
      command: "unknown",
      subject: null,
      like: null,
      idea: null,
      isComplete: false,
      hint: 'Type a command, e.g. create new --like discord',
    };
  }

  const tokens = tokenize(trimmed);
  const first = tokens[0]?.toLowerCase();

  if (first === "help") {
    return {
      raw,
      command: "help",
      subject: null,
      like: null,
      idea: null,
      isComplete: true,
      hint: "Showing help.",
    };
  }

  if (first === "clear") {
    return {
      raw,
      command: "clear",
      subject: null,
      like: null,
      idea: null,
      isComplete: true,
      hint: "Clearing terminal.",
    };
  }

  if (first !== "create") {
    return {
      raw,
      command: "unknown",
      subject: null,
      like: null,
      idea: null,
      isComplete: false,
      hint: `Unknown command "${tokens[0] ?? ""}". Try: create new --like discord`,
    };
  }

  let subject: string | null = null;
  let like: string | null = null;
  const ideaParts: string[] = [];

  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.startsWith("__QUOTED__")) {
      ideaParts.push(tok.slice("__QUOTED__".length));
      continue;
    }
    const lower = tok.toLowerCase();
    if (lower === "--like" || lower === "-like") {
      const next = tokens[i + 1];
      if (next && !next.startsWith("--")) {
        like = next.replace(/^__QUOTED__/, "").toLowerCase();
        i++;
      }
      continue;
    }
    if (subject === null && (lower === "new" || lower === "an" || lower === "a")) {
      subject = "new";
      continue;
    }
    // Any other bare word before the first flag/quote is treated as part
    // of the subject phrase (e.g. "create app --like discord").
    if (subject === null) {
      subject = tok;
    }
  }

  const idea = ideaParts.length > 0 ? ideaParts.join(" ").trim() : null;
  const isComplete = Boolean(like || idea);

  let hint: string;
  if (isComplete) {
    const parts = [];
    if (like) parts.push(`template: ${like}`);
    if (idea) parts.push(`idea: "${idea}"`);
    hint = `Ready to launch: ${parts.join(", ")}`;
  } else {
    hint = 'Add --like <app> or a quoted idea, e.g. create new --like discord "with nitro features"';
  }

  return {
    raw,
    command: "create",
    subject: subject ?? "new",
    like,
    idea,
    isComplete,
    hint,
  };
}

/** Build the final free-text prompt sent to the backend from a parsed command. */
export function buildPrompt(parsed: ParsedCommand): string {
  if (parsed.like && parsed.idea) {
    return `Build an app like ${parsed.like}, ${parsed.idea}`;
  }
  if (parsed.like) {
    return `Build an app like ${parsed.like}`;
  }
  if (parsed.idea) {
    return parsed.idea;
  }
  return "";
}

export function getAutocompleteSuggestions(input: string): AutocompleteSuggestion[] {
  const lower = input.toLowerCase();
  const likeIdx = lower.lastIndexOf("--like");
  if (likeIdx === -1) {
    // Suggest the base commands when the input is empty / just starting out.
    if (lower.trim().length === 0 || "create new".startsWith(lower.trim())) {
      return LIKE_TEMPLATES;
    }
    return [];
  }
  const afterFlag = input.slice(likeIdx + "--like".length).trim().toLowerCase();
  return LIKE_TEMPLATES.filter((s) => s.value.startsWith(afterFlag));
}

export function useCommandParser(input: string): {
  parsed: ParsedCommand;
  prompt: string;
  suggestions: AutocompleteSuggestion[];
} {
  const parsed = useMemo(() => parseCommand(input), [input]);
  const prompt = useMemo(() => buildPrompt(parsed), [parsed]);
  const suggestions = useMemo(() => getAutocompleteSuggestions(input), [input]);
  return { parsed, prompt, suggestions };
}
