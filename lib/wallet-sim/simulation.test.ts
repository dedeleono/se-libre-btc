import { describe, it, expect } from "vitest";
import { validateSend, feeFor, buildIncomingTx, buildOutgoingTx, canAdvance } from "./simulation";
import { DUST_SATS, DEFAULT_INCOMING_SATS, type SimulatorState, type SendDraft } from "./types";

const baseDraft: SendDraft = { toAddress: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", amountSats: 5000, feeLevel: "med" };

describe("validateSend", () => {
  it("requires an address", () => {
    expect(validateSend({ ...baseDraft, toAddress: "" }, 1_000_000).toAddress).toBe("required");
  });
  it("rejects a malformed/mainnet address", () => {
    expect(validateSend({ ...baseDraft, toAddress: "bc1qxxx" }, 1_000_000).toAddress).toBe("invalidFormat");
  });
  it("requires a positive amount", () => {
    expect(validateSend({ ...baseDraft, amountSats: null }, 1_000_000).amount).toBe("required");
    expect(validateSend({ ...baseDraft, amountSats: 0 }, 1_000_000).amount).toBe("notPositive");
  });
  it("rejects dust", () => {
    expect(validateSend({ ...baseDraft, amountSats: DUST_SATS - 1 }, 1_000_000).amount).toBe("dust");
  });
  it("rejects amount+fee over balance", () => {
    // med fee = 800; balance just below amount+fee
    expect(validateSend({ ...baseDraft, amountSats: 5000 }, 5000).amount).toBe("insufficientFunds");
  });
  it("accepts a valid draft (no errors)", () => {
    expect(validateSend(baseDraft, 1_000_000)).toEqual({});
  });
});

describe("feeFor", () => {
  it("maps fee level to fee table row", () => {
    expect(feeFor("high")).toMatchObject({ feeSats: 2500, requiredConfirmations: 1 });
  });
});

describe("buildIncomingTx", () => {
  it("creates a pending incoming tx with default sats and 3 confirmations", () => {
    const tx = buildIncomingTx(1000);
    expect(tx.direction).toBe("in");
    expect(tx.status).toBe("pending");
    expect(tx.amountSats).toBe(DEFAULT_INCOMING_SATS);
    expect(tx.requiredConfirmations).toBe(3);
    expect(tx.feeSats).toBe(0);
  });
});

describe("buildOutgoingTx", () => {
  it("creates a pending outgoing tx using the fee table", () => {
    const tx = buildOutgoingTx(baseDraft, 2000);
    expect(tx.direction).toBe("out");
    expect(tx.status).toBe("pending");
    expect(tx.amountSats).toBe(5000);
    expect(tx.feeRate).toBe("med");
    expect(tx.feeSats).toBe(800);
    expect(tx.requiredConfirmations).toBe(3);
  });
});

function stateWith(partial: Partial<SimulatorState>): SimulatorState {
  return {
    phase: "create", reachedPhases: ["create"], wallet: null,
    backup: { revealed: false, acknowledgedWritten: false, challenge: null, result: null, verified: false },
    transactions: [], send: { draft: { toAddress: "", amountSats: null, feeLevel: "med" }, errors: {}, broadcasted: false },
    ui: { isGenerating: false, error: null }, ...partial,
  };
}

describe("canAdvance (entry guard for next phase)", () => {
  it("create → backup needs a wallet", () => {
    expect(canAdvance(stateWith({ phase: "create", wallet: null }))).toBe(false);
    expect(canAdvance(stateWith({ phase: "create", wallet: { mnemonic: "x", address: "tb1q", privateKeyWif: "w", balanceSats: 0 } }))).toBe(true);
  });
  it("backup → receive needs verified backup", () => {
    expect(canAdvance(stateWith({ phase: "backup", backup: { revealed: true, acknowledgedWritten: true, challenge: { positions: [0] }, result: { ok: true }, verified: false } }))).toBe(false);
    expect(canAdvance(stateWith({ phase: "backup", backup: { revealed: true, acknowledgedWritten: true, challenge: { positions: [0] }, result: { ok: true }, verified: true } }))).toBe(true);
  });
  it("receive → send needs a confirmed incoming tx and positive balance", () => {
    const confirmedIn = { id: "1", direction: "in" as const, amountSats: 1_000_000, feeRate: null, feeSats: 0, status: "confirmed" as const, confirmations: 3, requiredConfirmations: 3, counterpartyAddress: "tb1q", createdAt: 0, confirmedAt: 1 };
    expect(canAdvance(stateWith({ phase: "receive", transactions: [], wallet: { mnemonic: "x", address: "tb1q", privateKeyWif: "w", balanceSats: 0 } }))).toBe(false);
    expect(canAdvance(stateWith({ phase: "receive", transactions: [confirmedIn], wallet: { mnemonic: "x", address: "tb1q", privateKeyWif: "w", balanceSats: 1_000_000 } }))).toBe(true);
  });
  it("send → done needs a confirmed outgoing tx", () => {
    const confirmedOut = { id: "2", direction: "out" as const, amountSats: 5000, feeRate: "med" as const, feeSats: 800, status: "confirmed" as const, confirmations: 3, requiredConfirmations: 3, counterpartyAddress: "tb1q", createdAt: 0, confirmedAt: 1 };
    expect(canAdvance(stateWith({ phase: "send", transactions: [] }))).toBe(false);
    expect(canAdvance(stateWith({ phase: "send", transactions: [confirmedOut] }))).toBe(true);
  });
});
