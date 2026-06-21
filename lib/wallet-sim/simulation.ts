import { isValidAddress } from "./crypto";
import {
  DUST_SATS,
  DEFAULT_INCOMING_SATS,
  INCOMING_REQUIRED_CONFIRMATIONS,
  SAMPLE_COUNTERPARTY,
  FEE_TABLE,
  type FeeLevel,
  type SendDraft,
  type SendErrors,
  type SimTx,
  type SimulatorState,
  type RecapSummary,
} from "./types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

export function feeFor(level: FeeLevel) {
  return FEE_TABLE[level];
}

export function validateSend(draft: SendDraft, balanceSats: number): SendErrors {
  const errors: SendErrors = {};

  if (!draft.toAddress || !draft.toAddress.trim()) {
    errors.toAddress = "required";
  } else if (!isValidAddress(draft.toAddress)) {
    errors.toAddress = "invalidFormat";
  }

  const amount = draft.amountSats;
  const fee = feeFor(draft.feeLevel).feeSats;
  if (amount === null || amount === undefined) {
    errors.amount = "required";
  } else if (amount <= 0) {
    errors.amount = "notPositive";
  } else if (amount < DUST_SATS) {
    errors.amount = "dust";
  } else if (amount + fee > balanceSats) {
    errors.amount = "insufficientFunds";
  }

  return errors;
}

export function buildIncomingTx(now: number): SimTx {
  return {
    id: nextId(),
    direction: "in",
    amountSats: DEFAULT_INCOMING_SATS,
    feeRate: null,
    feeSats: 0,
    status: "pending",
    confirmations: 0,
    requiredConfirmations: INCOMING_REQUIRED_CONFIRMATIONS,
    counterpartyAddress: SAMPLE_COUNTERPARTY,
    createdAt: now,
    confirmedAt: null,
  };
}

export function buildOutgoingTx(draft: SendDraft, now: number): SimTx {
  const fee = feeFor(draft.feeLevel);
  return {
    id: nextId(),
    direction: "out",
    amountSats: draft.amountSats ?? 0,
    feeRate: draft.feeLevel,
    feeSats: fee.feeSats,
    status: "pending",
    confirmations: 0,
    requiredConfirmations: fee.requiredConfirmations,
    counterpartyAddress: draft.toAddress.trim(),
    createdAt: now,
    confirmedAt: null,
  };
}

export function canAdvance(state: SimulatorState): boolean {
  switch (state.phase) {
    case "create":
      return state.wallet !== null;
    case "backup":
      return state.backup.verified === true;
    case "receive":
      return (
        state.transactions.some((t) => t.direction === "in" && t.status === "confirmed") &&
        state.wallet !== null &&
        state.wallet.balanceSats > 0
      );
    case "send":
      return state.transactions.some((t) => t.direction === "out" && t.status === "confirmed");
    case "done":
    default:
      return false;
  }
}

export function buildRecap(state: SimulatorState): RecapSummary {
  const confirmed = state.transactions.filter((t) => t.status === "confirmed");
  const receivedSats = confirmed
    .filter((t) => t.direction === "in")
    .reduce((s, t) => s + t.amountSats, 0);
  const sentSats = confirmed
    .filter((t) => t.direction === "out")
    .reduce((s, t) => s + t.amountSats + t.feeSats, 0);
  return {
    finalBalanceSats: state.wallet?.balanceSats ?? 0,
    receivedSats,
    sentSats,
    txCount: state.transactions.length,
  };
}
