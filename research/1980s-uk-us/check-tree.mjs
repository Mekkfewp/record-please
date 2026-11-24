#!/usr/bin/env node
// For every node of the tree: is the name on MusicBrainz's genre list, is there an English
// Wikipedia article for it, and does that article's genre infobox tie it to its parent
// (parent lists it under subgenres / fusion genres / derivatives, or it lists the parent under
// stylistic origins)? Writes tree.json. RYM itself is not read.
import { readFileSync, writeFileSync } from 'node:fs';
import { UA, getJson, here, norm, readRecords, sleep } from './lib.mjs';

// Wikipedia article for a node name, where a search for the plain name would land elsewhere.
const TITLES = {
  Rock: 'Rock music', Pop: 'Pop music', Punk: 'Punk rock', Metal: 'Heavy metal music', Dance: 'Dance music',
  Electronic: 'Electronic music', 'Industrial & Noise': null, Industrial: 'Industrial music', Noise: 'Noise music',
  'Hip Hop': 'Hip-hop', 'R&B': 'Rhythm and blues', Jazz: 'Jazz', Ambient: 'Ambient music', 'New Age': 'New-age music',
  'Classical Music': 'Classical music', Experimental: 'Experimental music', Folk: 'Folk music', Country: 'Country music',
  Blues: 'Blues', Ska: 'Ska', 'Regional Music': null, Psychedelia: 'Psychedelic music', 'Spoken Word': 'Spoken word',
  'Singer-Songwriter': 'Singer-songwriter', Soul: 'Soul music', Funk: 'Funk', Disco: 'Disco', House: 'House music',
  Techno: 'Techno', Electro: 'Electro (music)', Freestyle: 'Freestyle music', Boogie: 'Boogie (genre)', Drone: 'Drone music',
  Minimalism: 'Minimal music', Totalism: 'Totalism (music)', Emocore: 'Emo', AOR: 'Album-oriented rock',
  NWOBHM: 'New wave of British heavy metal', EBM: 'Electronic body music', 'US Power Metal': 'Power metal',
  'Neo-Prog': 'Neo-progressive rock', 'Lo-Fi Indie': 'Lo-fi music', 'Space Ambient': 'Space music', '2 Tone': '2 Tone (music genre)',
  'Modern Classical': 'Contemporary classical music', 'Caribbean Music': 'Caribbean music', 'Jamaican Music': 'Music of Jamaica',
  Reggae: 'Reggae', Dub: 'Dub music', Gospel: 'Gospel music', Poetry: null, 'Electronic Dance Music': 'Electronic dance music',
  'Traditional Folk Music': 'Folk music', 'English Folk Music': 'English folk music', 'Scottish Folk Music': 'Scottish folk music',
  'Northern American Music': null, 'Hispanic American Music': null, 'South Asian Music': null, 'Punjabi Music': 'Music of Punjab',
  'Cajun & Creole Music': 'Cajun music', Tejano: 'Tejano music', Bhangra: 'Bhangra (music)', 'Big Band': 'Big band',
  'Rock & Roll': 'Rock and roll', 'Hardcore Hip Hop': 'Hardcore hip-hop', 'Contemporary R&B': 'Contemporary R&B',
  'Garage Rock Revival': null, 'Space Rock Revival': null, 'ECM Style Jazz': null, 'Technical Thrash Metal': null,
  Britcore: null, 'UK Street Soul': null, 'Tribal Ambient': null, 'Tape Music': 'Tape music', 'Computer Music': 'Computer music',
  Electroacoustic: 'Electroacoustic music', 'Art Punk': 'Art punk', 'Synth Punk': 'Synth-punk', 'Pop Soul': 'Pop-soul',
};

const state = {};
const api = (params) => getJson(`https://en.wikipedia.org/w/api.php?format=json&${params}`, 700, state);
async function raw(title) {
  await sleep(500);
  const res = await fetch(`https://en.wikipedia.org/w/index.php?action=raw&title=${encodeURIComponent(title)}`, { headers: { 'User-Agent': UA } });
  return res.ok ? await res.text() : null;
}
function field(text, name) {
  const m = text.match(new RegExp(`\\n\\s*\\|\\s*${name}\\s*=([\\s\\S]*?)(?=\\n\\s*\\|\\s*[a-z_ ]+\\d*\\s*=|\\n\\}\\})`, 'i'));
  return m ? m[1] : '';
}
function names(value) {
  const clean = value.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const out = [];
  for (const m of clean.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) out.push(m[1].trim(), (m[2] ?? m[1]).trim());
  return [...new Set(out.map((s) => s.toLowerCase()))];
}

const mbGenres = new Set(readFileSync(here + 'musicbrainz-genres.txt', 'utf8').split('\n').map((x) => norm(x)).filter(Boolean));
const paths = new Map();
for (const r of readRecords()) r.path.forEach((_, i) => paths.set(r.path.slice(0, i + 1).join(' > '), r.path.slice(0, i + 1)));
const articles = {};
for (const path of paths.values()) {
  const name = path[path.length - 1];
  if (name in articles) continue;
  let title = name in TITLES ? TITLES[name] : null;
  if (!(name in TITLES)) {
    const search = await api(`action=query&list=search&srlimit=3&srsearch=${encodeURIComponent(`${name} music genre`)}`);
    const hit = (search?.query?.search ?? []).find((h) => {
      const t = norm(h.title.replace(/\s*\([^)]*\)$/, '').replace(/ music$/i, ''));
      return t === norm(name) || t === norm(name.replace(/ music$/i, ''));
    });
    title = hit?.title ?? null;
  }
  const entry = (articles[name] = { title, infobox: false, origins: [], subgenres: [], fusion: [], derivatives: [], linksTo: [] });
  if (!title) { console.log(`-- ${name}`); continue; }
  let text = await raw(title);
  const redirect = text?.match(/^#REDIRECT\s*\[\[([^\]#|]+)/i);
  if (redirect) { entry.title = redirect[1]; text = await raw(redirect[1]); }
  if (!text) { entry.title = null; console.log(`-- ${name}`); continue; }
  entry.infobox = /\{\{\s*Infobox music genre/i.test(text);
  entry.origins = names(field(text, 'stylistic_origins'));
  entry.subgenres = names(field(text, 'subgenres') + field(text, 'subgenrelist'));
  entry.fusion = names(field(text, 'fusiongenres'));
  entry.derivatives = names(field(text, 'derivatives'));
  // Used as a weaker sign: the lead section links to the parent's article.
  entry.linksTo = names(text.slice(0, text.search(/\n==[^=]/) > 0 ? text.search(/\n==[^=]/) : 6000));
  console.log(`ok ${name} -> ${entry.title}${entry.infobox ? '' : ' (no genre infobox)'}`);
}
const nodes = [];
for (const [key, path] of paths) {
  const name = path[path.length - 1];
  const parent = path[path.length - 2] ?? null;
  const a = articles[name];
  const p = parent ? articles[parent] : null;
  const same = (list, target, article) => list.some((x) => norm(x) === norm(target) || (article?.title && norm(x) === norm(article.title)) || norm(x.replace(/ music$| \(.*\)$/g, '')) === norm(target));
  let edge = null;
  if (parent) {
    if (p && same([...p.subgenres, ...p.fusion, ...p.derivatives], name, a)) edge = 'parent-lists-child';
    else if (same(a.origins, parent, p)) edge = 'child-lists-parent-as-origin';
    else if (same(a.linksTo, parent, p)) edge = 'lead-links-to-parent';
    else edge = 'not-found';
  }
  nodes.push({ key, name, parent, inMusicBrainz: mbGenres.has(norm(name)), wikipedia: a.title, infobox: a.infobox, edge });
}
writeFileSync(here + 'tree.json', JSON.stringify({ nodes, articles }, null, 1));
console.log('DONE', nodes.length);
