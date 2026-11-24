import { useState } from 'react';
import { LINEAGES } from '../data';
import type { LineageId } from '../types/game';

export function StampBar({
  disabled,
  hasUnlockedDossier,
  onStampCollect,
  onStampPass,
  onNextAfterCollect,
  onOpenRulebook,
  activeLineage,
  steeredLineage,
  round,
  targetRounds,
  collectedCount,
}: {
  disabled: boolean;
  hasUnlockedDossier: boolean;
  onStampCollect: () => void;
  onStampPass: () => void;
  onNextAfterCollect: () => void;
  onOpenRulebook: () => void;
  activeLineage: LineageId;
  steeredLineage: LineageId | null;
  round: number;
  targetRounds: number;
  collectedCount: number;
}) {
  const [trayOpen, setTrayOpen] = useState(true);
  const linMeta = LINEAGES[activeLineage];

  return (
    <div className="stamp-bar-housing">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#e8dec6',
          fontSize: 12,
          marginBottom: 6,
        }}
      >
        <span>■ 机械印章托盘 · STAMP BAR</span>
        <button
          type="button"
          onClick={() => setTrayOpen((v) => !v)}
          style={{
            background: '#2c3730',
            color: '#d4a247',
            border: '1px solid #5d6e62',
            fontFamily: 'var(--font-pixel)',
            fontSize: 11,
            padding: '2px 7px',
            cursor: 'pointer',
          }}
        >
          {trayOpen ? '收起托盘 ▲' : '拉出印章 ▼'}
        </button>
      </div>

      <div style={{ fontSize: 11, color: '#b7c2ba', marginBottom: 8, lineHeight: 1.45 }}>
        当前谱系：<strong style={{ color: '#f2e8cf' }}>{linMeta.nameCN}</strong>
        {steeredLineage && (
          <span style={{ color: '#d4a247', marginLeft: 6 }}>
            [已定向：{LINEAGES[steeredLineage].shortCN}]
          </span>
        )}
        <div>
          班次进度：第 <strong>{round}</strong> / {targetRounds} 轮 · 已收录黑胶：
          <strong style={{ color: '#6fd992' }}> {collectedCount} </strong>张
        </div>
      </div>

      {trayOpen && (
        <div className="stamp-plunger-row">
          <button
            type="button"
            data-testid="stamp-collect-btn"
            disabled={disabled}
            onClick={onStampCollect}
            className="stamp-plunger collect"
          >
            <div style={{ fontSize: 15, fontWeight: 900 }}>[收录 COLLECT]</div>
            <div style={{ fontSize: 11, opacity: 0.9, marginTop: 3 }}>
              解锁音乐家 + 代表LP并深潜
            </div>
          </button>

          <button
            type="button"
            data-testid="stamp-pass-btn"
            disabled={disabled}
            onClick={onStampPass}
            className="stamp-plunger pass"
          >
            <div style={{ fontSize: 15, fontWeight: 900 }}>[换一张 PASS]</div>
            <div style={{ fontSize: 11, opacity: 0.9, marginTop: 3 }}>
              平滑变轨至相邻RYM谱系
            </div>
          </button>
        </div>
      )}

      {hasUnlockedDossier && (
        <button
          type="button"
          data-testid="next-record-btn"
          onClick={onNextAfterCollect}
          className="pixel-btn brass"
          style={{ width: '100%', padding: '11px 12px', fontSize: 14, marginTop: 10 }}
        >
          ▶ 档案已入箱 · 顺藤摸瓜递送下一张唱片 →
        </button>
      )}

      <button
        type="button"
        data-testid="open-rulebook-btn"
        onClick={onOpenRulebook}
        className="pixel-btn"
        style={{ width: '100%', marginTop: 10, background: '#d5c295' }}
      >
        📖 翻阅《RYM 谱系手册》· 查看解锁树 / 手动变轨
      </button>
    </div>
  );
}
