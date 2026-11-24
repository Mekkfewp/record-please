import { lineageLabel } from '../data';
import { BoothWindowCanvas } from './PixelArtViews';
import { StampBar } from './StampBar';
import type { Card, LineageId } from '../types/game';

export function BoothLeftColumn({
  activeLineage,
  steeredLineage,
  isPlaying,
  collectedSingles,
  round,
  targetRounds,
  stampState,
  onStampCollect,
  onStampPass,
  onNextAfterCollect,
  onOpenRulebook,
  onFinishPassport,
}: {
  activeLineage: LineageId;
  steeredLineage: LineageId | null;
  isPlaying: boolean;
  collectedSingles: Card[];
  round: number;
  targetRounds: number;
  stampState: 'idle' | 'collected' | 'passed';
  onStampCollect: () => void;
  onStampPass: () => void;
  onNextAfterCollect: () => void;
  onOpenRulebook: () => void;
  onFinishPassport: () => void;
}) {
  return (
    <div className="booth-left-col">
      <div
        style={{
          background: '#171d1a',
          border: '3px solid #48574d',
          padding: 8,
          boxShadow: '4px 4px 0 #0e110f',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: '#c8d1ca',
            fontSize: 11,
            marginBottom: 5,
          }}
        >
          <span>BOOTH #07 · 隔音试听窗</span>
          <span style={{ color: isPlaying ? '#6fd992' : '#9aa69d' }}>
            {isPlaying ? '● 45RPM 唱机运转中' : '○ 待机'}
          </span>
        </div>
        <BoothWindowCanvas
          lineage={activeLineage}
          isPlaying={isPlaying}
          collectedCount={collectedSingles.length}
        />
      </div>

      <StampBar
        disabled={stampState !== 'idle'}
        hasUnlockedDossier={stampState === 'collected'}
        onStampCollect={onStampCollect}
        onStampPass={onStampPass}
        onNextAfterCollect={onNextAfterCollect}
        onOpenRulebook={onOpenRulebook}
        activeLineage={activeLineage}
        steeredLineage={steeredLineage}
        round={round}
        targetRounds={targetRounds}
        collectedCount={collectedSingles.length}
      />

      {/* Collected Crate Preview */}
      <div className="paper-sheet" style={{ padding: '10px 12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <strong style={{ fontSize: 13 }}>
            📦 手提黑胶箱 ({collectedSingles.length} 首)
          </strong>
          {collectedSingles.length >= 2 && (
            <button
              type="button"
              data-testid="issue-passport-btn"
              onClick={onFinishPassport}
              className="pixel-btn approve"
              style={{ fontSize: 11, padding: '3px 8px' }}
            >
              🪪 提前签发歌单 →
            </button>
          )}
        </div>
        {collectedSingles.length === 0 ? (
          <div style={{ fontSize: 11, color: '#574e40' }}>
            还没有收录。盖下 [收录] 就会入箱，并解锁这首歌的音乐人和专辑。
          </div>
        ) : (
          <div style={{ maxHeight: 150, overflowY: 'auto', fontSize: 12 }}>
            {collectedSingles.map(({ track: s, artist }, idx) => (
              <div
                key={s.id}
                style={{
                  padding: '3px 0',
                  borderBottom: '1px dotted #8a7c64',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <span>
                  {idx + 1}. {s.title} — {artist.name}
                </span>
                <span style={{ fontSize: 10, color: '#4d4335' }}>
                  [{lineageLabel(s.lineage)}]
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
