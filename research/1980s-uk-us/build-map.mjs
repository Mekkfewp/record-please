#!/usr/bin/env node
// Builds the genre map document from records.txt and the three check results
// (mb.json, wp.json, tree.json). Usage: node build-map.mjs <output.md>
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { here, nodeKeys, norm, parseRecords, readRecords } from './lib.mjs';
import { readRymReleases } from './rym.mjs';

const output = process.argv[2];
if (!output) throw new Error('usage: node build-map.mjs <output.md>');

const mb = JSON.parse(readFileSync(here + 'mb.json', 'utf8'));
const wp = JSON.parse(readFileSync(here + 'wp.json', 'utf8'));
const tree = JSON.parse(readFileSync(here + 'tree.json', 'utf8'));
const records = readRecords();

// Names a source may use for the same genre. The document always prints the source's own word.
const ALIASES = {
  'Hip Hop': ['hip hop', 'hip-hop', 'rap'],
  'Slacker Rock': ['slacker rock', 'lo-fi', 'lo-fi indie', 'lo-fi music'],
  'Rockabilly Revival': ['rockabilly revival', 'neo-rockabilly', 'rockabilly'],
  Darkwave: ['darkwave', 'dark wave'],
  'Disco Rap': ['disco rap', 'old-school hip hop', 'old school hip hop', 'old-school hip-hop'],
  'Punk Poetry': ['punk poetry', 'ranting poetry', 'performance poetry'],
  'Punk / Post-Punk / Hardcore': ['punk', 'punk rock', 'post-punk', 'hardcore punk'],
  'Hardcore [Punk]': ['hardcore punk', 'hardcore'],
  'Industrial / Noise': ['industrial', 'noise'],
  'R&B / Soul / Funk': ['r&b', 'rhythm and blues', 'soul', 'funk'],
  'Reggae / Ska / Dancehall': ['reggae', 'ska', 'dancehall'],
  'Electro-Disco': ['electro-disco'],
  'Psychedelic Rock': ['psychedelic rock', 'psychedelia'],
  'Space Rock': ['space rock'],
  'Indie Rock': ['indie rock', 'indie'],
  'Ethereal Wave': ['ethereal wave', 'ethereal', 'ethereal darkwave'],
  Shoegaze: ['shoegaze', 'shoegazing'],
  'Alternative Dance': ['alternative dance', 'indie dance'],
  Baggy: ['baggy', 'madchester'],
  'Gothic Rock': ['gothic rock', 'goth rock', 'goth'],
  Deathrock: ['deathrock', 'death rock'],
  'Dance-Punk': ['dance-punk', 'punk funk', 'disco-punk', 'funk-punk'],
  'New Romantic': ['new romantic', 'new romanticism', 'new romantics'],
  'Mod Revival': ['mod revival', 'mod'],
  'Experimental Rock': ['experimental rock', 'avant-rock', 'avant-garde rock'],
  'Neo-Prog': ['neo-prog', 'neo-progressive rock', 'neo-progressive'],
  'Avant-Prog': ['avant-prog', 'rock in opposition', 'avant-progressive rock'],
  'Glam Metal': ['glam metal', 'hair metal', 'pop metal'],
  AOR: ['aor', 'album-oriented rock', 'adult-oriented rock', 'melodic rock'],
  'Garage Rock Revival': ['garage rock revival', 'garage revival', 'garage rock', 'garage punk'],
  'Neo-Psychedelia': ['neo-psychedelia', 'neo-psychedelic'],
  'Space Rock Revival': ['space rock revival', 'space rock'],
  Psychedelia: ['psychedelia', 'psychedelic', 'psychedelic rock', 'psychedelic pop'],
  'Punk Rock': ['punk rock', 'punk'],
  'Street Punk': ['street punk', 'uk82', 'uk 82'],
  Cowpunk: ['cowpunk', 'country punk'],
  'Synth Punk': ['synth-punk', 'synthpunk', 'electropunk', 'electro-punk'],
  'Hardcore Punk': ['hardcore punk', 'hardcore'],
  'Crust Punk': ['crust punk', 'crust', 'stenchcore'],
  Thrashcore: ['thrashcore', 'fastcore'],
  'Crossover Thrash': ['crossover thrash', 'crossover'],
  Emocore: ['emocore', 'emo', 'emotional hardcore'],
  'New York Hardcore': ['new york hardcore', 'nyhc', 'youth crew'],
  Metal: ['metal', 'heavy metal'],
  NWOBHM: ['nwobhm', 'new wave of british heavy metal'],
  'US Power Metal': ['us power metal', 'power metal', 'american power metal'],
  'Technical Thrash Metal': ['technical thrash metal', 'technical thrash', 'progressive thrash metal'],
  'Traditional Doom Metal': ['traditional doom metal', 'traditional doom', 'doom metal'],
  Synthpop: ['synthpop', 'synth-pop', 'electropop', 'techno-pop', 'technopop'],
  'Minimal Synth': ['minimal synth', 'minimal wave'],
  'Twee Pop': ['twee pop', 'twee'],
  Dance: ['dance', 'dance music'],
  'Electronic Dance Music': ['electronic dance music', 'edm', 'dance'],
  Freestyle: ['freestyle', 'latin freestyle'],
  Electro: ['electro', 'electro-funk', 'electro hop'],
  'Garage House': ['garage house', 'garage', 'us garage', 'new york garage'],
  'Bleep Techno': ['bleep techno', 'bleep', 'bleep and bass'],
  Industrial: ['industrial', 'industrial music'],
  EBM: ['ebm', 'electronic body music', 'industrial dance'],
  Noise: ['noise', 'noise music'],
  'Boom Bap': ['boom bap'],
  'East Coast Hip Hop': ['east coast hip hop', 'east coast hip-hop', 'east coast rap'],
  'West Coast Hip Hop': ['west coast hip hop', 'west coast hip-hop', 'west coast rap'],
  'Southern Hip Hop': ['southern hip hop', 'southern hip-hop', 'southern rap'],
  'Hardcore Hip Hop': ['hardcore hip hop', 'hardcore hip-hop', 'hardcore rap'],
  'Conscious Hip Hop': ['conscious hip hop', 'conscious hip-hop', 'conscious rap'],
  'Political Hip Hop': ['political hip hop', 'political hip-hop', 'political rap'],
  'Gangsta Rap': ['gangsta rap', 'gangsta'],
  'Pop Rap': ['pop rap', 'pop-rap'],
  'UK Hip Hop': ['uk hip hop', 'british hip hop', 'british hip-hop', 'uk hip-hop'],
  'Miami Bass': ['miami bass'],
  'Contemporary R&B': ['contemporary r&b', 'r&b'],
  'New Jack Swing': ['new jack swing', 'swingbeat'],
  'Smooth Soul': ['smooth soul', 'quiet storm'],
  'Pop Soul': ['pop soul', 'pop-soul', 'blue-eyed soul'],
  'Southern Soul': ['southern soul'],
  'UK Street Soul': ['uk street soul', 'street soul'],
  'Synth Funk': ['synth funk', 'synth-funk'],
  'P-Funk': ['p-funk', 'p funk'],
  Britfunk: ['britfunk', 'brit funk', 'brit-funk'],
  Gospel: ['gospel', 'contemporary gospel', 'urban contemporary gospel', 'black gospel'],
  'Jazz Fusion': ['jazz fusion', 'fusion', 'jazz rock', 'jazz-rock'],
  'Post-Bop': ['post-bop', 'neo-bop'],
  'Avant-Garde Jazz': ['avant-garde jazz', 'avant-jazz', 'experimental jazz'],
  'ECM Style Jazz': ['ecm style jazz'],
  'Smooth Jazz': ['smooth jazz', 'crossover jazz'],
  'Space Ambient': ['space ambient', 'space music'],
  'New Age': ['new age', 'new-age'],
  'Classical Music': ['classical', 'classical music'],
  'Modern Classical': ['modern classical', 'contemporary classical', 'contemporary classical music'],
  Minimalism: ['minimalism', 'minimal music', 'minimalist music', 'minimal'],
  'Post-Minimalism': ['post-minimalism', 'postminimalism'],
  Experimental: ['experimental', 'experimental music', 'avant-garde'],
  'Sound Collage': ['sound collage', 'plunderphonics', 'collage'],
  Drone: ['drone', 'drone music'],
  'Free Improvisation': ['free improvisation', 'free improv'],
  Electroacoustic: ['electroacoustic', 'electroacoustic music', 'electro-acoustic', 'computer music', 'tape music', 'musique concrète'],
  'Computer Music': ['computer music'],
  'Tape Music': ['tape music'],
  Folk: ['folk', 'folk music'],
  'Contemporary Folk': ['contemporary folk'],
  'British Folk Rock': ['british folk rock', 'electric folk'],
  'Folk Rock': ['folk rock'],
  'Traditional Folk Music': ['traditional folk', 'traditional folk music', 'traditional'],
  'English Folk Music': ['english folk music', 'english folk', 'british folk'],
  'Scottish Folk Music': ['scottish folk music', 'scottish folk', 'celtic', 'scottish'],
  Country: ['country', 'country music'],
  'Neotraditional Country': ['neotraditional country', 'neotraditionalist country', 'new traditionalist'],
  'Progressive Country': ['progressive country', 'alternative country', 'alt-country', 'alt.country', 'americana', 'texas country'],
  'Country Pop': ['country pop', 'countrypolitan'],
  'Progressive Bluegrass': ['progressive bluegrass', 'newgrass', 'new acoustic'],
  'Electric Blues': ['electric blues', 'texas blues', 'chicago blues'],
  'Delta Blues': ['delta blues', 'hill country blues'],
  '2 Tone': ['2 tone', 'two-tone', 'two tone'],
  'Third Wave Ska': ['third wave ska', 'third-wave ska'],
  Reggae: ['reggae'],
  'Roots Reggae': ['roots reggae'],
  Dub: ['dub', 'dub music'],
  'Rock & Roll': ['rock and roll', "rock 'n' roll", 'rock & roll'],
  'Yacht Rock': ['yacht rock', 'west coast aor'],
  'Teen Pop': ['teen pop', 'bubblegum pop'],
  Poetry: ['poetry', 'spoken word'],
  'Spoken Word': ['spoken word'],
  'Singer-Songwriter': ['singer-songwriter'],
  Tejano: ['tejano', 'conjunto', 'tex-mex', 'norteño'],
  'Jam Band': ['jam band', 'jam'],
  Zydeco: ['zydeco'],
};
const namesFor = (node) => (ALIASES[node] ?? [node.toLowerCase()]).map(norm).concat(norm(node));

const TIER = { 1: '入口', 2: '圈内', 3: '深处' };
const TYPE = { a: '专辑', e: 'EP', s: '单曲' };
const inRange = (y) => y >= 1980 && y <= 1989;
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\*/g, '\\*');
const wpUrl = (title) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%2C/g, ',').replace(/%3A/g, ':')}`;

// Rows another worker copied from RYM's own genre pages (dated discography rows only). A row
// puts the record in that RYM genre; the ranking lists are not used for this.
const RYM_GENRE = { UK82: 'Street Punk', Madchester: 'Baggy' };
const rymKey = (artist, title) => `${norm(artist.replace(/^the /i, ''))}|${norm(title.split(' / ')[0])}`;
const rymRows = new Map();
for (const row of readRymReleases().filter((x) => x.list === 'discography')) {
  const key = rymKey(row.artist, row.title);
  if (!rymRows.has(key)) rymRows.set(key, []);
  rymRows.get(key).push(row);
}
function rymPlace(r) {
  for (const row of rymRows.get(rymKey(r.artist, r.title)) ?? []) {
    const node = RYM_GENRE[row.genre] ?? row.genre;
    const depth = r.path.lastIndexOf(node);
    if (depth >= 0) return { depth, node: r.path[depth], rym: row.genre, year: row.year };
  }
  return null;
}


function check(r) {
  const m = mb.records[r.key];
  const w = wp[r.key];
  const res = { r, m: m?.found ? m : null, w: w?.found ? w : null, issues: [], place: null, country: null };
  const onRym = rymPlace(r);
  const mbYear = res.m?.first ? Number(res.m.first.slice(0, 4)) : null;
  const wpYear = res.w?.released ?? null;
  res.years = { mb: mbYear, wp: wpYear, rym: onRym?.year ?? null };
  const years = [mbYear, wpYear, res.years.rym].filter(Boolean);
  if (!res.m && !res.w && !onRym) res.issues.push('nosource');
  else if (years.length === 0) res.issues.push('noyear');
  else if (years.every((y) => !inRange(y))) res.issues.push('year');
  else if (years.some((y) => !inRange(y))) res.issues.push('yearconflict');
  const artist = res.m ? mb.artists[res.m.artistId] : null;
  res.country = artist?.country ?? null;
  if (res.m && res.country && !['GB', 'US'].includes(res.country)) res.issues.push('country');
  // Where do the sources put it? Walk from the leaf up to the top-level family.
  for (let depth = r.path.length - 1; depth >= 0 && !res.place; depth--) {
    const wanted = namesFor(r.path[depth]);
    const fromWp = res.w?.genres.find((g) => wanted.includes(norm(g)));
    const fromMb = res.m?.genres.find((g) => wanted.includes(norm(g)));
    const fromRym = onRym && onRym.depth === depth ? onRym.rym : null;
    if (fromWp || fromMb || fromRym) res.place = { depth, node: r.path[depth], wp: fromWp ?? null, mb: fromMb ?? null, rym: fromRym };
  }
  res.level = !res.place ? 'none' : res.place.depth === r.path.length - 1 ? 'leaf' : 'parent';
  return res;
}

const results = records.map(check);
const ok = (x) => !x.issues.some((i) => ['nosource', 'year', 'country', 'noyear'].includes(i));
const usable = (x) => ok(x) && x.level !== 'none';
const count = (f) => results.filter(f).length;

// ---- tree, depth-first, so a family's branches stay together ----
const nodeInfo = new Map(tree.nodes.map((n) => [n.key, n]));
const children = new Map();
for (const key of nodeInfo.keys()) {
  const parent = key.includes(' > ') ? key.slice(0, key.lastIndexOf(' > ')) : '';
  if (!children.has(parent)) children.set(parent, []);
  children.get(parent).push(key);
}
const keys = [];
const walk = (key) => {
  if (key) keys.push(key);
  for (const child of children.get(key) ?? []) walk(child);
};
walk('');
const leafRecords = new Map();
for (const x of results) {
  const key = x.r.path.join(' > ');
  if (!leafRecords.has(key)) leafRecords.set(key, []);
  leafRecords.get(key).push(x);
}

const RYM_MARK = { match: 'RYM', 'match-uncategorized': 'RYM', scene: 'RYM:场景', absent: 'RYM:无此项', differs: 'RYM:上级不同', 'unread-edge': '', unread: '' };
// These three pages were requested and returned RYM's security check, so nothing on them was read.
// Their names do appear as children on the House and Techno pages. Record placements stay with
// Wikipedia and MusicBrainz, and are not checked against RYM.
const RELEASE_UNREAD = new Set(['Chicago House', 'Acid House', 'Detroit Techno']);
const isMatch = (n) => n.rym === 'match' || n.rym === 'match-uncategorized';
const nodes = keys.map((k) => nodeInfo.get(k));
const stats = {
  total: results.length,
  leaves: leafRecords.size,
  nodes: nodes.length,
  families: nodes.filter((n) => !n.parent).length,
  maxDepth: Math.max(...keys.map((k) => k.split(' > ').length)),
  rymMatch: nodes.filter(isMatch).length,
  rymUncategorized: nodes.filter((n) => n.rym === 'match-uncategorized').length,
  rymScene: nodes.filter((n) => n.rym === 'scene').length,
  rymOther: nodes.filter((n) => ['absent', 'differs'].includes(n.rym)).length,
  rymUnread: nodes.filter((n) => ['unread', 'unread-edge'].includes(n.rym)).length,
  mbNodes: nodes.filter((n) => n.inMusicBrainz).length,
  wpNodes: nodes.filter((n) => n.wikipedia).length,
  unreadWithOther: nodes.filter((n) => ['unread', 'unread-edge'].includes(n.rym) && (n.inMusicBrainz || n.wikipedia)).length,
  inBoth: count((x) => x.m && x.w),
  inMb: count((x) => x.m),
  inWp: count((x) => x.w),
  onRym: count((x) => x.place?.rym),
  nosource: count((x) => x.issues.includes('nosource')),
  year: count((x) => x.issues.includes('year')),
  yearconflict: count((x) => x.issues.includes('yearconflict')),
  country: count((x) => x.issues.includes('country')),
  leaf: count((x) => ok(x) && x.level === 'leaf'),
  parent: count((x) => ok(x) && x.level === 'parent'),
  none: count((x) => ok(x) && x.level === 'none'),
  usable: count(usable),
  byTier: [1, 2, 3].map((t) => ({ tier: t, proposed: count((x) => x.r.tier === t), usable: count((x) => x.r.tier === t && usable(x)) })),
  leavesWith3: [...leafRecords.values()].filter((v) => v.filter(usable).length >= 3).length,
  leavesWith0: [...leafRecords.entries()].filter(([, v]) => v.filter(usable).length === 0).map(([k]) => k),
};
stats.tier1 = stats.byTier[0].proposed;
stats.tier1ok = stats.byTier[0].usable;
stats.tier2 = stats.byTier[1].proposed;
stats.tier2ok = stats.byTier[1].usable;
stats.tier3 = stats.byTier[2].proposed;
stats.tier3ok = stats.byTier[2].usable;
// A node is "changed" when the same name sat somewhere else in the proposal this branch started from.
const previous = parseRecords(execFileSync('git', ['show', 'HEAD:research/1980s-uk-us/records.txt'], { cwd: join(here, '..', '..'), encoding: 'utf8' }));
const then = new Map();
for (const key of nodeKeys(previous)) then.set(key.split(' > ').at(-1), key);
const now = [...nodeKeys(records)];
stats.pathSame = now.filter((key) => then.get(key.split(' > ').at(-1)) === key).length;
stats.pathChanged = now.filter((key) => then.has(key.split(' > ').at(-1)) && then.get(key.split(' > ').at(-1)) !== key).length;
stats.pathAdded = now.filter((key) => !then.has(key.split(' > ').at(-1))).length;
const changedNames = new Set(now.filter((key) => then.has(key.split(' > ').at(-1)) && then.get(key.split(' > ').at(-1)) !== key).map((key) => key.split(' > ').at(-1)));
stats.changedMatch = nodes.filter((n) => changedNames.has(n.name) && isMatch(n)).length;
stats.changedUnread = nodes.filter((n) => changedNames.has(n.name) && ['unread', 'unread-edge'].includes(n.rym)).length;
stats.changedScene = nodes.filter((n) => changedNames.has(n.name) && n.rym === 'scene').length;
stats.changedOther = nodes.filter((n) => changedNames.has(n.name) && ['absent', 'differs'].includes(n.rym)).length;

const L = [];
const p = (...lines) => L.push(...lines);
const src = (x) => {
  const out = [];
  if (x.place?.rym && !x.r.path.some((name) => RELEASE_UNREAD.has(name))) out.push(`RYM 的 ${x.place.rym} 页面在带年份的发行列表里列有这张`);
  if (x.place?.wp) out.push(`[维基百科](${wpUrl(x.w.title)})：${x.place.wp}`);
  if (x.place?.mb) out.push(`[MusicBrainz](https://musicbrainz.org/release-group/${x.m.id})：${x.place.mb}`);
  return out.join('；');
};
const label = (x) => `${esc(x.r.artist)}《${esc(x.r.title)}》`;

p('---', 'cursor:', '  subagentId: "bc-d1a276df-c65a-5426-a615-f7f69de85fe5"', '---', '');
p(readFileSync(here + 'map-intro.md', 'utf8').replace(/\{(\w+)\}/g, (_, k) => (k in stats ? String(stats[k]) : `{${k}}`)).trimEnd(), '');

p('## 流派树', '');
p('每行后面的记号：', '');
p('- `RYM`：名字和上一级都和 RYM 的页面一致。');
p('- `RYM:场景`：RYM 有这个名字，但把它列在 Scenes & Movements 下面，没有给它流派上的上一级；挂在这里是我的安排。');
p('- 没有 `RYM` 记号：这一支的 RYM 页面没有读到，还没有核对。');
p('- `MB`：名字在 MusicBrainz 的流派名单里。`WP`：英文维基百科有这个流派的条目。`↑`：维基百科的流派条目支持它和上一级的关系。');
p('- 方括号里是提名的唱片数，斜杠后面是其中通过核对、可以进曲库候选的张数。', '');
let family = null;
for (const key of keys) {
  const n = nodeInfo.get(key);
  const depth = key.split(' > ').length - 1;
  if (depth === 0) {
    if (family) p('```', '');
    family = n.name;
    p(`### ${n.name}`, '', '```');
  }
  const marks = [RYM_MARK[n.rym] || null, RELEASE_UNREAD.has(n.name) ? '发行列表未读' : null, n.inMusicBrainz ? 'MB' : null, n.wikipedia ? 'WP' : null, n.edge && n.edge !== 'not-found' ? '↑' : null].filter(Boolean).join(' ');
  const recs = leafRecords.get(key);
  const tally = recs ? `  [${recs.length}/${recs.filter(usable).length}]` : '';
  p(`${'  '.repeat(depth)}${n.name}${marks ? `  ${marks}` : ''}${tally}`);
}
p('```', '');

p('## 每个流派提名的唱片', '');
p('每个流派下按"入口、圈内、深处"三档排列。"出处"一栏写的是来源自己用的词，链接指向那个来源。"只到上一级"表示来源没有用这个流派的名字，只用了它上面某一级的名字，这张唱片如果进曲库，就挂在那一级。', '');
family = null;
for (const key of keys) {
  const recs = leafRecords.get(key);
  if (!recs) continue;
  const path = key.split(' > ');
  if (path[0] !== family) {
    family = path[0];
    p(`### ${family}`, '');
  }
  const n = nodeInfo.get(key);
  const status = [
    isMatch(n) ? '' : n.rym === 'scene' ? '（RYM 列为场景）' : '（未对照 RYM）',
    path.some((name) => RELEASE_UNREAD.has(name)) ? '（发行列表没有读到，出处不对照 RYM）' : '',
  ].join('');
  p(`#### ${path.join(' › ')}${status}`, '');
  p('| 档 | 音乐人 | 唱片 | 年份 | 出处把它放在哪里 | 核对 |', '| --- | --- | --- | --- | --- | --- |');
  for (const x of [...recs].sort((a, b) => a.r.tier - b.r.tier)) {
    let placed = src(x);
    if (x.level === 'parent') placed = `只到上一级 ${x.place.node}。${placed}`;
    if (x.level === 'none') {
      const seen = [];
      if (x.w) seen.push(`[维基百科](${wpUrl(x.w.title)})写的是：${x.w.genres.slice(0, 4).join('、') || '没有流派栏'}`);
      if (x.m) seen.push(`[MusicBrainz](https://musicbrainz.org/release-group/${x.m.id}) 写的是：${x.m.genres.slice(0, 4).join('、') || '没有流派标签'}`);
      placed = seen.length ? `没有出处。${seen.join('；')}` : '两处都没有查到这张唱片';
    }
    const notes = [];
    const y = x.years.mb ?? x.years.wp ?? x.years.rym;
    if (x.issues.includes('year')) notes.push(`年份不在 1980 年代（${[x.years.mb, x.years.wp].filter(Boolean).join(' / ')}）`);
    if (x.issues.includes('yearconflict')) notes.push(`年份不一致（MusicBrainz ${x.years.mb ?? '无'}，维基百科 ${x.years.wp ?? '无'}）`);
    if (x.issues.includes('noyear')) notes.push('没查到年份');
    if (x.issues.includes('country')) notes.push(`MusicBrainz 记的国家是 ${x.country}`);
    if (x.m && !x.country) notes.push('MusicBrainz 没记国家');
    if (!x.m && (x.w || x.place?.rym)) notes.push('国籍没核对');
    if (y && inRange(y) && y !== x.r.year && !x.issues.includes('yearconflict')) notes.push(`我写的是 ${x.r.year}`);
    p(`| ${TIER[x.r.tier]} | ${esc(x.r.artist)} | ${esc(x.r.title)}${x.r.type === 'a' ? '' : `（${TYPE[x.r.type]}）`} | ${y ?? `${x.r.year}？`} | ${placed} | ${notes.join('；') || (x.issues.includes('nosource') ? '没核对' : '通过')} |`);
  }
  p('');
}

p('## 没有通过核对的', '');
p('这些不会进曲库，除非另有出处。逐张的情况在上面的表里。', '');
const list = (title, items, show) => {
  p(`### ${title}（${items.length} 张）`, '');
  if (items.length === 0) p('没有。', '');
  else p(items.map(show).join('；') + '。', '');
};
list('年份不在 1980 到 1989 年', results.filter((x) => x.issues.includes('year')), (x) => `${label(x)}（${[x.years.mb, x.years.wp].filter(Boolean).join(' / ')}）`);
list('两个来源的年份不一致，要人工看', results.filter((x) => x.issues.includes('yearconflict')), (x) => `${label(x)}（MusicBrainz ${x.years.mb ?? '无'}，维基百科 ${x.years.wp ?? '无'}）`);
list('MusicBrainz 记的国家不是英国或美国', results.filter((x) => x.issues.includes('country')), (x) => `${label(x)}（${x.country}）`);
list('年份和国籍没问题，但没有出处把它放进这个流派或它的上级', results.filter((x) => ok(x) && x.level === 'none'), label);
list('MusicBrainz 和维基百科都没有查到', results.filter((x) => x.issues.includes('nosource')), label);

p('## 一张候选都没有的流派', '');
p('这些叶子上的提名没有一张同时过了年份、国籍和出处。', '');
if (stats.leavesWith0.length === 0) p('没有。', '');
else for (const key of stats.leavesWith0) p(`- ${key}`);
p('');

writeFileSync(here + 'results.json', JSON.stringify({ stats, results: results.map((x) => ({ key: x.r.key, path: x.r.path, tier: x.r.tier, type: x.r.type, issues: x.issues, level: x.level, place: x.place, country: x.country, years: x.years, usable: usable(x) })) }, null, 1));
const text = L.join('\n');
writeFileSync(output, text.endsWith('\n') ? text : text + '\n');
console.log(JSON.stringify(stats, null, 1));
console.log('not in MB list:', nodes.filter((n) => !n.inMusicBrainz).map((n) => n.name).join(', '));
console.log('no WP article:', nodes.filter((n) => !n.wikipedia).map((n) => n.name).join(', '));
console.log('rym other:', nodes.filter((n) => !isMatch(n)).map((n) => `${n.key} [${n.rym}${n.rymParents?.length ? `: ${n.rymParents.join(' | ')}` : ''}]`).join('\n  '));
