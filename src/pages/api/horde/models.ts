import type { NextApiRequest, NextApiResponse } from "next";
import { CURATED_BY_NAME } from "@/lib/horde/constants";
import { fetchModels, HordeError } from "@/lib/horde/server";
import type { ModelInfo } from "@/lib/horde/types";

/** 모델 목록은 자주 바뀌지 않으므로 인스턴스 메모리에 잠깐 캐시한다. */
const CACHE_TTL_MS = 60_000;
let cache: { at: number; data: ModelInfo[] } | null = null;

function toModelInfo(
  raw: Awaited<ReturnType<typeof fetchModels>>
): ModelInfo[] {
  return raw
    // 워커가 0인 모델은 골라도 영원히 대기하게 된다.
    .filter((m) => m.count > 0)
    .map((m) => {
      const curated = CURATED_BY_NAME.get(m.name);
      return {
        name: m.name,
        workers: m.count,
        eta: m.eta,
        jobs: m.jobs,
        recommended: Boolean(curated),
        label: curated?.label,
        description: curated?.description,
        tags: curated?.tags,
      };
    })
    .sort((a, b) => {
      // 추천 모델 먼저, 그다음 워커가 많은 순
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
      return b.workers - a.workers;
    });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ models: ModelInfo[] } | { error: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "GET만 지원합니다." });
  }

  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    res.setHeader("Cache-Control", "public, max-age=30");
    return res.status(200).json({ models: cache.data });
  }

  try {
    const models = toModelInfo(await fetchModels());
    cache = { at: Date.now(), data: models };
    res.setHeader("Cache-Control", "public, max-age=30");
    return res.status(200).json({ models });
  } catch (err) {
    // 목록을 못 가져와도 만료된 캐시가 있으면 그걸로 버틴다.
    if (cache) return res.status(200).json({ models: cache.data });
    const status = err instanceof HordeError ? err.status : 500;
    const error =
      err instanceof Error ? err.message : "모델 목록을 불러오지 못했습니다.";
    return res.status(status).json({ error });
  }
}
