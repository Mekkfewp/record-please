import type { DigRecord, Floor, Genre, RawSlice, Tie } from './types';

/** The slice with its cross-references resolved. The rules read only this. */
export interface Slice {
  label: string;
  genres: Genre[];
  records: DigRecord[];
  doors: DigRecord[];
  genre(id: string): Genre;
  record(id: string): DigRecord;
  /** From the top-level family down to the genre itself. */
  path(genreId: string): Genre[];
  family(genreId: string): Genre;
  /** Ground for a door record; otherwise the record's tier. */
  floorOf(record: DigRecord): Floor;
  /** 0 same genre, 1 the first is inside the second's branch... see `relation`. */
  relation(from: string, to: string): Relation;
  tiesBetween(a: string, b: string): Tie[];
  tiesOf(recordId: string): Tie[];
  countryLabel(code: string): string;
}

/** How genre `to` sits relative to genre `from`. */
export type Relation = 'same' | 'below' | 'sibling' | 'family' | 'elsewhere';

function need<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`slice.json: no ${what}; run npm run validate`);
  return value;
}

export function buildSlice(raw: RawSlice): Slice {
  const genres = new Map(raw.genres.map((g) => [g.id, g]));
  const records = new Map(raw.records.map((r) => [r.id, r]));
  const paths = new Map<string, Genre[]>();
  const path = (id: string): Genre[] => {
    const known = paths.get(id);
    if (known) return known;
    const genre = need(genres.get(id), `genre "${id}"`);
    const result = genre.parent ? [...path(genre.parent), genre] : [genre];
    paths.set(id, result);
    return result;
  };
  const ties = new Map<string, Tie[]>();
  for (const tie of raw.ties) {
    for (const id of [tie.a, tie.b]) {
      const list = ties.get(id);
      if (list) list.push(tie);
      else ties.set(id, [tie]);
    }
  }

  return {
    label: raw.label,
    genres: raw.genres,
    records: raw.records,
    doors: raw.records.filter((r) => r.door),
    genre: (id) => need(genres.get(id), `genre "${id}"`),
    record: (id) => need(records.get(id), `record "${id}"`),
    path,
    family: (id) => path(id)[0],
    floorOf: (record) => (record.door ? 0 : record.tier),
    relation: (from, to) => {
      if (from === to) return 'same';
      const a = path(from);
      const b = path(to);
      if (b.length > a.length && b[a.length - 1].id === from) return 'below';
      if (a[0].id !== b[0].id) return 'elsewhere';
      const parentA = a[a.length - 2]?.id;
      const parentB = b[b.length - 2]?.id;
      return parentA !== undefined && parentA === parentB ? 'sibling' : 'family';
    },
    tiesBetween: (a, b) => (ties.get(a) ?? []).filter((t) => t.a === b || t.b === b),
    tiesOf: (id) => ties.get(id) ?? [],
    countryLabel: (code) => raw.countries[code] ?? code,
  };
}
