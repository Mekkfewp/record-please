#!/usr/bin/env node
// Fills previewUrl on the records already chosen for the slice. One lookup per track.
// Waits its turn: do not run this beside find-on-apple.mjs, they share Apple's limit.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sleep } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const file = join(root, 'src/data/slice.json');
const slice = JSON.parse(readFileSync(file, 'utf8'));
let last = 0;
let filled = 0;
for (const record of slice.records) {
  if (record.apple?.previewUrl) continue;
  const wait = last + 3200 - Date.now();
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const url = `https://itunes.apple.com/lookup?id=${record.apple.trackId}&country=${record.apple.storefront}`;
  let preview = '';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (res.ok) {
      const data = await res.json();
      preview = data.results?.find((row) => row.trackId === record.apple.trackId)?.previewUrl ?? '';
    }
  } catch {}
  if (preview) {
    record.apple.previewUrl = preview;
    filled += 1;
  }
  console.log(`${filled} ${record.artist} | ${record.track} | ${preview ? 'ok' : 'missing'}`);
}
writeFileSync(file, JSON.stringify(slice, null, 1) + '\n');
console.log('filled', filled, 'of', slice.records.length);
