import { CURATED_BY_NAME, LIMITS, SAMPLERS } from "@/lib/horde/constants";
import type { CreateSettings } from "@/lib/horde/settings";

type Props = {
  settings: CreateSettings;
  disabled?: boolean;
  onChange: <K extends keyof CreateSettings>(
    key: K,
    value: CreateSettings[K]
  ) => void;
};

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold text-gray-800">{label}</label>
        <span className="font-mono text-xs text-gray-500">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
      />
      {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-2.5 ${
        disabled ? "opacity-50" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-primary)] disabled:cursor-not-allowed"
      />
      <span>
        <span className="block text-xs font-semibold text-gray-800">
          {label}
        </span>
        {hint && <span className="block text-[11px] text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}

export default function AdvancedSettings({
  settings,
  disabled,
  onChange,
}: Props) {
  const curated = CURATED_BY_NAME.get(settings.model);
  const overrides = curated?.overrides;
  // FLUX/Turbo 계열은 서버에서 파라미터를 강제하므로 미리 알려 준다.
  const overridden = new Set(Object.keys(overrides ?? {}));

  const lockNote = (key: string) =>
    overridden.has(key)
      ? `${curated?.label ?? "이 모델"}은(는) 이 값을 자체 설정으로 대체합니다`
      : undefined;

  return (
    <details className="group rounded-2xl border border-gray-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold text-gray-900">
        고급 설정
        <span className="text-gray-400 transition group-open:rotate-180">▾</span>
      </summary>

      <div className="space-y-5 border-t border-gray-100 px-4 py-4">
        {overrides && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
            {curated?.label}은(는) 권장 설정이 정해져 있어 일부 값이 자동으로
            조정됩니다.
          </p>
        )}

        {/* 생성 장수 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-800">
            생성 장수
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: LIMITS.maxImages }, (_, i) => i + 1).map(
              (n) => (
                <button
                  key={n}
                  type="button"
                  disabled={disabled}
                  aria-pressed={settings.count === n}
                  onClick={() => onChange("count", n)}
                  className={[
                    "cursor-pointer rounded-lg border py-2 text-xs font-medium transition",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    settings.count === n
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {n}장
                </button>
              )
            )}
          </div>
          <p className="text-[11px] text-gray-500">
            여러 장을 요청하면 그만큼 대기 시간이 길어집니다.
          </p>
        </div>

        <Slider
          label="스텝"
          hint={
            lockNote("steps") ??
            "높을수록 디테일이 살지만 대기가 길어집니다. 25~30이 무난합니다."
          }
          value={settings.steps}
          min={LIMITS.minSteps}
          max={LIMITS.maxSteps}
          disabled={disabled || overridden.has("steps")}
          onChange={(v) => onChange("steps", v)}
        />

        <Slider
          label="CFG (프롬프트 반영 강도)"
          hint={
            lockNote("cfg_scale") ??
            "낮으면 자유롭게, 높으면 프롬프트에 충실하게. 7 전후를 권장합니다."
          }
          value={settings.cfgScale}
          min={1}
          max={20}
          step={0.5}
          disabled={disabled || overridden.has("cfg_scale")}
          onChange={(v) => onChange("cfgScale", v)}
        />

        {/* 샘플러 */}
        <div className="space-y-1.5">
          <label
            htmlFor="sampler"
            className="text-xs font-semibold text-gray-800"
          >
            샘플러
          </label>
          <select
            id="sampler"
            value={settings.sampler}
            disabled={disabled || overridden.has("sampler_name")}
            onChange={(e) => onChange("sampler", e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {SAMPLERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {lockNote("sampler_name") && (
            <p className="text-[11px] text-gray-500">
              {lockNote("sampler_name")}
            </p>
          )}
        </div>

        {/* 시드 */}
        <div className="space-y-1.5">
          <label htmlFor="seed" className="text-xs font-semibold text-gray-800">
            시드
          </label>
          <div className="flex gap-2">
            <input
              id="seed"
              value={settings.seed}
              disabled={disabled}
              onChange={(e) => onChange("seed", e.target.value)}
              placeholder="비워 두면 매번 무작위"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange("seed", String(Math.floor(Math.random() * 1e9)))
              }
              className="shrink-0 cursor-pointer rounded-xl border border-gray-300 px-3 text-sm transition hover:bg-gray-50 disabled:opacity-50"
              aria-label="시드 무작위 생성"
            >
              🎲
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            같은 시드 + 같은 설정이면 비슷한 결과가 다시 나옵니다.
          </p>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <Toggle
            label="Karras 스케줄"
            hint={lockNote("karras") ?? "대부분의 모델에서 결과가 부드러워집니다"}
            checked={settings.karras}
            disabled={disabled || overridden.has("karras")}
            onChange={(v) => onChange("karras", v)}
          />
          <Toggle
            label="Hires fix"
            hint={
              lockNote("hires_fix") ??
              "저해상도로 먼저 그린 뒤 확대합니다. 구도가 안정되지만 느려집니다"
            }
            checked={settings.hiresFix}
            disabled={disabled || overridden.has("hires_fix")}
            onChange={(v) => onChange("hiresFix", v)}
          />
          <Toggle
            label="NSFW 허용"
            hint="성인 콘텐츠를 검열 없이 받습니다. 만 18세 이상만 사용하세요"
            checked={settings.nsfw}
            disabled={disabled}
            onChange={(v) => onChange("nsfw", v)}
          />
        </div>
      </div>
    </details>
  );
}
