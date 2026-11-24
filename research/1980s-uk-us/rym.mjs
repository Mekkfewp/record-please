// Reads the genre trees another worker copied from RYM's genre pages (names and hierarchy only)
// out of the Project store file. This script never contacts RYM.
import { readFileSync } from 'node:fs';

export const RYM_FILE = '/Users/k/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-7944bf32-7d57-43bc-9c44-8d28e739e9a4/files/internal/rym-genre-tree-1980s.md';

/** { parents: Map<name, Set<parent name>>, children: Map<name, Set<child>>, pages: Set<name whose own page or full tree was read> } */
export function readRym() {
  const text = readFileSync(RYM_FILE, 'utf8');
  const parents = new Map();
  const children = new Map();
  const complete = new Set(); // genres whose whole sub-tree was on a page that was read
  const link = (parent, child) => {
    if (!parents.has(child)) parents.set(child, new Set());
    if (!children.has(parent)) children.set(parent, new Set());
    if (!children.has(child)) children.set(child, new Set());
    if (!parents.has(parent)) parents.set(parent, new Set());
    parents.get(child).add(parent);
    children.get(parent).add(child);
  };
  const start = text.indexOf('## Genre trees');
  const end = text.indexOf('## 1980s releases noted per genre page');
  for (const block of text.slice(start, end).matchAll(/```text\n([\s\S]*?)```/g)) {
    const lines = block[1].split('\n').filter((l) => l.trim());
    const marked = lines.findIndex((l) => l.trim().startsWith('>'));
    const stack = []; // [indent, name]
    const tops = [];
    lines.forEach((line, i) => {
      const indent = line.match(/^ */)[0].length;
      const isPage = line.trim().startsWith('>');
      const name = line.trim().replace(/^>\s*/, '');
      if (marked >= 0 && i < marked) { tops.push(name); return; }
      if (isPage) {
        for (const top of tops) link(top, name);
        complete.add(name);
        stack.length = 0;
        stack.push([indent, name]);
        if (!parents.has(name)) parents.set(name, new Set());
        if (!children.has(name)) children.set(name, new Set());
        return;
      }
      while (stack.length && stack[stack.length - 1][0] >= indent) stack.pop();
      if (stack.length) link(stack[stack.length - 1][1], name);
      else { if (!parents.has(name)) parents.set(name, new Set()); if (!children.has(name)) children.set(name, new Set()); complete.add(name); }
      stack.push([indent, name]);
    });
  }
  // Everything below a genre whose page was read is also complete.
  const grow = (name) => { for (const c of children.get(name) ?? []) if (!complete.has(c)) { complete.add(c); grow(c); } };
  for (const name of [...complete]) grow(name);
  const top = [...text.slice(text.indexOf('## Top-level genres'), text.indexOf('Under a second heading')).matchAll(/^- (.+?) \(`/gm)].map((m) => m[1]);
  const uncategorized = [...text.slice(text.indexOf('Under a second heading'), text.indexOf('## Where the requested branches sit')).matchAll(/^- (.+?) \(`/gm)].map((m) => m[1]);
  return { parents, children, complete, top, uncategorized };
}

/**
 * Rows the worker copied from RYM genre pages. 'discography' rows carry a year (1980 to 1989);
 * 'top' rows have none and come from RYM's ranking, so they are leads to look up, nothing more.
 */
export function readRymReleases() {
  const text = readFileSync(RYM_FILE, 'utf8');
  const body = text.slice(text.indexOf('## 1980s releases noted per genre page'), text.indexOf('## Earlier attempt'));
  const out = [];
  let genre = null;
  let list = null;
  for (const line of body.split('\n')) {
    const h = line.match(/^### (.+)$/);
    if (h) { genre = h[1].replace(/ \(discography page \d+\)$/, ''); list = 'discography'; continue; }
    if (/^"Top-ranked albums"/.test(line)) { list = 'top'; continue; }
    const dated = line.match(/^- (.+?) — (.+) \((\d{4}), ([^)]+)\)$/);
    if (dated && list === 'discography') { out.push({ genre, list, artist: dated[1], title: dated[2], year: Number(dated[3]), type: dated[4] }); continue; }
    const plain = line.match(/^- (.+?) — (.+)$/);
    if (plain && list === 'top') out.push({ genre, list, artist: plain[1], title: plain[2], year: null, type: 'Album' });
  }
  return out;
}
