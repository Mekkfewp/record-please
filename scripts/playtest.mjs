import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MEDIA_DIR = '/cursor/stores/bc-7944bf32-7d57-43bc-9c44-8d28e739e9a4/media';
const TMP_VIDEO_DIR = '/tmp/record-please-video';
fs.mkdirSync(MEDIA_DIR, { recursive: true });
fs.rmSync(TMP_VIDEO_DIR, { recursive: true, force: true });
fs.mkdirSync(TMP_VIDEO_DIR, { recursive: true });

const errors = [];

const browser = await chromium.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

const context = await browser.newContext({
  viewport: { width: 1360, height: 880 },
  recordVideo: {
    dir: TMP_VIDEO_DIR,
    size: { width: 1360, height: 880 },
  },
});

const page = await context.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
});
page.on('pageerror', (err) => {
  errors.push(`pageerror: ${err.message}`);
});

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

// 1. Onboarding: Select 1980s + Mainland China + Auto Lineage
await page.getByTestId('era-1980s').click();
await page.waitForTimeout(350);
await page.getByTestId('region-cn-mainland').click();
await page.waitForTimeout(450);
await page.getByTestId('start-booth-btn').click();
await page.waitForTimeout(700);

// 2. Round 1 (Local Signature): Preview groove, stamp COLLECT -> Progressive Unlock Artist + LP!
await page.getByTestId('preview-groove-btn').click();
await page.waitForTimeout(550);
await page.getByTestId('stamp-collect-btn').click();
await page.waitForSelector('[data-testid="progressive-unlock-panel"]');
await page.waitForTimeout(650);

// Capture Screenshot 1: record-please-booth.png
await page.screenshot({
  path: path.join(MEDIA_DIR, 'record-please-booth.png'),
  fullPage: false,
});

// Advance to Round 2 (Global Era Pop)
await page.getByTestId('next-record-btn').click();
await page.waitForTimeout(550);

// Open RYM Genealogy Rulebook, inspect Jazz & Shoegaze, steer to Shoegaze
await page.getByTestId('open-rulebook-btn').click();
await page.waitForSelector('[data-testid="rulebook-modal"]');
await page.waitForTimeout(500);
await page.getByTestId('rulebook-tab-shoegaze-indie').click();
await page.waitForTimeout(500);
await page.getByTestId('steer-lineage-shoegaze-indie').click();
await page.waitForTimeout(450);

// Stamp COLLECT on Round 2 -> Next triggers Cultural Lore Interlude!
await page.getByTestId('stamp-collect-btn').click();
await page.waitForTimeout(550);
await page.getByTestId('next-record-btn').click();
await page.waitForSelector('[data-testid="lore-modal"]');
await page.waitForTimeout(650);

// Capture Screenshot 2: record-please-lore.png (Cultural book/documentary card open over booth)
await page.screenshot({
  path: path.join(MEDIA_DIR, 'record-please-lore.png'),
  fullPage: false,
});

// Bookmark the Lore item!
await page.getByTestId('lore-bookmark-btn').click();
await page.waitForTimeout(500);

// Round 3: Stamp COLLECT on Shoegaze single, advance
await page.getByTestId('stamp-collect-btn').click();
await page.waitForTimeout(500);
await page.getByTestId('next-record-btn').click();
await page.waitForTimeout(450);

// Round 4: Stamp PASS to test smooth RYM lineage pivot!
await page.getByTestId('stamp-pass-btn').click();
await page.waitForTimeout(750);

// Round 5: Stamp COLLECT on pivoted lineage single!
await page.getByTestId('stamp-collect-btn').click();
await page.waitForTimeout(550);

// Issue Final Sonic Identity Passport & Curated Playlist!
await page.getByTestId('top-finish-btn').click();
await page.waitForSelector('[data-testid="passport-result-screen"]');
await page.waitForTimeout(800);

// Test Copy Markdown button
await page.getByTestId('copy-playlist-btn').click();
await page.waitForTimeout(450);

// Capture Screenshot 3: record-please-result.png
await page.screenshot({
  path: path.join(MEDIA_DIR, 'record-please-result.png'),
  fullPage: false,
});

const personaText = await page.getByTestId('persona-title').textContent();
console.log('Verified Persona:', personaText);

const video = page.video();
await context.close();
await browser.close();

if (video) {
  const webmPath = await video.path();
  const mp4Out = path.join(MEDIA_DIR, 'record-please-demo.mp4');
  execFileSync('ffmpeg', [
    '-y',
    '-i',
    webmPath,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    mp4Out,
  ]);
  console.log('Saved MP4 demo:', mp4Out);
}

if (errors.length > 0) {
  console.error('Console/Page errors detected:', errors);
  process.exit(1);
}
console.log('Playtest completed with ZERO console or page errors!');
