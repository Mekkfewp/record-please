import { LINEAGES } from '../data';
import { LoreCoverCanvas } from './PixelArtViews';
import type { CulturalLoreItem } from '../types/game';

const KIND_LABELS: Record<CulturalLoreItem['kind'], string> = {
  book: '代表性音乐专著 · BOOK',
  'oral-history': '无删减口述史 / 纪实 · ORAL HISTORY',
  documentary: '音乐文化纪录片 · DOCUMENTARY',
  film: '传奇演唱会电影 · CONCERT FILM',
};

export function LoreCardModal({
  lore,
  onDecision,
}: {
  lore: CulturalLoreItem;
  onDecision: (bookmark: boolean) => void;
}) {
  const lin = LINEAGES[lore.lineage];

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
              [文化档案 LORE DOSSIER]
            </span>
            <span
              className="dim-badge"
              style={{ background: lin.badgeColor }}
            >
              {lin.shortCN}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#4d4335' }}>
            {KIND_LABELS[lore.kind]}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <LoreCoverCanvas lore={lore} width={112} height={138} />

          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{lore.title}</h2>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#473e30' }}>
              作者 / 导演：{lore.creator} · {lore.year}
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.6, margin: '10px 0 8px' }}>
              {lore.summary}
            </p>

            <div
              style={{
                background: '#d6c6a3',
                borderLeft: '3px solid #284b7a',
                padding: '7px 10px',
                fontSize: 12,
                lineHeight: 1.5,
                marginBottom: 8,
              }}
            >
              <strong>为什么值得读/看：</strong>
              {lore.whyEssential}
            </div>

            <div style={{ fontSize: 12, fontStyle: 'italic', color: '#3b3328' }}>
              {lore.quote}
            </div>
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
            已阅归档 · 继续试听
          </button>
          <button
            type="button"
            data-testid="lore-bookmark-btn"
            className="pixel-btn approve"
            onClick={() => onDecision(true)}
          >
            ★ 盖章收入我的书影音单 (BOOKMARK)
          </button>
        </div>
      </div>
    </div>
  );
}
