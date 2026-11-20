export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

type Listenable = Pick<EventTarget, "addEventListener" | "removeEventListener">;

export type PollingTargets = {
  doc: Listenable & { visibilityState: string };
  win: Listenable;
  intervalMs?: number;
};

export function startVisiblePolling(
  poll: () => Promise<void>,
  { doc, win, intervalMs = NOTIFICATION_POLL_INTERVAL_MS }: PollingTargets
): () => void {
  let timer: ReturnType<typeof setInterval> | null = null;
  let inFlight = false;

  const run = () => {
    if (inFlight || doc.visibilityState !== "visible") return;
    inFlight = true;
    const done = () => {
      inFlight = false;
    };
    poll().then(done, done);
  };

  const start = () => {
    if (timer === null) timer = setInterval(run, intervalMs);
  };

  const stop = () => {
    if (timer === null) return;
    clearInterval(timer);
    timer = null;
  };

  const onVisibilityChange = () => {
    if (doc.visibilityState === "visible") {
      run();
      start();
    } else {
      stop();
    }
  };

  doc.addEventListener("visibilitychange", onVisibilityChange);
  win.addEventListener("focus", run);
  if (doc.visibilityState === "visible") start();

  return () => {
    stop();
    doc.removeEventListener("visibilitychange", onVisibilityChange);
    win.removeEventListener("focus", run);
  };
}
