import type { HordeImageParams } from "./types";

/** 익명 키. 우선순위가 가장 낮지만 가입 없이 쓸 수 있다. */
export const ANONYMOUS_API_KEY = "0000000000";

export const HORDE_API_BASE = "https://aihorde.net/api/v2";

/** 호드는 `이름:버전:연락처` 형식의 Client-Agent를 요구한다. */
export const CLIENT_AGENT = "FREEAIz:1.0.0:https://freeaiz.com";

/** 비동기 요청은 10분 뒤 stale 처리되어 삭제된다. */
export const REQUEST_TTL_MS = 10 * 60 * 1000;

/** UI에서 노출하는 샘플러 (전체 목록 중 실사용 빈도가 높은 것만) */
export const SAMPLERS = [
  "k_euler_a",
  "k_euler",
  "k_dpmpp_2m",
  "k_dpmpp_2s_a",
  "k_dpmpp_sde",
  "k_dpm_2",
  "k_dpm_2_a",
  "k_heun",
  "k_lms",
  "DDIM",
  "lcm",
] as const;

export const SCHEDULERS = [
  "karras",
  "normal",
  "simple",
  "exponential",
  "sgm_uniform",
  "align_your_steps",
] as const;

/* ------------------------------------------------------------------ *
 * 해상도
 * ------------------------------------------------------------------ */

export type AspectRatio = {
  id: string;
  label: string;
  /** SDXL 계열 기준 해상도 (약 1MP) */
  hi: { width: number; height: number };
  /** SD1.5 / 빠른 생성 기준 해상도 */
  lo: { width: number; height: number };
};

/** 모든 값은 64의 배수여야 한다 (호드 제약) */
export const ASPECT_RATIOS: AspectRatio[] = [
  {
    id: "square",
    label: "1:1",
    hi: { width: 1024, height: 1024 },
    lo: { width: 512, height: 512 },
  },
  {
    id: "portrait",
    label: "3:4",
    hi: { width: 896, height: 1152 },
    lo: { width: 512, height: 640 },
  },
  {
    id: "tall",
    label: "9:16",
    hi: { width: 768, height: 1344 },
    lo: { width: 448, height: 768 },
  },
  {
    id: "landscape",
    label: "4:3",
    hi: { width: 1152, height: 896 },
    lo: { width: 640, height: 512 },
  },
  {
    id: "wide",
    label: "16:9",
    hi: { width: 1344, height: 768 },
    lo: { width: 768, height: 448 },
  },
];

/* ------------------------------------------------------------------ *
 * 스타일 프리셋
 * ------------------------------------------------------------------ */

export type StylePreset = {
  id: string;
  label: string;
  /** 프롬프트 뒤에 덧붙는 수식어 */
  suffix: string;
  /** 네거티브 프롬프트에 덧붙는 수식어 */
  negative?: string;
  /** 이 스타일에 잘 맞는 모델 (사용 가능할 때만 자동 선택) */
  preferredModels?: string[];
  emoji: string;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "none",
    label: "기본",
    emoji: "✨",
    suffix: "",
  },
  {
    id: "photo",
    label: "실사",
    emoji: "📷",
    suffix:
      "photorealistic, 8k uhd, dslr, sharp focus, high detail, natural lighting, film grain",
    negative: "illustration, painting, drawing, cartoon, anime, 3d render",
    preferredModels: [
      "Juggernaut XL",
      "ICBINP - I Can't Believe It's Not Photography",
      "AlbedoBase XL (SDXL)",
    ],
  },
  {
    id: "anime",
    label: "애니메이션",
    emoji: "🌸",
    suffix:
      "anime style, key visual, vibrant colors, clean lineart, detailed eyes, studio quality",
    negative: "photorealistic, 3d render, ugly, deformed",
    preferredModels: ["Nova Anime XL", "Anything v5", "Flat-2D Animerge"],
  },
  {
    id: "art",
    label: "일러스트",
    emoji: "🎨",
    suffix:
      "digital illustration, concept art, trending on artstation, dramatic lighting, intricate detail",
    negative: "photo, blurry, low quality",
    preferredModels: ["Rev Animated", "AlbedoBase XL (SDXL)"],
  },
  {
    id: "3d",
    label: "3D",
    emoji: "🧊",
    suffix:
      "3d render, octane render, cinema4d, subsurface scattering, soft studio lighting, high detail",
    negative: "flat, 2d, sketch",
    preferredModels: ["AlbedoBase XL (SDXL)", "SDXL 1.0"],
  },
  {
    id: "cinematic",
    label: "시네마틱",
    emoji: "🎬",
    suffix:
      "cinematic still, anamorphic lens, shallow depth of field, moody volumetric lighting, color graded, 35mm",
    negative: "flat lighting, snapshot, low contrast",
    preferredModels: ["Juggernaut XL", "AlbedoBase XL (SDXL)"],
  },
  {
    id: "watercolor",
    label: "수채화",
    emoji: "💧",
    suffix:
      "watercolor painting, soft wash, paper texture, delicate brush strokes, pastel palette",
    negative: "photo, 3d render, harsh lines",
  },
  {
    id: "pixel",
    label: "픽셀아트",
    emoji: "👾",
    suffix:
      "pixel art, 16-bit, limited palette, crisp pixels, retro game sprite",
    negative: "blurry, smooth gradient, photorealistic",
  },
];

/** 모든 생성에 기본으로 붙는 네거티브 프롬프트 */
export const BASE_NEGATIVE_PROMPT =
  "lowres, bad anatomy, bad hands, extra digits, fewer digits, cropped, worst quality, low quality, jpeg artifacts, signature, watermark, username, blurry";

/* ------------------------------------------------------------------ *
 * 모델 큐레이션
 * ------------------------------------------------------------------ */

export type CuratedModel = {
  name: string;
  label: string;
  description: string;
  tags: string[];
  /** SDXL 계열이면 1024급 해상도를 쓴다 */
  sdxl?: boolean;
  /** 이 모델을 쓸 때 강제할 파라미터 (Flux/Turbo 계열은 설정이 다르다) */
  overrides?: Partial<HordeImageParams>;
};

/**
 * 워커 수가 많고 안정적인 SFW 모델 위주. 실제 노출 여부는
 * /v2/status/models 응답과 교집합으로 결정된다.
 */
export const CURATED_MODELS: CuratedModel[] = [
  {
    name: "AlbedoBase XL (SDXL)",
    label: "AlbedoBase XL",
    description: "범용 SDXL. 뭘 넣어도 평균 이상은 나온다",
    tags: ["범용", "SDXL"],
    sdxl: true,
  },
  {
    name: "Juggernaut XL",
    label: "Juggernaut XL",
    description: "인물·풍경 실사에 강함",
    tags: ["실사", "SDXL"],
    sdxl: true,
  },
  {
    name: "Flux.1-Schnell fp8 (Compact)",
    label: "FLUX.1 Schnell",
    description: "프롬프트 이해도 최상. 적은 스텝으로 빠르게",
    tags: ["최신", "빠름"],
    sdxl: true,
    overrides: {
      cfg_scale: 1,
      steps: 8,
      karras: false,
      hires_fix: false,
      sampler_name: "k_euler",
    },
  },
  {
    name: "ICBINP - I Can't Believe It's Not Photography",
    label: "ICBINP",
    description: "사진 같은 결과물. 가볍고 빠름",
    tags: ["실사"],
  },
  {
    name: "Deliberate",
    label: "Deliberate",
    description: "실사와 일러스트 중간. 실패가 적다",
    tags: ["범용"],
  },
  {
    name: "Rev Animated",
    label: "Rev Animated",
    description: "반실사 일러스트, 판타지 연출",
    tags: ["일러스트"],
  },
  {
    name: "Nova Anime XL",
    label: "Nova Anime XL",
    description: "고품질 애니메이션 스타일",
    tags: ["애니", "SDXL"],
    sdxl: true,
  },
  {
    name: "Anything v5",
    label: "Anything v5",
    description: "클래식 애니 스타일. 매우 빠름",
    tags: ["애니", "빠름"],
  },
  {
    name: "Flat-2D Animerge",
    label: "Flat-2D Animerge",
    description: "플랫한 2D 작화",
    tags: ["애니"],
  },
  {
    name: "SDXL 1.0",
    label: "SDXL 1.0",
    description: "스테이블 디퓨전 XL 원본",
    tags: ["범용", "SDXL"],
    sdxl: true,
  },
  {
    name: "Z-Image-Turbo",
    label: "Z-Image Turbo",
    description: "초고속 생성. 대기 시간이 짧다",
    tags: ["빠름"],
    sdxl: true,
    overrides: {
      cfg_scale: 1.5,
      steps: 8,
      karras: false,
      hires_fix: false,
      sampler_name: "k_euler",
    },
  },
  {
    name: "stable_diffusion",
    label: "Stable Diffusion 1.5",
    description: "워커가 가장 많아 대기가 짧다",
    tags: ["빠름"],
  },
];

export const CURATED_BY_NAME = new Map(CURATED_MODELS.map((m) => [m.name, m]));

export const DEFAULT_MODEL = "AlbedoBase XL (SDXL)";

/** UI 기본 파라미터 */
export const DEFAULT_PARAMS: HordeImageParams = {
  sampler_name: "k_euler_a",
  cfg_scale: 7,
  steps: 28,
  n: 1,
  karras: true,
  hires_fix: false,
  width: 1024,
  height: 1024,
};

/** 익명 사용자 보호용 상한 (호드 상한보다 보수적으로 잡는다) */
export const LIMITS = {
  promptMaxLength: 1000,
  minSteps: 1,
  maxSteps: 50,
  minCfg: 0,
  maxCfg: 30,
  minImages: 1,
  maxImages: 4,
  minDimension: 64,
  maxDimension: 1536,
  dimensionStep: 64,
} as const;
