/**
 * Shared contract mirroring the FastAPI/Pydantic schemas.
 * Backend is the source of truth for field names.
 */

export type AppStatus = "building" | "reviewing" | "shipped";

export type FileLanguage =
  | "typescript"
  | "tsx"
  | "javascript"
  | "jsx"
  | "json"
  | "css"
  | "html"
  | "markdown"
  | "python"
  | "bash"
  | "yaml"
  | "plaintext";

export interface AppFile {
  id?: string;
  app_id?: string;
  path: string;
  content: string;
  language?: FileLanguage;
  generated_at?: string;
}

export interface App {
  id: string;
  name: string;
  ticker: string;
  description: string;
  idea: string;
  template: string;
  status: AppStatus;
  status_detail: string;
  icon_url: string | null;
  owner_wallet: string | null;
  pumpfun_signature: string | null;
  pumpfun_mint: string | null;
  vercel_deployment_url: string | null;
  created_at: string;
  updated_at: string;
}

/** POST /apps/preview — dry-run, no mint */
export interface AppPreviewRequest {
  idea: string;
  template?: string | null;
}

export interface AppPreview {
  idea: string;
  template: string;
  name: string;
  ticker: string;
  description: string;
  icon_prompt: string;
  icon_url?: string | null;
  mock: boolean;
  will_launch_coin: boolean;
  will_generate_code: boolean;
  will_deploy: boolean;
}

/** POST /apps/create */
export interface CreateAppRequest {
  idea: string;
  template?: string | null;
  owner_wallet?: string | null;
  name?: string | null;
  ticker?: string | null;
  description?: string | null;
}

export interface CreateAppResponse {
  id: string;
  name: string;
  ticker: string;
  status: AppStatus;
  status_detail: string;
}

export interface ListAppsResponse {
  items: App[];
  total: number;
  page: number;
  page_size: number;
}

export type GetAppResponse = App;

export interface PumpfunLaunchRequest {
  app_id: string;
  name: string;
  ticker: string;
  description?: string;
  icon_url?: string | null;
}

export interface PumpfunLaunchResponse {
  signature: string;
  mint: string;
  mock: boolean;
}

export type AppStreamEventType = "file" | "status" | "done" | "error";

export interface AppFileStreamEvent {
  type: "file";
  path: string;
  content: string;
  generated_at?: string;
}

export interface AppStatusStreamEvent {
  type: "status";
  status: AppStatus;
  detail?: string;
}

export interface AppDoneStreamEvent {
  type: "done";
  app_id: string;
  status: AppStatus;
  vercel_deployment_url?: string | null;
  pumpfun_signature?: string | null;
  pumpfun_mint?: string | null;
  file_count?: number;
}

export interface AppErrorStreamEvent {
  type: "error";
  message: string;
  app_id?: string;
}

export type AppStreamEvent =
  | AppFileStreamEvent
  | AppStatusStreamEvent
  | AppDoneStreamEvent
  | AppErrorStreamEvent;

/** FastAPI default error shape */
export interface ApiErrorBody {
  detail?: string | { msg?: string }[];
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
