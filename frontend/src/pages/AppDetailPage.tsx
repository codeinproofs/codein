import { useEffect } from "react";
import { useParams } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import FileViewer from "@/components/FileViewer";
import AppIcon from "@/components/AppIcon";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { useWorkspace } from "@/context/WorkspaceContext";
import { pumpfun } from "@/services/pumpfun";

export default function AppDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { renameTab } = useWorkspace();
  const { files, status, statusMessage, app, error: streamError, isStreaming } =
    useAppLifecycle(id);

  useEffect(() => {
    if (!id || !app?.name) return;
    const slug = app.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 18);
    renameTab(`app:${id}`, `${slug || "app"}.app`);
  }, [id, app?.name, renameTab]);

  const effectiveStatus = status ?? app?.status ?? "building";
  const pumpUrl = app?.pumpfun_mint ? pumpfun.publicUrl(app.pumpfun_mint) : null;

  return (
    <div className="flex h-full min-h-0 flex-col px-6 py-6 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <AppIcon
              name={app?.name ?? "App"}
              ticker={app?.ticker}
              iconUrl={app?.icon_url}
              template={app?.template}
              size={44}
              className="rounded-xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans text-lg font-bold text-gray-100">
                  {app?.name ?? "Generating…"}
                </h1>
                <StatusBadge status={effectiveStatus} />
              </div>
              <p className="font-mono text-[11px] text-term-dim">
                {app?.ticker ?? "ticker pending"} · {files.length} file
                {files.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pumpUrl && (
              <a
                href={pumpUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-accent-purple/40 bg-accent-purple/10 px-3 py-1.5 font-mono text-xs text-accent-purple hover:shadow-glow-purple"
              >
                view on pump.fun ↗
              </a>
            )}
            {app?.vercel_deployment_url && (
              <a
                href={app.vercel_deployment_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-accent-blue/40 bg-accent-blue/10 px-3 py-1.5 font-mono text-xs text-accent-blue hover:shadow-glow-sm"
              >
                live app ↗
              </a>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-md border border-term-border bg-black/20 px-3.5 py-2 font-mono text-xs text-term-dim">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isStreaming ? "animate-pulse bg-accent-blue" : "bg-term-green"
            }`}
          />
          {streamError ? (
            <span className="text-status-failed">✕ {streamError}</span>
          ) : (
            <span>
              {statusMessage ??
                app?.status_detail ??
                (isStreaming ? "streaming build output…" : "build stream idle")}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1">
          <FileViewer files={files} isStreamingActive={isStreaming} />
        </div>
      </div>
    </div>
  );
}
