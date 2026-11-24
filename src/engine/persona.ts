import type { Card, LineageId, Persona, PixelPortraitSpec } from '../types/game';
import type { Catalog } from './catalogIndex';

export interface PersonaResult {
  persona: Persona;
  portrait: PixelPortraitSpec;
  /** One sentence that restates what the player kept; nothing else. */
  because: string;
}

/**
 * The persona is read straight off the kept cards:
 *  - nothing kept: the "empty" persona;
 *  - more pop cards than cards of any one lineage: the "pop" persona;
 *  - three or more lineages with one card each and none ahead: the "mixed" persona;
 *  - otherwise the lineage with the most kept cards; on a tie, the one kept first.
 */
export function resolvePersona(catalog: Catalog, kept: Card[]): PersonaResult {
  const byRule = (rule: Persona['rule'], lineage?: LineageId): Persona => {
    const found = catalog.personas.find((p) => p.rule === rule && (lineage === undefined || p.lineage === lineage));
    if (!found) throw new Error(`catalog.json: no persona for rule "${rule}"`);
    return found;
  };

  const counts = new Map<LineageId, number>();
  let pop = 0;
  for (const card of kept) {
    const lineage = card.track.lineage;
    if (lineage) counts.set(lineage, (counts.get(lineage) ?? 0) + 1);
    else pop++;
  }
  // Map keeps insertion order and the sort is stable, so ties stay in the order first kept.
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = kept.length;
  const top = ranked[0]?.[1] ?? 0;
  const tied = ranked.filter(([, n]) => n === top);
  const zh = (id: LineageId) => `「${catalog.lineage(id).nameZh}」`;

  let persona: Persona;
  let because: string;
  if (total === 0) {
    persona = byRule('empty');
    because = '这一趟你一张也没有收下。';
  } else if (pop > top) {
    persona = byRule('pop');
    because = pop === total ? `你收下的 ${total} 张都是流行曲。` : `你收下的 ${total} 张里有 ${pop} 张是流行曲，比哪条线都多。`;
  } else if (top === 1 && tied.length >= 3) {
    persona = byRule('mixed');
    because = `你收下的 ${total} 张里，${tied.length} 条线各有一张，没有哪条领先。`;
  } else {
    const [lineage, count] = ranked[0];
    persona = byRule('lineage', lineage);
    because =
      tied.length > 1
        ? `你收下的 ${total} 张里，${tied.map(([id]) => zh(id)).join('和')}各有 ${count} 张，先收下的是${zh(lineage)}。`
        : `你收下的 ${total} 张里有 ${count} 张来自${zh(lineage)}。`;
  }

  return {
    persona,
    because,
    portrait: { ...persona.portrait, seed: `persona-${persona.id}-${kept.map((c) => c.track.id).join('.')}` },
  };
}
