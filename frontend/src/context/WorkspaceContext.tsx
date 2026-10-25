import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type TabKind = "home" | "launches" | "settings" | "app";

export interface WorkspaceTab {
  id: string;
  kind: TabKind;
  title: string;
  path: string;
  closable: boolean;
}

interface WorkspaceContextValue {
  tabs: WorkspaceTab[];
  activeId: string | null;
  openTab: (tab: Omit<WorkspaceTab, "closable"> & { closable?: boolean }) => void;
  closeTab: (id: string) => void;
  focusTab: (id: string) => void;
  renameTab: (id: string, title: string) => void;
  reopenHome: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const HOME_TAB: WorkspaceTab = {
  id: "home",
  kind: "home",
  title: "home",
  path: "/app",
  closable: true,
};

function tabFromPath(pathname: string): WorkspaceTab | null {
  if (pathname === "/app" || pathname === "/app/") return HOME_TAB;
  if (pathname === "/app/launches") {
    return { id: "launches", kind: "launches", title: "launches", path: "/app/launches", closable: true };
  }
  if (pathname === "/app/settings") {
    return { id: "settings", kind: "settings", title: "settings", path: "/app/settings", closable: true };
  }
  if (pathname.startsWith("/app/apps/")) {
    const id = pathname.split("/")[3];
    if (!id) return null;
    return {
      id: `app:${id}`,
      kind: "app",
      title: id.slice(0, 8),
      path: pathname,
      closable: true,
    };
  }
  return null;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<WorkspaceTab[]>([HOME_TAB]);
  const [activeId, setActiveId] = useState<string | null>("home");

  const openTab = useCallback(
    (incoming: Omit<WorkspaceTab, "closable"> & { closable?: boolean }) => {
      const tab: WorkspaceTab = { ...incoming, closable: incoming.closable ?? true };
      setTabs((prev) => {
        if (prev.some((t) => t.id === tab.id)) return prev;
        return [...prev, tab];
      });
      setActiveId(tab.id);
      if (location.pathname !== tab.path) {
        navigate(tab.path);
      }
    },
    [location.pathname, navigate]
  );

  const focusTab = useCallback(
    (id: string) => {
      setActiveId(id);
      setTabs((prev) => {
        const tab = prev.find((t) => t.id === id);
        if (tab && location.pathname !== tab.path) {
          // navigate outside of setState — schedule microtask
          queueMicrotask(() => navigate(tab.path));
        }
        return prev;
      });
    },
    [location.pathname, navigate]
  );

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx === -1) return prev;
        const next = prev.filter((t) => t.id !== id);

        setActiveId((current) => {
          if (current !== id) return current;
          if (next.length === 0) {
            navigate("/app/welcome");
            return null;
          }
          const fallback = next[Math.min(idx, next.length - 1)];
          navigate(fallback.path);
          return fallback.id;
        });

        return next;
      });
    },
    [navigate]
  );

  const renameTab = useCallback((id: string, title: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
  }, []);

  const reopenHome = useCallback(() => {
    openTab(HOME_TAB);
  }, [openTab]);

  // Keep tabs in sync when navigating via sidebar / links
  useEffect(() => {
    if (location.pathname === "/app/welcome") {
      setActiveId(null);
      return;
    }
    const tab = tabFromPath(location.pathname);
    if (!tab) return;
    setTabs((prev) => {
      const existing = prev.find((t) => t.id === tab.id);
      if (existing) return prev;
      return [...prev, tab];
    });
    setActiveId(tab.id);
  }, [location.pathname]);

  const value = useMemo(
    () => ({ tabs, activeId, openTab, closeTab, focusTab, renameTab, reopenHome }),
    [tabs, activeId, openTab, closeTab, focusTab, renameTab, reopenHome]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
