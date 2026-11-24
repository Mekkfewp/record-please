import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const here = fileURLToPath(new URL('.', import.meta.url));
export const UA = 'RecordPleaseCatalog/0.3 (https://github.com/Mekkfewp/record-please)';
export const norm = (s) =>
  String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^\p{L}\p{N}]+/gu, '');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * "?" after a name: its place on RYM is not checked. "!" after a name: RYM lists it as a scene,
 * with no style genre above it, and it hangs here by our choice. Oi! is the genre's own spelling,
 * not that mark. check-tree.mjs works the real status out from the RYM file.
 */
function cleanName(name) {
  if (name === 'Oi!') return name;
  return name.replace(/[?!]$/, '');
}

/** records text -> [{ path: [names], unsure: bool, tier, artist, title, year, type, key }] */
export function parseRecords(text) {
  const out = [];
  let path = null;
  let unsure = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      const parts = line.slice(3).split(' > ').map((p) => p.trim());
      const last = parts[parts.length - 1];
      unsure = last !== 'Oi!' && /[?!]$/.test(last);
      path = parts.map(cleanName);
    } else if (/^[123]\|/.test(line)) {
      const [tier, artist, title, year, type] = line.split('|');
      out.push({ path, unsure, tier: Number(tier), artist, title, year: Number(year), type, key: `${artist}|${title}` });
    }
  }
  return out;
}

/** records.txt -> [{ path: [names], unsure: bool, tier, artist, title, year, type, key }] */
export function readRecords() {
  return parseRecords(readFileSync(here + 'records.txt', 'utf8'));
}

/** Every node key on the tree, parent before child. */
export function nodeKeys(records) {
  const keys = new Set();
  for (const record of records) {
    record.path.forEach((_, i) => keys.add(record.path.slice(0, i + 1).join(' > ')));
  }
  return keys;
}

export async function getJson(url, gapMs, state) {
  for (let attempt = 1; ; attempt++) {
    const wait = (state.last ?? 0) + gapMs - Date.now();
    if (wait > 0) await sleep(wait);
    state.last = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
    } catch {}
    if (attempt >= 6) throw new Error(`no answer: ${url}`);
    await sleep(3000 * attempt);
  }
}
