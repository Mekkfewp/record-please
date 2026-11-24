import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { PreviewPlayer } from '../src/engine/previewPlayer.ts';

const apple = {
  trackId: 111,
  collectionId: 222,
  storefront: 'us',
  previewUrl: 'https://audio-ssl.itunes.apple.com/old.m4a',
  artworkUrl: 'https://is1-ssl.mzstatic.com/a/100x100bb.jpg',
  url: 'https://music.apple.com/us/album/x/222?i=111',
};

let playable;
let played;
let lookups;
let lookupResult;

class FakeAudio {
  src = '';
  muted = false;
  paused = true;
  listeners = {};
  addEventListener(name, fn) {
    this.listeners[name] = fn;
  }
  removeAttribute() {
    this.src = '';
  }
  load() {}
  pause() {
    this.paused = true;
  }
  async play() {
    played.push(this.src);
    const verdict = playable(this.src);
    if (verdict === 'ok') {
      this.paused = false;
      return;
    }
    throw new DOMException('no', verdict);
  }
}

beforeEach(() => {
  played = [];
  lookups = [];
  playable = () => 'ok';
  lookupResult = { results: [{ trackId: 111, previewUrl: 'https://audio-ssl.itunes.apple.com/new.m4a' }] };
  globalThis.Audio = FakeAudio;
  globalThis.fetch = async (url) => {
    lookups.push(String(url));
    if (lookupResult === null) throw new TypeError('network down');
    return { ok: true, json: async () => lookupResult };
  };
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('plays the stored preview address without asking Apple again', async () => {
  const player = new PreviewPlayer();
  player.toggle('t1', apple);
  await settle();
  assert.deepEqual(player.getState(), { trackId: 't1', status: 'playing' });
  assert.deepEqual(played, [apple.previewUrl]);
  assert.equal(lookups.length, 0);
});

test('an expired address is replaced by a fresh one from the lookup, then played', async () => {
  playable = (src) => (src.endsWith('old.m4a') ? 'NotSupportedError' : 'ok');
  const player = new PreviewPlayer();
  player.toggle('t1', apple);
  await settle();
  assert.deepEqual(player.getState(), { trackId: 't1', status: 'playing' });
  assert.deepEqual(lookups, ['https://itunes.apple.com/lookup?id=111&country=us']);
  assert.deepEqual(played, [apple.previewUrl, 'https://audio-ssl.itunes.apple.com/new.m4a']);

  player.stop();
  player.toggle('t1', apple);
  await settle();
  assert.equal(lookups.length, 1, 'the fresh address is reused for the rest of the visit');
  assert.equal(played.at(-1), 'https://audio-ssl.itunes.apple.com/new.m4a');
});

test('when the lookup has nothing newer the card says the preview is unavailable', async () => {
  playable = () => 'NotSupportedError';
  lookupResult = { results: [{ trackId: 111, previewUrl: apple.previewUrl }] };
  const player = new PreviewPlayer();
  player.toggle('t1', apple);
  await settle();
  assert.deepEqual(player.getState(), { trackId: 't1', status: 'unavailable' });
  assert.equal(player.isUnavailable('t1'), true);
});

test('a failed lookup does not throw and ends as unavailable', async () => {
  playable = () => 'NotSupportedError';
  lookupResult = null;
  const player = new PreviewPlayer();
  player.toggle('t1', apple);
  await settle();
  assert.deepEqual(player.getState(), { trackId: 't1', status: 'unavailable' });
});

test('a card with no Apple match never tries to play', async () => {
  const player = new PreviewPlayer();
  player.toggle('t1', undefined);
  await settle();
  assert.deepEqual(player.getState(), { trackId: 't1', status: 'unavailable' });
  assert.equal(played.length, 0);
});

test('pressing again stops, and starting another card replaces the first', async () => {
  const player = new PreviewPlayer();
  player.toggle('t1', apple);
  await settle();
  player.toggle('t1', apple);
  assert.deepEqual(player.getState(), { trackId: null, status: 'idle' });

  player.toggle('t1', apple);
  player.toggle('t2', { ...apple, trackId: 333, previewUrl: 'https://audio-ssl.itunes.apple.com/two.m4a' });
  await settle();
  assert.deepEqual(player.getState(), { trackId: 't2', status: 'playing' });
});

test('a browser that blocks playback leaves the button ready for another press', async () => {
  playable = () => 'NotAllowedError';
  const player = new PreviewPlayer();
  player.toggle('t1', apple);
  await settle();
  assert.deepEqual(player.getState(), { trackId: null, status: 'idle' });
  assert.equal(lookups.length, 0);
});
