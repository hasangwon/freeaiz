import {
  ASPECT_RATIOS,
  CURATED_BY_NAME,
  DEFAULT_MODEL,
  LIMITS,
} from "./constants";
import type { HordeImageParams } from "./types";

/** 생성 화면이 들고 있는 전체 입력 상태. */
export type CreateSettings = {
  prompt: string;
  negativePrompt: string;
  styleId: string;
  model: string;
  ratioId: string;
  /** true면 SDXL급(약 1MP), false면 절반 해상도로 빠르게 */
  hiRes: boolean;
  count: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  /** 빈 문자열이면 워커가 무작위로 정한다 */
  seed: string;
  karras: boolean;
  hiresFix: boolean;
  nsfw: boolean;
};

export const DEFAULT_SETTINGS: CreateSettings = {
  prompt: "",
  negativePrompt: "",
  styleId: "none",
  model: DEFAULT_MODEL,
  ratioId: "square",
  hiRes: true,
  count: 1,
  steps: 28,
  cfgScale: 7,
  sampler: "k_euler_a",
  seed: "",
  karras: true,
  hiresFix: false,
  nsfw: false,
};

/** 설정 + 선택 모델 → 호드 파라미터 */
export function resolveParams(settings: CreateSettings): HordeImageParams {
  const ratio =
    ASPECT_RATIOS.find((r) => r.id === settings.ratioId) ?? ASPECT_RATIOS[0];
  const curated = CURATED_BY_NAME.get(settings.model);

  // SD1.5 계열은 1024에서 구도가 무너지므로 저해상도 쪽을 쓴다.
  const useHi = settings.hiRes && curated?.sdxl !== false;
  const size = useHi ? ratio.hi : ratio.lo;

  return {
    width: size.width,
    height: size.height,
    steps: settings.steps,
    n: settings.count,
    cfg_scale: settings.cfgScale,
    sampler_name: settings.sampler,
    karras: settings.karras,
    hires_fix: settings.hiresFix,
    // clip_skip은 보내지 않는다. 모델마다 허용 값이 달라서 값을 고정하면
    // 일부 모델에서 ClipSkipMismatch로 요청이 거부된다.
    seed: settings.seed.trim() || undefined,
    seed_variation: settings.count > 1 ? 1 : undefined,
  };
}

/** 최종적으로 호드에 전달될 해상도 (미리보기 표시용) */
export function resolveSize(settings: CreateSettings) {
  const params = resolveParams(settings);
  return { width: params.width ?? 0, height: params.height ?? 0 };
}

const STORAGE_KEY = "freeaiz:settings:v1";

/** 프롬프트를 뺀 나머지 설정만 브라우저에 기억해 둔다. */
export function loadSettings(): Partial<CreateSettings> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<CreateSettings>;
    delete parsed.prompt;
    return parsed;
  } catch {
    return {};
  }
}

export function saveSettings(settings: CreateSettings): void {
  if (typeof window === "undefined") return;
  try {
    const { prompt: _prompt, ...rest } = settings;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // 시크릿 모드 등에서 실패할 수 있지만 생성 자체에는 영향이 없다.
  }
}

export function clampSettings(settings: CreateSettings): CreateSettings {
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));
  return {
    ...settings,
    count: clamp(Math.round(settings.count), LIMITS.minImages, LIMITS.maxImages),
    steps: clamp(Math.round(settings.steps), LIMITS.minSteps, LIMITS.maxSteps),
    cfgScale: clamp(settings.cfgScale, LIMITS.minCfg, LIMITS.maxCfg),
  };
}

const REUSE_KEY = "freeaiz:reuse";

/**
 * "이 설정으로 다시 만들기"용 임시 전달.
 * URL에 담기엔 값이 많아서 세션 저장소를 경유한다.
 */
export function stashReuse(settings: Partial<CreateSettings>): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(REUSE_KEY, JSON.stringify(settings));
  } catch {
    // 저장에 실패하면 그냥 기본 설정으로 열린다.
  }
}

/** 한 번 읽으면 지운다. */
export function popReuse(): Partial<CreateSettings> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(REUSE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(REUSE_KEY);
    return JSON.parse(raw) as Partial<CreateSettings>;
  } catch {
    return null;
  }
}
