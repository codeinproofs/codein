import type { ReactNode } from "react";

/** Start From = original brand marks only. Launches use separate tech icons. */

export interface StartFromTemplate {
  id: string;
  label: string;
  icon: ReactNode;
}

function IconBox({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <span
      className="flex h-full w-full items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
      style={{ background: bg }}
    >
      {children}
    </span>
  );
}

export const START_FROM_TEMPLATES: StartFromTemplate[] = [
  {
    id: "discord",
    label: "Discord",
    icon: (
      <IconBox bg="#5865F2">
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white" aria-hidden>
          <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.36-.76-.54-1.09A.08.08 0 0 0 9 4c-1.5.26-2.94.71-4.27 1.33A.1.1 0 0 0 4.67 5.4C2.18 9.05 1.46 12.6 1.82 16.1a.1.1 0 0 0 .04.07c1.8 1.32 3.53 2.12 5.24 2.65a.1.1 0 0 0 .1-.03c.4-.55.76-1.13 1.07-1.74a.09.09 0 0 0-.05-.12 10.7 10.7 0 0 1-1.52-.73.09.09 0 0 1 0-.15c.1-.08.2-.16.3-.24a.09.09 0 0 1 .09-.01c3.2 1.46 6.66 1.46 9.82 0a.09.09 0 0 1 .1.01c.1.08.2.16.3.24a.09.09 0 0 1 0 .15c-.48.28-.99.52-1.52.73a.09.09 0 0 0-.05.12c.32.61.68 1.19 1.07 1.74a.1.1 0 0 0 .1.03c1.72-.53 3.45-1.33 5.25-2.65a.1.1 0 0 0 .04-.07c.44-4.07-.73-7.59-3.1-10.7a.07.07 0 0 0-.06-.07ZM8.68 13.87c-.96 0-1.75-.88-1.75-1.96s.77-1.96 1.75-1.96 1.77.89 1.75 1.96c0 1.08-.79 1.96-1.75 1.96Zm6.64 0c-.96 0-1.75-.88-1.75-1.96s.77-1.96 1.75-1.96 1.77.89 1.75 1.96c0 1.08-.78 1.96-1.75 1.96Z" />
        </svg>
      </IconBox>
    ),
  },
  {
    id: "chrome",
    label: "Chrome",
    icon: (
      <IconBox bg="#0f0f0f">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#EA4335" />
          <path fill="#FBBC05" d="M12 12l8.66 5A10 10 0 0 1 3.5 17L12 12z" />
          <path fill="#34A853" d="M12 12L3.5 17A10 10 0 0 1 12 2v10z" />
          <path fill="#4285F4" d="M12 12l8.66-5A10 10 0 0 1 20.5 17L12 12z" opacity="0" />
          <circle cx="12" cy="12" r="4" fill="#fff" />
          <circle cx="12" cy="12" r="2.2" fill="#4285F4" />
        </svg>
      </IconBox>
    ),
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    icon: (
      <IconBox bg="#10a37f">
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white" aria-hidden>
          <path d="M22.28 9.82a5.5 5.5 0 0 0-.6-5.2 5.6 5.6 0 0 0-6.05-2.3A5.55 5.55 0 0 0 10.2 1 5.55 5.55 0 0 0 5.3 4.9a5.55 5.55 0 0 0-3.7 2.7 5.6 5.6 0 0 0 .68 6.5 5.5 5.5 0 0 0 .6 5.2 5.6 5.6 0 0 0 6.05 2.3A5.55 5.55 0 0 0 13.8 23a5.55 5.55 0 0 0 4.9-3.9 5.55 5.55 0 0 0 3.7-2.7 5.6 5.6 0 0 0-.12-6.58Zm-9.45 12.4c-1.1 0-2.14-.39-2.97-1.1l.15-.08 4.95-2.86a.82.82 0 0 0 .4-.7v-7l2.1 1.21c.05.02.07.06.07.12v5.77a4.14 4.14 0 0 1-4.7 4.64Zm-9.1-3.87a4.1 4.1 0 0 1-.5-2.78l.15.09 4.95 2.86c.25.14.55.14.8 0l6.04-3.49v2.42a.82.82 0 0 1-.33.7l-5.01 2.89a4.14 4.14 0 0 1-6.1-2.69Zm-.78-9.18a4.1 4.1 0 0 1 2.16-1.9v5.9c0 .29.15.55.4.7l6.03 3.48-2.1 1.21a.82.82 0 0 1-.79 0L4.44 12.8a4.14 4.14 0 0 1-1.49-5.63Zm15.95 3.71-6.04-3.5 2.1-1.21a.82.82 0 0 1 .79 0l5.01 2.89a4.14 4.14 0 0 1-1.56 7.47v-5.9a.82.82 0 0 0-.3-.75Zm1.94-2.8-.15-.09-4.95-2.86a.82.82 0 0 0-.8 0L8.85 8.2V5.78c0-.29.15-.55.4-.7l5.01-2.89a4.14 4.14 0 0 1 6.08 4.28ZM8.56 14.1l-2.1-1.21a.82.82 0 0 1-.07-.12V6.99a4.14 4.14 0 0 1 6.79-3.18l-.15.08-4.95 2.86a.82.82 0 0 0-.4.7v7.01c0 .1-.05.18-.12.24Z" />
        </svg>
      </IconBox>
    ),
  },
  {
    id: "premiere-pro",
    label: "Premiere Pro",
    icon: <IconBox bg="#00005b">Pr</IconBox>,
  },
  {
    id: "photoshop",
    label: "Photoshop",
    icon: <IconBox bg="#001e36">Ps</IconBox>,
  },
  {
    id: "notion",
    label: "Notion",
    icon: (
      <IconBox bg="#fff">
        <span className="text-[11px] font-black text-black">N</span>
      </IconBox>
    ),
  },
  {
    id: "spotify",
    label: "Spotify",
    icon: (
      <IconBox bg="#1DB954">
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-black" aria-hidden>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.62.62 0 0 1-.86.2c-2.35-1.44-5.31-1.76-8.8-.96a.62.62 0 1 1-.28-1.22c3.8-.87 7.07-.5 9.72 1.12a.62.62 0 0 1 .22.86Zm1.23-2.74a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 0 1-.45-1.49c3.64-1.1 8.16-.56 11.23 1.32a.78.78 0 0 1 .26 1.08Zm.1-2.86C14.7 8.9 9.18 8.7 6.1 9.64a.94.94 0 0 1-.55-1.8c3.55-1.08 9.64-.87 13.43 1.34a.94.94 0 1 1-.95 1.61Z" />
        </svg>
      </IconBox>
    ),
  },
  {
    id: "figma",
    label: "Figma",
    icon: (
      <IconBox bg="#1e1e1e">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
          <path fill="#F24E1E" d="M8 2h4v6H8a3 3 0 0 1 0-6Z" />
          <path fill="#FF7262" d="M12 2h4a3 3 0 0 1 0 6h-4V2Z" />
          <path fill="#A259FF" d="M8 8h4v6H8a3 3 0 0 1 0-6Z" />
          <path fill="#1ABCFE" d="M12 8h4a3 3 0 0 1 0 6h-4V8Z" />
          <path fill="#0ACF83" d="M8 14h4v3a3 3 0 1 1-3-3Z" />
        </svg>
      </IconBox>
    ),
  },
];
