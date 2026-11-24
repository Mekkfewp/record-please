import type { Album, Card, LoreItem } from '../types/game';

const KIND_LABEL: Record<LoreItem['kind'], string> = { book: '书', film: '影片', series: '系列片' };

export function loreCredit(lore: LoreItem): string {
  return `《${lore.title}》${lore.creator}，${lore.year}，${KIND_LABEL[lore.kind]}`;
}

/** How a card names the release it came out on: an album by title, a single as just that. */
export function releaseLine(album: Album): string {
  return album.kind === 'single' ? '单曲' : `专辑《${album.title}》`;
}

export interface PlaylistSummary {
  profileLine: string;
  personaName: string;
  because: string;
  cards: Card[];
  lore: LoreItem[];
}

/** The result as plain Markdown, for the copy button. */
export function playlistMarkdown({ profileLine, personaName, because, cards, lore }: PlaylistSummary): string {
  const lines = [
    '# 请出示唱片 · 歌单',
    '',
    profileLine,
    `${personaName}：${because}`,
    '',
    ...cards.map(({ track, artist, album }, i) => {
      const line = `${i + 1}. 〈${track.title}〉 ${artist.name}（${track.year}），${releaseLine(album)}`;
      return track.apple ? `${line} [Apple Music](${track.apple.url})` : line;
    }),
  ];
  if (lore.length > 0) {
    lines.push('', '## 延伸阅读', '', ...lore.map((l) => `- ${loreCredit(l)}`));
  }
  return lines.join('\n');
}
