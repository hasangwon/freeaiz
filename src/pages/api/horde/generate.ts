import type { NextApiRequest, NextApiResponse } from "next";
import { buildGenerationInput, ValidationError } from "@/lib/horde/payload";
import { HordeError, submitGeneration } from "@/lib/horde/server";
import type { GenerateRequestBody, HordeAsyncResponse } from "@/lib/horde/types";

/**
 * 같은 IP에서 과도하게 큐를 점유하지 않도록 하는 최소한의 보호 장치.
 * 서버리스에서는 인스턴스별로만 동작하므로 정확한 제한이 아니라 완충 목적이다.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

function clientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // 오래된 항목이 쌓이지 않도록 가끔 정리한다.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HordeAsyncResponse | { error: string; rc?: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST만 지원합니다." });
  }

  if (rateLimited(clientIp(req))) {
    return res
      .status(429)
      .json({ error: "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요." });
  }

  try {
    const payload = buildGenerationInput(req.body as GenerateRequestBody);
    const result = await submitGeneration(payload);
    return res.status(202).json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof HordeError) {
      return res.status(err.status).json({ error: err.message, rc: err.rc });
    }
    return res.status(500).json({ error: "생성 요청에 실패했습니다." });
  }
}
