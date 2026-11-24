import { useEffect, useRef, useState } from 'react';
import {
  drawBoothWindow,
  drawLoreCover,
  drawMusicianPortrait,
} from '../engine/pixelArt';
import { LINEAGE_STYLE } from '../data/meta';
import type {
  LineageId,
  LoreItem,
  PixelPortraitSpec,
} from '../types/game';

export function PortraitCanvas({
  spec,
  size = 112,
  className = '',
}: {
  spec: PixelPortraitSpec;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      drawMusicianPortrait(ref.current, spec);
    }
  }, [spec]);

  return (
    <canvas
      ref={ref}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated',
      }}
      className={`pixel-canvas ${className}`}
    />
  );
}

export function LoreCoverCanvas({
  lore,
  width = 104,
  height = 128,
}: {
  lore: LoreItem;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      const style = LINEAGE_STYLE[lore.lineage];
      drawLoreCover(ref.current, {
        seed: lore.id,
        isFilm: lore.kind !== 'book',
        accentColor: style.inkColor,
        secondaryColor: style.badgeColor,
      });
    }
  }, [lore]);

  return (
    <canvas
      ref={ref}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        imageRendering: 'pixelated',
      }}
      className="pixel-canvas"
    />
  );
}

export function BoothWindowCanvas({
  lineage,
  isPlaying,
  collectedCount,
}: {
  lineage: LineageId;
  isPlaying: boolean;
  collectedCount: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 180);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (ref.current) {
      drawBoothWindow(ref.current, lineage, isPlaying, tick, collectedCount);
    }
  }, [lineage, isPlaying, tick, collectedCount]);

  return (
    <canvas
      ref={ref}
      style={{
        width: '100%',
        maxWidth: '520px',
        height: 'auto',
        aspectRatio: '220 / 56',
        imageRendering: 'pixelated',
      }}
      className="pixel-canvas booth-window-canvas"
    />
  );
}
