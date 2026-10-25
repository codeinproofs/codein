import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import CommandInput from "@/components/CommandInput";
import LaunchSession from "@/components/LaunchSession";
import Typewriter from "@/components/Typewriter";
import StatusBadge from "@/components/StatusBadge";
import AppIcon from "@/components/AppIcon";
import { api } from "@/services/api";
import type { App, ParsedCommand } from "@/types/app";

const HERO_LINES = ["Type an app. Launch its coin.", "Watch it build."];

interface SessionState {
  raw: string;
  parsed: ParsedCommand;
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { publicKey } = useWallet();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionState | null>(null);

  const seedValue = useMemo(() => {
    const like = searchParams.get("like");
    const idea = searchParams.get("idea");
    if (!like && !idea) return null;
    if (like && idea) return `create new --like ${like} "${idea}"`;
    if (like) return `create new --like ${like} `;
    return `create new "${idea}"`;
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    api
      .listApps({ page_size: 12, sort: "created_at" })
      .then((res) => {
        if (active) setApps(res.items);
      })
      .catch(() => {
        if (active) setApps([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function handleSubmit(prompt: string, parsed: ParsedCommand) {
    setSession({ raw: prompt, parsed });
  }

  return (
    <div className="min-h-full px-6 py-8 md:px-10 lg:px-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 font-mono text-[12px] leading-relaxed text-[#6b7280]">
          <p>
            <span className="text-[#4b5563]">//</span> create: describe any app, launch its coin, get
            the source
          </p>
          <p className="mt-1">
            <span className="text-accent-purple">const</span>{" "}
            <span className="text-[#e5e7eb]">launch</span> ={" "}
            <span className="text-term-green">"free"</span>;{" "}
            <span className="text-accent-purple">const</span>{" "}
            <span className="text-[#e5e7eb]">fees</span> = {"{ "}
            <span className="text-[#e5e7eb]">you</span>:{" "}
            <span className="text-amber-400">30</span>,{" "}
            <span className="text-[#e5e7eb]">create</span>:{" "}
            <span className="text-amber-400">70</span>
            {" }"};
          </p>
        </div>

        <h1 className="mb-8 font-display text-[32px] font-semibold leading-[1.12] tracking-[-0.03em] text-gray-50 md:text-[40px]">
          <Typewriter
            lines={HERO_LINES}
            speed={30}
            linePause={360}
            showCursorWhenDone
            lineClassName="min-h-[1.15em]"
            renderLine={(_full, revealed, i) => {
              if (i === 0) {
                const splitAt = "Type an app. ".length;
                const head = revealed.slice(0, Math.min(revealed.length, splitAt));
                const tail = revealed.length > splitAt ? revealed.slice(splitAt) : "";
                return (
                  <>
                    <span>{head}</span>
                    {tail && <span className="text-accent-blue text-glow-blue">{tail}</span>}
                  </>
                );
              }
              return <span className="text-accent-purple text-glow-purple">{revealed}</span>;
            }}
          />
        </h1>

        {/* Initial create prompt */}
        <div className="rounded-lg border border-term-border bg-[#0c0c12] p-3 md:p-4">
          <CommandInput
            onSubmit={handleSubmit}
            disabled={!!session}
            autoFocus={!session}
            seedValue={seedValue}
          />
          {!session && (
            <p className="mt-2 font-mono text-[11px] text-term-dim">
              after run, a session terminal opens. type{" "}
              <span className="text-gray-400">confirm</span>,{" "}
              <span className="text-gray-400">edit name …</span>,{" "}
              <span className="text-gray-400">help</span>
            </p>
          )}
        </div>

        {session && (
          <LaunchSession
            rawCommand={session.raw}
            parsed={session.parsed}
            walletAddress={publicKey ? publicKey.toBase58() : null}
            onClose={() => setSession(null)}
            onLaunched={(id) => navigate(`/app/apps/${id}`)}
          />
        )}

        <ul className="mt-8 space-y-2 font-mono text-[12px] text-gray-500">
          <li>
            <span className="text-term-green">✓</span>{" "}
            <span className="text-gray-300">draft</span>: session logs the preview
          </li>
          <li>
            <span className="text-term-green">✓</span>{" "}
            <span className="text-gray-300">confirm</span>: type it yourself in the terminal
          </li>
          <li>
            <span className="text-term-green">✓</span>{" "}
            <span className="text-gray-300">build</span>: code streams live after launch
          </li>
        </ul>

        <section className="mt-12">
          <div className="mb-3 flex items-baseline gap-2 font-mono text-[11px]">
            <span className="text-gray-300">~/LAUNCHES</span>
            <span className="text-term-dim">/ LATEST</span>
            <span className="ml-auto text-term-dim">ls -a</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-term-border">
            <div className="grid grid-cols-[1fr_80px_1fr_140px_48px] gap-2 border-b border-term-border bg-[#0c0c12] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-term-dim">
              <span>app</span>
              <span>ticker</span>
              <span className="hidden sm:block">idea</span>
              <span>status</span>
              <span className="text-right">age</span>
            </div>

            {loading && <p className="px-3 py-6 font-mono text-xs text-term-dim">loading…</p>}
            {!loading && apps.length === 0 && (
              <p className="px-3 py-6 font-mono text-xs text-term-dim">no launches yet</p>
            )}
            {apps.map((app) => (
              <Link
                key={app.id}
                to={`/app/apps/${app.id}`}
                className="grid grid-cols-[1fr_80px_1fr_140px_48px] gap-2 border-b border-term-border/60 px-3 py-2.5 transition hover:bg-white/[0.03] last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2 truncate font-sans text-[13px] text-gray-200">
                  <AppIcon
                    name={app.name}
                    ticker={app.ticker}
                    iconUrl={app.icon_url}
                    template={app.template}
                    size={20}
                  />
                  <span className="truncate">{app.name}</span>
                </span>
                <span className="font-mono text-[12px] text-amber-400/90">{app.ticker}</span>
                <span className="hidden truncate font-mono text-[11px] text-term-dim sm:block">
                  {app.idea}
                </span>
                <span>
                  <StatusBadge status={app.status} size="sm" />
                </span>
                <span className="text-right font-mono text-[11px] text-term-dim">
                  {timeAgo(app.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
