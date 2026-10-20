"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Code, Heading2, Heading3, Italic, Link2, Quote, Strikethrough, Unlink } from "lucide-react";

export const EDIT_LINK_EVENT = "ks-edit-link";

function Btn({ on, label, active, children }: { on: () => void; label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-hover ${active ? "text-accent" : "text-muted hover:text-fg"}`}
    >
      {children}
    </button>
  );
}

/** Formatting for the selected text. ⌘B / ⌘I / ⌘E / ⌘K all work without it too. */
export function BubbleBar({ editor }: { editor: Editor }) {
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      quote: e.isActive("blockquote"),
    }),
  });

  useEffect(() => {
    const open = () => {
      editor.commands.extendMarkRange("link");
      setHref((editor.getAttributes("link").href as string) ?? "");
      setLinking(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    // Moving the cursor elsewhere abandons a half-typed link.
    const reset = () => setLinking(false);
    window.addEventListener(EDIT_LINK_EVENT, open);
    editor.on("selectionUpdate", reset);
    return () => {
      window.removeEventListener(EDIT_LINK_EVENT, open);
      editor.off("selectionUpdate", reset);
    };
  }, [editor]);

  const applyLink = () => {
    const url = href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!url) chain.unsetLink().run();
    else chain.setLink({ href: /^(https?:|mailto:|\/|#)/.test(url) ? url : `https://${url}` }).run();
    setLinking(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: e, state }) => {
        if (state.selection.empty || state.selection instanceof NodeSelection) return false;
        return !e.isActive("codeBlock") && e.isEditable;
      }}
    >
      <div className="flex items-center gap-0.5 rounded-xl border border-line bg-elev/95 p-1 shadow-card backdrop-blur-xl">
        {linking ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
          >
            <input
              ref={inputRef}
              value={href}
              onChange={(e) => setHref(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setLinking(false);
                  editor.commands.focus();
                }
              }}
              placeholder="Paste a link, Enter to apply"
              className="h-8 w-64 rounded-md bg-subtle px-2.5 font-mono text-xs text-fg outline-none"
            />
            {s.link && (
              <Btn label="Remove link" on={() => (editor.chain().focus().extendMarkRange("link").unsetLink().run(), setLinking(false))}>
                <Unlink className="h-4 w-4" />
              </Btn>
            )}
          </form>
        ) : (
          <>
            <Btn label="Bold (⌘B)" active={s.bold} on={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="h-4 w-4" />
            </Btn>
            <Btn label="Italic (⌘I)" active={s.italic} on={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="h-4 w-4" />
            </Btn>
            <Btn label="Strikethrough" active={s.strike} on={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough className="h-4 w-4" />
            </Btn>
            <Btn label="Inline code (⌘E)" active={s.code} on={() => editor.chain().focus().toggleCode().run()}>
              <Code className="h-4 w-4" />
            </Btn>
            <Btn label="Link (⌘K)" active={s.link} on={() => window.dispatchEvent(new Event(EDIT_LINK_EVENT))}>
              <Link2 className="h-4 w-4" />
            </Btn>
            <span className="mx-1 h-5 w-px bg-line" aria-hidden />
            <Btn label="Heading" active={s.h2} on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="h-4 w-4" />
            </Btn>
            <Btn label="Subheading" active={s.h3} on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="h-4 w-4" />
            </Btn>
            <Btn label="Quote" active={s.quote} on={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote className="h-4 w-4" />
            </Btn>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
