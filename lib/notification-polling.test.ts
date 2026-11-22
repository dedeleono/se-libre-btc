import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startVisiblePolling } from "./notification-polling";

const INTERVAL = 30_000;

const fakeDocument = (visibilityState: "visible" | "hidden") =>
  Object.assign(new EventTarget(), { visibilityState });

const setVisibility = (doc: ReturnType<typeof fakeDocument>, state: "visible" | "hidden") => {
  doc.visibilityState = state;
  doc.dispatchEvent(new Event("visibilitychange"));
};

describe("startVisiblePolling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("polls every 30 seconds while the tab is visible", async () => {
    const poll = vi.fn(() => Promise.resolve());
    startVisiblePolling(poll, { doc: fakeDocument("visible"), win: new EventTarget() });

    await vi.advanceTimersByTimeAsync(INTERVAL - 1);
    expect(poll).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(1 + 2 * INTERVAL);
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it("does not poll while the tab is hidden", async () => {
    const poll = vi.fn(() => Promise.resolve());
    startVisiblePolling(poll, { doc: fakeDocument("hidden"), win: new EventTarget() });

    await vi.advanceTimersByTimeAsync(5 * INTERVAL);
    expect(poll).not.toHaveBeenCalled();
  });

  it("pauses when hidden and refetches immediately when visible again", async () => {
    const poll = vi.fn(() => Promise.resolve());
    const doc = fakeDocument("visible");
    startVisiblePolling(poll, { doc, win: new EventTarget() });

    await vi.advanceTimersByTimeAsync(INTERVAL / 3);
    setVisibility(doc, "hidden");
    await vi.advanceTimersByTimeAsync(5 * INTERVAL);
    expect(poll).not.toHaveBeenCalled();

    setVisibility(doc, "visible");
    await vi.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(INTERVAL - 1);
    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("refetches immediately on window focus", async () => {
    const poll = vi.fn(() => Promise.resolve());
    const win = new EventTarget();
    startVisiblePolling(poll, { doc: fakeDocument("visible"), win });

    win.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("sends one request when focus and visibility fire together", async () => {
    let finish: () => void = () => {};
    const poll = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const doc = fakeDocument("hidden");
    const win = new EventTarget();
    startVisiblePolling(poll, { doc, win });

    setVisibility(doc, "visible");
    win.dispatchEvent(new Event("focus"));
    expect(poll).toHaveBeenCalledTimes(1);

    finish();
    await vi.advanceTimersByTimeAsync(0);
    win.dispatchEvent(new Event("focus"));
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("stops polling and listening after cleanup", async () => {
    const poll = vi.fn(() => Promise.resolve());
    const doc = fakeDocument("visible");
    const win = new EventTarget();
    const stop = startVisiblePolling(poll, { doc, win });

    stop();
    win.dispatchEvent(new Event("focus"));
    setVisibility(doc, "visible");
    await vi.advanceTimersByTimeAsync(5 * INTERVAL);
    expect(poll).not.toHaveBeenCalled();
  });
});
