import type { LineageId } from '../types/game';

/** Presentation only: colours and short labels per lineage. Facts live in catalog.json. */
export interface LineageStyle {
  shortCN: string;
  badgeColor: string;
  inkColor: string;
  steps: [string, string, string];
}

export const LINEAGE_STYLE: Record<LineageId, LineageStyle> = {
  jazz: {
    shortCN: '爵士 Jazz', badgeColor: '#355c7d', inkColor: '#d99b38',
    steps: ['Cool Jazz · Hard Bop', 'Spiritual Jazz · Post-Bop', 'Nu Jazz'],
  },
  'punk-postpunk': {
    shortCN: '后朋 Post-Punk', badgeColor: '#7a2e2e', inkColor: '#cf4848',
    steps: ['Proto-Punk · Punk Rock', 'Post-Punk', 'Coldwave · Noise Rock'],
  },
  'shoegaze-indie': {
    shortCN: '自赏 Shoegaze', badgeColor: '#6c3b5e', inkColor: '#d46a9e',
    steps: ['Jangle Pop · Indie Rock', 'Shoegaze · Dream Pop', 'Midwest Emo · Post-Rock'],
  },
  'electronic-idm': {
    shortCN: '电子 Electronic', badgeColor: '#245953', inkColor: '#45b09c',
    steps: ['Krautrock · Synthpop', 'House · Techno', 'IDM · UK Bass'],
  },
  hiphop: {
    shortCN: '嘻哈 Hip-Hop', badgeColor: '#6e4726', inkColor: '#d98c38',
    steps: ['Old School · Boom Bap', 'Jazz Rap · Instrumental Hip Hop', 'Experimental Hip Hop'],
  },
  'artpop-citypop': {
    shortCN: '都会 Art/City Pop', badgeColor: '#4e3c6e', inkColor: '#b57edc',
    steps: ['Art Rock · City Pop', 'Shibuya-kei · Baroque Pop', 'Art Pop'],
  },
  'folk-psych': {
    shortCN: '民谣迷幻 Folk/Psych', badgeColor: '#4c5c32', inkColor: '#9eb84c',
    steps: ['Folk Rock · Contemporary Folk', 'Tropicália · Indie Folk', 'Afrobeat · Chamber Folk'],
  },
  'heavy-industrial': {
    shortCN: '重型工业 Heavy', badgeColor: '#522c29', inkColor: '#d95b38',
    steps: ['Heavy Metal · Doom Metal', 'Industrial · Post-Metal', 'Blackgaze'],
  },
};

export const POP_STYLE = { shortCN: '流行 Pop', badgeColor: '#5a5546', inkColor: '#d4a247' };
