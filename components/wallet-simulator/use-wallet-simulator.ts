"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { generateMnemonic, mnemonicToAccount } from "@/lib/wallet-sim/crypto";
import {
  buildBackupChallenge,
  initialState,
  walletReducer,
} from "@/lib/wallet-sim/reducer";
import type { SendDraft, SimulatorState } from "@/lib/wallet-sim/types";

const TICK_MS = 1200;

// ---------------------------------------------------------------------------
// Public interface — panels depend on these exact names/signatures.
// ---------------------------------------------------------------------------
export interface WalletSimActions {
  generate: () => Promise<void>;
  next: () => void;
  toggleReveal: () => void;
  ackWritten: (v: boolean) => void;
  submitBackup: (answers: Record<number, string>) => void;
  simulateIncoming: () => void;
  updateDraft: (patch: Partial<SendDraft>) => void;
  submitSend: () => void;
  complete: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useWalletSimulator(opts?: {
  onLessonComplete?: () => void | Promise<void>;
}): {
  state: SimulatorState;
  actions: WalletSimActions;
} {
  const [state, dispatch] = useReducer(walletReducer, undefined, initialState);

  // Track mounted state to guard async callbacks against setting state after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Guard against concurrent generate calls.
  const generatingRef = useRef(false);

  // ---- Async: generate wallet ----
  const generate = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    dispatch({ type: "GENERATE_BEGIN" });
    try {
      const mnemonic = generateMnemonic();
      const account = await mnemonicToAccount(mnemonic);
      if (!mountedRef.current) return;
      dispatch({
        type: "GENERATE_SUCCESS",
        mnemonic,
        account,
        challenge: buildBackupChallenge(),
      });
    } catch (e) {
      if (!mountedRef.current) return;
      dispatch({
        type: "GENERATE_ERROR",
        message: e instanceof Error ? e.message : "Unknown error during key derivation",
      });
    } finally {
      generatingRef.current = false;
    }
  }, []);

  // ---- Synchronous actions (stable references via useCallback) ----
  const next = useCallback(() => dispatch({ type: "NEXT_PHASE" }), []);

  const toggleReveal = useCallback(() => dispatch({ type: "TOGGLE_REVEAL" }), []);

  const ackWritten = useCallback(
    (value: boolean) => dispatch({ type: "ACK_WRITTEN", value }),
    [],
  );

  const submitBackup = useCallback(
    (answers: Record<number, string>) =>
      dispatch({ type: "SUBMIT_BACKUP", answers }),
    [],
  );

  const simulateIncoming = useCallback(
    () => dispatch({ type: "SIMULATE_INCOMING", now: Date.now() }),
    [],
  );

  const updateDraft = useCallback(
    (patch: Partial<SendDraft>) => dispatch({ type: "UPDATE_SEND_DRAFT", patch }),
    [],
  );

  const submitSend = useCallback(
    () => dispatch({ type: "SUBMIT_SEND", now: Date.now() }),
    [],
  );

  // Hold the latest onLessonComplete in a ref so `complete` can stay stable
  // ([] deps) even when the caller passes a new inline object each render.
  const onCompleteRef = useRef(opts?.onLessonComplete);
  useEffect(() => {
    onCompleteRef.current = opts?.onLessonComplete;
  });

  const complete = useCallback(() => {
    const result = onCompleteRef.current?.();
    if (result instanceof Promise) {
      result.catch(() => {
        // ignore — callers are responsible for their own error handling
      });
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  // ---- Side-effect: confirmation tick driver ----
  // The interval is started only while at least one tx is pending.
  // Clears on cleanup (dep change or unmount) — no leak possible.
  const hasPending = state.transactions.some((t) => t.status === "pending");

  useEffect(() => {
    if (!hasPending) return;

    if (prefersReducedMotion()) {
      // Instant-confirm: skip the animation, resolve all pending immediately.
      dispatch({ type: "TICK_CONFIRMATION", now: Date.now(), instant: true });
      return; // no interval needed
    }

    const id = setInterval(
      () => dispatch({ type: "TICK_CONFIRMATION", now: Date.now() }),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, [hasPending]);

  // ---- Stable actions object ----
  // Wrapped in useMemo so the object identity is stable across renders;
  // it only changes when one of the constituent callbacks changes.
  const actions = useMemo<WalletSimActions>(
    () => ({
      generate,
      next,
      toggleReveal,
      ackWritten,
      submitBackup,
      simulateIncoming,
      updateDraft,
      submitSend,
      complete,
      reset,
    }),
    [
      generate,
      next,
      toggleReveal,
      ackWritten,
      submitBackup,
      simulateIncoming,
      updateDraft,
      submitSend,
      complete,
      reset,
    ],
  );

  return { state, actions };
}

