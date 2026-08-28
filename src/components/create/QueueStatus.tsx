import Button from "@/components/ui/Button";
import { formatDuration } from "@/lib/utils/format";
import type { GenerationPhase, GenerationProgress } from "@/hooks/useGeneration";

type Props = {
  phase: GenerationPhase;
  progress: GenerationProgress;
  onCancel: () => void;
};

const PHASE_LABEL: Record<GenerationPhase, string> = {
  idle: "",
  submitting: "요청을 보내는 중",
  queued: "대기열에서 순서를 기다리는 중",
  processing: "워커가 그리는 중",
  saving: "이미지를 저장하는 중",
  done: "완료",
  error: "실패",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="font-mono text-sm font-semibold text-gray-800">
        {value}
      </span>
    </div>
  );
}

export default function QueueStatus({ phase, progress, onCancel }: Props) {
  const active =
    phase === "submitting" ||
    phase === "queued" ||
    phase === "processing" ||
    phase === "saving";
  if (!active) return null;

  const total = Math.max(progress.total, 1);
  const ratio = progress.finished / total;
  // 큐에 있는 동안은 진행률을 알 수 없으므로 막대를 흐르게 둔다.
  const indeterminate = phase === "submitting" || phase === "queued";

  return (
    <div className="space-y-3 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-primary"
            aria-hidden
          />
          <p className="text-sm font-bold text-gray-900">
            {PHASE_LABEL[phase]}
          </p>
        </div>
        <span className="font-mono text-xs text-gray-500">
          {formatDuration(progress.elapsed)} 경과
        </span>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-primary/15"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={indeterminate ? undefined : progress.finished}
        aria-label="생성 진행률"
      >
        {indeterminate ? (
          <div className="h-full w-1/3 animate-[queue-slide_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
        ) : (
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${Math.max(6, ratio * 100)}%` }}
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="대기 순번"
          value={
            progress.queuePosition > 0 ? `${progress.queuePosition}번째` : "곧"
          }
        />
        <Stat
          label="예상 남은 시간"
          value={progress.waitTime > 0 ? formatDuration(progress.waitTime) : "-"}
        />
        <Stat label="완료" value={`${progress.finished} / ${total}`} />
      </div>

      <p className="text-[11px] leading-relaxed text-gray-500">
        {progress.eligibleWorkers > 0
          ? `이 조건을 처리할 수 있는 워커 ${progress.eligibleWorkers}대가 대기 중입니다. `
          : ""}
        AI Horde는 전 세계 사용자가 GPU를 나눠 쓰는 무료 대기열이라, 시간대에
        따라 순번이 밀릴 수 있습니다.
      </p>

      <Button variant="secondary" size="sm" fullWidth onClick={onCancel}>
        취소하기
      </Button>
    </div>
  );
}
