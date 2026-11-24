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
for (const [key, value] of Object.entries(out.records)) if (!value.found) delete out.records[key];
const q = (s) => `"${s.replace(/["\\]/g, ' ')}"`;
const records = readRecords();
let n = 0;
for (const r of records) {
  n += 1;
  if (out.records[r.key]) continue;
  const entry = { found: false };
  let data;
  try {
    data = await mb(`release-group?fmt=json&limit=10&query=${encodeURIComponent(`releasegroup:${q(r.title)} AND artist:${q(r.artist)}`)}`);
  } catch (error) {
    console.log(`[${n}/${records.length}] ERR ${r.key} ${error.message}`);
    continue;
  }
  const want = norm(r.title);
  const artistWant = norm(r.artist);
  const hits = (data?.['release-groups'] ?? []).filter((g) => {
    const credit = norm((g['artist-credit'] ?? []).map((c) => c.name).join(' '));
    const t = norm(g.title);
    return (t === want || t.startsWith(want) || want.startsWith(t)) && (credit.includes(artistWant) || artistWant.includes(credit));
  });
  hits.sort((a, b) => Number(norm(b.title) === want) - Number(norm(a.title) === want) || (a['first-release-date'] || '9').localeCompare(b['first-release-date'] || '9'));
  const g = hits[0];
  if (g) {
    const artistId = g['artist-credit']?.[0]?.artist?.id;
    if (artistId && !out.artists[artistId]) {
      let a;
      try {
        a = await mb(`artist/${artistId}?fmt=json`);
      } catch (error) {
        console.log(`[${n}/${records.length}] ERR ${r.key} ${error.message}`);
        continue;
      }
      out.artists[artistId] = { name: a?.name, country: a?.country ?? null, area: a?.area?.name ?? null, begin: a?.['begin-area']?.name ?? null };
    }
    Object.assign(entry, {
      found: true,
      id: g.id,
      title: g.title,
      credit: (g['artist-credit'] ?? []).map((c) => c.name).join(' & '),
      type: g['primary-type'] ?? null,
      first: g['first-release-date'] ?? null,
      // MusicBrainz genres are the tags whose names are on its genre list.
      genres: (g.tags ?? []).filter((x) => x.count > 0 && genreNames.has(x.name)).sort((a, b) => b.count - a.count).map((x) => x.name),
      artistId,
    });
  }
  out.records[r.key] = entry;
  if (n % 10 === 0) writeFileSync(file, JSON.stringify(out, null, 1));
  console.log(`[${n}/${records.length}] ${entry.found ? 'ok ' : '-- '} ${r.key}${entry.found ? ` | ${entry.first} | ${entry.genres.slice(0, 5).join(', ')}` : ''}`);
}
writeFileSync(file, JSON.stringify(out, null, 1));
console.log('DONE');
