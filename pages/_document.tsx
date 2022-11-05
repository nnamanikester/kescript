import { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";

const Document = () => {
  return (
    <Html lang="en-US">
      <Head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
