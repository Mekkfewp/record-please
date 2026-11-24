import { useState } from 'react';
import { ERAS, LINEAGE_LIST, REGIONS } from '../data';
import { PortraitCanvas } from './PixelArtViews';
import type {
  BirthEra,
  PlayerProfile,
  RegionId,
  StartingLineageChoice,
} from '../types/game';

export function EntryPermit({
  onSubmit,
}: {
  onSubmit: (profile: PlayerProfile) => void;
}) {
  const [alias, setAlias] = useState('LISTENER-0451');
  const [birthEra, setBirthEra] = useState<BirthEra>('1990s');
  const [region, setRegion] = useState<RegionId>('cn-mainland');
  const [startingLineage, setStartingLineage] =
    useState<StartingLineageChoice>('auto');

  const selectedEra = ERAS.find((e) => e.id === birthEra) ?? ERAS[2];
  const selectedRegion = REGIONS.find((r) => r.id === region) ?? REGIONS[0];

  return (
    <div className="permit-stage">
      <div className="paper-sheet permit-card">
        <div className="permit-header">
          <div>
            <div style={{ fontSize: 12, color: '#6e5e46', fontWeight: 700 }}>
              MINISTRY OF SONIC ARCHIVES · 听觉边境审查署 FORM-RYM-01
            </div>
            <h1 style={{ margin: '4px 0 0', fontSize: 24 }}>
              入境听觉档案登记证 · ENTRY PERMIT
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PortraitCanvas
              size={68}
              spec={{
                seed: `preview-${birthEra}-${region}-${startingLineage}`,
                bgStyle: 'booth',
                accentColor: '#d4a247',
                prop: 'headphones',
              }}
            />
            <div className="ink-stamp-mark approve" style={{ fontSize: 12 }}>
              BOOTH #07 READY
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 700, fontSize: 14 }}>旅客代号 (PASSENGER ID):</label>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value || 'LISTENER-0451')}
            maxLength={22}
            style={{
              fontFamily: 'var(--font-pixel)',
              background: '#dfd3b8',
              border: '2px solid #191613',
              padding: '5px 10px',
              fontSize: 14,
              fontWeight: 700,
              width: 210,
            }}
          />
          <span style={{ fontSize: 12, color: '#574e40' }}>
            系统将按「当时全球流行 + 本土特色代表音乐家」双锚点递进发掘你的专属黑胶歌单
          </span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>
            1. 选择出生年代 (BIRTH ERA · 决定你的青春听歌窗口)
          </div>
          <div className="option-grid">
            {ERAS.map((era) => (
              <button
                key={era.id}
                type="button"
                data-testid={`era-${era.id}`}
                onClick={() => setBirthEra(era.id)}
                className={`choice-chip ${birthEra === era.id ? 'selected' : ''}`}
              >
                <div style={{ fontWeight: 900, fontSize: 14 }}>{era.labelCN}</div>
                <div style={{ fontSize: 11, opacity: 0.88, marginTop: 2 }}>
                  {era.formativeWindow}
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>
                  {era.mediaMemory}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>
            2. 选择成长国家/地区 (COUNTRY / REGION · 锚定本土特色音乐家)
          </div>
          <div className="option-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))' }}>
            {REGIONS.map((reg) => (
              <button
                key={reg.id}
                type="button"
                data-testid={`region-${reg.id}`}
                onClick={() => setRegion(reg.id)}
                className={`choice-chip ${region === reg.id ? 'selected' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                  <span>{reg.labelCN}</span>
                  <span style={{ fontSize: 11, opacity: 0.75 }}>[{reg.stampCode}]</span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.82, marginTop: 3, lineHeight: 1.35 }}>
                  {reg.sceneSummary}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>
            3. 初始 RYM 谱系倾向 (STARTING LINEAGE · 可选)
          </div>
          <div className="option-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))' }}>
            <button
              type="button"
              data-testid="lineage-auto"
              onClick={() => setStartingLineage('auto')}
              className={`choice-chip ${startingLineage === 'auto' ? 'selected' : ''}`}
            >
              <div style={{ fontWeight: 900 }}>★ 从时代与本土记忆出发</div>
              <div style={{ fontSize: 11, opacity: 0.84, marginTop: 2 }}>
                推荐！自动以本土名家 + 时代全球流行开启谱系
              </div>
            </button>
            {LINEAGE_LIST.map((lin) => (
              <button
                key={lin.id}
                type="button"
                data-testid={`lineage-${lin.id}`}
                onClick={() => setStartingLineage(lin.id)}
                className={`choice-chip ${startingLineage === lin.id ? 'selected' : ''}`}
              >
                <div style={{ fontWeight: 900 }}>{lin.shortCN}</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                  {lin.nameEN}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            background: '#d5c7a9',
            border: '2px dashed #594f3f',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            <div>
              <strong>当前档案核验：</strong>
              {selectedEra.labelCN}（{selectedEra.formativeWindow}）× {selectedRegion.labelCN}
            </div>
            <div style={{ color: '#473f33' }}>
              审查规则：单曲试听盖章 <strong>[收录 COLLECT]</strong> 即渐进解锁 <strong>[音乐家档案]</strong> 与 <strong>[核心+进阶黑胶专辑]</strong>；盖 <strong>[换一张 PASS]</strong> 则沿谱系平滑变轨。
            </div>
          </div>
          <button
            type="button"
            data-testid="start-booth-btn"
            className="pixel-btn approve"
            style={{ fontSize: 15, padding: '10px 20px' }}
            onClick={() =>
              onSubmit({
                inspectorAlias: alias.trim() || 'LISTENER-0451',
                birthEra,
                region,
                startingLineage,
              })
            }
          >
            ▣ 盖章核准 · 进入7号试听审查台 →
          </button>
        </div>
      </div>
    </div>
  );
}
