// Plays the 1980s slice at ?slice=1 and leaves the ordinary game alone at /.
//   node e2e/slice.mjs
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = '/tmp/slice-shots';
mkdirSync(shots, { recursive: true });
const port = process.env.SLICE_PORT ?? '4181';
const base = `http://127.0.0.1:${port}/`;
const server = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', port, '--strictPort'], { cwd: root, stdio: 'ignore' });
const stop = () => { server.kill(); };
process.on('exit', stop);

let up = false;
for (let i = 0; i < 50 && !up; i++) {
  up = await fetch(base).then((r) => r.ok, () => false);
  if (!up) await new Promise((done) => setTimeout(done, 200));
}
if (!up) {
  stop();
  console.error('vite did not start');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const problems = [];
const bad = (message) => { problems.push(message); console.log('PROBLEM:', message); };
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
page.on('pageerror', (error) => bad(String(error)));

await page.goto(base, { waitUntil: 'load' });
if (await page.locator('[data-testid="slice-screen"]').count()) bad('the ordinary game was replaced');
if (!(await page.locator('[data-testid="start-screen"]').count())) bad('the ordinary start screen is missing');

await page.goto(`${base}?slice=1`, { waitUntil: 'load' });
await page.locator('[data-testid="slice-screen"]').waitFor();
const doors = await page.locator('[data-testid="slice-door"]').count();
if (doors !== 3) bad(`expected 3 doors, saw ${doors}`);
const supplyText = (await page.locator('[data-testid="slice-supply"]').innerText()).trim();
if (supplyText) bad(`the supply box shows text: ${supplyText}`);
await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="slice-door"] img')].every((img) => img.complete && img.naturalWidth > 0));
await page.screenshot({ path: join(shots, 'start.png') });

await page.locator('[data-testid="slice-door"]').first().focus();
await page.keyboard.press('Enter');
await page.locator('[data-testid="slice-record"]').waitFor();
const firstFace = await page.locator('[data-testid="slice-record"]').getAttribute('data-face');
if (firstFace !== 'face-up') bad(`first record face is ${firstFace}`);
const playerLabel = await page.locator('[data-testid="slice-player"]').getAttribute('aria-label');
if (!playerLabel?.startsWith('唱机')) bad(`1980-82 should be a turntable, label: ${playerLabel}`);
const crateLabel = await page.locator('[data-testid="slice-crate"]').getAttribute('aria-label');
const shelfLabel = await page.locator('[data-testid="slice-shelf"]').getAttribute('aria-label');
if (!crateLabel?.includes('唱片箱') || !shelfLabel?.includes('货架')) bad(`controls are unnamed: ${crateLabel} / ${shelfLabel}`);
for (const id of ['slice-crate', 'slice-shelf', 'slice-player', 'slice-stack']) {
  const text = (await page.locator(`[data-testid="${id}"]`).innerText()).replace(/\s+/g, '');
  if (text) bad(`${id} shows text: ${text}`);
}
await page.screenshot({ path: join(shots, 'desk.png') });

const playing = await page.waitForFunction(() => document.querySelector('[data-testid="slice-player"]')?.dataset.state === 'playing', null, { timeout: 20000 }).then(() => true, () => false);
if (!playing) bad('the first record did not start playing by itself');

for (let round = 1; round <= 9; round++) {
  const face = await page.locator('[data-testid="slice-record"]').getAttribute('data-face');
  if (round <= 2 && face !== 'face-up') bad(`record ${round} should be face up, was ${face}`);
  if (round >= 3 && face !== 'face-down') bad(`record ${round} should be face down, was ${face}`);
  if (round >= 3 && (await page.locator('.sleeve-title').count())) bad(`record ${round} shows its title before the decision`);
  if (round === 2) {
    await page.locator('[data-testid="slice-shelf"]').focus();
    await page.keyboard.press('Enter');
  } else {
    await page.locator('[data-testid="slice-crate"]').focus();
    await page.keyboard.press('Enter');
  }
  const after = await page.locator('[data-testid="slice-record"]').getAttribute('data-face');
  if (after === 'face-down') bad(`record ${round} did not turn over`);
  if (await page.locator('[data-testid="slice-slot-0"]').count() && (await page.locator('[data-testid="slice-slot-0"]').getAttribute('class'))?.includes('is-swappable')) {
    await page.locator('[data-testid="slice-slot-0"]').focus();
    await page.keyboard.press('Enter');
  }
  await page.locator('[data-testid="slice-stack"]').focus();
  await page.keyboard.press('Enter');
  if (round === 3) {
    const thumb = await page.waitForFunction(() => {
      const img = document.querySelector('[data-testid="slice-slot-0"] img');
      return Boolean(img && img.naturalWidth > 0);
    }, null, { timeout: 8000 }).then(() => true, () => false);
    if (!thumb) bad('a kept record has no cover in the crate');
    const passed = await page.locator('.route li').count();
    if (passed) bad('the route is on screen before the game ends');
    await page.screenshot({ path: join(shots, 'down.png') });
  }
}

await page.locator('[data-testid="slice-route"]').waitFor();
const stops = await page.locator('.route li').count();
if (stops !== 9) bad(`the route has ${stops} stops`);
if ((await page.locator('.route .kept').count()) < 1 || (await page.locator('.route .passed').count()) < 1) bad('the route does not show both kept and passed records');
const body = await page.locator('[data-testid="slice-screen"]').innerText();
if (/分数|排行|倒计时|\d\s*\/\s*9/.test(body)) bad(`the result shows a score or a countdown: ${body.slice(0, 200)}`);
await page.screenshot({ path: join(shots, 'route.png') });

const phone = await browser.newPage({ viewport: { width: 375, height: 700 }, deviceScaleFactor: 2 });
await phone.goto(`${base}?slice=1`, { waitUntil: 'load' });
await phone.locator('[data-testid="slice-door"]').first().click();
await phone.locator('[data-testid="slice-crate"]').waitFor();
await phone.waitForFunction(() => {
  const img = document.querySelector('[data-testid="slice-record"] img');
  return Boolean(img && img.naturalWidth > 0);
});
const crate = await phone.locator('[data-testid="slice-crate"]').boundingBox();
const sleeve = await phone.locator('[data-testid="slice-record"]').boundingBox();
if (!crate || crate.width < 44 || crate.height < 44) bad('the crate is smaller than a fingertip on a phone');
if (!sleeve || sleeve.width < 200) bad(`the record is too narrow on a phone: ${sleeve?.width}`);
if (crate.y + crate.height > 700) bad('the crate sits below the phone screen');
await phone.screenshot({ path: join(shots, 'phone.png') });

await browser.close();
stop();
if (problems.length) {
  console.log(problems.length, 'problems');
  process.exit(1);
}
console.log('slice plays');
