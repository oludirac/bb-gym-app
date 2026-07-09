"use client";

import { useRef } from "react";

type CsvInputToolsProps = {
  textareaId: string;
};

export function CsvInputTools({ textareaId }: CsvInputToolsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function textarea() {
    return document.getElementById(textareaId) as HTMLTextAreaElement | null;
  }

  function clearCsv() {
    const target = textarea();

    if (target) {
      target.value = "";
      target.focus();
    }
  }

  async function loadFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const target = textarea();

    if (target) {
      target.value = await file.text();
      target.focus();
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={clearCsv}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--panel-border)] px-3 text-sm font-black"
      >
        Clear CSV
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--panel-border)] px-3 text-sm font-black"
      >
        Upload file
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(event) => loadFile(event.target.files?.[0])}
      />
    </div>
  );
}
