import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/api";
import type { App, AppStatus } from "@/types/app";
import { START_FROM_TEMPLATES } from "@/data/templates";
import AppIcon from "@/components/AppIcon";
import { ideaForTemplate } from "@/lib/templateIdeas";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

function statusDotColor(status: AppStatus): string {
  if (status === "shipped") return "#22c55e";
  if (status === "reviewing") return "#a855f7";
  return "#b45309"; // amber — building
}

interface ExplorerProps {
  onNavigate?: () => void;
}

export default function Explorer({ onNavigate }: ExplorerProps) {
  const navigate = useNavigate();
  const { id: activeAppId } = useParams<{ id?: string }>();
  const [apps, setApps] = useState<App[]>([]);

  useEffect(() => {
    let active = true;
    const load = () => {
      api
        .listApps({ page_size: 20, sort: "created_at" })
        .then((res) => {
          if (active) setApps(res.items);
        })
        .catch(() => {
          if (active) setApps([]);
        });
    };
    load();
    const interval = window.setInterval(load, 8000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  function startFrom(template: string) {
    onNavigate?.();
    const idea = ideaForTemplate(template);
    navigate(
      `/app?like=${encodeURIComponent(template)}&idea=${encodeURIComponent(idea)}`
    );
  }

  return (
    <div className="flex h-full min-h-0 w-[220px] shrink-0 flex-col border-r border-term-border bg-[#0c0c12] select-none">
      <div className="px-3.5 pb-2 pt-3.5">
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-[#6b7280]">
          Explorer
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-4">
        {/* LAUNCHES */}
        <div className="mb-4">
          <div className="mb-1 flex items-baseline gap-1.5 px-2">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
              Launches
            </span>
            <span className="font-mono text-[10px] text-[#4b5563]">{apps.length}</span>
          </div>

          {apps.length === 0 ? (
            <p className="px-2 py-2 font-mono text-[10px] text-[#4b5563]">no launches yet</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {apps.map((app) => {
                const slug = toSlug(app.name) || "app";
                const isActive = activeAppId === app.id;
                return (
                  <li key={app.id}>
                    <Link
                      to={`/app/apps/${app.id}`}
                      onClick={onNavigate}
                      className={`group flex items-center gap-2 rounded-md px-2 py-[5px] transition-colors ${
                        isActive ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <AppIcon
                        name={app.name}
                        ticker={app.ticker}
                        iconUrl={app.icon_url}
                        template={app.template}
                        size={18}
                      />
                      <span className="min-w-0 flex-1 truncate font-sans text-[12.5px] leading-none">
                        <span className="text-[#e5e7eb]">{slug}</span>
                        <span className="text-[#4b5563]">.app</span>
                      </span>
                      <span
                        className="h-[6px] w-[6px] shrink-0 rounded-full"
                        style={{
                          background: statusDotColor(app.status),
                          boxShadow:
                            app.status === "shipped"
                              ? "0 0 6px rgba(34,197,94,0.55)"
                              : undefined,
                        }}
                        title={app.status}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* START FROM */}
        <div>
          <div className="mb-1 px-2">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
              Start from
            </span>
          </div>
          <ul className="flex flex-col gap-0.5">
            {START_FROM_TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => startFrom(t.id)}
                  className="group flex w-full items-center gap-2 rounded-md px-2 py-[5px] text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-[4px]">
                    {t.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[12.5px] leading-none">
                    <span className="text-[#e5e7eb]">{t.id}</span>
                    <span className="text-[#4b5563]">.like</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
