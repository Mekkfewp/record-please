#!/usr/bin/env node
// For every proposed record: find its English Wikipedia article and read the genre and release
// fields of its infobox. Writes wp.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { UA, getJson, here, norm, readRecords, sleep } from './lib.mjs';

const file = here + 'wp.json';
const out = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
const state = {};
const api = (params) => getJson(`https://en.wikipedia.org/w/api.php?format=json&${params}`, 700, state);

async function raw(title) {
  await sleep(500);
  try {
    const res = await fetch(`https://en.wikipedia.org/w/index.php?action=raw&title=${encodeURIComponent(title)}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

function field(text, name) {
  const m = text.match(new RegExp(`\\n\\s*\\|\\s*${name}\\s*=([\\s\\S]*?)(?=\\n\\s*\\|\\s*[a-z_ ]+\\d*\\s*=|\\n\\}\\})`, 'i'));
  return m ? m[1] : '';
}

function genresOf(value) {
  const clean = value.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\{\{(sfn|efn|cn|citation needed)[^}]*\}\}/gi, '');
  const names = [];
  for (const m of clean.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) names.push((m[2] ?? m[1]).trim());
  if (names.length === 0) {
    for (const part of clean.replace(/\{\{[a-z ]+\|/gi, '').replace(/[{}*]/g, ',').split(/[,\n|•·]/)) {
      const p = part.trim();
      if (p && p.length < 40 && !/=/.test(p)) names.push(p);
    }
  }
  return [...new Set(names.map((s) => s.toLowerCase()))];
}

const inRange = (y) => y >= 1980 && y <= 1989;
const records = readRecords();
const redo = process.argv.includes('--redo');
let n = 0;
for (const r of records) {
  n += 1;
  const old = out[r.key];
  if (old && !(redo && (!old.found || !old.released || !inRange(old.released)))) continue;
  const kind = r.type === 's' ? 'song' : r.type === 'e' ? 'EP' : 'album';
  const want = norm(r.title);
  const artistWant = norm(r.artist);
  const hits = [];
  const seen = new Set();
  for (const query of [`"${r.title}" ${r.artist} ${kind}`, `${r.title} ${r.artist}`]) {
    const search = await api(`action=query&list=search&srlimit=6&srsearch=${encodeURIComponent(query)}`);
    for (const hit of search?.query?.search ?? []) {
      if (seen.has(hit.title)) continue;
      seen.add(hit.title);
      const t = norm(hit.title.replace(/\s*\([^)]*\)$/, ''));
      if (t === want) hits.push({ title: hit.title, exact: true });
      else if (t.startsWith(want) || want.startsWith(t)) hits.push({ title: hit.title, exact: false });
    }
    if (hits.some((h) => h.exact)) break;
  }
  hits.sort((a, b) => Number(b.exact) - Number(a.exact));
  const candidates = [];
  for (const hit of hits.slice(0, 5)) {
    let text = await raw(hit.title);
    const redirect = text?.match(/^#REDIRECT\s*\[\[([^\]#|]+)/i);
    if (redirect) text = await raw(redirect[1]);
    if (!text || !/\{\{\s*Infobox (album|song|single|EP)/i.test(text)) continue;
    const artistField = norm(field(text, 'artist'));
    if (!(artistField.includes(artistWant) || (artistField.length > 3 && artistWant.includes(artistField)))) continue;
    const released = field(text, 'released').match(/\b(19|20)\d\d\b/);
    candidates.push({ found: true, title: redirect ? redirect[1] : hit.title, exact: hit.exact, genres: genresOf(field(text, 'genre')), released: released ? Number(released[0]) : null });
    if (hit.exact && released && inRange(Number(released[0]))) break;
  }
  // An article whose release year is in the 1980s wins over a later record of the same name.
  candidates.sort((a, b) => Number(inRange(b.released ?? 0)) - Number(inRange(a.released ?? 0)) || Number(b.exact) - Number(a.exact));
  const entry = (out[r.key] = candidates[0] ?? { found: false });
  if (n % 10 === 0) writeFileSync(file, JSON.stringify(out, null, 1));
  console.log(`[${n}/${records.length}] ${entry.found ? 'ok ' : '-- '} ${r.key}${entry.found ? ` | ${entry.released} | ${entry.genres.join(', ')}` : ''}`);
}
writeFileSync(file, JSON.stringify(out, null, 1));
console.log('DONE');
