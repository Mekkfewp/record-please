// Plays the built game in a real browser and compares everything on screen with the catalog.
//
//   npm run test:e2e                                 builds, serves dist/ on a spare port, and plays it
//   E2E_URL=https://example.org/game/ node e2e/play.mjs   plays an address that is already being served
//   node e2e/play.mjs --shots <dir>                  also saves screenshots and the exported image there
//
// Needs Google Chrome (or CHROME_PATH pointing at a Chromium build) and network access:
// covers and previews are fetched from Apple, and one real preview has to start playing.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cat = JSON.parse(readFileSync(join(root, 'src/data/catalog.json'), 'utf8'));
const A = new Map(cat.artists.map((a) => [a.id, a]));
const AL = new Map(cat.albums.map((a) => [a.id, a]));
const byTitle = new Map(cat.tracks.map((t) => [t.title, t]));
const lineageZh = new Map(cat.lineages.map((l) => [l.id, l.nameZh]));
const KIND = { book: '书', film: '影片', series: '系列片' };
const loreText = (l) => `《${l.title}》${l.creator}，${l.year}，${KIND[l.kind]}。${l.line}`;
const CREDIT = '试听片段与封面由 iTunes 提供（provided courtesy of iTunes）。Apple 与 Apple Music 是 Apple Inc. 在美国及其他国家和地区注册的商标。';

const shotsArg = process.argv.indexOf('--shots');
const SHOTS = shotsArg > 0 && process.argv[shotsArg + 1] ? resolve(process.argv[shotsArg + 1]) : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const shot = (name) => join(SHOTS, `${name}.png`);

let server = null;
let BASE = process.env.E2E_URL;
if (BASE) {
  if (!BASE.endsWith('/')) BASE += '/';
} else {
  if (!existsSync(join(root, 'dist/index.html'))) {
    console.error('dist/ is missing: run "npm run build" first, or use "npm run test:e2e".');
    process.exit(1);
  }
  const port = process.env.E2E_PORT ?? '4179';
  BASE = `http://127.0.0.1:${port}/`;
  server = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', port, '--strictPort'], { cwd: root, stdio: 'ignore' });
  process.on('exit', () => server.kill());
  let up = false;
  for (let i = 0; i < 50 && !up; i++) {
    up = await fetch(BASE).then((r) => r.ok, () => false);
    if (!up) await new Promise((done) => setTimeout(done, 200));
  }
  if (!up) {
    server.kill();
    console.error(`the preview server did not come up on ${BASE}`);
    process.exit(1);
  }
}
console.log('playing', BASE);

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, headless: true } : { channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, timezoneId: 'Asia/Shanghai', permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
let problems = 0;
const bad = (m) => { problems++; console.log('PROBLEM:', m); };
const tid = (id) => `[data-testid="${id}"]`;
const text = async (id) => (await page.textContent(tid(id))).replace(/\s+/g, ' ').trim();
const lines = async (sel) => (await page.innerText(sel)).split('\n').map((s) => s.trim()).filter(Boolean);

async function start(era, region) {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.click(tid(`era-${era}`));
  await page.click(tid(`region-${region}`));
  await page.click(tid('start-booth-btn'));
}

/** Plays the card on the desk and checks everything written on it against the catalog. */
async function playCard(round, decision, profile) {
  const counter = await text('round-counter');
  if (counter !== `${round} / 9`) bad(`counter "${counter}" at round ${round}`);
  const title = (await text('card-title')).replace(/^〈|〉$/g, '');
  const track = byTitle.get(title);
  if (!track) { bad(`unknown card "${title}"`); return null; }
  const artist = A.get(track.artistId);
  const album = AL.get(track.albumId);
  const reason = await text('card-reason');
  const expected = new Set([
    reason, `〈${track.title}〉`, `${artist.name} · ${track.year}`, track.genre, '▶ 试听 30 秒', '在 Apple Music 上收听', '网易云搜索', 'QQ音乐搜索', '跳过', '收下', CREDIT,
    ...(track.lineage ? [lineageZh.get(track.lineage)] : []), ...(track.apple.cn ? [] : ['中国大陆区未上架']),
  ]);
  for (const line of await lines(tid('booth'))) if (!expected.has(line.replace(/\s+/g, ' '))) bad(`${track.id}: unexpected text on card: "${line}"`);
  if (!reason || /undefined|null/.test(reason)) bad(`${track.id}: reason "${reason}"`);
  if (round >= 3 && !reason.includes(lineageZh.get(track.lineage))) bad(`${track.id}: reason does not name the card's lineage: "${reason}"`);
  if (reason.includes('这张来自') && artist.region !== profile.region) bad(`${track.id}: reason claims region: "${reason}"`);
  const src = await page.getAttribute(tid('cover-art'), 'src').catch(() => null);
  if (src !== track.apple.artworkUrl.replace('100x100bb', '48x48bb')) bad(`${track.id}: cover src ${src}`);
  const want = track.apple.cn ? `https://music.apple.com/cn/album/${track.apple.collectionId}?i=${track.apple.trackId}` : track.apple.url;
  if ((await page.getAttribute(tid('apple-music-link'), 'href')) !== want) bad(`${track.id}: Apple link`);
  if ((await page.getAttribute(tid('netease-link'), 'href')) !== track.links.netease) bad(`${track.id}: NetEase link`);
  if ((await page.getAttribute(tid('qq-link'), 'href')) !== track.links.qq) bad(`${track.id}: QQ link`);

  let lore = null;
  if (decision === 'collect') {
    await page.click(tid('stamp-collect-btn'));
    if ((await text('unlocked-artist')) !== `${artist.name}（${cat.countries[artist.country] ?? artist.country}）`) bad(`${track.id}: artist line "${await text('unlocked-artist')}"`);
    if ((await text('unlocked-album')) !== `《${album.title}》（${album.year}）`) bad(`${track.id}: album line "${await text('unlocked-album')}"`);
    if (!(await page.$(tid('card-ink-stamp')))) bad(`${track.id}: no stamp mark`);
    if (await page.$(tid('stamp-pass-btn'))) bad(`${track.id}: stamps still shown after collecting`);
    if (await page.$(tid('card-lore'))) {
      const shown = await text('card-lore');
      lore = cat.lore.find((l) => loreText(l) === shown);
      if (!lore) bad(`${track.id}: lore line is not a catalog line: "${shown}"`);
      else if (!lore.artistIds.includes(track.artistId) && !lore.genres.includes(track.genre)) bad(`${track.id}: lore ${lore.id} is not about this card`);
    }
    const nextLabel = await text('next-record-btn');
    if (nextLabel !== (round === 9 ? '看歌单' : '下一张')) bad(`${track.id}: next button "${nextLabel}" at round ${round}`);
    await page.click(tid('next-record-btn'));
  } else {
    await page.click(tid('stamp-pass-btn'));
  }
  return { track, lore };
}

async function playGame(profile, decide) {
  await start(profile.era, profile.region);
  const dealt = [];
  for (let round = 1; round <= 9; round++) {
    const decision = decide(round);
    const res = await playCard(round, decision, profile);
    if (!res) return null;
    dealt.push({ ...res, decision });
  }
  await page.waitForSelector(tid('passport-result-screen'), { timeout: 5000 }).catch(() => bad(`${profile.era}/${profile.region}: no result after 9 cards`));
  const cell = cat.cells.find((c) => c.era === profile.era && c.region === profile.region);
  if (dealt[0].track.id !== cell.local || dealt[1].track.id !== cell.global) bad(`${profile.era}/${profile.region}: entry cards`);
  if (new Set(dealt.map((d) => d.track.id)).size !== 9) bad(`${profile.era}/${profile.region}: a card repeated`);
  return dealt;
}

async function checkResult(profile, dealt) {
  const kept = dealt.filter((d) => d.decision === 'collect');
  const personaName = await text('persona-title');
  const persona = cat.personas.find((p) => p.name === personaName);
  if (!persona) bad(`persona "${personaName}" is not in the catalog`);
  const counts = new Map();
  for (const k of kept) if (k.track.lineage) counts.set(k.track.lineage, (counts.get(k.track.lineage) ?? 0) + 1);
  const top = Math.max(0, ...counts.values());
  const pop = kept.filter((k) => !k.track.lineage).length;
  const expectRule = kept.length === 0 ? 'empty' : pop > top ? 'pop' : top === 1 && counts.size >= 3 ? 'mixed' : 'lineage';
  if (persona && persona.rule !== expectRule) bad(`persona rule ${persona.rule}, expected ${expectRule}`);
  if (persona && expectRule === 'lineage' && counts.get(persona.lineage) !== top) bad(`persona ${persona.id} is not the most kept lineage`);
  const rows = await page.$$eval(tid('playlist-row'), (rs) => rs.map((r) => r.querySelector('p').textContent.replace(/\s+/g, ' ').trim()));
  const wantRows = kept.map((k) => `〈${k.track.title}〉 ${A.get(k.track.artistId).name}（${k.track.year}）`);
  if (JSON.stringify(rows) !== JSON.stringify(wantRows)) bad(`playlist rows differ: ${JSON.stringify(rows)} vs ${JSON.stringify(wantRows)}`);
  const loreRows = await page.$$eval(tid('lore-row'), (rs) => rs.map((r) => r.textContent.replace(/\s+/g, ' ').trim()));
  const wantLore = kept.filter((k) => k.lore).map((k) => loreText(k.lore));
  if (JSON.stringify(loreRows) !== JSON.stringify(wantLore)) bad(`reading list differs from the lines shown under cards`);
  return { persona, kept };
}

// ---- 1. Start screen is two rows of buttons and a start button.
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
if (!(await page.evaluate(() => document.fonts.check('18px "Fusion Pixel"')))) bad('pixel font not loaded');
const startButtons = await page.$$eval('[data-testid="start-screen"] button', (bs) => bs.map((b) => b.textContent.trim()));
const startInputs = await page.$$('[data-testid="start-screen"] input, [data-testid="start-screen"] select, [data-testid="start-screen"] textarea');
console.log('start screen buttons:', startButtons.join(' | '), '| inputs:', startInputs.length);
if (startButtons.length !== 12 || startInputs.length !== 0) bad('start screen is not just decade, region and start');
if (!(await page.isDisabled(tid('start-booth-btn')))) bad('start enabled before choosing');
await page.click(tid('era-1980s'));
if (!(await page.isDisabled(tid('start-booth-btn')))) bad('start enabled with only a decade');
if (SHOTS) { await page.click(tid('region-japan')); await page.screenshot({ path: shot('start') }); }

// ---- 2. Every cell, a different way of playing each time.
const patterns = ['ccccccccc', 'sssssssss', 'ccsscscsc', 'scscscscs', 'sscccsscc', 'csccsccsc', 'ccscccccc'];
let games = 0;
const personasSeen = new Set();
for (const [i, cell] of cat.cells.entries()) {
  const pattern = patterns[i % patterns.length];
  const profile = { era: cell.era, region: cell.region };
  const dealt = await playGame(profile, (round) => (pattern[round - 1] === 'c' ? 'collect' : 'skip'));
  if (!dealt) continue;
  games++;
  const { persona } = await checkResult(profile, dealt);
  if (persona) personasSeen.add(persona.id);
}
console.log('games played to the end:', games, '| personas seen:', [...personasSeen].join(', '));

// ---- 3. Flow bugs from the review.
{
  // Skipping everything still ends at nine cards, with the empty persona and no playlist.
  const dealt = await playGame({ era: '1990s', region: 'usa' }, () => 'skip');
  await checkResult({ era: '1990s', region: 'usa' }, dealt);
  if ((await text('persona-title')) !== cat.personas.find((p) => p.rule === 'empty').name) bad('all-skip game did not give the empty persona');
  if (await page.$(tid('copy-playlist-btn'))) bad('copy offered with an empty playlist');
  const resultButtons = await page.$$eval('[data-testid="passport-result-screen"] button', (bs) => bs.map((b) => b.textContent.trim()));
  console.log('all-skip result buttons:', resultButtons.join(' | '));
  // Two kept cards (fewer than three) also end at nine.
  const two = await playGame({ era: '1970s', region: 'uk' }, (round) => (round <= 2 ? 'collect' : 'skip'));
  const { kept } = await checkResult({ era: '1970s', region: 'uk' }, two);
  console.log('two-kept game ended with', kept.length, 'kept; result buttons:', (await page.$$eval('[data-testid="passport-result-screen"] button', (bs) => bs.map((b) => b.textContent.trim()))).join(' | '));
  // The result has one way out, and it leads to a fresh start.
  await page.click(tid('restart-btn'));
  if (!(await page.$(tid('start-screen')))) bad('restart did not return to the start screen');
  if (!(await page.isDisabled(tid('start-booth-btn')))) bad('restart kept the old choices');
  for (const gone of ['top-lore-btn', 'top-rulebook-btn', 'top-finish-btn', 'lore-modal']) if (await page.$(tid(gone))) bad(`${gone} still exists`);
}

// ---- 4. Real preview, expired address, moving on stops the music.
{
  await start('1980s', 'japan');
  const t = byTitle.get((await text('card-title')).replace(/^〈|〉$/g, ''));
  const requests = [];
  page.on('request', (r) => { if (/audio-ssl\.itunes|itunes\.apple\.com\/lookup/.test(r.url())) requests.push(r.url()); });
  await page.click(tid('preview-btn'));
  await page.waitForFunction(() => document.querySelector('[data-testid="preview-btn"]').dataset.status === 'playing', null, { timeout: 20000 });
  if (requests.at(-1) !== t.apple.previewUrl) {
    // Apple replaces preview addresses now and then; the game then asks the lookup API for the current one.
    if (requests.some((u) => u.includes(`/lookup?id=${t.apple.trackId}`))) console.log(`note: the stored preview address of ${t.id} has expired; the game recovered through lookup (rerun "npm run match")`);
    else bad('played address is not the stored preview');
  }
  if (SHOTS) { await page.waitForFunction(() => document.querySelector('[data-testid="cover-art"]')?.naturalWidth > 0); await page.screenshot({ path: shot('booth') }); }
  await page.click(tid('stamp-collect-btn'));
  if ((await page.getAttribute(tid('preview-btn'), 'data-status')) !== 'playing') bad('collecting stopped the preview of the same card');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: shot('booth-kept') }); }
  await page.click(tid('next-record-btn'));
  await page.waitForTimeout(300);
  if ((await page.getAttribute(tid('preview-btn'), 'data-status')) !== 'idle') bad('preview kept playing on the next card');
  const t2 = byTitle.get((await text('card-title')).replace(/^〈|〉$/g, ''));
  const donor = cat.tracks.find((x) => x.id === 'so-what').apple.previewUrl;
  await page.route(t2.apple.previewUrl, (route) => route.fulfill({ status: 404, body: '' }));
  await page.route(/itunes\.apple\.com\/lookup/, (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ resultCount: 1, results: [{ trackId: t2.apple.trackId, previewUrl: donor }] }) }));
  requests.length = 0;
  await page.click(tid('preview-btn'));
  await page.waitForFunction(() => document.querySelector('[data-testid="preview-btn"]').dataset.status === 'playing', null, { timeout: 20000 });
  if (!requests.some((u) => u.includes(`/lookup?id=${t2.apple.trackId}`)) || requests.at(-1) !== donor) bad('expired preview did not recover through lookup');
  await page.click(tid('preview-btn'));
  await page.unroute(/itunes\.apple\.com\/lookup/);
  await page.click(tid('stamp-pass-btn'));
  await page.waitForTimeout(300);
  const t3 = byTitle.get((await text('card-title')).replace(/^〈|〉$/g, ''));
  await page.route(t3.apple.previewUrl, (route) => route.fulfill({ status: 404, body: '' }));
  await page.route(/itunes\.apple\.com\/lookup/, (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ resultCount: 0, results: [] }) }));
  await page.click(tid('preview-btn'));
  await page.waitForFunction(() => document.querySelector('[data-testid="preview-btn"]').dataset.status === 'unavailable', null, { timeout: 20000 });
  console.log('preview: real play ok, recovery ok, dead preview ->', await text('preview-btn'));
  await page.unroute(/itunes\.apple\.com\/lookup/);
  await page.click(tid('mute-toggle-btn'));
  if ((await page.getAttribute(tid('mute-toggle-btn'), 'aria-pressed')) !== 'true' || (await text('mute-toggle-btn')) !== '声音：关') bad('mute toggle');
  await page.click(tid('mute-toggle-btn'));
}

// ---- 5. A full game to the result: copy, save, screenshots.
{
  const profile = { era: '1970s', region: 'uk' };
  let dealt, persona, kept;
  // The deal is seeded at random; replay until the result has a reading list to show.
  for (let attempt = 0; attempt < 8; attempt++) {
    dealt = await playGame(profile, (round) => (round === 4 || round === 7 ? 'skip' : 'collect'));
    ({ persona, kept } = await checkResult(profile, dealt));
    if (kept.filter((k) => k.lore).length >= 2) break;
  }
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="playlist-row"] img.cover')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 20000 }).catch(() => bad('result covers did not load'));
  const want = new Set([
    '1970 年代 · 英国', persona.name, await text('persona-because'), `歌单（${kept.length} 首）`, '延伸阅读', '复制歌单', '保存图片', '再来一次', CREDIT, '在 Apple Music 上收听', '网易云搜索', 'QQ音乐搜索', '中国大陆区未上架',
    ...kept.map((k) => `〈${k.track.title}〉 ${A.get(k.track.artistId).name}（${k.track.year}）`), ...kept.filter((k) => k.lore).map((k) => loreText(k.lore)),
  ]);
  for (const line of await lines(tid('passport-result-screen'))) if (!want.has(line.replace(/\s+/g, ' '))) bad(`unexpected text on result: "${line}"`);
  await page.click(tid('copy-playlist-btn'));
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  for (const k of kept) if (!clip.includes(`〈${k.track.title}〉 ${A.get(k.track.artistId).name}（${k.track.year}），专辑《${AL.get(k.track.albumId).title}》`)) bad(`copied text lacks ${k.track.id}`);
  if ((await text('copy-playlist-btn')) !== '已复制') bad('no copy confirmation');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click(tid('download-png-btn'))]);
  const exported = join(SHOTS ?? mkdtempSync(join(tmpdir(), 'record-please-e2e-')), 'export.png');
  await download.saveAs(exported);
  const png = readFileSync(exported);
  if (download.suggestedFilename() !== 'record-please.png' || png.length < 5000 || png.toString('latin1', 1, 4) !== 'PNG') bad('the saved image is not a PNG');
  console.log('final game:', dealt.map((d) => `${d.decision === 'collect' ? '+' : '-'}${d.track.id}`).join(' '), '\n  persona:', persona.name, '|', await text('persona-because'), '| reading lines:', kept.filter((k) => k.lore).length);
  if (SHOTS) {
    await page.waitForTimeout(2200);
    await page.screenshot({ path: shot('result'), fullPage: true });
    console.log('saved screenshots to', SHOTS);
  }
}

// ---- 6. Phone width: nothing spills sideways.
{
  const phone = await browser.newContext({ viewport: { width: 375, height: 760 }, deviceScaleFactor: 3 });
  const p = await phone.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  const overflow = async (where) => { const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (o > 0) bad(`phone: ${where} overflows by ${o}px`); };
  await overflow('start');
  await p.click(tid('era-2000s')); await p.click(tid('region-usa')); await p.click(tid('start-booth-btn'));
  for (let i = 0; i < 9; i++) { await overflow(`card ${i + 1}`); await p.click(tid('stamp-collect-btn')); await overflow(`card ${i + 1} kept`); await p.click(tid('next-record-btn')); }
  await p.waitForSelector(tid('passport-result-screen'));
  await overflow('result');
  if (SHOTS) await p.screenshot({ path: shot('phone-result'), fullPage: true });
  await phone.close();
}

const injected = errors.filter((e) => /404/.test(e)).length;
console.log('page errors:', errors.length, `(${injected} are the 404s this test injected)`, errors.filter((e) => !/404/.test(e)).slice(0, 5));
if (errors.length !== injected || injected > 2) bad('unexpected page errors');
console.log('problems:', problems);
await browser.close();
server?.kill();
process.exit(problems ? 1 : 0);
