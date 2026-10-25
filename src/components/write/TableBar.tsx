"use client";

import type { Editor } from "@tiptap/core";
import { selectedRect } from "@tiptap/pm/tables";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Columns3,
  Rows3,
  Trash2,
} from "lucide-react";

function Btn({
  on,
  label,
  disabled,
  danger,
  children,
}: {
  on: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      disabled={disabled}
      title={label}
      className={`flex h-8 items-center gap-1.5 rounded-md px-2 text-xs transition-colors hover:bg-hover disabled:pointer-events-none disabled:opacity-35 ${
        danger ? "text-muted hover:text-danger" : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

/** Where the cursor's table starts, and which column the cursor is in. */
function here(editor: Editor) {
  try {
    const rect = selectedRect(editor.state);
    return { tablePos: rect.tableStart - 1, col: rect.left, align: (rect.table.attrs.align as unknown[]) ?? [] };
  } catch {
    return null;
  }
}

/**
 * Row and column controls, pinned under the table while the cursor is in it.
 * Tab still walks the cells, and Tab in the last cell adds a row.
 */
export function TableBar({ editor }: { editor: Editor }) {
  const can = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      deleteRow: e.can().deleteRow(),
      deleteColumn: e.can().deleteColumn(),
    }),
  });

  // Column commands don't know about markdown alignment, so shift it to match.
  const column = (run: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>, edit: (align: unknown[], col: number) => void) => {
    const at = here(editor);
    if (!at) return;
    const align = [...at.align];
    edit(align, at.col);
    run(editor.chain().focus())
      .command(({ tr }) => {
        if (tr.doc.nodeAt(at.tablePos)?.type.name === "table") tr.setNodeAttribute(at.tablePos, "align", align);
        return true;
      })
      .run();
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBar"
      options={{ placement: "bottom", offset: 8, flip: false }}
      shouldShow={({ editor: e }) => e.isEditable && e.isActive("table")}
      getReferencedVirtualElement={() => {
        const at = here(editor);
        const dom = at ? editor.view.nodeDOM(at.tablePos) : null;
        if (!(dom instanceof HTMLElement)) return null;
        return { getBoundingClientRect: () => dom.getBoundingClientRect() };
      }}
    >
      <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-line bg-elev/95 p-1 shadow-card backdrop-blur-xl">
        <span className="flex items-center gap-1 px-1.5 text-faint" aria-hidden>
          <Rows3 className="h-3.5 w-3.5" />
        </span>
        <Btn label="Add row above" on={() => editor.chain().focus().addRowBefore().run()}>
          <BetweenHorizontalStart className="h-3.5 w-3.5" /> Above
        </Btn>
        <Btn label="Add row below" on={() => editor.chain().focus().addRowAfter().run()}>
          <BetweenHorizontalEnd className="h-3.5 w-3.5" /> Below
        </Btn>
        <Btn label="Delete this row" danger disabled={!can.deleteRow} on={() => editor.chain().focus().deleteRow().run()}>
          <Trash2 className="h-3.5 w-3.5" /> Row
        </Btn>

        <span className="mx-1 h-5 w-px bg-line" aria-hidden />

        <span className="flex items-center gap-1 px-1.5 text-faint" aria-hidden>
          <Columns3 className="h-3.5 w-3.5" />
        </span>
        <Btn label="Add column left" on={() => column((c) => c.addColumnBefore(), (a, col) => a.splice(col, 0, null))}>
          <BetweenVerticalStart className="h-3.5 w-3.5" /> Left
        </Btn>
        <Btn label="Add column right" on={() => column((c) => c.addColumnAfter(), (a, col) => a.splice(col + 1, 0, null))}>
          <BetweenVerticalEnd className="h-3.5 w-3.5" /> Right
        </Btn>
        <Btn
          label="Delete this column"
          danger
          disabled={!can.deleteColumn}
          on={() => column((c) => c.deleteColumn(), (a, col) => a.splice(col, 1))}
        >
          <Trash2 className="h-3.5 w-3.5" /> Column
        </Btn>

        <span className="mx-1 h-5 w-px bg-line" aria-hidden />

        <Btn label="Delete the whole table" danger on={() => editor.chain().focus().deleteTable().run()}>
          <Trash2 className="h-3.5 w-3.5" /> Table
        </Btn>
      </div>
    </BubbleMenu>
  );
}
