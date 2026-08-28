import { useState } from "react";
import { formatDuration } from "@/lib/utils/format";
import type { ModelInfo } from "@/lib/horde/types";

type Props = {
  models: ModelInfo[];
  all: ModelInfo[];
  value: string;
  disabled?: boolean;
  loading?: boolean;
  onChange: (model: string) => void;
};

/** 대기열 상황을 한눈에 보여 주는 배지 */
function QueueBadge({ model }: { model: ModelInfo }) {
  if (model.workers === 0) {
    return <span className="text-[11px] text-gray-400">워커 정보 없음</span>;
  }
  const busy = model.eta > 120;
  return (
    <span className="flex items-center gap-1.5 text-[11px]">
      <span className="text-gray-500">워커 {model.workers}</span>
      <span
        className={busy ? "text-amber-600" : "text-emerald-600"}
        title="현재 대기열 기준 예상 소요 시간"
      >
        ~{formatDuration(model.eta)}
      </span>
    </span>
  );
}

export default function ModelPicker({
  models,
  all,
  value,
  disabled,
  loading,
  onChange,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  // 추천 목록에 없는 모델을 고른 상태라면 그 항목도 같이 보여 준다.
  const selectedOutside =
    !models.some((m) => m.name === value) &&
    all.find((m) => m.name === value);
  const visible = selectedOutside ? [selectedOutside, ...models] : models;

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        {visible.map((model) => {
          const active = model.name === value;
          return (
            <button
              key={model.name}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onChange(model.name)}
              className={[
                "flex w-full cursor-pointer flex-col gap-0.5 rounded-xl border px-3.5 py-2.5 text-left transition",
                "disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
              ].join(" ")}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-gray-900">
                  {model.label ?? model.name}
                </span>
                <QueueBadge model={model} />
              </span>
              {model.description && (
                <span className="text-[11px] text-gray-500">
                  {model.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="text-[11px] text-gray-400">모델 상태를 불러오는 중…</p>
      )}

      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        className="cursor-pointer text-[11px] text-gray-500 underline underline-offset-2 hover:text-gray-800"
      >
        {showAll ? "전체 모델 접기" : `전체 모델 보기 (${all.length}개)`}
      </button>

      {showAll && (
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        >
          {all.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name} · 워커 {model.workers}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
