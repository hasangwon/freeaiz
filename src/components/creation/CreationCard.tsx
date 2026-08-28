import type { CreationView } from "@/lib/storage/creations";

type Props = {
  creation: CreationView;
  onOpen: (creation: CreationView) => void;
};

export default function CreationCard({ creation, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen(creation)}
      className="group relative block w-full cursor-pointer overflow-hidden rounded-xl bg-gray-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        aspectRatio:
          creation.width && creation.height
            ? `${creation.width} / ${creation.height}`
            : "1 / 1",
      }}
    >
      {/* 로컬 blob URL이라 next/image 최적화 대상이 아니다 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={creation.url}
        alt={creation.prompt || "생성된 이미지"}
        loading="lazy"
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      />

      {creation.censored && (
        <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
          검열됨
        </span>
      )}

      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6 text-left text-[11px] leading-snug text-white opacity-0 transition group-hover:opacity-100">
        <span className="line-clamp-2">{creation.prompt}</span>
      </span>
    </button>
  );
}
