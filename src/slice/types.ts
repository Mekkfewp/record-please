import type { AppleMatch, ListenLinks } from '../types/game';

/** One node of the genre tree. Names and parent-child structure follow Rate Your Music. */
export interface Genre {
  id: string;
  name: string;
  parent: string | null;
}

export type Tier = 1 | 2 | 3;
export type Floor = 0 | 1 | 2 | 3;

/** Where a looked-up source puts the record: the genre it names and the page that says so. */
export interface Placement {
  by: 'wikipedia' | 'musicbrainz';
  /** The source's own word for the genre. */
  term: string;
  url: string;
}

/** One card: one recording from one record. */
export interface DigRecord {
  id: string;
  artist: string;
  /** ISO country code of the artist: GB or US in this slice. */
  country: string;
  /** The record the recording is on. */
  title: string;
  kind: 'album' | 'ep' | 'single';
  year: number;
  /** The recording that plays. */
  track: string;
  genre: string;
  /** 1 = the genre's best-known records, 2 = known inside the genre, 3 = obscure. */
  tier: Tier;
  /** A record most players already know; a game starts from one of these. */
  door?: boolean;
  placed: Placement;
  apple?: AppleMatch;
  links: ListenLinks;
}

/** A looked-up relation between two records in the slice. */
export interface Tie {
  a: string;
  b: string;
  kind: 'producer' | 'label' | 'member' | 'engineer' | 'sample' | 'cover';
  /** The person, band or label the two records share, as the source writes it. */
  name: string;
  source: string;
}

/** The shape of src/data/slice.json. */
export interface RawSlice {
  label: string;
  yearStart: number;
  yearEnd: number;
  countries: Record<string, string>;
  genres: Genre[];
  records: DigRecord[];
  ties: Tie[];
}
