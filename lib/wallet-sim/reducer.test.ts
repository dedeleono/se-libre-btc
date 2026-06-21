import { describe, it, expect } from "vitest";
import { initialState, walletReducer, buildBackupChallenge, type Action } from "./reducer";
import { DEFAULT_INCOMING_SATS } from "./types";

const MNEMONIC = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const ACCOUNT = { address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", privateKeyWif: "cWIFxxxx" };

function generated() {
  let s = initialState();
  s = walletReducer(s, { type: "GENERATE_BEGIN" });
  s = walletReducer(s, { type: "GENERATE_SUCCESS", mnemonic: MNEMONIC, account: ACCOUNT, challenge: { positions: [0, 1, 2] } });
  return s;
}

describe("reducer", () => {
  it("starts in create with no wallet", () => {
    const s = initialState();
    expect(s.phase).toBe("create");
    expect(s.wallet).toBeNull();
  });

  it("GENERATE_BEGIN sets isGenerating", () => {
    const s = walletReducer(initialState(), { type: "GENERATE_BEGIN" });
    expect(s.ui.isGenerating).toBe(true);
  });

  it("GENERATE_SUCCESS sets wallet (balance 0) + challenge, clears generating", () => {
    const s = generated();
    expect(s.wallet?.address).toBe(ACCOUNT.address);
    expect(s.wallet?.balanceSats).toBe(0);
    expect(s.backup.challenge?.positions).toEqual([0, 1, 2]);
    expect(s.ui.isGenerating).toBe(false);
  });

  it("GENERATE_ERROR sets ui.error and clears generating", () => {
    let s = walletReducer(initialState(), { type: "GENERATE_BEGIN" });
    s = walletReducer(s, { type: "GENERATE_ERROR", message: "boom" });
    expect(s.ui.error).toBe("boom");
    expect(s.ui.isGenerating).toBe(false);
  });

  it("NEXT_PHASE advances create→backup only when wallet exists", () => {
    const noWallet = walletReducer(initialState(), { type: "NEXT_PHASE" });
    expect(noWallet.phase).toBe("create"); // guard blocks
    const s = walletReducer(generated(), { type: "NEXT_PHASE" });
    expect(s.phase).toBe("backup");
    expect(s.reachedPhases).toContain("backup");
  });

  it("SUBMIT_BACKUP with all-correct answers verifies; receive gate then opens", () => {
    let s = walletReducer(generated(), { type: "NEXT_PHASE" }); // → backup
    const words = MNEMONIC.split(" ");
    const answers = { 0: words[0], 1: words[1], 2: words[2] };
    s = walletReducer(s, { type: "SUBMIT_BACKUP", answers });
    expect(s.backup.result).toEqual({ ok: true });
    expect(s.backup.verified).toBe(true);
    s = walletReducer(s, { type: "NEXT_PHASE" }); // → receive
    expect(s.phase).toBe("receive");
  });

  it("SUBMIT_BACKUP with a wrong answer reports wrongPositions and stays unverified", () => {
    let s = walletReducer(generated(), { type: "NEXT_PHASE" });
    s = walletReducer(s, { type: "SUBMIT_BACKUP", answers: { 0: "wrong", 1: "abandon", 2: "abandon" } });
    expect(s.backup.verified).toBe(false);
    expect(s.backup.result).toEqual({ ok: false, wrongPositions: [0] });
  });

  it("backup gate blocks receive until verified", () => {
    let s = walletReducer(generated(), { type: "NEXT_PHASE" }); // backup
    s = walletReducer(s, { type: "NEXT_PHASE" }); // blocked
    expect(s.phase).toBe("backup");
  });

  it("SIMULATE_INCOMING then ticks to confirmed credits balance", () => {
    let s = walletReducer(generated(), { type: "NEXT_PHASE" }); // backup
    const words = MNEMONIC.split(" ");
    s = walletReducer(s, { type: "SUBMIT_BACKUP", answers: { 0: words[0], 1: words[1], 2: words[2] } });
    s = walletReducer(s, { type: "NEXT_PHASE" }); // receive
    s = walletReducer(s, { type: "SIMULATE_INCOMING", now: 1 });
    expect(s.transactions[0].status).toBe("pending");
    // 3 ticks → confirmed, balance credited
    s = walletReducer(s, { type: "TICK_CONFIRMATION", now: 2 });
    s = walletReducer(s, { type: "TICK_CONFIRMATION", now: 3 });
    s = walletReducer(s, { type: "TICK_CONFIRMATION", now: 4 });
    expect(s.transactions[0].status).toBe("confirmed");
    expect(s.wallet?.balanceSats).toBe(DEFAULT_INCOMING_SATS);
  });

  it("TICK_CONFIRMATION with instant jumps pending → confirmed in one tick", () => {
    let s = walletReducer(generated(), { type: "NEXT_PHASE" });
    const words = MNEMONIC.split(" ");
    s = walletReducer(s, { type: "SUBMIT_BACKUP", answers: { 0: words[0], 1: words[1], 2: words[2] } });
    s = walletReducer(s, { type: "NEXT_PHASE" });
    s = walletReducer(s, { type: "SIMULATE_INCOMING", now: 1 });
    s = walletReducer(s, { type: "TICK_CONFIRMATION", now: 2, instant: true });
    expect(s.transactions[0].status).toBe("confirmed");
  });

  it("UPDATE_SEND_DRAFT recomputes errors", () => {
    let s = walletReducer(generated(), { type: "NEXT_PHASE" });
    const words = MNEMONIC.split(" ");
    s = walletReducer(s, { type: "SUBMIT_BACKUP", answers: { 0: words[0], 1: words[1], 2: words[2] } });
    s = walletReducer(s, { type: "NEXT_PHASE" });
    s = walletReducer(s, { type: "SIMULATE_INCOMING", now: 1 });
    s = walletReducer(s, { type: "TICK_CONFIRMATION", now: 2, instant: true });
    s = walletReducer(s, { type: "NEXT_PHASE" }); // → send
    s = walletReducer(s, { type: "UPDATE_SEND_DRAFT", patch: { toAddress: "", amountSats: 5000 } });
    expect(s.send.errors.toAddress).toBe("required");
  });

  it("SUBMIT_SEND with a valid draft broadcasts; out tx debits amount+fee on confirm", () => {
    let s = walletReducer(generated(), { type: "NEXT_PHASE" });
    const words = MNEMONIC.split(" ");
    s = walletReducer(s, { type: "SUBMIT_BACKUP", answers: { 0: words[0], 1: words[1], 2: words[2] } });
    s = walletReducer(s, { type: "NEXT_PHASE" });
    s = walletReducer(s, { type: "SIMULATE_INCOMING", now: 1 });
    s = walletReducer(s, { type: "TICK_CONFIRMATION", now: 2, instant: true });
    s = walletReducer(s, { type: "NEXT_PHASE" }); // send
    s = walletReducer(s, { type: "UPDATE_SEND_DRAFT", patch: { toAddress: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", amountSats: 5000, feeLevel: "med" } });
    s = walletReducer(s, { type: "SUBMIT_SEND", now: 3 });
    expect(s.send.broadcasted).toBe(true);
    s = walletReducer(s, { type: "TICK_CONFIRMATION", now: 4, instant: true });
    expect(s.wallet?.balanceSats).toBe(DEFAULT_INCOMING_SATS - 5000 - 800);
    s = walletReducer(s, { type: "NEXT_PHASE" }); // → done
    expect(s.phase).toBe("done");
  });

  it("RESET returns fresh initial state", () => {
    const s = walletReducer(generated(), { type: "RESET" });
    expect(s.phase).toBe("create");
    expect(s.wallet).toBeNull();
  });

  it("buildBackupChallenge returns 3 distinct positions in 0..11", () => {
    const c = buildBackupChallenge();
    expect(c.positions).toHaveLength(3);
    expect(new Set(c.positions).size).toBe(3);
    c.positions.forEach((p) => { expect(p).toBeGreaterThanOrEqual(0); expect(p).toBeLessThanOrEqual(11); });
  });

  it("reducer returns new state object (immutability)", () => {
    const s = initialState();
    const s2 = walletReducer(s, { type: "GENERATE_BEGIN" });
    expect(s2).not.toBe(s);
    expect(s.ui.isGenerating).toBe(false); // original not mutated
  });
});
