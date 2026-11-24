import { useState } from 'react';
import { catalog } from '../data/catalog';
import type { Profile } from '../engine/game';
import type { BirthEra, RegionId } from '../types/game';

export function StartScreen({ onStart }: { onStart: (profile: Profile) => void }) {
  const [era, setEra] = useState<BirthEra | null>(null);
  const [region, setRegion] = useState<RegionId | null>(null);

  return (
    <main className="sheet start" data-testid="start-screen">
      <h1>请出示唱片</h1>

      <fieldset className="choice">
        <legend>出生年代</legend>
        {catalog.eras.map((e) => (
          <button
            key={e.id}
            type="button"
            className="btn"
            aria-pressed={era === e.id}
            data-testid={`era-${e.id}`}
            onClick={() => setEra(e.id)}
          >
            {e.label}
          </button>
        ))}
      </fieldset>

      <fieldset className="choice">
        <legend>国家或地区</legend>
        {catalog.regions.map((r) => (
          <button
            key={r.id}
            type="button"
            className="btn"
            aria-pressed={region === r.id}
            data-testid={`region-${r.id}`}
            onClick={() => setRegion(r.id)}
          >
            {r.label}
          </button>
        ))}
      </fieldset>

      <button
        type="button"
        className="btn primary wide"
        data-testid="start-booth-btn"
        disabled={!era || !region}
        onClick={() => era && region && onStart({ era, region })}
      >
        开始
      </button>
    </main>
  );
}
