// usage: node cand.mjs list.json out.txt  — list: [{id, term, stores:[..], artist:"regex", title:"regex"}]
import { readFileSync, appendFileSync, writeFileSync } from 'node:fs';
const [,, listFile, outFile] = process.argv;
const list = JSON.parse(readFileSync(listFile, 'utf8'));
writeFileSync(outFile, '');
let last = 0;
async function api(path) {
  for (let attempt = 1; ; attempt++) {
    const wait = last + 3200 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    try { const res = await fetch(`https://itunes.apple.com/${path}`); if (res.ok) return await res.json(); } catch {}
    if (attempt >= 4) return { results: [] };
    await new Promise((r) => setTimeout(r, 15000 * attempt));
  }
}
for (const item of list) {
  const seen = new Set(); const rows = [];
  for (const store of item.stores ?? ['us']) {
    for (const term of [].concat(item.term)) {
      const data = await api(`search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${item.limit ?? 60}&country=${store}`);
      for (const c of data.results) {
        if (c.kind !== 'song' || seen.has(c.trackId)) continue;
        if (item.artist && !new RegExp(item.artist, 'i').test(c.artistName)) continue;
        if (item.title && !new RegExp(item.title, 'i').test(c.trackName)) continue;
        seen.add(c.trackId);
        rows.push(`  ${store} ${c.trackId} | ${c.trackName} | ${c.artistName} | ${c.collectionName} | ${String(c.releaseDate).slice(0, 10)} | ${Math.round((c.trackTimeMillis ?? 0) / 1000)}s | #${c.trackNumber}/${c.trackCount} | ${c.previewUrl ? 'pv' : 'NOPV'} | ${c.collectionId}`);
      }
    }
  }
  appendFileSync(outFile, `== ${item.id} (${rows.length})\n${rows.slice(0, item.show ?? 14).join('\n')}\n`);
}
appendFileSync(outFile, 'DONE\n');
