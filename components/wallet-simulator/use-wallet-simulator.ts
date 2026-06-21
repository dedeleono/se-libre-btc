// Stub — Task 11 will implement the full hook.
// Panels import WalletSimActions from here so Task 10 can type-check independently.

export interface WalletSimActions {
  generate: () => void;
  next: () => void;
  toggleReveal: () => void;
  ackWritten: (v: boolean) => void;
  submitBackup: (answers: Record<number, string>) => void;
  simulateIncoming: () => void;
  updateDraft: (patch: Partial<import("@/lib/wallet-sim/types").SendDraft>) => void;
  submitSend: () => void;
  complete: () => void;
  reset: () => void;
}
