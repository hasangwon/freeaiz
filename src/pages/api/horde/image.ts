import type { NextApiRequest, NextApiResponse } from "next";

/**
 * 호드가 돌려주는 R2 이미지를 중계한다.
 * 브라우저에서 직접 받으면 CORS 때문에 blob 저장/다운로드가 막히는 경우가 있고,
 * R2 링크는 수명이 짧아 캐시에 담아 두는 편이 낫다.
 */

/** 임의 URL 프록시가 되지 않도록 호드가 실제로 쓰는 호스트만 허용한다. */
const ALLOWED_HOSTS = [
  "r2.cloudflarestorage.com",
  "stablehorde.net",
  "aihorde.net",
];

const MAX_BYTES = 25 * 1024 * 1024;

function isAllowed(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  return ALLOWED_HOSTS.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "GET만 지원합니다." });
  }

  const raw = req.query.url;
  const target = Array.isArray(raw) ? raw[0] : raw;
  if (!target) return res.status(400).json({ error: "url이 필요합니다." });

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return res.status(400).json({ error: "올바르지 않은 url입니다." });
  }

  if (!isAllowed(url)) {
    return res.status(403).json({ error: "허용되지 않은 주소입니다." });
  }

  try {
    const upstream = await fetch(url.toString(), {
      signal: AbortSignal.timeout(30_000),
    });
    if (!upstream.ok || !upstream.body) {
      return res
        .status(upstream.status === 404 ? 404 : 502)
        .json({ error: "이미지를 가져오지 못했습니다. 링크가 만료되었을 수 있습니다." });
    }

    const length = Number(upstream.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) {
      return res.status(413).json({ error: "이미지가 너무 큽니다." });
    }

    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") ?? "image/webp"
    );
    res.setHeader("Cache-Control", "public, max-age=3600, immutable");

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return res.status(413).json({ error: "이미지가 너무 큽니다." });
    }
    return res.status(200).send(buffer);
  } catch {
    return res.status(502).json({ error: "이미지를 가져오지 못했습니다." });
  }
}
