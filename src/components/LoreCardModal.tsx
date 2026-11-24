import { lineageColor, lineageLabel } from '../data';
import { LoreCoverCanvas } from './PixelArtViews';
import type { LoreItem } from '../types/game';

const KIND_LABELS: Record<LoreItem['kind'], string> = {
  book: '书',
  film: '影片',
  series: '系列纪录片',
};

export function LoreCardModal({
  lore,
  onDecision,
}: {
  lore: LoreItem;
  onDecision: (bookmark: boolean) => void;
}) {
  return (
    <div className="modal-backdrop" data-testid="lore-modal">
      <div
        className="paper-sheet"
        style={{
          maxWidth: 680,
          width: '100%',
          padding: '20px 22px',
          background: 'var(--paper-lore)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #191613',
            paddingBottom: 10,
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="dim-badge" style={{ background: '#284b7a' }}>
              [延伸阅读]
            </span>
            <span className="dim-badge" style={{ background: lineageColor(lore.lineage) }}>
              {lineageLabel(lore.lineage)}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#4d4335' }}>
            {KIND_LABELS[lore.kind]}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <LoreCoverCanvas lore={lore} width={112} height={138} />

          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 data-testid="lore-title" style={{ margin: '0 0 4px', fontSize: 20 }}>{lore.title}</h2>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#473e30' }}>
              {lore.creator} · {lore.year}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: '10px 0 8px' }}>{lore.line}</p>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '2px dashed #6e6049',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            data-testid="lore-skip-btn"
            className="pixel-btn"
            onClick={() => onDecision(false)}
          >
            继续试听
          </button>
          <button
            type="button"
            data-testid="lore-bookmark-btn"
            className="pixel-btn approve"
            onClick={() => onDecision(true)}
          >
            ★ 收进我的书影单
          </button>
        </div>
      </div>
    </div>
  );
}
