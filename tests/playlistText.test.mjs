import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCatalog } from '../src/engine/catalogIndex.ts';
import { loreCredit, playlistMarkdown } from '../src/engine/playlistText.ts';

const catalog = buildCatalog(JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8')));

test('the copied playlist lists every kept card with its artist, year, album and Apple link', () => {
  const cards = [catalog.card('so-what'), catalog.card('night-cruising')];
  const text = playlistMarkdown({
    profileLine: '1980 年代 · 日本',
    personaName: '午夜蓝音萨克斯手',
    because: '你收下的 2 张里有 1 张来自「爵士」。',
    cards,
    lore: [catalog.loreItem('miles-autobiography')],
  });
  assert.ok(text.includes('1. 〈So What〉 Miles Davis（1959），专辑《Kind of Blue》 [Apple Music](https://music.apple.com/'));
  assert.ok(text.includes('2. 〈ナイトクルージング〉 Fishmans（1995），专辑《空中キャンプ》'));
  assert.ok(text.includes('午夜蓝音萨克斯手：你收下的 2 张里有 1 张来自「爵士」。'));
  assert.ok(text.includes('## 延伸阅读'));
  assert.ok(text.includes('- 《Miles: The Autobiography》Miles Davis、Quincy Troupe，1989，书'));
});

test('the copied playlist has no reading section when nothing was shown', () => {
  const text = playlistMarkdown({ profileLine: 'x', personaName: 'y', because: 'z', cards: [catalog.card('so-what')], lore: [] });
  assert.ok(!text.includes('延伸阅读'));
});

test('a film is credited as a film, a series as a series', () => {
  assert.ok(loreCredit(catalog.loreItem('stop-making-sense')).endsWith('1984，影片'));
  assert.ok(loreCredit(catalog.loreItem('ken-burns-jazz')).endsWith('2001，系列片'));
});
