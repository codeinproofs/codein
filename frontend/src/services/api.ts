/**
 * Thin REST client for the CodeIn backend.
 */
import type {
  App,
  AppPreview,
  AppPreviewRequest,
  CreateAppRequest,
  CreateAppResponse,
  GetAppResponse,
  ListAppsResponse,
  ApiErrorBody,
  AppStatus,
} from "@/types/app";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function url(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function extractErrorMessage(body: Partial<ApiErrorBody> | null, fallback: string): string {
  if (!body) return fallback;
  if (body.error?.message) return body.error.message;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail) && body.detail[0]?.msg) return body.detail[0].msg!;
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    throw new ApiError(
      "Could not reach the CodeIn backend. Is it running?",
      "network_error",
      0,
      { cause: String(err) }
    );
  }

  if (!res.ok) {
    let body: Partial<ApiErrorBody> | null = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    throw new ApiError(
      extractErrorMessage(body, `Request failed with status ${res.status}`),
      body?.error?.code ?? "unknown_error",
      res.status,
      body?.error?.details
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface ListAppsParams {
  q?: string;
  status?: AppStatus;
  sort?: "created_at" | "ticker";
  page?: number;
  page_size?: number;
}

export const api = {
  health(): Promise<{ status: string }> {
    return request("/health");
  },

  previewApp(payload: AppPreviewRequest): Promise<AppPreview> {
    return request("/apps/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  createApp(payload: CreateAppRequest): Promise<CreateAppResponse> {
    return request("/apps/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listApps(params: ListAppsParams = {}): Promise<ListAppsResponse> {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.status) qs.set("status", params.status);
    if (params.sort) qs.set("sort", params.sort);
    if (params.page) qs.set("page", String(params.page));
    if (params.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request(`/apps${query ? `?${query}` : ""}`);
  },

  getApp(id: string): Promise<GetAppResponse> {
    return request(`/apps/${encodeURIComponent(id)}`);
  },

  appFileStreamUrl(id: string): string {
    return url(`/apps/${encodeURIComponent(id)}/files/stream`);
  },
};

export type { App };
