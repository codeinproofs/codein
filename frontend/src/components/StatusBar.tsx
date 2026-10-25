import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { App } from "@/types/app";

export default function StatusBar() {
  const [apps, setApps] = useState<App[]>([]);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        await api.health();
        if (active) setOnline(true);
      } catch {
        if (active) setOnline(false);
      }
      try {
        const res = await api.listApps({ page_size: 50 });
        if (active) setApps(res.items);
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 10000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const building = apps.filter((a) => a.status === "building" || a.status === "reviewing").length;
  const latest = apps[0];

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 overflow-hidden border-t border-[#1e3a5f] bg-[#0b1f3a] px-3 font-mono text-[10.5px] text-[#93c5fd]">
      <span className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            online ? "bg-term-green shadow-[0_0_6px_#5ff28c]" : "bg-red-400"
          }`}
        />
        {online ? "live" : "offline"}
      </span>

      {latest?.pumpfun_mint ? (
        <>
          <span className="text-[#1e3a5f]">|</span>
          <span className="truncate text-[#7dd3fc]">
            CA {latest.pumpfun_mint.slice(0, 4)}...{latest.pumpfun_mint.slice(-4)}
          </span>
        </>
      ) : null}

      <span className="text-[#1e3a5f]">|</span>
      <span>launch: free | fees: 30% you / 70% create</span>

      <span className="ml-auto flex items-center gap-3">
        {building > 0 ? (
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            {building} building
          </span>
        ) : null}
        <span className="text-[#60a5fa]">{apps.length} apps</span>
      </span>
    </footer>
  );
}
