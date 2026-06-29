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
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] px-4 text-base font-extrabold text-zinc-950 shadow-[0_14px_34px_rgba(245,158,11,0.22)] transition duration-150 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70";

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
