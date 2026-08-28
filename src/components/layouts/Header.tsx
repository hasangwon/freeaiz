import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const MENUS = [
  { title: "HOME", label: "홈", href: "/" },
  { title: "CREATE", label: "이미지 만들기", href: "/create" },
  { title: "MYCREATION", label: "내 작업", href: "/my-creation" },
];

export default function Header() {
  const router = useRouter();
  const [isOpenNav, setIsOpenNav] = useState(false);

  // 페이지를 옮기면 드로어를 닫는다 (뒤로가기 포함)
  useEffect(() => {
    const close = () => setIsOpenNav(false);
    router.events.on("routeChangeComplete", close);
    return () => router.events.off("routeChangeComplete", close);
  }, [router.events]);

  // 드로어가 열려 있는 동안 ESC로 닫기
  useEffect(() => {
    if (!isOpenNav) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpenNav(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpenNav]);

  const isActive = (href: string) =>
    href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);

  return (
    <header className="bg-primary sticky top-0 z-50 w-full shadow">
      <div className="w-full flex justify-between items-center">
        <button
          type="button"
          onClick={() => setIsOpenNav(true)}
          aria-expanded={isOpenNav}
          aria-controls="mobile-drawer"
          aria-label="메뉴 열기"
          className="flex items-center justify-center w-12 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            className="h-[40px]"
            aria-hidden
          >
            <g id="main">
              <path
                fill="#ffd15c"
                d="M34,1H30A19,19,0,0,0,11,20a1,1,0,0,0,1,1H52a1,1,0,0,0,1-1A19,19,0,0,0,34,1Z"
              />
              <path
                fill="#36aeb7"
                d="M20,24H14a3,3,0,0,0,0,6h6a3,3,0,0,0,0-6Z"
              />
              <path
                fill="#36aeb7"
                d="M35,24H29a3,3,0,0,0,0,6h6a3,3,0,0,0,0-6Z"
              />
              <path
                fill="#36aeb7"
                d="M50,24H44a3,3,0,0,0,0,6h6a3,3,0,0,0,0-6Z"
              />
              <path
                fill="#9f7346"
                d="M49,32H15a4,4,0,0,0,0,8H49a4,4,0,0,0,0-8Z"
              />
              <path
                fill="#ffd15c"
                d="M50,43H14a3,3,0,0,0-3,3v5A12,12,0,0,0,23,63H41A12,12,0,0,0,53,51V46A3,3,0,0,0,50,43Z"
              />
              <path
                fill="#f8b64c"
                d="M53,46v5a12,12,0,0,1-.17,2H52c-1.94,0-2.9-1.34-3.67-2.42S47.15,49,46.28,49s-1.32.57-2.05,1.58S42.51,53,40.56,53s-2.9-1.34-3.67-2.42S35.72,49,34.85,49s-1.32.57-2,1.58S31.08,53,29.14,53s-2.9-1.34-3.67-2.42S24.29,49,23.42,49s-1.32.57-2,1.58S19.65,53,17.71,53s-2.9-1.34-3.67-2.42S12.87,49,12,49H11V46a3,3,0,0,1,3-3H50A3,3,0,0,1,53,46Z"
              />
            </g>
          </svg>
        </button>

        <Link
          href="/"
          className="py-4 title-font tracking-widest text-secondary"
        >
          <span className="text-shadow text-3xl">
            FREE AI<span className="text-xs">z</span>
          </span>
          <span className="text-xs border px-[4px] py-[2px] rounded-4xl shadow ml-[4px] bg-secondary text-primary border-none">
            image
          </span>
        </Link>
        <div className="w-12 h-2 block" />
      </div>

      {/* 모바일 드로어 + 오버레이 */}
      {isOpenNav && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 z-[59]"
          aria-label="메뉴 닫기"
          onClick={() => setIsOpenNav(false)}
        />
      )}
      <aside
        id="mobile-drawer"
        className={[
          "absolute top-0 left-0 h-screen w-[15rem] bg-white border-r border-gray-100 z-[60] px-4",
          "transform transition-transform duration-300",
          isOpenNav ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="메뉴"
        aria-hidden={!isOpenNav}
      >
        <div className="border-b h-[4rem] flex items-center font-bold text-gray-800">
          MENU
        </div>
        <button
          type="button"
          className="absolute top-2 right-0 items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 cursor-pointer"
          aria-label="메뉴 닫기"
          onClick={() => setIsOpenNav(false)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <nav className="py-2 flex flex-col divide-y divide-gray-300">
          {MENUS.map((menu) => {
            const active = isActive(menu.href);
            return (
              <Link
                key={menu.href}
                href={menu.href}
                onClick={() => setIsOpenNav(false)}
                aria-current={active ? "page" : undefined}
                tabIndex={isOpenNav ? undefined : -1}
                className={[
                  "border-b border-gray-300 w-full text-left px-4 py-5 flex items-center justify-between transition",
                  active ? "bg-primary/5" : "hover:bg-gray-50",
                ].join(" ")}
              >
                <span>
                  <span
                    className={`block text-base font-semibold ${
                      active ? "text-primary" : "text-gray-900"
                    }`}
                  >
                    {menu.title}
                  </span>
                  <span className="block text-[11px] text-gray-500">
                    {menu.label}
                  </span>
                </span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </header>
  );
}
