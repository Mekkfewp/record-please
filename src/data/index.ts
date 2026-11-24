import {
  CARDS,
  ERAS,
  LINEAGES,
  LINEAGE_LIST,
  LORE,
  REGIONS,
  countryLabel,
  getCard,
  getCell,
  getEra,
  getRegion,
} from './catalog';
import { LINEAGE_STYLE, POP_STYLE } from './meta';
import type { Card, LineageId, LoreItem, PlayerProfile, RegionId } from '../types/game';

export { CARDS, ERAS, REGIONS, LINEAGES, LINEAGE_LIST, LORE, LINEAGE_STYLE, POP_STYLE, countryLabel, getCard, getEra, getRegion };

export function lineageLabel(lineage: LineageId | null): string {
  return lineage ? LINEAGE_STYLE[lineage].shortCN : POP_STYLE.shortCN;
}

export function lineageColor(lineage: LineageId | null): string {
  return lineage ? LINEAGE_STYLE[lineage].badgeColor : POP_STYLE.badgeColor;
}

export interface DeskPick {
  card: Card;
  /** Why this card is on the desk. Built only from catalog fields. */
  reason: string;
}

function entryReason(profile: PlayerProfile, slot: 'local' | 'global'): string {
  const era = getEra(profile.birthEra);
  const region = getRegion(profile.region);
  const window = `${era.windowStart}–${era.windowEnd}`;
  return slot === 'local'
    ? `入境第一张：你听歌的那些年（${window}），来自${region.label}的一首。`
    : `入境第二张：同一段年份（${window}）里的流行金曲。`;
}

export function getInitialDeskQueue(profile: PlayerProfile): DeskPick & { seededLineages: LineageId[] } {
  const cell = getCell(profile.birthEra, profile.region);
  const seededLineages: LineageId[] =
    profile.startingLineage !== 'auto' ? [profile.startingLineage, ...cell.bridges] : cell.bridges;

  if (profile.startingLineage !== 'auto') {
    const chosen = CARDS.find((c) => c.track.lineage === profile.startingLineage && c.track.tier === 1) ?? getCard(cell.local);
    return {
      card: chosen,
      reason: `按你指定的谱系开场：${LINEAGES[profile.startingLineage].name}。`,
      seededLineages,
    };
  }

  return { card: getCard(cell.local), reason: entryReason(profile, 'local'), seededLineages };
}

export function pickNextSingle(params: {
  profile: PlayerProfile;
  seenIds: Set<string>;
  round: number;
  lastCard: Card;
  lastDecision: 'collect' | 'pass';
  steeredLineage: LineageId | null;
  lineageDepth: Record<LineageId, number>;
}): DeskPick {
  const { profile, seenIds, round, lastCard, lastDecision, steeredLineage, lineageDepth } = params;
  const cell = getCell(profile.birthEra, profile.region);
  const unseen = CARDS.filter((c) => !seenIds.has(c.track.id));
  const pool = unseen.length > 0 ? unseen : CARDS;
  const inLineage = (lin: LineageId) => pool.filter((c) => c.track.lineage === lin);

  if (round === 2 && !steeredLineage && !seenIds.has(cell.global)) {
    return { card: getCard(cell.global), reason: entryReason(profile, 'global') };
  }

  if (steeredLineage) {
    const targetDepth = Math.min(3, (lineageDepth[steeredLineage] ?? 0) + 1);
    const match =
      inLineage(steeredLineage).find((c) => c.track.tier >= targetDepth) ?? inLineage(steeredLineage)[0] ?? pool[0];
    return { card: match, reason: `按手册调档：${LINEAGES[steeredLineage].name}。` };
  }

  // A pop card has no lineage of its own; continue from the cell's first bridge.
  const lastLineage: LineageId = lastCard.track.lineage ?? cell.bridges[0];

  if (lastDecision === 'collect') {
    const nextTier = Math.min(3, lastCard.track.tier + 1);
    const deeper = inLineage(lastLineage).find((c) => c.track.tier >= nextTier) ?? inLineage(lastLineage)[0];
    if (deeper) {
      return { card: deeper, reason: `你收下了上一张，继续沿 ${LINEAGES[lastLineage].name} 往下。` };
    }
  }

  for (const adj of LINEAGES[lastLineage].adjacent) {
    const pivot = inLineage(adj).find((c) => c.track.tier <= 2) ?? inLineage(adj)[0];
    if (pivot) {
      return { card: pivot, reason: `换个方向：从 ${LINEAGES[lastLineage].name} 转到相邻的 ${LINEAGES[adj].name}。` };
    }
  }

  return { card: pool[0], reason: '馆藏里的下一张。' };
}

export function pickLoreInterlude(params: {
  card: Card;
  fallbackLineage: LineageId;
  region: RegionId;
  seenLoreIds: Set<string>;
}): LoreItem | null {
  const lineage = params.card.track.lineage ?? params.fallbackLineage;
  const unseen = LORE.filter((l) => !params.seenLoreIds.has(l.id));
  if (unseen.length === 0) return null;
  return (
    unseen.find((l) => l.artistIds.includes(params.card.artist.id)) ??
    unseen.find((l) => l.lineage === lineage && l.regions.includes(params.region)) ??
    unseen.find((l) => l.lineage === lineage && l.regions.length === 0) ??
    unseen.find((l) => l.lineage === lineage) ??
    unseen[0]
  );
}
