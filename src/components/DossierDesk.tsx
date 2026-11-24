import { LINEAGES } from '../data';
import {
  AlbumCoverCanvas,
  PortraitCanvas,
  Single7InchCanvas,
} from './PixelArtViews';
import type {
  AlbumRecord,
  ArtistDossier,
  SingleTrack,
} from '../types/game';

export function DossierDesk({
  single,
  artist,
  album,
  anchorBadge,
  pivotBanner,
  stampState,
  isPlayingGroove,
  onToggleGroove,
  onNextAfterCollect,
}: {
  single: SingleTrack;
  artist: ArtistDossier;
  album: AlbumRecord;
  anchorBadge: string;
  pivotBanner: string | null;
  stampState: 'idle' | 'collected' | 'passed';
  isPlayingGroove: boolean;
  onToggleGroove: () => void;
  onNextAfterCollect: () => void;
}) {
  const lin = LINEAGES[single.lineage];

  return (
    <div className="desk-surface">
      {pivotBanner && (
        <div
          style={{
            background: '#212b25',
            border: '2px solid #d4a247',
            color: '#f2e8cf',
            padding: '7px 12px',
            fontSize: 12,
          }}
        >
          🧭 {pivotBanner}
        </div>
      )}

      {/* DIMENSION I: 7" SINGLE RECORD */}
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
            <span className="dim-badge">[单曲 SINGLE · 7&quot; 45RPM]</span>
            <span
              className="dim-badge"
              style={{ background: lin.badgeColor, borderColor: '#151311' }}
            >
              {lin.shortCN} · Tier {single.tier}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#5c4b32' }}>
              ★ {anchorBadge}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 900 }}>
            RYM 评分: {single.rymRating} / 5.0
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0 }}>
            <Single7InchCanvas spec={single.cover} isPlaying={isPlayingGroove} />
            <button
              type="button"
              data-testid="preview-groove-btn"
              onClick={onToggleGroove}
              className={`pixel-btn ${isPlayingGroove ? 'brass' : ''}`}
              style={{ width: '100%', marginTop: 6, fontSize: 12, padding: '5px 8px' }}
            >
              {isPlayingGroove ? '■ 停止唱盘试听' : '▶ 试听 45RPM 律动'}
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 230, position: 'relative' }}>
            <div style={{ fontSize: 21, fontWeight: 900, lineHeight: 1.25 }}>
              〈{single.title}〉
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#3b3328', marginTop: 3 }}>
              {single.artistName} · {single.year} · 《{single.albumTitle}》
            </div>
            <div style={{ marginTop: 7 }}>
              <span className="tag-pill" style={{ background: '#e8dcc2', fontWeight: 700 }}>
                {single.subgenre}
              </span>
              {single.rymDescriptors.map((d) => (
                <span key={d} className="tag-pill">
                  #{d}
                </span>
              ))}
            </div>

            <p style={{ margin: '8px 0 6px', fontSize: 13, lineHeight: 1.55 }}>
              <strong>试听室听感：</strong>
              {single.vibeCN}
            </p>
            <div
              style={{
                fontSize: 12,
                color: '#4a4134',
                background: '#d3c5a6',
                padding: '6px 9px',
                borderLeft: '3px solid #222b25',
              }}
            >
              <strong>馆员递进线索：</strong>
              {single.whyRecommended}
            </div>

            {stampState !== 'idle' && (
              <div style={{ position: 'absolute', right: 8, top: 2 }}>
                <span
                  data-testid="card-ink-stamp"
                  className={`ink-stamp-mark ${stampState === 'collected' ? 'approve' : 'pass'}`}
                >
                  {stampState === 'collected' ? 'APPROVED · 已收录' : 'PASSED · 切歌变轨'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DIMENSION II & III: PROGRESSIVE UNLOCK OF ARTIST DOSSIER + LP RECORD */}
      {stampState === 'collected' && (
        <div data-testid="progressive-unlock-panel" className="progressive-grid">
          <div className="paper-sheet" style={{ padding: 14, background: 'var(--paper-manila)' }}>
            <div className="dim-badge" style={{ marginBottom: 8 }}>
              [音乐家 ARTIST DOSSIER · 已解锁]
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <PortraitCanvas spec={artist.portrait} size={92} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{artist.name}</div>
                <div style={{ fontSize: 12, color: '#4d4335', marginTop: 2 }}>
                  坐标：{artist.originCity} ({artist.activeYears})
                </div>
                <div style={{ marginTop: 6 }}>
                  {artist.sonicTraits.slice(0, 3).map((tr) => (
                    <span key={tr} className="tag-pill" style={{ background: '#e5d6b3' }}>
                      {tr}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
              {artist.sceneStory}
            </p>
          </div>

          <div className="paper-sheet" style={{ padding: 14, background: 'var(--paper-cream)' }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}
            >
              <span className="dim-badge">[专辑 LP RECORD · 12&quot; 33⅓RPM]</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#1e6b3a' }}>
                {album.rymStatus}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlbumCoverCanvas spec={album.cover} size={96} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>
                  《{album.title}》({album.year})
                </div>
                <div style={{ fontSize: 12, color: '#4d4335', marginTop: 2 }}>
                  {album.artistName} · RYM {album.rymScore}
                </div>
                <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.45 }}>
                  <strong>核心地位：</strong>
                  {album.whyItMatters}
                </div>
              </div>
            </div>
            {album.advancedFollowUp && (
              <div
                style={{
                  marginTop: 8,
                  padding: '6px 8px',
                  background: '#dfd3b8',
                  border: '1px solid #6e6049',
                  fontSize: 11,
                }}
              >
                <strong>进阶延伸 LP：</strong>《{album.advancedFollowUp.title}》—{' '}
                {album.advancedFollowUp.artist} ({album.advancedFollowUp.year})：
                {album.advancedFollowUp.reason}
              </div>
            )}
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button
                type="button"
                onClick={onNextAfterCollect}
                className="pixel-btn approve"
              >
                继续深潜下一张唱片 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
