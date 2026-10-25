/**
 * Thin client wrapper around the backend's pump.fun adapter.
 *
 * The frontend never talks to pump.fun directly — the backend owns the
 * mint keypair / launch wallet and performs the real (or mocked) launch.
 * This module just calls `POST /pumpfun/launch` and shapes the response.
 */
import { API_BASE_URL, ApiError } from "./api";
import type { PumpfunLaunchRequest, PumpfunLaunchResponse } from "@/types/app";

export const pumpfun = {
  /** POST /pumpfun/launch */
  async launch(payload: PumpfunLaunchRequest): Promise<PumpfunLaunchResponse> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/pumpfun/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      throw new ApiError("Could not reach pump.fun launch service.", "network_error", 0, {
        cause: String(err),
      });
    }

    if (!res.ok) {
      let message = `Launch failed with status ${res.status}`;
      let code = "launch_failed";
      try {
        const body = await res.json();
        message = body?.error?.message ?? message;
        code = body?.error?.code ?? code;
      } catch {
        // ignore
      }
      throw new ApiError(message, code, res.status);
    }

    return (await res.json()) as PumpfunLaunchResponse;
  },

  /** Build a public pump.fun URL for a given mint address (best-effort). */
  publicUrl(mintAddress: string): string {
    return `https://pump.fun/${mintAddress}`;
  },
};
