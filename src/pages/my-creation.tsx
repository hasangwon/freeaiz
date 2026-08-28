import { useEffect, useState } from "react";
import Link from "next/link";
import CreationCard from "@/components/creation/CreationCard";
import CreationDetail from "@/components/creation/CreationDetail";
import Seo from "@/components/common/Seo";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { useCreations } from "@/hooks/useCreations";
import { estimateUsage, MAX_CREATIONS } from "@/lib/storage/creations";
import { formatBytes } from "@/lib/utils/format";
import type { CreationView } from "@/lib/storage/creations";

export default function MyCreationPage() {
  const { creations, loading, error, remove, removeAll } = useCreations();
  const [selected, setSelected] = useState<CreationView | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [usage, setUsage] = useState<string | null>(null);

  useEffect(() => {
    estimateUsage().then((result) => {
      if (result) setUsage(formatBytes(result.usage));
    });
  }, [creations.length]);

  return (
    <>
      <Seo
        title="MY CREATION"
        description="이 브라우저에 저장된 생성 이미지를 모아 봅니다."
        noIndex
      />

      <main className="flex-1 px-4 py-5">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">
              MY CREATION
            </h1>
            <p className="text-[11px] text-gray-500">
              {creations.length}장 저장됨
              {usage ? ` · ${usage} 사용 중` : ""}
            </p>
          </div>
          {creations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingClear(true)}
            >
              전체 삭제
            </Button>
          )}
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        {confirmingClear && (
          <div className="mb-4 space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-xs text-red-800">
              저장된 이미지 {creations.length}장을 모두 지웁니다. 되돌릴 수
              없습니다.
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  await removeAll();
                  setConfirmingClear(false);
                }}
              >
                삭제하기
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingClear(false)}
              >
                취소
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : creations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 px-6 py-14 text-center">
            <span aria-hidden className="text-3xl">
              🖼️
            </span>
            <p className="text-sm font-semibold text-gray-800">
              아직 만든 이미지가 없습니다
            </p>
            <p className="text-xs leading-relaxed text-gray-500">
              첫 이미지를 만들면 이곳에 자동으로 보관됩니다.
            </p>
            <Link href="/create">
              <Button size="md">이미지 만들러 가기</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {creations.map((creation) => (
              <CreationCard
                key={creation.id}
                creation={creation}
                onOpen={setSelected}
              />
            ))}
          </div>
        )}

        {creations.length > 0 && (
          <p className="pt-4 text-[11px] leading-relaxed text-gray-400">
            이미지는 서버가 아니라 이 브라우저(IndexedDB)에만 저장됩니다. 방문
            기록을 지우거나 다른 기기에서 접속하면 보이지 않습니다. 최근{" "}
            {MAX_CREATIONS}장까지 보관됩니다.
          </p>
        )}

        <CreationDetail
          creation={selected}
          onClose={() => setSelected(null)}
          onDelete={remove}
        />
      </main>
    </>
  );
}
