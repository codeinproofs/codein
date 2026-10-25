import { useState } from "react";
import { motion } from "framer-motion";
import type { AppPreview } from "@/types/app";

interface LaunchConfirmProps {
  preview: AppPreview;
  confirming: boolean;
  walletConnected: boolean;
  onConfirm: (edited: { name: string; ticker: string; description: string }) => void;
  onCancel: () => void;
}

function normalizeTickerInput(raw: string): string {
  const core = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
  return core ? `$${core}` : "$";
}

/**
 * Honest pre-mint gate: shows what will be launched and requires explicit confirm.
 * Keeps the terminal vibe but stops the silent auto-launch.
 */
export default function LaunchConfirm({
  preview,
  confirming,
  walletConnected,
  onConfirm,
  onCancel,
}: LaunchConfirmProps) {
  const [name, setName] = useState(preview.name);
  const [ticker, setTicker] = useState(preview.ticker.startsWith("$") ? preview.ticker : `$${preview.ticker}`);
  const [description, setDescription] = useState(preview.description);

  const tickerValid = /^\$[A-Z0-9]{3,8}$/.test(ticker);
  const nameValid = name.trim().length >= 2;
  const canLaunch = tickerValid && nameValid && !confirming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 overflow-hidden rounded-xl border border-accent-blue/30 bg-[#0c0c14] shadow-glow-sm"
    >
      <div className="flex items-center justify-between border-b border-term-border/80 bg-black/40 px-4 py-2.5">
        <p className="font-mono text-[11px] uppercase tracking-wider text-accent-blue">
          // launch preview: confirm before mint
        </p>
        {preview.mock && (
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-400">
            mock mode
          </span>
        )}
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[1fr_1.2fr]">
        {/* Coin card preview */}
        <div className="rounded-lg border border-term-border bg-black/30 p-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-term-dim">coin card</p>
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-term-border bg-gradient-to-br from-accent-blue/30 to-accent-purple/30 font-mono text-lg text-white">
              {name.trim().slice(0, 1).toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate font-sans text-base font-semibold text-gray-100">{name || "—"}</p>
              <p className="font-mono text-sm text-amber-400/90">{ticker}</p>
              <p className="mt-1 line-clamp-3 font-sans text-[12px] leading-relaxed text-gray-400">
                {description || "No description"}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 border-t border-term-border/60 pt-3 font-mono text-[11px] text-term-dim">
            <p>
              <span className="text-term-green">✓</span> mint coin on pump.fun
            </p>
            <p>
              <span className="text-term-green">✓</span> generate full codebase (live SSE)
            </p>
            <p>
              <span className="text-term-green">✓</span> deploy to Vercel
            </p>
            <p className="pt-1 text-[10px] text-[#6b7280]">
              template: <span className="text-gray-300">{preview.template}</span>
            </p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-term-dim">name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={confirming}
              className="w-full rounded-md border border-term-border bg-black/40 px-3 py-2 font-sans text-sm text-gray-100 outline-none focus:border-accent-blue/50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-term-dim">ticker</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(normalizeTickerInput(e.target.value))}
              disabled={confirming}
              className="w-full rounded-md border border-term-border bg-black/40 px-3 py-2 font-mono text-sm text-amber-400 outline-none focus:border-accent-blue/50"
            />
            {!tickerValid && (
              <span className="mt-1 block font-mono text-[10px] text-status-failed">
                use $ + 3–8 letters/numbers
              </span>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-term-dim">
              description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={confirming}
              rows={3}
              className="w-full resize-none rounded-md border border-term-border bg-black/40 px-3 py-2 font-sans text-sm text-gray-300 outline-none focus:border-accent-blue/50"
            />
          </label>

          {!walletConnected && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 font-mono text-[11px] text-amber-400/90">
              wallet not connected. Launch will run without an owner wallet (demo ok).
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={!canLaunch}
              onClick={() =>
                onConfirm({
                  name: name.trim(),
                  ticker,
                  description: description.trim(),
                })
              }
              className="rounded-md bg-accent-blue px-4 py-2 font-mono text-xs font-semibold text-white shadow-glow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {confirming ? "launching…" : "confirm launch ↵"}
            </button>
            <button
              type="button"
              disabled={confirming}
              onClick={onCancel}
              className="rounded-md border border-term-border px-4 py-2 font-mono text-xs text-gray-400 transition hover:bg-white/5 hover:text-gray-200 disabled:opacity-40"
            >
              cancel
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-term-border/80 bg-black/30 px-4 py-2 font-mono text-[10px] text-term-dim">
        idea: <span className="text-gray-400">{preview.idea}</span>
      </div>
    </motion.div>
  );
}
