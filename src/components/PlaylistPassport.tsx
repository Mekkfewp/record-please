import { useState } from 'react';
import { ALBUMS_BY_ID, ERAS, LINEAGES, LINEAGE_LIST, REGIONS } from '../data';
import { resolvePlayerPersona } from '../data/personas';
import { downloadPassportPng } from '../engine/passportExporter';
import { AlbumCoverCanvas, LoreCoverCanvas, PortraitCanvas } from './PixelArtViews';
import type {
  AlbumRecord,
  CulturalLoreItem,
  LineageId,
  PlayerProfile,
  SingleTrack,
} from '../types/game';

export function PlaylistPassport({
  profile,
  collectedSingles,
  bookmarkedLore,
  lineageCounts,
  onKeepDigging,
  onRestart,
}: {
  profile: PlayerProfile;
  collectedSingles: SingleTrack[];
  bookmarkedLore: CulturalLoreItem[];
  lineageCounts: Record<LineageId, number>;
  onKeepDigging: () => void;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const eraMeta = ERAS.find((e) => e.id === profile.birthEra) ?? ERAS[2];
  const regMeta = REGIONS.find((r) => r.id === profile.region) ?? REGIONS[0];
  const deepCutCount = collectedSingles.filter((s) => s.tier >= 2).length;

  const { archetype, portrait } = resolvePlayerPersona({
    era: profile.birthEra,
    region: profile.region,
    lineageCounts,
    deepCutCount,
    loreCount: bookmarkedLore.length,
  });

  const albums: AlbumRecord[] = [];
  const seenAlb = new Set<string>();
  for (const s of collectedSingles) {
    const alb = ALBUMS_BY_ID.get(s.albumId);
    if (alb && !seenAlb.has(alb.id)) {
      seenAlb.add(alb.id);
      albums.push(alb);
    }
  }

  const maxScore = Math.max(1, ...Object.values(lineageCounts));
  const sortedLineages = [...LINEAGE_LIST]
    .map((l) => ({
      meta: l,
      count: lineageCounts[l.id] ?? 0,
      ratio: (lineageCounts[l.id] ?? 0) / maxScore,
    }))
    .sort((a, b) => b.count - a.count);

  const serialNo = `RP-${profile.birthEra.slice(0, 2)}${regMeta.stampCode.replace('-', '')}-${String(
    collectedSingles.length * 17 + 108
  )}`;

  const handleCopyMarkdown = async () => {
    const lines = [
      `# 🪪 《请出示唱片 Record, Please》听觉身份许可证`,
      `- **持证人**：${profile.inspectorAlias} | **年代**：${eraMeta.labelCN} | **地区**：${regMeta.labelCN}`,
      `- **像素音乐家人格**：**${archetype.titleCN} (${archetype.titleEN})**`,
      `> ${archetype.bio}`,
      ``,
      `## 🎵 专属黑胶单曲歌单 (${collectedSingles.length} 首)`,
      ...collectedSingles.map(
        (t, i) => `${i + 1}. **${t.title}** — ${t.artistName} (${t.year}) [${t.subgenre} · RYM ${t.rymRating}]`
      ),
      ``,
      `## 💿 推荐深潜专辑 (${albums.length} 张)`,
      ...albums.map((a) => `- **《${a.title}》** — ${a.artistName} (${a.year})：${a.whyItMatters}`),
      ...(bookmarkedLore.length > 0
        ? [
            ``,
            `## 📚 延伸音乐书籍与纪录片 (${bookmarkedLore.length} 部)`,
            ...bookmarkedLore.map((l) => `- **${l.title}** (${l.creator}, ${l.year})`),
          ]
        : []),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(true);
    }
  };

  const handleDownloadPng = () => {
    downloadPassportPng({
      serialNo,
      inspectorAlias: profile.inspectorAlias,
      personaTitleCN: archetype.titleCN,
      personaTitleEN: archetype.titleEN,
      eraLabel: eraMeta.labelCN,
      regionLabel: regMeta.labelCN,
      bio: archetype.bio,
      portrait,
      topLineages: sortedLineages.map((x) => ({
        label: x.meta.shortCN,
        score: x.count > 0 ? Math.max(0.2, x.ratio) : 0.12,
        color: x.meta.badgeColor,
      })),
      tracks: collectedSingles,
      albums,
      loreItems: bookmarkedLore,
    });
  };

  return (
    <div className="passport-stage" data-testid="passport-result-screen">
      <div className="paper-sheet" style={{ padding: '22px 24px', background: 'var(--paper-cream)' }}>
        <div className="permit-header">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5c4e3a' }}>
              SONIC IDENTITY PASSPORT & CURATED VINYL CRATE · NO. {serialNo}
            </div>
            <h1 style={{ margin: '4px 0 0', fontSize: 24 }}>
              听觉身份许可证 & 专属黑胶歌单
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" data-testid="copy-playlist-btn" className="pixel-btn approve" onClick={handleCopyMarkdown}>
              {copied ? '✓ 已复制 Markdown 歌单！' : '📋 一键复制专属歌单'}
            </button>
            <button type="button" data-testid="download-png-btn" className="pixel-btn brass" onClick={handleDownloadPng}>
              💾 下载像素身份卡 PNG
            </button>
            <button type="button" className="pixel-btn" onClick={onKeepDigging}>
              ← 返回审查台继续淘碟
            </button>
            <button type="button" className="pixel-btn crimson" onClick={onRestart}>
              ↻ 新建档案
            </button>
          </div>
        </div>

        {/* PERSONA HEADER */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: '#dfd3b8', padding: 14, border: '2px solid #191613' }}>
            <div style={{ textAlign: 'center' }}>
              <PortraitCanvas spec={portrait} size={124} />
              <span className="ink-stamp-mark approve" style={{ fontSize: 11, marginTop: 8 }}>
                VERIFIED PERSONA
              </span>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#5c4e3a', fontWeight: 700 }}>
                专属像素音乐家人格 · ARCHETYPE
              </div>
              <div data-testid="persona-title" style={{ fontSize: 21, fontWeight: 900, marginTop: 2 }}>
                {archetype.titleCN}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#473e30' }}>{archetype.titleEN}</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>
                持证人：<strong>{profile.inspectorAlias}</strong> · {eraMeta.labelCN} · {regMeta.labelCN}
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>{archetype.bio}</p>
            </div>
          </div>

          <div style={{ background: '#dfd3b8', padding: 14, border: '2px solid #191613' }}>
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 8 }}>
              ■ RYM 听觉基因光谱 (SONIC DNA SPECTRUM)
            </div>
            {sortedLineages.slice(0, 6).map(({ meta, count, ratio }) => (
              <div key={meta.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 12 }}>
                <span style={{ width: 125, fontWeight: 700 }}>{meta.shortCN}</span>
                <div style={{ flex: 1, height: 12, background: '#c7b99b', border: '1px solid #4a4033' }}>
                  <div
                    style={{
                      width: `${count > 0 ? Math.max(15, Math.round(ratio * 100)) : 4}%`,
                      height: '100%',
                      background: meta.badgeColor,
                    }}
                  />
                </div>
                <span style={{ width: 34, textAlign: 'right', fontWeight: 700 }}>{count}张</span>
              </div>
            ))}
          </div>
        </div>

        {/* GENERATED PLAYLIST & ALBUMS */}
        <div className="progressive-grid">
          <div style={{ background: '#dfd3b8', padding: 14, border: '2px solid #191613' }}>
            <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 10 }}>
              🎵 专属黑胶单曲歌单 ({collectedSingles.length} 首已收录)
            </div>
            {collectedSingles.map((tr, idx) => (
              <div
                key={tr.id}
                style={{
                  padding: '7px 8px',
                  borderBottom: '1px dashed #7a6c55',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <div>
                  <strong>{String(idx + 1).padStart(2, '0')}. 〈{tr.title}〉</strong> — {tr.artistName} ({tr.year})
                  <div style={{ fontSize: 11, color: '#4d4335' }}>
                    {LINEAGES[tr.lineage].shortCN} · {tr.subgenre}
                  </div>
                </div>
                <span style={{ fontWeight: 900, fontSize: 12, color: '#1e6b3a' }}>★ {tr.rymRating}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#dfd3b8', padding: 14, border: '2px solid #191613' }}>
            <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 10 }}>
              💿 必听黑胶专辑箱 ({albums.length} 张解锁 LP)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
              {albums.map((alb) => (
                <div key={alb.id} style={{ display: 'flex', gap: 10, background: '#ece3cc', padding: 8, border: '1px solid #5c4e3a' }}>
                  <AlbumCoverCanvas spec={alb.cover} size={58} />
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 900 }}>《{alb.title}》</div>
                    <div style={{ fontSize: 11, color: '#4d4335' }}>
                      {alb.artistName} · {alb.year}
                    </div>
                    <div style={{ fontSize: 11, color: '#1e6b3a', fontWeight: 700 }}>RYM {alb.rymScore}</div>
                  </div>
                </div>
              ))}
            </div>

            {bookmarkedLore.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 8 }}>
                  📚 收藏的音乐书籍与纪录片 ({bookmarkedLore.length} 部)
                </div>
                {bookmarkedLore.map((l) => (
                  <div key={l.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, background: '#e4d6b5', padding: 6, border: '1px solid #6e6049' }}>
                    <LoreCoverCanvas lore={l} width={38} height={46} />
                    <div style={{ fontSize: 12 }}>
                      <strong>{l.title}</strong> ({l.creator}, {l.year})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
