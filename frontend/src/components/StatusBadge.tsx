import type { AppStatus } from "@/types/app";

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
}

const STATUS_CONFIG: Record<AppStatus, StatusConfig> = {
  building: {
    label: "building",
    color: "#f97316",
    bg: "rgba(249, 115, 22, 0.12)",
    border: "rgba(249, 115, 22, 0.35)",
  },
  reviewing: {
    label: "reviewing",
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.35)",
  },
  shipped: {
    label: "shipped",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.35)",
  },
};

interface StatusBadgeProps {
  status: AppStatus;
  size?: "sm" | "md";
  pulse?: boolean;
}

export default function StatusBadge({ status, size = "md", pulse = true }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const sizeClasses =
    size === "sm" ? "text-[10px] px-2 py-0.5 gap-1.5" : "text-xs px-2.5 py-1 gap-2";

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono uppercase tracking-wider ${sizeClasses}`}
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        className={pulse && status === "building" ? "status-dot-pulse" : ""}
        style={{
          display: "inline-block",
          width: size === "sm" ? 5 : 6,
          height: size === "sm" ? 5 : 6,
          borderRadius: "999px",
          background: cfg.color,
          color: cfg.color,
        }}
      />
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
