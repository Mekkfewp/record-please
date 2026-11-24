import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSlice } from '../src/slice/index.ts';
import { CRATE_SIZE, ROUNDS, initialState, reduce } from '../src/slice/dig.ts';

const raw = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/data/slice.json'), 'utf8'));
const slice = buildSlice(raw);

function play(doorId) {
  let state = reduce(initialState, { type: 'open', seed: 4 }, slice);
  state = reduce(state, { type: 'pick', recordId: doorId }, slice);
  while (state.phase === 'desk') {
    state = reduce(state, { type: 'keep' }, slice);
    if (state.step === 'swap') state = reduce(state, { type: 'swap', slot: 0 }, slice);
    state = reduce(state, { type: 'next' }, slice);
  }
  return state;
}

test('the punk family is one family, with three doors and a record at every floor', () => {
  assert.equal(new Set(slice.records.map((r) => slice.family(r.genre).id)).size, 1);
  assert.equal(slice.doors.length, 3);
  assert.equal(new Set(slice.records.map((r) => r.id)).size, slice.records.length);
  for (const floor of [0, 1, 2, 3]) assert.ok(slice.records.some((r) => slice.floorOf(r) === floor), `floor ${floor}`);
  for (const record of slice.records) {
    assert.ok(record.year >= 1980 && record.year <= 1989, record.id);
    assert.ok(record.country === 'GB' || record.country === 'US', record.id);
    assert.ok(record.placed.url.startsWith('https://'), record.id);
    assert.equal(typeof record.apple.trackId, 'number', record.id);
  }
});

test('keeping everything in this family deals nine records, down one floor at a time, into a crate of five', () => {
  for (const door of slice.doors) {
    const state = play(door.id);
    assert.equal(state.phase, 'result');
    assert.equal(state.steps.length, ROUNDS);
    assert.deepEqual(state.steps.map((s) => s.floor), [0, 1, 2, 3, 3, 3, 3, 3, 3], door.artist);
    assert.equal(state.crate.length, CRATE_SIZE);
    assert.equal(new Set(state.steps.map((s) => s.recordId)).size, ROUNDS);
  }
});
