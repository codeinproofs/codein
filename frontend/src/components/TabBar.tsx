import { useWorkspace } from "@/context/WorkspaceContext";

function TabIcon({ kind }: { kind: string }) {
  if (kind === "home") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2.5 7.5 8 3l5.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 7v5.5h3V9h2v3.5h3V7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "app") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="10" height="10" rx="1.5" />
        <path d="M6 8h4M8 6v4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
  );
}

export default function TabBar() {
  const { tabs, activeId, focusTab, closeTab } = useWorkspace();

  if (tabs.length === 0) {
    return (
      <div className="flex h-9 items-center border-b border-term-border bg-[#0a0a10] px-3 font-mono text-[11px] text-term-dim">
        no open editors
      </div>
    );
  }

  return (
    <div className="flex h-9 items-stretch overflow-x-auto border-b border-term-border bg-[#0a0a10]">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <div
            key={tab.id}
            className={`group relative flex min-w-[110px] max-w-[200px] items-center gap-1.5 border-r border-term-border px-3 ${
              active
                ? "bg-bg-primary text-gray-100 after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-accent-blue"
                : "bg-transparent text-gray-500 hover:bg-white/[0.03] hover:text-gray-300"
            }`}
          >
            <button
              type="button"
              onClick={() => focusTab(tab.id)}
              className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left"
            >
              <TabIcon kind={tab.kind} />
              <span className="truncate font-mono text-[12px]">{tab.title}</span>
            </button>
            {tab.closable && (
              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] transition ${
                  active
                    ? "text-gray-400 hover:bg-white/10 hover:text-white"
                    : "opacity-0 group-hover:opacity-100 text-gray-500 hover:bg-white/10 hover:text-gray-200"
                }`}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
