import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Button from "@/components/ui/Button";
import { stashReuse } from "@/lib/horde/settings";
import { copyText, downloadUrl } from "@/lib/utils/download";
import { formatDate, toFilenameSlug } from "@/lib/utils/format";
import type { CreationView } from "@/lib/storage/creations";

type Props = {
  creation: CreationView | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1.5 text-xs">
      <dt className="w-20 shrink-0 text-gray-400">{label}</dt>
      <dd className="min-w-0 flex-1 break-words font-mono text-gray-700">
        {value}
      </dd>
    </div>
  );
}

export default function CreationDetail({
  creation,
  onClose,
  onDelete,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // 모달이 열려 있는 동안 배경 스크롤을 막고 ESC로 닫는다.
  useEffect(() => {
    if (!creation) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [creation, onClose]);

  useEffect(() => setCopied(false), [creation]);

  if (!creation) return null;

  const filename = `${toFilenameSlug(creation.prompt)}-${creation.seed || creation.id.slice(0, 6)}.webp`;

  const handleCopy = async () => {
    setCopied(await copyText(creation.prompt));
  };

  const handleReuse = () => {
    stashReuse({
      prompt: creation.prompt,
      negativePrompt: creation.negativePrompt,
      styleId: creation.styleId,
      model: creation.model,
      seed: creation.seed,
      steps: creation.steps,
      cfgScale: creation.cfgScale,
      sampler: creation.sampler,
    });
    router.push("/create");
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="생성 이미지 상세"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
          <h2 className="text-sm font-bold text-gray-900">이미지 정보</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="cursor-pointer rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creation.url}
          alt={creation.prompt || "생성된 이미지"}
          className="w-full bg-gray-100 object-contain"
        />

        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-900">프롬프트</p>
              <button
                type="button"
                onClick={handleCopy}
                className="cursor-pointer text-[11px] text-gray-500 underline underline-offset-2 hover:text-gray-800"
              >
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
            <p className="whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
              {creation.prompt || "(비어 있음)"}
            </p>
          </div>

          <dl className="divide-y divide-gray-100 border-y border-gray-100">
            <Row label="모델" value={creation.model} />
            <Row
              label="해상도"
              value={`${creation.width} × ${creation.height}`}
            />
            <Row label="시드" value={creation.seed || "무작위"} />
            <Row
              label="스텝 / CFG"
              value={`${creation.steps} / ${creation.cfgScale}`}
            />
            <Row label="샘플러" value={creation.sampler} />
            {creation.workerName && (
              <Row label="워커" value={creation.workerName} />
            )}
            <Row label="생성 시각" value={formatDate(creation.createdAt)} />
          </dl>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => downloadUrl(creation.url, filename)}
            >
              ⬇ 다운로드
            </Button>
            <Button onClick={handleReuse}>↻ 이 설정으로</Button>
          </div>

          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={() => {
                onDelete(creation.id);
                onClose();
              }}
            >
              삭제
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
