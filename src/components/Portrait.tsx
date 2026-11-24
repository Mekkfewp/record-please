import { useEffect, useRef } from 'react';
import { drawMusicianPortrait } from '../engine/pixelArt';
import type { PixelPortraitSpec } from '../types/game';

/** The player's persona portrait. No real musician is ever drawn. */
export function Portrait({ spec }: { spec: PixelPortraitSpec }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (ref.current) drawMusicianPortrait(ref.current, spec);
  }, [spec]);
  return <canvas ref={ref} className="portrait" data-testid="persona-portrait" />;
}
