/**
 * 생성한 이미지의 로컬 보관소.
 *
 * 호드가 주는 R2 링크는 수명이 짧아서 그대로 두면 나중에 깨진다.
 * 그래서 결과가 나오는 즉시 이미지를 blob으로 받아 IndexedDB에 저장한다.
 * 서버도 계정도 필요 없고, 데이터는 사용자 브라우저 밖으로 나가지 않는다.
 */

export type Creation = {
  id: string;
  prompt: string;
  negativePrompt: string;
  model: string;
  styleId: string;
  seed: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  censored: boolean;
  workerName?: string;
  createdAt: number;
  image: Blob;
};

/** 목록 표시용. blob 대신 화면에서 쓸 objectURL을 들고 있다. */
export type CreationView = Omit<Creation, "image"> & { url: string };

const DB_NAME = "freeaiz";
const DB_VERSION = 1;
const STORE = "creations";
const INDEX_CREATED_AT = "createdAt";

/** 브라우저 저장 용량을 다 쓰지 않도록 최근 항목만 남긴다. */
export const MAX_CREATIONS = 200;

export const isStorageAvailable = () =>
  typeof window !== "undefined" && "indexedDB" in window;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!isStorageAvailable()) {
    return Promise.reject(new Error("이 브라우저에서는 저장소를 쓸 수 없습니다."));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex(INDEX_CREATED_AT, "createdAt");
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // 다른 탭이 스키마를 올리면 이 연결을 닫아 막지 않는다.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error("저장소를 열지 못했습니다."));
    };
  });

  return dbPromise;
}

function tx(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function toPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 최신순으로 저장된 생성 결과를 읽는다. */
export async function listCreations(): Promise<Creation[]> {
  const db = await openDb();
  const all = await toPromise(tx(db, "readonly").getAll());
  return (all as Creation[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getCreation(id: string): Promise<Creation | undefined> {
  const db = await openDb();
  return (await toPromise(tx(db, "readonly").get(id))) as Creation | undefined;
}

export async function saveCreation(creation: Creation): Promise<void> {
  const db = await openDb();
  await toPromise(tx(db, "readwrite").put(creation));
  await pruneOldest();
}

export async function deleteCreation(id: string): Promise<void> {
  const db = await openDb();
  await toPromise(tx(db, "readwrite").delete(id));
}

export async function clearCreations(): Promise<void> {
  const db = await openDb();
  await toPromise(tx(db, "readwrite").clear());
}

/** MAX_CREATIONS를 넘으면 오래된 것부터 지운다. */
async function pruneOldest(): Promise<void> {
  const db = await openDb();
  const store = tx(db, "readwrite");
  const total = await toPromise(store.count());
  if (total <= MAX_CREATIONS) return;

  let toDelete = total - MAX_CREATIONS;
  await new Promise<void>((resolve, reject) => {
    const cursorRequest = store.index(INDEX_CREATED_AT).openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor || toDelete <= 0) return resolve();
      cursor.delete();
      toDelete -= 1;
      cursor.continue();
    };
    cursorRequest.onerror = () => reject(cursorRequest.error);
  });
}

/** 호드 결과(URL 또는 base64)를 blob으로 변환한다. */
export async function toImageBlob(img: string): Promise<Blob> {
  if (img.startsWith("http")) {
    // R2 링크는 CORS가 막힐 수 있어 서버 프록시를 거친다.
    const res = await fetch(`/api/horde/image?url=${encodeURIComponent(img)}`);
    if (!res.ok) throw new Error("이미지를 내려받지 못했습니다.");
    return res.blob();
  }

  // r2:false 로 받은 경우 base64 webp 문자열이 온다.
  const base64 = img.includes(",") ? img.split(",")[1] : img;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/webp" });
}

/** 저장소 사용량 추정치 (지원하는 브라우저에서만). */
export async function estimateUsage(): Promise<{
  usage: number;
  quota: number;
} | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return null;
  }
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}
