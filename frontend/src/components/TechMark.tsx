/** Unique tech mark for Launches — never Start-From brand logos, never letter blobs. */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PALETTES = [
  ["#0B1220", "#22D3EE", "#6366F1"],
  ["#0F172A", "#34D399", "#A78BFA"],
  ["#111827", "#F472B6", "#38BDF8"],
  ["#020617", "#FBBF24", "#F97316"],
  ["#0A0A0A", "#4ADE80", "#2DD4BF"],
  ["#1A1033", "#C084FC", "#67E8F9"],
  ["#0C1A1A", "#2DD4BF", "#FDE047"],
  ["#1C1917", "#FB7185", "#94A3B8"],
] as const;

interface TechMarkProps {
  seed: string;
  size?: number;
  className?: string;
}

export function techIconCdnUrl(seed: string): string {
  const h = hash(seed || "app");
  const styles = ["shapes", "glass", "identicon", "rings", "icons"] as const;
  const style = styles[h % styles.length]!;
  const bg = ["0a1628", "0f172a", "111827", "1e1b4b", "022c22", "3b0764"][h % 6];
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=64&backgroundColor=${bg}&radius=10`;
}

/** Inline SVG so Launches never depend on CDN / missing icon_url. */
export default function TechMark({ seed, size = 18, className = "" }: TechMarkProps) {
  const h = hash(seed || "app");
  const [bg, a, b] = PALETTES[h % PALETTES.length]!;
  const style = h % 6;
  const x1 = 6 + (h % 7);
  const y1 = 6 + ((h >>> 3) % 7);
  const x2 = 18 + ((h >>> 5) % 8);
  const y2 = 16 + ((h >>> 7) % 8);
  const x3 = 10 + ((h >>> 9) % 10);
  const y3 = 20 + ((h >>> 11) % 6);
  const r1 = 3 + (h % 4);
  const r2 = 5 + ((h >>> 2) % 5);
  const gid = `tm-${h.toString(16)}`;

  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-[5px] border border-white/10 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" width={size} height={size} className="block">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={bg} />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="7" fill={`url(#${gid})`} />
        <rect width="32" height="32" rx="7" fill={a} opacity="0.1" />

        {style === 0 && (
          <>
            <path
              d={`M6 ${y1} H${x2} V${y2} H26`}
              fill="none"
              stroke={a}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d={`M${x1} 6 V${y3} H${x3}`}
              fill="none"
              stroke={b}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <circle cx={x2} cy={y1} r="1.7" fill={a} />
            <circle cx={x3} cy={y3} r="1.7" fill={b} />
            <circle cx="24" cy={y2} r="2.1" fill={a} opacity="0.9" />
          </>
        )}

        {style === 1 && (
          <>
            <circle cx="16" cy="16" r={r2 + 6} fill="none" stroke={a} strokeWidth="0.7" opacity="0.45" />
            <circle cx="16" cy="16" r={r2 + 2} fill="none" stroke={b} strokeWidth="1.1" opacity="0.8" />
            <circle cx="16" cy="16" r={r1} fill={a} />
            <circle cx={x2} cy={y1} r="1.8" fill={b} />
            <circle cx={x1} cy={y2} r="1.3" fill="#fff" opacity="0.85" />
          </>
        )}

        {style === 2 && (
          <>
            <polygon
              points="16,5 25,10 25,20 16,25 7,20 7,10"
              fill="none"
              stroke={a}
              strokeWidth="1.2"
            />
            <polygon points="16,9 21,12 21,18 16,21 11,18 11,12" fill={b} opacity="0.4" />
            <rect x="14" y="14" width="4" height="4" rx="0.6" fill={a} />
          </>
        )}

        {style === 3 && (
          <>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={a} strokeWidth="1.1" opacity="0.8" />
            <line x1={x2} y1={y2} x2={x3} y2={y3} stroke={b} strokeWidth="1.1" opacity="0.8" />
            <line x1={x1} y1={y1} x2={x3} y2={y3} stroke="#fff" strokeWidth="0.6" opacity="0.3" />
            <circle cx={x1} cy={y1} r="2.4" fill={a} />
            <circle cx={x2} cy={y2} r="3" fill={b} />
            <circle cx={x3} cy={y3} r="2" fill="#fff" opacity="0.85" />
          </>
        )}

        {style === 4 && (
          <>
            <path
              d={`M5 18 Q8 ${10 + (h % 6)} 11 16 T17 14 T23 17 T27 12`}
              fill="none"
              stroke={a}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d={`M5 22 Q9 ${14 + ((h >>> 4) % 5)} 13 20 T19 18 T27 20`}
              fill="none"
              stroke={b}
              strokeWidth="1.2"
              opacity="0.85"
              strokeLinecap="round"
            />
            <circle cx="27" cy="12" r="1.6" fill={a} />
          </>
        )}

        {style === 5 && (
          <>
            <path d="M16 6 L26 12 L16 18 L6 12 Z" fill={a} opacity="0.95" />
            <path d="M6 12 L16 18 L16 26 L6 20 Z" fill={b} opacity="0.75" />
            <path d="M26 12 L16 18 L16 26 L26 20 Z" fill="#fff" opacity="0.22" />
          </>
        )}
      </svg>
    </span>
  );
}
