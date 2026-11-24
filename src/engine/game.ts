import type { BirthEra, Card, LineageId, RegionId } from '../types/game';
import type { Catalog } from './catalogIndex';

/**
 * The whole game as data and one pure function. Nothing here touches the screen, the clock or
 * a random source: the same catalog, profile, seed and decisions always deal the same cards.
 *
 * Rules, in the order a player meets them:
 *  1. Card 1 is the profile's local entry card, card 2 its global one.
 *  2. From card 3 the desk follows one lineage at a time: the lineage of an entry card the
 *     player kept, otherwise the first lineage the profile's cell bridges to.
 *  3. Inside a lineage the next card is the unseen one that best fits the player: the right
 *     depth for how much they have kept there, from their region, from their listening years.
 *  4. One skip stays in the lineage and tries a different style; two skips in a row leave it.
 *  5. Three kept cards in a lineage are enough; the desk moves next door.
 *  6. No card is dealt twice, and the ninth decision always ends the game.
 */

export const ROUNDS = 9;
const KEPT_BEFORE_BRANCH = 3;
const SKIPS_BEFORE_TURN = 2;

const TIER_STEP = 1.5;
const REGION_BONUS = 2;
const WINDOW_BONUS = 2;
const OUT_OF_WINDOW_MAX = 0.5;
const SAME_GENRE_AFTER_SKIP = 2;
const LUCK = 0.9;

export interface Profile {
  era: BirthEra;
  region: RegionId;
}

export type ReasonKind = 'local' | 'global' | 'start' | 'deeper' | 'retry' | 'turn' | 'branch' | 'spent';

export interface Kept {
  cardId: string;
  /** The book or film shown under this card, if one is about it. */
  loreId: string | null;
}

export interface GameState {
  phase: 'start' | 'booth' | 'result';
  profile: Profile | null;
  seed: number;
  /** 1..ROUNDS while in the booth. */
  round: number;
  cardId: string | null;
  reasonKind: ReasonKind | null;
  reason: string;
  /** 'kept' means the card on the desk was collected and is showing its details. */
  step: 'deciding' | 'kept';
  /** Every card dealt this game, in order, including the one on the desk. */
  seen: string[];
  kept: Kept[];
  focus: LineageId | null;
  keptInFocus: number;
  skipsInRow: number;
  /** Lineages the desk has moved on from. */
  left: LineageId[];
  /** The card skipped last round, while the desk stays in the same lineage. */
  skippedId: string | null;
}

export type Action =
  | { type: 'start'; profile: Profile; seed: number }
  | { type: 'collect' }
  | { type: 'skip' }
  | { type: 'next' }
  | { type: 'restart' };

export const initialState: GameState = {
  phase: 'start',
  profile: null,
  seed: 0,
  round: 0,
  cardId: null,
  reasonKind: null,
  reason: '',
  step: 'deciding',
  seen: [],
  kept: [],
  focus: null,
  keptInFocus: 0,
  skipsInRow: 0,
  left: [],
  skippedId: null,
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

function best<T>(items: T[], score: (item: T) => number): T | null {
  let top: T | null = null;
  let topScore = -Infinity;
  for (const item of items) {
    const s = score(item);
    if (s > topScore) {
      top = item;
      topScore = s;
    }
  }
  return top;
}

function unseenIn(catalog: Catalog, state: GameState, lineage: LineageId): Card[] {
  return catalog.cards.filter((c) => c.track.lineage === lineage && !state.seen.includes(c.track.id));
}

function keptIn(catalog: Catalog, state: GameState, lineage: LineageId): number {
  return state.kept.filter((k) => catalog.card(k.cardId).track.lineage === lineage).length;
}

export function fromRegion(card: Card, profile: Profile): boolean {
  return card.artist.region === profile.region;
}

export function inWindow(catalog: Catalog, card: Card, profile: Profile): boolean {
  const era = catalog.era(profile.era);
  return card.track.year >= era.windowStart && card.track.year <= era.windowEnd;
}

/** The unseen card of a lineage that fits this player best right now. */
export function pickInLineage(catalog: Catalog, state: GameState, lineage: LineageId, round: number): Card | null {
  const profile = state.profile;
  if (!profile) return null;
  const era = catalog.era(profile.era);
  const targetTier = Math.min(3, 1 + keptIn(catalog, state, lineage));
  const skipped = state.skippedId ? catalog.card(state.skippedId) : null;

  return best(unseenIn(catalog, state, lineage), (card) => {
    const { year, tier, genre, id } = card.track;
    const yearsOut = year < era.windowStart ? era.windowStart - year : year > era.windowEnd ? year - era.windowEnd : 0;
    return (
      -TIER_STEP * Math.abs(tier - targetTier) +
      (fromRegion(card, profile) ? REGION_BONUS : 0) +
      (yearsOut === 0 ? WINDOW_BONUS : -Math.min(OUT_OF_WINDOW_MAX, yearsOut / 60)) -
      (skipped && skipped.track.genre === genre ? SAME_GENRE_AFTER_SKIP : 0) +
      LUCK * luck(state.seed, `card:${round}:${id}`)
    );
  });
}

/** Where the desk goes when it leaves `from`: next door first, then where the profile points. */
function chooseFocus(catalog: Catalog, state: GameState, from: LineageId | null, left: LineageId[], round: number): LineageId | null {
  const profile = state.profile;
  if (!profile) return null;
  const bridges = catalog.cell(profile.era, profile.region).bridges;
  const adjacent = from ? catalog.lineage(from).adjacent : [];
  const open = catalog.lineages.map((l) => l.id).filter((id) => unseenIn(catalog, state, id).length > 0);
  const fresh = open.filter((id) => id !== from && !left.includes(id));
  // Only a player who has been everywhere gets sent back to a lineage already left.
  const pool = fresh.length > 0 ? fresh : open.filter((id) => id !== from).length > 0 ? open.filter((id) => id !== from) : open;

  return best(pool, (id) => {
    const nextDoor = adjacent.indexOf(id);
    const bridge = bridges.indexOf(id);
    return (
      (nextDoor >= 0 ? 4 - 0.3 * nextDoor : 0) +
      (bridge >= 0 ? 3 - 0.5 * bridge : 0) +
      Math.min(2, keptIn(catalog, state, id)) +
      0.4 * luck(state.seed, `focus:${round}:${id}`)
    );
  });
}

function affinity(catalog: Catalog, profile: Profile, card: Card): string {
  if (fromRegion(card, profile)) return `，这张来自${catalog.region(profile.region).label}`;
  if (inWindow(catalog, card, profile)) {
    const era = catalog.era(profile.era);
    return `，这张出自 ${era.windowStart}–${era.windowEnd} 年间`;
  }
  return '';
}

function deal(catalog: Catalog, state: GameState): GameState {
  const profile = state.profile;
  if (!profile) return state;
  const round = state.round + 1;
  const cell = catalog.cell(profile.era, profile.region);
  const era = catalog.era(profile.era);
  const onDesk = (card: Card, reasonKind: ReasonKind, reason: string, rest: Partial<GameState> = {}): GameState => ({
    ...state,
    ...rest,
    phase: 'booth',
    round,
    cardId: card.track.id,
    reasonKind,
    reason,
    step: 'deciding',
    seen: [...state.seen, card.track.id],
  });

  if (round === 1) {
    return onDesk(
      catalog.card(cell.local),
      'local',
      `你长大的那些年（${era.windowStart}–${era.windowEnd}），${catalog.region(profile.region).label}的一首。`,
    );
  }
  if (round === 2) {
    return onDesk(catalog.card(cell.global), 'global', '还是那些年，这首你多半听过。');
  }

  const name = (id: LineageId) => `「${catalog.lineage(id).nameZh}」`;
  const from = state.focus;
  let focus = from;
  let kind: ReasonKind;
  let left = state.left;
  let lead = '';

  if (from === null) {
    const keptEntry = state.kept
      .map((k) => catalog.card(k.cardId))
      .find((c) => c.track.lineage !== null && unseenIn(catalog, state, c.track.lineage).length > 0);
    focus = keptEntry?.track.lineage ?? cell.bridges.find((b) => unseenIn(catalog, state, b).length > 0) ?? chooseFocus(catalog, state, null, left, round);
    kind = 'start';
    lead = keptEntry ? `你收下了〈${keptEntry.track.title}〉，顺着它所在的${focus ? name(focus) : ''}往下` : `从${focus ? name(focus) : ''}开始`;
  } else if (state.skipsInRow >= SKIPS_BEFORE_TURN) {
    left = [...left, from];
    focus = chooseFocus(catalog, state, from, left, round);
    kind = 'turn';
    lead = `连跳两张，换到${focus ? name(focus) : ''}`;
  } else if (state.keptInFocus >= KEPT_BEFORE_BRANCH) {
    left = [...left, from];
    focus = chooseFocus(catalog, state, from, left, round);
    kind = 'branch';
    const nextDoor = focus !== null && catalog.lineage(from).adjacent.includes(focus);
    lead = `${name(from)}已收下三张，${nextDoor ? '去隔壁的' : '换到'}${focus ? name(focus) : ''}`;
  } else if (unseenIn(catalog, state, from).length === 0) {
    left = [...left, from];
    focus = chooseFocus(catalog, state, from, left, round);
    kind = 'spent';
    lead = `${name(from)}翻完了，换到${focus ? name(focus) : ''}`;
  } else if (state.skippedId !== null) {
    kind = 'retry';
    lead = `跳过了一张，${name(from)}里换个样子再来`;
  } else {
    kind = 'deeper';
    lead = `收下了，${name(from)}再往下一张`;
  }

  const moved = focus !== from;
  const lookAt: GameState = moved ? { ...state, skippedId: null } : state;
  const card =
    (focus ? pickInLineage(catalog, lookAt, focus, round) : null) ??
    catalog.cards.find((c) => !state.seen.includes(c.track.id)) ??
    null;
  if (!card) return { ...state, phase: 'result', cardId: null, step: 'deciding' };

  return onDesk(card, kind, `${lead}${affinity(catalog, profile, card)}。`, {
    focus,
    left,
    skippedId: moved ? null : state.skippedId,
    skipsInRow: moved ? 0 : state.skipsInRow,
    // Cards already kept from the new lineage (an entry card, say) count towards "three are enough".
    keptInFocus: moved ? (focus ? keptIn(catalog, state, focus) : 0) : state.keptInFocus,
  });
}

/** The book or film to show under a card: one about its artist first, else one about its genre. */
function pickLore(catalog: Catalog, state: GameState, card: Card): string | null {
  const used = new Set(state.kept.map((k) => k.loreId));
  const unused = catalog.lore.filter((l) => !used.has(l.id));
  const aboutArtist = unused.filter((l) => l.artistIds.includes(card.artist.id));
  const pool = aboutArtist.length > 0 ? aboutArtist : unused.filter((l) => l.genres.includes(card.track.genre));
  return best(pool, (l) => luck(state.seed, `lore:${l.id}`))?.id ?? null;
}

function advance(catalog: Catalog, state: GameState): GameState {
  if (state.round >= ROUNDS) return { ...state, phase: 'result', step: 'deciding' };
  return deal(catalog, state);
}

export function reduce(state: GameState, action: Action, catalog: Catalog): GameState {
  switch (action.type) {
    case 'start':
      return deal(catalog, { ...initialState, profile: action.profile, seed: action.seed >>> 0 });
    case 'restart':
      return initialState;
    case 'collect': {
      if (state.phase !== 'booth' || state.step !== 'deciding' || !state.cardId) return state;
      const card = catalog.card(state.cardId);
      const inFocus = state.focus !== null && card.track.lineage === state.focus;
      return {
        ...state,
        step: 'kept',
        kept: [...state.kept, { cardId: card.track.id, loreId: pickLore(catalog, state, card) }],
        keptInFocus: inFocus ? state.keptInFocus + 1 : state.keptInFocus,
        skipsInRow: 0,
        skippedId: null,
      };
    }
    case 'skip': {
      if (state.phase !== 'booth' || state.step !== 'deciding' || !state.cardId) return state;
      const followingLineage = state.focus !== null;
      return advance(catalog, {
        ...state,
        skipsInRow: followingLineage ? state.skipsInRow + 1 : 0,
        skippedId: followingLineage ? state.cardId : null,
      });
    }
    case 'next':
      if (state.phase !== 'booth' || state.step !== 'kept') return state;
      return advance(catalog, state);
  }
}
