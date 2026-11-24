export type BirthEra = '1970s' | '1980s' | '1990s' | '2000s';

export type RegionId =
  | 'cn-mainland'
  | 'hk-tw'
  | 'japan'
  | 'usa'
  | 'uk'
  | 'europe'
  | 'latam';

export type LineageId =
  | 'jazz'
  | 'punk-postpunk'
  | 'shoegaze-indie'
  | 'electronic-idm'
  | 'hiphop'
  | 'artpop-citypop'
  | 'folk-psych'
  | 'heavy-industrial';

export type StartingLineageChoice = 'auto' | LineageId;

export type PortraitHairStyle =
  | 'afro'
  | 'spiky-punk'
  | 'shoegaze-bangs'
  | 'city-bob'
  | 'jazz-beret'
  | 'hiphop-cap'
  | 'hoodie-producer'
  | 'long-psych'
  | 'new-wave-crop'
  | 'pompadour'
  | 'locs'
  | 'retro-mullet';

export type PortraitGlasses = 'none' | 'thick-rim' | 'shades' | 'round-specs' | 'visor';

export type PortraitOutfit =
  | 'leather-jacket'
  | 'jazz-suit'
  | 'flannel-cardigan'
  | 'turtleneck'
  | 'tracksuit'
  | 'haori-shirt'
  | 'workwear-denim';

export type PortraitProp =
  | 'none'
  | 'sax'
  | 'guitar'
  | 'headphones'
  | 'mic'
  | 'synth-patch'
  | 'trumpet';

export interface PixelPortraitSpec {
  seed: string;
  skinTone?: number; // 0..4
  hairStyle?: PortraitHairStyle;
  hairColor?: string;
  glasses?: PortraitGlasses;
  outfit?: PortraitOutfit;
  prop?: PortraitProp;
  accentColor?: string;
  bgStyle?: 'booth' | 'smoky' | 'neon' | 'warm-paper' | 'crimson';
  facialHair?: 'none' | 'stubble' | 'goatee' | 'mustache';
}

export type AlbumCoverArchetype =
  | 'blue-note'
  | 'joy-waveform'
  | 'shoegaze-wash'
  | 'punk-ransom'
  | 'city-neon'
  | 'electronic-grid'
  | 'hiphop-crate'
  | 'psych-mandala'
  | 'industrial-brutalist'
  | 'minimal-bauhaus';

export interface PixelCoverSpec {
  seed: string;
  archetype: AlbumCoverArchetype;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  hasObiStrip?: boolean;
  codeLabel?: string;
}

export type LoreMediaKind = 'book' | 'documentary' | 'oral-history' | 'film';

export interface GrooveConfig {
  bpm: number;
  rootMidi: number;
  mode: 'dorian' | 'minor' | 'major7' | 'mixolydian' | 'phrygian' | 'pentatonic';
  style: LineageId;
  swing?: number;
}

export interface ArtistDossier {
  id: string;
  name: string;
  nameSub?: string;
  region: RegionId;
  originCity: string;
  activeYears: string;
  primaryLineage: LineageId;
  portrait: PixelPortraitSpec;
  sceneStory: string;
  sonicTraits: string[];
  iconicInstruments: string;
}

export interface AlbumRecord {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  year: number;
  lineage: LineageId;
  subgenre: string;
  rymScore: string;
  rymStatus: string;
  cover: PixelCoverSpec;
  essentialTracks: string[];
  whyItMatters: string;
  catalogNo: string;
  advancedFollowUp?: {
    title: string;
    artist: string;
    year: number;
    reason: string;
  };
}

export type EntryAnchorKind = 'era-pop' | 'local-hero' | 'lineage-gateway' | 'lineage-deep' | 'lineage-cult';

export interface SingleTrack {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  year: number;
  region: RegionId;
  eraRelevance: BirthEra[];
  isGlobalEraPop?: boolean;
  isLocalSignature?: boolean;
  lineage: LineageId;
  subgenre: string;
  tier: 1 | 2 | 3; // 1 = Gateway, 2 = Core Subgenre, 3 = Deep / Cult
  rymRating: string;
  rymDescriptors: string[];
  vibeCN: string;
  whyRecommended: string;
  adjacentLineages: LineageId[];
  groove: GrooveConfig;
  cover: PixelCoverSpec;
}

export interface CulturalLoreItem {
  id: string;
  title: string;
  originalTitle?: string;
  creator: string;
  year: number;
  kind: LoreMediaKind;
  lineage: LineageId;
  regionAffinity?: RegionId[];
  summary: string;
  whyEssential: string;
  quote: string;
  coverSeed: string;
  accentColor: string;
  secondaryColor: string;
}

export interface LineageNodeInfo {
  tier: 1 | 2 | 3;
  nameCN: string;
  nameEN: string;
  eraSpan: string;
  summary: string;
}

export interface LineageMeta {
  id: LineageId;
  nameCN: string;
  nameEN: string;
  shortCN: string;
  badgeColor: string;
  inkColor: string;
  tagline: string;
  nodes: [LineageNodeInfo, LineageNodeInfo, LineageNodeInfo];
  adjacent: LineageId[];
}

export interface EraMeta {
  id: BirthEra;
  labelCN: string;
  formativeWindow: string;
  mediaMemory: string;
  description: string;
}

export interface RegionMeta {
  id: RegionId;
  labelCN: string;
  labelEN: string;
  stampCode: string;
  sceneSummary: string;
}

export interface PlayerProfile {
  inspectorAlias: string;
  birthEra: BirthEra;
  region: RegionId;
  startingLineage: StartingLineageChoice;
}

export interface StampHistoryEntry {
  round: number;
  single: SingleTrack;
  decision: 'collect' | 'pass';
  anchorLabel: string;
  timestamp: number;
}
