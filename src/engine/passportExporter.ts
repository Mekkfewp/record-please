import { drawMusicianPortrait } from './pixelArt';
import type { Card, LoreItem, PixelPortraitSpec } from '../types/game';

export interface PassportExportPayload {
  serialNo: string;
  inspectorAlias: string;
  personaTitleCN: string;
  personaTitleEN: string;
  eraLabel: string;
  regionLabel: string;
  bio: string;
  portrait: PixelPortraitSpec;
  topLineages: Array<{ label: string; score: number; color: string }>;
  cards: Card[];
  loreItems: LoreItem[];
}

export function downloadPassportPng(payload: PassportExportPayload): void {
  const W = 920;
  const H = 640;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  // Outer olive desk mat
  ctx.fillStyle = '#1e2521';
  ctx.fillRect(0, 0, W, H);

  // Kraft passport card
  ctx.fillStyle = '#dfd3b8';
  ctx.fillRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = '#1b1714';
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = '#8c7e65';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, W - 64, H - 64);

  // Header strip
  ctx.fillStyle = '#26302a';
  ctx.fillRect(36, 36, W - 72, 54);
  ctx.fillStyle = '#ebe2cc';
  ctx.font = 'bold 20px "WenQuanYi Micro Hei Mono", monospace';
  ctx.fillText('RECORD, PLEASE · 听觉身份许可证 & 专属黑胶档案', 54, 68);
  ctx.fillStyle = '#d9a74a';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`NO. ${payload.serialNo}`, W - 210, 68);

  // Pixel portrait rendered crisp at 3.5x
  const pCanvas = document.createElement('canvas');
  drawMusicianPortrait(pCanvas, payload.portrait);
  ctx.drawImage(pCanvas, 56, 112, 168, 168);

  // Official green stamp over portrait corner
  ctx.save();
  ctx.translate(188, 262);
  ctx.rotate(-0.14);
  ctx.strokeStyle = '#1f6b3b';
  ctx.lineWidth = 3;
  ctx.strokeRect(-54, -18, 108, 34);
  ctx.fillStyle = '#1f6b3b';
  ctx.font = 'bold 13px "WenQuanYi Micro Hei Mono", monospace';
  ctx.fillText('APPROVED 准予通行', -48, 4);
  ctx.restore();

  // Persona identity text
  ctx.fillStyle = '#1c1815';
  ctx.font = 'bold 22px "WenQuanYi Micro Hei Mono", monospace';
  ctx.fillText(payload.personaTitleCN, 246, 138);
  ctx.fillStyle = '#5c5243';
  ctx.font = '14px monospace';
  ctx.fillText(payload.personaTitleEN, 246, 162);

  ctx.fillStyle = '#2d3831';
  ctx.font = '14px "WenQuanYi Micro Hei Mono", monospace';
  ctx.fillText(
    `持证人: ${payload.inspectorAlias}  |  年代: ${payload.eraLabel}  |  地区: ${payload.regionLabel}`,
    246,
    190
  );

  // DNA bars
  payload.topLineages.slice(0, 4).forEach((lin, idx) => {
    const by = 212 + idx * 20;
    ctx.fillStyle = '#2b2620';
    ctx.font = '12px "WenQuanYi Micro Hei Mono", monospace';
    ctx.fillText(lin.label.slice(0, 10), 246, by + 11);
    ctx.fillStyle = '#c4b79b';
    ctx.fillRect(380, by, 180, 12);
    ctx.fillStyle = lin.color;
    ctx.fillRect(380, by, Math.max(24, Math.round(180 * lin.score)), 12);
  });

  // Divider
  ctx.fillStyle = '#8c7e65';
  ctx.fillRect(56, 306, W - 112, 2);

  // Curated playlist table
  ctx.fillStyle = '#1f6b3b';
  ctx.font = 'bold 16px "WenQuanYi Micro Hei Mono", monospace';
  ctx.fillText('■ 专属黑胶单曲歌单 (CURATED TRACKLIST)', 56, 334);

  payload.cards.slice(0, 9).forEach(({ track: tr, artist }, i) => {
    const ty = 362 + i * 24;
    ctx.fillStyle = '#1c1815';
    ctx.font = '13px "WenQuanYi Micro Hei Mono", monospace';
    const line = `${String(i + 1).padStart(2, '0')}. ${tr.title} — ${artist.name} (${tr.year})`;
    ctx.fillText(line.slice(0, 56), 56, ty);
  });

  // Right bottom: Albums & Books
  ctx.fillStyle = '#8a3329';
  ctx.font = 'bold 16px "WenQuanYi Micro Hei Mono", monospace';
  ctx.fillText('■ 延伸专辑 & 书影音档案', 540, 334);

  payload.cards.slice(0, 4).forEach(({ album: alb, artist }, i) => {
    ctx.fillStyle = '#1c1815';
    ctx.font = '13px "WenQuanYi Micro Hei Mono", monospace';
    ctx.fillText(`LP · 《${alb.title}》 ${artist.name}`.slice(0, 44), 540, 362 + i * 24);
  });

  payload.loreItems.slice(0, 3).forEach((lore, i) => {
    ctx.fillStyle = '#2b4c7e';
    ctx.font = '13px "WenQuanYi Micro Hei Mono", monospace';
    ctx.fillText(`${lore.title} (${lore.year})`.slice(0, 46), 540, 470 + i * 24);
  });

  // Footer
  ctx.fillStyle = '#5c5243';
  ctx.font = '12px "WenQuanYi Micro Hei Mono", monospace';
  ctx.fillText(
    'RECORD, PLEASE',
    56,
    594
  );

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `record-please-passport-${payload.serialNo.toLowerCase()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
