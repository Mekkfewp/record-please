#!/usr/bin/env node
// Validates src/data/catalog.json. Exits 1 on any error.
// Usage: node scripts/validate-catalog.mjs [path-to-catalog.json]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(process.argv[2] ?? resolve(here, '../src/data/catalog.json'));
const catalog = JSON.parse(readFileSync(file, 'utf8'));

const errors = [];
const fail = (rule, message) => errors.push(`[${rule}] ${message}`);

const norm = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');

const byId = (list, kind) => {
  const map = new Map();
  for (const item of list) {
    if (map.has(item.id)) fail('duplicate-id', `${kind} id "${item.id}" appears more than once`);
    map.set(item.id, item);
  }
  return map;
};

const eras = byId(catalog.eras, 'era');
const regions = byId(catalog.regions, 'region');
const lineages = byId(catalog.lineages, 'lineage');
const artists = byId(catalog.artists, 'artist');
const albums = byId(catalog.albums, 'album');
const tracks = byId(catalog.tracks, 'track');

// 1. Merged fields: one card is one recording by one artist on one album.
const MERGE_MARKS = [' / ', '／', '、', ';', '；', '\n', ' | '];
const checkMerged = (kind, id, field, value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    fail('merged-field', `${kind} "${id}" has an empty or non-string ${field}`);
    return;
  }
  const mark = MERGE_MARKS.find((m) => value.includes(m));
  if (mark) fail('merged-field', `${kind} "${id}" ${field} "${value}" joins several items with "${mark.trim()}"`);
};
for (const a of catalog.artists) checkMerged('artist', a.id, 'name', a.name);
for (const a of catalog.albums) {
  checkMerged('album', a.id, 'title', a.title);
  if (typeof a.artistId !== 'string') fail('merged-field', `album "${a.id}" must have exactly one artistId`);
  if (!Number.isInteger(a.year)) fail('merged-field', `album "${a.id}" must have exactly one integer year`);
}
for (const t of catalog.tracks) {
  checkMerged('track', t.id, 'title', t.title);
  if (typeof t.artistId !== 'string') fail('merged-field', `track "${t.id}" must have exactly one artistId`);
  if (typeof t.albumId !== 'string') fail('merged-field', `track "${t.id}" must have exactly one albumId`);
  if (!Number.isInteger(t.year)) fail('merged-field', `track "${t.id}" must have exactly one integer year`);
}

// 2. Duplicates.
const seen = (rule, label) => {
  const map = new Map();
  return (key, id) => {
    if (map.has(key)) fail(rule, `${label}: "${id}" duplicates "${map.get(key)}"`);
    else map.set(key, id);
  };
};
const seenArtist = seen('duplicate-artist', 'same artist name');
for (const a of catalog.artists) seenArtist(norm(a.name), a.id);
const seenAlbum = seen('duplicate-album', 'same album by the same artist');
for (const a of catalog.albums) seenAlbum(`${a.artistId}|${norm(a.title)}`, a.id);
const seenRecording = seen('duplicate-recording', 'same recording');
for (const t of catalog.tracks) seenRecording(`${t.artistId}|${norm(t.title)}`, t.id);

// 3. References, and the album must be by the card's artist.
for (const a of catalog.artists) {
  if (!catalog.countries[a.country]) fail('reference', `artist "${a.id}" has unknown country "${a.country}"`);
  if (a.region !== null && !regions.has(a.region)) fail('reference', `artist "${a.id}" has unknown region "${a.region}"`);
}
for (const a of catalog.albums) {
  if (!artists.has(a.artistId)) fail('reference', `album "${a.id}" points to missing artist "${a.artistId}"`);
}
const usedAlbums = new Set();
const usedArtists = new Set();
for (const t of catalog.tracks) {
  const artist = artists.get(t.artistId);
  const album = albums.get(t.albumId);
  if (!artist) fail('reference', `track "${t.id}" points to missing artist "${t.artistId}"`);
  if (!album) fail('reference', `track "${t.id}" points to missing album "${t.albumId}"`);
  if (artist && album && album.artistId !== t.artistId) {
    fail('album-artist', `track "${t.id}" is by "${t.artistId}" but its album "${album.id}" is by "${album.artistId}"`);
  }
  if (album && Number.isInteger(t.year) && t.year > album.year) {
    fail('year', `track "${t.id}" (${t.year}) is dated after its album "${album.id}" (${album.year})`);
  }
  if (t.lineage !== null && !lineages.has(t.lineage)) fail('reference', `track "${t.id}" has unknown lineage "${t.lineage}"`);
  if (![1, 2, 3].includes(t.tier)) fail('reference', `track "${t.id}" tier must be 1, 2 or 3`);
  if (typeof t.genre !== 'string' || !t.genre) fail('reference', `track "${t.id}" needs a genre`);
  usedAlbums.add(t.albumId);
  usedArtists.add(t.artistId);
}
for (const a of catalog.albums) if (!usedAlbums.has(a.id)) fail('orphan', `album "${a.id}" has no track`);
for (const a of catalog.artists) if (!usedArtists.has(a.id)) fail('orphan', `artist "${a.id}" has no track`);
for (const l of catalog.lineages) {
  for (const adj of l.adjacent) if (!lineages.has(adj)) fail('reference', `lineage "${l.id}" lists unknown neighbour "${adj}"`);
  const pool = catalog.tracks.filter((t) => t.lineage === l.id);
  if (pool.length < 7) fail('lineage-pool', `lineage "${l.id}" has only ${pool.length} cards; a 9-card game needs at least 7`);
}

// 4. Every decade x region cell has exactly its two entry cards.
const cellKeys = new Map();
const entrySlots = new Map();
for (const c of catalog.cells) {
  const key = `${c.era} x ${c.region}`;
  if (!eras.has(c.era)) fail('cell', `cell "${key}" has unknown era`);
  if (!regions.has(c.region)) fail('cell', `cell "${key}" has unknown region`);
  if (cellKeys.has(key)) fail('cell', `cell "${key}" is defined twice`);
  cellKeys.set(key, c);
  const era = eras.get(c.era);
  for (const slot of ['global', 'local']) {
    const track = tracks.get(c[slot]);
    if (!track) {
      fail('cell', `cell "${key}" has no valid ${slot} entry card (got "${c[slot]}")`);
      continue;
    }
    if (entrySlots.has(track.id)) fail('cell', `track "${track.id}" is an entry card for both "${entrySlots.get(track.id)}" and "${key}"`);
    entrySlots.set(track.id, key);
    if (era && (track.year < era.windowStart || track.year > era.windowEnd)) {
      fail('cell', `cell "${key}" ${slot} card "${track.id}" (${track.year}) is outside the listening window ${era.windowStart}-${era.windowEnd}`);
    }
    const artist = artists.get(track.artistId);
    if (slot === 'local' && artist && artist.region !== c.region) {
      fail('cell', `cell "${key}" local card "${track.id}" is by an artist from region "${artist.region}"`);
    }
  }
  if (c.global === c.local) fail('cell', `cell "${key}" uses the same card for global and local`);
  if (!Array.isArray(c.bridges) || c.bridges.length === 0) fail('cell', `cell "${key}" needs at least one bridge lineage`);
  for (const b of c.bridges ?? []) if (!lineages.has(b)) fail('cell', `cell "${key}" has unknown bridge "${b}"`);
}
for (const era of catalog.eras) {
  for (const region of catalog.regions) {
    const key = `${era.id} x ${region.id}`;
    if (!cellKeys.has(key)) fail('cell', `cell "${key}" is missing: it needs one global and one local entry card`);
  }
}

// 5. No ratings, rankings or claims of being official anywhere in the data.
const BANNED_KEY = /rym|rating|score|rank|chart/i;
const BANNED_TEXT = /\bRYM\b|rate ?your ?music|OFFICIAL|评分|榜首|排名|总榜|\b[0-5]\.\d{2}\b/i;
const walk = (value, path) => {
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (BANNED_KEY.test(k)) fail('rating', `${path}.${k}: rating or ranking fields are not allowed`);
      walk(v, `${path}.${k}`);
    }
  } else if (typeof value === 'string' && !/\.source$|\.(apple|links)\.\w+$/.test(path) && BANNED_TEXT.test(value)) {
    fail('rating', `${path}: "${value}" reads like a rating, ranking or official claim`);
  }
};
walk(catalog, 'catalog');

// 6. Lore: one true line each, with a source.
const loreIds = byId(catalog.lore, 'lore');
for (const l of catalog.lore) {
  checkMerged('lore', l.id, 'title', l.title);
  if (!lineages.has(l.lineage)) fail('lore', `lore "${l.id}" has unknown lineage "${l.lineage}"`);
  if (!['book', 'film', 'series'].includes(l.kind)) fail('lore', `lore "${l.id}" has unknown kind "${l.kind}"`);
  if (!Number.isInteger(l.year)) fail('lore', `lore "${l.id}" needs one integer year`);
  if (typeof l.line !== 'string' || l.line.length < 8) fail('lore', `lore "${l.id}" needs a one-line description`);
  if (typeof l.source !== 'string' || !/^https?:\/\//.test(l.source)) fail('lore', `lore "${l.id}" needs a source URL`);
  if (!Array.isArray(l.artistIds) || !Array.isArray(l.genres)) {
    fail('lore', `lore "${l.id}" needs artistIds and genres lists (either may be empty, not both)`);
    continue;
  }
  for (const a of l.artistIds) if (!artists.has(a)) fail('lore', `lore "${l.id}" points to missing artist "${a}"`);
  for (const g of l.genres) if (!catalog.tracks.some((t) => t.genre === g)) fail('lore', `lore "${l.id}" names genre "${g}", which no card has`);
  // An item is only ever shown under a card it is about, so it must be about at least one.
  if (!catalog.tracks.some((t) => l.artistIds.includes(t.artistId) || l.genres.includes(t.genre))) {
    fail('lore', `lore "${l.id}" is not about any card's artist or genre, so it could never be shown`);
  }
}
void loreIds;

// 7. Personas: one per lineage, plus the fallbacks the game needs.
byId(catalog.personas, 'persona');
for (const l of catalog.lineages) {
  if (!catalog.personas.some((p) => p.rule === 'lineage' && p.lineage === l.id)) {
    fail('persona', `no persona for lineage "${l.id}"`);
  }
}
for (const rule of ['mixed', 'pop', 'empty']) {
  if (!catalog.personas.some((p) => p.rule === rule)) fail('persona', `no persona with rule "${rule}"`);
}

// 8. Listening data. Every card links out to the full track and carries a checked Apple
//    match (preview, cover, store page); no two cards share one Apple recording.
const APPLE_HOSTS = {
  previewUrl: /^https:\/\/audio-ssl\.itunes\.apple\.com\//,
  artworkUrl: /^https:\/\/is\d-ssl\.mzstatic\.com\/.+\/\d+x\d+bb\.(jpg|png)$/,
  url: /^https:\/\/music\.apple\.com\/[a-z]{2}\/album\/.+\?i=\d+$/,
};
const appleIds = new Map();
for (const t of catalog.tracks) {
  if (!/^https:\/\/music\.163\.com\//.test(t.links?.netease ?? '')) fail('links', `track "${t.id}" needs a NetEase search link`);
  if (!/^https:\/\/y\.qq\.com\//.test(t.links?.qq ?? '')) fail('links', `track "${t.id}" needs a QQ Music search link`);
  if (t.apple === undefined || t.apple === null || typeof t.apple !== 'object') {
    fail('apple', `track "${t.id}" has no Apple match, so it has no preview and no cover; match it or remove the card`);
    continue;
  }
  for (const k of ['trackId', 'collectionId']) {
    if (!Number.isInteger(t.apple[k])) fail('apple', `track "${t.id}" apple.${k} must be Apple's numeric id`);
  }
  if (!/^[a-z]{2}$/.test(t.apple.storefront ?? '')) fail('apple', `track "${t.id}" apple.storefront must be a two-letter store code`);
  for (const [k, pattern] of Object.entries(APPLE_HOSTS)) {
    if (!pattern.test(t.apple[k] ?? '')) fail('apple', `track "${t.id}" apple.${k} is missing or not an Apple address`);
  }
  if (!String(t.apple.url ?? '').endsWith(`?i=${t.apple.trackId}`)) fail('apple', `track "${t.id}" apple.url does not point at its own trackId`);
  if (typeof t.apple.cn !== 'boolean') fail('apple', `track "${t.id}" apple.cn is not set; run "npm run match:cn" so mainland China players get a link that works`);
  if (appleIds.has(t.apple.trackId)) fail('apple', `tracks "${appleIds.get(t.apple.trackId)}" and "${t.id}" share one Apple recording`);
  appleIds.set(t.apple.trackId, t.id);
}

if (errors.length > 0) {
  console.error(`catalog INVALID: ${errors.length} problem(s) in ${file}`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
const matched = catalog.tracks.filter((t) => t.apple).length;
console.log(
  `catalog OK: ${catalog.tracks.length} cards, ${catalog.artists.length} artists, ${catalog.albums.length} albums, ` +
    `${catalog.cells.length} cells, ${catalog.lore.length} lore items, ${matched} cards matched to Apple`,
);
