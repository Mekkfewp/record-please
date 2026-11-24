import { useState } from 'react';
import { LINEAGES, LINEAGE_LIST } from '../data';
import type { LineageId } from '../types/game';

export function GenealogyBook({
  activeLineage,
  unlockedDepths,
  collectedCounts,
  onSteer,
  onClose,
}: {
  activeLineage: LineageId;
  unlockedDepths: Record<LineageId, number>;
  collectedCounts: Record<LineageId, number>;
  onSteer: (lin: LineageId) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<LineageId>(activeLineage);
  const current = LINEAGES[selected];

  return (
    <div className="modal-backdrop" data-testid="rulebook-modal">
      <div className="paper-sheet rulebook-sheet">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '3px double #191613',
            paddingBottom: 10,
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5c4e3a' }}>
              OFFICIAL RYM GENEALOGY HANDBOOK · 八大音乐流派谱系审查手册
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: 20 }}>
              📖 RYM 谱系树与定向调档台
            </h2>
          </div>
          <button
            type="button"
            data-testid="close-rulebook-btn"
            className="pixel-btn crimson"
            onClick={onClose}
          >
            ✕ 合上手册
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
            gap: 7,
            marginBottom: 14,
          }}
        >
          {LINEAGE_LIST.map((lin) => {
            const depth = unlockedDepths[lin.id] ?? 0;
            const cnt = collectedCounts[lin.id] ?? 0;
            return (
              <button
                key={lin.id}
                type="button"
                data-testid={`rulebook-tab-${lin.id}`}
                onClick={() => setSelected(lin.id)}
                className={`choice-chip ${selected === lin.id ? 'selected' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                  <span>{lin.shortCN}</span>
                  <span style={{ fontSize: 11 }}>
                    {depth > 0 ? `Lv.${depth} (${cnt}张)` : '未解锁'}
                  </span>
                </div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{lin.nameEN}</div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            background: '#dfd3b8',
            border: '2px solid #191613',
            padding: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <span
                className="dim-badge"
                style={{ background: current.badgeColor, marginRight: 8 }}
              >
                {current.shortCN}
              </span>
              <strong style={{ fontSize: 17 }}>{current.nameCN}</strong>
              <div style={{ fontSize: 12, color: '#4d4335', marginTop: 4 }}>
                {current.tagline}
              </div>
            </div>

            <button
              type="button"
              data-testid={`steer-lineage-${current.id}`}
              className="pixel-btn approve"
              onClick={() => {
                onSteer(current.id);
                onClose();
              }}
            >
              🧭 定向调取该谱系下一张单曲 →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {current.nodes.map((node) => {
              const unlocked = (unlockedDepths[current.id] ?? 0) >= node.tier;
              return (
                <div
                  key={node.tier}
                  style={{
                    background: unlocked ? '#ece3cc' : '#cfc2a5',
                    border: `2px solid ${unlocked ? '#1e6b3a' : '#6e6049'}`,
                    padding: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 900 }}>
                    <span>
                      阶梯 {node.tier} · {node.nameCN}
                    </span>
                    <span style={{ color: unlocked ? '#1e6b3a' : '#6e6049' }}>
                      {unlocked ? '● 已点亮' : '○ 待深潜'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#5c4e3a', marginTop: 2 }}>
                    {node.nameEN} ({node.eraSpan})
                  </div>
                  <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.45 }}>
                    {node.summary}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: '#3b3328' }}>
            <strong>相邻可跨界支流：</strong>
            {current.adjacent.map((adj) => (
              <button
                key={adj}
                type="button"
                onClick={() => setSelected(adj)}
                className="tag-pill"
                style={{ cursor: 'pointer', marginLeft: 6, fontWeight: 700 }}
              >
                ⇄ {LINEAGES[adj].nameCN}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
