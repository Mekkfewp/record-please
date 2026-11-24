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

export interface GrooveConfig {
  bpm: number;
  rootMidi: number;
  mode: 'dorian' | 'minor' | 'major7' | 'mixolydian' | 'phrygian' | 'pentatonic';
  style: LineageId;
  swing?: number;
}

// ---- Catalog records, exactly as stored in src/data/catalog.json ----

export interface Era {
  id: BirthEra;
  label: string;
  windowStart: number;
  windowEnd: number;
}

export interface Region {
  id: RegionId;
  label: string;
}

export interface Lineage {
  id: LineageId;
  name: string;
  nameZh: string;
  adjacent: LineageId[];
}

export interface Artist {
  id: string;
  name: string;
  country: string;
  region: RegionId | null;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  year: number;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  albumId: string;
  year: number;
  genre: string;
  lineage: LineageId | null;
  tier: 1 | 2 | 3;
}

export interface Cell {
  era: BirthEra;
  region: RegionId;
  global: string;
  local: string;
  bridges: LineageId[];
}

export type LoreKind = 'book' | 'film' | 'series';

export interface LoreItem {
  id: string;
  title: string;
  creator: string;
  year: number;
  kind: LoreKind;
  lineage: LineageId;
  artistIds: string[];
  regions: RegionId[];
  line: string;
  source: string;
}

export interface Persona {
  id: string;
  name: string;
  nameEn: string;
  rule: 'lineage' | 'mixed' | 'pop' | 'empty';
  lineage: LineageId | null;
  portrait: Omit<PixelPortraitSpec, 'seed'>;
}

/** One card: exactly one recording, with its own artist and the album it is on. */
export interface Card {
  track: Track;
  artist: Artist;
  album: Album;
}

export interface PlayerProfile {
  inspectorAlias: string;
  birthEra: BirthEra;
  region: RegionId;
  startingLineage: StartingLineageChoice;
}
