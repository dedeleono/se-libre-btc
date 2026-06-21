import {
  generateMnemonic as gen,
  validateMnemonic as val,
  mnemonicToSeed,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { HDKey } from "@scure/bip32";
import * as btc from "@scure/btc-signer";
import { pubECDSA } from "@scure/btc-signer/utils.js";

const PATH = "m/84'/1'/0'/0/0"; // coin type 1 = testnet

export interface DerivedAccount {
  address: string; // testnet native segwit, tb1...
  privateKeyWif: string; // testnet WIF of the first address
}

export function generateMnemonic(): string {
  return gen(wordlist, 128);
}

export function validateMnemonic(mnemonic: string): boolean {
  return val(mnemonic.trim(), wordlist);
}

export async function mnemonicToAccount(mnemonic: string): Promise<DerivedAccount> {
  const seed = await mnemonicToSeed(mnemonic.trim(), "");
  const child = HDKey.fromMasterSeed(seed).derive(PATH);
  if (!child.privateKey) throw new Error("derivation produced no private key");
  const pubkey = pubECDSA(child.privateKey);
  const address = btc.p2wpkh(pubkey, btc.TEST_NETWORK).address!;
  const wif = btc.WIF(btc.TEST_NETWORK).encode(child.privateKey);
  return { address, privateKeyWif: wif };
}

export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  try {
    const decoded = btc.Address(btc.TEST_NETWORK).decode(address.trim());
    // Accept any address valid under TEST_NETWORK; mainnet bc1 will throw.
    return Boolean(decoded);
  } catch {
    return false;
  }
}
