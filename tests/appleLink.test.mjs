import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appleMusicLink, inMainlandChina } from '../src/engine/appleLink.ts';

const apple = {
  trackId: 111,
  collectionId: 222,
  storefront: 'us',
  previewUrl: 'https://audio-ssl.itunes.apple.com/p.m4a',
  artworkUrl: 'https://is1-ssl.mzstatic.com/a/100x100bb.jpg',
  url: 'https://music.apple.com/us/album/x/222?i=111',
  cn: true,
};

test('outside mainland China the link is the matched store page', () => {
  for (const zone of ['America/New_York', 'Asia/Tokyo', 'Asia/Hong_Kong', 'Asia/Taipei', 'Asia/Macau', '']) {
    assert.deepEqual(appleMusicLink(apple, zone), { url: apple.url, reachable: true });
    assert.deepEqual(appleMusicLink({ ...apple, cn: false }, zone), { url: apple.url, reachable: true });
  }
});

test('in mainland China a song the China store carries links to that store, same album and track', () => {
  assert.deepEqual(appleMusicLink(apple, 'Asia/Shanghai'), {
    url: 'https://music.apple.com/cn/album/222?i=111',
    reachable: true,
  });
  assert.equal(appleMusicLink(apple, 'Asia/Urumqi').url, 'https://music.apple.com/cn/album/222?i=111');
});

test('in mainland China a song the China store lacks is marked unreachable, not sent to a guess', () => {
  assert.deepEqual(appleMusicLink({ ...apple, cn: false }, 'Asia/Shanghai'), { url: apple.url, reachable: false });
  const unchecked = { ...apple };
  delete unchecked.cn;
  assert.equal(appleMusicLink(unchecked, 'Asia/Shanghai').reachable, false);
});

test('only mainland zones count as mainland China', () => {
  assert.equal(inMainlandChina('Asia/Shanghai'), true);
  assert.equal(inMainlandChina('Asia/Hong_Kong'), false);
  assert.equal(inMainlandChina('Asia/Taipei'), false);
});
