import type { Relation, Slice } from './index';
import type { DigRecord, Floor, Tie } from './types';

/**
 * The whole game as data and one pure function. Nothing here touches the screen, the clock or
 * a random source: the same slice, seed and decisions always deal the same records.
 *
 * Rules, in the order a player meets them:
 *  1. The counter shows three door records, each from a different family. The player picks one;
 *     it is card 1, on the ground floor, face up.
 *  2. The second record is also face up. From the third on, a record arrives face down and
 *     plays; keeping or passing turns it over.
 *  3. Keeping goes down: the next record is one floor lower (ground, then the genre's best-known
 *     records, then records known inside the genre, then obscure ones) and, where the tree has
 *     one, inside a sub-genre of the record just kept.
 *  4. Passing stays on the floor and tries another record of the same genre. Two passes in a row
 *     move sideways to a neighbouring genre.
 *  5. Among records that fit, one with a looked-up tie to a record the player kept goes first.
 *  6. The crate holds five. Keeping a sixth means choosing one to give up.
 *  7. No record is dealt twice, and the ninth decision always ends the game.
 */

export const ROUNDS = 9;
export const CRATE_SIZE = 5;
export const DOORS_SHOWN = 3;
const PASSES_BEFORE_SIDESTEP = 2;

const TIE_BONUS = 3;
const LUCK = 0.9;
/** How much a genre's position is worth, by the move being made. */
const PLACE: Record<'down' | 'stay' | 'sidestep', Record<Relation, number>> = {
  down: { below: 4, same: 3, sibling: 2, family: 1, elsewhere: 0 },
  stay: { same: 4, below: 3, sibling: 2, family: 1, elsewhere: 0 },
  sidestep: { sibling: 4, family: 3, elsewhere: 1, below: 0, same: 0 },
};

export type Move = 'door' | 'down' | 'stay' | 'sidestep';

export interface Step {
  recordId: string;
  floor: Floor;
  /** How the desk got to this record. */
  move: Move;
  /** A looked-up tie to a kept record, when that is why this record was dealt. */
  tie: { tie: Tie; withId: string } | null;
  faceUp: boolean;
  decision: 'keep' | 'pass' | null;
}

export interface GameState {
  phase: 'start' | 'desk' | 'result';
  seed: number;
  /** Door records on the counter while phase is 'start'. */
  doors: string[];
  /** How many times the doors were reshuffled; only feeds the luck. */
  shuffles: number;
  /** Every record dealt this game, in order; the last one is on the desk. */
  steps: Step[];
  /** 'listening' until the player decides; 'swap' while a kept record waits for a crate slot. */
  step: 'listening' | 'swap' | 'decided';
  crate: string[];
  /** The genre the desk is standing in. */
  genreId: string | null;
  passesInRow: number;
}

export type Action =
  | { type: 'open'; seed: number; preferFamilies?: string[] }
  | { type: 'reshuffle' }
  | { type: 'pick'; recordId: string }
  | { type: 'keep' }
  | { type: 'pass' }
  | { type: 'swap'; slot: number }
  | { type: 'next' }
  | { type: 'restart' };

export const initialState: GameState = {
  phase: 'start',
  seed: 0,
  doors: [],
  shuffles: 0,
  steps: [],
  step: 'listening',
  crate: [],
  genreId: null,
  passesInRow: 0,
};

/** A fixed number in [0, 1) for a seed and a label; the only source of luck in the game. */
function luck(seed: number, label: string): number {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Three door records from three different families; families in `prefer` come first. */
export function pickDoors(slice: Slice, seed: number, shuffles: number, prefer: string[] = []): string[] {
  const byFamily = new Map<string, DigRecord[]>();
  for (const door of slice.doors) {
    const family = slice.family(door.genre).id;
    const list = byFamily.get(family);
    if (list) list.push(door);
    else byFamily.set(family, [door]);
  }
  const families = [...byFamily.keys()].sort(
    (a, b) =>
      Number(prefer.includes(b)) - Number(prefer.includes(a)) ||
      luck(seed, `family ${shuffles} ${a}`) - luck(seed, `family ${shuffles} ${b}`),
  );
  const chosen = families.slice(0, DOORS_SHOWN).map((family) => {
    const doors = byFamily.get(family) ?? [];
    return doors.reduce((top, d) => (luck(seed, `door ${shuffles} ${d.id}`) > luck(seed, `door ${shuffles} ${top.id}`) ? d : top)).id;
  });
  if (chosen.length >= DOORS_SHOWN) return chosen;
  // One family cannot fill three places. The remaining doors are other records from it.
  const used = new Set(chosen);
  const genreUsed = new Set(chosen.map((id) => slice.record(id).genre));
  const rest = slice.doors
    .filter((door) => !used.has(door.id))
    .sort(
      (a, b) =>
        Number(genreUsed.has(a.genre)) - Number(genreUsed.has(b.genre)) ||
        luck(seed, `extra ${shuffles} ${a.id}`) - luck(seed, `extra ${shuffles} ${b.id}`),
    );
  for (const door of rest) {
    if (chosen.length >= DOORS_SHOWN) break;
    chosen.push(door.id);
    genreUsed.add(door.genre);
  }
  return chosen;
}

export const current = (state: GameState): Step | null => state.steps[state.steps.length - 1] ?? null;

function keptIds(state: GameState): string[] {
  return state.steps.filter((s) => s.decision === 'keep').map((s) => s.recordId);
}

/** The record to deal next, or null when the slice has nothing left. */
export function deal(state: GameState, slice: Slice): Step | null {
  const seen = new Set(state.steps.map((s) => s.recordId));
  const last = current(state);
  const from = state.genreId;
  if (!last || !from) return null;
  const move: Exclude<Move, 'door'> =
    last.decision === 'keep' ? 'down' : state.passesInRow >= PASSES_BEFORE_SIDESTEP ? 'sidestep' : 'stay';
  const wanted: Floor = move === 'down' ? (Math.min(3, last.floor + 1) as Floor) : last.floor;
  const unseen = slice.records.filter((r) => !seen.has(r.id));
  // The floor asked for first; when it is empty, the nearest floor, preferring the deeper one.
  const floors = ([0, 1, 2, 3] as Floor[]).sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted) || b - a);
  const kept = keptIds(state);
  for (const floor of floors) {
    const pool = unseen.filter((r) => slice.floorOf(r) === floor);
    if (pool.length === 0) continue;
    let top: { record: DigRecord; score: number; tie: Step['tie'] } | null = null;
    for (const record of pool) {
      let tie: Step['tie'] = null;
      for (const id of kept) {
        const found = slice.tiesBetween(record.id, id)[0];
        if (found) tie = { tie: found, withId: id };
      }
      const score =
        PLACE[move][slice.relation(from, record.genre)] +
        (tie ? TIE_BONUS : 0) +
        LUCK * luck(state.seed, `deal ${state.steps.length} ${record.id}`);
      if (!top || score > top.score) top = { record, score, tie };
    }
    if (top) return { recordId: top.record.id, floor, move, tie: top.tie, faceUp: state.steps.length < 2, decision: null };
  }
  return null;
}

function decide(state: GameState, slice: Slice, decision: 'keep' | 'pass', crate: string[]): GameState {
  const steps = state.steps.slice();
  const step = { ...steps[steps.length - 1], decision, faceUp: true };
  steps[steps.length - 1] = step;
  const record = slice.record(step.recordId);
  return {
    ...state,
    steps,
    crate,
    step: 'decided',
    genreId: decision === 'keep' ? record.genre : state.genreId,
    passesInRow: decision === 'keep' ? 0 : state.passesInRow + 1,
  };
}

export function reduce(state: GameState, action: Action, slice: Slice): GameState {
  const now = current(state);
  switch (action.type) {
    case 'open':
      return { ...initialState, seed: action.seed, doors: pickDoors(slice, action.seed, 0, action.preferFamilies) };
    case 'restart':
      return { ...initialState, seed: state.seed + 1, doors: pickDoors(slice, state.seed + 1, 0) };
    case 'reshuffle': {
      if (state.phase !== 'start') return state;
      const shuffles = state.shuffles + 1;
      return { ...state, shuffles, doors: pickDoors(slice, state.seed, shuffles) };
    }
    case 'pick': {
      if (state.phase !== 'start' || !state.doors.includes(action.recordId)) return state;
      const record = slice.record(action.recordId);
      return {
        ...state,
        phase: 'desk',
        step: 'listening',
        genreId: record.genre,
        steps: [{ recordId: record.id, floor: 0, move: 'door', tie: null, faceUp: true, decision: null }],
      };
    }
    case 'keep': {
      if (state.phase !== 'desk' || state.step !== 'listening' || !now) return state;
      if (state.crate.length < CRATE_SIZE) return decide(state, slice, 'keep', [...state.crate, now.recordId]);
      // The crate is full: the record turns over and waits for the player to give one up.
      const steps = state.steps.slice();
      steps[steps.length - 1] = { ...now, faceUp: true };
      return { ...state, steps, step: 'swap' };
    }
    case 'swap': {
      if (state.phase !== 'desk' || state.step !== 'swap' || !now) return state;
      if (action.slot < 0 || action.slot >= state.crate.length) return state;
      const crate = state.crate.slice();
      crate[action.slot] = now.recordId;
      return decide(state, slice, 'keep', crate);
    }
    case 'pass': {
      if (state.phase !== 'desk' || state.step === 'decided' || !now) return state;
      return decide(state, slice, 'pass', state.crate);
    }
    case 'next': {
      if (state.phase !== 'desk' || state.step !== 'decided') return state;
      if (state.steps.length >= ROUNDS) return { ...state, phase: 'result' };
      const step = deal(state, slice);
      if (!step) return { ...state, phase: 'result' };
      const record = slice.record(step.recordId);
      return {
        ...state,
        steps: [...state.steps, step],
        step: 'listening',
        // A sidestep moves the desk even though nothing was kept.
        genreId: step.move === 'sidestep' ? record.genre : state.genreId,
        passesInRow: step.move === 'sidestep' ? 0 : state.passesInRow,
      };
    }
  }
}
