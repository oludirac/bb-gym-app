"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Check, TimerReset, X } from "lucide-react";
import { useFormStatus } from "react-dom";

const TIMER_KEY = "bb-gym-rest-timer";

type StoredTimer = {
  durationSeconds: number;
  endAt: number;
};

function readTimer() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(TIMER_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredTimer;
    return Number.isFinite(parsed.endAt) && Number.isFinite(parsed.durationSeconds)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function getTimerSnapshot() {
  const timer = readTimer();
  return timer ? JSON.stringify(timer) : "";
}

function getServerTimerSnapshot() {
  return "";
}

function subscribeTimer(callback: () => void) {
  window.addEventListener("bb-rest-timer-change", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("bb-rest-timer-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function writeTimer(timer: StoredTimer) {
  window.localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
  window.dispatchEvent(new CustomEvent("bb-rest-timer-change", { detail: timer }));
}

function clearTimer() {
  window.localStorage.removeItem(TIMER_KEY);
  window.dispatchEvent(new CustomEvent("bb-rest-timer-change"));
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function notifyRestDone() {
  if ("vibrate" in navigator) {
    navigator.vibrate([180, 90, 180]);
  }

  const audioWindow = window as Window &
    typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
  const AudioContextConstructor =
    window.AudioContext ?? audioWindow.webkitAudioContext;

  if (AudioContextConstructor) {
    const audio = new AudioContextConstructor();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.22);
  }

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Rest done", {
      body: "Time for your next set."
    });
  }
}

function startTimer(restSeconds: number) {
  const durationSeconds = Math.max(0, Math.round(restSeconds));

  if (durationSeconds === 0) {
    clearTimer();
    return;
  }

  if ("Notification" in window && Notification.permission === "default") {
    void Notification.requestPermission();
  }

  writeTimer({
    durationSeconds,
    endAt: Date.now() + durationSeconds * 1000
  });
}

type RestTimerProps = {
  defaultRestSeconds: number;
};

export function RestTimer({ defaultRestSeconds }: RestTimerProps) {
  const timerSnapshot = useSyncExternalStore(
    subscribeTimer,
    getTimerSnapshot,
    getServerTimerSnapshot
  );
  const timer = useMemo(
    () => (timerSnapshot ? (JSON.parse(timerSnapshot) as StoredTimer) : null),
    [timerSnapshot]
  );
  const notifiedEndAtRef = useRef<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 500);

    return () => window.clearInterval(intervalId);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!timer || now === 0) {
      return 0;
    }

    return Math.max(0, Math.ceil((timer.endAt - now) / 1000));
  }, [now, timer]);

  useEffect(() => {
    if (!timer || remainingSeconds > 0) {
      return;
    }

    if (notifiedEndAtRef.current !== timer.endAt) {
      notifyRestDone();
      notifiedEndAtRef.current = timer.endAt;
    }
  }, [remainingSeconds, timer]);

  if (!timer) {
    return null;
  }

  const isDone = remainingSeconds === 0;

  return (
    <section
      aria-live="polite"
      className={`sticky top-3 z-20 rounded-2xl border p-3 shadow-[0_18px_42px_rgba(0,0,0,0.35)] backdrop-blur-xl ${
        isDone
          ? "border-[color:var(--success)]/55 bg-emerald-500/15"
          : "border-[color:var(--accent)]/45 bg-[#080a0d]/95"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[color:var(--muted)]">
            Rest timer
          </p>
          <p className="text-3xl font-black tracking-normal">
            {isDone ? "Rest done" : formatTime(remainingSeconds)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => startTimer(defaultRestSeconds)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[color:var(--panel-border)] px-3 text-sm font-black"
          >
            <TimerReset aria-hidden="true" className="size-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={clearTimer}
            aria-label="Clear rest timer"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-[color:var(--panel-border)] text-[color:var(--muted)]"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

type RestTimerSubmitButtonProps = {
  isDone: boolean;
  restSeconds: number;
};

export function RestTimerSubmitButton({
  isDone,
  restSeconds
}: RestTimerSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      onClick={() => startTimer(restSeconds)}
      className={`col-span-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-zinc-950 transition active:scale-[0.96] disabled:cursor-wait disabled:opacity-70 ${
        isDone ? "bg-[color:var(--success)]" : "bg-[color:var(--accent)]"
      }`}
    >
      {pending ? (
        "Saving..."
      ) : (
        <>
          <Check aria-hidden="true" className="size-5" strokeWidth={3} />
          {isDone ? "Done" : "Save set"}
        </>
      )}
    </button>
  );
}
