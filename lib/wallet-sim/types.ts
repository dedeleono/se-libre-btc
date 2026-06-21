// Wallet simulator state model and fake-network constants.
// All monetary values are integer satoshis — never floats or BTC.

export type Phase = "create" | "backup" | "receive" | "send" | "done";
export const PHASE_ORDER: Phase[] = ["create", "backup", "receive", "send", "done"];

export interface Wallet {
  mnemonic: string; // 12 words
  address: string; // real tb1... (testnet)
  privateKeyWif: string; // real testnet WIF (teaching "secret"; never sent/persisted)
  balanceSats: number; // FAKED, starts at 0; integer sats only
}

export type TxDirection = "in" | "out";
export type TxStatus = "pending" | "confirmed";
export type FeeLevel = "low" | "med" | "high";

export interface SimTx {
  id: string;
  direction: TxDirection;
  amountSats: number; // integer sats
  feeRate: FeeLevel | null;
  feeSats: number; // integer sats
  status: TxStatus;
  confirmations: number;
  requiredConfirmations: number;
  counterpartyAddress: string;
  createdAt: number; // Unix ms timestamp
  confirmedAt: number | null; // Unix ms timestamp
}

export interface BackupChallengeSpec {
  positions: number[]; // 0-indexed word positions
}
export type BackupResult = { ok: true } | { ok: false; wrongPositions: number[] };

export interface SendDraft {
  toAddress: string;
  amountSats: number | null; // integer sats, null until user enters a value
  feeLevel: FeeLevel;
}
export interface SendErrors {
  toAddress?: "required" | "invalidFormat";
  amount?: "required" | "notPositive" | "insufficientFunds" | "dust";
}

export interface RecapSummary {
  finalBalanceSats: number; // integer sats
  receivedSats: number; // integer sats
  sentSats: number; // integer sats
  txCount: number;
}

export interface SimulatorState {
  phase: Phase;
  reachedPhases: Phase[];
  wallet: Wallet | null;
  backup: {
    revealed: boolean;
    acknowledgedWritten: boolean;
    challenge: BackupChallengeSpec | null;
    result: BackupResult | null;
    verified: boolean;
  };
  transactions: SimTx[]; // newest-first, both directions
  send: { draft: SendDraft; errors: SendErrors; broadcasted: boolean };
  ui: { isGenerating: boolean; error: string | null };
}

// ---- Fake-network constants (spec §14) ----
export const DUST_SATS = 546; // integer sats; minimum sendable amount
export const DEFAULT_INCOMING_SATS = 1_000_000; // 0.01 BTC in integer sats
export const INCOMING_REQUIRED_CONFIRMATIONS = 3;
export const SAMPLE_COUNTERPARTY =
  "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"; // fixed sample testnet address (display only)

export const FEE_TABLE: Record<
  FeeLevel,
  { feeSats: number; requiredConfirmations: number; etaKey: string }
> = {
  low: { feeSats: 200, requiredConfirmations: 6, etaKey: "fee.low.eta" },
  med: { feeSats: 800, requiredConfirmations: 3, etaKey: "fee.med.eta" },
  high: { feeSats: 2500, requiredConfirmations: 1, etaKey: "fee.high.eta" },
};
