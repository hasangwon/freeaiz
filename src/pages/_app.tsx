import LayoutContainer from "@/components/layouts/LayoutContainer";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <LayoutContainer>
        <Component {...pageProps} />
      </LayoutContainer>
    </>
  );
}
