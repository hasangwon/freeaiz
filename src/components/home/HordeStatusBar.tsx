import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils/format";
import type { HordeLiveStatus } from "@/lib/horde/types";

/** 호드가 지금 얼마나 붐비는지 보여 주는 작은 표시줄. */
export default function HordeStatusBar() {
  const [status, setStatus] = useState<HordeLiveStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = () =>
      fetch("/api/horde/performance", { signal: controller.signal })
        .then((r) => r.json())
        .then((data: HordeLiveStatus) => setStatus(data))
        .catch(() => undefined);

    load();
    const timer = setInterval(load, 30_000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  if (!status) {
    return (
      <div className="h-9 animate-pulse rounded-full bg-gray-100" aria-hidden />
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-[11px] text-gray-600">
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            status.online ? "animate-pulse bg-emerald-500" : "bg-gray-400"
          }`}
        />
        {status.online ? "대기열 정상" : "대기열 점검 중"}
      </span>
      {status.online && (
        <>
          <span className="text-gray-300">|</span>
          <span>
            워커 <strong className="text-gray-800">{status.workers}</strong>대
          </span>
          <span className="text-gray-300">|</span>
          <span>
            대기{" "}
            <strong className="text-gray-800">{status.queuedRequests}</strong>건
          </span>
          {status.estimatedWaitSeconds !== null && (
            <>
              <span className="text-gray-300">|</span>
              <span>평균 ~{formatDuration(status.estimatedWaitSeconds)}</span>
            </>
          )}
        </>
      )}
    </div>
  );
}
