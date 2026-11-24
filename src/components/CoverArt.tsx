import { useState } from 'react';
import type { Card } from '../types/game';

/**
 * The record's real cover, fetched at a tiny size from Apple's image server and scaled up
 * without smoothing so it reads as pixel art. Shows an empty sleeve when there is no cover.
 */
export function CoverArt({
  card,
  size,
  grid = 48,
}: {
  card: Card;
  size: number;
  /** Width in source pixels; the fewer, the chunkier. */
  grid?: number;
}) {
  const artworkUrl = card.track.apple?.artworkUrl;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const dimensions = { width: size, height: size };

  if (!artworkUrl || failedUrl === artworkUrl) {
    return (
      <div className="cover-art cover-art-empty" style={dimensions} data-testid="cover-missing">
        无封面
      </div>
    );
  }

  return (
    <img
      className="cover-art"
      data-testid="cover-art"
      style={dimensions}
      src={artworkUrl.replace(/\d+x\d+bb(\.\w+)$/, `${grid}x${grid}bb$1`)}
      alt={`《${card.album.title}》封面`}
      loading="lazy"
      onError={() => setFailedUrl(artworkUrl)}
    />
  );
}
