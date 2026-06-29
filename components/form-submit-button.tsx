"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  pendingLabel: string;
};

export function FormSubmitButton({
  children,
  className,
  pendingLabel
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const buttonClassName =
    className ??
    "min-h-12 w-full rounded-md bg-[color:var(--accent)] px-4 text-base font-semibold text-zinc-950 transition-opacity disabled:cursor-wait disabled:opacity-70";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={buttonClassName}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
