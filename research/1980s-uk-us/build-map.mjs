#!/usr/bin/env node
// Builds the genre map document from records.txt and the three check results
// (mb.json, wp.json, tree.json). Usage: node build-map.mjs <output.md>
import { readFileSync, writeFileSync } from 'node:fs';
import { here, norm, readRecords } from './lib.mjs';

const output = process.argv[2];
if (!output) throw new Error('usage: node build-map.mjs <output.md>');

const mb = JSON.parse(readFileSync(here + 'mb.json', 'utf8'));
const wp = JSON.parse(readFileSync(here + 'wp.json', 'utf8'));
const tree = JSON.parse(readFileSync(here + 'tree.json', 'utf8'));
const records = readRecords();

// Names a source may use for the same genre. The document always prints the source's own word.
const ALIASES = {
  'Hip Hop': ['hip hop', 'hip-hop', 'rap'],
  'Indie Rock': ['indie rock', 'indie'],
  'Lo-Fi Indie': ['lo-fi', 'lo-fi indie', 'lo-fi music'],
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
  Punk: ['punk', 'punk rock'],
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
  'Industrial & Noise': ['industrial', 'noise'],
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
  'R&B': ['r&b', 'rhythm and blues', 'contemporary r&b'],
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
  Electroacoustic: ['electroacoustic', 'electroacoustic music'],
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
  'Neo-Rockabilly': ['neo-rockabilly', 'rockabilly revival', 'rockabilly'],
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

function check(r) {
  const m = mb.records[r.key];
  const w = wp[r.key];
  const res = { r, m: m?.found ? m : null, w: w?.found ? w : null, issues: [], place: null, country: null };
  const mbYear = res.m?.first ? Number(res.m.first.slice(0, 4)) : null;
  const wpYear = res.w?.released ?? null;
  res.years = { mb: mbYear, wp: wpYear };
  if (!res.m && !res.w) res.issues.push('nosource');
  else {
    const years = [mbYear, wpYear].filter(Boolean);
    if (years.length === 0) res.issues.push('noyear');
    else if (years.every((y) => !inRange(y))) res.issues.push('year');
    else if (years.some((y) => !inRange(y))) res.issues.push('yearconflict');
  }
  const artist = res.m ? mb.artists[res.m.artistId] : null;
  res.country = artist?.country ?? null;
  res.artistArea = artist?.area ?? null;
  if (res.m && res.country && !['GB', 'US'].includes(res.country)) res.issues.push('country');
  // Where do the sources put it? Walk from the leaf up to the top-level family.
  for (let depth = r.path.length - 1; depth >= 0 && !res.place; depth--) {
    const wanted = namesFor(r.path[depth]);
    const fromWp = res.w?.genres.find((g) => wanted.includes(norm(g)));
    const fromMb = res.m?.genres.find((g) => wanted.includes(norm(g)));
    if (fromWp || fromMb) res.place = { depth, node: r.path[depth], wp: fromWp ?? null, mb: fromMb ?? null };
  }
  res.level = !res.place ? 'none' : res.place.depth === r.path.length - 1 ? 'leaf' : 'parent';
  return res;
}

const results = records.map(check);
const ok = (x) => !x.issues.some((i) => ['nosource', 'year', 'country', 'noyear'].includes(i));
const count = (f) => results.filter(f).length;

// ---- tree ----
const nodeInfo = new Map(tree.nodes.map((n) => [n.key, n]));
const leafRecords = new Map();
for (const x of results) {
  const key = x.r.path.join(' > ');
  if (!leafRecords.has(key)) leafRecords.set(key, []);
  leafRecords.get(key).push(x);
}
const unsureLeaves = new Set(records.filter((r) => r.unsure).map((r) => r.path.join(' > ')));
const EDGE = {
  'parent-lists-child': '上级条目把它列为子类',
  'child-lists-parent-as-origin': '条目把上级列为来源',
  'lead-links-to-parent': '条目开头提到上级',
  'not-found': '没查到',
};

const L = [];
const p = (...lines) => L.push(...lines);
p('---', 'cursor:', '  subagentId: "bc-a695e51d-5b7e-58b5-8610-e028452164cf"', '---', '');
p('# 1980 年代英国和美国：流派图和提名的唱片', '');
p(process.env.MAP_INTRO ?? '', '');

p('## 流派树', '');
p('每行后面的记号：`MB` 表示这个名字在 MusicBrainz 的流派名单里；`WP` 表示英文维基百科有这个流派的条目；`↑` 表示维基百科的流派条目支持它和上一级的关系；`?` 表示我对它在 RYM 上的上一级没有把握。方括号里是这个节点下提名的唱片数，斜杠后面是其中通过年份和国籍核对、并且有出处把它放进这个流派（或它的上一级）的张数。', '');
p('**整棵树的每一个节点，都还没有对着 RYM 本身核对过。**', '');
// Depth-first order, so a family's branches stay together whatever order records.txt lists them in.
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
let family = null;
for (const key of keys) {
  const n = nodeInfo.get(key);
  const depth = key.split(' > ').length - 1;
  if (depth === 0) {
    if (family) p('```', '');
    family = n.name;
    p(`### ${n.name}`, '', '```');
  }
  const marks = [n.inMusicBrainz ? 'MB' : null, n.wikipedia ? 'WP' : null, n.edge && n.edge !== 'not-found' ? '↑' : null, unsureLeaves.has(key) ? '?' : null].filter(Boolean).join(' ');
  const recs = leafRecords.get(key);
  const tally = recs ? ` [${recs.length}/${recs.filter((x) => ok(x) && x.level !== 'none').length}]` : '';
  p(`${'  '.repeat(depth)}${n.name}${marks ? `  ${marks}` : ''}${tally}`);
}
p('```', '');

// ---- per-leaf tables ----
p('## 每个流派提名的唱片', '');
p('每个流派下按"入口、圈内、深处"三档排列。"出处"一栏写的是来源自己用的词，链接指向那个来源；"只到上一级"表示来源没有用这个流派的名字，只用了它上一级的名字。', '');
family = null;
for (const key of keys) {
  const recs = leafRecords.get(key);
  if (!recs) continue;
  const path = key.split(' > ');
  if (path[0] !== family) {
    family = path[0];
    p(`### ${family}`, '');
  }
  p(`#### ${path.join(' › ')}${unsureLeaves.has(key) ? '（上一级待核对）' : ''}`, '');
  p('| 档 | 音乐人 | 唱片 | 年份 | 出处把它放在哪里 | 核对 |', '| --- | --- | --- | --- | --- | --- |');
  for (const x of [...recs].sort((a, b) => a.r.tier - b.r.tier)) {
    const src = [];
    if (x.place?.wp) src.push(`[维基百科](${wpUrl(x.w.title)})：${x.place.wp}`);
    if (x.place?.mb) src.push(`[MusicBrainz](https://musicbrainz.org/release-group/${x.m.id})：${x.place.mb}`);
    let placed = src.join('；');
    if (x.level === 'parent') placed = `只到上一级。${placed}`;
    if (x.level === 'none') {
      const seen = [];
      if (x.w) seen.push(`[维基百科](${wpUrl(x.w.title)})写的是：${x.w.genres.slice(0, 4).join('、') || '没有流派栏'}`);
      if (x.m) seen.push(`[MusicBrainz](https://musicbrainz.org/release-group/${x.m.id}) 写的是：${x.m.genres.slice(0, 4).join('、') || '没有流派标签'}`);
      placed = seen.length ? `没有出处。${seen.join('；')}` : '两处都没有查到这张唱片';
    }
    const notes = [];
    const y = x.years.mb ?? x.years.wp;
    if (x.issues.includes('year')) notes.push(`年份不在 1980 年代（${[x.years.mb, x.years.wp].filter(Boolean).join(' / ')}）`);
    if (x.issues.includes('yearconflict')) notes.push(`两处年份不一致（MusicBrainz ${x.years.mb}，维基百科 ${x.years.wp}）`);
    if (x.issues.includes('noyear')) notes.push('没查到年份');
    if (x.issues.includes('country')) notes.push(`MusicBrainz 记的国家是 ${x.country}`);
    if (x.m && !x.country) notes.push('MusicBrainz 没记国家');
    if (!x.m && x.w) notes.push('国籍没核对（MusicBrainz 没找到）');
    if (y && inRange(y) && y !== x.r.year && !x.issues.includes('yearconflict')) notes.push(`我写的是 ${x.r.year}，来源是 ${y}`);
    const shownYear = y ?? x.r.year;
    p(`| ${TIER[x.r.tier]} | ${esc(x.r.artist)} | ${esc(x.r.title)}${x.r.type === 'a' ? '' : `（${TYPE[x.r.type]}）`} | ${shownYear}${y ? '' : '？'} | ${placed} | ${notes.join('；') || (x.level === 'none' && !x.m && !x.w ? '没核对' : '通过')} |`);
  }
  p('');
}

const stats = {
  total: results.length,
  leaves: leafRecords.size,
  nodes: tree.nodes.length,
  families: tree.nodes.filter((n) => !n.parent).length,
  found: count((x) => x.m || x.w),
  nosource: count((x) => x.issues.includes('nosource')),
  year: count((x) => x.issues.includes('year')),
  yearconflict: count((x) => x.issues.includes('yearconflict')),
  country: count((x) => x.issues.includes('country')),
  leaf: count((x) => ok(x) && x.level === 'leaf'),
  parent: count((x) => ok(x) && x.level === 'parent'),
  none: count((x) => ok(x) && x.level === 'none'),
  byTier: [1, 2, 3].map((t) => ({ tier: t, proposed: count((x) => x.r.tier === t), placed: count((x) => x.r.tier === t && ok(x) && x.level !== 'none') })),
  mbNodes: tree.nodes.filter((n) => n.inMusicBrainz).length,
  wpNodes: tree.nodes.filter((n) => n.wikipedia).length,
  edges: tree.nodes.filter((n) => n.parent).length,
  edgesOk: tree.nodes.filter((n) => n.parent && n.edge !== 'not-found').length,
};
writeFileSync(here + 'results.json', JSON.stringify({ stats, results: results.map((x) => ({ key: x.r.key, path: x.r.path, tier: x.r.tier, issues: x.issues, level: x.level, place: x.place, country: x.country, years: x.years })) }, null, 1));

const text = L.join('\n').replace('\n\n\n', '\n\n');
writeFileSync(output, text.endsWith('\n') ? text : text + '\n');
console.log(JSON.stringify(stats, null, 1));
console.log(
  'nodes not in MB list:',
  tree.nodes.filter((n) => !n.inMusicBrainz).map((n) => n.name).join(', '),
);
console.log('nodes without WP article:', tree.nodes.filter((n) => !n.wikipedia).map((n) => n.name).join(', '));
console.log('edges not found:', tree.nodes.filter((n) => n.parent && n.edge === 'not-found').map((n) => `${n.parent} > ${n.name}`).join('; '));
console.log(EDGE['not-found']);
