import { catalog } from '../data/catalog';
import { ROUNDS, type GameState } from '../engine/game';
import { loreCredit } from '../engine/playlistText';
import type { PreviewStatus } from '../engine/previewPlayer';
import { CoverArt } from './CoverArt';
import { AppleCredit, ListenLinks } from './ListenLinks';

const PREVIEW_LABEL: Record<PreviewStatus, string> = {
  idle: '▶ 试听 30 秒',
  loading: '载入中…',
  playing: '■ 停止',
  unavailable: '试听暂不可用',
};

export function Booth({
  state,
  previewStatus,
  onTogglePreview,
  onCollect,
  onSkip,
  onNext,
}: {
  state: GameState;
  previewStatus: PreviewStatus;
  onTogglePreview: () => void;
  onCollect: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  if (!state.cardId) return null;
  const card = catalog.card(state.cardId);
  const { track, artist, album } = card;
  const kept = state.step === 'kept';
  const loreId = kept ? state.kept[state.kept.length - 1]?.loreId : null;
  const lore = loreId ? catalog.loreItem(loreId) : null;

  return (
    <main className="sheet booth" key={track.id} data-testid="booth">
      <div className="booth-head">
        <p className="reason" data-testid="card-reason">
          {state.reason}
        </p>
        {kept && (
          <span className="ink-stamp" data-testid="card-ink-stamp">
            已收下
          </span>
        )}
      </div>

      <div className="record">
        <CoverArt card={card} size="large" />
        <div className="record-text">
          <h1 data-testid="card-title">〈{track.title}〉</h1>
          <p data-testid="card-artist">
            {artist.name} · {track.year}
          </p>
          <p className="tags">
            <span>{track.genre}</span>
            {track.lineage && <span>{catalog.lineage(track.lineage).nameZh}</span>}
          </p>
          <button
            type="button"
            className="btn"
            data-testid="preview-btn"
            data-status={previewStatus}
            onClick={onTogglePreview}
          >
            {PREVIEW_LABEL[previewStatus]}
          </button>
          <ListenLinks card={card} />
        </div>
      </div>

      <div className="actions">
        {kept ? (
          <button type="button" className="btn primary wide" data-testid="next-record-btn" onClick={onNext}>
            {state.round >= ROUNDS ? '看歌单' : '下一张'}
          </button>
        ) : (
          <>
            <button type="button" className="btn stamp-skip" data-testid="stamp-pass-btn" onClick={onSkip}>
              跳过
            </button>
            <button type="button" className="btn stamp-keep" data-testid="stamp-collect-btn" onClick={onCollect}>
              收下
            </button>
          </>
        )}
      </div>

      {kept && (
        <dl className="details" data-testid="kept-details">
          <dt>音乐家</dt>
          <dd data-testid="unlocked-artist">
            {artist.name}（{catalog.countryLabel(artist.country)}）
          </dd>
          <dt>专辑</dt>
          <dd data-testid="unlocked-album">
            《{album.title}》（{album.year}）
          </dd>
          {lore && (
            <>
              <dt>延伸阅读</dt>
              <dd data-testid="card-lore">
                {loreCredit(lore)}。{lore.line}
              </dd>
            </>
          )}
        </dl>
      )}

      <AppleCredit />
    </main>
  );
}
