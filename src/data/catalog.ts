import raw from './catalog.json';
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

// catalog.json is the single source of truth; `npm run validate` checks its shape and rules.
const catalog = raw as unknown as {
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
};

export const ERAS: Era[] = catalog.eras;
export const REGIONS: Region[] = catalog.regions;
export const LINEAGE_LIST: Lineage[] = catalog.lineages;
export const LINEAGES = Object.fromEntries(catalog.lineages.map((l) => [l.id, l])) as Record<LineageId, Lineage>;
export const LORE: LoreItem[] = catalog.lore;
export const PERSONAS: Persona[] = catalog.personas;

const artistsById = new Map(catalog.artists.map((a) => [a.id, a]));
const albumsById = new Map(catalog.albums.map((a) => [a.id, a]));

function toCard(track: Track): Card {
  const artist = artistsById.get(track.artistId);
  const album = albumsById.get(track.albumId);
  if (!artist || !album) {
    throw new Error(`catalog.json: track "${track.id}" has no artist or album; run npm run validate`);
  }
  return { track, artist, album };
}

export const CARDS: Card[] = catalog.tracks.map(toCard);
const cardsById = new Map(CARDS.map((c) => [c.track.id, c]));

export function getCard(trackId: string): Card {
  const card = cardsById.get(trackId);
  if (!card) throw new Error(`catalog.json: no track "${trackId}"`);
  return card;
}

export function getCell(era: BirthEra, region: RegionId): Cell {
  const cell = catalog.cells.find((c) => c.era === era && c.region === region);
  if (!cell) throw new Error(`catalog.json: no cell for ${era} x ${region}`);
  return cell;
}

export function getEra(id: BirthEra): Era {
  return ERAS.find((e) => e.id === id) ?? ERAS[0];
}

export function getRegion(id: RegionId): Region {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}

export function countryLabel(code: string): string {
  return catalog.countries[code] ?? code;
}
