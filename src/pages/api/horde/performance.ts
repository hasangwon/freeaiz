import type { NextApiRequest, NextApiResponse } from "next";
import { fetchPerformance } from "@/lib/horde/server";
import type { HordeLiveStatus } from "@/lib/horde/types";

const CACHE_TTL_MS = 20_000;
let cache: { at: number; data: HordeLiveStatus } | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HordeLiveStatus>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return res.status(200).json(cache.data);
  }

  try {
    const perf = await fetchPerformance();

    // 밀린 작업량 ÷ 분당 처리량 → 대략적인 대기 시간
    const throughput = perf.past_minute_megapixelsteps;
    const estimatedWaitSeconds =
      throughput > 0
        ? Math.round((perf.queued_megapixelsteps / throughput) * 60)
        : null;

    const data: HordeLiveStatus = {
      workers: perf.worker_count,
      queuedRequests: perf.queued_requests,
      estimatedWaitSeconds,
      online: perf.worker_count > 0,
    };

    cache = { at: Date.now(), data };
    res.setHeader("Cache-Control", "public, max-age=15");
    return res.status(200).json(data);
  } catch {
    // 상태 표시는 부가 정보이므로 실패해도 화면을 막지 않는다.
    return res.status(200).json({
      workers: 0,
      queuedRequests: 0,
      estimatedWaitSeconds: null,
      online: false,
    });
  }
}
