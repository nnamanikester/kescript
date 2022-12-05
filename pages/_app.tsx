import "../styles/index.scss";
import type { AppProps } from "next/app";
import MainLayout from "../layouts/main-layout";
import { Analytics } from "@vercel/analytics/react";
import "swiper/css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MainLayout>
      <Component {...pageProps} />
      <Analytics />
    </MainLayout>
  );
}
