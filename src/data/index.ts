import { buildCatalogFromJson } from './catalogAdapter';
import { CULTURAL_LORE } from './lore';
import { ERAS, LINEAGES, LINEAGE_LIST, REGIONS } from './meta';
import { PACK_EAST_ASIA } from './packEastAsia';
import { PACK_LINEAGES_A } from './packLineagesA';
import type {
  AlbumRecord,
  ArtistDossier,
  BirthEra,
  CulturalLoreItem,
  LineageId,
  PlayerProfile,
  RegionId,
  SingleTrack,
} from '../types/game';

const parsed = buildCatalogFromJson();
const ALL_BUNDLES = [...PACK_EAST_ASIA, ...PACK_LINEAGES_A, ...parsed.bundles];

export const SINGLES_BY_ID = new Map<string, SingleTrack>();
export const ARTISTS_BY_ID = new Map<string, ArtistDossier>();
export const ALBUMS_BY_ID = new Map<string, AlbumRecord>();

for (const b of ALL_BUNDLES) {
  SINGLES_BY_ID.set(b.single.id, b.single);
  ARTISTS_BY_ID.set(b.artist.id, b.artist);
  ALBUMS_BY_ID.set(b.album.id, b.album);
}

export const ALL_SINGLES: SingleTrack[] = Array.from(SINGLES_BY_ID.values());

const loreMap = new Map<string, CulturalLoreItem>();
for (const item of [...CULTURAL_LORE, ...parsed.loreItems]) {
  loreMap.set(item.id, item);
}
export const ALL_LORE: CulturalLoreItem[] = Array.from(loreMap.values());

export { ERAS, REGIONS, LINEAGES, LINEAGE_LIST };

export function getInitialDeskQueue(profile: PlayerProfile): {
  firstSingle: SingleTrack;
  anchorBadge: string;
  clerkNote: string;
  seededLineages: LineageId[];
} {
  const key = `${profile.birthEra}:${profile.region}`;
  const entry = parsed.entryMap.get(key);
  const seededLineages: LineageId[] =
    profile.startingLineage !== 'auto'
      ? [profile.startingLineage, ...(entry?.bridgeLineages ?? ['jazz', 'shoegaze-indie'])]
      : entry?.bridgeLineages?.length
        ? entry.bridgeLineages
        : ['punk-postpunk', 'shoegaze-indie', 'artpop-citypop'];

  // Round 1 opens with Local Signature Musician (or chosen starting lineage gateway)
  if (profile.startingLineage !== 'auto') {
    const chosen = ALL_SINGLES.find(
      (s) => s.lineage === profile.startingLineage && s.tier === 1 && !s.id.startsWith('trk-ep-')
    ) ?? ALL_SINGLES[0];
    return {
      firstSingle: chosen,
      anchorBadge: `指定谱系起点 · ${LINEAGES[profile.startingLineage].shortCN}`,
      clerkNote: entry?.clerkNote ?? LINEAGES[profile.startingLineage].tagline,
      seededLineages,
    };
  }

  const localTrack = entry ? SINGLES_BY_ID.get(entry.localSingleId) : undefined;
  return {
    firstSingle: localTrack ?? ALL_SINGLES[0],
    anchorBadge: '入境第一站 · 地方特色代表音乐家',
    clerkNote: entry?.clerkNote ?? '从本土时代记忆切入 RYM 全球流派谱系。',
    seededLineages,
  };
}

export function pickNextSingle(params: {
  profile: PlayerProfile;
  seenIds: Set<string>;
  round: number;
  lastSingle: SingleTrack;
  lastDecision: 'collect' | 'pass';
  steeredLineage: LineageId | null;
  lineageDepth: Record<LineageId, number>;
}): { single: SingleTrack; anchorBadge: string; pivotReason?: string } {
  const { profile, seenIds, round, lastSingle, lastDecision, steeredLineage, lineageDepth } = params;
  const unseen = ALL_SINGLES.filter((s) => !seenIds.has(s.id));
  const pool = unseen.length > 0 ? unseen : ALL_SINGLES;

  // Round 2: Deliver the Global Era Pop Icon of their Birth Era × Region!
  if (round === 2 && !steeredLineage) {
    const ep = parsed.entryMap.get(`${profile.birthEra}:${profile.region}`);
    const globalTrack = ep ? SINGLES_BY_ID.get(ep.globalSingleId) : undefined;
    if (globalTrack && !seenIds.has(globalTrack.id)) {
      return {
        single: globalTrack,
        anchorBadge: '入境第二站 · 当时全球流行锚点',
        pivotReason: '本土与全球流行双坐标校准完成，即将深入 RYM 音乐谱系分支！',
      };
    }
  }

  // Steered manually from RYM Genealogy Rulebook
  if (steeredLineage) {
    const targetDepth = Math.min(3, (lineageDepth[steeredLineage] ?? 0) + 1);
    const match =
      pool.find((s) => s.lineage === steeredLineage && !s.id.startsWith('trk-ep-') && s.tier >= targetDepth) ??
      pool.find((s) => s.lineage === steeredLineage) ??
      pool[0];
    return {
      single: match,
      anchorBadge: `谱系手册调档 · ${LINEAGES[steeredLineage].shortCN} Lv.${match.tier}`,
      pivotReason: `已按馆员指令调取【${LINEAGES[steeredLineage].nameCN}】档案。`,
    };
  }

  if (lastDecision === 'collect') {
    // Progressive deepen in same lineage (tier 1 -> 2 -> 3), then bridge to adjacent
    const nextTier = Math.min(3, lastSingle.tier + 1);
    const deeper =
      pool.find((s) => s.lineage === lastSingle.lineage && !s.id.startsWith('trk-ep-') && s.tier >= nextTier) ??
      pool.find((s) => s.lineage === lastSingle.lineage && !s.id.startsWith('trk-ep-'));
    if (deeper) {
      return {
        single: deeper,
        anchorBadge: `RYM 谱系深潜 · ${LINEAGES[deeper.lineage].shortCN} Lv.${deeper.tier}`,
      };
    }
  }

  // On PASS (or exhausted lineage): smoothly pivot to adjacent RYM lineage!
  const candidates = [...lastSingle.adjacentLineages, ...LINEAGES[lastSingle.lineage].adjacent];
  for (const adjLin of candidates) {
    const pivotPick =
      pool.find((s) => s.lineage === adjLin && !s.id.startsWith('trk-ep-') && s.tier <= 2) ??
      pool.find((s) => s.lineage === adjLin && !s.id.startsWith('trk-ep-'));
    if (pivotPick) {
      return {
        single: pivotPick,
        anchorBadge: `谱系横向变轨 · ${LINEAGES[adjLin].shortCN}`,
        pivotReason:
          lastDecision === 'pass'
            ? `切歌转向：从【${LINEAGES[lastSingle.lineage].shortCN}】平滑切入相邻支流【${LINEAGES[adjLin].nameCN}】`
            : `主干通关延伸：由【${LINEAGES[lastSingle.lineage].shortCN}】跨界桥接至【${LINEAGES[adjLin].nameCN}】`,
      };
    }
  }

  return { single: pool[0], anchorBadge: `RYM 馆藏精选 · ${LINEAGES[pool[0].lineage].shortCN}` };
}

export function pickLoreInterlude(params: {
  activeLineage: LineageId;
  region: RegionId;
  seenLoreIds: Set<string>;
}): CulturalLoreItem | null {
  const unseen = ALL_LORE.filter((l) => !params.seenLoreIds.has(l.id));
  if (unseen.length === 0) return null;
  return (
    unseen.find((l) => l.lineage === params.activeLineage && l.regionAffinity?.includes(params.region)) ??
    unseen.find((l) => l.lineage === params.activeLineage) ??
    unseen[0]
  );
}

export type { BirthEra, RegionId };
