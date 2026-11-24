import type {
  AlbumCoverArchetype,
  GrooveConfig,
  LineageId,
  PixelCoverSpec,
} from '../types/game';

// Decorative stand-ins until every card carries its real cover art and preview.
// They are derived from the lineage only and say nothing about the recording itself.
const LOOK: Record<LineageId, { archetype: AlbumCoverArchetype; colors: [string, string, string]; bpm: number; mode: GrooveConfig['mode'] }> = {
  jazz: { archetype: 'blue-note', colors: ['#1b4965', '#102536', '#e0a44c'], bpm: 112, mode: 'dorian' },
  'punk-postpunk': { archetype: 'joy-waveform', colors: ['#16181d', '#343a42', '#e04848'], bpm: 134, mode: 'minor' },
  'shoegaze-indie': { archetype: 'shoegaze-wash', colors: ['#5c224c', '#9e3b76', '#ff94bd'], bpm: 106, mode: 'major7' },
  'electronic-idm': { archetype: 'electronic-grid', colors: ['#12262e', '#264e59', '#4ce0c2'], bpm: 122, mode: 'dorian' },
  hiphop: { archetype: 'hiphop-crate', colors: ['#3d291d', '#6e472b', '#f2b24c'], bpm: 92, mode: 'minor' },
  'artpop-citypop': { archetype: 'city-neon', colors: ['#241f4d', '#6e2e63', '#ffd166'], bpm: 104, mode: 'major7' },
  'folk-psych': { archetype: 'psych-mandala', colors: ['#26452b', '#5e7338', '#e6c455'], bpm: 96, mode: 'mixolydian' },
  'heavy-industrial': { archetype: 'industrial-brutalist', colors: ['#241818', '#52322c', '#e05838'], bpm: 138, mode: 'phrygian' },
};

const POP_LOOK = { archetype: 'minimal-bauhaus' as AlbumCoverArchetype, colors: ['#3d3a33', '#6b6455', '#d4a247'] as [string, string, string], bpm: 116, mode: 'major7' as GrooveConfig['mode'] };

export function placeholderCover(seed: string, lineage: LineageId | null): PixelCoverSpec {
  const look = lineage ? LOOK[lineage] : POP_LOOK;
  return {
    seed,
    archetype: look.archetype,
    primaryColor: look.colors[0],
    secondaryColor: look.colors[1],
    accentColor: look.colors[2],
  };
}

export function placeholderGroove(lineage: LineageId | null): GrooveConfig {
  const look = lineage ? LOOK[lineage] : POP_LOOK;
  return { bpm: look.bpm, rootMidi: 45, mode: look.mode, style: lineage ?? 'artpop-citypop' };
}
