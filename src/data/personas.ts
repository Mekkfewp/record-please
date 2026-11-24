import { LINEAGES, PERSONAS } from './catalog';
import type { Card, LineageId, Persona, PixelPortraitSpec } from '../types/game';

export interface PersonaResult {
  persona: Persona;
  portrait: PixelPortraitSpec;
  /** One sentence that restates what the player collected; nothing else. */
  because: string;
}

function byRule(rule: Persona['rule'], lineage?: LineageId): Persona {
  const found = PERSONAS.find((p) => p.rule === rule && (lineage === undefined || p.lineage === lineage));
  if (!found) throw new Error(`catalog.json: no persona for rule "${rule}"`);
  return found;
}

export function resolvePersona(collected: Card[]): PersonaResult {
  const counts = new Map<LineageId, number>();
  for (const card of collected) {
    const lin = card.track.lineage;
    if (lin) counts.set(lin, (counts.get(lin) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = collected.length;

  let persona: Persona;
  let because: string;
  if (total === 0) {
    persona = byRule('empty');
    because = '这一趟你一张也没有收下。';
  } else if (ranked.length === 0) {
    persona = byRule('pop');
    because = `你收下的 ${total} 张都是流行金曲。`;
  } else if (ranked.length >= 3 && ranked[0][1] === 1) {
    persona = byRule('mixed');
    because = `你收下的 ${total} 张分散在 ${ranked.length} 条谱系里，没有哪条占多数。`;
  } else {
    const [lineage, count] = ranked[0];
    persona = byRule('lineage', lineage);
    because = `你收下的 ${total} 张里有 ${count} 张来自 ${LINEAGES[lineage].name}。`;
  }

  return {
    persona,
    because,
    portrait: { ...persona.portrait, seed: `persona-${persona.id}-${collected.map((c) => c.track.id).join('.')}` },
  };
}
