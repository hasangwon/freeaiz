import { ASPECT_RATIOS } from "@/lib/horde/constants";

type Props = {
  ratioId: string;
  hiRes: boolean;
  width: number;
  height: number;
  disabled?: boolean;
  onRatioChange: (id: string) => void;
  onHiResChange: (hiRes: boolean) => void;
};

/** 비율 버튼 안에 들어가는 작은 사각형 미리보기 */
function RatioGlyph({ w, h }: { w: number; h: number }) {
  const scale = 18 / Math.max(w, h);
  return (
    <span
      aria-hidden
      className="block rounded-[3px] border-[1.5px] border-current"
      style={{ width: w * scale, height: h * scale }}
    />
  );
}

export default function SizePicker({
  ratioId,
  hiRes,
  width,
  height,
  disabled,
  onRatioChange,
  onHiResChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {ASPECT_RATIOS.map((ratio) => {
          const active = ratio.id === ratioId;
          return (
            <button
              key={ratio.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onRatioChange(ratio.id)}
              className={[
                "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border py-3 text-[11px] font-medium transition",
                "disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
              ].join(" ")}
            >
              <RatioGlyph w={ratio.hi.width} h={ratio.hi.height} />
              {ratio.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-2.5">
        <div>
          <p className="text-xs font-semibold text-gray-800">고해상도</p>
          <p className="text-[11px] text-gray-500">
            끄면 절반 크기로 훨씬 빠르게 생성됩니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-gray-500">
            {width}×{height}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={hiRes}
            aria-label="고해상도"
            disabled={disabled}
            onClick={() => onHiResChange(!hiRes)}
            className={[
              "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition",
              "disabled:cursor-not-allowed disabled:opacity-50",
              hiRes ? "bg-primary" : "bg-gray-300",
            ].join(" ")}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                hiRes ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
