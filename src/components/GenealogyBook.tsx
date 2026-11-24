import { useState } from 'react';
import { LINEAGES, LINEAGE_LIST, LINEAGE_STYLE } from '../data';
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
  const style = LINEAGE_STYLE[selected];

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
              八条音乐谱系
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: 20 }}>
              📖 谱系手册
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
                  <span>{LINEAGE_STYLE[lin.id].shortCN}</span>
                  <span style={{ fontSize: 11 }}>
                    {depth > 0 ? `已收 ${cnt} 张` : '未解锁'}
                  </span>
                </div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{lin.name}</div>
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
                style={{ background: style.badgeColor, marginRight: 8 }}
              >
                {style.shortCN}
              </span>
              <strong style={{ fontSize: 17 }}>{current.name}</strong>
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
              🧭 下一张从这条谱系里出 →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {style.steps.map((step, idx) => {
              const unlocked = (unlockedDepths[current.id] ?? 0) >= idx + 1;
              return (
                <div
                  key={step}
                  style={{
                    background: unlocked ? '#ece3cc' : '#cfc2a5',
                    border: `2px solid ${unlocked ? '#1e6b3a' : '#6e6049'}`,
                    padding: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 900 }}>
                    <span>
                      {idx + 1} · {step}
                    </span>
                    <span style={{ color: unlocked ? '#1e6b3a' : '#6e6049' }}>
                      {unlocked ? '● 已点亮' : '○ 未到'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: '#3b3328' }}>
            <strong>相邻谱系：</strong>
            {current.adjacent.map((adj) => (
              <button
                key={adj}
                type="button"
                onClick={() => setSelected(adj)}
                className="tag-pill"
                style={{ cursor: 'pointer', marginLeft: 6, fontWeight: 700 }}
              >
                ⇄ {LINEAGES[adj].name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
