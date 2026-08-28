import type { ReactNode } from "react";

type Tone = "error" | "warning" | "info";

const TONES: Record<Tone, { box: string; icon: string }> = {
  error: { box: "bg-red-50 border-red-200 text-red-800", icon: "⚠️" },
  warning: { box: "bg-amber-50 border-amber-200 text-amber-900", icon: "💡" },
  info: { box: "bg-sky-50 border-sky-200 text-sky-900", icon: "ℹ️" },
};

type Props = {
  tone?: Tone;
  children: ReactNode;
  onDismiss?: () => void;
};

export default function Alert({ tone = "info", children, onDismiss }: Props) {
  const style = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${style.box}`}
    >
      <span aria-hidden className="shrink-0">
        {style.icon}
      </span>
      <p className="flex-1 break-words">{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="닫기"
          className="shrink-0 cursor-pointer opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}
