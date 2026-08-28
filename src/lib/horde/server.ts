import {
  ANONYMOUS_API_KEY,
  CLIENT_AGENT,
  HORDE_API_BASE,
} from "./constants";
import type {
  HordeAsyncResponse,
  HordeCheckResponse,
  HordeErrorResponse,
  HordeGenerationInput,
  HordeModelStatus,
  HordePerformance,
  HordeStatusResponse,
} from "./types";

/**
 * 서버 전용 AI Horde 클라이언트.
 * API 키를 브라우저에 노출하지 않고, CORS와 레이트리밋을 서버에서 처리하기 위해
 * 모든 호출은 Next API 라우트를 거친다.
 */

/** 호드 리턴 코드를 그대로 던져서 라우트가 상태 코드로 변환할 수 있게 한다. */
export class HordeError extends Error {
  readonly status: number;
  readonly rc?: string;

  constructor(message: string, status: number, rc?: string) {
    super(message);
    this.name = "HordeError";
    this.status = status;
    this.rc = rc;
  }
}

/** 호드 리턴 코드 → 한국어 안내 문구 */
const RC_MESSAGES: Record<string, string> = {
  MaintenanceMode: "AI Horde가 점검 중입니다. 잠시 후 다시 시도해 주세요.",
  TooManyPrompts:
    "동시에 처리할 수 있는 요청 수를 넘었습니다. 앞선 생성이 끝난 뒤 다시 시도해 주세요.",
  KudosUpfront:
    "이 설정은 익명 사용자에게 너무 비쌉니다. 해상도나 스텝을 낮춰 주세요.",
  InvalidAPIKey: "API 키가 올바르지 않습니다.",
  AnonForbidden: "익명 사용자는 이 기능을 사용할 수 없습니다.",
  MissingPrompt: "프롬프트를 입력해 주세요.",
  CorruptPrompt: "사용할 수 없는 표현이 프롬프트에 포함되어 있습니다.",
  Profanity: "사용할 수 없는 표현이 프롬프트에 포함되어 있습니다.",
  InvalidSize: "해상도는 64의 배수여야 하며 3072를 넘을 수 없습니다.",
  TooManySteps: "스텝 수가 너무 큽니다.",
  UnsupportedModel: "선택한 모델을 현재 사용할 수 없습니다.",
  UnsupportedSampler: "선택한 모델이 이 샘플러를 지원하지 않습니다.",
  ClipSkipMismatch:
    "선택한 모델이 이 clip skip 값을 지원하지 않습니다. 고급 설정을 초기화해 주세요.",
  HiResFixMismatch:
    "선택한 모델은 hires fix를 지원하지 않습니다. 고급 설정에서 꺼 주세요.",
  Img2ImgMismatch: "선택한 모델은 이 방식의 요청을 지원하지 않습니다.",
  TilingMismatch: "선택한 모델은 타일링을 지원하지 않습니다.",
  BadCFGNumber: "CFG 값이 이 모델의 허용 범위를 벗어났습니다.",
  BadCFGDecimals: "CFG는 소수점 한 자리까지만 지정할 수 있습니다.",
  NoValidWorkers:
    "지금 이 조건을 처리할 수 있는 워커가 없습니다. 모델이나 설정을 바꿔 보세요.",
  RequestNotFound: "요청을 찾을 수 없습니다. 10분이 지나 만료되었을 수 있습니다.",
  UnsafeIP: "현재 네트워크에서는 익명 요청이 차단되었습니다.",
  TooManySameIPs: "같은 네트워크에서 요청이 너무 많습니다.",
};

function serverApiKey(): string {
  const key = process.env.HORDE_API_KEY?.trim();
  return key && key.length > 0 ? key : ANONYMOUS_API_KEY;
}

function baseHeaders(): Record<string, string> {
  return {
    "Client-Agent": CLIENT_AGENT,
    accept: "application/json",
  };
}

async function readError(res: Response): Promise<HordeError> {
  let body: HordeErrorResponse = {};
  try {
    body = (await res.json()) as HordeErrorResponse;
  } catch {
    // 호드가 JSON이 아닌 응답을 준 경우
  }

  const fieldErrors = body.errors
    ? Object.entries(body.errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(", ")
    : "";

  const message =
    (body.rc && RC_MESSAGES[body.rc]) ||
    body.message ||
    fieldErrors ||
    `AI Horde 요청이 실패했습니다 (HTTP ${res.status})`;

  return new HordeError(
    fieldErrors && body.rc && RC_MESSAGES[body.rc]
      ? `${message} (${fieldErrors})`
      : message,
    res.status,
    body.rc
  );
}

async function hordeFetch<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 20_000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${HORDE_API_BASE}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: { ...baseHeaders(), ...(rest.headers as object) },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new HordeError("AI Horde 응답이 지연되고 있습니다.", 504);
    }
    throw new HordeError("AI Horde에 연결할 수 없습니다.", 502);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw await readError(res);
  return (await res.json()) as T;
}

/** 생성 요청을 큐에 등록하고 요청 ID를 받는다. */
export function submitGeneration(
  payload: HordeGenerationInput
): Promise<HordeAsyncResponse> {
  return hordeFetch<HordeAsyncResponse>("/generate/async", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serverApiKey(),
    },
    body: JSON.stringify(payload),
  });
}

/** 이미지를 받지 않고 진행 상황만 확인한다 (폴링용, 대역폭 절약). */
export function checkGeneration(id: string): Promise<HordeCheckResponse> {
  return hordeFetch<HordeCheckResponse>(
    `/generate/check/${encodeURIComponent(id)}`
  );
}

/** 완료된 요청의 이미지까지 함께 받는다. done 이후 한 번만 호출할 것. */
export function fetchGenerationResult(
  id: string
): Promise<HordeStatusResponse> {
  return hordeFetch<HordeStatusResponse>(
    `/generate/status/${encodeURIComponent(id)}`,
    { timeoutMs: 30_000 }
  );
}

/** 진행 중인 요청을 취소한다. 이미 끝난 이미지는 함께 반환된다. */
export function cancelGeneration(id: string): Promise<HordeStatusResponse> {
  return hordeFetch<HordeStatusResponse>(
    `/generate/status/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

/** 현재 활성화된 이미지 모델 목록. */
export function fetchModels(): Promise<HordeModelStatus[]> {
  return hordeFetch<HordeModelStatus[]>("/status/models?type=image");
}

/** 호드 전체 부하 상태. 홈 화면 상태 표시에 쓴다. */
export function fetchPerformance(): Promise<HordePerformance> {
  return hordeFetch<HordePerformance>("/status/performance", {
    timeoutMs: 10_000,
  });
}
