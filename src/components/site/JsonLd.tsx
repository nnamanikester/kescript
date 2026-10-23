import { SITE } from "@/lib/site";
import type { PostMeta } from "@/lib/content";

/**
 * schema.org structured data. Everything references one Person and one
 * WebSite by @id, so search engines see a single connected entity graph:
 * this person, this site, these posts.
 */

const PERSON_ID = `${SITE.url}/#person`;
const SITE_ID = `${SITE.url}/#website`;
const BLOG_ID = `${SITE.url}/blog#blog`;

function Script({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON in a script tag: escape "<" so a title can't close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c") }}
    />
  );
}

const person = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: SITE.author,
  // The brand and the handle, so searches for either connect to this person.
  alternateName: [SITE.name, SITE.handle],
  url: `${SITE.url}/about`,
  image: `${SITE.url}/images/profile.jpg`,
  email: `mailto:${SITE.email}`,
  jobTitle: "Software Engineer",
  description: SITE.description,
  worksFor: { "@type": "Organization", name: "Turing", url: "https://www.turing.com" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Enugu State University of Science and Technology" },
  homeLocation: { "@type": "Place", name: SITE.location },
  knowsAbout: [
    "React Native",
    "Mobile app development",
    "TypeScript",
    "JavaScript",
    "Next.js",
    "Node.js",
    "NestJS",
    "Python",
    "GraphQL",
    "End-to-end testing",
    "CI/CD",
    "Retrieval-augmented generation",
    "Large language models",
    "AI engineering",
  ],
  sameAs: Object.values(SITE.links),
};

const breadcrumbs = (items: [string, string][]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: `${SITE.url}${path}`,
  })),
});

/** On every page: the site and its author. */
export function SiteJsonLd() {
  return (
    <Script
      data={{
        "@graph": [
          {
            "@type": "WebSite",
            "@id": SITE_ID,
            url: SITE.url,
            name: SITE.name,
            alternateName: SITE.title,
            description: SITE.description,
            inLanguage: "en",
            publisher: { "@id": PERSON_ID },
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

/** /about — Google's recommended type for a page about one person. */
export function ProfileJsonLd() {
  return (
    <Script
      data={{
        "@type": "ProfilePage",
        "@id": `${SITE.url}/about#page`,
        url: `${SITE.url}/about`,
        name: `About ${SITE.author}`,
        isPartOf: { "@id": SITE_ID },
        mainEntity: { "@id": PERSON_ID },
        breadcrumb: breadcrumbs([
          ["Home", ""],
          ["About", "/about"],
        ]),
      }}
    />
  );
}

/** /blog — the blog itself, with every post. */
export function BlogJsonLd({ posts }: { posts: PostMeta[] }) {
  return (
    <Script
      data={{
        "@type": "Blog",
        "@id": BLOG_ID,
        url: `${SITE.url}/blog`,
        name: `${SITE.name} — writing`,
        description: SITE.description,
        inLanguage: "en",
        isPartOf: { "@id": SITE_ID },
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          "@id": `${SITE.url}/blog/${p.slug}#article`,
          headline: p.title,
          url: `${SITE.url}/blog/${p.slug}`,
          datePublished: p.date,
          dateModified: p.updated ?? p.date,
          description: p.description,
          author: { "@id": PERSON_ID },
        })),
      }}
    />
  );
}

/** /tags/[tag] — a collection of posts on one topic. */
export function TopicJsonLd({ tag, label, posts }: { tag: string; label: string; posts: PostMeta[] }) {
  const url = `${SITE.url}/tags/${tag}`;
  return (
    <Script
      data={{
        "@graph": [
          {
            "@type": "CollectionPage",
            "@id": `${url}#page`,
            url,
            name: `${label} — posts by ${SITE.author}`,
            about: { "@type": "Thing", name: label },
            isPartOf: { "@id": SITE_ID },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: posts.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE.url}/blog/${p.slug}`,
                name: p.title,
              })),
            },
          },
          breadcrumbs([
            ["Home", ""],
            ["Topics", "/tags"],
            [label, `/tags/${tag}`],
          ]),
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
        "@graph": [
          {
            "@type": "BlogPosting",
            "@id": `${url}#article`,
            headline: post.title,
            ...(post.subtitle ? { alternativeHeadline: post.subtitle } : {}),
            description: post.description,
            url,
            image: { "@type": "ImageObject", url: image, width: 1200, height: 630 },
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            wordCount: post.words,
            timeRequired: `PT${post.readingMinutes}M`,
            keywords: post.tags.join(", "),
            articleSection: post.categoryName,
            inLanguage: "en",
            author: { "@id": PERSON_ID, name: SITE.author, url: `${SITE.url}/about` },
            publisher: { "@id": PERSON_ID },
            isPartOf: { "@id": BLOG_ID },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            ...(post.canonical ? { isBasedOn: post.canonical } : {}),
            ...(post.issueUrl ? { discussionUrl: `${url}#discussion`, commentCount: post.commentCount } : {}),
            ...(post.reactionCount
              ? {
                  interactionStatistic: {
                    "@type": "InteractionCounter",
                    interactionType: "https://schema.org/LikeAction",
                    userInteractionCount: post.reactionCount,
                  },
                }
              : {}),
          },
          breadcrumbs([
            ["Home", ""],
            ["Writing", "/blog"],
            [post.title, `/blog/${post.slug}`],
          ]),
        ],
      }}
    />
  );
}
