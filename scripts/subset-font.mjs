// Cuts the pixel font down to the characters the game can show.
// Needs fonttools with brotli: `pip install fonttools brotli` (provides pyftsubset).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHIPPED_FONT, SOURCE_FONT, missingFrom, shownCharacters } from './font-chars.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chars = shownCharacters(root);

const absent = missingFrom(join(root, SOURCE_FONT), chars);
if (absent.length) {
  console.error(`The source font has no glyph for: ${absent.map((ch) => `${ch} (U+${ch.codePointAt(0).toString(16).toUpperCase()})`).join(', ')}`);
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'subset-font-'));
const textFile = join(work, 'chars.txt');
writeFileSync(textFile, chars.join(''));
const run = spawnSync(
  'pyftsubset',
  [join(root, SOURCE_FONT), `--text-file=${textFile}`, `--output-file=${join(root, SHIPPED_FONT)}`, '--flavor=woff2', '--layout-features=*', '--name-IDs=*', '--notdef-outline'],
  { stdio: 'inherit' },
);
rmSync(work, { recursive: true, force: true });
if (run.error || run.status !== 0) {
  console.error(run.error ? `Could not run pyftsubset: ${run.error.message}` : `pyftsubset exited with ${run.status}`);
  process.exit(1);
}

const stillMissing = missingFrom(join(root, SHIPPED_FONT), chars);
if (stillMissing.length) {
  console.error(`The subset lost: ${stillMissing.join(' ')}`);
  process.exit(1);
}
const kb = (file) => `${(statSync(join(root, file)).size / 1024).toFixed(1)} KB`;
console.log(`${chars.length} characters: ${SOURCE_FONT} ${kb(SOURCE_FONT)} -> ${SHIPPED_FONT} ${kb(SHIPPED_FONT)}`);
