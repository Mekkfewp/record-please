import type { EraMeta, LineageId, LineageMeta, RegionMeta } from '../types/game';

export const ERAS: EraMeta[] = [
  {
    id: '1970s',
    labelCN: '1970s 出生（70后）',
    formativeWindow: '青春听歌窗口：1985–1996',
    mediaMemory: '磁带 · 广播电台 · MTV 黄金期 · 早期打口带',
    description: '从双卡录音机与电台夜话出发，亲历摇滚、合成器流行与另类浪潮破土。',
  },
  {
    id: '1980s',
    labelCN: '1980s 出生（80后）',
    formativeWindow: '青春听歌窗口：1995–2006',
    mediaMemory: '打口 CD/磁带 · Discman · 千禧独立厂牌 · MP3 初兴',
    description: '在音像店淘碟与塑料切口打口盘中开眼，见证英伦摇滚、嘻哈黄金期与独立音乐崛起。',
  },
  {
    id: '1990s',
    labelCN: '1990s 出生（90后）',
    formativeWindow: '青春听歌窗口：2005–2016',
    mediaMemory: 'iPod · 豆瓣 FM · 音乐博客 · 草莓/迷笛音乐节爆发',
    description: '伴随数字歌单与独立音乐节成长，在后摇、自赏、新爵士与当代说唱之间自由穿梭。',
  },
  {
    id: '2000s',
    labelCN: '2000s 出生（00后）',
    formativeWindow: '青春听歌窗口：2015–2025',
    mediaMemory: '流媒体迷宫 · Bandcamp · RYM 挖碟 · 复古黑胶回潮',
    description: '生于算法瀑布之中，却反向潜入 City Pop、后朋克冷浪与跨界卧室实验。',
  },
];

export const REGIONS: RegionMeta[] = [
  { id: 'cn-mainland', labelCN: '中国大陆', labelEN: 'Mainland China', stampCode: 'CN-BJ', sceneSummary: '从崔健、窦唯《黑梦》到打口世代、石家庄铜管与当代后朋克浪潮' },
  { id: 'hk-tw', labelCN: '港台地区', labelEN: 'HK & Taiwan', stampCode: 'HK-TP', sceneSummary: '从罗大佑、达明一派、王菲《浮躁》到陈绮贞、草东与落日飞车' },
  { id: 'japan', labelCN: '日本', labelEN: 'Japan', stampCode: 'JP-TYO', sceneSummary: '从山下达郎 City Pop、Fishmans 梦境长篇到 Nujabes、椎名林檎与青叶市子' },
  { id: 'usa', labelCN: '美国', labelEN: 'United States', stampCode: 'US-NYC', sceneSummary: '爵士、地下丝绒、黄金年代东岸嘻哈、音速青年与中西部数摇源流' },
  { id: 'uk', labelCN: '英国', labelEN: 'United Kingdom', stampCode: 'UK-LON', sceneSummary: '从曼彻斯特后朋克、Creation 自赏音墙到 Warp 智能电子与南伦敦低频' },
  { id: 'europe', labelCN: '欧洲大陆', labelEN: 'Continental Europe', stampCode: 'EU-BER', sceneSummary: '杜塞尔多夫发电站、科隆泡菜摇滚、法式电子滤镜与极北冰岛艺术流行' },
  { id: 'latam', labelCN: '拉丁美洲', labelEN: 'Latin America', stampCode: 'LA-BA', sceneSummary: '巴西热带主义 Tropicália、阿根廷新浪潮合成器与实验民谣奇境' },
];

export const LINEAGES: Record<LineageId, LineageMeta> = {
  jazz: {
    id: 'jazz', nameCN: '爵士与即兴谱系', nameEN: 'Jazz & Spiritual Improv', shortCN: '爵士 Jazz',
    badgeColor: '#355c7d', inkColor: '#d99b38',
    tagline: '从冷爵士调式留白、灵性萨克斯祈祷到南伦敦碎拍新爵士',
    nodes: [
      { tier: 1, nameCN: '冷爵士与硬波普', nameEN: 'Cool & Hard Bop', eraSpan: '1955–1964', summary: '调式解放和声束缚，小号与钢琴在烟雾酒馆对话' },
      { tier: 2, nameCN: '灵性爵士与融合', nameEN: 'Spiritual & Fusion', eraSpan: '1965–1975', summary: '四音动机化作宇宙祈祷，电钢琴与摇滚律动破界' },
      { tier: 3, nameCN: '当代俱乐部新爵士', nameEN: 'Nu-Jazz & Broken Beat', eraSpan: '2010–2025', summary: '伦敦地下海盗电台碎拍注入爵士即兴现场' },
    ],
    adjacent: ['hiphop', 'artpop-citypop', 'folk-psych'],
  },
  'punk-postpunk': {
    id: 'punk-postpunk', nameCN: '朋克与后朋克谱系', nameEN: 'Punk, Post-Punk & Coldwave', shortCN: '后朋 Post-Punk',
    badgeColor: '#7a2e2e', inkColor: '#cf4848',
    tagline: '从地下丝绒粗粝噪音、曼彻斯特空间混响到冷暗浪潮贝斯线',
    nodes: [
      { tier: 1, nameCN: '原始朋克与七七浪潮', nameEN: 'Proto & ’77 Punk', eraSpan: '1967–1979', summary: '三和弦与反叛白描剥除流行工业的虚饰滤镜' },
      { tier: 2, nameCN: '后朋克空间美学', nameEN: 'Post-Punk', eraSpan: '1978–1985', summary: '高把位旋律贝斯领奏，冷峻鼓机折射工业城市疏离' },
      { tier: 3, nameCN: '冷浪潮与无浪潮噪音', nameEN: 'Coldwave & Noise Rock', eraSpan: '1982–2024', summary: '暗潮合成器与微分音吉他构筑锋利现代主义音墙' },
    ],
    adjacent: ['shoegaze-indie', 'electronic-idm', 'heavy-industrial'],
  },
  'shoegaze-indie': {
    id: 'shoegaze-indie', nameCN: '独立、自赏与后摇谱系', nameEN: 'Indie, Shoegaze & Post-Rock', shortCN: '自赏 Shoegaze',
    badgeColor: '#6c3b5e', inkColor: '#d46a9e',
    tagline: '从清脆叮当吉他、摇把失真丝绸音墙到二十分钟无词史诗',
    nodes: [
      { tier: 1, nameCN: '叮当流行与独立摇滚', nameEN: 'Jangle & Indie Pop', eraSpan: '1983–1992', summary: 'Rickenbacker 分解和弦承载敏感孤绝的青年诗篇' },
      { tier: 2, nameCN: '自赏音墙与梦幻流行', nameEN: 'Shoegaze & Dream Pop', eraSpan: '1990–1998', summary: '反向混响与合唱踏板将失真化作温柔催眠海啸' },
      { tier: 3, nameCN: '数摇情绪与后摇史诗', nameEN: 'Midwest Emo & Post-Rock', eraSpan: '1997–2024', summary: '奇数拍双吉他点弦与静动炸裂的室内交响长曲' },
    ],
    adjacent: ['punk-postpunk', 'artpop-citypop', 'folk-psych'],
  },
  'electronic-idm': {
    id: 'electronic-idm', nameCN: '电子与俱乐部文化谱系', nameEN: 'Kraut, Techno, IDM & Bass', shortCN: '电子 Electronic',
    badgeColor: '#245953', inkColor: '#45b09c',
    tagline: '从德国无限速公路节拍、底特律机器灵魂到雨夜低频幽灵',
    nodes: [
      { tier: 1, nameCN: '泡菜摇滚与合成器流行', nameEN: 'Krautrock & Synthpop', eraSpan: '1971–1984', summary: 'Motorik 4/4 机械推进与人机合一极简旋律' },
      { tier: 2, nameCN: '浩室与底特律科技舞曲', nameEN: 'House & Techno', eraSpan: '1986–1999', summary: '滤波采样与鼓机低音点燃全球地下俱乐部革命' },
      { tier: 3, nameCN: '环境智能舞曲与英伦低频', nameEN: 'Ambient IDM & UK Bass', eraSpan: '1992–2024', summary: '卧室磁带柔光、复杂碎拍与深夜伦敦车窗冷雨' },
    ],
    adjacent: ['punk-postpunk', 'artpop-citypop', 'hiphop'],
  },
  hiphop: {
    id: 'hiphop', nameCN: '嘻哈与节拍采样谱系', nameEN: 'Hip-Hop, Jazz Rap & Beats', shortCN: '嘻哈 Hip-Hop',
    badgeColor: '#6e4726', inkColor: '#d98c38',
    tagline: '从皇后桥街头长镜头、黑胶爵士挖掘到微醺错拍采样炼金术',
    nodes: [
      { tier: 1, nameCN: '老派与黄金年代硬核节拍', nameEN: 'Golden Age Boom Bap', eraSpan: '1982–1996', summary: '断奏爵士钢琴循环与高密度内押韵街头文学' },
      { tier: 2, nameCN: '爵士说唱与器乐节拍', nameEN: 'Jazz Rap & Instrumental Beats', eraSpan: '1991–2006', summary: 'MPC 无量化人性摇摆与深夜黑胶切片叙事' },
      { tier: 3, nameCN: '抽象与实验嘻哈', nameEN: 'Experimental Hip-Hop', eraSpan: '2004–2024', summary: '怪诞漫画采样、无副歌迷宫与先锋工业能量碰撞' },
    ],
    adjacent: ['jazz', 'electronic-idm', 'artpop-citypop'],
  },
  'artpop-citypop': {
    id: 'artpop-citypop', nameCN: '艺术流行与都会合成器', nameEN: 'Art Pop, City Pop & Chamber', shortCN: '都会 Art/City Pop',
    badgeColor: '#4e3c6e', inkColor: '#b57edc',
    tagline: '从纽约先锋剧场、东京海岸午夜霓虹到极北冰岛室内弦乐',
    nodes: [
      { tier: 1, nameCN: '艺术摇滚与都会流行', nameEN: 'Art Rock & City Pop', eraSpan: '1977–1989', summary: '放克切分吉他与精密录音室打造璀璨都市夜航' },
      { tier: 2, nameCN: '涩谷系与巴洛克室内流行', nameEN: 'Shibuya-kei & Chamber Pop', eraSpan: '1966–2019', summary: '圆号羽管键琴与立体声元拼贴构筑流行建筑学' },
      { tier: 3, nameCN: '独立电子与前卫艺术流行', nameEN: 'Indietronica & Avant-Pop', eraSpan: '1997–2024', summary: '火山弦乐、微采样踩雪声与先锋电子碎拍共生' },
    ],
    adjacent: ['shoegaze-indie', 'electronic-idm', 'jazz'],
  },
  'folk-psych': {
    id: 'folk-psych', nameCN: '民谣、迷幻与在地场景', nameEN: 'Folk, Tropicalia & Regional', shortCN: '民谣迷幻 Folk/Psych',
    badgeColor: '#4c5c32', inkColor: '#9eb84c',
    tagline: '从静夜指弹木吉他、巴西热带迷幻到黄河信天游与石家庄小号',
    nodes: [
      { tier: 1, nameCN: '民谣复兴与打口世代诗篇', nameEN: 'Folk Revival & Dakou Era', eraSpan: '1965–2010', summary: '特殊调弦原声吉他与工业黄昏里的小号突围' },
      { tier: 2, nameCN: '热带主义与独立怪诞民谣', nameEN: 'Tropicália & Freak Folk', eraSpan: '1968–2006', summary: '桑巴律动撞上法兹吉他与过载铜管的超现实狂欢' },
      { tier: 3, nameCN: '非洲节拍与无界室内民谣', nameEN: 'Afrobeat & Chamber Folk', eraSpan: '1975–2024', summary: '蛛网般多重鼓律与海风古典吉他编织世界秘境' },
    ],
    adjacent: ['shoegaze-indie', 'jazz', 'heavy-industrial'],
  },
  'heavy-industrial': {
    id: 'heavy-industrial', nameCN: '重型、工业与前卫金属', nameEN: 'Heavy, Industrial & Blackgaze', shortCN: '重型工业 Heavy',
    badgeColor: '#522c29', inkColor: '#d95b38',
    tagline: '从伯明翰降调铁砧、九寸钉机械脉冲到粉橙色自赏黑金属音墙',
    nodes: [
      { tier: 1, nameCN: '重型迷幻与厄运基石', nameEN: 'Heavy Psych & Doom', eraSpan: '1970–2000', summary: '降调三全音强力和弦锻造浑厚阴沉的重型母体' },
      { tier: 2, nameCN: '工业摇滚与大气后金属', nameEN: 'Industrial & Post-Metal', eraSpan: '1989–2005', summary: '失真鼓机脉冲与建筑感巨浪递进的末世张力' },
      { tier: 3, nameCN: '黑自赏与前卫无人机音墙', nameEN: 'Blackgaze & Avant-Heavy', eraSpan: '2003–2024', summary: '暴风雪轮拨吉他中绽放夺眶而出的大调灿烂微光' },
    ],
    adjacent: ['punk-postpunk', 'shoegaze-indie', 'electronic-idm'],
  },
};

export const LINEAGE_LIST: LineageMeta[] = Object.values(LINEAGES);
