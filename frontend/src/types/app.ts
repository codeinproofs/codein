/**
 * Frontend-facing app types.
 *
 * Re-exports the shared contract from `shared/types.ts` (the single source
 * of truth shared with the backend) and adds a few UI-only helper types.
 */
export type {
  App,
  AppStatus,
  AppFile,
  FileLanguage,
  AppPreview,
  AppPreviewRequest,
  CreateAppRequest,
  CreateAppResponse,
  ListAppsResponse,
  GetAppResponse,
  PumpfunLaunchRequest,
  PumpfunLaunchResponse,
  AppStreamEventType,
  AppFileStreamEvent,
  AppStatusStreamEvent,
  AppDoneStreamEvent,
  AppErrorStreamEvent,
  AppStreamEvent,
  ApiErrorBody,
} from "@shared/types";

import type { AppStatus } from "@shared/types";

/** Sort options exposed on the Launches page. */
export type AppSortKey = "newest" | "oldest" | "name";

/** Filter chip values exposed on the Launches page ("all" = no filter). */
export type AppStatusFilter = AppStatus | "all";

/** Result of parsing a terminal command via `useCommandParser`. */
export interface ParsedCommand {
  /** The raw, untouched input string. */
  raw: string;
  /** The recognized command, e.g. "create". */
  command: "create" | "help" | "clear" | "unknown";
  /** Sub-action, e.g. "new". */
  subject: string | null;
  /** The `--like <template>` value, if present. */
  like: string | null;
  /** Any quoted free-text idea(s), joined by a space. */
  idea: string | null;
  /** True if the command has enough info to submit. */
  isComplete: boolean;
  /** Human readable validation/hint message. */
  hint: string;
}

/** A single autocomplete suggestion chip. */
export interface AutocompleteSuggestion {
  label: string;
  value: string;
  description?: string;
}
