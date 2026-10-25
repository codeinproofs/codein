import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import WalletButton from "./WalletButton";
import XLink from "./XLink";
import TabBar from "./TabBar";
import StatusBar from "./StatusBar";
import { WorkspaceProvider, useWorkspace } from "@/context/WorkspaceContext";

function pathLabel(pathname: string): string {
  if (pathname === "/app/welcome") return "welcome";
  if (pathname === "/app" || pathname === "/app/") return "home";
  if (pathname.startsWith("/app/apps/")) return `apps/${pathname.split("/")[3]?.slice(0, 8) ?? ""}`;
  return pathname.replace(/^\/app\/?/, "") || "home";
}

function Shell() {
  const location = useLocation();
  const { tabs, reopenHome } = useWorkspace();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#07070c] text-gray-200">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Title bar — IDE chrome */}
        <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-term-border bg-[#0c0c12] px-3 md:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="flex shrink-0 items-center justify-center rounded-md border border-term-border p-1.5 text-gray-400 hover:text-gray-200 md:hidden"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
              </svg>
            </button>

            <a
              href="/"
              className="shrink-0 font-display text-[13px] font-bold tracking-tight text-gray-100 hover:text-white"
            >
              Create
            </a>
            <button
              type="button"
              onClick={reopenHome}
              className="hidden rounded border border-term-border px-2 py-0.5 font-mono text-[10px] text-term-dim hover:text-gray-300 sm:inline"
            >
              home tab
            </button>

            <div className="hidden min-w-0 items-center gap-1.5 truncate font-mono text-[11px] text-term-dim sm:flex">
              <span className="text-accent-blue/80">~/</span>
              <span className="truncate text-gray-400">{pathLabel(location.pathname)}</span>
            </div>

            {tabs.length === 0 && (
              <span className="hidden font-mono text-[10px] text-amber-400/80 md:inline">
                · no tabs open
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <XLink variant="ghost" className="hidden sm:inline-flex" />
            <XLink variant="icon" className="sm:hidden" />
            <WalletButton />
          </div>
        </header>

        {/* Editor tabs */}
        <TabBar />

        {/* Active editor content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-bg-primary">
          <Outlet />
        </main>

        <StatusBar />
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  );
}
