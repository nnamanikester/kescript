import Head from "next/head";

interface MetaTagsProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  keywords?: string;
}

const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description,
  url,
  image,
  keywords,
}) => {
  const defaultTitle = `${
    title ?? "Evian Bliss"
  }  - Natural Hair Spa In Enugu.`;
  const defaultDescription =
    "Best natural hair spa in enugu for hair treatments and protective styling, grooming and consultations. Any hair texture you have, we make you adore it.";
  const defaulltUrl = "https://evianbliss.com/";
  const defaultImage = "/public/images/logo.png";

  return (
    <Head>
      <meta name="robots" content="index, follow" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="1 days" />
      <meta name="author" content="Destreetboard" />
      <link rel="canonical" href={url || "https://evianbliss.com"} />

      <title>{defaultTitle}</title>
      <meta name="title" content={defaultTitle} />
      <meta name="description" content={description ?? defaultDescription} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url ?? defaulltUrl} />
      <meta property="og:title" content={defaultTitle} />
      <meta
        property="og:description"
        content={description ?? defaultDescription}
      />
      <meta property="og:image" content={image ?? defaultImage} />
      <meta property="og:image:width" content="600" />
      <meta property="og:image:height" content="600" />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url ?? defaulltUrl} />
      <meta property="twitter:title" content={defaultTitle} />
      <meta
        property="twitter:description"
        content={description ?? defaultDescription}
      />
      <meta property="twitter:image" content={image ?? defaultImage} />

      <meta
        name="keywords"
        content={
          keywords +
          "natural hair spa in enugu, natural hair spa, the natural hair spa, the natural hair spa in enugu, evian, bliss, evian bliss, hair spa, evian bliss hair spa, beauty salon, unisex salon, hair salon, best hair spa in nigeria, hairsresser, hair stylist, hair grooming, hair treatment and protective styling, hair consultations, natural hair, barbing, hair barbing in enugu"
        }
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
};

export default MetaTags;
