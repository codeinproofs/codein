import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Explorer from "./Explorer";

const NAV_ITEMS = [
  { to: "/app", label: "Home", icon: HomeIcon, exact: true },
  { to: "/app/launches", label: "Launches", icon: LaunchesIcon },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
];

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 9.5 10 4l7 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M5 8.5V16a1 1 0 0 0 1 1h3v-4.5h2V17h3a1 1 0 0 0 1-1V8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LaunchesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M10 2.5c2.2 1.6 3.5 4.1 3.5 7 0 2-.6 3.6-1.4 4.8H7.9c-.8-1.2-1.4-2.8-1.4-4.8 0-2.9 1.3-5.4 3.5-7Z"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="9" r="1.3" />
      <path d="M7.6 14.3 6 17.5M12.4 14.3 14 17.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="2.6" />
      <path
        d="M10 2.8v1.9M10 15.3v1.9M4.3 5.3l1.3 1.3M14.4 13.4l1.3 1.3M2.8 10h1.9M15.3 10h1.9M4.3 14.7l1.3-1.3M14.4 6.6l1.3-1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActivityRail({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full w-12 shrink-0 flex-col items-center border-r border-term-border bg-[#08080d] py-3">
      <NavLink
        to="/"
        onClick={onNavigate}
        className="mb-4 flex h-8 w-8 items-center justify-center rounded-md font-mono text-sm font-bold text-accent-blue text-glow-blue"
        title="Landing"
      >
        {"</>"}
      </NavLink>
      <nav className="flex flex-col items-center gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            title={label}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                isActive
                  ? "bg-accent-blue/15 text-accent-blue shadow-glow-sm"
                  : "text-[#6b7280] hover:bg-white/5 hover:text-gray-200"
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop: icon rail + explorer */}
      <div className="hidden h-full shrink-0 md:flex">
        <ActivityRail />
        <Explorer />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-black/70 md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 flex shadow-terminal md:hidden"
            >
              <ActivityRail onNavigate={onCloseMobile} />
              <Explorer onNavigate={onCloseMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
