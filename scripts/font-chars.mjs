import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';

export const SOURCE_FONT = 'fonts-src/fusion-pixel-12px-proportional-zh_hans.otf.woff2';
export const SHIPPED_FONT = 'public/fonts/fusion-pixel-12px-proportional-zh_hans.subset.woff2';

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

function collectStrings(value, into) {
  if (typeof value === 'string') for (const ch of value) into.add(ch);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, into);
  else if (value && typeof value === 'object') for (const item of Object.values(value)) collectStrings(item, into);
}

/**
 * Every character the game can put on screen: printable ASCII, every string in
 * the catalog, and every character in the UI source and index.html. Wider than
 * strictly needed, so a new label never falls outside the shipped font.
 */
export function shownCharacters(root) {
  const chars = new Set();
  for (let code = 0x20; code < 0x7f; code++) chars.add(String.fromCodePoint(code));
  collectStrings(JSON.parse(readFileSync(join(root, 'src/data/catalog.json'), 'utf8')), chars);
  for (const file of [...sourceFiles(join(root, 'src')), join(root, 'index.html')]) {
    for (const ch of readFileSync(file, 'utf8')) chars.add(ch);
  }
  for (const control of ['\n', '\r', '\t']) chars.delete(control);
  return [...chars].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
}

/** Reads the cmap table out of a WOFF2 file and returns the code points it maps to a glyph. */
export function woff2Codepoints(file) {
  if (file.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not a WOFF2 file');
  const numTables = file.readUInt16BE(12);
  const compressedSize = file.readUInt32BE(20);
  let at = 48;
  const base128 = () => {
    let value = 0;
    for (;;) {
      const byte = file[at++];
      value = value * 128 + (byte & 0x7f);
      if (!(byte & 0x80)) return value;
    }
  };
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const flags = file[at++];
    const tagIndex = flags & 0x3f;
    if (tagIndex === 63) at += 4;
    const transform = flags >> 6;
    const isGlyfOrLoca = tagIndex === 10 || tagIndex === 11;
    const transformed = isGlyfOrLoca ? transform === 0 : transform !== 0;
    const origLength = base128();
    const length = transformed ? base128() : origLength;
    tables.push({ isCmap: tagIndex === 0, length });
  }
  const data = brotliDecompressSync(file.subarray(at, at + compressedSize));
  let offset = 0;
  let cmap = null;
  for (const table of tables) {
    if (table.isCmap) cmap = data.subarray(offset, offset + table.length);
    offset += table.length;
  }
  if (!cmap) throw new Error('font has no cmap table');

  const codepoints = new Set();
  const subtables = new Set();
  for (let i = 0; i < cmap.readUInt16BE(2); i++) subtables.add(cmap.readUInt32BE(4 + i * 8 + 4));
  for (const start of subtables) {
    const format = cmap.readUInt16BE(start);
    if (format === 4) {
      const segCount = cmap.readUInt16BE(start + 6) / 2;
      const ends = start + 14;
      const starts = ends + segCount * 2 + 2;
      const deltas = starts + segCount * 2;
      const rangeOffsets = deltas + segCount * 2;
      for (let seg = 0; seg < segCount; seg++) {
        const first = cmap.readUInt16BE(starts + seg * 2);
        const last = cmap.readUInt16BE(ends + seg * 2);
        const delta = cmap.readUInt16BE(deltas + seg * 2);
        const rangeOffset = cmap.readUInt16BE(rangeOffsets + seg * 2);
        for (let code = first; code <= last && code !== 0xffff; code++) {
          let glyph;
          if (rangeOffset === 0) glyph = (code + delta) & 0xffff;
          else {
            glyph = cmap.readUInt16BE(rangeOffsets + seg * 2 + rangeOffset + (code - first) * 2);
            if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
          }
          if (glyph !== 0) codepoints.add(code);
        }
      }
    } else if (format === 12) {
      const groups = cmap.readUInt32BE(start + 12);
      for (let g = 0; g < groups; g++) {
        const first = cmap.readUInt32BE(start + 16 + g * 12);
        const last = cmap.readUInt32BE(start + 20 + g * 12);
        const firstGlyph = cmap.readUInt32BE(start + 24 + g * 12);
        for (let code = first; code <= last; code++) if (firstGlyph + (code - first) !== 0) codepoints.add(code);
      }
    }
  }
  return codepoints;
}

/** Characters the game can show that the given font file has no glyph for. */
export function missingFrom(fontFile, chars) {
  const have = woff2Codepoints(readFileSync(fontFile));
  return chars.filter((ch) => !have.has(ch.codePointAt(0)));
}
