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

const records = readRecords();
let n = 0;
for (const r of records) {
  n += 1;
  if (out[r.key]) continue;
  const entry = (out[r.key] = { found: false });
  const kind = r.type === 's' ? 'song' : r.type === 'e' ? 'EP' : 'album';
  const search = await api(`action=query&list=search&srlimit=5&srsearch=${encodeURIComponent(`"${r.title}" ${r.artist} ${kind}`)}`);
  for (const hit of search?.query?.search ?? []) {
    const t = norm(hit.title.replace(/\s*\([^)]*\)$/, ''));
    const want = norm(r.title);
    if (!(t === want || t.startsWith(want) || want.startsWith(t))) continue;
    let text = await raw(hit.title);
    const redirect = text?.match(/^#REDIRECT\s*\[\[([^\]#|]+)/i);
    if (redirect) text = await raw(redirect[1]);
    if (!text || !/\{\{\s*Infobox (album|song|single|EP)/i.test(text)) continue;
    const artistField = norm(field(text, 'artist'));
    const artistWant = norm(r.artist);
    if (!(artistField.includes(artistWant) || (artistField.length > 3 && artistWant.includes(artistField)))) continue;
    const released = field(text, 'released').match(/\b(19|20)\d\d\b/);
    Object.assign(entry, { found: true, title: redirect ? redirect[1] : hit.title, genres: genresOf(field(text, 'genre')), released: released ? Number(released[0]) : null });
    break;
  }
  if (n % 10 === 0) writeFileSync(file, JSON.stringify(out, null, 1));
  console.log(`[${n}/${records.length}] ${entry.found ? 'ok ' : '-- '} ${r.key}${entry.found ? ` | ${entry.released} | ${entry.genres.join(', ')}` : ''}`);
}
writeFileSync(file, JSON.stringify(out, null, 1));
console.log('DONE');
