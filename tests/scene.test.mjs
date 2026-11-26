import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSlice } from '../src/slice/index.ts';
import { CRATE_SIZE, initialState, reduce } from '../src/slice/dig.ts';
import { BINDINGS, describe, deviceFor } from '../src/slice/scene.ts';

const record = (id, genre, tier, year, door = false) => ({
  id, artist: `A ${id}`, country: 'US', title: `R ${id}`, kind: 'album', year, track: `T ${id}`, genre, tier, ...(door ? { door } : {}),
  placed: { by: 'wikipedia', term: genre, url: 'https://example.org' }, links: { netease: '', qq: '' },
});
const slice = buildSlice({
  label: 'test', yearStart: 1980, yearEnd: 1989, countries: { US: '美国' },
  genres: [
    { id: 'pop', name: 'Pop', parent: null }, { id: 'pop.synthpop', name: 'Synthpop', parent: 'pop' },
    { id: 'rock', name: 'Rock', parent: null }, { id: 'rock.new-wave', name: 'New Wave', parent: 'rock' },
    { id: 'jazz', name: 'Jazz', parent: null }, { id: 'jazz.fusion', name: 'Jazz Fusion', parent: 'jazz' },
  ],
  records: [
    record('d1', 'pop.synthpop', 1, 1981, true), record('d2', 'rock.new-wave', 1, 1985, true), record('d3', 'jazz.fusion', 1, 1989, true),
    ...[1, 2, 3].flatMap((tier) => Array.from({ length: 6 }, (_, i) => record(`s${tier}${i}`, 'pop.synthpop', tier, 1980 + i))),
  ],
  ties: [],
});
const open = () => reduce(initialState, { type: 'open', seed: 1 }, slice);
const started = () => reduce(open(), { type: 'pick', recordId: 'd1' }, slice);

test('the playback device follows the release year, later in Britain', () => {
  assert.deepEqual([1980, 1982, 1983, 1987, 1988, 1989].map((year) => deviceFor(year)), ['turntable', 'turntable', 'walkman', 'walkman', 'cd-player', 'cd-player']);
  assert.deepEqual([1980, 1984, 1985, 1988, 1989].map((year) => deviceFor(year, 'GB')), ['turntable', 'turntable', 'walkman', 'walkman', 'cd-player']);
  assert.equal(describe(started(), slice, 'playing', false).device, 'turntable');
});

test('keep is on the crate and pass on the shelf, and the table can be read by a view', () => {
  assert.equal(BINDINGS.keep, 'crate');
  assert.equal(BINDINGS.pass, 'shelf');
  assert.equal(BINDINGS.play, 'player');
});

test('every object that offers an action is the object that action is bound to', () => {
  let state = open();
  const states = [state];
  state = started();
  states.push(state);
  for (let i = 0; i < 9 && state.phase === 'desk'; i++) {
    state = reduce(state, { type: 'keep' }, slice);
    states.push(state);
    if (state.step === 'swap') { state = reduce(state, { type: 'swap', slot: 0 }, slice); states.push(state); }
    state = reduce(state, { type: 'next' }, slice);
    states.push(state);
  }
  assert.equal(state.phase, 'result');
  for (const s of states) {
    for (const preview of ['idle', 'loading', 'playing', 'unavailable']) {
      const scene = describe(s, slice, preview, false);
      for (const object of Object.values(scene.objects)) {
        assert.ok(object.label.length > 0, object.id);
        if (object.action) assert.equal(BINDINGS[object.action], object.id);
        else assert.ok(['disabled', 'unavailable'].includes(object.state), `${object.id} ${object.state}`);
      }
    }
  }
});

test('before a game only the counter, the supply box and the sound can be used', () => {
  const scene = describe(open(), slice, 'idle', false);
  const usable = Object.values(scene.objects).filter((o) => o.action).map((o) => o.id).sort();
  assert.deepEqual(usable, ['counter', 'sound', 'supply']);
  assert.equal(scene.record, null);
  assert.deepEqual(scene.shelfMark, []);
});

test('while a record plays, the crate keeps it and the shelf takes it back; the stack waits', () => {
  const scene = describe(started(), slice, 'playing', false);
  assert.equal(scene.objects.player.state, 'playing');
  assert.equal(scene.objects.crate.action, 'keep');
  assert.equal(scene.objects.shelf.action, 'pass');
  assert.equal(scene.objects.stack.state, 'disabled');
  assert.deepEqual(scene.shelfMark.map((g) => g.name), ['Pop', 'Synthpop']);
  assert.deepEqual(scene.record, { id: 'd1', face: 'face-up' });
});

test('the device reports loading, stopped and unavailable as the player does', () => {
  assert.equal(describe(started(), slice, 'loading', false).objects.player.state, 'loading');
  assert.equal(describe(started(), slice, 'idle', false).objects.player.state, 'stopped');
  const dead = describe(started(), slice, 'unavailable', false).objects.player;
  assert.equal(dead.state, 'unavailable');
  assert.equal(dead.action, null);
});

test('after a decision only the stack and the device respond', () => {
  const kept = describe(reduce(started(), { type: 'keep' }, slice), slice, 'idle', false);
  assert.equal(kept.record.face, 'kept');
  assert.equal(kept.objects.crate.action, null);
  assert.equal(kept.objects.shelf.action, null);
  assert.equal(kept.objects.stack.action, 'next');
  const passed = describe(reduce(started(), { type: 'pass' }, slice), slice, 'idle', false);
  assert.equal(passed.record.face, 'passed');
});

test('the second record is face up and the third arrives face down', () => {
  let state = reduce(reduce(started(), { type: 'keep' }, slice), { type: 'next' }, slice);
  assert.equal(describe(state, slice, 'playing', false).record.face, 'face-up');
  state = reduce(reduce(state, { type: 'keep' }, slice), { type: 'next' }, slice);
  assert.equal(describe(state, slice, 'playing', false).record.face, 'face-down');
});

test('a full crate turns its slots into choices, and the shelf still takes the record back', () => {
  let state = started();
  for (let i = 0; i < CRATE_SIZE; i++) state = reduce(reduce(state, { type: 'keep' }, slice), { type: 'next' }, slice);
  const before = describe(state, slice, 'playing', false);
  assert.ok(before.crate.every((slot) => slot.state === 'held'));
  state = reduce(state, { type: 'keep' }, slice);
  const scene = describe(state, slice, 'playing', false);
  assert.ok(scene.crate.every((slot) => slot.state === 'swappable'));
  assert.equal(scene.objects.crate.action, 'swap');
  assert.equal(scene.objects.shelf.action, 'pass');
  assert.equal(scene.objects.stack.action, null);
});

test('floor-3 records are marked in the crate', () => {
  let state = started();
  for (let i = 0; i < 4; i++) state = reduce(reduce(state, { type: 'keep' }, slice), { type: 'next' }, slice);
  const scene = describe(state, slice, 'idle', false);
  assert.deepEqual(scene.crate.map((slot) => slot.deep), [false, false, false, true, false]);
  assert.equal(scene.floor, 3);
});
