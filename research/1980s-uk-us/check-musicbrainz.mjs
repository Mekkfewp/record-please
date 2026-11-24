#!/usr/bin/env node
// For every proposed record: find its release group in MusicBrainz, and note the first release
// date, the genres MusicBrainz lists for it, and where the artist is from. Writes mb.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { getJson, here, norm, readRecords } from './lib.mjs';

const file = here + 'mb.json';
const out = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { records: {}, artists: {} };
const state = {};
const mb = (path) => getJson(`https://musicbrainz.org/ws/2/${path}`, 1150, state);
const genreNames = new Set(readFileSync(here + 'musicbrainz-genres.txt', 'utf8').split('\n').map((x) => x.trim()).filter(Boolean));
if (process.argv.includes('--retry')) for (const [key, value] of Object.entries(out.records)) if (!value.found) delete out.records[key];
const q = (s) => `"${s.replace(/["\\]/g, ' ')}"`;
const records = readRecords();
const single = process.argv.includes('--single');

function pick(r, groups) {
  const want = norm(r.title);
  const artistWant = norm(r.artist);
  const hits = groups.filter((g) => {
    const credit = norm((g['artist-credit'] ?? []).map((c) => c.name).join(' '));
    const t = norm(g.title);
    return (t === want || t.startsWith(want) || want.startsWith(t)) && credit && (credit.includes(artistWant) || artistWant.includes(credit));
  });
  hits.sort((a, b) => Number(norm(b.title) === want) - Number(norm(a.title) === want) || (a['first-release-date'] || '9').localeCompare(b['first-release-date'] || '9'));
  const g = hits[0];
  if (!g) return { found: false };
  return {
    found: true,
    id: g.id,
    title: g.title,
    credit: (g['artist-credit'] ?? []).map((c) => c.name).join(' & '),
    type: g['primary-type'] ?? null,
    first: g['first-release-date'] ?? null,
    // MusicBrainz genres are the tags whose names are on its genre list.
    genres: (g.tags ?? []).filter((x) => x.count > 0 && genreNames.has(x.name)).sort((a, b) => b.count - a.count).map((x) => x.name),
    artistId: g['artist-credit']?.[0]?.artist?.id,
  };
}

// First pass: eight records to a query. A record the batch misses is asked for on its own
// with --single, so a miss here is not yet "not found".
const todo = records.filter((r) => !out.records[r.key]);
const size = single ? 1 : 8;
for (let i = 0; i < todo.length; i += size) {
  const batch = todo.slice(i, i + size);
  const query = batch.map((r) => `(releasegroup:${q(r.title)} AND artist:${q(r.artist)})`).join(' OR ');
  let data;
  try {
    data = await mb(`release-group?fmt=json&limit=100&query=${encodeURIComponent(query)}`);
  } catch (error) {
    console.log(`ERR ${batch[0].key} ${error.message}`);
    continue;
  }
  for (const r of batch) {
    const entry = pick(r, data?.['release-groups'] ?? []);
    if (entry.found || single) out.records[r.key] = entry;
    console.log(`[${i}/${todo.length}] ${entry.found ? 'ok ' : '-- '} ${r.key}${entry.found ? ` | ${entry.first} | ${entry.genres.slice(0, 5).join(', ')}` : ''}`);
  }
  writeFileSync(file, JSON.stringify(out, null, 1));
}
writeFileSync(file, JSON.stringify(out, null, 1));

// Artists, fifty at a time: country and area come back with the search result.
const missing = [...new Set(Object.values(out.records).map((x) => x.artistId).filter((id) => id && !out.artists[id]))];
for (let i = 0; i < missing.length; i += 50) {
  const ids = missing.slice(i, i + 50);
  try {
    const data = await mb(`artist?fmt=json&limit=100&query=${encodeURIComponent(`arid:(${ids.join(' OR ')})`)}`);
    for (const a of data?.artists ?? []) out.artists[a.id] = { name: a.name, country: a.country ?? null, area: a.area?.name ?? null, begin: a['begin-area']?.name ?? null };
    console.log(`artists ${i + ids.length}/${missing.length}`);
  } catch (error) {
    console.log(`ERR artists ${error.message}`);
  }
  writeFileSync(file, JSON.stringify(out, null, 1));
}
console.log('DONE');
