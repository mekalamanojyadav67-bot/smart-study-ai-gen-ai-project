import type { IncomingMessage, ServerResponse } from "node:http";

export interface VercelLikeRequest extends IncomingMessage {
  body?: unknown;
}

export interface VercelLikeResponse extends ServerResponse {
  status?: (code: number) => VercelLikeResponse;
  json?: (body: unknown) => void;
}

export async function parseJsonBody<T extends Record<string, unknown>>(
  req: VercelLikeRequest
): Promise<T> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as T;
  }
  if (typeof req.body === "string") {
    return JSON.parse(req.body) as T;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {} as T;
  return JSON.parse(raw) as T;
}

export function sendJson(
  res: VercelLikeResponse,
  status: number,
  data: unknown
): void {
  if (typeof res.status === "function" && typeof res.json === "function") {
    const nextRes = res.status(status);
    if (typeof nextRes.json === "function") {
      nextRes.json(data);
      return;
    }
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}
