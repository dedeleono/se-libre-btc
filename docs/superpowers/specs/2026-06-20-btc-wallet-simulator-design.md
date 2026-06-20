# BTC Wallet Simulator — Design

**Date:** 2026-06-20
**Status:** Approved (design), pending implementation plan
**Author:** Brainstormed with Claude (3 parallel research agents)

## 1. Summary

An interactive **BTC wallet simulator** embedded at the end of one lesson in the Dinero
Libre LMS, so beginners can learn self-custody by *doing* it. The learner is walked
through a guided mini-journey — **create → backup → receive → send → recap** — in a
self-contained, 100% client-side React widget.

The wallet uses **real BIP39 + BIP84 cryptography** (genuine 12-word seed, genuine HD
key derivation, genuine address) so the mechanics are authentic, but the **network,
balance, transactions, and confirmations are faked** in browser state. Addresses are
derived on **testnet** (`tb1…`, `m/84'/1'/0'/0/0`) so accidental real-money use is
impossible.

## 2. Goals

- Teach the full lifecycle of using a self-custodial wallet in one guided flow.
- Make the "not your keys, not your coins" lesson tangible: you cannot receive funds
  until you prove you backed up your seed.
- Keep it safe (testnet, no persistence), instant (no network waits), and offline-capable.
- **Reusable across any lesson/course:** an admin can toggle the simulator on for *any*
  chapter from the chapter editor, so it can be embedded in future courses without code
  changes. The widget itself is generic (no lesson-specific copy).

## 3. Non-goals (YAGNI)

- No real network / testnet faucet / node integration (the network is simulated).
- No server-side persistence of the simulated wallet or its session progress (approach A —
  the only thing persisted is the per-chapter on/off toggle).
- No new `ChapterType`: the simulator is an *add-on* that renders at the end of normal
  lesson content (it coexists with video/PDF/rich text), not a standalone player. The
  single schema change is one boolean column on `Chapter`.

## 4. Decisions made during brainstorming

1. **Learning goal:** a guided mini-journey (create → backup → receive → send), not a
   single concept.
2. **Realism:** "real BIP39, fake network" — genuine seed + address derivation, simulated
   everything else.
3. **Approach:** A — self-contained client component, no backend, no DB.
4. **Address safety:** **testnet** (`tb1…`) so accidental real-money sends are impossible
   while the mechanics stay authentic.

## 5. Architecture

Three layers with clear boundaries:

| Layer | Location | Responsibility | React? |
|---|---|---|---|
| Crypto boundary | `lib/wallet-sim/crypto.ts` | Real BIP39/BIP84; thin adapter over the chosen lib | No |
| Pure simulation core | `lib/wallet-sim/{reducer,types,simulation,format}.ts` | Faked network: balance, txs, confirmations, fees, validation, formatting | No |
| React UI | `components/wallet-simulator/` (reusable widget) | Dumb panels + the `useWalletSimulator` hook that owns side effects | Yes |

The UI depends only on the crypto **interface** and on semantic `actions.*` from the
hook — never on a bitcoin library directly. Swapping the underlying library touches one
file (`crypto.ts`).

## 6. Library stack

Recommended (agent research): the noble/scure ecosystem — pure JS, zero WASM, zero Node
polyfills, ships its own types, frictionless in a Next App Router `"use client"` component.

Add to **dependencies**:

```jsonc
"@scure/bip39": "^2.2.0",
"@scure/bip32": "^2.2.0",
"@scure/btc-signer": "^2.2.0",
"qrcode.react": "^4.2.0"
```

(`@scure/btc-signer` transitively pulls `@noble/curves`, `@noble/hashes`, `@scure/base`,
`micro-packed` on the unified 2.2.0 line — no peer/version skew, nothing else to add.)

**Next.js notes:**
- Lazy-load the widget to keep the lesson page light:
  ```tsx
  const WalletSimulator = dynamic(() => import("./wallet-simulator"), {
    ssr: false,
    loading: () => <div>Cargando simulador…</div>,
  });
  ```
- `ssr: false` because crypto + QR are browser-only (also avoids QR hydration edge cases).
- No `Buffer`/`crypto` polyfills and no `next.config` changes required.
- `mnemonicToSeed` is async (PBKDF2 via Web Crypto) → treat derivation as async.

## 7. Crypto boundary (`lib/wallet-sim/crypto.ts`)

Testnet (BIP84, `m/84'/1'/0'/0/0`). The UI imports only this interface:

```ts
export interface DerivedAccount {
  address: string;        // testnet native segwit, tb1...
  privateKeyWif: string;  // testnet WIF of the first address
}

export function generateMnemonic(): string;            // 12 words, 128-bit entropy
export function validateMnemonic(mnemonic: string): boolean;
export function mnemonicToAccount(mnemonic: string): Promise<DerivedAccount>;
export function isValidAddress(address: string): boolean; // bech32 tb1... check
```

Reference implementation sketch (using `@scure/*` + `TEST_NETWORK`):

```ts
import { generateMnemonic as gen, validateMnemonic as val, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { HDKey } from "@scure/bip32";
import * as btc from "@scure/btc-signer";
import { pubECDSA } from "@scure/btc-signer/utils.js";

const PATH = "m/84'/1'/0'/0/0"; // coin type 1 = testnet

export function generateMnemonic() { return gen(wordlist, 128); }
export function validateMnemonic(m: string) { return val(m.trim(), wordlist); }

export async function mnemonicToAccount(mnemonic: string): Promise<DerivedAccount> {
  const seed = await mnemonicToSeed(mnemonic.trim(), "");
  const child = HDKey.fromMasterSeed(seed).derive(PATH);
  const pubkey = pubECDSA(child.privateKey!);
  const address = btc.p2wpkh(pubkey, btc.TEST_NETWORK).address!;
  const wif = btc.WIF(btc.TEST_NETWORK).encode(child.privateKey!);
  return { address, privateKeyWif: wif };
}
```

## 8. Integration path (per-lesson toggle)

The simulator is opt-in **per chapter**, controlled by an admin toggle, so it can be reused
in any lesson/course without code changes.

### 8.1 Schema (one boolean column)

Add to the `Chapter` model:

```prisma
hasWalletSimulator Boolean @default(false)
```

Follow the existing boolean-flag convention on `Chapter` (`isPublished`, `isFree`,
`isIntro`). **Migration:** `prisma migrate dev` is broken in this repo — write the
migration SQL by hand and apply with `prisma migrate deploy` (see project memory
"Prisma migration workflow"). The migration is additive with a default, so it is safe and
backward-compatible.

### 8.2 Admin toggle

In the chapter editor (admin course-builder), add a `Switch`-based form control
"Simulador de billetera" that PATCHes the chapter's `hasWalletSimulator`. Match the
existing edit-form pattern used by the other chapter boolean toggles (same form component,
PATCH route, optimistic update + toast). The implementation plan must locate the exact
chapter-edit form + PATCH route and mirror them.

### 8.3 Student render — two hook-ins

1. **`page.tsx`** (`default` case of `renderChapterContent()`, ~L208-224): the
   authenticated `findUnique` already returns the whole chapter row, so
   `chapter.hasWalletSimulator` is available — pass `hasWalletSimulator={chapter.hasWalletSimulator}`
   into `<ContentViewer>` (add to `select` if a narrower selection is introduced).

2. **`content-viewer.tsx`**: add `hasWalletSimulator?: boolean` to `ContentViewerProps`,
   destructure it, and after the rich-content card render:
   ```tsx
   {hasWalletSimulator && isAuthenticated && !isPreviewMode && (
     <WalletSimulator onLessonComplete={() => completionRef.current?.complete()} />
   )}
   ```

The `<WalletSimulator>` is generic — it takes no lesson-specific props beyond the optional
`onLessonComplete`, so the same component serves every chapter that has the flag on.

**Rejected alternatives:** new `ChapterType.SIMULATOR` (needs a Prisma *enum* change + a
separate player, and would *replace* lesson content rather than augment it — a toggle lets
the simulator coexist with the chapter's video/text); Lexical custom node (richContent is
read-only `<Preview>`, far more surface area); slug-based gating (not author-friendly —
admins shouldn't have to set a magic slug).

## 9. i18n

- Client components use `const { t } = useLocale()` from `@/lib/i18n` (`t` is a nested
  object, e.g. `t.walletSim.backup.title`).
- Add a `walletSim` namespace to `lib/i18n/messages.ts` under **both** `es` and `en`.
  `es` is the source of truth (default locale) and `Messages = typeof es`, so any key
  missing from `en` is a compile error.
- Use locale for number formatting (`Intl.NumberFormat`), Spanish grouping by default.

## 10. Completion

Reuse the existing `completionRef.current?.complete()` already wired in `ContentViewer`
(same mechanism the video-end handler uses; it PUTs the progress route, toasts, refreshes,
auto-advances). Pass `onLessonComplete` into the simulator. Make it **optional** and
respect `completeOnEnd` so a re-visited, already-complete lesson isn't re-completed.

## 11. Component tree

```
WalletSimulator                  ← owns reducer (via useWalletSimulator), renders header + active panel
├── PhaseStepper                 ← 5 phases, presentational
├── PracticeBanner               ← persistent "práctica, no es dinero real"
├── <active panel>:
│   ├── CreatePanel              → SeedPhraseGrid, AddressDisplay
│   ├── BackupPanel              → SeedPhraseGrid (reveal/hide), BackupChallenge
│   ├── ReceivePanel            → AddressDisplay, QrCode, BalanceDisplay, TxStatus
│   ├── SendPanel               → AddressInput, AmountInput, FeeSelector, BalanceDisplay, TxStatus
│   └── RecapPanel              → summary + optional "marcar lección completada"
└── ResetButton                 ← replay (guarded by AlertDialog)
```

Stateless presentational pieces (receive data + callbacks only): `SeedPhraseGrid`,
`AddressDisplay` (copy → `sonner` toast), `QrCode`, `BalanceDisplay`, `TxStatus`,
`ConfirmationMeter`, `FeeSelector`. Reuse `@/components/ui/*` (Card, Button, Input, Label,
Progress, Badge, RadioGroup, AlertDialog, Tooltip, Separator) + `lucide-react`.

### File layout (proposed)

Because the widget is now reusable across lessons, the React UI lives at the **top level**
(`components/wallet-simulator/`) rather than co-located under one chapter's `_components/`.
Pure, testable logic stays in `lib/wallet-sim/`.

```
lib/wallet-sim/
  crypto.ts          # real BIP39/BIP84 adapter (the boundary)
  types.ts           # all simulator TS types
  reducer.ts         # pure state machine (no React) — unit-tested
  simulation.ts      # fake-network rules (incoming script, send validation, fee table)
  format.ts          # sats/BTC + address formatting helpers
components/wallet-simulator/
  index.tsx          # "use client" WalletSimulator (the reusable widget)
  use-wallet-simulator.ts  # hook: owns reducer + side effects (async crypto, tick interval, completion)
  panels/*.tsx
  presentational/*.tsx
```

## 12. State model (`lib/wallet-sim/types.ts`)

```ts
export type Phase = "create" | "backup" | "receive" | "send" | "done";
export const PHASE_ORDER: Phase[] = ["create","backup","receive","send","done"];

export interface Wallet {
  mnemonic: string;        // 12 words
  address: string;         // real tb1... (testnet)
  privateKeyWif: string;   // real testnet WIF (shown as "secret" teaching, never sent/persisted)
  balanceSats: number;     // FAKED, starts at 0
}

export type TxDirection = "in" | "out";
export type TxStatus = "pending" | "confirmed";
export type FeeLevel = "low" | "med" | "high";

export interface SimTx {
  id: string; direction: TxDirection; amountSats: number;
  feeRate: FeeLevel | null; feeSats: number;
  status: TxStatus; confirmations: number; requiredConfirmations: number;
  counterpartyAddress: string; createdAt: number; confirmedAt: number | null;
}

export interface BackupChallengeSpec { positions: number[]; } // 0-indexed word positions
export type BackupResult = { ok: true } | { ok: false; wrongPositions: number[] };

export interface SendDraft { toAddress: string; amountSats: number | null; feeLevel: FeeLevel; }
export interface SendErrors {
  toAddress?: "required" | "invalidFormat";
  amount?: "required" | "notPositive" | "insufficientFunds" | "dust";
}
export interface RecapSummary { finalBalanceSats: number; receivedSats: number; sentSats: number; txCount: number; }

export interface SimulatorState {
  phase: Phase; reachedPhases: Phase[];
  wallet: Wallet | null;
  backup: { revealed: boolean; acknowledgedWritten: boolean;
            challenge: BackupChallengeSpec | null; result: BackupResult | null; verified: boolean; };
  transactions: SimTx[];   // newest-first, both directions
  send: { draft: SendDraft; errors: SendErrors; broadcasted: boolean; };
  ui: { isGenerating: boolean; error: string | null; };
}
```

**Why `useReducer` state machine:** the journey is a finite state machine with guarded
transitions, atomic multi-slice updates (balance + tx together), and time-driven events.
A pure reducer makes every transition an explicit, named, testable function. The
`useWalletSimulator` hook is the only public surface — it owns the reducer, the async
crypto call, the confirmation interval, and lesson completion; panels stay dumb and call
semantic `actions.*`.

## 13. State machine

```
create ──generate(ok)──▶ backup ──verify backup──▶ receive ──incoming confirmed──▶ send ──send confirmed──▶ done
(any) ──reset──▶ create
```

| Event | Guard | Effect | Phase change |
|---|---|---|---|
| `GENERATE_WALLET` (BEGIN/SUCCESS/ERROR) | `phase==="create" && !wallet` | set `isGenerating`; on SUCCESS set `wallet` (balance 0) + build 3-word challenge; on ERROR set `ui.error` | — |
| `NEXT_PHASE` | target entry guard (§13.1) | advance phase; push `reachedPhases` | per order |
| `TOGGLE_REVEAL` | `phase==="backup"` | flip `backup.revealed` | — |
| `ACK_WRITTEN` | `phase==="backup"` | set `acknowledgedWritten` | — |
| `SUBMIT_BACKUP {answers}` | `phase==="backup" && challenge` | compare (trim/lowercase) to words at positions; set `result`; all correct → `verified=true` | — |
| `SIMULATE_INCOMING` | `phase==="receive" && no incoming tx` | push pending `in` tx; start tick | — |
| `TICK_CONFIRMATION` | any pending tx | each pending: `confirmations++`; at required → `confirmed`; `in` adds to balance, `out` subtracts amount+fee | — |
| `UPDATE_SEND_DRAFT {patch}` | `phase==="send"` | merge draft; recompute `errors` | — |
| `SUBMIT_SEND` | `phase==="send" && errors empty && !broadcasted` | push pending `out` tx; `broadcasted=true`; start tick | — |
| `COMPLETE_LESSON` | `phase==="done"` | side effect in hook (`onLessonComplete`) | — |
| `RESET` | always | fresh `initialState()` | → create |

### 13.1 Entry guards (single `canAdvance(state)` helper, used by reducer AND the UI button)

- **→ backup:** `wallet !== null`
- **→ receive:** `backup.verified === true`  *(the core teaching gate)*
- **→ send:** ≥1 confirmed incoming tx and `balanceSats > 0`
- **→ done:** ≥1 confirmed outgoing tx

### 13.2 Confirmation driver (in the hook, not the reducer)

```ts
const hasPending = state.transactions.some(t => t.status === "pending");
useEffect(() => {
  if (!hasPending) return;
  const id = setInterval(() => dispatch({ type: "TICK_CONFIRMATION" }), TICK_MS);
  return () => clearInterval(id);
}, [hasPending]);
```

`TICK_MS ≈ 1200`. Interval exists only while a tx is pending; cleared automatically on
confirm/reset/unmount. If `prefers-reduced-motion`, jump pending→confirmed in one tick.

## 14. Fake-network simulation rules (`lib/wallet-sim/simulation.ts`, pure)

- **Integer sats everywhere**; BTC only for display. Never float-math a balance.
- **Incoming:** learner-triggered (button: "Simular transacción entrante") so cause→effect
  is explicit. Amount default `1_000_000` sats (0.01 BTC), `requiredConfirmations: 3`,
  fixed sample counterparty `tb1…`, no fee.
- **Send validation** (`validateSend(draft, balanceSats)`): address required + bech32
  testnet format (`isValidAddress`); amount required, `>0`, `≥ DUST_SATS (546)`,
  `amount + fee ≤ balance`.
- **Fee table** (drives fee charged + speed; higher fee = fewer confirmations = faster):
  ```ts
  low:  { feeSats: 200,  requiredConfirmations: 6, etaKey: "fee.low.eta"  }
  med:  { feeSats: 800,  requiredConfirmations: 3, etaKey: "fee.med.eta"  }
  high: { feeSats: 2500, requiredConfirmations: 1, etaKey: "fee.high.eta" }
  ```
  ETA labels are i18n copy, not real time.
- **Formatting** (`format.ts`): `satsToBtc`, `formatSats`, `formatBtc`, `truncateAddress`
  ("tb1q…f3k9"), all locale-aware via `Intl.NumberFormat`.

## 15. Accessibility & UX

- Persistent `PracticeBanner` ("esto es práctica, no es dinero real") across all phases;
  reinforced in Create and Recap.
- Beginner Spanish copy, all via `t.walletSim.*`; inline define seed/dirección/
  confirmaciones/comisión.
- Mobile-first: `SeedPhraseGrid` 2-col on mobile / 3–4 on `sm+`; QR ≤ ~200px; tap targets
  ≥ 44px; `inputMode="decimal"` for amount; seed/address inputs `autoCapitalize="none"
  autoCorrect="off" spellCheck={false}`.
- Live regions: `TxStatus`/`ConfirmationMeter` `role="status" aria-live="polite"`;
  `Progress` with `aria-valuenow/min/max` + visually-hidden "Confirmaciones: 2 de 3".
- QR has meaningful `aria-label`; address always available as copyable text too.
- `ResetButton` guarded by `AlertDialog`; copy actions toast via `sonner`.
- Real WIF shown only as a labeled "esto es secreto, nunca lo compartas" demo; never
  sent or persisted.

## 16. Testing strategy

- **Pure core (no React):** unit-test `reducer.ts` (every transition + guard),
  `simulation.ts` (send validation matrix, fee table, incoming script), `format.ts`
  (sats/BTC, locale). These hold the invariants — highest value, easiest to test.
- **Crypto boundary:** test `mnemonicToAccount` produces a valid `tb1…` address + WIF for
  a known mnemonic vector; `validateMnemonic` / `isValidAddress` accept/reject correctly.
- **Component smoke:** render `WalletSimulator`, walk one happy path
  (generate → backup → receive → send → done), assert the receive gate is blocked until
  backup verified.
- **Integration toggle:** `ContentViewer` renders the simulator when
  `hasWalletSimulator` is true (and authenticated, non-preview) and omits it otherwise;
  the admin toggle PATCHes and persists `hasWalletSimulator`.

## 17. Future upgrade path (not now)

- **More embedded widgets:** if other interactive widgets are added later, the single
  `hasWalletSimulator` boolean can generalize into a nullable `embeddedWidget` enum/string
  on `Chapter` (e.g. `WALLET_SIMULATOR`, ...). YAGNI for now — one boolean is simplest.
- **Per-user progress persistence:** approach B (Prisma-backed) can be layered on top
  without UI rework if completion analytics for the simulator are ever wanted.
- The reusable `WalletSimulator` component does not change in either case.
