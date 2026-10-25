import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LIKE_TEMPLATES, useCommandParser } from "@/hooks/useCommandParser";
import type { ParsedCommand } from "@/types/app";

interface CommandInputProps {
  onSubmit: (prompt: string, parsed: ParsedCommand) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** Prefill / sync from explorer "start from" clicks */
  seedValue?: string | null;
}

const HISTORY_KEY = "codein:cmd-history";

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20)));
  } catch {
    // ignore storage errors (private mode etc.)
  }
}

/**
 * CommandInput — the terminal prompt. Supports:
 *   create new --like discord
 *   create new "a chat app with voice"
 *   create new --like discord "with nitro features"
 *
 * Shows Discord-style autocomplete chips for `--like <template>` and a
 * live hint of the parsed intent above the input.
 */
export default function CommandInput({
  onSubmit,
  disabled = false,
  placeholder = 'create new --like discord  or  create new "a chat app with voice"',
  autoFocus = true,
  seedValue = null,
}: CommandInputProps) {
  const [input, setInput] = useState(seedValue ?? "");
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const historyRef = useRef<string[]>(loadHistory());
  const inputRef = useRef<HTMLInputElement>(null);
  const { parsed, prompt, suggestions } = useCommandParser(input);

  useEffect(() => {
    if (seedValue == null || seedValue === "") return;
    setInput(seedValue);
    inputRef.current?.focus();
  }, [seedValue]);

  function applySuggestion(value: string) {
    const likeIdx = input.toLowerCase().lastIndexOf("--like");
    if (likeIdx !== -1) {
      const before = input.slice(0, likeIdx);
      setInput(`${before}--like ${value} `);
    } else {
      const base = input.trim().length === 0 ? "create new " : `${input.trim()} `;
      setInput(`${base}--like ${value} `);
    }
    inputRef.current?.focus();
  }

  function handleSubmit() {
    if (disabled || !parsed.isComplete || parsed.command !== "create") return;
    const history = [...historyRef.current, input];
    historyRef.current = history;
    saveHistory(history);
    onSubmit(prompt, parsed);
    setInput("");
    setHistoryIdx(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const history = historyRef.current;
      if (history.length === 0) return;
      const nextIdx = historyIdx === null ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInput(history[nextIdx] ?? "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const history = historyRef.current;
      if (historyIdx === null) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(null);
        setInput("");
      } else {
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx] ?? "");
      }
      return;
    }
    if (e.key === "Tab" && suggestions.length > 0) {
      e.preventDefault();
      applySuggestion(suggestions[0].value);
    }
  }

  const showChips = input.trim().length === 0 || suggestions.length > 0;
  const chipSource = suggestions.length > 0 ? suggestions : LIKE_TEMPLATES;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-term-border bg-black/40 px-3.5 py-3 focus-within:border-accent-blue/60 focus-within:shadow-glow-sm transition-shadow sm:gap-3 sm:px-4">
        <span className="select-none font-mono text-sm text-accent-blue text-glow-blue">
          ➜&nbsp;<span className="text-accent-purple">~/home</span>
        </span>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          disabled={disabled}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHistoryIdx(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className="order-last min-w-0 flex-1 basis-full bg-transparent font-mono text-sm text-term-green placeholder:text-term-dim/60 outline-none disabled:opacity-50 sm:order-none sm:basis-0"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !parsed.isComplete || parsed.command !== "create"}
          className="ml-auto shrink-0 rounded-md border border-accent-blue/40 bg-accent-blue/10 px-3 py-1.5 font-mono text-xs text-accent-blue transition hover:bg-accent-blue/20 hover:shadow-glow-sm disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-accent-blue/10"
        >
          run ⏎
        </button>
      </div>

      {/* Live hint line */}
      <div className="mt-2 min-h-[18px] px-1 font-mono text-[11px] text-term-dim">
        {input.length > 0 ? parsed.hint : "Press Tab to autocomplete \u00B7 \u2191/\u2193 for history"}
      </div>

      {/* Autocomplete chips */}
      <AnimatePresence>
        {showChips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex flex-wrap gap-2 overflow-hidden"
          >
            {chipSource.map((s) => (
              <button
                key={s.value}
                onClick={() => applySuggestion(s.value)}
                title={s.description}
                className="group flex items-center gap-1.5 rounded-full border border-term-border bg-bg-tertiary/80 px-3 py-1 font-mono text-[11px] text-term-dim transition hover:border-accent-purple/50 hover:text-accent-purple hover:shadow-glow-purple"
              >
                <span className="text-accent-blue/70 group-hover:text-accent-blue">--like</span>
                {s.value}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
