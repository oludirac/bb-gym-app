"use client";

import { type MouseEvent, useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyPromptButtonProps = {
  text: string;
};

export function CopyPromptButton({ text }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copyPrompt}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] px-4 text-sm font-black text-zinc-950 transition active:scale-[0.98]"
    >
      {copied ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
      {copied ? "Copied" : "Copy prompt"}
    </button>
  );
}
