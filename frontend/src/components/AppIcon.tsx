import { useState } from "react";
import TechMark, { techIconCdnUrl } from "@/components/TechMark";

interface AppIconProps {
  name: string;
  ticker?: string;
  iconUrl?: string | null;
  /** Kept for API compat — launches never render Start-From brand logos. */
  template?: string | null;
  size?: number;
  className?: string;
}

/**
 * Launch icons only. Always a unique tech mark (SVG / CDN / pipeline URL).
 * Never purple letter placeholders.
 */
export default function AppIcon({
  name,
  ticker,
  iconUrl,
  size = 20,
  className = "",
}: AppIconProps) {
  const seed = (ticker || name || "app").replace(/^\$/, "");
  const pipelineOk = Boolean(iconUrl && iconUrl.length > 0 && !isBrokenPlaceholder(iconUrl));
  const [failed, setFailed] = useState(false);

  const remoteSrc = pipelineOk ? iconUrl! : techIconCdnUrl(seed);

  if (failed) {
    return <TechMark seed={seed} size={size} className={className} />;
  }

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-[5px] border border-white/10 ${className}`}
      style={{ width: size, height: size, background: "#0a1628" }}
    >
      <img
        src={remoteSrc}
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

/** Old / empty / useless URLs that should not be trusted. */
function isBrokenPlaceholder(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return true;
  // accidental letter-only data or obvious stubs
  if (u === "null" || u === "undefined") return true;
  return false;
}
