import rawCatalog from './music-catalog.json';
import { hashSeed } from '../engine/pixelArt';
import type {
  AlbumCoverArchetype,
  BirthEra,
  CulturalLoreItem,
  GrooveConfig,
  LineageId,
  LoreMediaKind,
  PixelPortraitSpec,
  RegionId,
} from '../types/game';
import type { BundleTriple } from './builder';

export const JSON_REGION_MAP: Record<string, RegionId> = {
  'cn-mainland': 'cn-mainland', 'hk-tw': 'hk-tw', jp: 'japan',
  us: 'usa', uk: 'uk', 'eu-continent': 'europe', latam: 'latam',
};

export const JSON_LINEAGE_MAP: Record<string, LineageId> = {
  jazz: 'jazz',
  'punk-post-punk': 'punk-postpunk',
  'indie-shoegaze-post-rock': 'shoegaze-indie',
  'electronic-club': 'electronic-idm',
  'hip-hop-beats': 'hiphop',
  'art-pop-city-pop': 'artpop-citypop',
  'folk-psych-regional': 'folk-psych',
  'heavy-industrial-avant': 'heavy-industrial',
};

const LINEAGE_VISUALS: Record<LineageId, {
  archetype: AlbumCoverArchetype;
  colors: [string, string, string];
  portrait: Omit<PixelPortraitSpec, 'seed'>;
  bpm: number;
  mode: GrooveConfig['mode'];
}> = {
  jazz: { archetype: 'blue-note', colors: ['#1b4965', '#102536', '#e0a44c'], portrait: { hairStyle: 'jazz-beret', glasses: 'shades', outfit: 'jazz-suit', prop: 'sax', accentColor: '#e0a44c', bgStyle: 'smoky' }, bpm: 112, mode: 'dorian' },
  'punk-postpunk': { archetype: 'joy-waveform', colors: ['#16181d', '#343a42', '#e04848'], portrait: { hairStyle: 'spiky-punk', glasses: 'shades', outfit: 'leather-jacket', prop: 'guitar', accentColor: '#e04848', bgStyle: 'booth' }, bpm: 134, mode: 'minor' },
  'shoegaze-indie': { archetype: 'shoegaze-wash', colors: ['#5c224c', '#9e3b76', '#ff94bd'], portrait: { hairStyle: 'shoegaze-bangs', glasses: 'none', outfit: 'flannel-cardigan', prop: 'guitar', accentColor: '#ff94bd', bgStyle: 'smoky' }, bpm: 106, mode: 'major7' },
  'electronic-idm': { archetype: 'electronic-grid', colors: ['#12262e', '#264e59', '#4ce0c2'], portrait: { hairStyle: 'hoodie-producer', glasses: 'visor', outfit: 'turtleneck', prop: 'synth-patch', accentColor: '#4ce0c2', bgStyle: 'neon' }, bpm: 122, mode: 'dorian' },
  hiphop: { archetype: 'hiphop-crate', colors: ['#3d291d', '#6e472b', '#f2b24c'], portrait: { hairStyle: 'hiphop-cap', glasses: 'thick-rim', outfit: 'tracksuit', prop: 'headphones', accentColor: '#f2b24c', bgStyle: 'warm-paper' }, bpm: 92, mode: 'minor' },
  'artpop-citypop': { archetype: 'city-neon', colors: ['#241f4d', '#6e2e63', '#ffd166'], portrait: { hairStyle: 'city-bob', glasses: 'round-specs', outfit: 'haori-shirt', prop: 'mic', accentColor: '#ffd166', bgStyle: 'neon' }, bpm: 104, mode: 'major7' },
  'folk-psych': { archetype: 'psych-mandala', colors: ['#26452b', '#5e7338', '#e6c455'], portrait: { hairStyle: 'long-psych', glasses: 'round-specs', outfit: 'workwear-denim', prop: 'guitar', accentColor: '#a8cf45', bgStyle: 'warm-paper' }, bpm: 96, mode: 'mixolydian' },
  'heavy-industrial': { archetype: 'industrial-brutalist', colors: ['#241818', '#52322c', '#e05838'], portrait: { hairStyle: 'retro-mullet', glasses: 'none', outfit: 'leather-jacket', prop: 'guitar', accentColor: '#e05838', bgStyle: 'crimson' }, bpm: 138, mode: 'phrygian' },
};

export function buildCatalogFromJson(): {
  bundles: BundleTriple[];
  loreItems: CulturalLoreItem[];
  entryMap: Map<string, { globalSingleId: string; localSingleId: string; clerkNote: string; bridgeLineages: LineageId[] }>;
} {
  const bundles: BundleTriple[] = [];
  const loreItems: CulturalLoreItem[] = [];
  const entryMap = new Map<string, { globalSingleId: string; localSingleId: string; clerkNote: string; bridgeLineages: LineageId[] }>();

  // 1. Convert all 38 RYM Lineage progressive nodes
  for (const lin of rawCatalog.lineages) {
    const lineageId = JSON_LINEAGE_MAP[lin.id] ?? 'shoegaze-indie';
    const vis = LINEAGE_VISUALS[lineageId];

    for (const lw of lin.loreWorks ?? []) {
      const kind: LoreMediaKind =
        lw.type.includes('纪录') ? 'documentary' : lw.type.includes('电影') ? 'film' : lw.type.includes('口述') || lw.type.includes('自传') ? 'oral-history' : 'book';
      loreItems.push({
        id: lw.id,
        title: `《${lw.titleZh}》`,
        originalTitle: lw.titleOriginal,
        creator: lw.creator,
        year: lw.year,
        kind,
        lineage: lineageId,
        summary: lw.summaryZh,
        whyEssential: `所属谱系：${lin.nameZh} (${lin.nameEn}) 权威延伸档案`,
        quote: `“${lw.titleOriginal} (${lw.year}) — ${lw.type}”`,
        coverSeed: lw.id,
        accentColor: vis.colors[2],
        secondaryColor: vis.colors[0],
      });
    }

    for (const node of lin.nodes) {
      const h = hashSeed(node.id);
      const tier = (Math.min(3, Math.max(1, Math.ceil(node.tier / 1.7))) as 1 | 2 | 3);
      const adj = (node.nextLineageHints ?? [])
        .map((x: { targetLineageId: string }) => JSON_LINEAGE_MAP[x.targetLineageId])
        .filter(Boolean) as LineageId[];
      const cover = {
        seed: `node-cov-${node.id}`,
        archetype: vis.archetype,
        primaryColor: vis.colors[0],
        secondaryColor: vis.colors[1],
        accentColor: vis.colors[2],
        hasObiStrip: node.artist.origin.includes('JP') || node.artist.origin.includes('Japan'),
        codeLabel: `RYM-${node.single.year}`,
      };
      const artistId = `art-${node.id}`;
      const albumId = `alb-${node.id}`;
      bundles.push({
        artist: {
          id: artistId,
          name: `${node.artist.name} (${node.artist.nameZh})`,
          region: 'usa',
          originCity: node.artist.origin,
          activeYears: node.artist.activeEra,
          primaryLineage: lineageId,
          portrait: { ...vis.portrait, seed: `prt-${node.id}`, skinTone: h % 5 },
          sceneStory: node.artist.significanceZh,
          sonicTraits: [...node.rymTags, `${lin.nameZh} 核心坐标`],
          iconicInstruments: `${node.subgenreZh} 经典声学配置`,
        },
        album: {
          id: albumId,
          title: node.album.essential.title,
          artistId,
          artistName: node.album.essential.artist,
          year: node.album.essential.year,
          lineage: lineageId,
          subgenre: `${node.subgenreZh} (${node.subgenreEn})`,
          rymScore: (4.12 + ((h % 38) / 100)).toFixed(2),
          rymStatus: `RYM 核心必听 · ${node.subgenreEn}`,
          cover,
          essentialTracks: [node.single.title, `《${node.album.essential.title}》主打曲`, `进阶：${node.album.advancedFollowUp.title}`],
          whyItMatters: node.album.essential.reasonZh,
          catalogNo: `RYM-${node.album.essential.year}-${node.id.slice(0, 4).toUpperCase()}`,
          advancedFollowUp: {
            title: node.album.advancedFollowUp.title,
            artist: node.album.advancedFollowUp.artist,
            year: node.album.advancedFollowUp.year,
            reason: node.album.advancedFollowUp.reasonZh,
          },
        },
        single: {
          id: `trk-node-${node.id}`,
          title: node.single.title,
          artistId,
          artistName: node.single.artist,
          albumId,
          albumTitle: node.album.essential.title,
          year: node.single.year,
          region: 'usa',
          eraRelevance: ['1970s', '1980s', '1990s', '2000s'],
          lineage: lineageId,
          subgenre: `${node.subgenreZh} · ${node.subgenreEn}`,
          tier,
          rymRating: (4.1 + ((h % 40) / 100)).toFixed(2),
          rymDescriptors: node.rymTags,
          vibeCN: node.single.hookZh,
          whyRecommended: node.nextLineageHints?.[0]?.reasonZh ?? lin.summaryZh,
          adjacentLineages: adj.length > 0 ? adj : ['jazz', 'shoegaze-indie'],
          groove: { bpm: vis.bpm + ((h % 14) - 7), rootMidi: 55 + (h % 10), mode: vis.mode, style: lineageId },
          cover,
        },
      });
    }
  }

  // 2. Convert all 28 Era × Region Global Pop + Local Signature entry points
  for (const ep of rawCatalog.entryPoints) {
    const era = ep.eraId as BirthEra;
    const region = JSON_REGION_MAP[ep.regionId] ?? 'cn-mainland';
    const bridges = (ep.bridgeLineageIds ?? []).map((id: string) => JSON_LINEAGE_MAP[id]).filter(Boolean) as LineageId[];
    const primaryLin = bridges[0] ?? 'artpop-citypop';
    const secondLin = bridges[1] ?? primaryLin;
    const visA = LINEAGE_VISUALS[primaryLin];
    const visB = LINEAGE_VISUALS[secondLin];

    const globalId = `trk-ep-global-${ep.id}`;
    const localId = `trk-ep-local-${ep.id}`;

    // Local Signature Bundle
    const locCov = { seed: `loc-${ep.id}`, archetype: visA.archetype, primaryColor: visA.colors[0], secondaryColor: visA.colors[1], accentColor: visA.colors[2], hasObiStrip: region === 'japan' || region === 'cn-mainland' || region === 'hk-tw' };
    bundles.push({
      artist: {
        id: `art-loc-${ep.id}`, name: ep.localSignatureMusician.artist, region, originCity: `${ep.regionId.toUpperCase()} 本土场景`,
        activeYears: ep.formativeYears, primaryLineage: primaryLin,
        portrait: { ...visA.portrait, seed: `prt-loc-${ep.id}` },
        sceneStory: ep.clerkNoteZh, sonicTraits: ep.localSignatureMusician.rymGenres, iconicInstruments: '本土时代标志性配器',
      },
      album: {
        id: `alb-loc-${ep.id}`, title: ep.localSignatureMusician.album, artistId: `art-loc-${ep.id}`, artistName: ep.localSignatureMusician.artist,
        year: ep.localSignatureMusician.year, lineage: primaryLin, subgenre: ep.localSignatureMusician.rymGenres.join(' / '),
        rymScore: '4.18', rymStatus: '本土黄金记忆代表专辑', cover: locCov,
        essentialTracks: [ep.localSignatureMusician.single, ep.localSignatureMusician.album],
        whyItMatters: ep.clerkNoteZh, catalogNo: `LOC-${ep.localSignatureMusician.year}`,
      },
      single: {
        id: localId, title: ep.localSignatureMusician.single, artistId: `art-loc-${ep.id}`, artistName: ep.localSignatureMusician.artist,
        albumId: `alb-loc-${ep.id}`, albumTitle: ep.localSignatureMusician.album, year: ep.localSignatureMusician.year,
        region, eraRelevance: [era], isLocalSignature: true, lineage: primaryLin,
        subgenre: ep.localSignatureMusician.rymGenres.join(' / '), tier: 1, rymRating: '4.18',
        rymDescriptors: [...ep.localSignatureMusician.rymGenres, '本土记忆锚点'],
        vibeCN: `【${ep.formativeYears} 本土成长印记】出自《${ep.localSignatureMusician.album}》，一秒唤醒在地青春声场。`,
        whyRecommended: ep.clerkNoteZh, adjacentLineages: bridges.slice(1),
        groove: { bpm: visA.bpm, rootMidi: 60, mode: visA.mode, style: primaryLin }, cover: locCov,
      },
    });

    // Global Pop Icon Bundle
    const glbCov = { seed: `glb-${ep.id}`, archetype: visB.archetype, primaryColor: visB.colors[1], secondaryColor: visB.colors[0], accentColor: visB.colors[2] };
    bundles.push({
      artist: {
        id: `art-glb-${ep.id}`, name: ep.globalPopIcon.artist, region, originCity: '全球时代流行风向标',
        activeYears: ep.formativeYears, primaryLineage: secondLin,
        portrait: { ...visB.portrait, seed: `prt-glb-${ep.id}` },
        sceneStory: `在 ${ep.formativeYears} 黄金听歌窗口席卷全球电台与随身听，是你跨入更深层 RYM 谱系的天然跳板。`,
        sonicTraits: ['时代标志性制作', '高传唱旋律钩子', '跨流派破圈影响力'], iconicInstruments: '黄金录音室全编制',
      },
      album: {
        id: `alb-glb-${ep.id}`, title: ep.globalPopIcon.work, artistId: `art-glb-${ep.id}`, artistName: ep.globalPopIcon.artist,
        year: ep.globalPopIcon.year, lineage: secondLin, subgenre: 'Global Formative Icon',
        rymScore: '4.15', rymStatus: `${ep.formativeYears} 全球时代记忆名作`, cover: glbCov,
        essentialTracks: [ep.globalPopIcon.work], whyItMatters: ep.clerkNoteZh, catalogNo: `GLB-${ep.globalPopIcon.year}`,
      },
      single: {
        id: globalId, title: ep.globalPopIcon.work, artistId: `art-glb-${ep.id}`, artistName: ep.globalPopIcon.artist,
        albumId: `alb-glb-${ep.id}`, albumTitle: ep.globalPopIcon.work, year: ep.globalPopIcon.year,
        region, eraRelevance: [era], isGlobalEraPop: true, lineage: secondLin,
        subgenre: 'Global Era Pop / Crossover', tier: 1, rymRating: '4.15',
        rymDescriptors: ['时代流行记忆', ep.formativeYears, 'RYM 跨界跳板'],
        vibeCN: `【${ep.formativeYears} 当时全球流行】无论磁带、CD 还是流媒体，这都是属于你成长年代的世界回响。`,
        whyRecommended: ep.clerkNoteZh, adjacentLineages: bridges,
        groove: { bpm: visB.bpm + 4, rootMidi: 62, mode: visB.mode, style: secondLin }, cover: glbCov,
      },
    });

    entryMap.set(`${era}:${region}`, { globalSingleId: globalId, localSingleId: localId, clerkNote: ep.clerkNoteZh, bridgeLineages: bridges });
  }

  return { bundles, loreItems, entryMap };
}
