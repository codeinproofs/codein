import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface TerminalProps {
  title?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

/**
 * Terminal — the recurring CRT-glow window chrome used across the app.
 * Renders a fake macOS-style titlebar + scanline/CRT overlay around
 * arbitrary content.
 */
export default function Terminal({ title = "codein / zsh", children, className = "", footer }: TerminalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`terminal-frame crt-screen rounded-xl shadow-terminal overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-term-border/80 bg-black/30 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[11px] text-term-dim tracking-wide select-none">
          {title}
        </span>
      </div>
      <div className="font-mono text-sm text-term-green/90 p-5">{children}</div>
      {footer && <div className="border-t border-term-border/80 bg-black/20 px-4 py-2">{footer}</div>}
    </motion.div>
  );
}
