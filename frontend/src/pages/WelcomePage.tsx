import { useWorkspace } from "@/context/WorkspaceContext";

/**
 * Shown when all editor tabs are closed — the "desktop" under the tab strip.
 */
export default function WelcomePage() {
  const { reopenHome } = useWorkspace();

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center bg-bg-primary px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-term-dim">workspace empty</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-100">
          Code<span className="text-accent-purple">In</span>
        </h1>
        <p className="mt-3 font-mono text-[13px] leading-relaxed text-gray-500">
          All tabs closed. Open <span className="text-gray-300">home</span> to type an app and launch its
          coin, or pick a launch from the explorer.
        </p>
        <button
          type="button"
          onClick={reopenHome}
          className="mt-8 rounded-md border border-accent-blue/40 bg-accent-blue/15 px-5 py-2.5 font-mono text-sm text-accent-blue shadow-glow-sm transition hover:bg-accent-blue/25"
        >
          open home tab
        </button>
      </div>
    </div>
  );
}
