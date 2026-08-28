import Head from "next/head";
import { useRouter } from "next/router";

const SITE_NAME = "FREE AIz";
const SITE_URL = "https://freeaiz.com";
const DEFAULT_DESCRIPTION =
  "로그인도 결제도 GPU도 없이 무료로 AI 이미지를 만들어 보세요. AI Horde의 공유 대기열을 이용해 프롬프트만 적으면 됩니다.";

type Props = {
  title?: string;
  description?: string;
  /** 소셜 공유 미리보기 이미지 (사이트 루트 기준 경로) */
  image?: string;
  noIndex?: boolean;
};

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  image = "/images/slide/ex1.webp",
  noIndex,
}: Props) {
  const router = useRouter();
  const url = `${SITE_URL}${router.asPath === "/" ? "" : router.asPath.split("?")[0]}`;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} · 무료 AI 이미지 생성`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={`${SITE_URL}${image}`} />
      <meta property="og:locale" content="ko_KR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}${image}`} />

      <meta name="theme-color" content="#e26559" />
    </Head>
  );
}
