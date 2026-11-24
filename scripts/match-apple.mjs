#!/usr/bin/env node
// Offline matcher: finds each catalog card in Apple's catalogue through the public
// iTunes Search API and writes the result back into src/data/catalog.json.
//
//   node scripts/match-apple.mjs              match cards that have no `apple` block yet
//   node scripts/match-apple.mjs --all        re-match every card
//   node scripts/match-apple.mjs --unsure     re-match cards that are neither a clean hit nor pinned
//   node scripts/match-apple.mjs --only a,b   match only these track ids
//   node scripts/match-apple.mjs --refresh    re-read preview/artwork URLs for pinned ids
//
// A match is only a candidate until a person has checked it. Checked ids are pinned in
// scripts/apple-hints.json; a pinned id is looked up directly and never searched again.
// Every run writes scripts/apple-match-report.json with what was compared.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalogFile = resolve(here, '../src/data/catalog.json');
const hintsFile = resolve(here, 'apple-hints.json');
const reportFile = resolve(here, 'apple-match-report.json');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'));
const hints = JSON.parse(readFileSync(hintsFile, 'utf8'));
let report = {};
try {
  report = JSON.parse(readFileSync(reportFile, 'utf8'));
} catch {
  report = {};
}

const artists = new Map(catalog.artists.map((a) => [a.id, a]));
const albums = new Map(catalog.albums.map((a) => [a.id, a]));

// The Search API allows roughly 20 calls a minute.
const GAP_MS = 3200;
let lastCall = 0;
async function api(path) {
  const wait = lastCall + GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  for (let attempt = 1; ; attempt++) {
    lastCall = Date.now();
    try {
      const res = await fetch(`https://itunes.apple.com/${path}`);
      if (res.ok) return await res.json();
      if (attempt >= 4) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt >= 4) throw err;
    }
    await new Promise((r) => setTimeout(r, 15000 * attempt));
  }
}

const strip = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const VERSION_NOISE =
  /[([][^)\]]*(remaster|deluxe|edition|expanded|anniversary|bonus|mono|stereo|explicit|reissue|legacy|collector|special|complete|original|feat\.|featuring)[^)\]]*[)\]]|\s-\s.*(remaster|version|edit|mix|mono|stereo).*$/gi;
const norm = (s) => strip(s).replace(VERSION_NOISE, '').replace(/[^\p{L}\p{N}]+/gu, '');
const BAD_VERSION =
  /\b(live|karaoke|tribute|cover|re-?record|taylor'?s version|remix|mix|a cappella|demo|acoustic|instrumental|made famous|originally performed|in the style of|rehearsal|session|medley|reprise|edit)\b|ライブ|カラオケ|现场|現場|伴奏/i;
const COMPILATION =
  /\b(greatest|best of|hits|essential|collection|anthology|singles|soundtrack|playlist|ultimate|gold|platinum|now that's|various|years|compilation|box set)\b|ベスト|精选|精選|全记录/i;

function storefrontsFor(artist, hint) {
  if (hint?.storefronts) return hint.storefronts;
  if (artist.country === 'JP') return ['jp', 'us'];
  if (['CN', 'HK', 'TW'].includes(artist.country)) return ['hk', 'tw', 'us'];
  return ['us', 'gb', 'jp'];
}

function score(candidate, track, artist, album, hint) {
  const notes = [];
  let s = 0;
  const artistNames = [artist.name, ...(hints.artistAliases[artist.id] ?? [])].map(norm);
  const cArtist = norm(candidate.artistName);
  if (artistNames.includes(cArtist)) s += 40;
  else if (artistNames.some((n) => n && (cArtist.includes(n) || n.includes(cArtist)))) {
    s += 25;
    notes.push('artist name only partly matches');
  } else notes.push('ARTIST DIFFERS');

  const titles = [track.title, ...(hint?.titleAliases ?? [])].map(norm);
  const cTitle = norm(candidate.trackName);
  if (titles.includes(cTitle)) s += 30;
  else if (titles.some((n) => n && (cTitle.startsWith(n) || n.startsWith(cTitle)))) {
    s += 18;
    notes.push('title only partly matches');
  } else notes.push('TITLE DIFFERS');

  const albumTitles = [album.title, ...(hint?.albumAliases ?? [])].map(norm);
  const cAlbum = norm(candidate.collectionName ?? '');
  if (albumTitles.includes(cAlbum)) s += 25;
  else if (albumTitles.some((n) => n && (cAlbum.startsWith(n) || n.startsWith(cAlbum)))) {
    s += 15;
    notes.push('album title only partly matches');
  } else notes.push('ALBUM DIFFERS');

  const ownWords = `${track.title} ${album.title}`;
  for (const [field, value] of [['track', candidate.trackName], ['album', candidate.collectionName ?? '']]) {
    const hit = value.match(BAD_VERSION);
    if (hit && !new RegExp(hit[0], 'i').test(ownWords)) {
      s -= 40;
      notes.push(`${field} name says "${hit[0]}"`);
    }
  }
  const comp = (candidate.collectionName ?? '').match(COMPILATION);
  if (comp && !new RegExp(comp[0], 'i').test(album.title)) {
    s -= 12;
    notes.push(`album looks like a compilation ("${comp[0]}")`);
  }
  if (candidate.trackExplicitness === 'cleaned') {
    s -= 30;
    notes.push('censored edit');
  }
  if (!candidate.previewUrl) {
    s -= 100;
    notes.push('NO PREVIEW');
  }
  const year = Number(String(candidate.releaseDate ?? '').slice(0, 4));
  if (year && Math.abs(year - track.year) <= 1) s += 5;
  else if (year) notes.push(`Apple dates it ${year}, catalog says ${track.year}`);
  const acceptable = !notes.some((n) => /ARTIST DIFFERS|TITLE DIFFERS|NO PREVIEW/.test(n));
  return { score: s, notes, acceptable };
}

const brief = (c, storefront) => ({
  storefront,
  trackId: c.trackId,
  collectionId: c.collectionId,
  track: c.trackName,
  artist: c.artistName,
  album: c.collectionName,
  releaseDate: String(c.releaseDate ?? '').slice(0, 10),
  seconds: Math.round((c.trackTimeMillis ?? 0) / 1000),
  trackNumber: c.trackNumber,
  trackCount: c.trackCount,
  explicitness: c.trackExplicitness,
  hasPreview: Boolean(c.previewUrl),
});

// `cn` (set by check-cn-storefront.mjs) belongs to the recording, so it survives a refresh of
// the same id and is dropped when the match changes.
function toApple(c, storefront, previous) {
  const apple = {
    trackId: c.trackId,
    collectionId: c.collectionId,
    storefront,
    previewUrl: c.previewUrl,
    artworkUrl: c.artworkUrl100,
    url: String(c.trackViewUrl).replace(/[?&]uo=\d+/, ''),
  };
  if (previous?.trackId === c.trackId && typeof previous.cn === 'boolean') apple.cn = previous.cn;
  return apple;
}

function searchLinks(track, artist) {
  const q = encodeURIComponent(`${artist.name} ${track.title}`);
  return {
    netease: `https://music.163.com/#/search/m/?s=${q}&type=1`,
    qq: `https://y.qq.com/n/ryqq/search?w=${q}&t=song`,
  };
}

// Known ids are read fifty at a time, one request per storefront.
const lookedUp = new Map();
async function preloadLookups(wanted) {
  const byStore = new Map();
  for (const { trackId, storefront } of wanted) {
    if (!byStore.has(storefront)) byStore.set(storefront, []);
    byStore.get(storefront).push(trackId);
  }
  for (const [storefront, ids] of byStore) {
    for (let i = 0; i < ids.length; i += 50) {
      const data = await api(`lookup?id=${ids.slice(i, i + 50).join(',')}&country=${storefront}`);
      for (const r of data.results) if (r.kind === 'song') lookedUp.set(`${storefront}:${r.trackId}`, r);
    }
  }
}

async function lookup(id, storefront) {
  const key = `${storefront}:${id}`;
  if (lookedUp.has(key)) return lookedUp.get(key);
  const data = await api(`lookup?id=${id}&country=${storefront}`);
  return data.results.find((r) => r.trackId === id && r.kind === 'song') ?? null;
}

// Scores an album edition: the plain original release beats deluxe, remastered and censored ones.
function scoreAlbum(c, artist, album, hint) {
  const artistNames = [artist.name, ...(hints.artistAliases[artist.id] ?? [])].map(norm);
  const cArtist = norm(c.artistName);
  const albumTitles = [album.title, ...(hint?.albumAliases ?? [])].map(norm);
  const cAlbum = norm(c.collectionName ?? '');
  let s = 0;
  if (artistNames.includes(cArtist)) s += 40;
  else if (artistNames.some((n) => n && (cArtist.includes(n) || n.includes(cArtist)))) s += 25;
  else return -1;
  if (albumTitles.includes(cAlbum)) s += 40;
  else if (albumTitles.some((n) => n && (cAlbum.startsWith(n) || n.startsWith(cAlbum)))) s += 20;
  else return -1;
  if (strip(c.collectionName) === strip(album.title)) s += 6;
  if (c.collectionExplicitness === 'cleaned') s -= 30;
  if (BAD_VERSION.test(c.collectionName) && !BAD_VERSION.test(album.title)) s -= 40;
  return s;
}

const artistNamesOf = (artist) => [artist.name, ...(hints.artistAliases[artist.id] ?? [])].map(norm);

// Search for the song itself. Apple's search leaves out explicit tracks, so a miss here
// is not the end: the artist's album list below still has them.
async function searchBySong(track, artist, album, hint, storefront) {
  const pool = [];
  const artistIds = new Set();
  for (const term of hint?.terms ?? [`${artist.name} ${track.title}`, `${artist.name} ${album.title}`]) {
    const data = await api(
      `search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=50&country=${storefront}`,
    );
    for (const c of data.results) {
      if (c.kind !== 'song') continue;
      if (artistNamesOf(artist).includes(norm(c.artistName))) artistIds.add(c.artistId);
      pool.push({ c, storefront, ...score(c, track, artist, album, hint) });
    }
    if (pool.some(isClean)) break;
  }
  return { pool, artistIds };
}

async function findArtistIds(artist, storefront) {
  const ids = new Set();
  for (const name of [artist.name, ...(hints.artistAliases[artist.id] ?? [])].slice(0, 2)) {
    const data = await api(
      `search?term=${encodeURIComponent(name)}&media=music&entity=musicArtist&limit=10&country=${storefront}`,
    );
    for (const c of data.results) {
      if (artistNamesOf(artist).includes(norm(c.artistName))) ids.add(c.artistId);
    }
    if (ids.size > 0) break;
  }
  return ids;
}

// Walk the artist's own album list, find the card's album, and read its track list.
// Lookups, unlike searches, include explicit tracks and every edition of an album.
async function searchByArtistAlbums(track, artist, album, hint, storefront, artistIds) {
  const pool = [];
  const editions = [];
  for (const artistId of [...artistIds].slice(0, 2)) {
    const data = await api(`lookup?id=${artistId}&entity=album&limit=200&country=${storefront}`);
    for (const c of data.results) {
      if (c.wrapperType !== 'collection') continue;
      const s = scoreAlbum(c, artist, album, hint);
      if (s > 0) editions.push({ c, s });
    }
  }
  editions.sort((x, y) => y.s - x.s);
  for (const { c: edition } of editions.slice(0, 3)) {
    const data = await api(`lookup?id=${edition.collectionId}&entity=song&limit=200&country=${storefront}`);
    for (const c of data.results) {
      if (c.wrapperType !== 'track' || c.kind !== 'song') continue;
      const scored = score(c, track, artist, album, hint);
      if (strip(edition.collectionName) === strip(album.title)) scored.score += 3;
      pool.push({ c, storefront, ...scored });
    }
    if (pool.some(isClean)) break;
  }
  return pool;
}

// A hit needs no second look when artist, title and album all agree and it is not a censored edit.
const isClean = (p) => p.acceptable && p.score >= 95;

async function search(track, artist, album, hint) {
  let pool = [];
  for (const storefront of storefrontsFor(artist, hint)) {
    const bySong = await searchBySong(track, artist, album, hint, storefront);
    pool = pool.concat(bySong.pool);
    if (pool.some(isClean)) break;
    const artistIds = bySong.artistIds.size > 0 ? bySong.artistIds : await findArtistIds(artist, storefront);
    pool = pool.concat(await searchByArtistAlbums(track, artist, album, hint, storefront, artistIds));
    if (pool.some(isClean)) break;
  }
  const seen = new Set();
  pool = pool.filter((p) => {
    const key = `${p.storefront}:${p.c.trackId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  pool.sort((a, b) => Number(b.acceptable) - Number(a.acceptable) || b.score - a.score);
  return pool;
}

let done = 0;
const todo = catalog.tracks.filter((t) => {
  if (only) return only.has(t.id);
  if (flag('--all') || flag('--refresh')) return true;
  if (flag('--unsure')) {
    const e = report[t.id];
    if (e?.status === 'pinned') return false;
    return e?.status !== 'auto' || !e.chosen?.explicitness || e.chosen.explicitness === 'cleaned';
  }
  return !t.apple;
});
console.log(`${todo.length} card(s) to process`);
await preloadLookups(
  todo.flatMap((t) => {
    const pin = hints.tracks[t.id]?.pin;
    if (pin) return [pin];
    return flag('--refresh') && t.apple ? [{ trackId: t.apple.trackId, storefront: t.apple.storefront }] : [];
  }),
);

for (const track of todo) {
  const artist = artists.get(track.artistId);
  const album = albums.get(track.albumId);
  const hint = hints.tracks[track.id];
  track.links = searchLinks(track, artist);
  const entry = { want: { title: track.title, artist: artist.name, album: album.title, year: track.year } };

  try {
    if (hint?.pin) {
      const c = await lookup(hint.pin.trackId, hint.pin.storefront);
      if (c && c.previewUrl) {
        track.apple = toApple(c, hint.pin.storefront, track.apple);
        entry.status = 'pinned';
        entry.chosen = { ...brief(c, hint.pin.storefront), ...score(c, track, artist, album, hint) };
      } else {
        delete track.apple;
        entry.status = c ? 'pinned-but-no-preview' : 'pinned-id-not-found';
      }
    } else if (flag('--refresh') && track.apple) {
      const c = await lookup(track.apple.trackId, track.apple.storefront);
      if (c && c.previewUrl) {
        track.apple = toApple(c, track.apple.storefront, track.apple);
        entry.status = report[track.id]?.status ?? 'auto';
        entry.chosen = { ...brief(c, track.apple.storefront), ...score(c, track, artist, album, hint) };
      } else {
        entry.status = 'refresh-failed';
      }
    } else {
      const pool = await search(track, artist, album, hint);
      const best = pool[0];
      entry.candidates = pool.slice(0, 8).map((p) => ({ ...brief(p.c, p.storefront), score: p.score, notes: p.notes }));
      if (best && best.acceptable && best.score >= 70) {
        track.apple = toApple(best.c, best.storefront, track.apple);
        entry.status = best.score >= 95 ? 'auto' : 'auto-weak';
        entry.chosen = entry.candidates[0];
      } else {
        delete track.apple;
        entry.status = 'unmatched';
      }
    }
  } catch (err) {
    entry.status = 'error';
    entry.error = String(err);
  }

  if (report[track.id]?.musicbrainz) entry.musicbrainz = report[track.id].musicbrainz;
  report[track.id] = entry;
  done += 1;
  const c = entry.chosen;
  console.log(
    `[${done}/${todo.length}] ${entry.status.padEnd(10)} ${track.id}` +
      (c ? ` -> ${c.storefront} | ${c.track} | ${c.artist} | ${c.album} | ${c.releaseDate} | ${c.seconds}s` : ''),
  );
  if (done % 10 === 0 || done === todo.length) {
    writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + '\n');
    writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
  }
}

writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + '\n');
writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
const counts = {};
for (const t of catalog.tracks) {
  const s = report[t.id]?.status ?? 'not-run';
  counts[s] = (counts[s] ?? 0) + 1;
}
console.log('status totals:', counts);
