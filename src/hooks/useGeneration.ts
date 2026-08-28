import { useCallback, useEffect, useRef, useState } from "react";
import { REQUEST_TTL_MS } from "@/lib/horde/constants";
import { applyStyle } from "@/lib/horde/payload";
import {
  saveCreation,
  toImageBlob,
  type Creation,
  type CreationView,
} from "@/lib/storage/creations";
import type {
  GenerationStatus,
  HordeAsyncResponse,
  HordeImageParams,
} from "@/lib/horde/types";

export type GenerationPhase =
  | "idle"
  | "submitting"
  | "queued"
  | "processing"
  | "saving"
  | "done"
  | "error";

export type GenerationProgress = {
  queuePosition: number;
  /** 호드가 추정한 남은 대기 시간(초) */
  waitTime: number;
  finished: number;
  processing: number;
  waiting: number;
  total: number;
  eligibleWorkers: number;
  /** false면 현재 워커 풀로는 처리할 수 없는 조건이다 */
  isPossible: boolean;
  /** 제출 후 경과 시간(초) */
  elapsed: number;
};

export type GenerateInput = {
  prompt: string;
  negativePrompt: string;
  model: string;
  styleId: string;
  params: HordeImageParams;
  nsfw: boolean;
};

const EMPTY_PROGRESS: GenerationProgress = {
  queuePosition: 0,
  waitTime: 0,
  finished: 0,
  processing: 0,
  waiting: 0,
  total: 0,
  eligibleWorkers: 0,
  isPossible: true,
  elapsed: 0,
};

/** 큐에서 대기 중일 때와 실제 생성 중일 때 폴링 간격을 다르게 준다. */
const POLL_QUEUED_MS = 2500;
const POLL_PROCESSING_MS = 1500;

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `요청이 실패했습니다 (HTTP ${res.status})`);
  }
  return data;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useGeneration() {
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [progress, setProgress] = useState<GenerationProgress>(EMPTY_PROGRESS);
  const [results, setResults] = useState<CreationView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  // 폴링 루프와 언마운트/취소 사이의 경합을 막기 위한 참조들
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);
  const requestIdRef = useRef<string | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const revokeUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
      revokeUrls();
    };
  }, [revokeUrls]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    requestIdRef.current = null;
    revokeUrls();
    setPhase("idle");
    setProgress(EMPTY_PROGRESS);
    setResults([]);
    setError(null);
    setWarning(null);
    setRequestId(null);
  }, [revokeUrls]);

  /** 진행 중인 요청을 호드 쪽에서도 취소한다. */
  const cancel = useCallback(async () => {
    const id = requestIdRef.current;
    cancelledRef.current = true;
    requestIdRef.current = null;

    if (id) {
      // 실패해도 사용자 흐름을 막을 이유는 없다.
      await fetch(`/api/horde/status/${id}`, { method: "DELETE" }).catch(
        () => undefined
      );
    }
    if (!mountedRef.current) return;
    setPhase("idle");
    setProgress(EMPTY_PROGRESS);
    setRequestId(null);
  }, []);

  const generate = useCallback(
    async (input: GenerateInput) => {
      cancelledRef.current = false;
      revokeUrls();
      setResults([]);
      setError(null);
      setWarning(null);
      setPhase("submitting");
      setProgress(EMPTY_PROGRESS);

      const startedAt = Date.now();
      const styled = applyStyle(
        input.prompt,
        input.negativePrompt,
        input.styleId
      );

      try {
        const submitted = await readJson<HordeAsyncResponse>(
          await fetch("/api/horde/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: styled.prompt,
              negativePrompt: styled.negative,
              model: input.model,
              params: input.params,
              nsfw: input.nsfw,
            }),
          })
        );

        if (cancelledRef.current || !mountedRef.current) return;

        requestIdRef.current = submitted.id;
        setRequestId(submitted.id);
        setPhase("queued");
        if (submitted.warnings?.length) {
          setWarning(submitted.warnings.map((w) => w.message).join(" · "));
        }

        // ---- 폴링 루프 ----
        let status: GenerationStatus | null = null;
        while (!cancelledRef.current) {
          const elapsed = Date.now() - startedAt;
          if (elapsed > REQUEST_TTL_MS) {
            throw new Error(
              "10분이 지나 요청이 만료되었습니다. 해상도나 스텝을 낮춰서 다시 시도해 주세요."
            );
          }

          const current = await readJson<GenerationStatus>(
            await fetch(`/api/horde/status/${submitted.id}`)
          );
          if (cancelledRef.current || !mountedRef.current) return;

          const total =
            current.finished + current.processing + current.waiting;

          setProgress({
            queuePosition: current.queuePosition,
            waitTime: current.waitTime,
            finished: current.finished,
            processing: current.processing,
            waiting: current.waiting,
            total: total || (input.params.n ?? 1),
            eligibleWorkers: current.eligibleWorkers,
            isPossible: current.isPossible,
            elapsed: Math.round(elapsed / 1000),
          });

          if (current.faulted) {
            throw new Error(
              "호드 내부 오류로 생성이 중단되었습니다. 다시 시도해 주세요."
            );
          }
          if (!current.isPossible) {
            throw new Error(
              "지금 이 조건을 처리할 수 있는 워커가 없습니다. 모델이나 해상도를 바꿔 보세요."
            );
          }

          setPhase(current.processing > 0 ? "processing" : "queued");

          if (current.done) {
            status = current;
            break;
          }

          await sleep(
            current.processing > 0 ? POLL_PROCESSING_MS : POLL_QUEUED_MS
          );
        }

        if (cancelledRef.current || !mountedRef.current || !status) return;

        if (status.generations.length === 0) {
          throw new Error("생성된 이미지가 없습니다. 다시 시도해 주세요.");
        }

        // ---- 결과 저장 ----
        setPhase("saving");
        const saved: CreationView[] = [];

        for (const gen of status.generations) {
          const blob = await toImageBlob(gen.img);
          const record: Creation = {
            id: gen.id,
            prompt: input.prompt.trim(),
            negativePrompt: input.negativePrompt.trim(),
            model: gen.model || input.model,
            styleId: input.styleId,
            seed: gen.seed ?? "",
            width: input.params.width ?? 0,
            height: input.params.height ?? 0,
            steps: input.params.steps ?? 0,
            cfgScale: input.params.cfg_scale ?? 0,
            sampler: input.params.sampler_name ?? "",
            censored: Boolean(gen.censored),
            workerName: gen.worker_name,
            createdAt: Date.now(),
            image: blob,
          };

          // 저장이 막혀도(시크릿 모드, 용량 초과) 결과는 보여 준다.
          await saveCreation(record).catch(() => {
            setWarning(
              "이미지를 브라우저에 저장하지 못했습니다. 다운로드로 받아 주세요."
            );
          });

          const url = URL.createObjectURL(blob);
          objectUrlsRef.current.push(url);
          const { image: _image, ...rest } = record;
          saved.push({ ...rest, url });
        }

        if (cancelledRef.current || !mountedRef.current) return;

        // 워커의 안전 필터는 평범한 프롬프트에도 가끔 오탐한다.
        // 이 경우 실제 그림 대신 검은 판이 오므로 재시도를 안내한다.
        const censoredCount = saved.filter((s) => s.censored).length;
        if (censoredCount === saved.length) {
          setWarning(
            "워커의 안전 필터에 걸려 이미지 대신 검열 화면이 왔습니다. 다시 시도하면 다른 워커에서 정상적으로 나오는 경우가 많습니다."
          );
        } else if (censoredCount > 0) {
          setWarning(
            `${censoredCount}장이 워커의 안전 필터에 걸려 검열되었습니다. 다시 시도해 보세요.`
          );
        }

        setResults(saved);
        setPhase("done");
        requestIdRef.current = null;
        setRequestId(null);
      } catch (err) {
        if (cancelledRef.current || !mountedRef.current) return;
        setError(
          err instanceof Error ? err.message : "생성에 실패했습니다."
        );
        setPhase("error");
        requestIdRef.current = null;
        setRequestId(null);
      }
    },
    [revokeUrls]
  );

  const isBusy =
    phase === "submitting" ||
    phase === "queued" ||
    phase === "processing" ||
    phase === "saving";

  return {
    phase,
    progress,
    results,
    error,
    warning,
    requestId,
    isBusy,
    generate,
    cancel,
    reset,
    dismissWarning: () => setWarning(null),
  };
}
