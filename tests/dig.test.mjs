import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSlice } from '../src/slice/index.ts';
import { CRATE_SIZE, ROUNDS, current, initialState, pickDoors, reduce } from '../src/slice/dig.ts';

// A small made-up slice: three families, one of them three genres deep. The real one is checked
// by tests/slice.test.mjs; the rules are tested here on data whose answers are known.
function fixture() {
  const genres = [
    { id: 'rock', name: 'Rock', parent: null },
    { id: 'rock.post-punk', name: 'Post-Punk', parent: 'rock' },
    { id: 'rock.post-punk.gothic', name: 'Gothic Rock', parent: 'rock.post-punk' },
    { id: 'rock.post-punk.gothic.deathrock', name: 'Deathrock', parent: 'rock.post-punk.gothic' },
    { id: 'rock.new-wave', name: 'New Wave', parent: 'rock' },
    { id: 'rock.hard', name: 'Hard Rock', parent: 'rock' },
    { id: 'rock.hard.glam', name: 'Glam Metal', parent: 'rock.hard' },
    { id: 'pop', name: 'Pop', parent: null },
    { id: 'pop.synthpop', name: 'Synthpop', parent: 'pop' },
    { id: 'hip-hop', name: 'Hip Hop', parent: null },
    { id: 'hip-hop.boom-bap', name: 'Boom Bap', parent: 'hip-hop' },
  ];
  const records = [];
  const add = (genre, tier, n, door = false) => {
    for (let i = 0; i < n; i++) {
      const id = `${genre}-t${tier}${door ? 'd' : ''}-${i}`;
      records.push({
        id, artist: `Artist ${id}`, country: 'GB', title: `Record ${id}`, kind: 'album', year: 1984, track: `Track ${id}`,
        genre, tier, ...(door ? { door: true } : {}),
        placed: { by: 'wikipedia', term: genre, url: 'https://example.org' }, links: { netease: '', qq: '' },
      });
    }
  };
  add('rock.post-punk', 1, 1, true);
  add('pop.synthpop', 1, 2, true);
  add('hip-hop.boom-bap', 1, 1, true);
  for (const genre of genres.filter((g) => g.parent)) for (const tier of [1, 2, 3]) add(genre.id, tier, 4);
  const ties = [{ a: 'rock.post-punk-t1d-0', b: 'rock.new-wave-t1-2', kind: 'producer', name: 'Someone', source: 'https://example.org/tie' }];
  return buildSlice({ label: 'test', yearStart: 1980, yearEnd: 1989, countries: { GB: '英国' }, genres, records, ties });
}

const slice = fixture();
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const strategies = {
  'keep everything': () => 'keep',
  'pass everything': () => 'pass',
  'alternate, keeping first': (round) => (round % 2 === 1 ? 'keep' : 'pass'),
  'alternate, passing first': (round) => (round % 2 === 1 ? 'pass' : 'keep'),
  'pass twice then keep': (round) => (round % 3 === 0 ? 'keep' : 'pass'),
};

/** Plays a game to the end from door number `door`; a full crate gives up its first record. */
function play(seed, decide, door = 0) {
  let state = reduce(initialState, { type: 'open', seed }, slice);
  state = reduce(state, { type: 'pick', recordId: state.doors[door] }, slice);
  let guard = 0;
  while (state.phase === 'desk') {
    assert.ok(guard++ < 40, 'the game did not end');
    state = reduce(state, { type: decide(state.steps.length) }, slice);
    if (state.step === 'swap') state = reduce(state, { type: 'swap', slot: 0 }, slice);
    state = reduce(state, { type: 'next' }, slice);
  }
  return state;
}

function everyGame(check) {
  for (const seed of SEEDS) {
    for (const [name, decide] of Object.entries(strategies)) {
      for (const door of [0, 1, 2]) check(play(seed, decide, door), `seed ${seed}, door ${door}, ${name}`);
    }
  }
}

test('the counter shows three door records from three different families', () => {
  for (const seed of SEEDS) {
    const doors = pickDoors(slice, seed, 0);
    assert.equal(doors.length, 3);
    assert.equal(new Set(doors.map((id) => slice.family(slice.record(id).genre).id)).size, 3);
    for (const id of doors) assert.equal(slice.record(id).door, true);
  }
});

test('families the passport has not visited come first on the counter', () => {
  const state = reduce(initialState, { type: 'open', seed: 3, preferFamilies: ['hip-hop'] }, slice);
  assert.equal(slice.family(slice.record(state.doors[0]).genre).id, 'hip-hop');
});

test('reshuffling changes nothing but the doors, and only before the game starts', () => {
  let state = reduce(initialState, { type: 'open', seed: 5 }, slice);
  const again = reduce(state, { type: 'reshuffle' }, slice);
  assert.equal(again.phase, 'start');
  assert.equal(again.doors.length, 3);
  state = reduce(again, { type: 'pick', recordId: again.doors[0] }, slice);
  assert.deepEqual(reduce(state, { type: 'reshuffle' }, slice), state);
});

test('only a record on the counter can be picked', () => {
  const state = reduce(initialState, { type: 'open', seed: 1 }, slice);
  assert.deepEqual(reduce(state, { type: 'pick', recordId: 'rock.hard-t3-0' }, slice), state);
});

test('card 1 is the picked door, face up, on the ground floor', () => {
  let state = reduce(initialState, { type: 'open', seed: 1 }, slice);
  const picked = state.doors[1];
  state = reduce(state, { type: 'pick', recordId: picked }, slice);
  assert.deepEqual(current(state), { recordId: picked, floor: 0, move: 'door', tie: null, faceUp: true, decision: null });
});

test('every game ends after exactly nine records, whatever the player does', () => {
  everyGame((state, where) => {
    assert.equal(state.phase, 'result', where);
    assert.equal(state.steps.length, ROUNDS, where);
    assert.ok(state.steps.every((s) => s.decision), where);
  });
});

test('no record is dealt twice in a game', () => {
  everyGame((state, where) => assert.equal(new Set(state.steps.map((s) => s.recordId)).size, ROUNDS, where));
});

test('every record after the first arrives face down and turns over when decided', () => {
  let state = reduce(initialState, { type: 'open', seed: 2 }, slice);
  state = reduce(state, { type: 'pick', recordId: state.doors[0] }, slice);
  state = reduce(reduce(state, { type: 'keep' }, slice), { type: 'next' }, slice);
  assert.equal(current(state).faceUp, false);
  assert.equal(reduce(state, { type: 'pass' }, slice).steps[1].faceUp, true);
  assert.equal(reduce(state, { type: 'keep' }, slice).steps[1].faceUp, true);
});

test('keeping goes down one floor at a time and stops at floor 3', () => {
  for (const seed of SEEDS) {
    const state = play(seed, strategies['keep everything']);
    assert.deepEqual(state.steps.map((s) => s.floor), [0, 1, 2, 3, 3, 3, 3, 3, 3], `seed ${seed}`);
  }
});

test('a kept record is followed by one in its own genre or below it while there are any', () => {
  for (const seed of SEEDS) {
    const state = play(seed, strategies['keep everything']);
    for (let i = 1; i < 4; i++) {
      const before = slice.record(state.steps[i - 1].recordId);
      const after = slice.record(state.steps[i].recordId);
      // The made-up tie may pull one record to a sibling genre; anything else stays in the branch.
      if (state.steps[i].tie) continue;
      assert.ok(['same', 'below'].includes(slice.relation(before.genre, after.genre)), `seed ${seed}, card ${i + 1}: ${before.genre} -> ${after.genre}`);
    }
  }
});

test('passing stays on the floor; the second pass in a row moves to a neighbouring genre', () => {
  for (const seed of SEEDS) {
    let state = reduce(initialState, { type: 'open', seed }, slice);
    const door = state.doors.find((id) => slice.record(id).genre === 'rock.post-punk') ?? state.doors[0];
    state = reduce(state, { type: 'pick', recordId: door }, slice);
    state = reduce(reduce(state, { type: 'keep' }, slice), { type: 'next' }, slice);
    const first = current(state);
    state = reduce(reduce(state, { type: 'pass' }, slice), { type: 'next' }, slice);
    const second = current(state);
    assert.equal(second.move, 'stay', `seed ${seed}`);
    assert.equal(second.floor, first.floor, `seed ${seed}`);
    state = reduce(reduce(state, { type: 'pass' }, slice), { type: 'next' }, slice);
    const third = current(state);
    assert.equal(third.move, 'sidestep', `seed ${seed}`);
    assert.equal(third.floor, first.floor, `seed ${seed}`);
    const stood = slice.record(door).genre;
    assert.ok(!['same', 'below'].includes(slice.relation(stood, slice.record(third.recordId).genre)), `seed ${seed}`);
    assert.equal(state.genreId, slice.record(third.recordId).genre, `seed ${seed}`);
    assert.equal(state.passesInRow, 0, `seed ${seed}`);
  }
});

test('a record tied to a kept one is dealt ahead of the others, and says so', () => {
  let state = reduce(initialState, { type: 'open', seed: 4, preferFamilies: ['rock'] }, slice);
  state = reduce(state, { type: 'pick', recordId: 'rock.post-punk-t1d-0' }, slice);
  state = reduce(reduce(state, { type: 'keep' }, slice), { type: 'next' }, slice);
  const step = current(state);
  assert.equal(step.recordId, 'rock.new-wave-t1-2');
  assert.equal(step.tie.withId, 'rock.post-punk-t1d-0');
  assert.equal(step.tie.tie.name, 'Someone');
});

test('a tie to a record that was passed on does not count', () => {
  let state = reduce(initialState, { type: 'open', seed: 4, preferFamilies: ['rock'] }, slice);
  state = reduce(state, { type: 'pick', recordId: 'rock.post-punk-t1d-0' }, slice);
  state = reduce(reduce(state, { type: 'pass' }, slice), { type: 'next' }, slice);
  assert.equal(current(state).tie, null);
});

test('the crate holds five; a sixth keep waits until one is given up', () => {
  let state = reduce(initialState, { type: 'open', seed: 6 }, slice);
  state = reduce(state, { type: 'pick', recordId: state.doors[0] }, slice);
  for (let i = 0; i < CRATE_SIZE; i++) state = reduce(reduce(state, { type: 'keep' }, slice), { type: 'next' }, slice);
  assert.equal(state.crate.length, CRATE_SIZE);
  const sixth = current(state).recordId;
  const full = state.crate.slice();
  state = reduce(state, { type: 'keep' }, slice);
  assert.equal(state.step, 'swap');
  assert.equal(current(state).decision, null);
  assert.equal(current(state).faceUp, true);
  assert.deepEqual(state.crate, full);
  assert.deepEqual(reduce(state, { type: 'next' }, slice), state, 'cannot move on while a record waits');
  assert.deepEqual(reduce(state, { type: 'swap', slot: 9 }, slice), state, 'a slot that does not exist');
  const swapped = reduce(state, { type: 'swap', slot: 2 }, slice);
  assert.equal(swapped.crate.length, CRATE_SIZE);
  assert.equal(swapped.crate[2], sixth);
  assert.equal(current(swapped).decision, 'keep');
  const changedMind = reduce(state, { type: 'pass' }, slice);
  assert.deepEqual(changedMind.crate, full);
  assert.equal(current(changedMind).decision, 'pass');
});

test('the crate never holds more than five, and only records the player kept', () => {
  everyGame((state, where) => {
    assert.ok(state.crate.length <= CRATE_SIZE, where);
    const kept = state.steps.filter((s) => s.decision === 'keep').map((s) => s.recordId);
    for (const id of state.crate) assert.ok(kept.includes(id), where);
    assert.equal(new Set(state.crate).size, state.crate.length, where);
  });
});

test('actions that do not fit the moment change nothing', () => {
  let state = reduce(initialState, { type: 'open', seed: 1 }, slice);
  for (const type of ['keep', 'pass', 'next']) assert.deepEqual(reduce(state, { type }, slice), state);
  assert.deepEqual(reduce(state, { type: 'swap', slot: 0 }, slice), state);
  state = reduce(state, { type: 'pick', recordId: state.doors[0] }, slice);
  assert.deepEqual(reduce(state, { type: 'next' }, slice), state, 'next before deciding');
  state = reduce(state, { type: 'keep' }, slice);
  for (const type of ['keep', 'pass']) assert.deepEqual(reduce(state, { type }, slice), state, `${type} twice`);
});

test('the same seed and decisions deal the same game', () => {
  for (const [name, decide] of Object.entries(strategies)) {
    assert.deepEqual(play(7, decide).steps, play(7, decide).steps, name);
  }
});

test('restarting clears the desk and shows new doors', () => {
  const done = play(3, strategies['keep everything']);
  const again = reduce(done, { type: 'restart' }, slice);
  assert.equal(again.phase, 'start');
  assert.equal(again.steps.length, 0);
  assert.equal(again.crate.length, 0);
  assert.equal(again.doors.length, 3);
});
