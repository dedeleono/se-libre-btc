# BTC Wallet Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, 100% client-side "BTC wallet simulator" React widget that walks a learner through create → backup → receive → send → recap using real BIP39/BIP84 testnet crypto with a faked network, toggled on per-chapter by admins.

**Architecture:** Three layers with hard boundaries — (1) a crypto boundary `lib/wallet-sim/crypto.ts` (real seed/address derivation), (2) a pure, React-free simulation core (`types`, `reducer`, `simulation`, `format`) that fakes balance/txs/confirmations, and (3) a presentational React widget under `components/wallet-simulator/` driven by a single `useWalletSimulator` hook. Persistence is one boolean column on `Chapter` (`hasWalletSimulator`); the widget itself stores nothing.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript 5, Tailwind + shadcn/ui (`@/components/ui/*`), Prisma (Supabase Postgres), `@scure/bip39` + `@scure/bip32` + `@scure/btc-signer` (noble/scure, pure JS, no WASM/polyfills), `qrcode.react`, `sonner` toasts, `lucide-react` icons. Tests via Vitest (added in Phase 0b — none exists today).

## Global Constraints

- **Spanish-first i18n:** all user-facing copy via `const { t } = useLocale()` from `@/lib/i18n`; `t` is a nested object (e.g. `t.walletSim.backup.title`). `es` is the source of truth in `lib/i18n/messages.ts` (`Messages = typeof es`), so every key MUST also be mirrored in `en` or the build fails. New namespace key: `walletSim`.
- **Package manager:** `yarn` (there is a `yarn.lock`). Never use `npm install` to add deps.
- **Crypto network:** **TESTNET ONLY.** Always `btc.TEST_NETWORK`, derivation path `m/84'/1'/0'/0/0` (coin type 1 = testnet). Addresses are `tb1…`. No mainnet anywhere.
- **No Buffer/crypto polyfills and no `next.config` changes** — the noble/scure stack is pure JS. `mnemonicToSeed` is async (PBKDF2 via Web Crypto) → all derivation is async.
- **Integer sats everywhere.** BTC is a display-only conversion. Never float-math a balance.
- **Lazy mount, client-only:** the widget is loaded via `dynamic(() => import(...), { ssr: false })` because crypto + QR are browser-only.
- **Prisma migrations are special here:** `prisma migrate dev` is BROKEN (no shadow DB; baseline is hand-written SQL). Use a HAND-WRITTEN `migration.sql` + `npx prisma migrate deploy` + `npx prisma generate`. See Task 2.
- **No test runner exists today.** Phase 0b adds Vitest scoped to `lib/wallet-sim/**`. If the user rejects adding Vitest, fall back to the manual `tsx`-script verification noted in each pure-module task.
- **Verification baseline** (project has no `test` script for app code): `npx tsc --noEmit`, `yarn lint`, `yarn build`.
- **Reusability:** `<WalletSimulator>` takes NO lesson-specific props beyond optional `onLessonComplete`. No lesson-specific copy inside the widget.

---

## File Structure

**New files:**

```
lib/wallet-sim/
  crypto.ts                          # real BIP39/BIP84 testnet adapter (the boundary)
  types.ts                           # all simulator TS types + constants (PHASE_ORDER, fee table consts)
  format.ts                          # satsToBtc, formatSats, formatBtc, truncateAddress
  simulation.ts                      # validateSend, fee table, incoming-tx builder, canAdvance
  reducer.ts                         # pure state machine (initialState, walletReducer, Action union)
  crypto.test.ts                     # Vitest (browser-crypto-capable)
  format.test.ts
  simulation.test.ts
  reducer.test.ts
components/wallet-simulator/
  index.tsx                          # "use client" WalletSimulator widget (default export for dynamic import)
  use-wallet-simulator.ts            # hook: owns reducer + side effects (async crypto, tick, completion)
  presentational/
    phase-stepper.tsx
    practice-banner.tsx
    seed-phrase-grid.tsx
    address-display.tsx
    qr-code.tsx
    balance-display.tsx
    tx-status.tsx
    confirmation-meter.tsx
    fee-selector.tsx
    reset-button.tsx
  panels/
    create-panel.tsx
    backup-panel.tsx
    receive-panel.tsx
    send-panel.tsx
    recap-panel.tsx
prisma/migrations/<timestamp>_add_wallet_simulator_flag/migration.sql
vitest.config.ts                     # scoped to lib/wallet-sim
```

**Modified files:**

- `prisma/schema.prisma` — add `hasWalletSimulator Boolean @default(false)` to `Chapter`.
- `package.json` — add deps + devDeps + `test` script.
- `lib/i18n/messages.ts` — add `walletSim` namespace under `es` (before its closing `};` at L859) AND under `en` (before its closing `};` at L1709).
- `app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/page.tsx` — mount the new admin form.
- `app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/_components/chapter-wallet-simulator-form.tsx` — NEW admin toggle form.
- `app/api/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/route.ts` — accept `hasWalletSimulator` in PATCH.
- `app/(course)/courses/[courseId]/chapters/[chapterId]/page.tsx` — pass `hasWalletSimulator` into `<ContentViewer>` (`default` case, ~L208-224).
- `app/(course)/courses/[courseId]/chapters/[chapterId]/_components/content-viewer.tsx` — accept prop, lazy-mount widget after the rich-content `<Card>` (~L421).

---

## Phase 0a — Dependencies

### Task 1: Install runtime dependencies

**Files:**
- Modify: `package.json` (dependencies)

**Interfaces:**
- Produces: the `@scure/*` + `qrcode.react` modules that every later task imports.

- [ ] **Step 1: Add the runtime deps with yarn (exact pinned 2.2.0 line per spec §6)**

```bash
yarn add @scure/bip39@^2.2.0 @scure/bip32@^2.2.0 @scure/btc-signer@^2.2.0 qrcode.react@^4.2.0
```

(`@scure/btc-signer@2.2.0` transitively pulls `@noble/curves`, `@noble/hashes`, `@scure/base`, `micro-packed` — do NOT add those manually.)

- [ ] **Step 2: Verify the deps resolved and types ship**

Run:
```bash
node -e "require.resolve('@scure/bip39'); require.resolve('@scure/bip32'); require.resolve('@scure/btc-signer'); require.resolve('qrcode.react'); console.log('ok')"
```
Expected: prints `ok` (no MODULE_NOT_FOUND).

- [ ] **Step 3: Confirm no polyfill warnings on a type check**

Run: `npx tsc --noEmit`
Expected: PASS (no new errors introduced by the dep additions).

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: add @scure crypto + qrcode.react deps for wallet simulator"
```

---

## Phase 0b — Test runner (Vitest, scoped to the pure core)

> No test runner exists today (no jest/vitest in `package.json`; `ts-node` is present but only for the Prisma seed). The pure modules (`crypto`, `format`, `simulation`, `reducer`) are the highest-value things to test. Vitest runs TS natively, supports Web Crypto (needed for `mnemonicToSeed`), and stays out of the Next build. **If the user declines Vitest, each pure-module task below also lists a manual `npx tsx` fallback assertion.**

### Task 2a: Add Vitest scoped to `lib/wallet-sim`

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (devDependencies + scripts)

**Interfaces:**
- Produces: `yarn test` runs `vitest run lib/wallet-sim`. Test files use `import { describe, it, expect } from "vitest"`.

- [ ] **Step 1: Add Vitest dev dependency**

```bash
yarn add -D vitest@^2.1.0
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/wallet-sim/**/*.test.ts"],
    environment: "node", // Node 18+ exposes Web Crypto globally, enough for mnemonicToSeed
  },
});
```

- [ ] **Step 3: Add the `test` script to `package.json`**

In `"scripts"`, add:
```json
"test": "vitest run"
```

- [ ] **Step 4: Verify the runner boots (no tests yet → "no test files" is fine)**

Run: `yarn test`
Expected: Vitest starts and reports `No test files found` (or `0 passed`) — it must not error on config.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock vitest.config.ts
git commit -m "test: add vitest scoped to lib/wallet-sim"
```

---

## Phase 1 — Prisma column + hand-written migration

> CRITICAL: `prisma migrate dev` is broken in this repo (no `shadowDatabaseUrl`; the baseline migration is hand-written SQL that can't replay into a fresh shadow DB). Use a hand-written migration + `prisma migrate deploy`. The existing migration folder format is: `prisma/migrations/20260619000000_add_user_demographics/migration.sql` containing plain `ALTER TABLE` statements (no `-- CreateTable` header needed).

### Task 3: Add `hasWalletSimulator` to Chapter + hand-written migration

**Files:**
- Modify: `prisma/schema.prisma` (Chapter model, near L253 alongside `isIntro`)
- Create: `prisma/migrations/20260620000000_add_wallet_simulator_flag/migration.sql`

**Interfaces:**
- Produces: `Chapter.hasWalletSimulator: boolean` on the generated Prisma client (default `false`), read by the student page and admin form/PATCH.

- [ ] **Step 1: Add the column to the schema**

In `prisma/schema.prisma`, inside `model Chapter { ... }`, add the field next to the other boolean flags (right after `isIntro     Boolean     @default(false)` on L253):

```prisma
  isIntro            Boolean     @default(false)
  hasWalletSimulator Boolean     @default(false)
```

- [ ] **Step 2: Hand-write the migration SQL**

Create `prisma/migrations/20260620000000_add_wallet_simulator_flag/migration.sql`:

```sql
-- Add wallet simulator toggle to Chapter
ALTER TABLE "Chapter" ADD COLUMN "hasWalletSimulator" BOOLEAN NOT NULL DEFAULT false;
```

- [ ] **Step 3: Ensure the baseline migration is marked applied (idempotent guard)**

Run: `npx prisma migrate status`
If it reports `20260531000000_better_auth` as not-applied/pending, run once:
```bash
npx prisma migrate resolve --applied 20260531000000_better_auth
```
Expected: status shows existing migrations applied; only the new one pending.

- [ ] **Step 4: Apply with `migrate deploy` (NOT `migrate dev`) and regenerate the client**

Run:
```bash
npx prisma migrate deploy && npx prisma generate
```
Expected: deploy reports `1 migration` applied; generate succeeds.

- [ ] **Step 5: Verify the column physically exists**

Run:
```bash
echo 'SELECT "hasWalletSimulator" FROM "Chapter" LIMIT 1;' | npx prisma db execute --stdin --schema prisma/schema.prisma
```
Expected: command exits 0 (no "column does not exist" error). Empty result set is fine.

- [ ] **Step 6: Verify the type is on the client**

Run:
```bash
node -e "const {Chapter}=require('@prisma/client'); console.log('prisma client regenerated')"
```
Then `npx tsc --noEmit` — expect PASS.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260620000000_add_wallet_simulator_flag/migration.sql
git commit -m "feat(db): add Chapter.hasWalletSimulator flag (hand-written migration)"
```

---

## Phase 2 — Crypto boundary (`lib/wallet-sim/crypto.ts`)

> This is the ONLY file that imports a bitcoin library. Everything else depends on this interface. Testnet (`TEST_NETWORK`), path `m/84'/1'/0'/0/0`. `mnemonicToSeed` is async.

### Task 4: Implement `crypto.ts` (TDD)

**Files:**
- Create: `lib/wallet-sim/crypto.ts`
- Test: `lib/wallet-sim/crypto.test.ts`

**Interfaces:**
- Produces (exact signatures — consumed by `reducer`-driving hook and `simulation.ts`):
  ```ts
  export interface DerivedAccount { address: string; privateKeyWif: string; }
  export function generateMnemonic(): string;                  // 12 words, 128-bit entropy
  export function validateMnemonic(mnemonic: string): boolean;
  export function mnemonicToAccount(mnemonic: string): Promise<DerivedAccount>;
  export function isValidAddress(address: string): boolean;    // bech32 tb1... testnet check
  ```

- [ ] **Step 1: Write the failing test**

`lib/wallet-sim/crypto.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test lib/wallet-sim/crypto.test.ts`
Expected: FAIL — cannot resolve `./crypto`.

- [ ] **Step 3: Write the implementation**

`lib/wallet-sim/crypto.ts`:
```ts
import {
  generateMnemonic as gen,
  validateMnemonic as val,
  mnemonicToSeed,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
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
```

> NOTE for executor: if `btc.Address(...).decode` is not the exact exported helper name in `@scure/btc-signer@2.2.0`, fall back to a bech32 prefix + length check using `@scure/base`'s `bech32`: a testnet native segwit address starts with `tb1` and decodes via `bech32.decode`. Keep the `tb1`-only acceptance behavior the test asserts. Flag this in the PR if the API differs.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test lib/wallet-sim/crypto.test.ts`
Expected: PASS (4 tests).

Manual fallback (if Vitest declined): `npx tsx -e "import('./lib/wallet-sim/crypto').then(async m => console.log(await m.mnemonicToAccount('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')))"` → must print an object with a `tb1…` address.

- [ ] **Step 5: Commit**

```bash
git add lib/wallet-sim/crypto.ts lib/wallet-sim/crypto.test.ts
git commit -m "feat(wallet-sim): real BIP39/BIP84 testnet crypto boundary"
```

---

## Phase 3 — Pure sim core: types, format, simulation, reducer

> All four files are React-free and fully unit-tested. Order matters: `types` first (no logic), then `format`, then `simulation` (uses types + crypto's `isValidAddress`), then `reducer` (uses all three).

### Task 5: `types.ts` — state model & constants

**Files:**
- Create: `lib/wallet-sim/types.ts`

**Interfaces:**
- Produces (consumed everywhere — copy verbatim from spec §12 + §14):
  ```ts
  export type Phase = "create" | "backup" | "receive" | "send" | "done";
  export const PHASE_ORDER: Phase[];
  export interface Wallet { mnemonic; address; privateKeyWif; balanceSats }
  export type TxDirection = "in" | "out";
  export type TxStatus = "pending" | "confirmed";
  export type FeeLevel = "low" | "med" | "high";
  export interface SimTx { ... }
  export interface BackupChallengeSpec { positions: number[] }
  export type BackupResult = { ok: true } | { ok: false; wrongPositions: number[] };
  export interface SendDraft { toAddress; amountSats; feeLevel }
  export interface SendErrors { toAddress?; amount? }
  export interface RecapSummary { ... }
  export interface SimulatorState { ... }
  export const DUST_SATS = 546;
  export const DEFAULT_INCOMING_SATS = 1_000_000;
  export const INCOMING_REQUIRED_CONFIRMATIONS = 3;
  export const SAMPLE_COUNTERPARTY = "tb1q..."; // fixed sample testnet address
  export const FEE_TABLE: Record<FeeLevel, { feeSats; requiredConfirmations; etaKey }>;
  ```

- [ ] **Step 1: Write `types.ts` (no test — pure type/const declarations)**

```ts
export type Phase = "create" | "backup" | "receive" | "send" | "done";
export const PHASE_ORDER: Phase[] = ["create", "backup", "receive", "send", "done"];

export interface Wallet {
  mnemonic: string; // 12 words
  address: string; // real tb1... (testnet)
  privateKeyWif: string; // real testnet WIF (teaching "secret"; never sent/persisted)
  balanceSats: number; // FAKED, starts at 0
}

export type TxDirection = "in" | "out";
export type TxStatus = "pending" | "confirmed";
export type FeeLevel = "low" | "med" | "high";

export interface SimTx {
  id: string;
  direction: TxDirection;
  amountSats: number;
  feeRate: FeeLevel | null;
  feeSats: number;
  status: TxStatus;
  confirmations: number;
  requiredConfirmations: number;
  counterpartyAddress: string;
  createdAt: number;
  confirmedAt: number | null;
}

export interface BackupChallengeSpec {
  positions: number[]; // 0-indexed word positions
}
export type BackupResult = { ok: true } | { ok: false; wrongPositions: number[] };

export interface SendDraft {
  toAddress: string;
  amountSats: number | null;
  feeLevel: FeeLevel;
}
export interface SendErrors {
  toAddress?: "required" | "invalidFormat";
  amount?: "required" | "notPositive" | "insufficientFunds" | "dust";
}
export interface RecapSummary {
  finalBalanceSats: number;
  receivedSats: number;
  sentSats: number;
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
export const DUST_SATS = 546;
export const DEFAULT_INCOMING_SATS = 1_000_000; // 0.01 BTC
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/wallet-sim/types.ts
git commit -m "feat(wallet-sim): simulator state model and fake-network constants"
```

### Task 6: `format.ts` — sats/BTC + address formatting (TDD)

**Files:**
- Create: `lib/wallet-sim/format.ts`
- Test: `lib/wallet-sim/format.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export function satsToBtc(sats: number): number;
  export function formatSats(sats: number, locale?: string): string;   // grouped integer + " sats"
  export function formatBtc(sats: number, locale?: string): string;    // 8-dp BTC string
  export function truncateAddress(address: string): string;            // "tb1q…f3k9"
  ```

- [ ] **Step 1: Write the failing test**

`lib/wallet-sim/format.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { satsToBtc, formatSats, formatBtc, truncateAddress } from "./format";

describe("format", () => {
  it("converts sats to BTC without float drift", () => {
    expect(satsToBtc(100_000_000)).toBe(1);
    expect(satsToBtc(1_000_000)).toBe(0.01);
    expect(satsToBtc(546)).toBeCloseTo(0.00000546, 8);
  });

  it("formats sats as a grouped integer (es locale groups with .)", () => {
    expect(formatSats(1_000_000, "es-ES")).toMatch(/1[.\s ]000[.\s ]000/);
  });

  it("formats BTC to 8 decimal places", () => {
    expect(formatBtc(100_000_000, "en-US")).toBe("1.00000000");
    expect(formatBtc(1_000_000, "en-US")).toBe("0.01000000");
  });

  it("truncates an address to head…tail", () => {
    const a = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";
    const t = truncateAddress(a);
    expect(t.startsWith("tb1q")).toBe(true);
    expect(t).toContain("…");
    expect(t.length).toBeLessThan(a.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test lib/wallet-sim/format.test.ts`
Expected: FAIL — cannot resolve `./format`.

- [ ] **Step 3: Write the implementation**

`lib/wallet-sim/format.ts`:
```ts
const SATS_PER_BTC = 100_000_000;

export function satsToBtc(sats: number): number {
  return sats / SATS_PER_BTC;
}

export function formatSats(sats: number, locale = "es"): string {
  return `${new Intl.NumberFormat(locale).format(Math.trunc(sats))} sats`;
}

export function formatBtc(sats: number, locale = "es"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
    useGrouping: false,
  }).format(satsToBtc(sats));
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 12) return address;
  return `${address.slice(0, 5)}…${address.slice(-4)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test lib/wallet-sim/format.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/wallet-sim/format.ts lib/wallet-sim/format.test.ts
git commit -m "feat(wallet-sim): locale-aware sats/BTC and address formatting"
```

### Task 7: `simulation.ts` — send validation, fee table application, incoming builder, `canAdvance` (TDD)

**Files:**
- Create: `lib/wallet-sim/simulation.ts`
- Test: `lib/wallet-sim/simulation.test.ts`

**Interfaces:**
- Consumes: `types.ts` (FEE_TABLE, DUST_SATS, constants, `SimulatorState`, `SendDraft`, etc.), `crypto.ts` (`isValidAddress`).
- Produces:
  ```ts
  export function validateSend(draft: SendDraft, balanceSats: number): SendErrors;
  export function feeFor(level: FeeLevel): { feeSats: number; requiredConfirmations: number; etaKey: string };
  export function buildIncomingTx(now: number): SimTx;            // pending "in" tx, default sats, 3 conf
  export function buildOutgoingTx(draft: SendDraft, now: number): SimTx; // pending "out" tx from a VALID draft
  export function canAdvance(state: SimulatorState): boolean;     // entry guard for the NEXT phase (§13.1)
  export function buildRecap(state: SimulatorState): RecapSummary;
  ```

- [ ] **Step 1: Write the failing test**

`lib/wallet-sim/simulation.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test lib/wallet-sim/simulation.test.ts`
Expected: FAIL — cannot resolve `./simulation`.

- [ ] **Step 3: Write the implementation**

`lib/wallet-sim/simulation.ts`:
```ts
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
  const receivedSats = confirmed.filter((t) => t.direction === "in").reduce((s, t) => s + t.amountSats, 0);
  const sentSats = confirmed.filter((t) => t.direction === "out").reduce((s, t) => s + t.amountSats + t.feeSats, 0);
  return {
    finalBalanceSats: state.wallet?.balanceSats ?? 0,
    receivedSats,
    sentSats,
    txCount: state.transactions.length,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test lib/wallet-sim/simulation.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add lib/wallet-sim/simulation.ts lib/wallet-sim/simulation.test.ts
git commit -m "feat(wallet-sim): pure fake-network rules (validation, fees, guards)"
```

### Task 8: `reducer.ts` — pure state machine (TDD)

**Files:**
- Create: `lib/wallet-sim/reducer.ts`
- Test: `lib/wallet-sim/reducer.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `simulation.ts` (`validateSend`, `buildIncomingTx`, `buildOutgoingTx`, `canAdvance`), `crypto.ts` (`DerivedAccount` type for the success payload).
- Produces:
  ```ts
  export type Action =
    | { type: "GENERATE_BEGIN" }
    | { type: "GENERATE_SUCCESS"; mnemonic: string; account: { address: string; privateKeyWif: string }; challenge: BackupChallengeSpec }
    | { type: "GENERATE_ERROR"; message: string }
    | { type: "NEXT_PHASE" }
    | { type: "TOGGLE_REVEAL" }
    | { type: "ACK_WRITTEN"; value: boolean }
    | { type: "SUBMIT_BACKUP"; answers: Record<number, string> }
    | { type: "SIMULATE_INCOMING"; now: number }
    | { type: "TICK_CONFIRMATION"; now: number; instant?: boolean }
    | { type: "UPDATE_SEND_DRAFT"; patch: Partial<SendDraft> }
    | { type: "SUBMIT_SEND"; now: number }
    | { type: "RESET" };
  export function initialState(): SimulatorState;
  export function walletReducer(state: SimulatorState, action: Action): SimulatorState;
  export function buildBackupChallenge(): BackupChallengeSpec; // 3 distinct word positions in 0..11
  ```
- Note: `COMPLETE_LESSON` from spec §13 is a *hook side effect*, not a reducer action — it lives in `use-wallet-simulator.ts` (Task 9), not here.

- [ ] **Step 1: Write the failing test**

`lib/wallet-sim/reducer.test.ts`:
```ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test lib/wallet-sim/reducer.test.ts`
Expected: FAIL — cannot resolve `./reducer`.

- [ ] **Step 3: Write the implementation**

`lib/wallet-sim/reducer.ts`:
```ts
import {
  PHASE_ORDER,
  type BackupChallengeSpec,
  type Phase,
  type SendDraft,
  type SimulatorState,
  type SimTx,
} from "./types";
import {
  validateSend,
  buildIncomingTx,
  buildOutgoingTx,
  canAdvance,
} from "./simulation";

export type Action =
  | { type: "GENERATE_BEGIN" }
  | {
      type: "GENERATE_SUCCESS";
      mnemonic: string;
      account: { address: string; privateKeyWif: string };
      challenge: BackupChallengeSpec;
    }
  | { type: "GENERATE_ERROR"; message: string }
  | { type: "NEXT_PHASE" }
  | { type: "TOGGLE_REVEAL" }
  | { type: "ACK_WRITTEN"; value: boolean }
  | { type: "SUBMIT_BACKUP"; answers: Record<number, string> }
  | { type: "SIMULATE_INCOMING"; now: number }
  | { type: "TICK_CONFIRMATION"; now: number; instant?: boolean }
  | { type: "UPDATE_SEND_DRAFT"; patch: Partial<SendDraft> }
  | { type: "SUBMIT_SEND"; now: number }
  | { type: "RESET" };

export function initialState(): SimulatorState {
  return {
    phase: "create",
    reachedPhases: ["create"],
    wallet: null,
    backup: {
      revealed: false,
      acknowledgedWritten: false,
      challenge: null,
      result: null,
      verified: false,
    },
    transactions: [],
    send: {
      draft: { toAddress: "", amountSats: null, feeLevel: "med" },
      errors: {},
      broadcasted: false,
    },
    ui: { isGenerating: false, error: null },
  };
}

export function buildBackupChallenge(): BackupChallengeSpec {
  const positions = new Set<number>();
  while (positions.size < 3) {
    positions.add(Math.floor(Math.random() * 12));
  }
  return { positions: [...positions].sort((a, b) => a - b) };
}

function nextPhase(phase: Phase): Phase {
  const i = PHASE_ORDER.indexOf(phase);
  return i >= 0 && i < PHASE_ORDER.length - 1 ? PHASE_ORDER[i + 1] : phase;
}

// Apply one confirmation tick (or instant-confirm) to all pending txs,
// crediting/debiting the balance when a tx crosses its required confirmations.
function tick(state: SimulatorState, now: number, instant: boolean): SimulatorState {
  if (!state.wallet) return state;
  let balanceSats = state.wallet.balanceSats;

  const transactions = state.transactions.map((t): SimTx => {
    if (t.status !== "pending") return t;
    const confirmations = instant ? t.requiredConfirmations : t.confirmations + 1;
    if (confirmations >= t.requiredConfirmations) {
      if (t.direction === "in") balanceSats += t.amountSats;
      else balanceSats -= t.amountSats + t.feeSats;
      return { ...t, confirmations, status: "confirmed", confirmedAt: now };
    }
    return { ...t, confirmations };
  });

  return { ...state, transactions, wallet: { ...state.wallet, balanceSats } };
}

export function walletReducer(state: SimulatorState, action: Action): SimulatorState {
  switch (action.type) {
    case "GENERATE_BEGIN":
      if (state.phase !== "create" || state.wallet) return state;
      return { ...state, ui: { ...state.ui, isGenerating: true, error: null } };

    case "GENERATE_SUCCESS":
      if (state.phase !== "create") return state;
      return {
        ...state,
        wallet: {
          mnemonic: action.mnemonic,
          address: action.account.address,
          privateKeyWif: action.account.privateKeyWif,
          balanceSats: 0,
        },
        backup: { ...state.backup, challenge: action.challenge },
        ui: { ...state.ui, isGenerating: false, error: null },
      };

    case "GENERATE_ERROR":
      return { ...state, ui: { isGenerating: false, error: action.message } };

    case "NEXT_PHASE": {
      if (!canAdvance(state)) return state;
      const phase = nextPhase(state.phase);
      const reachedPhases = state.reachedPhases.includes(phase)
        ? state.reachedPhases
        : [...state.reachedPhases, phase];
      return { ...state, phase, reachedPhases };
    }

    case "TOGGLE_REVEAL":
      if (state.phase !== "backup") return state;
      return { ...state, backup: { ...state.backup, revealed: !state.backup.revealed } };

    case "ACK_WRITTEN":
      if (state.phase !== "backup") return state;
      return { ...state, backup: { ...state.backup, acknowledgedWritten: action.value } };

    case "SUBMIT_BACKUP": {
      if (state.phase !== "backup" || !state.backup.challenge || !state.wallet) return state;
      const words = state.wallet.mnemonic.trim().split(/\s+/);
      const wrongPositions = state.backup.challenge.positions.filter((pos) => {
        const given = (action.answers[pos] ?? "").trim().toLowerCase();
        return given !== (words[pos] ?? "").trim().toLowerCase();
      });
      const ok = wrongPositions.length === 0;
      return {
        ...state,
        backup: {
          ...state.backup,
          result: ok ? { ok: true } : { ok: false, wrongPositions },
          verified: ok,
        },
      };
    }

    case "SIMULATE_INCOMING": {
      if (state.phase !== "receive") return state;
      if (state.transactions.some((t) => t.direction === "in")) return state;
      return { ...state, transactions: [buildIncomingTx(action.now), ...state.transactions] };
    }

    case "TICK_CONFIRMATION":
      if (!state.transactions.some((t) => t.status === "pending")) return state;
      return tick(state, action.now, action.instant ?? false);

    case "UPDATE_SEND_DRAFT": {
      if (state.phase !== "send") return state;
      const draft = { ...state.send.draft, ...action.patch };
      const errors = validateSend(draft, state.wallet?.balanceSats ?? 0);
      return { ...state, send: { ...state.send, draft, errors } };
    }

    case "SUBMIT_SEND": {
      if (state.phase !== "send" || state.send.broadcasted) return state;
      const errors = validateSend(state.send.draft, state.wallet?.balanceSats ?? 0);
      if (Object.keys(errors).length > 0) return { ...state, send: { ...state.send, errors } };
      return {
        ...state,
        send: { ...state.send, broadcasted: true, errors: {} },
        transactions: [buildOutgoingTx(state.send.draft, action.now), ...state.transactions],
      };
    }

    case "RESET":
      return initialState();

    default:
      return state;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test lib/wallet-sim/reducer.test.ts`
Expected: PASS (all cases green).

- [ ] **Step 5: Run the whole pure-core suite + type check**

Run: `yarn test && npx tsc --noEmit`
Expected: all wallet-sim tests pass; no type errors.

- [ ] **Step 6: Commit**

```bash
git add lib/wallet-sim/reducer.ts lib/wallet-sim/reducer.test.ts
git commit -m "feat(wallet-sim): pure useReducer state machine with guarded transitions"
```

---

## Phase 4 — Presentational components

> All under `components/wallet-simulator/presentational/`. Each is a dumb, `"use client"` component: receives data + callbacks, renders shadcn primitives, owns no business logic. All copy via `const { t } = useLocale()`. Build them in one task (they are small and interdependent only by props). Verify by `npx tsc --noEmit` + a Storybook-less visual check deferred to Phase 9.

### Task 9: Presentational components

**Files:**
- Create: `components/wallet-simulator/presentational/phase-stepper.tsx`
- Create: `components/wallet-simulator/presentational/practice-banner.tsx`
- Create: `components/wallet-simulator/presentational/seed-phrase-grid.tsx`
- Create: `components/wallet-simulator/presentational/address-display.tsx`
- Create: `components/wallet-simulator/presentational/qr-code.tsx`
- Create: `components/wallet-simulator/presentational/balance-display.tsx`
- Create: `components/wallet-simulator/presentational/tx-status.tsx`
- Create: `components/wallet-simulator/presentational/confirmation-meter.tsx`
- Create: `components/wallet-simulator/presentational/fee-selector.tsx`
- Create: `components/wallet-simulator/presentational/reset-button.tsx`

**Interfaces:**
- Consumes: `types.ts` (`Phase`, `SimTx`, `FeeLevel`), `format.ts` (`formatSats`, `formatBtc`, `truncateAddress`), `@/components/ui/*`, `@/lib/i18n` (`useLocale`), `sonner` (`toast`), `lucide-react`, `qrcode.react` (`QRCodeSVG`).
- Produces (prop contracts the panels rely on):
  ```ts
  PhaseStepper:       { phases: Phase[]; current: Phase; reached: Phase[] }
  PracticeBanner:     {}                              // static i18n warning, role="note"
  SeedPhraseGrid:     { words: string[]; revealed: boolean }
  AddressDisplay:     { address: string }             // copy → sonner toast; shows truncated + full copyable
  QrCode:             { value: string; size?: number } // QRCodeSVG, aria-label from i18n
  BalanceDisplay:     { balanceSats: number; locale: string }
  TxStatus:           { tx: SimTx; locale: string }   // role="status" aria-live="polite"
  ConfirmationMeter:  { confirmations: number; required: number } // Progress + visually-hidden text
  FeeSelector:        { value: FeeLevel; onChange: (l: FeeLevel) => void } // RadioGroup, shows feeSats + etaKey copy
  ResetButton:        { onReset: () => void }         // AlertDialog-guarded
  ```

- [ ] **Step 1: `practice-banner.tsx` (simplest; establishes the i18n + ui import pattern)**

```tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function PracticeBanner() {
  const { t } = useLocale();
  return (
    <div
      role="note"
      className="flex items-center gap-2 rounded-md border-2 border-foreground bg-secondary p-3 text-sm font-semibold"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{t.walletSim.practiceBanner}</span>
    </div>
  );
}
```

- [ ] **Step 2: `phase-stepper.tsx`**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import type { Phase } from "@/lib/wallet-sim/types";

export function PhaseStepper({
  phases,
  current,
  reached,
}: {
  phases: Phase[];
  current: Phase;
  reached: Phase[];
}) {
  const { t } = useLocale();
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label={t.walletSim.stepperLabel}>
      {phases.map((phase, i) => {
        const isCurrent = phase === current;
        const isReached = reached.includes(phase);
        return (
          <li
            key={phase}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide",
              isCurrent
                ? "border-foreground bg-foreground text-background"
                : isReached
                  ? "border-foreground bg-secondary text-foreground"
                  : "border-muted text-muted-foreground"
            )}
          >
            <span>{i + 1}</span>
            <span>{t.walletSim.phases[phase]}</span>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 3: `seed-phrase-grid.tsx`** (2-col mobile / 3-4 sm+; hidden when `!revealed`)

```tsx
"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export function SeedPhraseGrid({ words, revealed }: { words: string[]; revealed: boolean }) {
  const { t } = useLocale();
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4" aria-label={t.walletSim.seedGridLabel}>
      {words.map((word, i) => (
        <li
          key={i}
          className="flex items-center gap-2 rounded-md border-2 border-foreground bg-card px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground">{i + 1}.</span>
          <span className={cn("font-mono font-semibold", !revealed && "select-none blur-sm")}>
            {revealed ? word : "••••••"}
          </span>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: `address-display.tsx`** (copy → sonner toast; full address available for screen readers/copy)

```tsx
"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { truncateAddress } from "@/lib/wallet-sim/format";

export function AddressDisplay({ address }: { address: string }) {
  const { t } = useLocale();
  const copy = async () => {
    await navigator.clipboard.writeText(address);
    toast.success(t.walletSim.addressCopied);
  };
  return (
    <div className="flex items-center gap-2 rounded-md border-2 border-foreground bg-card p-2">
      <code className="grow truncate font-mono text-sm" title={address}>
        {truncateAddress(address)}
      </code>
      <span className="sr-only">{address}</span>
      <Button type="button" size="sm" variant="ghost" onClick={copy} aria-label={t.walletSim.copyAddress}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: `qr-code.tsx`** (QRCodeSVG; meaningful aria-label)

```tsx
"use client";

import { QRCodeSVG } from "qrcode.react";
import { useLocale } from "@/lib/i18n";

export function QrCode({ value, size = 192 }: { value: string; size?: number }) {
  const { t } = useLocale();
  return (
    <div
      role="img"
      aria-label={t.walletSim.qrAriaLabel}
      className="w-fit rounded-md border-2 border-foreground bg-white p-3"
    >
      <QRCodeSVG value={value} size={size} />
    </div>
  );
}
```

- [ ] **Step 6: `balance-display.tsx`**

```tsx
"use client";

import { useLocale } from "@/lib/i18n";
import { formatSats, formatBtc } from "@/lib/wallet-sim/format";

export function BalanceDisplay({ balanceSats, locale }: { balanceSats: number; locale: string }) {
  const { t } = useLocale();
  return (
    <div className="rounded-md border-2 border-foreground bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {t.walletSim.balanceLabel}
      </p>
      <p className="text-2xl font-bold">{formatSats(balanceSats, locale)}</p>
      <p className="text-sm text-muted-foreground">{formatBtc(balanceSats, locale)} BTC</p>
    </div>
  );
}
```

- [ ] **Step 7: `confirmation-meter.tsx`** (Progress + visually-hidden "Confirmaciones: 2 de 3")

```tsx
"use client";

import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n";

export function ConfirmationMeter({ confirmations, required }: { confirmations: number; required: number }) {
  const { t } = useLocale();
  const pct = required > 0 ? Math.min(100, (confirmations / required) * 100) : 0;
  return (
    <div>
      <Progress
        value={pct}
        aria-valuenow={confirmations}
        aria-valuemin={0}
        aria-valuemax={required}
        className="h-2"
      />
      <span className="sr-only">{t.walletSim.confirmationsCount(confirmations, required)}</span>
      <span aria-hidden className="text-xs text-muted-foreground">
        {t.walletSim.confirmationsCount(confirmations, required)}
      </span>
    </div>
  );
}
```

- [ ] **Step 8: `tx-status.tsx`** (role="status" aria-live="polite"; embeds ConfirmationMeter)

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n";
import { formatSats, truncateAddress } from "@/lib/wallet-sim/format";
import type { SimTx } from "@/lib/wallet-sim/types";
import { ConfirmationMeter } from "./confirmation-meter";

export function TxStatus({ tx, locale }: { tx: SimTx; locale: string }) {
  const { t } = useLocale();
  return (
    <div role="status" aria-live="polite" className="space-y-2 rounded-md border-2 border-foreground bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {tx.direction === "in" ? t.walletSim.txIncoming : t.walletSim.txOutgoing}
        </span>
        <Badge variant={tx.status === "confirmed" ? "default" : "secondary"}>
          {tx.status === "confirmed" ? t.walletSim.txConfirmed : t.walletSim.txPending}
        </Badge>
      </div>
      <p className="text-sm">{formatSats(tx.amountSats, locale)}</p>
      <p className="text-xs text-muted-foreground">
        {t.walletSim.txCounterparty}: {truncateAddress(tx.counterpartyAddress)}
      </p>
      {tx.status === "pending" && (
        <ConfirmationMeter confirmations={tx.confirmations} required={tx.requiredConfirmations} />
      )}
    </div>
  );
}
```

- [ ] **Step 9: `fee-selector.tsx`** (RadioGroup over FEE_TABLE; shows feeSats + etaKey copy)

```tsx
"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { FEE_TABLE, type FeeLevel } from "@/lib/wallet-sim/types";
import { formatSats } from "@/lib/wallet-sim/format";

const LEVELS: FeeLevel[] = ["low", "med", "high"];

export function FeeSelector({
  value,
  onChange,
  locale,
}: {
  value: FeeLevel;
  onChange: (l: FeeLevel) => void;
  locale: string;
}) {
  const { t } = useLocale();
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as FeeLevel)} className="grid grid-cols-3 gap-2">
      {LEVELS.map((level) => (
        <div key={level} className="flex flex-col gap-1 rounded-md border-2 border-foreground p-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value={level} id={`fee-${level}`} />
            <Label htmlFor={`fee-${level}`} className="font-bold">
              {t.walletSim.feeLevels[level]}
            </Label>
          </div>
          <span className="text-xs text-muted-foreground">{formatSats(FEE_TABLE[level].feeSats, locale)}</span>
          <span className="text-xs text-muted-foreground">{t.walletSim.feeEta[level]}</span>
        </div>
      ))}
    </RadioGroup>
  );
}
```

- [ ] **Step 10: `reset-button.tsx`** (AlertDialog-guarded)

```tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function ResetButton({ onReset }: { onReset: () => void }) {
  const { t } = useLocale();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <RotateCcw className="mr-2 h-4 w-4" />
          {t.walletSim.reset}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.walletSim.resetConfirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.walletSim.resetConfirmBody}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onReset}>{t.walletSim.reset}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 11: Type-check (blocked on i18n keys; expected to fail until Phase 7)**

Run: `npx tsc --noEmit`
Expected: FAILS only on missing `t.walletSim.*` keys (added in Task 12). No other errors. If errors are unrelated to `walletSim`, fix them now. (Components are committed regardless; i18n closes the loop in Phase 7.)

- [ ] **Step 12: Commit**

```bash
git add components/wallet-simulator/presentational
git commit -m "feat(wallet-sim): presentational components (stepper, seed grid, address, QR, fees, tx status)"
```

---

## Phase 5 — Panels

### Task 10: Phase panels

**Files:**
- Create: `components/wallet-simulator/panels/create-panel.tsx`
- Create: `components/wallet-simulator/panels/backup-panel.tsx`
- Create: `components/wallet-simulator/panels/receive-panel.tsx`
- Create: `components/wallet-simulator/panels/send-panel.tsx`
- Create: `components/wallet-simulator/panels/recap-panel.tsx`

**Interfaces:**
- Consumes: presentational components (Task 9), `types.ts`, `format.ts`, `@/components/ui/*`, `@/lib/i18n`, the `actions` object + `state` produced by `useWalletSimulator` (Task 11). To avoid a circular dependency, panels accept `state` and `actions` as props (the hook's return type is defined in Task 11; panels import the `WalletSimActions` type from `use-wallet-simulator.ts`).
- Produces: five panel components, each `({ state, actions, locale }) => JSX`.

> NOTE on ordering: panels reference the `WalletSimActions` type and `SimulatorState`. Define `WalletSimActions` in Task 11 first if your executor prefers strict type availability; or stub the import and let Task 11 finalize it. The action method names below are the contract both tasks must match:
> `generate()`, `next()`, `toggleReveal()`, `ackWritten(v)`, `submitBackup(answers)`, `simulateIncoming()`, `updateDraft(patch)`, `submitSend()`, `complete()`, `reset()`.

- [ ] **Step 1: `create-panel.tsx`** (generate button → CreatePanel shows SeedPhraseGrid + AddressDisplay once wallet exists; PracticeBanner reinforced)

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import type { SimulatorState } from "@/lib/wallet-sim/types";
import type { WalletSimActions } from "../use-wallet-simulator";
import { SeedPhraseGrid } from "../presentational/seed-phrase-grid";
import { AddressDisplay } from "../presentational/address-display";

export function CreatePanel({ state, actions }: { state: SimulatorState; actions: WalletSimActions; locale: string }) {
  const { t } = useLocale();
  const words = state.wallet?.mnemonic.split(" ") ?? [];
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t.walletSim.create.title}</h3>
      <p className="text-sm text-muted-foreground">{t.walletSim.create.intro}</p>
      {!state.wallet ? (
        <Button onClick={actions.generate} disabled={state.ui.isGenerating}>
          {state.ui.isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t.walletSim.create.generate}
        </Button>
      ) : (
        <div className="space-y-4">
          <SeedPhraseGrid words={words} revealed />
          <AddressDisplay address={state.wallet.address} />
          <Button onClick={actions.next}>{t.walletSim.create.continue}</Button>
        </div>
      )}
      {state.ui.error && <p className="text-sm text-destructive">{state.ui.error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: `backup-panel.tsx`** (reveal/hide toggle + ack checkbox + BackupChallenge inputs → submit → gated continue)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { canAdvance } from "@/lib/wallet-sim/simulation";
import type { SimulatorState } from "@/lib/wallet-sim/types";
import type { WalletSimActions } from "../use-wallet-simulator";
import { SeedPhraseGrid } from "../presentational/seed-phrase-grid";

export function BackupPanel({ state, actions }: { state: SimulatorState; actions: WalletSimActions; locale: string }) {
  const { t } = useLocale();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const words = state.wallet?.mnemonic.split(" ") ?? [];
  const positions = state.backup.challenge?.positions ?? [];
  const wrong = state.backup.result && !state.backup.result.ok ? state.backup.result.wrongPositions : [];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t.walletSim.backup.title}</h3>
      <p className="text-sm text-muted-foreground">{t.walletSim.backup.intro}</p>

      <Button type="button" variant="outline" size="sm" onClick={actions.toggleReveal}>
        {state.backup.revealed ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
        {state.backup.revealed ? t.walletSim.backup.hide : t.walletSim.backup.reveal}
      </Button>
      <SeedPhraseGrid words={words} revealed={state.backup.revealed} />

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={state.backup.acknowledgedWritten}
          onCheckedChange={(v) => actions.ackWritten(Boolean(v))}
        />
        {t.walletSim.backup.acknowledge}
      </label>

      {state.backup.acknowledgedWritten && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">{t.walletSim.backup.challengePrompt}</p>
          {positions.map((pos) => (
            <div key={pos} className="space-y-1">
              <Label htmlFor={`word-${pos}`}>{t.walletSim.backup.wordNumber(pos + 1)}</Label>
              <Input
                id={`word-${pos}`}
                value={answers[pos] ?? ""}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={wrong.includes(pos)}
                onChange={(e) => setAnswers((a) => ({ ...a, [pos]: e.target.value }))}
              />
            </div>
          ))}
          <Button onClick={() => actions.submitBackup(answers)}>{t.walletSim.backup.verify}</Button>
          {state.backup.result && !state.backup.result.ok && (
            <p className="text-sm text-destructive">{t.walletSim.backup.incorrect}</p>
          )}
        </div>
      )}

      {state.backup.verified && (
        <Button onClick={actions.next} disabled={!canAdvance(state)}>
          {t.walletSim.backup.continue}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `receive-panel.tsx`** (AddressDisplay + QrCode + "simulate incoming" button + BalanceDisplay + TxStatus; gated continue)

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { canAdvance } from "@/lib/wallet-sim/simulation";
import type { SimulatorState } from "@/lib/wallet-sim/types";
import type { WalletSimActions } from "../use-wallet-simulator";
import { AddressDisplay } from "../presentational/address-display";
import { QrCode } from "../presentational/qr-code";
import { BalanceDisplay } from "../presentational/balance-display";
import { TxStatus } from "../presentational/tx-status";

export function ReceivePanel({ state, actions, locale }: { state: SimulatorState; actions: WalletSimActions; locale: string }) {
  const { t } = useLocale();
  const incoming = state.transactions.find((tx) => tx.direction === "in");
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t.walletSim.receive.title}</h3>
      <p className="text-sm text-muted-foreground">{t.walletSim.receive.intro}</p>
      {state.wallet && (
        <>
          <QrCode value={state.wallet.address} />
          <AddressDisplay address={state.wallet.address} />
          <BalanceDisplay balanceSats={state.wallet.balanceSats} locale={locale} />
        </>
      )}
      {!incoming && <Button onClick={actions.simulateIncoming}>{t.walletSim.receive.simulate}</Button>}
      {incoming && <TxStatus tx={incoming} locale={locale} />}
      <Button onClick={actions.next} disabled={!canAdvance(state)}>
        {t.walletSim.receive.continue}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: `send-panel.tsx`** (AddressInput + AmountInput + FeeSelector + BalanceDisplay + TxStatus; validation-driven submit; gated continue)

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { canAdvance } from "@/lib/wallet-sim/simulation";
import type { SimulatorState } from "@/lib/wallet-sim/types";
import type { WalletSimActions } from "../use-wallet-simulator";
import { FeeSelector } from "../presentational/fee-selector";
import { BalanceDisplay } from "../presentational/balance-display";
import { TxStatus } from "../presentational/tx-status";

export function SendPanel({ state, actions, locale }: { state: SimulatorState; actions: WalletSimActions; locale: string }) {
  const { t } = useLocale();
  const outgoing = state.transactions.find((tx) => tx.direction === "out");
  const { draft, errors, broadcasted } = state.send;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t.walletSim.send.title}</h3>
      <p className="text-sm text-muted-foreground">{t.walletSim.send.intro}</p>
      {state.wallet && <BalanceDisplay balanceSats={state.wallet.balanceSats} locale={locale} />}

      {!broadcasted && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="to-address">{t.walletSim.send.toAddress}</Label>
            <Input
              id="to-address"
              value={draft.toAddress}
              placeholder="tb1q..."
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => actions.updateDraft({ toAddress: e.target.value })}
            />
            {errors.toAddress && <p className="text-sm text-destructive">{t.walletSim.send.errors[errors.toAddress]}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="amount">{t.walletSim.send.amount}</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={draft.amountSats ?? ""}
              onChange={(e) => {
                const n = e.target.value.trim() === "" ? null : Number(e.target.value);
                actions.updateDraft({ amountSats: Number.isNaN(n as number) ? null : n });
              }}
            />
            {errors.amount && <p className="text-sm text-destructive">{t.walletSim.send.errors[errors.amount]}</p>}
          </div>
          <FeeSelector value={draft.feeLevel} onChange={(l) => actions.updateDraft({ feeLevel: l })} locale={locale} />
          <Button onClick={actions.submitSend} disabled={hasErrors}>
            {t.walletSim.send.broadcast}
          </Button>
        </div>
      )}

      {outgoing && <TxStatus tx={outgoing} locale={locale} />}
      <Button onClick={actions.next} disabled={!canAdvance(state)}>
        {t.walletSim.send.continue}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: `recap-panel.tsx`** (summary via `buildRecap` + optional "marcar lección completada")

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { buildRecap } from "@/lib/wallet-sim/simulation";
import { formatSats } from "@/lib/wallet-sim/format";
import type { SimulatorState } from "@/lib/wallet-sim/types";
import type { WalletSimActions } from "../use-wallet-simulator";
import { PracticeBanner } from "../presentational/practice-banner";

export function RecapPanel({
  state,
  actions,
  locale,
  canComplete,
}: {
  state: SimulatorState;
  actions: WalletSimActions;
  locale: string;
  canComplete: boolean;
}) {
  const { t } = useLocale();
  const recap = buildRecap(state);
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t.walletSim.recap.title}</h3>
      <PracticeBanner />
      <ul className="space-y-1 text-sm">
        <li>{t.walletSim.recap.received}: {formatSats(recap.receivedSats, locale)}</li>
        <li>{t.walletSim.recap.sent}: {formatSats(recap.sentSats, locale)}</li>
        <li>{t.walletSim.recap.finalBalance}: {formatSats(recap.finalBalanceSats, locale)}</li>
        <li>{t.walletSim.recap.txCount}: {recap.txCount}</li>
      </ul>
      {canComplete && <Button onClick={actions.complete}>{t.walletSim.recap.markComplete}</Button>}
    </div>
  );
}
```

- [ ] **Step 6: Commit (type-check still blocked on i18n keys + Task 11's hook type — finalized in Phase 6/7)**

```bash
git add components/wallet-simulator/panels
git commit -m "feat(wallet-sim): phase panels (create, backup, receive, send, recap)"
```

---

## Phase 6 — Hook + widget index

### Task 11: `useWalletSimulator` hook

**Files:**
- Create: `components/wallet-simulator/use-wallet-simulator.ts`

**Interfaces:**
- Consumes: `reducer.ts` (`initialState`, `walletReducer`, `buildBackupChallenge`, `Action`), `crypto.ts` (`generateMnemonic`, `mnemonicToAccount`), `types.ts`.
- Produces:
  ```ts
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
  export function useWalletSimulator(opts?: { onLessonComplete?: () => void }): {
    state: SimulatorState;
    actions: WalletSimActions;
  };
  ```
- Owns the side effects: async crypto on `generate`, the confirmation `setInterval` (only while a tx is pending; instant on `prefers-reduced-motion`), and calling `onLessonComplete` on `complete()`.

- [ ] **Step 1: Write the hook**

```ts
"use client";

import { useCallback, useEffect, useReducer } from "react";
import { generateMnemonic, mnemonicToAccount } from "@/lib/wallet-sim/crypto";
import { initialState, walletReducer, buildBackupChallenge } from "@/lib/wallet-sim/reducer";
import type { SendDraft, SimulatorState } from "@/lib/wallet-sim/types";

const TICK_MS = 1200;

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

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useWalletSimulator(opts?: { onLessonComplete?: () => void }): {
  state: SimulatorState;
  actions: WalletSimActions;
} {
  const [state, dispatch] = useReducer(walletReducer, undefined, initialState);

  const generate = useCallback(async () => {
    dispatch({ type: "GENERATE_BEGIN" });
    try {
      const mnemonic = generateMnemonic();
      const account = await mnemonicToAccount(mnemonic);
      dispatch({
        type: "GENERATE_SUCCESS",
        mnemonic,
        account,
        challenge: buildBackupChallenge(),
      });
    } catch (e) {
      dispatch({ type: "GENERATE_ERROR", message: e instanceof Error ? e.message : "error" });
    }
  }, []);

  const actions: WalletSimActions = {
    generate,
    next: useCallback(() => dispatch({ type: "NEXT_PHASE" }), []),
    toggleReveal: useCallback(() => dispatch({ type: "TOGGLE_REVEAL" }), []),
    ackWritten: useCallback((value: boolean) => dispatch({ type: "ACK_WRITTEN", value }), []),
    submitBackup: useCallback((answers: Record<number, string>) => dispatch({ type: "SUBMIT_BACKUP", answers }), []),
    simulateIncoming: useCallback(() => dispatch({ type: "SIMULATE_INCOMING", now: Date.now() }), []),
    updateDraft: useCallback((patch: Partial<SendDraft>) => dispatch({ type: "UPDATE_SEND_DRAFT", patch }), []),
    submitSend: useCallback(() => dispatch({ type: "SUBMIT_SEND", now: Date.now() }), []),
    complete: useCallback(() => opts?.onLessonComplete?.(), [opts]),
    reset: useCallback(() => dispatch({ type: "RESET" }), []),
  };

  // Confirmation driver: interval lives only while a tx is pending.
  const hasPending = state.transactions.some((t) => t.status === "pending");
  useEffect(() => {
    if (!hasPending) return;
    if (prefersReducedMotion()) {
      dispatch({ type: "TICK_CONFIRMATION", now: Date.now(), instant: true });
      return;
    }
    const id = setInterval(() => dispatch({ type: "TICK_CONFIRMATION", now: Date.now() }), TICK_MS);
    return () => clearInterval(id);
  }, [hasPending]);

  return { state, actions };
}
```

- [ ] **Step 2: Type-check (still expects `walletSim` i18n keys to be missing)**

Run: `npx tsc --noEmit`
Expected: remaining errors are ONLY missing `t.walletSim.*` keys. The hook ↔ panels ↔ presentational wiring must produce no signature mismatches.

- [ ] **Step 3: Commit**

```bash
git add components/wallet-simulator/use-wallet-simulator.ts
git commit -m "feat(wallet-sim): useWalletSimulator hook (async crypto, tick driver, completion)"
```

### Task 12: `index.tsx` — the `WalletSimulator` widget

**Files:**
- Create: `components/wallet-simulator/index.tsx`

**Interfaces:**
- Consumes: `use-wallet-simulator.ts`, all panels, `phase-stepper.tsx`, `practice-banner.tsx`, `reset-button.tsx`, `@/components/ui/card`, `@/lib/i18n` (also `locale` from `useLocale()`).
- Produces: `export default function WalletSimulator({ onLessonComplete }: { onLessonComplete?: () => void })` — the reusable widget. Default export so `dynamic(() => import("@/components/wallet-simulator"))` resolves it.

- [ ] **Step 1: Write the widget**

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";
import { PHASE_ORDER } from "@/lib/wallet-sim/types";
import { useWalletSimulator } from "./use-wallet-simulator";
import { PhaseStepper } from "./presentational/phase-stepper";
import { PracticeBanner } from "./presentational/practice-banner";
import { ResetButton } from "./presentational/reset-button";
import { CreatePanel } from "./panels/create-panel";
import { BackupPanel } from "./panels/backup-panel";
import { ReceivePanel } from "./panels/receive-panel";
import { SendPanel } from "./panels/send-panel";
import { RecapPanel } from "./panels/recap-panel";

export default function WalletSimulator({ onLessonComplete }: { onLessonComplete?: () => void }) {
  const { t, locale } = useLocale();
  const { state, actions } = useWalletSimulator({ onLessonComplete });

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">{t.walletSim.title}</h2>
        <ResetButton onReset={actions.reset} />
      </div>
      <PracticeBanner />
      <PhaseStepper phases={PHASE_ORDER} current={state.phase} reached={state.reachedPhases} />

      {state.phase === "create" && <CreatePanel state={state} actions={actions} locale={locale} />}
      {state.phase === "backup" && <BackupPanel state={state} actions={actions} locale={locale} />}
      {state.phase === "receive" && <ReceivePanel state={state} actions={actions} locale={locale} />}
      {state.phase === "send" && <SendPanel state={state} actions={actions} locale={locale} />}
      {state.phase === "done" && (
        <RecapPanel state={state} actions={actions} locale={locale} canComplete={Boolean(onLessonComplete)} />
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/wallet-simulator/index.tsx
git commit -m "feat(wallet-sim): WalletSimulator widget (default export, lazy-mountable)"
```

---

## Phase 7 — i18n `walletSim` namespace

> `lib/i18n/messages.ts`: `es` block closes at L859 (`};`), `Messages = typeof es` at L860, `en` block closes at L1709 (`};`). Add the `walletSim` namespace as the LAST key inside BOTH `es` and `en` (right before each block's closing `};` — i.e. after the `errors: { ... }` namespace). `es` first (source of truth), then mirror EVERY key into `en`. Some keys are functions (e.g. `confirmationsCount(current, required)`, `wordNumber(n)`) — match the existing pattern used elsewhere in this file (e.g. `completeAllFields(completionText)`).

### Task 13: Add `walletSim` to `es` then `en`

**Files:**
- Modify: `lib/i18n/messages.ts`

**Interfaces:**
- Produces every `t.walletSim.*` key referenced in Phases 4-6. Exact key set:
  `title`, `practiceBanner`, `stepperLabel`, `seedGridLabel`, `addressCopied`, `copyAddress`, `qrAriaLabel`, `balanceLabel`, `reset`, `resetConfirmTitle`, `resetConfirmBody`, `confirmationsCount(current, required)`, `phases.{create,backup,receive,send,done}`, `txIncoming`, `txOutgoing`, `txConfirmed`, `txPending`, `txCounterparty`, `feeLevels.{low,med,high}`, `feeEta.{low,med,high}`, `create.{title,intro,generate,continue}`, `backup.{title,intro,reveal,hide,acknowledge,challengePrompt,wordNumber(n),verify,incorrect,continue}`, `receive.{title,intro,simulate,continue}`, `send.{title,intro,toAddress,amount,broadcast,continue}`, `send.errors.{required,invalidFormat,notPositive,insufficientFunds,dust}`, `recap.{title,received,sent,finalBalance,txCount,markComplete}`.

- [ ] **Step 1: Insert the `es` namespace before the `es` block's closing brace (after the `errors` namespace, ~L857)**

```ts
    walletSim: {
      title: "Simulador de billetera Bitcoin",
      practiceBanner: "Esto es práctica, no es dinero real. La red está simulada y usamos testnet.",
      stepperLabel: "Pasos del simulador",
      seedGridLabel: "Tu frase semilla de 12 palabras",
      addressCopied: "Dirección copiada",
      copyAddress: "Copiar dirección",
      qrAriaLabel: "Código QR de tu dirección para recibir",
      balanceLabel: "Saldo",
      reset: "Reiniciar",
      resetConfirmTitle: "¿Reiniciar el simulador?",
      resetConfirmBody: "Se borrará tu progreso y se generará una billetera nueva.",
      confirmationsCount: (current: number, required: number) =>
        `Confirmaciones: ${current} de ${required}`,
      phases: {
        create: "Crear",
        backup: "Respaldar",
        receive: "Recibir",
        send: "Enviar",
        done: "Resumen",
      },
      txIncoming: "Transacción entrante",
      txOutgoing: "Transacción saliente",
      txConfirmed: "Confirmada",
      txPending: "Pendiente",
      txCounterparty: "Contraparte",
      feeLevels: { low: "Baja", med: "Media", high: "Alta" },
      feeEta: {
        low: "Más barata, más lenta",
        med: "Equilibrada",
        high: "Más cara, más rápida",
      },
      create: {
        title: "Crea tu billetera",
        intro: "Genera una frase semilla real. Es la llave de tu dinero: quien la tenga, controla los fondos.",
        generate: "Generar billetera",
        continue: "Continuar al respaldo",
      },
      backup: {
        title: "Respalda tu frase semilla",
        intro: "No podrás recibir fondos hasta demostrar que respaldaste tu frase. No tus llaves, no tus monedas.",
        reveal: "Mostrar frase",
        hide: "Ocultar frase",
        acknowledge: "Ya anoté mi frase en un lugar seguro",
        challengePrompt: "Escribe las palabras que te pedimos para confirmar tu respaldo:",
        wordNumber: (n: number) => `Palabra #${n}`,
        verify: "Verificar respaldo",
        incorrect: "Alguna palabra no coincide. Revisa tu anotación.",
        continue: "Continuar a recibir",
      },
      receive: {
        title: "Recibe bitcoin",
        intro: "Comparte tu dirección o el código QR. Simula una transacción entrante para ver cómo llega el dinero.",
        simulate: "Simular transacción entrante",
        continue: "Continuar a enviar",
      },
      send: {
        title: "Envía bitcoin",
        intro: "Ingresa una dirección testnet, un monto y elige la comisión. A mayor comisión, más rápida la confirmación.",
        toAddress: "Dirección de destino",
        amount: "Monto (sats)",
        broadcast: "Enviar transacción",
        continue: "Ver resumen",
        errors: {
          required: "Este campo es obligatorio",
          invalidFormat: "La dirección no es válida (debe ser testnet, tb1...)",
          notPositive: "El monto debe ser mayor a cero",
          insufficientFunds: "Saldo insuficiente para el monto más la comisión",
          dust: "El monto es demasiado pequeño (mínimo 546 sats)",
        },
      },
      recap: {
        title: "Resumen de tu práctica",
        received: "Recibido",
        sent: "Enviado",
        finalBalance: "Saldo final",
        txCount: "Transacciones",
        markComplete: "Marcar lección completada",
      },
    },
```

- [ ] **Step 2: Type-check to surface any `es`-side typos against usage**

Run: `npx tsc --noEmit`
Expected: `es` compiles; the only remaining error is that `en` does not yet have `walletSim` (because `en: Messages` requires it). This confirms the mirror is enforced.

- [ ] **Step 3: Insert the `en` mirror before the `en` block's closing brace (~L1707, after `errors`)**

```ts
    walletSim: {
      title: "Bitcoin Wallet Simulator",
      practiceBanner: "This is practice, not real money. The network is simulated and we use testnet.",
      stepperLabel: "Simulator steps",
      seedGridLabel: "Your 12-word seed phrase",
      addressCopied: "Address copied",
      copyAddress: "Copy address",
      qrAriaLabel: "QR code of your receiving address",
      balanceLabel: "Balance",
      reset: "Reset",
      resetConfirmTitle: "Reset the simulator?",
      resetConfirmBody: "Your progress will be cleared and a new wallet generated.",
      confirmationsCount: (current: number, required: number) =>
        `Confirmations: ${current} of ${required}`,
      phases: {
        create: "Create",
        backup: "Back up",
        receive: "Receive",
        send: "Send",
        done: "Recap",
      },
      txIncoming: "Incoming transaction",
      txOutgoing: "Outgoing transaction",
      txConfirmed: "Confirmed",
      txPending: "Pending",
      txCounterparty: "Counterparty",
      feeLevels: { low: "Low", med: "Medium", high: "High" },
      feeEta: {
        low: "Cheaper, slower",
        med: "Balanced",
        high: "Pricier, faster",
      },
      create: {
        title: "Create your wallet",
        intro: "Generate a real seed phrase. It is the key to your money: whoever holds it controls the funds.",
        generate: "Generate wallet",
        continue: "Continue to backup",
      },
      backup: {
        title: "Back up your seed phrase",
        intro: "You can't receive funds until you prove you backed up your phrase. Not your keys, not your coins.",
        reveal: "Show phrase",
        hide: "Hide phrase",
        acknowledge: "I wrote down my phrase in a safe place",
        challengePrompt: "Type the words we ask for to confirm your backup:",
        wordNumber: (n: number) => `Word #${n}`,
        verify: "Verify backup",
        incorrect: "A word doesn't match. Check your notes.",
        continue: "Continue to receive",
      },
      receive: {
        title: "Receive bitcoin",
        intro: "Share your address or QR code. Simulate an incoming transaction to see how money arrives.",
        simulate: "Simulate incoming transaction",
        continue: "Continue to send",
      },
      send: {
        title: "Send bitcoin",
        intro: "Enter a testnet address, an amount, and pick a fee. Higher fee means faster confirmation.",
        toAddress: "Destination address",
        amount: "Amount (sats)",
        broadcast: "Send transaction",
        continue: "View recap",
        errors: {
          required: "This field is required",
          invalidFormat: "Invalid address (must be testnet, tb1...)",
          notPositive: "Amount must be greater than zero",
          insufficientFunds: "Insufficient balance for amount plus fee",
          dust: "Amount is too small (minimum 546 sats)",
        },
      },
      recap: {
        title: "Your practice recap",
        received: "Received",
        sent: "Sent",
        finalBalance: "Final balance",
        txCount: "Transactions",
        markComplete: "Mark lesson complete",
      },
    },
```

- [ ] **Step 4: Type-check the whole widget now that i18n is complete**

Run: `npx tsc --noEmit`
Expected: PASS (no `walletSim` key errors; all panels/presentational/hook/index resolve).

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/messages.ts
git commit -m "feat(i18n): add walletSim namespace (es source + en mirror)"
```

---

## Phase 8 — Admin toggle (form + PATCH)

> Pattern source: `chapter-intro-form.tsx` (the `isIntro` toggle under "Access settings") and the PATCH route. The PATCH route at `app/api/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/route.ts` destructures `isIntro` then spreads `...values` into `prisma.chapter.update`. We add `hasWalletSimulator` to the zod schema and to the update payload. The spec asks for a `Switch`; the repo's existing toggle uses `Checkbox` — we use `Switch` per spec (it exists at `components/ui/switch.tsx`), keeping the same form/PATCH/toast/refresh flow.

### Task 14: Extend the PATCH route to accept `hasWalletSimulator`

**Files:**
- Modify: `app/api/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/route.ts`

**Interfaces:**
- Consumes: `Chapter.hasWalletSimulator` (Task 3).
- Produces: PATCH accepts `{ hasWalletSimulator?: boolean }` and persists it.

- [ ] **Step 1: Add the field to the zod schema**

In `updateChapterSchema` (currently L8-20), add after `isIntro: z.boolean().optional(),`:
```ts
    isIntro: z.boolean().optional(),
    hasWalletSimulator: z.boolean().optional(),
```

- [ ] **Step 2: Include it in the update payload**

The PATCH currently does `const { isIntro, ...values } = updateChapterSchema.parse(await req.json())` (L117) and `data: { isIntro, ...values, ... }` (L198-203). Change the destructure and the `data` to thread the new flag:

```ts
        const { isIntro, hasWalletSimulator, ...values } = updateChapterSchema.parse(await req.json())
```
and in the `prisma.chapter.update` `data` object:
```ts
            data: {
                isIntro,
                hasWalletSimulator,
                ...values,
                startTime: values.startTime ? new Date(values.startTime) : values.startTime,
                endTime: values.endTime ? new Date(values.endTime) : values.endTime,
            }
```

> NOTE: because the form sends ONLY `{ hasWalletSimulator }`, `isIntro` will be `undefined` on that request. Prisma's `update` treats an explicit `undefined` field as "no change", so this is safe and matches how the existing `isIntro` form already behaves (it sends only `{ isIntro }`, leaving everything else undefined).

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "app/api/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/route.ts"
git commit -m "feat(admin): accept hasWalletSimulator in chapter PATCH"
```

### Task 15: Admin `ChapterWalletSimulatorForm` (Switch) + mount it

**Files:**
- Create: `app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/_components/chapter-wallet-simulator-form.tsx`
- Modify: `app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/page.tsx`
- Modify: `lib/i18n/messages.ts` (add admin sub-keys used by the form)

**Interfaces:**
- Consumes: PATCH route (Task 14), `Chapter.hasWalletSimulator`, `@/components/ui/switch`, `@/components/ui/form`, `react-hook-form`, `axios`, `sonner`, `@/lib/i18n`.
- Produces: a self-contained edit card mirroring `ChapterIntroForm`.

- [ ] **Step 1: Add the admin i18n keys (es then en) for this form**

Inside the existing `admin` namespace in `es` (and mirror in `en`), add:
```ts
      walletSimulator: "Simulador de billetera",            // es
      editWalletSimulator: "Editar simulador",
      walletSimulatorHelp: "Muestra un simulador interactivo de billetera Bitcoin al final de la lección.",
      walletSimulatorOn: "El simulador está activado para esta lección.",
      walletSimulatorOff: "El simulador está desactivado.",
      walletSimulatorUpdated: "Simulador actualizado",
      walletSimulatorUpdateError: "No se pudo actualizar el simulador",
```
en mirror:
```ts
      walletSimulator: "Wallet simulator",
      editWalletSimulator: "Edit simulator",
      walletSimulatorHelp: "Shows an interactive Bitcoin wallet simulator at the end of the lesson.",
      walletSimulatorOn: "The simulator is enabled for this lesson.",
      walletSimulatorOff: "The simulator is disabled.",
      walletSimulatorUpdated: "Simulator updated",
      walletSimulatorUpdateError: "Could not update the simulator",
```

- [ ] **Step 2: Create the form component** (mirrors `chapter-intro-form.tsx`; uses `Switch`)

```tsx
"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Chapter } from "@prisma/client";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface ChapterWalletSimulatorFormProps {
  initialData: Chapter;
  courseId: string;
  moduleId: string;
  chapterId: string;
}

const formSchema = z.object({ hasWalletSimulator: z.boolean() });

export const ChapterWalletSimulatorForm = ({
  initialData,
  courseId,
  moduleId,
  chapterId,
}: ChapterWalletSimulatorFormProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((prev) => !prev);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { hasWalletSimulator: !!initialData.hasWalletSimulator },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(
        `/api/courses/${courseId}/course-modules/${moduleId}/chapters/${chapterId}`,
        values
      );
      toast.success(t.admin.walletSimulatorUpdated);
      toggleEdit();
      router.refresh();
    } catch {
      toast.error(t.admin.walletSimulatorUpdateError);
    }
  };

  return (
    <div className="mt-6 bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        {t.admin.walletSimulator}
        <Button onClick={toggleEdit} variant="ghost" className="cursor-pointer">
          {isEditing && <>{t.common.cancel}</>}
          {!isEditing && (
            <>
              <Pencil className="w-4 h-4 mr-2" />
              {t.admin.editWalletSimulator}
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p className={cn("text-sm mt-2", !initialData.hasWalletSimulator && "text-slate-500 italic")}>
          {initialData.hasWalletSimulator ? t.admin.walletSimulatorOn : t.admin.walletSimulatorOff}
        </p>
      )}
      {isEditing && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="hasWalletSimulator"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormDescription>{t.admin.walletSimulatorHelp}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                {t.common.save}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Mount the form in the admin chapter page** (under "Access settings", next to `ChapterIntroForm`)

In `page.tsx`, add the import near the other form imports (after L9):
```ts
import { ChapterWalletSimulatorForm } from "./_components/chapter-wallet-simulator-form";
```
Then render it right after `<ChapterIntroForm ... />` (after L109, inside the same "accessSettings" block):
```tsx
                <ChapterIntroForm
                  initialData={moduleChapter}
                  courseId={params.courseId}
                  moduleId={params.moduleId}
                  chapterId={params.chapterId}
                />
                <ChapterWalletSimulatorForm
                  initialData={moduleChapter}
                  courseId={params.courseId}
                  moduleId={params.moduleId}
                  chapterId={params.chapterId}
                />
```

> NOTE: this admin form should only matter for LESSON chapters (the QUIZ branch renders a different builder, but the access-settings column is shared). The simulator only renders for the student on non-QUIZ `default` content, so leaving the toggle visible for all chapter types is harmless; the spec scopes rendering to the `default` content case.

- [ ] **Step 4: Type-check + lint**

Run: `npx tsc --noEmit && yarn lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/_components/chapter-wallet-simulator-form.tsx" "app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/page.tsx" lib/i18n/messages.ts
git commit -m "feat(admin): wallet simulator toggle (Switch) on chapter editor"
```

---

## Phase 9 — Student render hook-ins

### Task 16: Thread `hasWalletSimulator` into `<ContentViewer>` and lazy-mount the widget

**Files:**
- Modify: `app/(course)/courses/[courseId]/chapters/[chapterId]/page.tsx` (the `default` case of `renderChapterContent()`, L208-224)
- Modify: `app/(course)/courses/[courseId]/chapters/[chapterId]/_components/content-viewer.tsx` (props ~L24-47, mount after rich-content `<Card>` ~L421)

**Interfaces:**
- Consumes: `Chapter.hasWalletSimulator` (already returned by the page's `prisma.chapter.findUnique` at L135-161, which uses `include` with no `select` → all scalar columns present), `completionRef` (already in `ContentViewer`, L136), `WalletSimulator` default export (Task 12).
- Produces: the widget rendered after the lesson content when the flag is on (authenticated, non-preview).

- [ ] **Step 1: Pass the flag from the student page (default case, L210-223)**

In `page.tsx`, add the prop to the `default`-case `<ContentViewer>`:
```tsx
             <ContentViewer
               videoUrl={chapter.videoUrl}
               pdfUrl={chapter.pdfUrl}
               richContent={chapter.richContent}
               youtubeUrl={chapter.youtubeUrl}
               title={chapter.title}
               courseId={params.courseId}
               nextChapterId={nextChapter?.id}
               isLocked={false}
               completeOnEnd={completeOnEnd}
               description={chapter.description as string}
               attachments={chapter.attachments}
               chapterId={chapter.id}
               hasWalletSimulator={chapter.hasWalletSimulator}
             />
```

> The intro-preview `<ContentViewer>` (L106-120, unauthenticated) intentionally does NOT receive the flag — the simulator requires authentication and is gated on `isAuthenticated && !isPreviewMode` in the viewer.

- [ ] **Step 2: Add the lazy import + prop to `content-viewer.tsx`**

At the top of `content-viewer.tsx`, after the existing imports (after L22), add the dynamic import:
```tsx
import dynamic from "next/dynamic";

const WalletSimulator = dynamic(() => import("@/components/wallet-simulator"), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-muted-foreground">Cargando simulador…</div>,
});
```

Add to `ContentViewerProps` (within L24-47):
```ts
  hasWalletSimulator?: boolean;
```

Add to the destructured params (within L109-128), after `isAuthenticated = true,`:
```ts
  hasWalletSimulator = false,
```

- [ ] **Step 3: Mount the widget after the rich-content `<Card>` (closes at L421)**

Immediately after the closing `</Card>` at L421 (the media/rich-content card) and before the `{isAuthenticated && !isPreviewMode && attachments ...}` block at L423, insert:
```tsx
          {hasWalletSimulator && isAuthenticated && !isPreviewMode && (
            <WalletSimulator onLessonComplete={() => completionRef.current?.complete()} />
          )}
```

> `completionRef` is already declared (L136) and the `CompletionButton` is rendered later in the same authenticated/non-preview branch (L481-488), so `completionRef.current` is populated when `completeOnEnd` is true. When `completeOnEnd` is false (already-completed/revisited lesson), `CompletionButton` is not mounted, so `completionRef.current` is null and `complete()` is a no-op — satisfying spec §10's "don't re-complete" requirement without extra wiring. The loading copy uses a literal here (the dynamic `loading` fn runs before the i18n provider context is convenient); keep it Spanish per the default locale, matching the spec's `<div>Cargando simulador…</div>` sketch.

- [ ] **Step 4: Type-check, lint, and build**

Run: `npx tsc --noEmit && yarn lint && yarn build`
Expected: all PASS. The `ssr: false` dynamic import keeps `@scure/*` + `qrcode.react` out of the server bundle (no Buffer/crypto polyfill errors at build time).

- [ ] **Step 5: Commit**

```bash
git add "app/(course)/courses/[courseId]/chapters/[chapterId]/page.tsx" "app/(course)/courses/[courseId]/chapters/[chapterId]/_components/content-viewer.tsx"
git commit -m "feat(course): lazy-mount wallet simulator at end of flagged lessons"
```

---

## Phase 10 — End-to-end manual verification

### Task 17: Full-stack smoke test

**Files:** none (verification only).

- [ ] **Step 1: Run the full automated gate**

Run: `yarn test && npx tsc --noEmit && yarn lint && yarn build`
Expected: pure-core tests pass; no type errors; lint clean; production build succeeds.

- [ ] **Step 2: Admin toggle round-trip**

Run `yarn dev`. As an ADMIN, open a LESSON chapter editor:
`/admin/courses/<courseId>/course-modules/<moduleId>/chapters/<chapterId>`.
Observe the "Simulador de billetera" card under access settings. Click edit, flip the Switch on, Save.
Expected: success toast (`Simulador actualizado`), card shows `El simulador está activado para esta lección.`
Verify persistence:
```bash
echo 'SELECT "hasWalletSimulator" FROM "Chapter" WHERE id = '"'"'<chapterId>'"'"';' | npx prisma db execute --stdin --schema prisma/schema.prisma
```
Expected: `t`/`true`.

- [ ] **Step 3: Student journey (happy path)**

As an authenticated, enrolled (non-preview) student, open that chapter:
`/courses/<courseId>/chapters/<chapterId>`. Scroll past the lesson content.
Expected: the simulator Card renders. Walk the journey:
1. **Create:** click "Generar billetera" → 12-word grid + `tb1…` address appear. Continue is enabled.
2. **Backup → receive gate:** try Continue before verifying — blocked. Reveal, ack, type the 3 requested words correctly → "Verificar respaldo" → verified → Continue enabled. (Type a wrong word once → see the incorrect message, gate stays closed.)
3. **Receive:** QR + address + balance (0) show. Click "Simular transacción entrante" → pending tx with a confirmation meter; after ~3 ticks it confirms and balance becomes 1,000,000 sats. Continue enabled.
4. **Send:** enter the sample `tb1…` address, an amount (e.g. 5000), pick a fee → "Enviar transacción" → pending out tx → confirms → balance debited by amount + fee. Continue enabled.
5. **Recap:** summary numbers correct; "Marcar lección completada" present.

- [ ] **Step 4: Completion wiring**

In Recap, click "Marcar lección completada".
Expected: the existing completion flow fires (progress PUT, `Lección completada` toast, auto-advance to next chapter if any) — same behavior as the CompletionButton.

- [ ] **Step 5: Negative + a11y checks**

- Set the toggle OFF → reload the student page → simulator does NOT render.
- Open the chapter as an UNauthenticated intro preview (if the chapter is intro) → simulator does NOT render.
- Validation: in Send, empty address → "obligatorio"; `bc1…` mainnet address → "no es válida"; amount `100` (below dust) → dust error; amount above balance → insufficient funds.
- Reset: click "Reiniciar" → AlertDialog confirm → returns to Create with a fresh wallet.
- Locale: switch to English → all simulator copy is English (no missing-key crashes).
- `prefers-reduced-motion`: enable it in the OS/devtools → pending txs jump straight to confirmed in one tick.

- [ ] **Step 6: Final commit (if any verification fixes were needed)**

```bash
git add -A && git commit -m "test(wallet-sim): end-to-end verification fixes"
```

(If no fixes were needed, skip — verification is observational.)

---

## Self-Review (completed against the spec)

**Spec coverage:**
- §5/§11 architecture & component tree → Tasks 4-12 (crypto boundary, pure core, presentational, panels, hook, index). ✓
- §6 library stack + Next.js lazy-mount notes → Task 1 (deps), Task 16 (dynamic `ssr:false`, no polyfills). ✓
- §7 crypto boundary (TEST_NETWORK, `m/84'/1'/0'/0/0`, async seed) → Task 4. ✓
- §8.1 schema + hand-written migration → Task 3 (uses `migrate deploy`, matches existing folder format). ✓
- §8.2 admin Switch toggle + PATCH → Tasks 14-15 (mirrors `ChapterIntroForm` + route). ✓
- §8.3 two student hook-ins → Task 16 (page prop + content-viewer mount after rich-content Card). ✓
- §9 i18n `walletSim` (es source + en mirror, function keys) → Task 13. ✓
- §10 completion via `completionRef.current?.complete()`, optional, respects already-complete → Task 16 Step 3 note. ✓
- §12 state model, §13 state machine + guards, §13.2 confirmation driver → Tasks 5, 8, 11. ✓
- §14 fake-network rules (integer sats, learner-triggered incoming, send validation, fee table, formatting) → Tasks 5, 6, 7. ✓
- §15 a11y/UX (PracticeBanner, live regions, AlertDialog reset, autocapitalize off, reduced-motion) → Tasks 9, 10, 11, 16. ✓
- §16 testing strategy (pure-core unit tests, crypto vector, component/integration smoke) → Tasks 2a, 4, 6, 7, 8, 17. ✓

**Placeholder scan:** no "TBD/handle edge cases/similar to Task N" — every code step shows complete code. ✓

**Type consistency:** action names (`GENERATE_BEGIN/SUCCESS/ERROR`, `NEXT_PHASE`, `TOGGLE_REVEAL`, `ACK_WRITTEN`, `SUBMIT_BACKUP`, `SIMULATE_INCOMING`, `TICK_CONFIRMATION`, `UPDATE_SEND_DRAFT`, `SUBMIT_SEND`, `RESET`) match across reducer (Task 8) and hook (Task 11). `WalletSimActions` method names (`generate/next/toggleReveal/ackWritten/submitBackup/simulateIncoming/updateDraft/submitSend/complete/reset`) match across hook, panels, and index. `canAdvance`, `validateSend`, `buildIncomingTx/buildOutgoingTx/buildRecap`, `feeFor` consistent between simulation (Task 7) and consumers. `t.walletSim.*` keys used in Phases 4-6 all defined in Task 13. ✓

**Open questions / flags for the executor:**
1. **`@scure/btc-signer@2.2.0` address-validation API** (Task 4 Step 3 note): the exact `isValidAddress` implementation assumes `btc.Address(TEST_NETWORK).decode(...)` exists; if the 2.2.0 API differs, fall back to a `bech32` (`@scure/base`) `tb1`-prefix decode. Behavior the tests pin: accept `tb1…`, reject mainnet `bc1…`/garbage.
2. **PATCH `undefined` semantics** (Task 14 note): the wallet-sim form sends only `{ hasWalletSimulator }`, so `isIntro` arrives `undefined`; Prisma treats that as no-op — confirmed consistent with how the existing `isIntro` form already works.
3. **Admin toggle visibility for QUIZ chapters** (Task 15 note): the access-settings column is shared, so the toggle shows for all chapter types; the simulator only renders on the student `default` (non-quiz) content path, so this is cosmetically harmless. If product wants it hidden for quizzes, wrap the form mount in `moduleChapter.type !== ChapterType.QUIZ`.
4. **Dynamic-import loading copy** is a hardcoded Spanish literal (default locale) because the `loading` fn renders outside convenient i18n context — matches the spec's sketch.
```
