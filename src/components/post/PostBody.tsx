import { Fragment, Suspense, type ComponentProps, type ReactNode } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import type { Root } from "hast";
import { Tweet } from "react-tweet";
import { Info, Lightbulb, MessageSquareWarning, OctagonAlert, TriangleAlert } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { CodeGroup } from "./CodeGroup";
import { Mermaid } from "./Mermaid";
import { YouTube } from "./YouTube";
import { ZoomImage } from "./ZoomImage";

const CALLOUTS = {
  note: { label: "Note", Icon: Info },
  tip: { label: "Tip", Icon: Lightbulb },
  important: { label: "Important", Icon: MessageSquareWarning },
  warning: { label: "Warning", Icon: TriangleAlert },
  caution: { label: "Caution", Icon: OctagonAlert },
} as const;

type Props = Record<string, unknown> & { children?: ReactNode };

function Figure(props: Props) {
  if ("data-rehype-pretty-code-figure" in props) return <CodeBlock {...(props as ComponentProps<typeof CodeBlock>)} />;
  return <figure {...(props as ComponentProps<"figure">)} />;
}

function Aside(props: Props) {
  const kind = props["data-callout"] as keyof typeof CALLOUTS | undefined;
  if (!kind || !CALLOUTS[kind]) return <aside {...(props as ComponentProps<"aside">)} />;
  const { label, Icon } = CALLOUTS[kind];
  return (
    <aside className="callout" data-callout={kind} role="note">
      <p className="callout-title">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </p>
      {props.children}
    </aside>
  );
}

function Div(props: Props) {
  if ("data-code-group" in props) return <CodeGroup data-labels={props["data-labels"] as string}>{props.children}</CodeGroup>;
  return <div {...(props as ComponentProps<"div">)} />;
}

function Table(props: ComponentProps<"table">) {
  return (
    <div className="table-wrap">
      <table {...props} />
    </div>
  );
}

function TweetEmbed({ "data-id": id }: { "data-id"?: string }) {
  if (!id) return null;
  return (
    <div className="embed not-prose flex justify-center">
      <Suspense fallback={<div className="h-48 w-full max-w-[550px] animate-pulse rounded-xl border border-line bg-subtle" />}>
        <Tweet id={id} />
      </Suspense>
    </div>
  );
}

const components = {
  figure: Figure,
  aside: Aside,
  div: Div,
  table: Table,
  img: ZoomImage,
  "mermaid-diagram": Mermaid,
  "youtube-embed": YouTube,
  "tweet-embed": TweetEmbed,
} as unknown as Components;

export function PostBody({ tree }: { tree: Root }) {
  return (
    <div className="prose">
      {toJsxRuntime(tree, { Fragment, jsx, jsxs, components, ignoreInvalidStyle: true })}
    </div>
  );
}
