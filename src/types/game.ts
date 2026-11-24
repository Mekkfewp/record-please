export type EraId = '1930s' | '1940s' | '1950s' | '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';

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

// ---- Catalog records, exactly as stored in src/data/catalog.json ----

/** A decade of music, not of birth: `start`..`end` are the first and last year of the decade. */
export interface Era {
  id: EraId;
  label: string;
  start: number;
  end: number;
  /** One line naming what the decade is known for; every part of it is backed by `sources`. */
  caption: string;
  sources: string[];
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
  /** Set when the recording came out as a single and belongs to no album of its time. */
  kind?: 'single';
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
  /** Present only when the recording was found in Apple's catalogue and the match was checked. */
  apple?: AppleMatch;
  links: ListenLinks;
}

export interface AppleMatch {
  trackId: number;
  collectionId: number;
  storefront: string;
  previewUrl: string;
  artworkUrl: string;
  url: string;
  /** Whether Apple's mainland China store carries this recording under the same ids. */
  cn?: boolean;
}

/** Search pages on services where the full track can be played. */
export interface ListenLinks {
  netease: string;
  qq: string;
}

export interface Cell {
  era: EraId;
  region: RegionId;
  global: string;
  local: string;
  bridges: LineageId[];
}

/** A decade and region with no entry cards that could be checked; the start screen greys it out. */
export interface UnfilledCell {
  era: EraId;
  region: RegionId;
  reason: string;
}

export type LoreKind = 'book' | 'film' | 'series';

export interface LoreItem {
  id: string;
  title: string;
  creator: string;
  year: number;
  kind: LoreKind;
  lineage: LineageId;
  /** Artists the item is about. */
  artistIds: string[];
  /** Card genres the item covers as a whole. */
  genres: string[];
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
