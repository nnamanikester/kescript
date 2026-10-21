import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTags } from "@/lib/content";
import { GitHubError } from "@/lib/github";
import { authConfigured, getSession } from "@/lib/session";
import { getEditablePost, isOwner } from "@/lib/write";
import { aiConfigured } from "@/lib/writer-ai";
import { WriterLoader } from "@/components/write/WriterLoader";
import { WriteSignIn } from "@/components/write/WriteSignIn";

export const metadata: Metadata = { title: "Edit", robots: { index: false, follow: false } };

export default async function EditPage(props: PageProps<"/write/[issue]">) {
  const { issue } = await props.params;
  const number = Number(issue);
  if (!Number.isInteger(number) || number < 1) notFound();

  const session = await getSession();
  if (!session) return <WriteSignIn returnTo={`/write/${number}`} configured={authConfigured()} />;
  if (!isOwner(session.login)) notFound();

  let post;
  try {
    post = await getEditablePost(session.token, number);
  } catch (err) {
    if (err instanceof GitHubError && err.status === 401) return <WriteSignIn returnTo={`/write/${number}`} configured />;
    if (err instanceof GitHubError && err.status === 404) notFound();
    throw err;
  }
  const tags = (await getTags()).map((t) => t.tag);
  return <WriterLoader issue={{ number: post.number, url: post.url, status: post.status }} initial={post.draft} knownTags={tags} ai={aiConfigured()} />;
}
