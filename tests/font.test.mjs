import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SHIPPED_FONT, SOURCE_FONT, missingFrom, shownCharacters, woff2Codepoints } from '../scripts/font-chars.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chars = shownCharacters(root);

test('the shipped font has a glyph for every character the game can show', () => {
  const missing = missingFrom(join(root, SHIPPED_FONT), chars);
  assert.deepEqual(missing, [], `run "npm run font:subset"; missing: ${missing.join(' ')}`);
});

test('the shipped font is the subset, not the full font', () => {
  const shipped = woff2Codepoints(readFileSync(join(root, SHIPPED_FONT)));
  const source = woff2Codepoints(readFileSync(join(root, SOURCE_FONT)));
  assert.ok(source.size > 30000, `the source font should be the full one, found ${source.size} code points`);
  assert.ok(shipped.size <= chars.length, `shipped ${shipped.size} code points for ${chars.length} characters`);
});

test('the page and the stylesheet load the shipped font file', () => {
  const name = SHIPPED_FONT.split('/').pop();
  assert.ok(readFileSync(join(root, 'src/styles.css'), 'utf8').includes(`/fonts/${name}`));
  assert.ok(readFileSync(join(root, 'index.html'), 'utf8').includes(`fonts/${name}`));
});

test('the character set covers catalog text, UI labels and digits', () => {
  for (const ch of '0123456789〈〉《》（），。·收下跳过试听') assert.ok(chars.includes(ch), ch);
});
