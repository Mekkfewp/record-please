import type {
  AlbumCoverArchetype,
  AlbumRecord,
  ArtistDossier,
  BirthEra,
  GrooveConfig,
  LineageId,
  PixelPortraitSpec,
  RegionId,
  SingleTrack,
} from '../types/game';

export interface CompactBundleInput {
  key: string;
  singleTitle: string;
  year: number;
  region: RegionId;
  eras: BirthEra[];
  isGlobalEraPop?: boolean;
  isLocalSignature?: boolean;
  lineage: LineageId;
  subgenre: string;
  tier: 1 | 2 | 3;
  rymRating: string;
  descriptors: string[];
  vibeCN: string;
  whyRecommended: string;
  adjacent: LineageId[];
  bpm: number;
  rootMidi: number;
  mode: GrooveConfig['mode'];
  artistName: string;
  originCity: string;
  activeYears: string;
  sceneStory: string;
  sonicTraits: string[];
  instruments: string;
  portrait: Omit<PixelPortraitSpec, 'seed'>;
  albumTitle: string;
  albumYear?: number;
  rymStatus: string;
  essentialTracks: string[];
  whyItMatters: string;
  archetype: AlbumCoverArchetype;
  colors: [string, string, string];
  hasObi?: boolean;
}

export interface BundleTriple {
  single: SingleTrack;
  artist: ArtistDossier;
  album: AlbumRecord;
}

export function makeBundle(b: CompactBundleInput): BundleTriple {
  const artistId = `art-${b.key}`;
  const albumId = `alb-${b.key}`;
  const singleId = `trk-${b.key}`;
  const cover = {
    seed: `cov-${b.key}`,
    archetype: b.archetype,
    primaryColor: b.colors[0],
    secondaryColor: b.colors[1],
    accentColor: b.colors[2],
    hasObiStrip: b.hasObi,
    codeLabel: `RP-${b.year}`,
  };
  return {
    artist: {
      id: artistId,
      name: b.artistName,
      region: b.region,
      originCity: b.originCity,
      activeYears: b.activeYears,
      primaryLineage: b.lineage,
      portrait: { seed: `prt-${b.key}`, ...b.portrait },
      sceneStory: b.sceneStory,
      sonicTraits: b.sonicTraits,
      iconicInstruments: b.instruments,
    },
    album: {
      id: albumId,
      title: b.albumTitle,
      artistId,
      artistName: b.artistName,
      year: b.albumYear ?? b.year,
      lineage: b.lineage,
      subgenre: b.subgenre,
      rymScore: b.rymRating,
      rymStatus: b.rymStatus,
      cover,
      essentialTracks: b.essentialTracks,
      whyItMatters: b.whyItMatters,
      catalogNo: `RYM-${b.year}-${b.key.slice(0, 4).toUpperCase()}`,
    },
    single: {
      id: singleId,
      title: b.singleTitle,
      artistId,
      artistName: b.artistName,
      albumId,
      albumTitle: b.albumTitle,
      year: b.year,
      region: b.region,
      eraRelevance: b.eras,
      isGlobalEraPop: b.isGlobalEraPop,
      isLocalSignature: b.isLocalSignature,
      lineage: b.lineage,
      subgenre: b.subgenre,
      tier: b.tier,
      rymRating: b.rymRating,
      rymDescriptors: b.descriptors,
      vibeCN: b.vibeCN,
      whyRecommended: b.whyRecommended,
      adjacentLineages: b.adjacent,
      groove: { bpm: b.bpm, rootMidi: b.rootMidi, mode: b.mode, style: b.lineage },
      cover,
    },
  };
}
