import { handleExtractPdf } from "../server/studyHandlers.ts";
import {
  parseJsonBody,
  sendJson,
  type VercelLikeRequest,
  type VercelLikeResponse,
} from "./_utils.ts";

export default async function handler(
  req: VercelLikeRequest,
  res: VercelLikeResponse
) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const body = await parseJsonBody<{ base64Data?: string; fileName?: string }>(
      req
    );
    const result = await handleExtractPdf(body);
    sendJson(res, result.status, result.data);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Invalid request payload.";
    sendJson(res, 400, { error: msg });
  }
}
