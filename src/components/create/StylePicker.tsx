import { STYLE_PRESETS } from "@/lib/horde/constants";

type Props = {
  value: string;
  disabled?: boolean;
  onChange: (styleId: string) => void;
};

export default function StylePicker({ value, disabled, onChange }: Props) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {STYLE_PRESETS.map((style) => {
        const active = style.id === value;
        return (
          <button
            key={style.id}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(style.id)}
            className={[
              "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition",
              "disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
            ].join(" ")}
          >
            <span aria-hidden>{style.emoji}</span>
            {style.label}
          </button>
        );
      })}
    </div>
  );
}
