#!/usr/bin/env node
// Turns one top-level family of the checked proposals into src/data/slice.json.
// Reads the files already on disk. Does not call Apple, Wikipedia, MusicBrainz or RYM.
//
//   node catalogue-family.mjs "Punk / Post-Punk / Hardcore"            prints the counts
//   node catalogue-family.mjs "Punk / Post-Punk / Hardcore" --write    also writes the slice and the report
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { here, norm, readRecords, sleep } from './lib.mjs';

const family = process.argv[2];
const write = process.argv.includes('--write');
if (!family) throw new Error('usage: node catalogue-family.mjs "<Family>" [--write]');

async function readJson(file) {
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      return JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      if (attempt === 8) throw error;
      await sleep(200);
    }
  }
  return null;
}

const BAD = /\b(live|karaoke|tribute|remix|demo|acoustic|instrumental|rehearsal|medley|interlude|skit)\b/i;
const inRange = (y) => y >= 1980 && y <= 1989;

function pickTrack(entry) {
  if (!entry?.found) return null;
  if (entry.kind === 'song') {
    const candidates = entry.candidates ?? [];
    return candidates.find((c) => c.penalty === 0) ?? candidates[0] ?? null;
  }
  const withPreview = (entry.tracks ?? []).filter((t) => t.preview);
  const clean = withPreview.filter((t) => !BAD.test(t.name));
  const pool = clean.length ? clean : withPreview;
  const noisy = (name) => /\b(remaster|deluxe|anniversary|bonus)\b/i.test(name);
  return pool.slice().sort((a, b) => Number(noisy(a.name)) - Number(noisy(b.name)) || a.disc - b.disc || a.number - b.number)[0] ?? null;
}

function slug(name) {
  return norm(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';
}

function genreId(path) {
  return path.map(slug).join('.');
}

function searchLink(host, query) {
  const q = encodeURIComponent(query);
  return host === 'netease' ? `https://music.163.com/#/search/m/?s=${q}&type=1` : `https://y.qq.com/n/ryqq/search?w=${q}&t=song`;
}

const [resultsFile, apple, wp, mb] = await Promise.all([
  readJson(here + 'results.json'),
  readJson(here + 'apple.json'),
  readJson(here + 'wp.json'),
  readJson(here + 'mb.json'),
]);
const byKey = new Map(readRecords().map((r) => [r.key, r]));
const rows = resultsFile.results.filter((row) => row.path[0] === family);

const held = { unusable: 0, yearconflict: 0, country: 0, noapple: 0, nopreview: 0, duplicate: 0 };
const candidates = [];
for (const row of rows) {
  const record = byKey.get(row.key);
  if (!row.usable) { held.unusable++; continue; }
  if (row.issues.includes('yearconflict')) { held.yearconflict++; continue; }
  if (row.country !== 'GB' && row.country !== 'US') { held.country++; continue; }
  const found = apple[row.key];
  if (!found?.found) { held.noapple++; continue; }
  const track = pickTrack(found);
  if (!track) { held.nopreview++; continue; }
  const year = [row.years.mb, row.years.wp, row.years.rym].find(inRange);
  const placeNode = row.place.node;
  const depth = record.path.lastIndexOf(placeNode);
  const path = record.path.slice(0, depth + 1);
  const source = row.place.wp
    ? { by: 'wikipedia', term: row.place.wp, url: `https://en.wikipedia.org/wiki/${encodeURIComponent((wp[row.key]?.title ?? record.title).replace(/ /g, '_'))}` }
    : { by: 'musicbrainz', term: row.place.mb, url: `https://musicbrainz.org/release-group/${mb.records[row.key].id}` };
  const appleMatch = found.kind === 'song'
    ? {
        trackId: track.trackId, collectionId: track.collectionId, storefront: found.storefront,
        previewUrl: '', artworkUrl: track.artwork, url: track.url,
      }
    : {
        trackId: track.trackId, collectionId: found.collectionId, storefront: found.storefront,
        previewUrl: '', artworkUrl: found.artwork,
        url: `https://music.apple.com/${found.storefront}/album/${found.collectionId}?i=${track.trackId}`,
      };
  candidates.push({
    row, record, year, path, source, track, apple: appleMatch,
    appleYear: Number(String(found.releaseDate ?? track.releaseDate ?? '').slice(0, 4)) || null,
    appleName: found.name ?? track.album,
  });
}

candidates.sort((a, b) => b.path.length - a.path.length || a.record.tier - b.record.tier);
const seenArtist = new Set();
const kept = [];
for (const item of candidates) {
  const artist = norm(item.record.artist);
  if (seenArtist.has(artist)) { held.duplicate++; continue; }
  seenArtist.add(artist);
  kept.push(item);
}
kept.sort((a, b) => a.row.path.join().localeCompare(b.row.path.join()) || a.record.tier - b.record.tier);

const branchOf = (item) => item.path[1] ?? item.path[0];
const tier1 = kept.filter((item) => item.record.tier === 1);
const branches = [];
for (const item of tier1) if (!branches.includes(branchOf(item))) branches.push(branchOf(item));
const doorKeys = new Set();
for (const branch of branches) {
  if (doorKeys.size >= 3) break;
  doorKeys.add(tier1.find((item) => branchOf(item) === branch).record.key);
}
for (const item of tier1.filter((item) => !doorKeys.has(item.record.key)).sort((a, b) => b.path.length - a.path.length)) {
  if (doorKeys.size >= 3) break;
  doorKeys.add(item.record.key);
}

const genres = new Map();
const addGenre = (path) => {
  path.forEach((_, i) => {
    const id = genreId(path.slice(0, i + 1));
    if (!genres.has(id)) genres.set(id, { id, name: path[i], parent: i === 0 ? null : genreId(path.slice(0, i)) });
  });
};

const records = kept.map((item) => {
  addGenre(item.path);
  const query = `${item.record.artist} ${item.track.name}`;
  return {
    id: `${slug(item.record.artist)}-${slug(item.record.title)}`.slice(0, 80),
    artist: item.record.artist,
    country: item.row.country,
    title: item.record.title,
    kind: { a: 'album', e: 'ep', s: 'single' }[item.record.type],
    year: item.year,
    track: item.track.name,
    genre: genreId(item.path),
    tier: item.record.tier,
    ...(doorKeys.has(item.record.key) ? { door: true } : {}),
    placed: item.source,
    apple: item.apple,
    links: { netease: searchLink('netease', query), qq: searchLink('qq', query) },
  };
});

const floors = [0, 1, 2, 3].map((floor) => records.filter((r) => (r.door ? 0 : r.tier) === floor).length);
const byBranch = new Map();
for (const record of records) {
  const name = record.genre.split('.')[1] ? genres.get(record.genre.split('.').slice(0, 2).join('.'))?.name : genres.get(record.genre).name;
  // branch is the child of the family, recovered from the genre parent chain
  let node = genres.get(record.genre);
  while (node.parent && genres.get(node.parent).parent) node = genres.get(node.parent);
  const branch = node.parent ? node.name : family;
  if (!byBranch.has(branch)) byBranch.set(branch, [0, 0, 0, 0]);
  byBranch.get(branch)[record.door ? 0 : record.tier] += 1;
}

const remasters = kept.filter((item) => item.appleYear && !inRange(item.appleYear));
const summary = {
  family,
  proposed: rows.length,
  kept: records.length,
  held,
  doors: records.filter((r) => r.door).map((r) => `${r.artist} — ${r.title} (${r.year})`),
  floors: { ground: floors[0], floor1: floors[1], floor2: floors[2], floor3: floors[3] },
  branches: Object.fromEntries([...byBranch].map(([name, counts]) => [name, { ground: counts[0], floor1: counts[1], floor2: counts[2], floor3: counts[3] }])),
  appleRemasters: remasters.length,
  sources: { wikipedia: records.filter((r) => r.placed.by === 'wikipedia').length, musicbrainz: records.filter((r) => r.placed.by === 'musicbrainz').length },
};
console.log(JSON.stringify(summary, null, 1));

if (!write) process.exit(0);

const slice = {
  label: `1980s UK/US · ${family}`,
  yearStart: 1980,
  yearEnd: 1989,
  countries: { GB: '英国', US: '美国' },
  genres: [...genres.values()],
  records,
  ties: [],
};
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
writeFileSync(join(root, 'src/data/slice.json'), JSON.stringify(slice, null, 1) + '\n');

const lines = [];
const p = (...xs) => lines.push(...xs);
p('---', 'cursor:', '  subagentId: "bc-d1a276df-c65a-5426-a615-f7f69de85fe5"', '---', '');
p(`# 第一支曲库：${family}`, '');
p('2026-11-24（北京时间）。这一支先做成能玩的一局。提名和流派对照见 [1980s-uk-us-genre-map.md](../docs/1980s-uk-us-genre-map.md)。没有对照 RYM 的发行列表，也不引用没有年份的那些行。', '');
p(`提案 ${summary.proposed} 张。留下 ${summary.kept} 张：年份在 1980 到 1989，MusicBrainz 记的国家是英国或美国，维基百科或 MusicBrainz 把它放到这个流派或它的上级，并且 Apple 上有一段能试听的曲目。`, '');
p('没留下的：', '');
p(`- 年份、国籍或出处没过：${held.unusable}`);
p(`- 两个来源的年份不一致：${held.yearconflict}`);
p(`- MusicBrainz 没记英国或美国：${held.country}`);
p(`- Apple 上没有同名专辑：${held.noapple}`);
p(`- 有专辑但没有试听：${held.nopreview}`);
p(`- 同一个音乐人已经留在更窄的流派里：${held.duplicate}`, '');
p(`出处：维基百科 ${summary.sources.wikipedia} 张，MusicBrainz ${summary.sources.musicbrainz} 张。Apple 上的日期落在 1980 年代以外（多半是后来的再版，卡片仍用首次发行的年份）${summary.appleRemasters} 张。唱片之间还没有查过的关系，结算时只写流派和年份。`, '');
p('楼层张数。地面是开局的三张，地下一层到三层是其余的入口、圈内和深处：', '');
p(`- 地面 ${summary.floors.ground}`);
p(`- 地下一层 ${summary.floors.floor1}`);
p(`- 地下二层 ${summary.floors.floor2}`);
p(`- 地下三层 ${summary.floors.floor3}`, '');
p('各支的楼层：', '');
for (const [name, counts] of Object.entries(summary.branches)) {
  p(`- ${name}：地面 ${counts.ground}，一层 ${counts.floor1}，二层 ${counts.floor2}，三层 ${counts.floor3}`);
}
p('', '在这一支的页面上玩：地址后面加 `?slice=1`。线上的游戏不改，页面上的控件没有字。', '');
p('开局的三张：', '');
for (const door of summary.doors) p(`- ${door}`);
p('');
const reportDir = '/Users/k/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-7944bf32-7d57-43bc-9c44-8d28e739e9a4/files/internal';
writeFileSync(join(reportDir, '1980s-uk-us-punk-family.md'), lines.join('\n'));
console.log('wrote slice and report');
