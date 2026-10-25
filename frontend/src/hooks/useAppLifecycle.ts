/**
 * Subscribes to GET /apps/{id}/files/stream via SSE.
 */
import { useEffect, useRef, useState } from "react";
import { api } from "@/services/api";
import type { App, AppFile, AppStatus, AppStreamEvent } from "@/types/app";
import { languageFromPath } from "@/lib/language";

export interface UseAppLifecycleResult {
  files: AppFile[];
  status: AppStatus | null;
  statusMessage: string | null;
  app: App | null;
  error: string | null;
  isStreaming: boolean;
}

export function useAppLifecycle(appId: string | undefined): UseAppLifecycleResult {
  const [files, setFiles] = useState<AppFile[]>([]);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [app, setApp] = useState<App | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!appId) return;

    setFiles([]);
    setStatus(null);
    setStatusMessage(null);
    setApp(null);
    setError(null);
    setIsStreaming(true);

    let cancelled = false;

    // Seed metadata from REST while SSE streams files
    api
      .getApp(appId)
      .then((meta) => {
        if (!cancelled) setApp(meta);
      })
      .catch(() => {
        /* SSE may still work */
      });

    const source = new EventSource(api.appFileStreamUrl(appId));
    sourceRef.current = source;

    const handleMessage = (ev: MessageEvent<string>) => {
      let event: AppStreamEvent;
      try {
        event = JSON.parse(ev.data) as AppStreamEvent;
      } catch {
        return;
      }

      switch (event.type) {
        case "file": {
          const nextFile: AppFile = {
            path: event.path,
            content: event.content,
            language: languageFromPath(event.path),
            generated_at: event.generated_at,
            app_id: appId,
          };
          setFiles((prev) => {
            const idx = prev.findIndex((f) => f.path === nextFile.path);
            if (idx === -1) return [...prev, nextFile];
            const copy = [...prev];
            copy[idx] = nextFile;
            return copy;
          });
          break;
        }
        case "status": {
          setStatus(event.status);
          setStatusMessage(event.detail ?? null);
          setApp((prev) =>
            prev
              ? { ...prev, status: event.status, status_detail: event.detail ?? prev.status_detail }
              : prev
          );
          break;
        }
        case "done": {
          setStatus(event.status);
          setIsStreaming(false);
          setApp((prev) =>
            prev
              ? {
                  ...prev,
                  status: event.status,
                  vercel_deployment_url: event.vercel_deployment_url ?? prev.vercel_deployment_url,
                  pumpfun_signature: event.pumpfun_signature ?? prev.pumpfun_signature,
                  pumpfun_mint: event.pumpfun_mint ?? prev.pumpfun_mint,
                }
              : prev
          );
          // Refresh full app metadata once done
          api.getApp(appId).then((meta) => {
            if (!cancelled) setApp(meta);
          });
          source.close();
          break;
        }
        case "error": {
          setError(event.message);
          setIsStreaming(false);
          source.close();
          break;
        }
      }
    };

    source.addEventListener("message", handleMessage);
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        setError((prev) => prev ?? "Connection to the build stream was lost.");
        setIsStreaming(false);
      }
    };

    return () => {
      cancelled = true;
      source.removeEventListener("message", handleMessage);
      source.close();
      sourceRef.current = null;
    };
  }, [appId]);

  return { files, status, statusMessage, app, error, isStreaming };
}
