import React, { useEffect, useMemo, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

type ImageParams = {
  sampler_name?: string; // 예: "k_euler_a"
  cfg_scale?: number; // 예: 7
  height?: number; // 예: 768
  width?: number; // 예: 1024
  steps?: number; // 예: 30
  n?: number; // 생성 이미지 개수
  seed?: number; // 고정 시드(선택)
  seed_variation?: number; // 시드 변이(선택)
  clip_skip?: number; // 예: 2
  hires_fix?: boolean; // 업스케일/2패스 최적화
  karras?: boolean; // 스케줄러 옵션
  tiling?: boolean; // 타일링(선택)
  // 필요 시 추가 파라미터를 더 선언
};

type HordeImageRequest = {
  // 공식 SDK 모델명들 참고(ImageGenerateAsyncRequest)
  prompt: string;
  negative_prompt?: string;
  models?: string[]; // ["AlbedoBase XL (SDXL)"] 등
  params?: ImageParams;
  nsfw?: boolean; // NSFW 허용 여부
  censor_nsfw?: boolean; // 서버 측 NSFW 검열 여부(문서상 존재)
  r2?: boolean; // R2 저장소 사용 여부
  shared?: boolean; // 공유 여부
  replacement_filter?: boolean; // 금칙어/치환 필터
  trusted_workers?: boolean; // 신뢰 워커만
  slow_workers?: boolean; // 느린 워커 허용
  allow_downgrade?: boolean; // (문서에서 의미 명확히 확인 못함)
  // source_image, source_mask 등 img2img 관련도 공식 SDK에 존재
};

const SAMPLERS = [
  "k_euler_a",
  "k_euler",
  "k_lms",
  "k_dpm_2",
  "k_dpm_2_a",
  "k_dpmpp_2m",
  "k_dpmpp_2s_a",
  "k_heun",
];
const HomePage = () => {
  const [apiKey, setApiKey] = useState(""); // "0000000000" (가장 낮은 우선순위)
  const [models, setModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // 기본값: 질문에 준 예시와 유사
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");

  const [params, setParams] = useState<ImageParams>({
    sampler_name: "k_euler_a",
    cfg_scale: 7,
    height: 768,
    width: 1024,
    steps: 30,
    n: 1,
    seed_variation: 1,
    clip_skip: 2,
    hires_fix: true,
    karras: true,
  });

  const [flags, setFlags] = useState({
    nsfw: false,
    censor_nsfw: false,
    r2: true,
    shared: false,
    replacement_filter: true,
    trusted_workers: false,
    slow_workers: true,
    allow_downgrade: true, // ⚠️ 공식 문서에서 의미를 못 찾음(아래 주석 참고)
  });

  // 활성 모델 목록 불러오기(공식 엔드포인트 /v2/status/models)
  useEffect(() => {
    fetch("https://aihorde.net/api/v2/status/models")
      .then((r) => r.json())
      .then((list) => {
        // list: [{name: "AlbedoBase XL (SDXL)", ...}, ...] 형태
        const names = Array.isArray(list)
          ? list.map((m: any) => m.name).filter(Boolean)
          : [];
        setModels(names);
        // 초깃값: AlbedoBase XL (SDXL)가 있으면 선택
        if (names.includes("AlbedoBase XL (SDXL)")) {
          setSelectedModels(["AlbedoBase XL (SDXL)"]);
        }
      })
      .catch(() => {
        // 실패 시 하드코딩 폴백
        setModels(["AlbedoBase XL (SDXL)", "Deliberate", "Realistic Vision"]);
      });
  }, []);

  const payload: HordeImageRequest = useMemo(() => {
    const base: HordeImageRequest = {
      prompt,
      negative_prompt: negativePrompt || undefined,
      models: selectedModels.length ? selectedModels : undefined,
      params,
      ...flags,
    };
    return base;
  }, [prompt, negativePrompt, selectedModels, params, flags]);

  // 실제 요청 대신 미리보기만
  const [preview, setPreview] = useState("");
  const handlePreview = () => {
    setPreview(JSON.stringify(payload, null, 2));
  };

  // 선택 핸들러들
  const updateParam = <K extends keyof ImageParams>(k: K, v: ImageParams[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  const toggleFlag = (k: keyof typeof flags) =>
    setFlags((f) => ({ ...f, [k]: !f[k] }));

  // 샘플 curl
  const curl = useMemo(() => {
    const body = JSON.stringify(payload).replaceAll('"', '\\"');
    return `curl -X POST "https://aihorde.net/api/v2/generate/async" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey || "0000000000"}" \\
  -d "${body}"`;
  }, [payload, apiKey]);
  return (
    <div className="bg-red-100">
      <TextareaAutosize
        minRows={3}
        maxRows={10}
        placeholder="프롬프트를 입력하세요..."
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />{" "}
      <main className="mx-auto max-w-[480px] p-4 space-y-4">
        <h1 className="text-xl font-bold">AI Horde 이미지 생성(폼 데모)</h1>

        {/* API Key */}
        <section className="space-y-2">
          <label className="block text-sm font-semibold">API Key (선택)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder='없으면 "0000000000"(우선순위 가장 낮음)'
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-gray-500">※ 공식 Quickstart 참고.</p>
        </section>

        {/* Prompt */}
        <section className="space-y-2">
          <label className="block text-sm font-semibold">Prompt</label>
          <TextareaAutosize
            minRows={3}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="무엇을 그리고 싶은지 자연어로 입력하세요."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <label className="block text-sm font-semibold">
            Negative Prompt (선택)
          </label>
          <TextareaAutosize
            minRows={2}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="배제하고 싶은 요소"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
          />
        </section>

        {/* Models */}
        <section className="space-y-2">
          <label className="block text-sm font-semibold">
            Model 선택(복수 가능)
          </label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            multiple
            value={selectedModels}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map(
                (o) => o.value
              );
              setSelectedModels(opts);
            }}
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            ※ 활성 모델은 /v2/status/models에서 조회.
          </p>
        </section>

        {/* Params */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">파라미터(params)</h2>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs">sampler_name</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={params.sampler_name}
                onChange={(e) => updateParam("sampler_name", e.target.value)}
              >
                {SAMPLERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs">cfg_scale</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={params.cfg_scale ?? 7}
                onChange={(e) =>
                  updateParam("cfg_scale", Number(e.target.value))
                }
              />
            </div>

            <div>
              <label className="block text-xs">width</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={params.width ?? 1024}
                onChange={(e) => updateParam("width", Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs">height</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={params.height ?? 768}
                onChange={(e) => updateParam("height", Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs">steps</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={params.steps ?? 30}
                onChange={(e) => updateParam("steps", Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs">n (images)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={params.n ?? 1}
                onChange={(e) => updateParam("n", Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs">seed (선택)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={params.seed ?? ""}
                onChange={(e) =>
                  updateParam(
                    "seed",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>

            <div>
              <label className="block text-xs">seed_variation (선택)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={params.seed_variation ?? 1}
                onChange={(e) =>
                  updateParam("seed_variation", Number(e.target.value))
                }
              />
            </div>

            <div>
              <label className="block text-xs">clip_skip</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={params.clip_skip ?? 2}
                onChange={(e) =>
                  updateParam("clip_skip", Number(e.target.value))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={params.hires_fix ?? false}
                onChange={() =>
                  updateParam("hires_fix", !(params.hires_fix ?? false))
                }
              />
              hires_fix
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={params.karras ?? false}
                onChange={() =>
                  updateParam("karras", !(params.karras ?? false))
                }
              />
              karras
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={params.tiling ?? false}
                onChange={() =>
                  updateParam("tiling", !(params.tiling ?? false))
                }
              />
              tiling
            </label>
          </div>
        </section>

        {/* Flags */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">플래그</h2>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                "nsfw",
                "censor_nsfw",
                "r2",
                "shared",
                "replacement_filter",
                "trusted_workers",
                "slow_workers",
                "allow_downgrade",
              ] as (keyof typeof flags)[]
            ).map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={flags[k]}
                  onChange={() => toggleFlag(k)}
                />
                {k}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            ※ `allow_downgrade`의 정확한 의미는 **공식 SDK/문서에서 확인하지
            못했습니다**. 필요 시 제거하거나 기본값을 유지하세요.
          </p>
        </section>

        {/* Preview / curl */}
        <section className="space-y-2">
          <button
            className="px-3 py-2 border rounded text-sm"
            onClick={handlePreview}
          >
            Payload 미리보기
          </button>

          {preview && (
            <>
              <h3 className="text-sm font-semibold pt-2">요청 JSON</h3>
              <pre className="text-xs border rounded p-2 overflow-auto bg-gray-50">
                {preview}
              </pre>

              <h3 className="text-sm font-semibold pt-2">curl 샘플</h3>
              <pre className="text-xs border rounded p-2 overflow-auto bg-gray-50">
                {curl}
              </pre>

              <details className="text-xs">
                <summary className="cursor-pointer">fetch 예시(참고용)</summary>
                <pre className="text-xs border rounded p-2 overflow-auto bg-gray-50">
                  {`fetch("https://aihorde.net/api/v2/generate/async", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": "${apiKey || "0000000000"}"
  },
  body: JSON.stringify(${preview})
});`}
                </pre>
              </details>
            </>
          )}
        </section>

        <footer className="text-xs text-gray-500">
          실제 전송은 프로젝트 요구에 맞게 버튼을 분리해 처리하세요.
        </footer>
      </main>
    </div>
  );
};

export default HomePage;
