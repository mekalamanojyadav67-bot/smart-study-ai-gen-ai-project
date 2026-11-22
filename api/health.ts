import { MODEL_NAME } from "../server/studyHandlers.ts";
import {
  sendJson,
  type VercelLikeRequest,
  type VercelLikeResponse,
} from "./_utils.ts";

export default function handler(
  _req: VercelLikeRequest,
  res: VercelLikeResponse
) {
  sendJson(res, 200, { ok: true, model: MODEL_NAME });
}
