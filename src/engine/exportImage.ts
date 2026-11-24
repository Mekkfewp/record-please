import { drawMusicianPortrait } from './pixelArt';
import { loreCredit, type PlaylistSummary } from './playlistText';
import type { PixelPortraitSpec } from '../types/game';

const FONT = '"Fusion Pixel", monospace';
const WIDTH = 720;
const PAD = 36;
const LINE = 36;

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of text) {
    if (line !== '' && ctx.measureText(line + ch).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

/**
 * Saves the result as a PNG: persona, playlist and reading list as text.
 * Covers are left out on purpose; Apple's terms do not allow saving its artwork.
 */
export async function savePlaylistImage(summary: PlaylistSummary, portrait: PixelPortraitSpec): Promise<void> {
  await document.fonts.load(`24px ${FONT}`).catch(() => undefined);

  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) return;
  measure.font = `24px ${FONT}`;
  const textWidth = WIDTH - PAD * 2;
  const headWidth = textWidth - 144 - 24;
  const becauseLines = wrap(measure, summary.because, headWidth);
  const headHeight = Math.max(144, 48 + LINE + becauseLines.length * LINE);
  const loreRows = summary.lore.length > 0 ? summary.lore.length + 2 : 0;
  const height = PAD + LINE * 2 + headHeight + LINE + (summary.cards.length + 1) * LINE + loreRows * LINE + PAD;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.textBaseline = 'top';

  ctx.fillStyle = '#1d2420';
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = '#ece3cc';
  ctx.fillRect(12, 12, WIDTH - 24, height - 24);

  let y = PAD;
  ctx.fillStyle = '#574e40';
  ctx.font = `24px ${FONT}`;
  ctx.fillText('请出示唱片', PAD, y);
  const profileWidth = ctx.measureText(summary.profileLine).width;
  ctx.fillText(summary.profileLine, WIDTH - PAD - profileWidth, y);
  y += LINE * 2;

  const face = document.createElement('canvas');
  drawMusicianPortrait(face, portrait);
  ctx.drawImage(face, PAD, y, 144, 144);
  const textX = PAD + 144 + 24;
  ctx.fillStyle = '#191613';
  ctx.font = `36px ${FONT}`;
  ctx.fillText(fit(ctx, summary.personaName, headWidth), textX, y);
  ctx.font = `24px ${FONT}`;
  becauseLines.forEach((line, i) => ctx.fillText(line, textX, y + 48 + LINE / 2 + i * LINE));
  y += headHeight + LINE;

  ctx.fillStyle = '#574e40';
  ctx.fillText(`歌单（${summary.cards.length} 首）`, PAD, y);
  y += LINE;
  ctx.fillStyle = '#191613';
  summary.cards.forEach(({ track, artist }, i) => {
    const row = `${String(i + 1).padStart(2, '0')} 〈${track.title}〉 ${artist.name}（${track.year}）`;
    ctx.fillText(fit(ctx, row, textWidth), PAD, y);
    y += LINE;
  });

  if (summary.lore.length > 0) {
    y += LINE;
    ctx.fillStyle = '#574e40';
    ctx.fillText('延伸阅读', PAD, y);
    y += LINE;
    ctx.fillStyle = '#191613';
    for (const item of summary.lore) {
      ctx.fillText(fit(ctx, loreCredit(item), textWidth), PAD, y);
      y += LINE;
    }
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'record-please.png';
  link.click();
  URL.revokeObjectURL(url);
}
