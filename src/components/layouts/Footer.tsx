import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="space-y-3 p-4">
        <p className="text-sm leading-relaxed">
          Create stunning AI-powered artwork instantly.
          <br />
          No GPU or installation required.
        </p>

        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/80">
          <Link href="/" className="hover:text-white">
            홈
          </Link>
          <Link href="/create" className="hover:text-white">
            이미지 만들기
          </Link>
          <Link href="/my-creation" className="hover:text-white">
            내 작업
          </Link>
          <a
            href="https://aihorde.net"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-white"
          >
            AI Horde
          </a>
        </nav>

        <p className="border-t border-white/20 pt-3 text-[11px] leading-relaxed text-white/70">
          이미지 생성은 AI Horde의 공유 대기열을 통해 이루어집니다. 생성물은
          서버에 저장되지 않고 사용자의 브라우저에만 보관됩니다. 만 18세 이상만
          이용해 주세요.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
