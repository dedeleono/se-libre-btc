import { describe, it, expect } from "vitest";
import { generateMnemonic, validateMnemonic, mnemonicToAccount, isValidAddress } from "./crypto";

// Known BIP39 test vector
const VECTOR = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

describe("crypto boundary (testnet BIP84)", () => {
  it("generates a valid 12-word mnemonic", () => {
    const m = generateMnemonic();
    expect(m.trim().split(/\s+/)).toHaveLength(12);
    expect(validateMnemonic(m)).toBe(true);
  });

  it("rejects an invalid mnemonic", () => {
    expect(validateMnemonic("not a real seed phrase at all nope nope nope")).toBe(false);
  });

  it("derives a testnet tb1 native segwit address + WIF for a known vector", async () => {
    const acct = await mnemonicToAccount(VECTOR);
    expect(acct.address.startsWith("tb1")).toBe(true);
    expect(acct.address.length).toBeGreaterThan(20);
    expect(typeof acct.privateKeyWif).toBe("string");
    expect(acct.privateKeyWif.length).toBeGreaterThan(20);
  });

  it("validates testnet bech32 addresses and rejects mainnet/garbage", async () => {
    const acct = await mnemonicToAccount(VECTOR);
    expect(isValidAddress(acct.address)).toBe(true);
    expect(isValidAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4")).toBe(false); // mainnet
    expect(isValidAddress("not-an-address")).toBe(false);
    expect(isValidAddress("")).toBe(false);
  });
});
