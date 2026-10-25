"use client";

import { useState, type InputHTMLAttributes } from "react";

/**
 * A text box bound to a node attribute. While focused it shows its own copy of
 * the text: the node view re-renders a beat after each keystroke, and feeding
 * that back into a controlled input throws the caret to the end.
 */
export function AttrInput({
  value,
  onCommit,
  onFocus,
  onBlur,
  ...props
}: { value: string; onCommit: (value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      {...props}
      value={draft ?? value}
      onFocus={(e) => {
        setDraft(value);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setDraft(null);
        onBlur?.(e);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        onCommit(e.target.value);
      }}
    />
  );
}
