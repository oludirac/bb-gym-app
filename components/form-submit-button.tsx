"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel: string;
};

export function FormSubmitButton({
  children,
  className,
  disabled = false,
  pendingLabel
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const buttonClassName =
    className ??
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[color:var(--accent)] px-4 text-base font-extrabold text-zinc-950 transition duration-150 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70";

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className={buttonClassName}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
