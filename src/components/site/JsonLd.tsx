import { SITE } from "@/lib/site";
import type { PostMeta } from "@/lib/content";

function Script({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON in a script tag: escape "<" so a title can't close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const person = {
  "@type": "Person",
  "@id": `${SITE.url}/#person`,
  name: SITE.author,
  alternateName: SITE.handle,
  url: SITE.url,
  image: `${SITE.url}/images/profile.jpg`,
  jobTitle: "Software Engineer",
  sameAs: Object.values(SITE.links),
};

export function SiteJsonLd() {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${SITE.url}/#website`,
            url: SITE.url,
            name: SITE.name,
            description: SITE.description,
            author: { "@id": `${SITE.url}/#person` },
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/blog?q={search_term_string}` },
              "query-input": "required name=search_term_string",
            },
          },
          person,
        ],
      }}
    />
  );
}

export function ArticleJsonLd({ post, image }: { post: PostMeta; image: string }) {
  const url = `${SITE.url}/blog/${post.slug}`;
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BlogPosting",
            "@id": `${url}#article`,
            headline: post.title,
            description: post.description,
            url,
            image,
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            wordCount: post.words,
            timeRequired: `PT${post.readingMinutes}M`,
            keywords: post.tags.join(", "),
            articleSection: post.category,
            inLanguage: "en",
            author: person,
            publisher: { "@id": `${SITE.url}/#person` },
            mainEntityOfPage: url,
            ...(post.commentCount ? { commentCount: post.commentCount, discussionUrl: post.issueUrl } : {}),
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
              { "@type": "ListItem", position: 2, name: "Writing", item: `${SITE.url}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: url },
            ],
          },
        ],
      }}
    />
  );
}
