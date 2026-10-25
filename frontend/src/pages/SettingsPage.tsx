import { useWallet } from "@solana/wallet-adapter-react";
import WalletButton from "@/components/WalletButton";
import XLink from "@/components/XLink";
import { API_BASE_URL } from "@/services/api";
import { X_URL } from "@/config/social";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-term-border/60 py-3 last:border-b-0">
      <span className="shrink-0 font-sans text-sm text-gray-400">{label}</span>
      <span className="min-w-0 break-all text-right font-mono text-xs text-gray-200">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { publicKey, wallet } = useWallet();
  const network = (import.meta.env.VITE_SOLANA_NETWORK as string | undefined) ?? "mainnet-beta";
  const rpcUrl = (import.meta.env.VITE_SOLANA_RPC_URL as string | undefined) ?? "https://api.mainnet-beta.solana.com";

  return (
    <div className="min-h-full px-6 py-8 md:px-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 font-sans text-xl font-bold text-gray-100">Settings</h1>
        <p className="mb-8 font-mono text-[11px] text-term-dim">
          Local-only preferences. Nothing here is sent anywhere until you launch an app.
        </p>

        <section className="mb-6 rounded-xl border border-term-border bg-bg-tertiary/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-sm font-semibold text-gray-200">Wallet</h2>
            <WalletButton />
          </div>
          <Row label="Status" value={publicKey ? "connected" : "disconnected (demo mode)"} />
          <Row label="Provider" value={wallet?.adapter.name ?? "—"} />
          <Row label="Address" value={publicKey ? publicKey.toBase58() : "—"} />
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-term-dim">
            CodeIn works without a wallet. Apps launch in demo mode. Connect a wallet to attach
            your address as the on-chain owner of apps you create.
          </p>
        </section>

        <section className="mb-6 rounded-xl border border-term-border bg-bg-tertiary/60 p-5">
          <h2 className="mb-4 font-sans text-sm font-semibold text-gray-200">Network</h2>
          <Row label="Solana network" value={network} />
          <Row label="RPC endpoint" value={rpcUrl} />
        </section>

        <section className="mb-6 rounded-xl border border-term-border bg-bg-tertiary/60 p-5">
          <h2 className="mb-4 font-sans text-sm font-semibold text-gray-200">Backend</h2>
          <Row label="API URL" value={API_BASE_URL || "(same-origin / dev proxy)"} />
          <Row label="Build" value="codein-frontend@0.1.0" />
        </section>

        <section className="rounded-xl border border-term-border bg-bg-tertiary/60 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-sans text-sm font-semibold text-gray-200">Social</h2>
            <XLink variant="ghost" />
          </div>
          <Row label="X / Twitter" value={X_URL} />
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-term-dim">
            Follow updates and launches. Set VITE_X_URL in .env when the final handle is ready.
          </p>
        </section>
      </div>
    </div>
  );
}
