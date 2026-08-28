/** 초 단위를 "1분 20초" 같은 한국어 표기로 바꾼다. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}초`;
  const minutes = Math.floor(s / 60);
  const rest = s % 60;
  return rest === 0 ? `${minutes}분` : `${minutes}분 ${rest}초`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 프롬프트에서 파일명으로 쓸 수 있는 짧은 슬러그를 만든다. */
export function toFilenameSlug(prompt: string, fallback = "freeaiz"): string {
  const slug = prompt
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || fallback;
}
