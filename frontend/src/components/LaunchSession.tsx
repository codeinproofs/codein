import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, ApiError } from "@/services/api";
import type { AppPreview, ParsedCommand } from "@/types/app";
import AppIcon from "@/components/AppIcon";
import { ideaForTemplate } from "@/lib/templateIdeas";

type LineKind = "sys" | "ok" | "warn" | "err" | "cmd" | "dim" | "accent";

interface LogLine {
  id: string;
  kind: LineKind;
  text: string;
}

interface Draft {
  idea: string;
  template: string;
  name: string;
  ticker: string;
  description: string;
  iconUrl: string | null;
  mock: boolean;
}

type Phase = "booting" | "ready" | "launching" | "done";

interface LaunchSessionProps {
  rawCommand: string;
  parsed: ParsedCommand;
  walletAddress: string | null;
  onClose: () => void;
  onLaunched: (appId: string) => void;
}

const HELP = [
  "confirm | y | launch     mint coin + start build",
  "cancel  | n | abort      discard draft",
  "show                     print draft card",
  "edit name <text>         set app name",
  "edit ticker <$TICKER>    set ticker ($ + 3-8)",
  "edit desc <text>         set description",
  "status                   session + wallet",
  "clear                    clear log buffer",
  "help                     this list",
];

function kindClass(kind: LineKind): string {
  switch (kind) {
    case "ok":
      return "text-term-green";
    case "warn":
      return "text-amber-400/90";
    case "err":
      return "text-status-failed";
    case "cmd":
      return "text-gray-200";
    case "accent":
      return "text-accent-blue";
    case "dim":
      return "text-term-dim";
    default:
      return "text-gray-400";
  }
}

function normalizeTicker(raw: string): string {
  const core = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
  return core ? `$${core}` : "$";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

let lineSeq = 0;
function lid() {
  lineSeq += 1;
  return `l-${lineSeq}`;
}

/**
 * Interactive launch terminal: logs stream in, then you drive the flow with commands.
 */
export default function LaunchSession({
  rawCommand,
  parsed,
  walletAddress,
  onClose,
  onLaunched,
}: LaunchSessionProps) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [phase, setPhase] = useState<Phase>("booting");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const push = useCallback((kind: LineKind, text: string) => {
    setLines((prev) => [...prev, { id: lid(), kind, text }]);
  }, []);

  const pushMany = useCallback(async (items: Array<[LineKind, string, number?]>) => {
    for (const [kind, text, delay = 180] of items) {
      if (abortRef.current) return;
      push(kind, text);
      await sleep(delay);
    }
  }, [push]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lines, phase]);

  useEffect(() => {
    if (phase === "ready") inputRef.current?.focus();
  }, [phase]);

  // Boot sequence: logs → preview API → ready prompt
  useEffect(() => {
    abortRef.current = false;
    let cancelled = false;

    async function boot() {
      const idea =
        parsed.idea ||
        (parsed.like ? ideaForTemplate(parsed.like) : rawCommand) ||
        rawCommand;
      const template = parsed.like ? `${parsed.like}-like` : "react-tailwind";

      await pushMany([
        ["cmd", `$ ${rawCommand}`, 120],
        ["sys", "codein session started", 200],
        ["dim", "parsing argv…", 220],
        ["ok", `idea      ${idea}`, 200],
        ["ok", `template  ${template}`, 200],
        ["dim", "requesting draft metadata (POST /apps/preview)…", 280],
      ]);

      if (cancelled || abortRef.current) return;

      try {
        const preview: AppPreview = await api.previewApp({ idea, template });
        if (cancelled || abortRef.current) return;

        const next: Draft = {
          idea,
          template,
          name: preview.name,
          ticker: preview.ticker.startsWith("$") ? preview.ticker : `$${preview.ticker}`,
          description: preview.description,
          iconUrl: preview.icon_url ?? null,
          mock: preview.mock,
        };
        setDraft(next);

        await pushMany([
          ["ok", "preview ready", 160],
          ["ok", `mark      ${next.iconUrl ? "tech launch icon" : "pending"}`, 140],
          ["dim", "─".repeat(42), 80],
          ["accent", `  name     ${next.name}`, 120],
          ["accent", `  ticker   ${next.ticker}`, 120],
          ["dim", `  desc     ${next.description.slice(0, 72)}${next.description.length > 72 ? "…" : ""}`, 140],
          ["dim", `  mode     ${next.mock ? "mock adapters" : "live keys"}`, 120],
          ["dim", `  wallet   ${walletAddress ? walletAddress.slice(0, 8) + "…" : "none (demo)"}`, 140],
          ["dim", "─".repeat(42), 80],
          ["sys", "awaiting command. type help for actions.", 200],
          ["warn", "nothing is minted until you type: confirm", 220],
        ]);
        if (!cancelled) setPhase("ready");
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "preview failed";
        push("err", `error: ${msg}`);
        push("dim", "type cancel to close, or retry from the prompt above.");
        setPhase("ready");
      }
    }

    void boot();
    return () => {
      cancelled = true;
      abortRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function printShow(d: Draft) {
    push("dim", "─ draft ─");
    push("accent", `name     ${d.name}`);
    push("accent", `ticker   ${d.ticker}`);
    push("dim", `desc     ${d.description}`);
    push("dim", `template ${d.template}`);
    push("dim", "─────────");
  }

  async function runLaunch(d: Draft) {
    setPhase("launching");
    setBusy(true);
    await pushMany([
      ["sys", "confirm accepted", 150],
      ["dim", "locking draft…", 180],
      ["dim", "POST /apps/create …", 260],
    ]);
    try {
      const res = await api.createApp({
        idea: d.idea,
        template: d.template,
        owner_wallet: walletAddress,
        name: d.name,
        ticker: d.ticker,
        description: d.description,
      });
      await pushMany([
        ["ok", `app id    ${res.id}`, 160],
        ["ok", `ticker    ${res.ticker}`, 140],
        ["ok", `status    ${res.status}`, 140],
        ["sys", "pipeline queued (icon → code → pump.fun → vercel)", 220],
        ["accent", "opening build stream…", 280],
      ]);
      setPhase("done");
      await sleep(500);
      onLaunched(res.id);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "launch failed";
      push("err", `error: ${msg}`);
      push("dim", "you can type confirm again, or cancel.");
      setPhase("ready");
      setBusy(false);
    }
  }

  async function handleSessionCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || busy || phase === "booting" || phase === "launching") return;

    push("cmd", `› ${trimmed}`);
    setInput("");

    const lower = trimmed.toLowerCase();
    const [head, ...rest] = trimmed.split(/\s+/);
    const cmd = head.toLowerCase();
    const arg = rest.join(" ").trim();

    if (cmd === "help" || cmd === "?") {
      HELP.forEach((h) => push("dim", h));
      return;
    }

    if (cmd === "clear") {
      setLines([]);
      push("dim", "buffer cleared. type help.");
      return;
    }

    if (cmd === "cancel" || cmd === "n" || cmd === "no" || cmd === "abort" || cmd === "exit" || cmd === "q") {
      push("warn", "session aborted. draft discarded.");
      await sleep(350);
      onClose();
      return;
    }

    if (cmd === "status") {
      push("dim", `phase    ${phase}`);
      push("dim", `wallet   ${walletAddress ?? "disconnected"}`);
      if (draft) printShow(draft);
      return;
    }

    if (cmd === "show" || cmd === "preview" || cmd === "ls") {
      if (!draft) {
        push("err", "no draft yet.");
        return;
      }
      printShow(draft);
      return;
    }

    if (cmd === "edit") {
      if (!draft) {
        push("err", "no draft to edit.");
        return;
      }
      const field = (rest[0] || "").toLowerCase();
      const value = rest.slice(1).join(" ").trim();
      if (!field || !value) {
        push("warn", "usage: edit name|ticker|desc <value>");
        return;
      }
      if (field === "name") {
        setDraft({ ...draft, name: value });
        push("ok", `name → ${value}`);
        return;
      }
      if (field === "ticker") {
        const t = normalizeTicker(value);
        if (!/^\$[A-Z0-9]{3,8}$/.test(t)) {
          push("err", "ticker must be $ + 3-8 letters/numbers");
          return;
        }
        setDraft({ ...draft, ticker: t });
        push("ok", `ticker → ${t}`);
        return;
      }
      if (field === "desc" || field === "description") {
        setDraft({ ...draft, description: value });
        push("ok", "description updated");
        return;
      }
      push("err", `unknown field '${field}'. use name|ticker|desc`);
      return;
    }

    if (
      cmd === "confirm" ||
      cmd === "y" ||
      cmd === "yes" ||
      cmd === "launch" ||
      cmd === "go" ||
      lower === "confirm launch"
    ) {
      if (!draft) {
        push("err", "nothing to launch.");
        return;
      }
      if (!/^\$[A-Z0-9]{3,8}$/.test(draft.ticker)) {
        push("err", "fix ticker first: edit ticker $NAME");
        return;
      }
      await runLaunch(draft);
      return;
    }

    push("err", `unknown command: ${cmd}`);
    push("dim", "type help");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSessionCommand(input);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 18, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 overflow-hidden"
      >
        <div className="terminal-frame crt-screen overflow-hidden rounded-xl shadow-terminal">
          <div className="flex items-center gap-2 border-b border-term-border/80 bg-black/35 px-4 py-2.5">
            <button
              type="button"
              aria-label="Close session"
              onClick={onClose}
              className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] hover:brightness-110"
            />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-[11px] tracking-wide text-term-dim">
              codein / launch-session
            </span>
            {draft && (
              <span className="ml-3 flex items-center gap-2 min-w-0">
                <AppIcon
                  name={draft.name}
                  ticker={draft.ticker}
                  iconUrl={draft.iconUrl}
                  template={draft.template}
                  size={16}
                />
                <span className="truncate font-mono text-[11px] text-gray-300">
                  {draft.name}{" "}
                  <span className="text-accent-blue">{draft.ticker}</span>
                </span>
              </span>
            )}
            <span className="ml-auto font-mono text-[10px] text-term-dim">
              {phase === "booting" && "booting…"}
              {phase === "ready" && "interactive"}
              {phase === "launching" && "launching…"}
              {phase === "done" && "done"}
            </span>
          </div>

          <div className="max-h-[340px] overflow-y-auto bg-[#08080e] px-4 py-3 font-mono text-[12.5px] leading-[1.65]">
            {lines.map((line) => (
              <div key={line.id} className={`${kindClass(line.kind)} whitespace-pre-wrap break-words`}>
                {line.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-term-border/80 bg-black/40 px-4 py-2.5">
            <span className="shrink-0 font-mono text-[12px] text-accent-blue">›</span>
            <input
              ref={inputRef}
              value={input}
              disabled={busy || phase === "booting" || phase === "launching" || phase === "done"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                phase === "booting"
                  ? "booting…"
                  : phase === "launching"
                    ? "launching…"
                    : "confirm | edit name … | help"
              }
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-term-green outline-none placeholder:text-term-dim/50 disabled:opacity-40"
            />
            <button
              type="button"
              disabled={busy || phase !== "ready" || !input.trim()}
              onClick={() => void handleSessionCommand(input)}
              className="shrink-0 rounded border border-accent-blue/30 bg-accent-blue/10 px-2 py-1 font-mono text-[10px] text-accent-blue disabled:opacity-30"
            >
              enter
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
