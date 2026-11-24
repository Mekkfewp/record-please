import type {
  BirthEra,
  LineageId,
  PixelPortraitSpec,
  RegionId,
} from '../types/game';

export interface PersonaArchetype {
  id: string;
  titleCN: string;
  titleEN: string;
  lineage?: LineageId;
  bio: string;
  portraitBase: Omit<PixelPortraitSpec, 'seed'>;
}

export const PERSONA_ARCHETYPES: Record<string, PersonaArchetype> = {
  jazz: {
    id: 'midnight-modalist',
    titleCN: '午夜蓝音萨克斯手',
    titleEN: 'The Midnight Modalist',
    lineage: 'jazz',
    bio: '你偏爱即兴留白、烟雾酒馆里的调式对话与南伦敦夜色碎拍，总能在复杂和弦背后听见自由呼吸。',
    portraitBase: { hairStyle: 'jazz-beret', glasses: 'shades', outfit: 'jazz-suit', prop: 'sax', accentColor: '#d99b38', bgStyle: 'smoky' },
  },
  'punk-postpunk': {
    id: 'post-industrial-bassist',
    titleCN: '后工业暗房贝斯手',
    titleEN: 'The Post-Industrial Bassist',
    lineage: 'punk-postpunk',
    bio: '你钟情高把位冷冽贝斯线、空旷混响与不妥协的街头白描，在霓虹熄灭后的城市走廊保持清醒锋芒。',
    portraitBase: { hairStyle: 'spiky-punk', glasses: 'shades', outfit: 'leather-jacket', prop: 'guitar', accentColor: '#cf4848', bgStyle: 'booth' },
  },
  'shoegaze-indie': {
    id: 'pedalboard-shoegazer',
    titleCN: '混响踏板筑梦师',
    titleEN: 'The Pedalboard Shoegazer',
    lineage: 'shoegaze-indie',
    bio: '你迷恋摇把滑音织成的丝绸音墙、奇数拍清音吉他与二十分钟无词长曲，把最汹涌的情绪藏进混响深处。',
    portraitBase: { hairStyle: 'shoegaze-bangs', glasses: 'none', outfit: 'flannel-cardigan', prop: 'guitar', accentColor: '#d46a9e', bgStyle: 'smoky' },
  },
  'electronic-idm': {
    id: 'modular-alchemist',
    titleCN: '凌晨四点模组炼金师',
    titleEN: 'The 4AM Modular Alchemist',
    lineage: 'electronic-idm',
    bio: '你游走于德国无限速公路节拍、底特律机器灵魂与雨夜低频幽灵之间，能在模拟电流里听见最温柔的晨雾。',
    portraitBase: { hairStyle: 'hoodie-producer', glasses: 'visor', outfit: 'turtleneck', prop: 'synth-patch', accentColor: '#45b09c', bgStyle: 'neon' },
  },
  hiphop: {
    id: 'crate-beatmaker',
    titleCN: '地下唱片箱挖掘者',
    titleEN: 'The Crate-Digging Beatmaker',
    lineage: 'hiphop',
    bio: '你能从一张布满灰尘的七十年代灵魂黑胶里听出微醺错拍与街头电影长镜头，手指自带 MPC 摇摆律动。',
    portraitBase: { hairStyle: 'hiphop-cap', glasses: 'thick-rim', outfit: 'tracksuit', prop: 'headphones', accentColor: '#d98c38', bgStyle: 'warm-paper' },
  },
  'artpop-citypop': {
    id: 'neon-architect',
    titleCN: '霓虹录音室建筑师',
    titleEN: 'The Neon Studio Architect',
    lineage: 'artpop-citypop',
    bio: '你兼收东京海岸夜风、巴洛克室内弦乐与先锋艺术剧场，对编曲声场有着近乎偏执的浪漫审美。',
    portraitBase: { hairStyle: 'city-bob', glasses: 'round-specs', outfit: 'haori-shirt', prop: 'mic', accentColor: '#b57edc', bgStyle: 'neon' },
  },
  'folk-psych': {
    id: 'borderless-troubadour',
    titleCN: '赤道与黄河漫游吟游者',
    titleEN: 'The Borderless Troubadour',
    lineage: 'folk-psych',
    bio: '你手持特殊调弦木吉他与旧磁带，串联起静夜英伦、巴西热带迷幻、拉各斯铜管与华北平原的时代呼吸。',
    portraitBase: { hairStyle: 'long-psych', glasses: 'round-specs', outfit: 'workwear-denim', prop: 'guitar', accentColor: '#9eb84c', bgStyle: 'warm-paper' },
  },
  'heavy-industrial': {
    id: 'sunlit-doomsmith',
    titleCN: '粉红音墙锻铁匠',
    titleEN: 'The Sunlit Doomsmith',
    lineage: 'heavy-industrial',
    bio: '你不畏惧最沉重的降调轰鸣与工业脉冲，因为你知道在暴风雪音墙的正中央藏着最耀眼的大调微光。',
    portraitBase: { hairStyle: 'retro-mullet', glasses: 'shades', outfit: 'leather-jacket', prop: 'guitar', accentColor: '#d95b38', bgStyle: 'crimson' },
  },
  'shibuya-curator': {
    id: 'shibuya-curator',
    titleCN: '涩谷唱片行全能策展人',
    titleEN: 'The Shibuya Record Clerk',
    bio: '你跨越四条以上音乐谱系毫无门户之见，精通跨地域流派嫁接与元拼贴美学，本身就是一座行走的独立唱片店。',
    portraitBase: { hairStyle: 'new-wave-crop', glasses: 'thick-rim', outfit: 'haori-shirt', prop: 'headphones', accentColor: '#e0a44c', bgStyle: 'neon' },
  },
  'rym-archivist': {
    id: 'rym-archivist',
    titleCN: 'RYM 深夜档案管理员',
    titleEN: 'The RYM Deep-Cut Archivist',
    bio: '你不仅收集高分神作，更执着于深潜进阶分支与音乐史口述文献，善于在冷门B面单曲中拼出时代暗线。',
    portraitBase: { hairStyle: 'pompadour', glasses: 'thick-rim', outfit: 'turtleneck', prop: 'headphones', accentColor: '#5ea89c', bgStyle: 'booth' },
  },
};

export function resolvePlayerPersona(params: {
  era: BirthEra;
  region: RegionId;
  lineageCounts: Record<LineageId, number>;
  deepCutCount: number;
  loreCount: number;
}): { archetype: PersonaArchetype; portrait: PixelPortraitSpec } {
  const entries = Object.entries(params.lineageCounts) as Array<[LineageId, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  const distinctLineages = entries.filter(([, v]) => v > 0).length;
  const topLineage = entries[0]?.[0] ?? 'shoegaze-indie';

  let chosen = PERSONA_ARCHETYPES[topLineage];
  if (params.deepCutCount >= 3 && params.loreCount >= 2) {
    chosen = PERSONA_ARCHETYPES['rym-archivist'];
  } else if (distinctLineages >= 4) {
    chosen = PERSONA_ARCHETYPES['shibuya-curator'];
  }

  const regionSkinMap: Record<RegionId, number> = {
    'cn-mainland': 1, 'hk-tw': 1, japan: 0, usa: 2, uk: 0, europe: 1, latam: 2,
  };

  return {
    archetype: chosen,
    portrait: {
      ...chosen.portraitBase,
      skinTone: regionSkinMap[params.region],
      seed: `persona-${params.era}-${params.region}-${chosen.id}-${distinctLineages}`,
    },
  };
}
