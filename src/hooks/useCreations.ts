import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearCreations,
  deleteCreation,
  isStorageAvailable,
  listCreations,
  type CreationView,
} from "@/lib/storage/creations";

/** IndexedDB에 저장된 생성 결과를 화면용으로 읽어 온다. */
export function useCreations() {
  const [creations, setCreations] = useState<CreationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // objectURL은 목록을 다시 읽거나 언마운트할 때 반드시 회수해야 한다.
  const urlsRef = useRef<string[]>([]);

  const revoke = useCallback(() => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
  }, []);

  const load = useCallback(async () => {
    if (!isStorageAvailable()) {
      setError("이 브라우저에서는 저장 기능을 쓸 수 없습니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await listCreations();
      revoke();
      setCreations(
        rows.map(({ image, ...rest }) => {
          const url = URL.createObjectURL(image);
          urlsRef.current.push(url);
          return { ...rest, url };
        })
      );
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "불러오는 데 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [revoke]);

  useEffect(() => {
    load();
    return revoke;
    // load/revoke는 안정적인 참조라 마운트 시 한 번만 실행된다.
  }, [load, revoke]);

  const remove = useCallback(async (id: string) => {
    await deleteCreation(id);
    setCreations((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        urlsRef.current = urlsRef.current.filter((u) => u !== target.url);
      }
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const removeAll = useCallback(async () => {
    await clearCreations();
    revoke();
    setCreations([]);
  }, [revoke]);

  return { creations, loading, error, reload: load, remove, removeAll };
}
