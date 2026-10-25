import { useEffect, useState, type ReactNode } from "react";

interface TypewriterProps {
  /** Lines typed sequentially; each finishes before the next starts. */
  lines: string[];
  /** ms per character */
  speed?: number;
  /** pause between lines */
  linePause?: number;
  className?: string;
  lineClassName?: string;
  /** Keep blinking caret after finishing */
  showCursorWhenDone?: boolean;
  /** Optional render for a line (e.g. colored spans). Receives full target text + currently revealed length */
  renderLine?: (full: string, revealed: string, lineIndex: number) => ReactNode;
}

/**
 * Types text character-by-character with a blinking caret — classic CLI waiting cursor.
 */
export default function Typewriter({
  lines,
  speed = 28,
  linePause = 320,
  className = "",
  lineClassName = "",
  showCursorWhenDone = true,
  renderLine,
}: TypewriterProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) {
      setLineIndex(lines.length - 1);
      setCharIndex(lines[lines.length - 1]?.length ?? 0);
      setDone(true);
      return;
    }

    setLineIndex(0);
    setCharIndex(0);
    setDone(false);
  }, [lines, reduced]);

  useEffect(() => {
    if (reduced || done) return;
    const current = lines[lineIndex] ?? "";
    if (charIndex < current.length) {
      const t = window.setTimeout(() => setCharIndex((c) => c + 1), speed);
      return () => window.clearTimeout(t);
    }
    if (lineIndex < lines.length - 1) {
      const t = window.setTimeout(() => {
        setLineIndex((i) => i + 1);
        setCharIndex(0);
      }, linePause);
      return () => window.clearTimeout(t);
    }
    setDone(true);
  }, [charIndex, lineIndex, lines, speed, linePause, done, reduced]);

  const activeLine = lineIndex;
  const showCaret = !done || showCursorWhenDone;

  return (
    <div className={className} aria-label={lines.join(" ")}>
      {lines.map((full, i) => {
        if (i > activeLine) return null;
        const revealed =
          i < activeLine ? full : reduced ? full : full.slice(0, charIndex);
        const isActive = i === activeLine;
        return (
          <div key={`${i}-${full}`} className={lineClassName}>
            {renderLine ? renderLine(full, revealed, i) : revealed}
            {isActive && showCaret && <span className="type-caret" aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}
