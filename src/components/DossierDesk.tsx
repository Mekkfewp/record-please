import { countryLabel, lineageColor, lineageLabel } from '../data';
import { CoverArt } from './CoverArt';
import { AppleCredit, ListenLinks } from './ListenLinks';
import type { PreviewStatus } from '../engine/previewPlayer';
import type { Card } from '../types/game';

const PREVIEW_LABEL: Record<PreviewStatus, string> = {
  idle: '▶ 试听 30 秒',
  loading: '… 载入中',
  playing: '■ 停止',
  unavailable: '试听暂不可用',
};

export function DossierDesk({
  card,
  reason,
  stampState,
  previewStatus,
  onTogglePreview,
  onNextAfterCollect,
}: {
  card: Card;
  reason: string;
  stampState: 'idle' | 'collected' | 'passed';
  previewStatus: PreviewStatus;
  onTogglePreview: () => void;
  onNextAfterCollect: () => void;
}) {
  const { track, artist, album } = card;
  const hasPreview = Boolean(track.apple) && previewStatus !== 'unavailable';

  return (
    <div className="desk-surface">
      <div className="desk-reason">🧭 {reason}</div>

      <div className="paper-sheet card-sheet">
        <div className="card-sheet-head">
          <div className="card-sheet-badges">
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

        <div className="card-sheet-body">
          <div className="card-cover-col">
            <CoverArt card={card} size={144} />
            <button
              type="button"
              data-testid="preview-btn"
              data-status={track.apple ? previewStatus : 'unavailable'}
              onClick={onTogglePreview}
              disabled={!hasPreview || previewStatus === 'loading'}
              className={`pixel-btn preview-btn ${previewStatus === 'playing' ? 'brass' : ''}`}
            >
              {track.apple ? PREVIEW_LABEL[previewStatus] : PREVIEW_LABEL.unavailable}
            </button>
          </div>

          <div className="card-text-col">
            <div data-testid="card-title" className="card-title">
              〈{track.title}〉
            </div>
            <div data-testid="card-artist" className="card-artist">
              {artist.name} · {track.year}
            </div>
            <div className="card-genre">
              <span className="tag-pill">{track.genre}</span>
            </div>
            <ListenLinks card={card} />
          </div>
        </div>
        <AppleCredit />
      </div>

      {stampState === 'collected' && (
        <div data-testid="progressive-unlock-panel" className="progressive-grid">
          <div className="paper-sheet unlock-sheet manila">
            <div className="dim-badge">[音乐人 ARTIST · 已解锁]</div>
            <div data-testid="unlocked-artist" className="unlock-name">{artist.name}</div>
            <div className="unlock-note">来自：{countryLabel(artist.country)}</div>
          </div>

          <div className="paper-sheet unlock-sheet">
            <div className="dim-badge">[专辑 ALBUM · 已解锁]</div>
            <div data-testid="unlocked-album" className="unlock-name">
              《{album.title}》({album.year})
            </div>
            <div className="unlock-note">
              {artist.name} · 〈{track.title}〉收录于这张专辑
            </div>
            <div className="unlock-next">
              <button type="button" onClick={onNextAfterCollect} className="pixel-btn approve">
                下一张 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
