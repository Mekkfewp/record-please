import { useState } from 'react';
import { LINEAGE_LIST, LINEAGE_STYLE, getEra, getRegion, lineageLabel } from '../data';
import { resolvePersona } from '../data/personas';
import { downloadPassportPng } from '../engine/passportExporter';
import { CoverArt } from './CoverArt';
import { AppleCredit, ListenLinks } from './ListenLinks';
import { LoreCoverCanvas, PortraitCanvas } from './PixelArtViews';
import type { Card, LineageId, LoreItem, PlayerProfile } from '../types/game';

export function PlaylistPassport({
  profile,
  collected,
  bookmarkedLore,
  lineageCounts,
  onKeepDigging,
  onRestart,
}: {
  profile: PlayerProfile;
  collected: Card[];
  bookmarkedLore: LoreItem[];
  lineageCounts: Record<LineageId, number>;
  onKeepDigging: () => void;
  onRestart: () => void;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const era = getEra(profile.birthEra);
  const region = getRegion(profile.region);
  const { persona, portrait, because } = resolvePersona(collected);

  const maxScore = Math.max(1, ...Object.values(lineageCounts));
  const sortedLineages = LINEAGE_LIST.map((l) => ({
    meta: l,
    count: lineageCounts[l.id] ?? 0,
    ratio: (lineageCounts[l.id] ?? 0) / maxScore,
  })).sort((a, b) => b.count - a.count);

  const serialNo = `RP-${profile.birthEra.slice(0, 4)}-${profile.region.toUpperCase()}-${collected.length}`;

  const handleCopyMarkdown = async () => {
    const lines = [
      `# 《请出示唱片 Record, Please》歌单`,
      `- ${era.label}出生 · ${region.label}`,
      `- 人格：**${persona.name} (${persona.nameEn})** — ${because}`,
      ``,
      `## 歌单 (${collected.length} 首)`,
      ...collected.map(
        ({ track, artist, album }, i) =>
          `${i + 1}. **${track.title}** — ${artist.name} (${track.year})，专辑《${album.title}》` +
          (track.apple ? ` [Apple Music](${track.apple.url})` : '')
      ),
      ...(bookmarkedLore.length > 0
        ? [``, `## 延伸阅读 (${bookmarkedLore.length})`, ...bookmarkedLore.map((l) => `- ${l.title}（${l.creator}，${l.year}）`)]
        : []),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.setTimeout(() => setCopyState('idle'), 2400);
  };

  const handleDownloadPng = () => {
    downloadPassportPng({
      serialNo,
      inspectorAlias: profile.inspectorAlias,
      personaTitleCN: persona.name,
      personaTitleEN: persona.nameEn,
      eraLabel: era.label,
      regionLabel: region.label,
      bio: because,
      portrait,
      topLineages: sortedLineages.map((x) => ({
        label: LINEAGE_STYLE[x.meta.id].shortCN,
        score: x.count > 0 ? Math.max(0.2, x.ratio) : 0.12,
        color: LINEAGE_STYLE[x.meta.id].badgeColor,
      })),
      cards: collected,
      loreItems: bookmarkedLore,
    });
  };

  return (
    <div className="passport-stage" data-testid="passport-result-screen">
      <div className="paper-sheet" style={{ padding: '22px 24px', background: 'var(--paper-cream)' }}>
        <div className="permit-header">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5c4e3a' }}>NO. {serialNo}</div>
            <h1 style={{ margin: '4px 0 0', fontSize: 24 }}>你的歌单</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" data-testid="copy-playlist-btn" className="pixel-btn approve" onClick={handleCopyMarkdown}>
              {copyState === 'copied' ? '✓ 已复制' : copyState === 'failed' ? '✕ 复制失败' : '📋 复制歌单'}
            </button>
            <button type="button" data-testid="download-png-btn" className="pixel-btn brass" onClick={handleDownloadPng}>
              💾 下载 PNG
            </button>
            <button type="button" className="pixel-btn" onClick={onKeepDigging}>
              ← 返回审查台
            </button>
            <button type="button" className="pixel-btn crimson" onClick={onRestart}>
              ↻ 重新开始
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: '#dfd3b8', padding: 14, border: '2px solid #191613' }}>
            <PortraitCanvas spec={portrait} size={124} />
            <div>
              <div data-testid="persona-title" style={{ fontSize: 21, fontWeight: 900, marginTop: 2 }}>
                {persona.name}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#473e30' }}>{persona.nameEn}</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>
                {era.label}出生 · {region.label}
              </div>
              <p data-testid="persona-because" style={{ fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>{because}</p>
            </div>
          </div>

          <div style={{ background: '#dfd3b8', padding: 14, border: '2px solid #191613' }}>
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 8 }}>■ 你收下的谱系</div>
            {sortedLineages.slice(0, 6).map(({ meta, count, ratio }) => (
              <div key={meta.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 12 }}>
                <span style={{ width: 125, fontWeight: 700 }}>{LINEAGE_STYLE[meta.id].shortCN}</span>
                <div style={{ flex: 1, height: 12, background: '#c7b99b', border: '1px solid #4a4033' }}>
                  <div
                    style={{
                      width: `${count > 0 ? Math.max(15, Math.round(ratio * 100)) : 0}%`,
                      height: '100%',
                      background: LINEAGE_STYLE[meta.id].badgeColor,
                    }}
                  />
                </div>
                <span style={{ width: 34, textAlign: 'right', fontWeight: 700 }}>{count}张</span>
              </div>
            ))}
          </div>
        </div>

        <div className="progressive-grid">
          <div style={{ background: '#dfd3b8', padding: 14, border: '2px solid #191613' }}>
            <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 10 }}>🎵 歌单 ({collected.length} 首)</div>
            {collected.length === 0 && <div style={{ fontSize: 12 }}>这一趟没有收下任何唱片。</div>}
            {collected.map((card, idx) => {
              const { track, artist, album } = card;
              return (
              <div
                key={track.id}
                data-testid="playlist-row"
                style={{
                  padding: '7px 8px',
                  borderBottom: '1px dashed #7a6c55',
                  display: 'flex',
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <CoverArt card={card} size={48} grid={24} />
                <div>
                  <strong>{String(idx + 1).padStart(2, '0')}. 〈{track.title}〉</strong> — {artist.name} ({track.year})
                  <div style={{ fontSize: 11, color: '#4d4335' }}>
                    《{album.title}》({album.year}) · {lineageLabel(track.lineage)} · {track.genre}
                  </div>
                  <ListenLinks card={card} compact />
                </div>
              </div>
              );
            })}
            {collected.length > 0 && <AppleCredit />}
          </div>

          <div style={{ background: '#dfd3b8', padding: 14, border: '2px solid #191613' }}>
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 8 }}>
              📚 延伸阅读 ({bookmarkedLore.length})
            </div>
            {bookmarkedLore.length === 0 && <div style={{ fontSize: 12 }}>没有收藏书或影片。</div>}
            {bookmarkedLore.map((l) => (
              <div key={l.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, background: '#e4d6b5', padding: 6, border: '1px solid #6e6049' }}>
                <LoreCoverCanvas lore={l} width={38} height={46} />
                <div style={{ fontSize: 12 }}>
                  <strong>{l.title}</strong>（{l.creator}，{l.year}）
                  <div style={{ fontSize: 11, color: '#4d4335' }}>{l.line}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
