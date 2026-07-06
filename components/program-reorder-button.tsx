"use client";

import { type MouseEvent, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  moveProgramDayInline,
  moveProgramExerciseInline
} from "@/app/(app)/programs/actions";

type ProgramReorderButtonProps =
  | {
      direction: "up" | "down";
      disabled: boolean;
      programDayId: string;
      programId: string;
      target: "day";
    }
  | {
      direction: "up" | "down";
      disabled: boolean;
      programExerciseId: string;
      programId: string;
      target: "exercise";
    };

export function ProgramReorderButton(props: ProgramReorderButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const Icon = props.direction === "up" ? ArrowUp : ArrowDown;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (props.disabled || isPending) {
      return;
    }

    startTransition(async () => {
      if (props.target === "day") {
        await moveProgramDayInline({
          direction: props.direction,
          programDayId: props.programDayId,
          programId: props.programId
        });
      } else {
        await moveProgramExerciseInline({
          direction: props.direction,
          programExerciseId: props.programExerciseId,
          programId: props.programId
        });
      }

      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={props.disabled || isPending}
      aria-disabled={props.disabled || isPending}
      aria-label={`Move ${props.target} ${props.direction}`}
      className="inline-flex size-10 items-center justify-center rounded-xl border border-[color:var(--panel-border)] text-[color:var(--muted)] transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-35"
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}
