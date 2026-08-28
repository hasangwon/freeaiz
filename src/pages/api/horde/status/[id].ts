import type { NextApiRequest, NextApiResponse } from "next";
import {
  cancelGeneration,
  checkGeneration,
  fetchGenerationResult,
  HordeError,
} from "@/lib/horde/server";
import type {
  GenerationStatus,
  HordeCheckResponse,
  HordeGeneration,
} from "@/lib/horde/types";

function toStatus(
  id: string,
  check: HordeCheckResponse,
  generations: HordeGeneration[]
): GenerationStatus {
  return {
    id,
    done: check.done,
    faulted: check.faulted,
    isPossible: check.is_possible !== false,
    queuePosition: check.queue_position ?? 0,
    waitTime: check.wait_time ?? 0,
    finished: check.finished ?? 0,
    processing: check.processing ?? 0,
    waiting: check.waiting ?? 0,
    restarted: check.restarted ?? 0,
    kudos: check.kudos ?? 0,
    eligibleWorkers: check.eligible_workers ?? 0,
    generations,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerationStatus | { error: string; rc?: string }>
) {
  const { id } = req.query;
  if (typeof id !== "string" || !id) {
    return res.status(400).json({ error: "요청 ID가 없습니다." });
  }

  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "DELETE") {
      // 취소해도 이미 완성된 이미지는 함께 돌려받는다.
      const result = await cancelGeneration(id);
      return res
        .status(200)
        .json(toStatus(id, result, result.generations ?? []));
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET, DELETE");
      return res.status(405).json({ error: "GET 또는 DELETE만 지원합니다." });
    }

    // 폴링 중에는 이미지를 포함하지 않는 check를 쓰고,
    // 완료된 뒤에만 status로 실제 결과를 한 번 가져온다.
    const check = await checkGeneration(id);
    if (!check.done) return res.status(200).json(toStatus(id, check, []));

    const result = await fetchGenerationResult(id);
    return res.status(200).json(toStatus(id, result, result.generations ?? []));
  } catch (err) {
    if (err instanceof HordeError) {
      return res.status(err.status).json({ error: err.message, rc: err.rc });
    }
    return res.status(500).json({ error: "상태를 확인하지 못했습니다." });
  }
}
