import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTags } from "@/lib/content";
import { emptyDraft } from "@/lib/editor/draft";
import { authConfigured, getSession } from "@/lib/session";
import { isOwner } from "@/lib/write";
import { WriterLoader } from "@/components/write/WriterLoader";
import { WriteSignIn } from "@/components/write/WriteSignIn";

export const metadata: Metadata = { title: "Write", robots: { index: false, follow: false } };

export default async function WritePage() {
  const session = await getSession();
  if (!session) return <WriteSignIn returnTo="/write" configured={authConfigured()} />;
  if (!isOwner(session.login)) notFound();
  const tags = (await getTags()).map((t) => t.tag);
  return <WriterLoader issue={null} initial={emptyDraft()} knownTags={tags} />;
}
