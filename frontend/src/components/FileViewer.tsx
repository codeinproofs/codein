import { useEffect, useMemo, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import type { AppFile, FileLanguage } from "@/types/app";
import { languageFromPath } from "@/lib/language";

const LANGUAGE_TO_PRISM: Record<FileLanguage, string> = {
  typescript: "typescript",
  tsx: "tsx",
  javascript: "javascript",
  jsx: "jsx",
  json: "json",
  css: "css",
  html: "markup",
  markdown: "markdown",
  python: "python",
  bash: "bash",
  yaml: "yaml",
  plaintext: "plaintext",
};

function highlight(content: string, language: FileLanguage): string {
  const prismLang = LANGUAGE_TO_PRISM[language] ?? "plaintext";
  const grammar = Prism.languages[prismLang];
  if (!grammar) {
    return content.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] ?? c));
  }
  return Prism.highlight(content, grammar, prismLang);
}

function fileIcon(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".jsx")) return "⚛";
  if (path.endsWith(".ts") || path.endsWith(".js")) return "ts";
  if (path.endsWith(".json")) return "{}";
  if (path.endsWith(".css")) return "#";
  if (path.endsWith(".md")) return "md";
  if (path.endsWith(".py")) return "py";
  return "·";
}

interface FileViewerProps {
  files: AppFile[];
  activePath?: string | null;
  onSelectPath?: (path: string) => void;
  /** When true, shows a blinking cursor at the end of the active file (streaming). */
  isStreamingActive?: boolean;
}

export default function FileViewer({ files, activePath, onSelectPath, isStreamingActive = false }: FileViewerProps) {
  const [internalActive, setInternalActive] = useState<string | null>(activePath ?? files[0]?.path ?? null);

  useEffect(() => {
    // Keep the newest/most-recently-touched file selected while streaming,
    // unless the caller controls selection explicitly.
    if (activePath !== undefined) return;
    if (files.length === 0) return;
    const last = files[files.length - 1];
    setInternalActive((prev) => (prev && files.some((f) => f.path === prev) ? prev : last.path));
  }, [files, activePath]);

  const active = activePath ?? internalActive;
  const activeFile = useMemo(() => files.find((f) => f.path === active) ?? null, [files, active]);

  const highlighted = useMemo(() => {
    if (!activeFile) return "";
    const lang = activeFile.language ?? languageFromPath(activeFile.path);
    return highlight(activeFile.content, lang);
  }, [activeFile]);

  function selectPath(path: string) {
    setInternalActive(path);
    onSelectPath?.(path);
  }

  if (files.length === 0) {
    return (
      <div className="grid-backdrop flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-term-border bg-bg-tertiary/40">
        <p className="font-mono text-xs text-term-dim">waiting for the first file…</p>
      </div>
    );
  }

  const lines = activeFile ? activeFile.content.split("\n") : [];

  return (
    <div className="crt-screen flex h-full flex-col overflow-hidden rounded-xl border border-term-border bg-[#0b0b11]">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-term-border bg-black/30 px-2 py-1.5">
        {files.map((f) => (
          <button
            key={f.path}
            onClick={() => selectPath(f.path)}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] transition ${
              f.path === active
                ? "bg-accent-blue/10 text-accent-blue"
                : "text-term-dim hover:bg-white/5 hover:text-gray-300"
            }`}
            title={f.path}
          >
            <span className="opacity-70">{fileIcon(f.path)}</span>
            <span className="max-w-[160px] truncate">{f.path.split("/").pop()}</span>
          </button>
        ))}
      </div>

      {/* Path breadcrumb */}
      {activeFile && (
        <div className="border-b border-term-border/60 bg-black/10 px-4 py-1.5 font-mono text-[11px] text-term-dim">
          {activeFile.path}
        </div>
      )}

      {/* Code pane */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full font-mono text-[12.5px] leading-[1.65]">
          <div className="code-gutter select-none px-3 py-4 text-right">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <pre className="flex-1 overflow-visible px-4 py-4">
            <code
              className={`language-${
                activeFile
                  ? LANGUAGE_TO_PRISM[activeFile.language ?? languageFromPath(activeFile.path)]
                  : "plaintext"
              }`}
              dangerouslySetInnerHTML={{ __html: highlighted || "&nbsp;" }}
            />
            {isStreamingActive && <span className="terminal-cursor" />}
          </pre>
        </div>
      </div>
    </div>
  );
}
