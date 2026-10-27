import { useCallback, useEffect, useState } from "react";

/** m:ss, e.g. 125 → "2:05". */
export const formatCountdown = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/** Counts down once per second from `initialSeconds`; `restart(n)` starts over from n. */
export function useCountdown(initialSeconds = 0) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemaining((r) => Math.max(r - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [remaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = useCallback((seconds: number) => setRemaining(Math.max(0, Math.floor(seconds))), []);

  return { remaining, restart };
}
