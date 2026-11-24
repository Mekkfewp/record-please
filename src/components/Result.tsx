import { useState } from 'react';
import { catalog } from '../data/catalog';
import { savePlaylistImage } from '../engine/exportImage';
import type { GameState } from '../engine/game';
import { resolvePersona } from '../engine/persona';
import { loreCredit, playlistMarkdown, type PlaylistSummary } from '../engine/playlistText';
import { CoverArt } from './CoverArt';
import { AppleCredit, ListenLinks } from './ListenLinks';
import { Portrait } from './Portrait';

export function Result({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  if (!state.profile) return null;

  const cards = state.kept.map((k) => catalog.card(k.cardId));
  const lore = state.kept.flatMap((k) => (k.loreId ? [catalog.loreItem(k.loreId)] : []));
  const { persona, portrait, because } = resolvePersona(catalog, cards);
  const summary: PlaylistSummary = {
    profileLine: `${catalog.era(state.profile.era).label} · ${catalog.region(state.profile.region).label}`,
    personaName: persona.name,
    because,
    cards,
    lore,
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(playlistMarkdown(summary));
      setCopied('done');
    } catch {
      setCopied('failed');
    }
    window.setTimeout(() => setCopied('idle'), 2000);
  };

  return (
    <main className="sheet result" data-testid="passport-result-screen">
      <header className="persona">
        <Portrait spec={portrait} />
        <div>
          <p className="muted">{summary.profileLine}</p>
          <h1 data-testid="persona-title">{persona.name}</h1>
          <p data-testid="persona-because">{because}</p>
        </div>
      </header>

      {cards.length > 0 && (
        <section>
          <h2>歌单（{cards.length} 首）</h2>
          <ol className="playlist">
            {cards.map((card) => (
              <li key={card.track.id} data-testid="playlist-row">
                <CoverArt card={card} size="small" grid={24} />
                <div>
                  <p>
                    〈{card.track.title}〉 {card.artist.name}（{card.track.year}）
                  </p>
                  <ListenLinks card={card} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {lore.length > 0 && (
        <section>
          <h2>延伸阅读</h2>
          <ul className="reading" data-testid="lore-summary">
            {lore.map((item) => (
              <li key={item.id} data-testid="lore-row">
                {loreCredit(item)}。{item.line}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="actions">
        {cards.length > 0 && (
          <>
            <button type="button" className="btn" data-testid="copy-playlist-btn" onClick={copy}>
              {copied === 'done' ? '已复制' : copied === 'failed' ? '复制失败' : '复制歌单'}
            </button>
            <button
              type="button"
              className="btn"
              data-testid="download-png-btn"
              onClick={() => void savePlaylistImage(summary, portrait)}
            >
              保存图片
            </button>
          </>
        )}
        <button type="button" className="btn primary" data-testid="restart-btn" onClick={onRestart}>
          再来一次
        </button>
      </div>

      {cards.length > 0 && <AppleCredit />}
    </main>
  );
}
