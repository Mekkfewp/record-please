#!/usr/bin/env node
// Second opinion for the Apple matches: asks MusicBrainz which studio album first carried
// each recording, when, and how long the recording runs, and adds that to
// scripts/apple-match-report.json next to what Apple returned. It changes no catalog data;
// a person compares the two and decides.
//
//   node scripts/crosscheck-musicbrainz.mjs            cards without a MusicBrainz entry yet
//   node scripts/crosscheck-musicbrainz.mjs --all
//   node scripts/crosscheck-musicbrainz.mjs --only a,b
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(resolve(here, '../src/data/catalog.json'), 'utf8'));
const hints = JSON.parse(readFileSync(resolve(here, 'apple-hints.json'), 'utf8'));
const reportFile = resolve(here, 'apple-match-report.json');
const report = JSON.parse(readFileSync(reportFile, 'utf8'));

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const artists = new Map(catalog.artists.map((a) => [a.id, a]));
const albums = new Map(catalog.albums.map((a) => [a.id, a]));

const UA = 'RecordPleaseCatalog/0.2 (https://github.com/Mekkfewp/record-please)';
let last = 0;
async function mb(query) {
  const wait = last + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  for (let attempt = 1; ; attempt++) {
    last = Date.now();
    try {
      const res = await fetch(
        `https://musicbrainz.org/ws/2/recording?fmt=json&limit=100&query=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': UA } },
      );
      if (res.ok) return await res.json();
      if (attempt >= 4) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt >= 4) throw err;
    }
    await new Promise((r) => setTimeout(r, 4000 * attempt));
  }
}

const norm = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
const quote = (s) => `"${String(s).replace(/["\\]/g, ' ')}"`;

const todo = catalog.tracks.filter((t) => {
  if (only) return only.has(t.id);
  return args.includes('--all') || !report[t.id]?.musicbrainz;
});
console.log(`${todo.length} card(s) to cross-check`);

let n = 0;
for (const track of todo) {
  const artist = artists.get(track.artistId);
  const album = albums.get(track.albumId);
  const hint = hints.tracks[track.id];
  const names = [artist.name, ...(hints.artistAliases[artist.id] ?? [])];
  const titles = [track.title, ...(hint?.titleAliases ?? [])];
  const query = `(${titles.map((t) => `recording:${quote(t)}`).join(' OR ')}) AND (${names
    .map((x) => `artist:${quote(x)}`)
    .join(' OR ')})`;
  const entry = (report[track.id] ??= {});
  try {
    const data = await mb(query);
    const wanted = new Set(titles.map(norm));
    const studio = [];
    let earliest = null;
    for (const rec of data.recordings ?? []) {
      if (!wanted.has(norm(rec.title))) continue;
      const first = rec['first-release-date'];
      if (first && (!earliest || first < earliest)) earliest = first;
      for (const rel of rec.releases ?? []) {
        const group = rel['release-group'] ?? {};
        if (group['primary-type'] !== 'Album' || (group['secondary-types'] ?? []).length > 0) continue;
        if (!rel.date) continue;
        studio.push({
          album: group.title ?? rel.title,
          date: rel.date,
          seconds: rec.length ? Math.round(rec.length / 1000) : null,
          credit: (rec['artist-credit'] ?? []).map((c) => c.name).join(' & '),
        });
      }
    }
    studio.sort((a, b) => a.date.localeCompare(b.date));
    const first = studio[0] ?? null;
    const appleSeconds = entry.chosen?.seconds ?? null;
    const sameAlbum = studio.filter((s) => norm(s.album) === norm(album.title));
    entry.musicbrainz = {
      hits: data.recordings?.length ?? 0,
      earliestRelease: earliest,
      firstStudioAlbum: first,
      catalogAlbumFound: sameAlbum.length > 0,
      catalogAlbumFirstDate: sameAlbum[0]?.date ?? null,
      catalogAlbumSeconds: [...new Set(sameAlbum.map((s) => s.seconds).filter(Boolean))].slice(0, 6),
      appleSeconds,
    };
  } catch (err) {
    entry.musicbrainz = { error: String(err) };
  }
  n += 1;
  const m = entry.musicbrainz;
  console.log(
    `[${n}/${todo.length}] ${track.id}: catalog "${album.title}" ${album.year}/${track.year}` +
      (m.error
        ? ` ERROR ${m.error}`
        : ` | MB first studio album: ${m.firstStudioAlbum ? `"${m.firstStudioAlbum.album}" ${m.firstStudioAlbum.date}` : 'none'}` +
          ` | catalog album in MB: ${m.catalogAlbumFound ? `${m.catalogAlbumFirstDate} ${m.catalogAlbumSeconds.join('/')}s` : 'no'}` +
          ` | apple ${m.appleSeconds ?? '-'}s | earliest ${m.earliestRelease ?? '-'}`),
  );
  if (n % 20 === 0) writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
}
writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
