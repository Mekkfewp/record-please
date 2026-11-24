import appleMusicBadge from '../assets/listen-on-apple-music-zh-cn.svg';
import { appleMusicLink, currentTimeZone } from '../engine/appleLink';
import type { Card } from '../types/game';

/**
 * Where to hear the whole track. Apple's badge comes first and goes straight to the song's
 * own page, as Apple's terms for previews and artwork require.
 */
export function ListenLinks({ card, compact = false }: { card: Card; compact?: boolean }) {
  const { apple, links } = card.track;
  const appleLink = apple ? appleMusicLink(apple, currentTimeZone()) : null;
  return (
    <div className={`listen-links ${compact ? 'compact' : ''}`} data-testid="listen-links">
      {appleLink && (
        <a
          className="apple-badge-link"
          data-testid="apple-music-link"
          href={appleLink.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={appleMusicBadge} alt="在 Apple Music 上收听" />
        </a>
      )}
      {appleLink && !appleLink.reachable && (
        <span className="apple-region-note" data-testid="apple-region-note">
          中国大陆区未上架
        </span>
      )}
      <a data-testid="netease-link" href={links.netease} target="_blank" rel="noopener noreferrer">
        网易云音乐搜索
      </a>
      <a data-testid="qq-link" href={links.qq} target="_blank" rel="noopener noreferrer">
        QQ音乐搜索
      </a>
    </div>
  );
}

/** Credit lines Apple asks for wherever its previews, artwork and marks are shown. */
export function AppleCredit() {
  return (
    <p className="apple-credit" data-testid="apple-credit">
      试听片段与封面由 iTunes 提供（provided courtesy of iTunes）。Apple 与 Apple Music 是 Apple Inc.
      在美国及其他国家和地区注册的商标。
    </p>
  );
}
