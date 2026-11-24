import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCatalog } from '../src/engine/catalogIndex.ts';
import { ROUNDS, fromRegion, inWindow, initialState, pickInLineage, reduce } from '../src/engine/game.ts';
import { resolvePersona } from '../src/engine/persona.ts';

const catalog = buildCatalog(JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8')));
const profiles = catalog.eras.flatMap((era) => catalog.regions.map((region) => ({ era: era.id, region: region.id })));
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const label = (p) => `${p.era} x ${p.region}`;

/** Plays a game to the end. `decide(state, round)` answers 'collect' or 'skip' for each card. */
function play(profile, seed, decide) {
  let state = reduce(initialState, { type: 'start', profile, seed }, catalog);
  const dealt = [];
  while (state.phase === 'booth') {
    assert.ok(dealt.length < 30, 'the game did not end');
    const card = catalog.card(state.cardId);
    const decision = decide(state, state.round);
    dealt.push({ round: state.round, card, kind: state.reasonKind, reason: state.reason, decision });
    state = reduce(state, { type: decision }, catalog);
    if (decision === 'collect') state = reduce(state, { type: 'next' }, catalog);
  }
  return { state, dealt };
}

const strategies = {
  'collect everything': () => 'collect',
  'skip everything': () => 'skip',
  'alternate, collecting first': (_s, round) => (round % 2 === 1 ? 'collect' : 'skip'),
  'alternate, skipping first': (_s, round) => (round % 2 === 1 ? 'skip' : 'collect'),
  'skip twice then collect': (_s, round) => (round % 3 === 0 ? 'collect' : 'skip'),
  'by coin': (s, round) => ((s.seed * 31 + round * 17) % 5 < 2 ? 'skip' : 'collect'),
};

function everyGame(check) {
  for (const profile of profiles) {
    for (const seed of SEEDS) {
      for (const [name, decide] of Object.entries(strategies)) {
        check(play(profile, seed, decide), `${label(profile)}, seed ${seed}, ${name}`, profile);
      }
    }
  }
}

test('cards 1 and 2 are the profile\'s local and global entry cards', () => {
  for (const profile of profiles) {
    const cell = catalog.cell(profile.era, profile.region);
    for (const decide of Object.values(strategies)) {
      const { dealt } = play(profile, 1, decide);
      assert.equal(dealt[0].card.track.id, cell.local, label(profile));
      assert.equal(dealt[1].card.track.id, cell.global, label(profile));
    }
  }
});

test('every game ends after exactly nine cards, whatever the player does', () => {
  everyGame(({ state, dealt }, where) => {
    assert.equal(dealt.length, ROUNDS, where);
    assert.equal(state.phase, 'result', where);
    assert.equal(state.kept.length, dealt.filter((d) => d.decision === 'collect').length, where);
  });
});

test('nothing repeats within a game: no card, no artist, no book or film', () => {
  everyGame(({ state, dealt }, where) => {
    assert.equal(new Set(dealt.map((d) => d.card.track.id)).size, dealt.length, `card repeated: ${where}`);
    assert.equal(new Set(dealt.map((d) => d.card.artist.id)).size, dealt.length, `artist repeated: ${where}`);
    const lore = state.kept.map((k) => k.loreId).filter(Boolean);
    assert.equal(new Set(lore).size, lore.length, `lore repeated: ${where}`);
  });
});

test('one skip stays in the lineage and offers a different style; two in a row leave it', () => {
  for (const profile of profiles) {
    for (const seed of SEEDS) {
      const { dealt } = play(profile, seed, (_s, round) => (round === 3 || round === 4 ? 'skip' : 'collect'));
      const [third, fourth, fifth] = [dealt[2], dealt[3], dealt[4]];
      const where = `${label(profile)}, seed ${seed}`;
      assert.equal(fourth.card.track.lineage, third.card.track.lineage, `one skip left the lineage: ${where}`);
      assert.equal(fourth.kind, 'retry', where);
      assert.notEqual(fourth.card.track.genre, third.card.track.genre, `retry offered the same style: ${where}`);
      assert.notEqual(fifth.card.track.lineage, third.card.track.lineage, `two skips stayed: ${where}`);
      assert.equal(fifth.kind, 'turn', where);
    }
  }
});

test('a kept card between two skips keeps the lineage', () => {
  for (const profile of profiles) {
    const { dealt } = play(profile, 3, (_s, round) => (round <= 2 || round === 3 || round === 5 ? 'skip' : 'collect'));
    const lineage = dealt[2].card.track.lineage;
    for (const i of [3, 4, 5]) assert.equal(dealt[i].card.track.lineage, lineage, `${label(profile)}, card ${i + 1}`);
  }
});

test('a lineage left after two skips does not come back in that game', () => {
  everyGame(({ dealt }, where) => {
    for (let i = 4; i < dealt.length; i++) {
      if (dealt[i].kind !== 'turn') continue;
      const leftLineage = dealt[i - 1].card.track.lineage;
      for (const later of dealt.slice(i)) assert.notEqual(later.card.track.lineage, leftLineage, where);
    }
  });
});

test('three kept cards in a lineage are enough: the desk moves on', () => {
  for (const profile of profiles) {
    for (const seed of SEEDS) {
      const { dealt } = play(profile, seed, () => 'collect');
      const perLineage = new Map();
      for (const d of dealt) {
        const lineage = d.card.track.lineage;
        if (lineage) perLineage.set(lineage, (perLineage.get(lineage) ?? 0) + 1);
      }
      for (const [lineage, n] of perLineage) assert.ok(n <= 3, `${label(profile)}, seed ${seed}: ${n} cards from ${lineage}`);
      assert.ok(dealt.some((d) => d.kind === 'branch'), `${label(profile)}, seed ${seed}: never branched`);
    }
  }
});

test('with no entry card kept, card 3 starts in the first lineage the profile bridges to', () => {
  for (const profile of profiles) {
    const { dealt } = play(profile, 1, () => 'skip');
    assert.equal(dealt[2].card.track.lineage, catalog.cell(profile.era, profile.region).bridges[0], label(profile));
    assert.equal(dealt[2].kind, 'start');
  }
});

test('a kept entry card decides where card 3 starts', () => {
  for (const profile of profiles) {
    const cell = catalog.cell(profile.era, profile.region);
    const lineage = catalog.card(cell.local).track.lineage ?? catalog.card(cell.global).track.lineage;
    if (!lineage) continue;
    const { dealt } = play(profile, 1, () => 'collect');
    assert.equal(dealt[2].card.track.lineage, lineage, label(profile));
  }
});

test('decade and region still decide the card after the first two', () => {
  // Inside any lineage, a first card from the player's region or listening years wins over one
  // that is neither, and one that is both wins over everything.
  for (const profile of profiles) {
    const cell = catalog.cell(profile.era, profile.region);
    for (const lineage of catalog.lineages) {
      for (const seed of SEEDS) {
        const state = { ...initialState, phase: 'booth', profile, seed, round: 2, seen: [cell.local, cell.global] };
        const firstTier = catalog.cards.filter((c) => c.track.lineage === lineage.id && c.track.tier === 1 && !state.seen.includes(c.track.id));
        const pick = pickInLineage(catalog, state, lineage.id, 3);
        const where = `${label(profile)}, ${lineage.id}, seed ${seed}: picked ${pick.track.id}`;
        if (firstTier.some((c) => fromRegion(c, profile) && inWindow(catalog, c, profile))) {
          assert.ok(fromRegion(pick, profile) && inWindow(catalog, pick, profile), where);
        } else if (firstTier.some((c) => fromRegion(c, profile) || inWindow(catalog, c, profile))) {
          assert.ok(fromRegion(pick, profile) || inWindow(catalog, pick, profile), where);
        }
      }
    }
  }
});

test('over whole games, later cards lean towards the player\'s region and years', () => {
  let near = 0;
  let total = 0;
  for (const profile of profiles) {
    let nearHere = 0;
    for (const seed of SEEDS) {
      const { dealt } = play(profile, seed, () => 'collect');
      for (const d of dealt.slice(2)) {
        total++;
        if (fromRegion(d.card, profile) || inWindow(catalog, d.card, profile)) {
          near++;
          nearHere++;
        }
      }
    }
    assert.ok(nearHere > 0, `${label(profile)}: no later card from the player's region or years in ${SEEDS.length} games`);
  }
  // Dealt blind, about a third of the catalog would match an average profile.
  const blind = profiles.reduce((sum, p) => sum + catalog.cards.filter((c) => c.track.lineage && (fromRegion(c, p) || inWindow(catalog, c, p))).length, 0) /
    (profiles.length * catalog.cards.filter((c) => c.track.lineage).length);
  assert.ok(near / total > blind + 0.15, `share near the player ${(near / total).toFixed(2)} vs blind ${blind.toFixed(2)}`);
});

test('a reason never claims more than the card: region and years are named only when true', () => {
  everyGame(({ dealt }, where, profile) => {
    for (const d of dealt) {
      assert.ok(d.reason.length > 0 && !/undefined|null|「」/.test(d.reason), `${where}: "${d.reason}"`);
      if (d.reason.includes('这张来自')) assert.ok(fromRegion(d.card, profile), `${where}: "${d.reason}"`);
      if (d.reason.includes('这张出自')) assert.ok(inWindow(catalog, d.card, profile), `${where}: "${d.reason}"`);
      if (d.round >= 3) assert.ok(d.reason.includes(catalog.lineage(d.card.track.lineage).nameZh), `${where}: "${d.reason}"`);
    }
  });
});

test('a book or film is shown only under a card it is about', () => {
  everyGame(({ state }, where) => {
    for (const k of state.kept) {
      if (!k.loreId) continue;
      const card = catalog.card(k.cardId);
      const lore = catalog.loreItem(k.loreId);
      assert.ok(lore.artistIds.includes(card.artist.id) || lore.genres.includes(card.track.genre), `${where}: ${lore.id} under ${card.track.id}`);
    }
  });
});

test('the same seed deals the same game; another seed can deal another', () => {
  const profile = { era: '1980s', region: 'japan' };
  const ids = (seed) => play(profile, seed, () => 'collect').dealt.map((d) => d.card.track.id).join(',');
  assert.equal(ids(7), ids(7));
  assert.ok(new Set(SEEDS.map(ids)).size > 1, 'every seed dealt the same nine cards');
});

test('stamps only act when they should', () => {
  const profile = { era: '1990s', region: 'uk' };
  const start = reduce(initialState, { type: 'start', profile, seed: 1 }, catalog);
  assert.equal(reduce(start, { type: 'next' }, catalog), start, 'next before a decision');
  const kept = reduce(start, { type: 'collect' }, catalog);
  assert.equal(kept.step, 'kept');
  assert.equal(kept.round, 1, 'collecting does not deal the next card by itself');
  assert.equal(reduce(kept, { type: 'collect' }, catalog), kept, 'collecting twice');
  assert.equal(reduce(kept, { type: 'skip' }, catalog), kept, 'skipping a kept card');
  assert.equal(reduce(kept, { type: 'next' }, catalog).round, 2);
  assert.deepEqual(reduce(kept, { type: 'restart' }, catalog), initialState);
  assert.equal(reduce(initialState, { type: 'collect' }, catalog), initialState, 'collecting with no game');
});

// ---- Persona ----

const cardsOf = (...ids) => ids.map((id) => catalog.card(id));

test('the persona is the lineage the player kept most', () => {
  everyGame(({ state }, where) => {
    const kept = state.kept.map((k) => catalog.card(k.cardId));
    const { persona, because } = resolvePersona(catalog, kept);
    const counts = new Map();
    let pop = 0;
    for (const c of kept) {
      if (c.track.lineage) counts.set(c.track.lineage, (counts.get(c.track.lineage) ?? 0) + 1);
      else pop++;
    }
    const top = Math.max(0, ...counts.values());
    if (kept.length === 0) assert.equal(persona.rule, 'empty', where);
    else if (pop > top) assert.equal(persona.rule, 'pop', where);
    else if (top === 1 && counts.size >= 3) assert.equal(persona.rule, 'mixed', where);
    else {
      assert.equal(persona.rule, 'lineage', where);
      assert.equal(counts.get(persona.lineage), top, `${where}: ${persona.id} is not the most kept lineage`);
      const firstAtTop = kept.find((c) => c.track.lineage && counts.get(c.track.lineage) === top).track.lineage;
      assert.equal(persona.lineage, firstAtTop, `${where}: tie not settled by what was kept first`);
      assert.ok(because.includes(catalog.lineage(persona.lineage).nameZh), where);
    }
    assert.ok(because.includes(String(kept.length)) || kept.length === 0, `${where}: "${because}"`);
  });
});

test('persona sentences state the exact counts', () => {
  const jazzHeavy = resolvePersona(catalog, cardsOf('so-what', 'moanin', 'glorias-step', 'stan'));
  assert.equal(jazzHeavy.persona.lineage, 'jazz');
  assert.equal(jazzHeavy.because, '你收下的 4 张里有 3 张来自「爵士」。');

  const tie = resolvePersona(catalog, cardsOf('stan', 'so-what', 'moanin', 'alright'));
  assert.equal(tie.persona.lineage, 'hiphop');
  assert.equal(tie.because, '你收下的 4 张里，「嘻哈与节拍」和「爵士」各有 2 张，先收下的是「嘻哈与节拍」。');

  assert.equal(resolvePersona(catalog, []).persona.rule, 'empty');
  assert.equal(resolvePersona(catalog, cardsOf('kiss', 'first-love')).persona.rule, 'pop');
  assert.equal(resolvePersona(catalog, cardsOf('kiss', 'first-love', 'so-what')).persona.rule, 'pop');
  assert.equal(resolvePersona(catalog, cardsOf('kiss', 'so-what')).persona.lineage, 'jazz');
  const mixed = resolvePersona(catalog, cardsOf('so-what', 'stan', 'paranoid'));
  assert.equal(mixed.persona.rule, 'mixed');
  assert.equal(mixed.because, '你收下的 3 张里，3 条线各有一张，没有哪条领先。');
});
