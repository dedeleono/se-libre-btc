import { describe, it, expect } from "vitest";
import { generateMnemonic, validateMnemonic, mnemonicToAccount, isValidAddress } from "./crypto";

// Known BIP39 test vector (abandon×11 + about, no passphrase)
const VECTOR = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Pinned deterministic values at m/84'/1'/0'/0/0 on TEST_NETWORK.
// These were computed once from the real implementation and hard-coded so any
// future change in path, network, or coin-type will cause a regression failure.
const PINNED_ADDRESS = "tb1q6rz28mcfaxtmd6v789l9rrlrusdprr9pqcpvkl";
const PINNED_WIF = "cTGhosGriPpuGA586jemcuH9pE9spwUmneMBmYYzrQEbY92DJrbo";

describe("crypto boundary (testnet BIP84)", () => {
  it("generates a valid 12-word mnemonic", () => {
    const m = generateMnemonic();
    expect(m.trim().split(/\s+/)).toHaveLength(12);
    expect(validateMnemonic(m)).toBe(true);
  });

  it("rejects an invalid mnemonic", () => {
    expect(validateMnemonic("not a real seed phrase at all nope nope nope")).toBe(false);
  });

  it("derives exact testnet tb1 address + WIF for the BIP39 known vector", async () => {
    const acct = await mnemonicToAccount(VECTOR);
    expect(acct.address).toBe(PINNED_ADDRESS);
    expect(acct.privateKeyWif).toBe(PINNED_WIF);
  });

  it("validates testnet bech32 addresses and rejects mainnet/garbage", () => {
    expect(isValidAddress(PINNED_ADDRESS)).toBe(true);
    expect(isValidAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4")).toBe(false); // mainnet
    expect(isValidAddress("not-an-address")).toBe(false);
    expect(isValidAddress("")).toBe(false);
  });
});
