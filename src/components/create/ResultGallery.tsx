import { useState } from "react";
import CreationCard from "@/components/creation/CreationCard";
import CreationDetail from "@/components/creation/CreationDetail";
import Button from "@/components/ui/Button";
import { downloadUrl } from "@/lib/utils/download";
import { toFilenameSlug } from "@/lib/utils/format";
import type { CreationView } from "@/lib/storage/creations";

type Props = {
  results: CreationView[];
  onRegenerate: () => void;
  busy?: boolean;
};

export default function ResultGallery({
  results,
  onRegenerate,
  busy,
}: Props) {
  const [selected, setSelected] = useState<CreationView | null>(null);
  if (results.length === 0) return null;

  const downloadAll = () => {
    results.forEach((result, index) => {
      const name = `${toFilenameSlug(result.prompt)}-${index + 1}.webp`;
      downloadUrl(result.url, name);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">
          결과 {results.length}장
        </h2>
        <button
          type="button"
          onClick={downloadAll}
          className="cursor-pointer text-[11px] text-gray-500 underline underline-offset-2 hover:text-gray-800"
        >
          전부 다운로드
        </button>
      </div>

      <div
        className={`grid gap-2 ${
          results.length === 1 ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        {results.map((result) => (
          <CreationCard
            key={result.id}
            creation={result}
            onOpen={setSelected}
          />
        ))}
      </div>

      <p className="text-[11px] text-gray-500">
        결과는 이 브라우저의 <strong>MY CREATION</strong>에 자동 저장됩니다.
      </p>

      <Button
        variant="secondary"
        fullWidth
        loading={busy}
        onClick={onRegenerate}
      >
        같은 프롬프트로 다시 만들기
      </Button>

      <CreationDetail
        creation={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
