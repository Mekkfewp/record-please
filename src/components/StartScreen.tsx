import { useState } from 'react';
import { catalog } from '../data/catalog';
import type { Profile } from '../engine/game';
import type { EraId, RegionId } from '../types/game';

export function StartScreen({ onStart }: { onStart: (profile: Profile) => void }) {
  const [era, setEra] = useState<EraId | null>(null);
  const [region, setRegion] = useState<RegionId | null>(null);

  // A decade and region the catalog could not fill cannot be chosen together.
  const pickEra = (id: EraId) => {
    setEra(id);
    if (region && !catalog.hasCell(id, region)) setRegion(null);
  };

  return (
    <main className="sheet start" data-testid="start-screen">
      <h1>请出示唱片</h1>

      <fieldset className="choice eras">
        <legend>从哪个年代听起</legend>
        {catalog.eras.map((e) => (
          <button
            key={e.id}
            type="button"
            className="btn era"
            aria-pressed={era === e.id}
            data-testid={`era-${e.id}`}
            onClick={() => pickEra(e.id)}
          >
            <span className="era-label">{e.label}</span>
            <span className="era-caption">{e.caption}</span>
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
            disabled={era !== null && !catalog.hasCell(era, r.id)}
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
