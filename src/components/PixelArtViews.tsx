import { useEffect, useRef, useState } from 'react';
import {
  drawAlbumCover,
  drawBoothWindow,
  drawLoreCover,
  drawMusicianPortrait,
  drawSingle7Inch,
} from '../engine/pixelArt';
import type {
  CulturalLoreItem,
  LineageId,
  PixelCoverSpec,
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

export function AlbumCoverCanvas({
  spec,
  size = 128,
  className = '',
}: {
  spec: PixelCoverSpec;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      drawAlbumCover(ref.current, spec);
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

export function Single7InchCanvas({
  spec,
  isPlaying = false,
  width = 144,
  height = 120,
}: {
  spec: PixelCoverSpec;
  isPlaying?: boolean;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [angle, setAngle] = useState(0.5);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setAngle((a) => a + 0.35);
    }, 90);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  useEffect(() => {
    if (ref.current) {
      drawSingle7Inch(ref.current, spec, angle);
    }
  }, [spec, angle]);

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

export function LoreCoverCanvas({
  lore,
  width = 104,
  height = 128,
}: {
  lore: CulturalLoreItem;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      drawLoreCover(ref.current, lore);
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
