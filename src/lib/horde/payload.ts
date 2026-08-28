import {
  BASE_NEGATIVE_PROMPT,
  CURATED_BY_NAME,
  DEFAULT_MODEL,
  LIMITS,
  STYLE_PRESETS,
} from "./constants";
import type {
  GenerateRequestBody,
  HordeGenerationInput,
  HordeImageParams,
} from "./types";

/**
 * 앱 요청 → AI Horde 요청 본문 변환.
 * 값 보정과 모델별 강제 파라미터를 여기서 한 번에 처리한다.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** 64의 배수로 맞추고 허용 범위 안으로 자른다. */
export function normalizeDimension(value: number): number {
  const stepped =
    Math.round(value / LIMITS.dimensionStep) * LIMITS.dimensionStep;
  return clamp(stepped, LIMITS.minDimension, LIMITS.maxDimension);
}

/**
 * AI Horde는 별도의 negative_prompt 필드가 없다.
 * 프롬프트 한 문자열 안에서 `###`로 긍정/부정을 구분한다.
 */
export function joinPrompt(prompt: string, negative?: string): string {
  const positive = prompt.trim();
  const neg = negative?.trim();
  return neg ? `${positive} ### ${neg}` : positive;
}

/** 스타일 프리셋을 프롬프트/네거티브에 반영한다. */
export function applyStyle(
  prompt: string,
  negative: string,
  styleId: string
): { prompt: string; negative: string } {
  const style = STYLE_PRESETS.find((s) => s.id === styleId);
  if (!style || style.id === "none") return { prompt, negative };

  return {
    prompt: [prompt.trim(), style.suffix].filter(Boolean).join(", "),
    negative: [negative.trim(), style.negative].filter(Boolean).join(", "),
  };
}

function sanitizeParams(
  input: HordeImageParams | undefined,
  model: string
): HordeImageParams {
  const p: HordeImageParams = { ...input };
  const curated = CURATED_BY_NAME.get(model);

  // 모델이 요구하는 값이 있으면 사용자 입력보다 우선한다.
  // (예: FLUX는 cfg_scale 1 / 저스텝이 아니면 결과가 망가진다)
  if (curated?.overrides) Object.assign(p, curated.overrides);

  const out: HordeImageParams = {
    width: normalizeDimension(p.width ?? 1024),
    height: normalizeDimension(p.height ?? 1024),
    steps: clamp(Math.round(p.steps ?? 28), LIMITS.minSteps, LIMITS.maxSteps),
    n: clamp(Math.round(p.n ?? 1), LIMITS.minImages, LIMITS.maxImages),
    cfg_scale:
      Math.round(clamp(p.cfg_scale ?? 7, LIMITS.minCfg, LIMITS.maxCfg) * 10) /
      10,
    sampler_name: p.sampler_name || "k_euler_a",
  };

  if (p.karras !== undefined) out.karras = p.karras;
  if (p.hires_fix !== undefined) out.hires_fix = p.hires_fix;
  if (p.tiling !== undefined) out.tiling = p.tiling;
  if (p.transparent !== undefined) out.transparent = p.transparent;
  if (p.scheduler) out.scheduler = p.scheduler;
  if (p.post_processing?.length) out.post_processing = p.post_processing;

  if (p.clip_skip !== undefined && p.clip_skip !== null) {
    out.clip_skip = clamp(Math.round(p.clip_skip), 1, 12);
  }

  // 시드는 API 상 문자열이다. 빈 값이면 워커가 무작위로 정한다.
  const seed = typeof p.seed === "string" ? p.seed.trim() : "";
  if (seed) {
    out.seed = seed;
    if ((out.n ?? 1) > 1) out.seed_variation = clamp(p.seed_variation ?? 1, 1, 1000);
  }

  // hires_fix는 512보다 큰 변에서만 의미가 있고, 작으면 호드가 거부한다.
  if (out.hires_fix && Math.max(out.width!, out.height!) <= 576) {
    out.hires_fix = false;
  }

  return out;
}

export function buildGenerationInput(
  body: GenerateRequestBody
): HordeGenerationInput {
  const prompt = body.prompt?.trim();
  if (!prompt) throw new ValidationError("프롬프트를 입력해 주세요.");
  if (prompt.length > LIMITS.promptMaxLength) {
    throw new ValidationError(
      `프롬프트는 ${LIMITS.promptMaxLength}자를 넘을 수 없습니다.`
    );
  }

  const model = body.model?.trim() || DEFAULT_MODEL;
  const nsfw = body.nsfw === true;

  const negative = [BASE_NEGATIVE_PROMPT, body.negativePrompt?.trim()]
    .filter(Boolean)
    .join(", ");

  return {
    prompt: joinPrompt(prompt, negative),
    params: sanitizeParams(body.params, model),
    models: [model],
    nsfw,
    // true로 두면 SFW 워커의 안전 필터가 오탐할 때 실제 이미지 대신
    // 검은 "CENSORED" 판이 돌아온다. 평범한 프롬프트에서도 발생하므로
    // API 기본값인 false를 유지하고, 검열 여부는 결과 화면에서 안내한다.
    censor_nsfw: false,
    // 이미지를 base64가 아닌 R2 링크로 받아 응답 크기를 줄인다.
    r2: true,
    // 익명 사용자는 어차피 항상 공유된다. 명시하면 kudos 비용이 낮아진다.
    shared: true,
    replacement_filter: true,
    // 익명은 우선순위가 낮으므로 느린 워커까지 허용해야 대기가 짧다.
    trusted_workers: false,
    slow_workers: true,
    validated_backends: true,
    dry_run: body.dryRun === true,
  };
}
