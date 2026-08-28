import { useState } from "react";
import Link from "next/link";
import CreationCard from "@/components/creation/CreationCard";
import CreationDetail from "@/components/creation/CreationDetail";
import { useCreations } from "@/hooks/useCreations";
import type { CreationView } from "@/lib/storage/creations";

/** 홈에서 보여 주는 최근 생성물 미리보기. 저장된 게 없으면 아무것도 그리지 않는다. */
export default function RecentCreations() {
  const { creations, loading } = useCreations();
  const [selected, setSelected] = useState<CreationView | null>(null);

  if (loading || creations.length === 0) return null;

  return (
    <section className="space-y-3 border-y border-gray-100 px-4 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">최근에 만든 이미지</h2>
        <Link
          href="/my-creation"
          className="text-[11px] text-gray-500 underline underline-offset-2 hover:text-gray-800"
        >
          전체 보기
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {creations.slice(0, 6).map((creation) => (
          <CreationCard
            key={creation.id}
            creation={creation}
            onOpen={setSelected}
          />
        ))}
      </div>

      <CreationDetail creation={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
