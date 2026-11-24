import { countryLabel, lineageColor, lineageLabel } from '../data';
import { placeholderCover } from '../data/placeholderArt';
import { AlbumCoverCanvas, Single7InchCanvas } from './PixelArtViews';
import type { Card } from '../types/game';

export function DossierDesk({
  card,
  reason,
  stampState,
  isPlayingGroove,
  onToggleGroove,
  onNextAfterCollect,
}: {
  card: Card;
  reason: string;
  stampState: 'idle' | 'collected' | 'passed';
  isPlayingGroove: boolean;
  onToggleGroove: () => void;
  onNextAfterCollect: () => void;
}) {
  const { track, artist, album } = card;

  return (
    <div className="desk-surface">
      <div
        style={{
          background: '#212b25',
          border: '2px solid #d4a247',
          color: '#f2e8cf',
          padding: '7px 12px',
          fontSize: 12,
        }}
      >
        🧭 {reason}
      </div>

      <div className="paper-sheet" style={{ padding: '14px 16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="dim-badge">[单曲 SINGLE]</span>
            <span
              className="dim-badge"
              style={{ background: lineageColor(track.lineage), borderColor: '#151311' }}
            >
              {lineageLabel(track.lineage)}
            </span>
          </div>
          {stampState !== 'idle' && (
            <span
              data-testid="card-ink-stamp"
              className={`ink-stamp-mark ${stampState === 'collected' ? 'approve' : 'pass'}`}
            >
              {stampState === 'collected' ? 'APPROVED · 已收录' : 'PASSED · 跳过'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0 }}>
            <Single7InchCanvas spec={placeholderCover(track.id, track.lineage)} isPlaying={isPlayingGroove} />
            <button
              type="button"
              data-testid="preview-groove-btn"
              onClick={onToggleGroove}
              className={`pixel-btn ${isPlayingGroove ? 'brass' : ''}`}
              style={{ width: '100%', marginTop: 6, fontSize: 12, padding: '5px 8px' }}
            >
              {isPlayingGroove ? '■ 停止' : '▶ 合成示意音（非原曲）'}
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 230 }}>
            <div data-testid="card-title" style={{ fontSize: 21, fontWeight: 900, lineHeight: 1.25 }}>
              〈{track.title}〉
            </div>
            <div data-testid="card-artist" style={{ fontSize: 14, fontWeight: 700, color: '#3b3328', marginTop: 3 }}>
              {artist.name} · {track.year}
            </div>
            <div style={{ marginTop: 7 }}>
              <span className="tag-pill" style={{ background: '#e8dcc2', fontWeight: 700 }}>
                {track.genre}
              </span>
            </div>
          </div>
        </div>
      </div>

      {stampState === 'collected' && (
        <div data-testid="progressive-unlock-panel" className="progressive-grid">
          <div className="paper-sheet" style={{ padding: 14, background: 'var(--paper-manila)' }}>
            <div className="dim-badge" style={{ marginBottom: 8 }}>
              [音乐人 ARTIST · 已解锁]
            </div>
            <div data-testid="unlocked-artist" style={{ fontWeight: 900, fontSize: 16 }}>{artist.name}</div>
            <div style={{ fontSize: 12, color: '#4d4335', marginTop: 2 }}>
              来自：{countryLabel(artist.country)}
            </div>
          </div>

          <div className="paper-sheet" style={{ padding: 14, background: 'var(--paper-cream)' }}>
            <div className="dim-badge" style={{ marginBottom: 8 }}>
              [专辑 ALBUM · 已解锁]
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlbumCoverCanvas spec={placeholderCover(album.id, track.lineage)} size={96} />
              <div style={{ flex: 1 }}>
                <div data-testid="unlocked-album" style={{ fontWeight: 900, fontSize: 16 }}>
                  《{album.title}》({album.year})
                </div>
                <div style={{ fontSize: 12, color: '#4d4335', marginTop: 2 }}>
                  {artist.name} · 〈{track.title}〉收录于这张专辑
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button
                type="button"
                onClick={onNextAfterCollect}
                className="pixel-btn approve"
              >
                下一张 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
