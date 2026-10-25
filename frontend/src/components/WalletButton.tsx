import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

function truncate(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/**
 * WalletButton — custom-styled Solana wallet connector built on top of the
 * real `@solana/wallet-adapter-react(-ui)` primitives (not the stock
 * WalletMultiButton) so it matches the terminal/CRT visual language.
 *
 * Connecting is optional: the app works fully without a wallet (demo mode),
 * but when connected the public key is passed as `owner_wallet` on launch.
 */
export default function WalletButton() {
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        disabled={connecting}
        className="flex items-center gap-2 rounded-md border border-accent-purple/40 bg-accent-purple/10 px-3.5 py-2 font-mono text-xs text-accent-purple transition hover:bg-accent-purple/20 hover:shadow-glow-purple disabled:opacity-50"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent-purple/70" />
        {connecting ? "connecting…" : "connect wallet"}
      </button>
    );
  }

  const address = publicKey.toBase58();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-term-green/30 bg-term-green/10 px-3.5 py-2 font-mono text-xs text-term-green transition hover:shadow-glow-sm"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-term-green status-dot-pulse" />
        {truncate(address)}
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-md border border-term-border bg-bg-tertiary shadow-terminal">
          <div className="border-b border-term-border px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-term-dim">
              {wallet?.adapter.name ?? "wallet"}
            </p>
            <p className="truncate font-mono text-[11px] text-gray-300">{address}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(address).catch(() => undefined);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="w-full px-3 py-2 text-left font-mono text-[11px] text-gray-300 hover:bg-white/5"
          >
            {copied ? "copied ✓" : "copy address"}
          </button>
          <button
            onClick={() => {
              disconnect().catch(() => undefined);
              setMenuOpen(false);
            }}
            className="w-full px-3 py-2 text-left font-mono text-[11px] text-status-failed hover:bg-white/5"
          >
            disconnect
          </button>
        </div>
      )}
    </div>
  );
}
