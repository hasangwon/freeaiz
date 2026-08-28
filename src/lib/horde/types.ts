/**
 * AI Horde (https://aihorde.net) v2 API 타입.
 * 스펙 출처: https://aihorde.net/api/swagger.json (v5.1.8 기준)
 */

/** 이미지 생성 파라미터 (ModelGenerationInputStable) */
export type HordeImageParams = {
  sampler_name?: string;
  /** 0 ~ 100. Flux 계열은 1 고정 */
  cfg_scale?: number;
  /** 64 ~ 3072, 64의 배수 */
  height?: number;
  /** 64 ~ 3072, 64의 배수 */
  width?: number;
  /** 1 ~ 500 */
  steps?: number;
  /** 생성 장수. 1 ~ 20 */
  n?: number;
  /** 숫자뿐 아니라 문자열도 허용된다 (API 상 string) */
  seed?: string;
  /** n > 1 일 때 시드 증가폭. 1 ~ 1000 */
  seed_variation?: number;
  /** 1 ~ 12 */
  clip_skip?: number;
  karras?: boolean;
  scheduler?: string;
  hires_fix?: boolean;
  tiling?: boolean;
  transparent?: boolean;
  denoising_strength?: number;
  facefixer_strength?: number;
  post_processing?: string[];
};

/** 생성 요청 본문 (GenerationInputStable) */
export type HordeGenerationInput = {
  prompt: string;
  params?: HordeImageParams;
  models?: string[];
  nsfw?: boolean;
  censor_nsfw?: boolean;
  /** true면 이미지를 Cloudflare R2 다운로드 링크로 받는다 (base64 대신) */
  r2?: boolean;
  /** 익명 사용자는 항상 true로 강제된다 */
  shared?: boolean;
  replacement_filter?: boolean;
  trusted_workers?: boolean;
  validated_backends?: boolean;
  slow_workers?: boolean;
  extra_slow_workers?: boolean;
  disable_batching?: boolean;
  /** true면 실제 생성 없이 kudos 비용만 계산해서 반환 */
  dry_run?: boolean;
};

/** POST /v2/generate/async 202 응답 (RequestAsync) */
export type HordeAsyncResponse = {
  id: string;
  kudos?: number;
  message?: string;
  warnings?: { code: string; message: string }[];
};

/** GET /v2/generate/check/{id} 응답 (RequestStatusCheck) */
export type HordeCheckResponse = {
  finished: number;
  processing: number;
  restarted: number;
  waiting: number;
  done: boolean;
  faulted: boolean;
  /** 전체 잡 완료까지 남은 예상 초 */
  wait_time: number;
  /** 호드 전체 큐에서의 순번 */
  queue_position: number;
  kudos: number;
  /** false면 현재 워커 풀로는 이 요청을 처리할 수 없다 */
  is_possible: boolean;
  eligible_workers?: number;
  eligible_worker_threads?: number;
  might_stall?: boolean;
};

/** 생성 결과 1장 (GenerationStable) */
export type HordeGeneration = {
  /** r2:true면 URL, false면 base64 webp */
  img: string;
  seed: string;
  id: string;
  censored?: boolean;
  model: string;
  worker_id?: string;
  worker_name?: string;
  state?: "ok" | "censored" | "faulted";
  gen_metadata?: { type: string; value: string; ref?: string }[];
};

/** GET /v2/generate/status/{id} 응답 (RequestStatusStable) */
export type HordeStatusResponse = HordeCheckResponse & {
  generations: HordeGeneration[];
  shared?: boolean;
};

/** GET /v2/status/models 응답 항목 */
export type HordeModelStatus = {
  name: string;
  count: number;
  performance: number;
  queued: number;
  jobs: number;
  eta: number;
  type: "image" | "text";
};

/** 에러 응답 (RequestError) */
export type HordeErrorResponse = {
  message?: string;
  /** 호드 리턴 코드. 예: "MissingPrompt", "MaintenanceMode" */
  rc?: string;
  errors?: Record<string, string>;
};

/* ------------------------------------------------------------------ *
 * 앱 내부에서 쓰는 타입
 * ------------------------------------------------------------------ */

/** 클라이언트 → /api/horde/generate 요청 */
export type GenerateRequestBody = {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  params?: HordeImageParams;
  nsfw?: boolean;
  /** 비용만 확인하고 실제 생성은 하지 않음 */
  dryRun?: boolean;
};

/** /api/horde/status/[id] 응답 */
export type GenerationStatus = {
  id: string;
  done: boolean;
  faulted: boolean;
  isPossible: boolean;
  queuePosition: number;
  waitTime: number;
  finished: number;
  processing: number;
  waiting: number;
  restarted: number;
  kudos: number;
  eligibleWorkers: number;
  generations: HordeGeneration[];
};

/** 앱이 노출하는 모델 정보 */
export type ModelInfo = {
  name: string;
  /** 이 모델을 돌리고 있는 워커 수 */
  workers: number;
  /** 대기열 기준 예상 소요 초 */
  eta: number;
  /** 큐에 쌓인 작업 수 */
  jobs: number;
  /** 큐레이션 목록에 있는 모델인지 */
  recommended: boolean;
  label?: string;
  description?: string;
  tags?: string[];
};

/** GET /v2/status/performance 응답 (이미지 관련 항목만 사용) */
export type HordePerformance = {
  queued_requests: number;
  worker_count: number;
  thread_count: number;
  queued_megapixelsteps: number;
  past_minute_megapixelsteps: number;
};

/** 홈 화면 상태 표시줄용 */
export type HordeLiveStatus = {
  /** 접속 중인 이미지 워커 수 */
  workers: number;
  /** 대기 중인 이미지 요청 수 */
  queuedRequests: number;
  /** 처리량 기준 대략적인 대기 시간(초). 계산 불가 시 null */
  estimatedWaitSeconds: number | null;
  online: boolean;
};
