import { useCallback, useEffect, useState } from "react";
import { CURATED_MODELS, DEFAULT_MODEL } from "@/lib/horde/constants";
import type { ModelInfo } from "@/lib/horde/types";

/** 호드 목록을 못 가져왔을 때 쓸 최소 폴백. */
const FALLBACK: ModelInfo[] = CURATED_MODELS.map((m) => ({
  name: m.name,
  workers: 0,
  eta: 0,
  jobs: 0,
  recommended: true,
  label: m.label,
  description: m.description,
  tags: m.tags,
}));

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/horde/models", { signal });
      const data = (await res.json()) as {
        models?: ModelInfo[];
        error?: string;
      };
      if (!res.ok || !data.models?.length) {
        throw new Error(data.error ?? "모델 목록을 불러오지 못했습니다.");
      }
      setModels(data.models);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // 폴백 목록이 이미 들어 있으므로 화면은 계속 동작한다.
      setError(
        err instanceof Error ? err.message : "모델 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const recommended = models.filter((m) => m.recommended);

  return {
    models,
    recommended: recommended.length ? recommended : FALLBACK,
    loading,
    error,
    reload: () => load(),
    defaultModel:
      recommended.find((m) => m.name === DEFAULT_MODEL)?.name ??
      recommended[0]?.name ??
      DEFAULT_MODEL,
  };
}
