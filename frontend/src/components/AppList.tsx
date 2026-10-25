import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import StatusBadge from "./StatusBadge";
import AppIcon from "./AppIcon";
import type { App } from "@/types/app";

interface AppListProps {
  apps: App[];
  loading?: boolean;
  emptyMessage?: string;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SkeletonCard() {
  return (
    <div className="h-[168px] animate-pulse rounded-xl border border-term-border bg-bg-tertiary/60 p-5">
      <div className="h-4 w-2/3 rounded bg-white/5" />
      <div className="mt-3 h-3 w-full rounded bg-white/5" />
      <div className="mt-2 h-3 w-5/6 rounded bg-white/5" />
      <div className="mt-6 h-5 w-20 rounded-full bg-white/5" />
    </div>
  );
}

export default function AppList({
  apps,
  loading = false,
  emptyMessage = "No apps yet. Type a command above to launch your first one.",
}: AppListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="grid-backdrop flex flex-col items-center justify-center rounded-xl border border-dashed border-term-border py-16 text-center">
        <p className="font-mono text-sm text-term-dim">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((app, idx) => (
        <motion.div
          key={app.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.3) }}
        >
          <Link
            to={`/app/apps/${app.id}`}
            className="app-card block h-full rounded-xl border border-term-border bg-bg-tertiary/70 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <AppIcon
                  name={app.name}
                  ticker={app.ticker}
                  iconUrl={app.icon_url}
                  template={app.template}
                  size={32}
                  className="rounded-lg"
                />
                <h3 className="truncate font-sans text-[15px] font-semibold text-gray-100">
                  {app.name}
                </h3>
              </div>
              <StatusBadge status={app.status} size="sm" />
            </div>

            <p className="mt-3 line-clamp-2 font-sans text-[13px] leading-relaxed text-gray-400">
              {app.description || app.idea}
            </p>

            <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-term-dim">
              <span className="text-accent-purple/80">{app.ticker}</span>
              <span>{timeAgo(app.created_at)}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
