import type {
  Album,
  Artist,
  BirthEra,
  Card,
  Cell,
  Era,
  Lineage,
  LineageId,
  LoreItem,
  Persona,
  Region,
  RegionId,
  Track,
} from '../types/game';

/** The shape of src/data/catalog.json; `npm run validate` checks its rules. */
export interface RawCatalog {
  eras: Era[];
  regions: Region[];
  lineages: Lineage[];
  countries: Record<string, string>;
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  cells: Cell[];
  lore: LoreItem[];
  personas: Persona[];
}

/** The catalog with its cross-references resolved. The game rules read only this. */
export interface Catalog {
  eras: Era[];
  regions: Region[];
  lineages: Lineage[];
  lore: LoreItem[];
  personas: Persona[];
  cards: Card[];
  card(id: string): Card;
  cell(era: BirthEra, region: RegionId): Cell;
  era(id: BirthEra): Era;
  region(id: RegionId): Region;
  lineage(id: LineageId): Lineage;
  loreItem(id: string): LoreItem;
  countryLabel(code: string): string;
}

function need<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`catalog.json: no ${what}; run npm run validate`);
  return value;
}

export function buildCatalog(raw: RawCatalog): Catalog {
  const artists = new Map(raw.artists.map((a) => [a.id, a]));
  const albums = new Map(raw.albums.map((a) => [a.id, a]));
  const cards: Card[] = raw.tracks.map((track) => ({
    track,
    artist: need(artists.get(track.artistId), `artist "${track.artistId}" for track "${track.id}"`),
    album: need(albums.get(track.albumId), `album "${track.albumId}" for track "${track.id}"`),
  }));
  const cardsById = new Map(cards.map((c) => [c.track.id, c]));
  const loreById = new Map(raw.lore.map((l) => [l.id, l]));

  return {
    eras: raw.eras,
    regions: raw.regions,
    lineages: raw.lineages,
    lore: raw.lore,
    personas: raw.personas,
    cards,
    card: (id) => need(cardsById.get(id), `track "${id}"`),
    cell: (era, region) =>
      need(
        raw.cells.find((c) => c.era === era && c.region === region),
        `cell for ${era} x ${region}`,
      ),
    era: (id) => need(raw.eras.find((e) => e.id === id), `era "${id}"`),
    region: (id) => need(raw.regions.find((r) => r.id === id), `region "${id}"`),
    lineage: (id) => need(raw.lineages.find((l) => l.id === id), `lineage "${id}"`),
    loreItem: (id) => need(loreById.get(id), `lore item "${id}"`),
    countryLabel: (code) => raw.countries[code] ?? code,
  };
}
