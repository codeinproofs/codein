import { X_URL } from "@/config/social";

interface XLinkProps {
  /** Visual variant */
  variant?: "nav" | "ghost" | "icon";
  className?: string;
  label?: string;
}

function XGlyph({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.836L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** Opens the project X (Twitter) profile in a new tab. */
export default function XLink({
  variant = "ghost",
  className = "",
  label = "Open",
}: XLinkProps) {
  if (variant === "icon") {
    return (
      <a
        href={X_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Open X"
        aria-label="Open X"
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-term-border text-gray-400 transition hover:border-white/20 hover:text-gray-100 ${className}`}
      >
        <XGlyph />
      </a>
    );
  }

  if (variant === "nav") {
    return (
      <a
        href={X_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open X"
        className={`land-btn land-btn-ghost land-btn-sm ${className}`}
      >
        <span className="land-btn-label">
          {label}
          <XGlyph className="h-3 w-3" />
        </span>
      </a>
    );
  }

  return (
    <a
      href={X_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open X"
      className={`inline-flex items-center gap-1.5 rounded-md border border-term-border bg-black/20 px-2.5 py-1.5 font-mono text-[11px] text-gray-300 transition hover:border-white/20 hover:text-white ${className}`}
    >
      <span>{label}</span>
      <XGlyph className="h-3 w-3" />
    </a>
  );
}
