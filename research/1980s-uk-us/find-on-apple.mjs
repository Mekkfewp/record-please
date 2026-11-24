#!/usr/bin/env node
// For every proposed record: is it in Apple's catalogue (US store first, then GB)?
// Albums and EPs are looked up as collections and their track lists are saved, so that the
// card's track can be chosen from what is really there. Singles are looked up as songs.
// Writes apple.json. Nothing here is a checked match yet; the catalogue step checks them.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { here, readRecords, sleep } from './lib.mjs';

const file = here + 'apple.json';
const out = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
const redo = process.argv.includes('--redo');

// The Search API allows roughly 20 calls a minute, shared by every script on this machine.
const GAP_MS = 3200;
let last = 0;
async function api(path) {
  for (let attempt = 1; ; attempt++) {
    const wait = last + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(`https://itunes.apple.com/${path}`, { signal: AbortSignal.timeout(30000) });
      if (res.ok) return await res.json();
    } catch {}
    if (attempt >= 4) throw new Error(`no answer: ${path}`);
    await sleep(15000 * attempt);
  }
}

const strip = (s) => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and');
const NOISE = /[([][^)\]]*(remaster|deluxe|edition|expanded|anniversary|bonus|mono|stereo|explicit|reissue|legacy|collector|special|complete|original|version|feat\.|featuring)[^)\]]*[)\]]|\s-\s(ep|single)$|\s-\s.*(remaster|version|edit|mono|stereo).*$/gi;
const norm = (s) => strip(s).replace(NOISE, '').replace(/^the\s+/, '').replace(/[^\p{L}\p{N}]+/gu, '');
const BAD = /\b(live|karaoke|tribute|re-?record|remix|demo|acoustic|instrumental|made famous|originally performed|in the style of|rehearsal|medley)\b/i;
const COMPILATION = /\b(greatest|best of|hits|essential|collection|anthology|singles|soundtrack|ultimate|gold|platinum|now that's|compilation|box set)\b/i;
const year = (c) => Number(String(c.releaseDate ?? '').slice(0, 4)) || null;

const artistOk = (candidate, r) => {
  const a = norm(candidate.artistName);
  const want = norm(r.artist);
  return a === want || (want.length > 4 && (a.includes(want) || want.includes(a)));
};

async function album(r, country) {
  const data = await api(`search?media=music&entity=album&limit=15&country=${country}&term=${encodeURIComponent(`${r.artist} ${r.title}`)}`);
  const want = norm(r.title);
  const hits = (data.results ?? []).filter((c) => artistOk(c, r) && norm(c.collectionName) === want);
  if (hits.length === 0) return null;
  // Plain editions before deluxe ones, the edition whose date is closest to the original first.
  hits.sort((a, b) => Number(/deluxe|expanded|anniversary|bonus/i.test(a.collectionName)) - Number(/deluxe|expanded|anniversary|bonus/i.test(b.collectionName)) || Math.abs((year(a) ?? 3000) - r.year) - Math.abs((year(b) ?? 3000) - r.year));
  const c = hits[0];
  const detail = await api(`lookup?id=${c.collectionId}&entity=song&limit=200&country=${country}`);
  const tracks = (detail.results ?? []).filter((t) => t.wrapperType === 'track' && t.kind === 'song').map((t) => ({
    trackId: t.trackId, name: t.trackName, disc: t.discNumber, number: t.trackNumber, ms: t.trackTimeMillis ?? null,
    preview: Boolean(t.previewUrl), artist: t.artistName, explicit: t.trackExplicitness,
  }));
  return {
    kind: 'album', storefront: country, collectionId: c.collectionId, name: c.collectionName, artist: c.artistName,
    releaseDate: String(c.releaseDate ?? '').slice(0, 10), trackCount: c.trackCount, url: c.collectionViewUrl, artwork: c.artworkUrl100,
    others: hits.length - 1, tracks,
  };
}

async function song(r, country) {
  const data = await api(`search?media=music&entity=song&limit=25&country=${country}&term=${encodeURIComponent(`${r.artist} ${r.title}`)}`);
  const want = norm(r.title);
  const hits = (data.results ?? []).filter((c) => artistOk(c, r) && norm(c.trackName) === want && c.previewUrl);
  if (hits.length === 0) return null;
  const penalty = (c) => Number(BAD.test(`${c.trackName} ${c.collectionName}`)) * 4 + Number(COMPILATION.test(c.collectionName ?? '')) * 2 + Number(Math.abs((year(c) ?? 3000) - r.year) > 1);
  hits.sort((a, b) => penalty(a) - penalty(b));
  return {
    kind: 'song', storefront: country,
    candidates: hits.slice(0, 5).map((c) => ({
      trackId: c.trackId, collectionId: c.collectionId, name: c.trackName, artist: c.artistName, album: c.collectionName,
      releaseDate: String(c.releaseDate ?? '').slice(0, 10), ms: c.trackTimeMillis ?? null, url: c.trackViewUrl, artwork: c.artworkUrl100, penalty: penalty(c),
    })),
  };
}

const records = readRecords();
let n = 0;
for (const r of records) {
  n += 1;
  if (out[r.key] && !(redo && !out[r.key].found)) continue;
  let entry = { found: false };
  try {
    for (const country of ['us', 'gb']) {
      const hit = r.type === 's' ? await song(r, country) : await album(r, country);
      if (hit) { entry = { found: true, ...hit }; break; }
    }
  } catch (error) {
    console.log(`[${n}/${records.length}] ERR ${r.key} ${error.message}`);
    continue;
  }
  out[r.key] = entry;
  if (n % 5 === 0) writeFileSync(file, JSON.stringify(out, null, 1));
  console.log(`[${n}/${records.length}] ${entry.found ? 'ok ' : '-- '} ${r.key}${entry.found ? ` | ${entry.storefront} | ${entry.kind === 'album' ? `${entry.name} | ${entry.releaseDate} | ${entry.tracks.length} tracks, ${entry.tracks.filter((t) => t.preview).length} with preview` : `${entry.candidates.length} candidates`}` : ''}`);
}
writeFileSync(file, JSON.stringify(out, null, 1));
console.log('DONE');
