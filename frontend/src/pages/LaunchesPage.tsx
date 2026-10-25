import { useEffect, useMemo, useState } from "react";
import AppList from "@/components/AppList";
import { api } from "@/services/api";
import type { App, AppSortKey, AppStatusFilter } from "@/types/app";

const STATUS_FILTERS: { value: AppStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "building", label: "Building" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shipped", label: "Shipped" },
];

const SORT_OPTIONS: { value: AppSortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name A–Z" },
];

export default function LaunchesPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AppStatusFilter>("all");
  const [sort, setSort] = useState<AppSortKey>("newest");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .listApps({ page_size: 100, sort: "created_at" })
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

  const visible = useMemo(() => {
    let list = apps;
    if (status !== "all") {
      list = list.filter((a) => a.status === status);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.idea.toLowerCase().includes(q) ||
          a.ticker.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });
    return sorted;
  }, [apps, status, query, sort]);

  return (
    <div className="min-h-full px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-sans text-xl font-bold text-gray-100">Launches</h1>
            <p className="font-mono text-[11px] text-term-dim">
              {visible.length} / {apps.length} apps
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-term-border bg-black/30 px-3 py-2">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4 text-term-dim"
              >
                <circle cx="9" cy="9" r="5.5" />
                <path d="m17 17-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search apps, tickers…"
                className="w-44 bg-transparent font-mono text-xs text-gray-200 placeholder:text-term-dim outline-none"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as AppSortKey)}
              className="rounded-md border border-term-border bg-black/30 px-3 py-2 font-mono text-xs text-gray-300 outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition ${
                status === f.value
                  ? "border-accent-blue/50 bg-accent-blue/10 text-accent-blue shadow-glow-sm"
                  : "border-term-border text-term-dim hover:text-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <AppList apps={visible} loading={loading} emptyMessage="No apps match your filters." />
      </div>
    </div>
  );
}
