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
  return { positions: Array.from(positions).sort((a, b) => a - b) };
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
