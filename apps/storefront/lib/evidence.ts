import { createEvidenceLog } from "./payload";
import type { EvidenceType } from "@my-store/types";

// ---------------------
// Client-side helpers
// ---------------------

export function generateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem("evidence_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    sessionStorage.setItem("evidence_session_id", sessionId);
  }
  return sessionId;
}

export function getDeviceInfo(): { device: string; browser: string } {
  if (typeof window === "undefined") {
    return { device: "server", browser: "server" };
  }

  const ua = navigator.userAgent;
  let device = "Desktop";
  if (/Mobile|Android|iPhone|iPad/.test(ua)) device = "Mobile";
  if (/Tablet|iPad/.test(ua)) device = "Tablet";

  let browser = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";

  return { device, browser };
}

// ---------------------
// API call to log evidence
// ---------------------

interface LogEvidenceParams {
  type: EvidenceType;
  orderId?: string;
  data?: Record<string, any>;
}

export async function logEvidence(params: LogEvidenceParams): Promise<void> {
  const sessionId = generateSessionId();
  const { device, browser } = getDeviceInfo();

  await fetch("/api/evidence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: params.type,
      orderId: params.orderId,
      sessionId,
      device,
      browser,
      data: params.data,
    }),
  });
}

// ---------------------
// Server-side: extract IP from request
// ---------------------

export function extractIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export function extractUserAgent(request: Request): string {
  return request.headers.get("user-agent") || "unknown";
}
