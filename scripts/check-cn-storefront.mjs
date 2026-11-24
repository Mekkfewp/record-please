// Records, per card, whether Apple's mainland China store carries the matched recording.
//
// Why: from a mainland China address, music.apple.com sends every link to another country's
// store to the China home page, so the song is lost. The same album and track ids work under
// /cn/ when the mainland store carries the song, and the game then links there instead.
//
//   npm run match:cn             every card
//   npm run match:cn -- --only a,b
//
// A card counts as carried only when Apple answers with that song's own page. An album page
// that no longer lists the song (Apple serves its generic player title for it) counts as not
// carried, and so does any answer this script cannot read.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CATALOG = fileURLToPath(new URL('../src/data/catalog.json', import.meta.url));
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
const onlyAt = process.argv.indexOf('--only');
const only = onlyAt > 0 ? new Set(process.argv[onlyAt + 1].split(',')) : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A song's page is titled "<song> - <artist>… - Apple Music"; the generic player page is not.
const isSongTitle = (title) => {
  const clean = title.replace(/[\u200e\u200f\u00a0]/g, ' ').trim();
  return /\S\s+-\s+Apple\s+Music$/.test(clean) && !/^Apple\s+Music/.test(clean);
};

async function carriedInChina(apple) {
  const url = `https://music.apple.com/cn/album/${apple.collectionId}?i=${apple.trackId}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' },
        signal: AbortSignal.timeout(25000),
      });
      if (res.status === 404) return { carried: false, why: '404' };
      if (res.status === 200) {
        const title = ((await res.text()).match(/<title>([^<]*)/) ?? [])[1]?.trim() ?? '';
        const songPage = isSongTitle(title) && new URL(res.url).searchParams.get('i') === String(apple.trackId);
        return { carried: songPage, why: title.slice(0, 70) };
      }
    } catch {
      // retried below
    }
    await sleep(2000 * (attempt + 1));
  }
  return { carried: false, why: 'no readable answer' };
}

let yes = 0;
let no = 0;
for (const track of catalog.tracks) {
  if (!track.apple || (only && !only.has(track.id))) continue;
  const { carried, why } = await carriedInChina(track.apple);
  track.apple.cn = carried;
  if (carried) yes++;
  else no++;
  console.log(`${track.id.padEnd(34)} ${carried ? 'cn' : '--'}  ${why}`);
  await sleep(600);
}
writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`\nmainland China store carries ${yes} of ${yes + no} checked cards`);
