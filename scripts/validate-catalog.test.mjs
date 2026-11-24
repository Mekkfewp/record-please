// Proves the validator rejects each kind of bad data it exists to catch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = resolve(here, 'validate-catalog.mjs');
const source = resolve(here, '../src/data/catalog.json');

function validate(mutate) {
  const catalog = JSON.parse(readFileSync(source, 'utf8'));
  mutate?.(catalog);
  const file = join(mkdtempSync(join(tmpdir(), 'catalog-')), 'catalog.json');
  writeFileSync(file, JSON.stringify(catalog));
  const run = spawnSync(process.execPath, [script, file], { encoding: 'utf8' });
  return { code: run.status, output: run.stdout + run.stderr };
}

function expectFailure(mutate, rule) {
  const { code, output } = validate(mutate);
  assert.equal(code, 1, `validator should exit 1, output:\n${output}`);
  assert.match(output, new RegExp(`\\[${rule}\\]`), `expected a [${rule}] error, got:\n${output}`);
}

test('the shipped catalog is valid', () => {
  const { code, output } = validate();
  assert.equal(code, 0, output);
});

test('rejects a merged artist name', () => {
  expectFailure((c) => { c.artists[0].name = 'Michael Jackson / Nirvana'; }, 'merged-field');
});

test('rejects a merged album title', () => {
  expectFailure((c) => { c.albums[0].title = 'Dangerous / Nevermind'; }, 'merged-field');
});

test('rejects a merged track title', () => {
  expectFailure((c) => { c.tracks[0].title = 'Black or White / Smells Like Teen Spirit'; }, 'merged-field');
});

test('rejects a track with several artists', () => {
  expectFailure((c) => { c.tracks[0].artistId = [c.tracks[0].artistId, c.tracks[1].artistId]; }, 'merged-field');
});

test('rejects a duplicate recording, even with different punctuation and case', () => {
  expectFailure((c) => {
    const t = c.tracks[0];
    c.tracks.push({ ...t, id: 'dupe', title: `  ${t.title.toUpperCase()}!` });
  }, 'duplicate-recording');
});

test('rejects a duplicate artist', () => {
  expectFailure((c) => { c.artists.push({ ...c.artists[0], id: 'dupe-artist' }); }, 'duplicate-artist');
});

test('rejects an album that is not by the card artist', () => {
  expectFailure((c) => {
    const other = c.albums.find((a) => a.artistId !== c.tracks[0].artistId);
    c.tracks[0].albumId = other.id;
  }, 'album-artist');
});

test('rejects a missing decade x region cell', () => {
  expectFailure((c) => { c.cells.pop(); }, 'cell');
});

test('rejects a cell without its global card', () => {
  expectFailure((c) => { delete c.cells[0].global; }, 'cell');
});

test('rejects a cell without its local card', () => {
  expectFailure((c) => { c.cells[0].local = 'no-such-track'; }, 'cell');
});

test('rejects a cell whose two cards are the same', () => {
  expectFailure((c) => { c.cells[0].global = c.cells[0].local; }, 'cell');
});

test('rejects a local card by an artist from another region', () => {
  expectFailure((c) => { c.cells[0].local = c.cells[1].local; }, 'cell');
});

test('rejects a rating field', () => {
  expectFailure((c) => { c.tracks[0].rymRating = '4.18'; }, 'rating');
});

test('rejects text that claims a ranking', () => {
  expectFailure((c) => { c.lore[0].line = 'OFFICIAL RYM 榜首之作，值得一读。'; }, 'rating');
});

test('rejects a lore item without a source', () => {
  expectFailure((c) => { c.lore[0].source = ''; }, 'lore');
});
