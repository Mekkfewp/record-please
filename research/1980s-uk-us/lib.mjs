import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const here = fileURLToPath(new URL('.', import.meta.url));
export const UA = 'RecordPleaseCatalog/0.3 (https://github.com/Mekkfewp/record-please)';
export const norm = (s) =>
  String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^\p{L}\p{N}]+/gu, '');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** records.txt -> [{ path: [names], unsure: bool, tier, artist, title, year, type, key }] */
export function readRecords() {
  const out = [];
  let path = null;
  let unsure = false;
  for (const line of readFileSync(here + 'records.txt', 'utf8').split('\n')) {
    if (line.startsWith('## ')) {
      const parts = line.slice(3).split(' > ').map((p) => p.trim());
      unsure = parts[parts.length - 1].endsWith('?');
      path = parts.map((p) => p.replace(/\?$/, ''));
    } else if (/^[123]\|/.test(line)) {
      const [tier, artist, title, year, type] = line.split('|');
      out.push({ path, unsure, tier: Number(tier), artist, title, year: Number(year), type, key: `${artist}|${title}` });
    }
  }
  return out;
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
