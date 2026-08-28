import { useRouter } from "next/router";
import { useEffect, useRef, type ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import SideSwiper from "../sidebar/SideSwiper";

interface LayoutContainerProps {
  children: ReactNode;
}

export default function LayoutContainer({ children }: LayoutContainerProps) {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pageRef.current) {
      pageRef.current.scrollTop = 0;
    }
  }, [router.asPath]);

  return (
    <div className="relative overflow-hidden w-full h-full bg-gray-50 scroll-area flex justify-center">
      <div className="shadow-lg z-[0] overflow-y-auto max-[1080px]:hidden flex flex-col justify-between min-w-[480px] max-w-[600px] h-full p-6">
        <div className="flex flex-col gap-4 items-center flex-1">
          <div className="w-full h-[20rem] overflow-hidden">
            <SideSwiper />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="title-font tracking-widest bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent">
              FREE AI<span className="text-xs">z</span>
            </span>
          </h1>

          <p className="text-base text-gray-700 leading-relaxed">
            Generate stunning visuals in seconds.
            <br />
            Describe your idea, and let AI bring it to life.
          </p>

          <p className="text-lg font-bold">
            <span className="bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
              Make images. Build your world.
            </span>
          </p>
        </div>

        <div className="text-left text-xs text-gray-600 space-y-2 border-t pt-4">
          <p>
            <strong>Age 18+ only.</strong> This service is not available for
            minors.
          </p>
          <p>
            <strong>Consent required.</strong> Do not upload or generate images
            using someone else’s photo without explicit permission.
          </p>
          <p>
            <strong>Respect the law.</strong> Avoid illegal, hateful, violent,
            or sexual content. You are responsible for your prompts and outputs.
          </p>
          <p>
            <strong>Copyright & brands.</strong> Do not use copyrighted
            materials, logos, or trademarks you do not own.
          </p>
        </div>
      </div>
      <div
        ref={pageRef}
        className="shadow-lg z-[1] relative overflow-y-auto flex flex-col justify-between h-full w-full max-w-[600px] bg-white"
      >
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  );
}
