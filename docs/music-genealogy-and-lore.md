# 《请出示唱片》(Record, Please) —— 音乐谱系、年代地区切入矩阵与文化资料库

> **修订说明（2026-11-24）**：本文是早期设计稿。这次修订删掉了所有 Rate Your Music 的评分与排名说法，以及“公认最伟大”“被誉为”这类没有出处的评价；改正了对照 Apple 曲库和 MusicBrainz 后发现有误的地方（见各处“更正”标注）；书和影片的介绍换成了游戏里核对过的那一句；第四节改成游戏现在实际的人格规则。流派名称参照 Rate Your Music 的叫法，本文不引用它的评分或排名。第二、三节里对单曲、音乐家和专辑的形容与轶事是原稿文字，没有逐条核对出处，不要当作事实引用；游戏里实际显示的内容以代码仓库的 `src/data/catalog.json` 为准。

## 一、设计总览与审查台叙事逻辑

在像素风音乐审查与推荐游戏 **《请出示唱片》(Record, Please)** 中，玩家扮演边境唱片审查台（Listening Booth & Customs Desk）的唱片馆员。每位来访旅客的“听觉护照”上都盖有两枚核心出生印章：**出生年代（Birth Era）** 与 **成长国家/地区（Country/Region）**。

馆员需要依据旅客青春期（约 13–22 岁）的**黄金听歌窗口期（Formative Listening Window）**，先通过“当时全球流行代表（Global Pop Icons）”或“地方特色代表音乐家（Local Signature Musicians）”建立信任共鸣，再沿着 8 条核心流派谱系树（流派名称参照 Rate Your Music），按 **单曲（Single）→ 音乐家（Musician）→ 专辑（Album：核心必听 + 进阶延伸）** 三级阶梯递进发掘，并辅以代表性的**音乐书籍、口述史、纪录片与现场电影**解锁深层场景故事，最终在通关时生成专属的“音乐家人格画像（Musician Archetype Persona）”。

---

## 二、年代 × 国家/地区 初始切入矩阵 (Birth Era × Country/Region Entry Matrix)

> **窗口期换算原则**：以出生年代顺推 13–22 岁青春成长期作为初始听觉记忆锚点：
> - **1970s 出生（70后）**：青春听歌期约 **1985–1996**（磁带、广播电台、MTV 黄金时代、早期打口带）
> - **1980s 出生（80后）**：青春听歌期约 **1995–2006**（打口 CD/磁带、随身听 Discman、千禧独立厂牌、MP3 初兴）
> - **1990s 出生（90后）**：青春听歌期约 **2005–2016**（iPod、MySpace、豆瓣 FM、博客分享、音乐节爆发期）
> - **2000s 出生（00后）**：青春听歌期约 **2015–2025**（流媒体算法、网易云/Spotify、Bandcamp、TikTok 复古回潮）

### 2.1 1970s 出生世代（青春听歌窗口：1985–1996）

| 国家/地区 | 当时全球流行代表 (Global Pop Icons) | 地方特色代表音乐家 (Local Signature Musicians) | 自然切入的谱系桥梁 (Lineage Bridges) |
| :--- | :--- | :--- | :--- |
| **中国大陆** | Michael Jackson《Dangerous》(1991) / Nirvana《Nevermind》(1991) | **崔健**《新长征路上的摇滚》(1989) / **窦唯**《黑梦》(1994) | 由窦唯《黑梦》切入 **Punk & Post-Punk**（Post-Punk/Goth）与 **Indie, Shoegaze & Post-Rock**（Dream Pop）；由崔健切入 **Folk, Psych & Regional**（中国摇滚与打口世代） |
| **港台** | Madonna《Like a Prayer》(1989) / Pet Shop Boys《Actually》(1987) | **罗大佑**《之乎者也》(1982) / **达明一派**《石头记》(1987) / **王菲**《浮躁》(1996) | 由达明一派切入 **Electronic & Club**（Synthpop）与 **Art Pop, City Pop & Synth**；由王菲《浮躁》（与 Cocteau Twins 合作）直通 **Dream Pop / Shoegaze** |
| **日本** | David Bowie《Let's Dance》(1983) / Prince《Purple Rain》(1984) | **山下达郎 (Tatsuro Yamashita)**《For You》(1982) / **竹内玛莉亚**〈Plastic Love〉(1984) / **Flipper's Guitar**《Camera Talk》(1990) | 直接锚定 **Art Pop, City Pop & Synth**（Japanese City Pop & Shibuya-kei），并延伸至 **Indie, Shoegaze & Post-Rock**（Jangle Pop）与 **Jazz**（Jazz-Fusion） |
| **美国** | Prince《Sign "☮" the Times》(1987) / Nirvana〈Smells Like Teen Spirit〉(1991) | **R.E.M.**《Murmur》(1983) / **Public Enemy**《It Takes a Nation of Millions...》(1988) / **Sonic Youth**《Daydream Nation》(1988) | 三路分流至 **Indie, Shoegaze & Post-Rock**（Jangle Pop）、**Hip-Hop & Beats**（Golden Age Boom Bap）与 **Punk & Post-Punk**（Noise Rock） |
| **英国** | New Order〈Blue Monday〉(1983) / Oasis《(What's the Story) Morning Glory?》(1995) | **The Smiths**《The Queen Is Dead》(1986) / **My Bloody Valentine**《Loveless》(1991) | 核心切入 **Indie, Shoegaze & Post-Rock**（Jangle Pop → Shoegaze），并由 New Order 桥接 **Punk & Post-Punk** 与 **Electronic & Club** |
| **欧洲大陆** | Depeche Mode《Violator》(1990) / Kraftwerk《Computer World》(1981) | **Asylum Party**《Borderline》(1989, 法国) / **Einstürzende Neubauten**《Halber Mensch》(1985, 西德) | 切入 **Punk & Post-Punk**（Coldwave & Goth）、**Electronic & Club**（Krautrock / Synthpop）与 **Heavy, Industrial & Avant-Garde**（Industrial） |
| **拉美** |The Cure《Disintegration》(1989) / Queen〈Radio Ga Ga〉(1984) | **Charly García**《Clics modernos》(1983, 阿根廷) / **Soda Stereo**《Canción animal》(1990, 阿根廷) | 由 Charly García 切入 **Art Pop, City Pop & Synth**（New Wave/Art Rock），由 Soda Stereo 切入 **Punk & Post-Punk** 与 **Shoegaze**（90年代《Dynamo》） |

### 2.2 1980s 出生世代（青春听歌窗口：1995–2006）

| 国家/地区 | 当时全球流行代表 (Global Pop Icons) | 地方特色代表音乐家 (Local Signature Musicians) | 自然切入的谱系桥梁 (Lineage Bridges) |
| :--- | :--- | :--- | :--- |
| **中国大陆** | Radiohead《OK Computer》(1997) / Linkin Park《Hybrid Theory》(2000) | **朴树**《我去2000年》(1999) / **清醒**《好极了！？》(1997) / **野孩子**《咒语》(1999) | 借打口带记忆从 Radiohead 切入 **Art Rock / Post-Rock / IDM**；由野孩子切入 **Folk, Psych & Regional**（中国民谣与打口世代摇滚） |
| **港台** | Britney Spears〈...Baby One More Time〉(1998) / Coldplay《Parachutes》(2000) | **周杰伦**《范特西》(2001) / **陈绮贞**《吉他手》(2002) / **伍佰 & China Blue**《爱情的尽头》(1996) | 由陈绮贞切入 **Indie & Freak Folk / Chamber Pop**；由周杰伦 R&B/古典采样编曲反向拆解至 **Hip-Hop & Beats** 与 **Chamber Pop** |
| **日本** |宇多田光《First Love》(1999) / Björk《Homogenic》(1997) | **Fishmans**《Long Season》(1996) / **椎名林檎**《無罪モラトリアム》(1999) / **Nujabes**《Modal Soul》(2005) | 由 Fishmans 切入 **Dream Pop / Post-Rock**；由椎名林檎切入 **Art Pop / Noise Rock**；由 Nujabes 直通 **Hip-Hop & Beats**（Jazz Rap / Instrumental Beats） |
| **美国** | Eminem《The Marshall Mathers LP》(2000) / The Strokes《Is This It》(2001) | **Neutral Milk Hotel**《In the Aeroplane Over the Sea》(1998) / **American Football**《American Football》(1999) / **Madvillain**《Madvillainy》(2004) | 精准通往 **Folk, Psych & Regional**（Indie Folk）、**Indie, Shoegaze & Post-Rock**（Midwest Emo）与 **Hip-Hop & Beats**（Experimental Hip-Hop） |
| **英国** | Blur《Parklife》(1994) / Radiohead《Kid A》(2000) | **Portishead**《Dummy》(1994) / **Aphex Twin**《Richard D. James Album》(1996) / **Mogwai**《Young Team》(1997) | 桥接 **Electronic & Club**（Ambient & IDM / UK Bass）与 **Indie, Shoegaze & Post-Rock**（Post-Rock） |
| **欧洲大陆** | Daft Punk《Discovery》(2001) / Björk《Vespertine》(2001) | **Air**《Moon Safari》(1998, 法国) / **Sigur Rós**《Ágætis byrjun》(1999, 冰岛) | 由 Daft Punk / Air 切入 **Electronic & Club**（House）与 **Art Pop**；由 Sigur Rós 切入 **Post-Rock** |
| **拉美** | Shakira《Dónde Están los Ladrones?》(1998) / Manu Chao《Clandestino》(1998) | **Gustavo Cerati**《Bocanada》(1999, 阿根廷) / **Café Tacvba**《Re》(1994, 墨西哥) | 由《Bocanada》采样美学切入 **Electronic & Club**、**Dream Pop** 与 **Hip-Hop & Beats**（Plunderphonics）；由 Café Tacvba 回溯 **Folk, Psych & Regional** |

### 2.3 1990s 出生世代（青春听歌窗口：2005–2016）

| 国家/地区 | 当时全球流行代表 (Global Pop Icons) | 地方特色代表音乐家 (Local Signature Musicians) | 自然切入的谱系桥梁 (Lineage Bridges) |
| :--- | :--- | :--- | :--- |
| **中国大陆** | Avril Lavigne《Under My Skin》(2004) / Taylor Swift《1989》(2014) | **万能青年旅店**《万能青年旅店》(2010) / **刺猬**《噪音袭击世界》(2007) / **周云蓬**《中国孩子》(2007) | 由万青铜管与长篇器乐切入 **Folk, Psych & Regional**、**Art Rock** 与 **Post-Rock**；由刺猬切入 **Noise Rock / Shoegaze** |
| **港台** |五月天《第二人生》(2011) / Adele《21》(2011) | **苏打绿**《冬 未了》(2015) / **草东没有派对**《丑奴儿》(2016) / **张悬 (焦安溥)**《神的游戏》(2012) | 由苏打绿切入 **Chamber & Baroque Pop**；由草东没有派对的静动爆发切入 **Post-Rock / Midwest Emo / Grunge** |
| **日本** | Perfume《GAME》(2008) / RADWIMPS《君の名は。》(2016) | **toe**《the book about my idle plot on a vague anxiety》(2005；游戏里的〈グッドバイ〉出自 2006 年的《New Sentimentality》) / **きのこ帝国 (蘑菇帝国)**《涡になる》(2012) | 由 toe 切入 **Post-Rock / Midwest Emo**；由蘑菇帝国切入 **Shoegaze / Dream Pop**；由 Perfume 回溯 **Synthpop / Shibuya-kei** |
| **美国** | Kanye West《My Beautiful Dark Twisted Fantasy》(2010) / Frank Ocean《Blonde》(2016) | **Kendrick Lamar**《To Pimp a Butterfly》(2015) / **Beach House**《Teen Dream》(2010) / **Deafheaven**《Sunbather》(2013) | 贯通 **Hip-Hop & Beats**（Jazz Rap）→ **Jazz**（Spiritual Jazz）、**Dream Pop**，以及 **Heavy, Industrial & Avant-Garde**（Blackgaze） |
| **英国** | Arctic Monkeys《Whatever People Say I Am...》(2006) / Amy Winehouse《Back to Black》(2006) | **Burial**《Untrue》(2007) / **Yussef Kamaal**《Black Focus》(2016) / **FKA twigs**《LP1》(2014) | 核心切入 **Electronic & Club**（UK Bass）、**Jazz**（Nu-Jazz）与 **Art Pop, City Pop & Synth**（Indietronica & Art Pop） |
| **欧洲大陆** | Stromae《Racine carrée》(2013, 比利时) / Phoenix《Wolfgang Amadeus Phoenix》(2009, 法国) | **Alcest**《Écailles de lune》(2010, 法国) / **Moderat**《II》(2013, 德国) | 由 Alcest 开启 **Heavy, Industrial & Avant-Garde**（Blackgaze）与 **Shoegaze** 双向通道；由 Moderat 切入 **Electronic & Club**（IDM / Techno） |
| **拉美** | Calle 13《Entren los que quieran》(2010) / Julieta Venegas《Limón y Sal》(2006) | **Natalia Lafourcade**《Hasta la Raíz》(2015, 墨西哥) / **Juana Molina**《Wed 21》(2013, 阿根廷) | 由 Natalia Lafourcade 回溯 **Folk, Psych & Regional**（拉美民谣与 Bossa/Tropicália 传统）；由 Juana Molina 切入 **Indietronica & Freak Folk** |

### 2.4 2000s 出生世代（青春听歌窗口：2015–2025）

| 国家/地区 | 当时全球流行代表 (Global Pop Icons) | 地方特色代表音乐家 (Local Signature Musicians) | 自然切入的谱系桥梁 (Lineage Bridges) |
| :--- | :--- | :--- | :--- |
| **中国大陆** | Billie Eilish《When We All Fall Asleep...》(2019) / The Weeknd《After Hours》(2020) | **重塑雕像的权利**《喝彩之后》(2017) / **绝对纯洁**《We Fought Over the Moon》(2022) / **缺省 (Default)**《California Nebula》(2017) | 由重塑雕像的权利直通 **Punk & Post-Punk**（Post-Punk/Coldwave）与 **Krautrock**；由缺省切入 **Shoegaze** |
| **港台** | NewJeans《Get Up》(2023) / Dua Lipa《Future Nostalgia》(2020) | **落日飞车 (Sunset Rollercoaster)**《Cassa Nova》(2018) / **大象体操 (Elephant Gym)**《水底》(2018) | 由落日飞车切入 **Art Pop, City Pop & Synth**（City Pop 复兴 / Sophisti-Pop）；由大象体操切入 **Post-Rock / Nu-Jazz** |
| **日本** | 米津玄师《STRAY SHEEP》(2020) / 藤井风《HELP EVER HURT NEVER》(2020) | **青叶市子 (Ichiko Aoba)**《アダンの風 (Windswept Adan)》(2020) / **羊文学**《our hope》(2022) / **坂本慎太郎**《物語のように》(2022) | 由青叶市子切入 **Folk, Psych & Regional**（Chamber/Indie Folk）；由羊文学切入 **Shoegaze / Alternative**；由藤井风与坂本慎太郎连接 **Jazz / City Pop** |
| **美国** | Tyler, the Creator《IGOR》(2019) / Olivia Rodrigo《SOUR》(2021) | **Weyes Blood**《Titanic Rising》(2019) / **JPEGMAFIA**《Veteran》(2018) / **Phoebe Bridgers**《Punisher》(2020) | 分别桥接 **Art Pop, City Pop & Synth**（Chamber & Baroque Pop）、**Hip-Hop & Beats**（Experimental Hip-Hop）与 **Indie Folk / Slowcore** |
| **英国** | Charli xcx《BRAT》(2024) / Central Cee〈Doja〉(2022) | **black midi**《Schlagenheim》(2019) / **Black Country, New Road**《Ants From Up There》(2022) / **The Comet Is Coming**《Trust in the Lifeforce...》(2019) | 南伦敦 Windmill 场景直通 **No Wave & Noise Rock**、**Post-Rock / Chamber Pop** 与 **Jazz**（Nu-Jazz） |
| **欧洲大陆** | ROSALÍA《MOTOMAMI》(2022, 西班牙) / Måneskin《Teatro d'ira: Vol. I》(2021) | **ROSALÍA**《El mal querer》(2018, 西班牙) / **Molchat Doma**《Этажи (Etazhi)》(2018, 东欧后朋浪潮) | 由《El mal querer》切入 **Art Pop & Regional Flamenco**；由 Molchat Doma 在短视频时代的翻红切入 **Coldwave & Goth** |
| **拉美** | Bad Bunny《Un verano sin ti》(2022, 波多黎各) / Karol G《Mañana Será Bonito》(2023) | **Arca**《KiCk i》(2020, 委内瑞拉) / **Tim Bernardes**《Mil Coisas Invisíveis》(2022, 巴西) | 由 Arca 切入 **Indietronica & Art Pop / Industrial**；由 O Terno 主唱 Tim Bernardes 回溯巴西 **Tropicália / Chamber Folk** |

---

## 三、核心音乐谱系进阶树与文化资料 (8 Core Genealogies & Cultural Lore)

每条谱系均严格按照 **单曲（Single：试听间 3 分钟钩子）→ 音乐家（Musician：人物肖像）→ 专辑（Album：核心必听 Essential + 进阶延伸 Advanced Follow-up）** 三维递进设计，并附带该文化场景的书籍、口述史、纪录片与现场电影。

> **更正**：下面每个节点的“单曲”和“专辑”是分开挑的，单曲不一定收录在同一节点的专辑里；不在的地方已逐条标出。

---

### 谱系 1：Jazz（爵士谱系：从比波普即兴革命到当代俱乐部新爵士）

#### 进阶节点路径
1. **Bebop（比波普）**
   - **单曲 (Single)**：Charlie Parker — 〈Ko-Ko〉(1945) —— 疾速和弦替代与自由翱翔的中音萨克斯线条，瞬间宣告爵士乐从舞厅娱乐转向现代艺术。
   - **音乐家 (Musician)**：**Charlie Parker（查理·帕克，“Bird”，1920–1955，美国堪萨斯城/纽约）** —— 与小号手 Dizzy Gillespie、钢琴家 Thelonious Monk 在纽约 Minton's Playhouse 掀起比波普革命，奠定现代爵士即兴语法。
   - **专辑 (Album)**：
     - *核心必听*：The Quintet — **《Jazz at Massey Hall》**(1953)（集结 Parker、Gillespie、Bud Powell、Charles Mingus、Max Roach 五大巨匠的比波普现场巅峰）
     - *进阶延伸*：Thelonious Monk — **《Genius of Modern Music: Volume 1》**(1951)（棱角分明的不协和音程与留白美学）
2. **Cool & Modal（冷爵士与调式爵士）**
   - **单曲 (Single)**：Miles Davis — 〈So What〉(1959) —— 贝斯手 Paul Chambers 奏出两句简明低音呼应，用调式（Mode）解放繁复和声功能进行。
   - **音乐家 (Musician)**：**Miles Davis（迈尔斯·戴维斯，1926–1991，美国伊利诺伊州/纽约）** —— 爵士史上五次改写流派走向的“变色龙”，从 Cool Jazz、Hard Bop、Modal Jazz 一路领航至 Jazz-Fusion。
   - **专辑 (Album)**：
     - *核心必听*：Miles Davis — **《Kind of Blue》**(1959)（调式爵士的代表专辑）
     - *进阶延伸*：Bill Evans Trio — **《Sunday at the Village Vanguard》**(1961)（印象派钢琴和声与三重奏平等对话的室内冷爵士极品）
3. **Hard Bop & Post-Bop（硬波普与后波普）**
   - **单曲 (Single)**：Art Blakey and the Jazz Messengers — 〈Moanin'〉(1958) —— 福音音乐与布鲁斯律动正面碰撞，钢琴呼应极具抓耳感染力。
   - **音乐家 (Musician)**：**Wayne Shorter（韦恩·肖特，1933–2023，美国新泽西）** —— 历经 Jazz Messengers 与 Miles Davis 第二五重奏淬炼，以神秘莫测的椭圆和声与叙事结构定义 60 年代 Blue Note 后波普美学。
   - **专辑 (Album)**：
     - *核心必听*：Art Blakey and the Jazz Messengers — **《Moanin'》**(1958)（Hard Bop 黄金标准）
     - *进阶延伸*：Wayne Shorter — **《Speak No Evil》**(1966)（游走于硬波普律动与自由调式边缘的后波普杰作；并可旁通 Charles Mingus《The Black Saint and the Sinner Lady》1963）
4. **Spiritual & Jazz-Fusion（灵性爵士与爵士融合）**
   - **单曲 (Single)**：John Coltrane — 〈A Love Supreme, Pt. I – Acknowledgement〉(1965) —— 四音动机“A-Love-Su-Preme”层层盘旋升腾，化器乐即兴为宇宙祈祷。
   - **音乐家 (Musician)**：**John Coltrane（约翰·科特兰，1926–1967，美国北卡罗来纳/费城）** —— 从“音符之墙（Sheets of Sound）”走向超越宗教藩篱的灵性爵士，影响深及迷幻摇滚、极简主义与后摇滚。
   - **专辑 (Album)**：
     - *核心必听*：John Coltrane — **《A Love Supreme》**(1965)（四个乐章的组曲，Spiritual Jazz 的代表专辑）
     - *进阶延伸*：Miles Davis — **《In a Silent Way》**(1969) / **《Bitches Brew》**(1970)（插电键盘、录音室磁带剪辑与摇滚律动熔铸出 Jazz-Fusion，桥接 Krautrock 与 Funk）
5. **Nu-Jazz（新爵士与当代俱乐部跨界爵士）**
   - **单曲 (Single)**：Yussef Kamaal — 〈Strings of Light〉(2016) —— 南伦敦碎拍（Broken Beat）鼓点与 Rhodes 电钢琴交织，充满当代都市夜色律动。
   - **音乐家 (Musician)**：**Yussef Kamaal（鼓手 Yussef Dayes 与键盘手 Kamaal Williams，英国伦敦）** —— 将英国海盗电台 UK Garage / Jungle 律动注入 70 年代 Jazz-Funk，点燃 2010 年代伦敦新爵士浪潮。
   - **专辑 (Album)**：
     - *核心必听*：Yussef Kamaal — **《Black Focus》**(2016)（当代伦敦 Nu-Jazz 破圈名盘，桥接 UK Bass 与 Hip-Hop）
     - *进阶延伸*：The Comet Is Coming — **《Trust in the Lifeforce of the Deep Mystery》**(2019)（Shabaka Hutchings 领衔，将太空合成器、迷幻朋克能量与灵性萨克斯融为一炉）

#### 代表性音乐故事与文化资料（Jazz）
- **Ted Gioia《How to Listen to Jazz》（《如何听爵士》）**｜Ted Gioia｜2016｜书籍 —— 一本教人怎么听爵士的入门书：听一场演奏时该留意什么，即兴由哪些部分搭成。
- **Miles Davis & Quincy Troupe《Miles: The Autobiography》（《迈尔斯·戴维斯自传》）**｜Miles Davis、Quincy Troupe｜1989｜自传/口述史 —— Miles Davis 的自传，与诗人、记者 Quincy Troupe 合写。
- **Ken Burns《Jazz》（《爵士乐》）**｜Ken Burns（导演）｜2001｜纪录片 —— PBS 播出的 10 集纪录片，按年代讲爵士史，Louis Armstrong 和 Duke Ellington 是中心人物。
- **Questlove《Summer of Soul (...Or, When the Revolution Could Not Be Televised)》（《灵魂乐之夏》）**｜Questlove（导演）｜2021｜纪录片/现场电影 —— 游戏没有采用：它讲的不是游戏里任何一张唱片的音乐家或流派。原稿的介绍没有核对，已删去。

---

### 谱系 2：Punk & Post-Punk（朋克与后朋克谱系：从地下天鹅绒噪音到冷暗浪潮）

#### 进阶节点路径
1. **Proto-Punk（原始朋克）**
   - **单曲 (Single)**：The Velvet Underground — 〈I'm Waiting for the Man〉(1967) —— 粗粝敲击的桶式钢琴与街头白描叙事，彻底剥除嬉皮时代的浪漫滤镜。
   - **音乐家 (Musician)**：**The Velvet Underground（地下丝绒，Lou Reed、John Cale 等，1964–1973，美国纽约）** —— 安迪·沃霍尔“工厂”孕育的反叛先驱，将先锋派持续低音（Drone）植入摇滚，开启另类音乐总源流。
   - **专辑 (Album)**：
     - *核心必听*：The Velvet Underground & Nico — **《The Velvet Underground & Nico》**(1967)（乐队 1967 年的首张专辑）
     - *进阶延伸*：The Stooges — **《Fun House》**(1970)（Iggy Pop 原始兽性嘶吼与自由爵士萨克斯失控冲撞的底特律炼狱杰作）
2. **'77 Punk（七七朋克浪潮）**
   - **单曲 (Single)**：The Clash — 〈Complete Control〉(1977) —— 由雷鬼大师 Lee "Scratch" Perry 操刀制作，三分钟内迸发对唱片工业操控的愤怒反击。
   - **音乐家 (Musician)**：**The Clash（冲撞乐队，Joe Strummer 等，1976–1986，英国伦敦）** —— 不满足于三和弦宣泄，大胆吸收牙买加 Dub、Ska、Funk 与左翼政治视野，拓宽朋克的音乐边界。
   - **专辑 (Album)**：
     - *核心必听*：The Clash — **《London Calling》**(1979)（跨越朋克、雷鬼、摇滚乐根源的双张史诗；若求纯粹三和弦极速冲击可同听 Ramones《Ramones》1976）
     - *进阶延伸*：Wire — **《Pink Flag》**(1977)（21 首极简主义短曲解构摇滚曲式，直接架起从 '77 Punk 通往 Post-Punk 的桥梁）
3. **Post-Punk（后朋克）**
   - **单曲 (Single)**：Joy Division — 〈Love Will Tear Us Apart〉(1980) —— 高把位旋律贝斯领奏、冷峻合成器弦乐与 Ian Curtis 绝望低沉的男中音形成凄美反差。
   - **音乐家 (Musician)**：**Joy Division（乔伊·迪维讯 / 快乐小分队，1976–1980，英国曼彻斯特）** —— 与制作人 Martin Hannett 一起把后工业城市曼彻斯特的空旷疏离感铸造成永恒的空间声学美学。
   - **专辑 (Album)**：
     - *核心必听*：Joy Division — **《Unknown Pleasures》**(1979)（脉冲星波形封面与冷冽空间混响定义后朋克图腾）
     - **更正**：〈Love Will Tear Us Apart〉是 1980 年的单曲，不在《Unknown Pleasures》里。游戏里这一格用的是该专辑的开场曲〈Disorder〉(1979)。
     - *进阶延伸*：Gang of Four — **《Entertainment!》**(1979)（刀锋般切分吉他、放克律动与消费异化批判的后朋克另一极）
4. **Coldwave & Goth（冷浪潮与哥特摇滚）**
   - **单曲 (Single)**：Bauhaus — 〈Bela Lugosi's Dead〉(1979) —— 借用牙买加 Dub 混响留白、极简鼓点与吸血鬼戏剧意象，宣告哥特摇滚诞生。
   - **音乐家 (Musician)**：**The Cure（治疗乐队，Robert Smith 领衔，1978–至今，英国克劳利）** —— 从幽闭绝望的哥特三部曲到凄美浩瀚的合成器长篇，塑造全球暗潮青年审美（亦深刻影响早期窦唯）。
   - **专辑 (Album)**：
     - *核心必听*：The Cure — **《Pornography》**(1982)（密集部落鼓机与冰封吉他交织的哥特摇滚巅峰，或更易入门的《Disintegration》1989）
     - *进阶延伸*：Asylum Party — **《Borderline》**(1989)（法国八十年代末 Coldwave 专辑，冰冷鼓机与忧郁贝斯线交相辉映）
     - **更正**：游戏里 Asylum Party 的卡片是〈Julia〉，它收录在更早的《Picture One》(1988)，不在《Borderline》里。
5. **No Wave & Noise Rock（无浪潮与噪音摇滚）**
   - **单曲 (Single)**：Sonic Youth — 〈Teen Age Riot〉(1988) —— 特殊调弦吉他交织出迷人泛音钟鸣，随后切入昂扬驰骋的地下青春宣言。
   - **音乐家 (Musician)**：**Sonic Youth（音速青年，Thurston Moore、Kim Gordon、Lee Ranaldo、Steve Shelley，1981–2011，美国纽约）** —— 从纽约 No Wave 先锋噪音土壤出发，将螺丝刀制备吉他与微分音调弦带入另类摇滚核心。
   - **专辑 (Album)**：
     - *核心必听*：Sonic Youth — **《Daydream Nation》**(1988)（Noise Rock 与 Indie Rock 交汇的恢弘双专辑里程碑）
     - *进阶延伸*：Glenn Branca — **《The Ascension》**(1981)（纽约 No Wave / 总体主义多把电吉他泛音轰鸣交响曲，Sonic Youth 成员早年受洗之源）

#### 代表性音乐故事与文化资料（Punk & Post-Punk）
- **Legs McNeil & Gillian McCain《Please Kill Me: The Uncensored Oral History of Punk》（《请杀了我：朋克无删减口述史》）**｜Legs McNeil、Gillian McCain｜1996｜口述史 —— 一部朋克口述史；作者之一 Legs McNeil 是 Punk 杂志的三位创办人之一。
- **Simon Reynolds《Rip It Up and Start Again: Postpunk 1978–1984》（《撕碎重来：后朋克 1978–1984》）**｜Simon Reynolds｜2005｜书籍 —— 写 1978–1984 年的后朋克，英国初版由 Faber & Faber 出版。
- **Penelope Spheeris《The Decline of Western Civilization》（《西方文明的衰落》）**｜Penelope Spheeris（导演）｜1981｜纪录片 —— 游戏没有采用：它拍的是洛杉矶的朋克现场，和游戏里的唱片只在流派上沾边（唯一的 Punk Rock 唱片是 The Clash 的），讲的不是其中任何一位音乐家。
- **Grant Gee《Joy Division》（《乔伊·迪维讯》）**｜Grant Gee（导演）、Jon Savage（编剧）｜2007｜纪录片 —— 关于 Joy Division 的纪录片，由 Jon Savage 撰稿。
- **Michael Winterbottom《24 Hour Party People》**｜Michael Winterbottom｜2002｜影片 —— 以 Factory Records 创办人 Tony Wilson 为主角的剧情片，讲 1976–1992 年的曼彻斯特音乐圈。

---

### 谱系 3：Indie, Shoegaze & Post-Rock（独立、自赏与后摇滚谱系：从叮当吉他到音墙史诗）

#### 进阶节点路径
1. **Jangle Pop（叮当流行）**
   - **单曲 (Single)**：The Smiths — 〈There Is a Light That Never Goes Out〉(1986) —— 清脆叠录的原声/电吉他叮当分解和弦与合成器长笛，承载英伦青春最浪漫又孤绝的夜晚。
   - **音乐家 (Musician)**：**The Smiths（史密斯乐队，Morrissey 与 Johnny Marr 等，1982–1987，英国曼彻斯特）** —— 拒绝 80 年代主流浮华合成器制作，以 Rough Trade 独立厂牌姿态确立现代英伦 Indie 美学范式。
   - **专辑 (Album)**：
     - *核心必听*：The Smiths — **《The Queen Is Dead》**(1986)（英伦独立摇滚皇冠明珠）
     - *进阶延伸*：R.E.M. — **《Murmur》**(1983)（美国南方学院摇滚代表，含混诗意唱腔与 Rickenbacker 吉他开辟美式地下独立网络）
2. **Shoegaze（自赏派 / 盯鞋摇滚）**
   - **单曲 (Single)**：My Bloody Valentine — 〈Only Shallow〉(1991) —— 四下军鼓敲击后，失真轰鸣却如丝绸般起伏的摇把滑音音墙瞬间淹没感官。
   - **音乐家 (Musician)**：**My Bloody Valentine（我的血腥情人节，Kevin Shields、Bilinda Butcher 等，1983–至今，爱尔兰都柏林/英国伦敦）** —— 独创反向混响与摇把弯音（Glide Guitar）技法，将噪音失真转化为如梦似幻的催眠织体。
   - **专辑 (Album)**：
     - *核心必听*：My Bloody Valentine — **《Loveless》**(1991)（Creation 厂牌发行，Shoegaze 的代表专辑）
     - *进阶延伸*：Slowdive — **《Souvlaki》**(1993)（更偏向空灵空间延迟混响与伤感旋律的自赏另一极）
3. **Dream Pop（梦幻流行）**
   - **单曲 (Single)**：Cocteau Twins — 〈Cherry-coloured Funk〉(1990) —— 合唱效果器浸润的柔光吉他与超越世俗语义的天籁吟唱，如坠暖紫云端。
   - **音乐家 (Musician)**：**Cocteau Twins（极地双子星，Elizabeth Fraser、Robin Guthrie、Simon Raymonde，1979–1997，苏格兰）** —— 4AD 厂牌仙音美学灵魂，1996 年更直接与王菲合作《浮躁》，深刻重塑华语另类流行听觉。
   - **专辑 (Album)**：
     - *核心必听*：Cocteau Twins — **《Heaven or Las Vegas》**(1990)（梦幻流行的代表专辑）
     - *进阶延伸*：Fishmans — **《Long Season》**(1996)（日本乐团将 Dream Pop、Dub 与渐进循环熔铸为一首 35 分钟无间断长曲的奇迹；或当代 Beach House《Teen Dream》2010）
4. **Slowcore & Midwest Emo（慢核与中西部情绪摇滚）**
   - **单曲 (Single)**：American Football — 〈Never Meant〉(1999) —— 开放调弦双吉他晶莹交错的点弦琶音与奇数拍律动，成为夏末告别与青春遗憾的代名词。
   - **音乐家 (Musician)**：**American Football（美式足球，Mike Kinsella 等，1997–至今，美国伊利诺伊州厄巴纳）** —— 将硬核朋克后的情绪内省与数学摇滚清音技法结合，成为全球数摇与独立乐队争相致敬的模板。
   - **专辑 (Album)**：
     - *核心必听*：American Football — **《American Football》**(LP1, 1999)（封面那座厄巴纳白房子已成为全球独立乐迷朝圣坐标）
     - *进阶延伸*：Duster — **《Stratosphere》**(1998)（低保真的太空慢核 Slowcore 专辑）
5. **Post-Rock（后摇滚）**
   - **单曲 (Single)**：Mogwai — 〈Mogwai Fear Satan〉(1997) —— 长笛与清音吉他低语骤然炸裂为排山倒海的失真音墙，教科书级展现后摇静动对比张力。
   - **音乐家 (Musician)**：**Godspeed You! Black Emperor（天佑黑帝，1994–至今，加拿大蒙特利尔）** —— 以大编制提琴、号角、磁带采样与多乐章室内交响结构，赋予无词摇滚史诗般的末世悲悯与希望。
   - **专辑 (Album)**：
     - *核心必听*：Godspeed You! Black Emperor — **《Lift Your Skinny Fists Like Antennas to Heaven》**(2000)（四首约二十分钟的长曲）
     - **更正**：Apple 曲库里没有这支乐队的专辑，取不到试听和封面，所以游戏里没有它的卡片。
     - *进阶延伸*：Slint — **《Spiderland》**(1991)（第一波后摇与数学摇滚冷峻叙事源头；并可同参 Talk Talk《Laughing Stock》1991 的留白即兴美学）

#### 代表性音乐故事与文化资料（Indie, Shoegaze & Post-Rock）
- **Michael Azerrad《Our Band Could Be Your Life: Scenes from the American Indie Underground, 1981–1991》（《我们的乐队也可以成为你的生活》）**｜Michael Azerrad｜2001｜书籍 —— 写 1981–1991 年间靠不停巡演和独立小厂牌起家的美国地下乐队。
- **Eric Green《Beautiful Noise》（《美丽噪音》）**｜Eric Green（导演）｜2014｜纪录片 —— 讲 Cocteau Twins、The Jesus and Mary Chain、My Bloody Valentine 三支乐队，以及它们对自赏的影响。
- **Jeanette Leech《Fearless: The Making of Post-Rock》（《无畏：后摇滚的诞生》）**｜Jeanette Leech｜2017｜书籍 —— 一本讲后摇滚如何成形的书，Jawbone Press 出版。
- **Danny O'Connor《Upside Down: The Creation Records Story》（《天翻地覆：Creation 唱片传奇》）**｜Danny O'Connor（导演）｜2010｜纪录片 —— 讲 Creation Records 这家厂牌的纪录片，Alan McGee、Noel Gallagher 等人出镜。
- **Grant Gee《Meeting People Is Easy》**｜Grant Gee｜1998｜影片 —— 跟拍 Radiohead《OK Computer》世界巡演的纪录片。

---

### 谱系 4：Electronic & Club Culture（电子与俱乐部文化谱系：从高速公路机械节拍到南伦敦低频幽灵）

#### 进阶节点路径
1. **Krautrock & Kosmische（泡菜摇滚与宇宙音乐）**
   - **单曲 (Single)**：Neu! — 〈Hallogallo〉(1972) —— 十分钟如德国无限速公路般笔直向前的 4/4 机械推进节拍（Motorik Beat），催眠而自由。
   - **音乐家 (Musician)**：**Can（罐头乐队，Holger Czukay、Jaki Liebezeit 等，1968–1979，西德科隆）** —— 战后德国青年斩断英美布鲁斯陈规，融合现代派电子实验、世界音乐律动与磁带拼贴，启发后朋克与现代电子乐。
   - **专辑 (Album)**：
     - *核心必听*：Can — **《Tago Mago》**(1971)（或更精炼跳跃的《Ege Bamyasi》1972，Krautrock 实验精神巅峰）
     - *进阶延伸*：Tangerine Dream — **《Phaedra》**(1974)（柏林学派 Kosmische Musik 里程碑，Moog 音序器营造深空冥想音景）
2. **Synthpop（合成器流行）**
   - **单曲 (Single)**：Kraftwerk — 〈The Model〉(〈Das Model〉, 1978) —— 纯全合成器勾勒出时尚冷艳的优美旋律钩子，奠定八十年代全球电子流行模板。
   - **音乐家 (Musician)**：**Kraftwerk（发电站乐队，Ralf Hütter 与 Florian Schneider 等，1970–至今，德国杜塞尔多夫）** —— 在 Kling Klang 工作室化身“人机合一”乐团，成为 Synthpop、Electro、Techno 乃至早期 Hip-Hop 共同尊奉的电子鼻祖。
   - **专辑 (Album)**：
     - *核心必听*：Kraftwerk — **《Trans-Europe Express》**(1977)（铁轨律动与极简电子旋律完美合一的不朽杰作）
     - **更正**：〈The Model〉收录在《The Man-Machine》(1978)，不在《Trans-Europe Express》里。游戏里这张卡的专辑是《The Man-Machine》。
     - *进阶延伸*：Depeche Mode — **《Violator》**(1990)（将工业采样质感与暗黑体育场级合成器金曲推向极致；东方脉络可对照 YMO《Solid State Survivor》1979）
3. **House & Detroit Techno（芝加哥浩室与底特律科技舞曲）**
   - **单曲 (Single)**：Rhythim Is Rhythim (Derrick May) — 〈Strings of Life〉(1987) —— 激昂交响弦乐采样与底特律鼓机律动碰撞，赋予冰冷机器炙热灵魂。
   - **音乐家 (Musician)**：**Derrick May & The Belleville Three（Juan Atkins、Derrick May、Kevin Saunderson，美国底特律）与 Frankie Knuckles（芝加哥浩室教父）** —— 正如 Derrick May 名言，底特律 Techno 就像“George Clinton 与 Kraftwerk 被困在同一部电梯里”，与芝加哥酷儿黑人地下俱乐部 Warehouse 共同点燃全球锐舞革命。
   - **专辑 (Album)**：
     - *核心必听*：Daft Punk — **《Homework》**(1997)（法国双人组以生猛滤波压缩向芝加哥 House 与底特律 Acid Techno 先驱致敬的破圈经典）
     - *进阶延伸*：Drexciya — **《Neptune's Lair》**(1999)（底特律神秘双人组构筑黑人未来主义海底神话的 Electro / Techno 殿堂专辑）
4. **Ambient & IDM（环境音乐与智能舞曲）**
   - **单曲 (Single)**：Aphex Twin — 〈Xtal〉(1992) —— 空灵女声采样、朦胧磁带柔光与轻盈节拍交融，温柔得宛如晨雾苏醒。
   - **音乐家 (Musician)**：**Aphex Twin（Richard D. James，1971–，英国康沃尔）** —— Warp 厂牌灵魂人物，一手缔造空灵隽永的环境电子，一手把鼓机编程推向令人眩晕的复节奏极限。
   - **专辑 (Album)**：
     - *核心必听*：Aphex Twin — **《Selected Ambient Works 85–92》**(1992)（居家卧室磁带录制的 Ambient Techno / IDM 启蒙圣经）
     - *进阶延伸*：Boards of Canada — **《Music Has the Right to Children》**(1998)（模拟合成器失谐走音唤起童年科教片怀旧幻觉；源头可溯及 Brian Eno《Ambient 1: Music for Airports》1978）
5. **UK Bass（英伦低音文化：Jungle / UK Garage / Dubstep）**
   - **单曲 (Single)**：Burial — 〈Archangel〉(2007) —— 变调 R&B 残缺人声切片、黑胶炒豆底噪与蹒跚 2-Step 木质鼓点，凝结深夜南伦敦大巴车窗上的冷雨。
   - **音乐家 (Musician)**：**Burial（William Bevan，英国伦敦）** —— 隐匿于聚光灯之外，抽离锐舞狂欢后的空虚余温，将牙买加 Dub 超低频（Sub-bass）与英国车库舞曲化作当代都市幽灵学（Hauntology）诗篇。
   - **专辑 (Album)**：
     - *核心必听*：Burial — **《Untrue》**(2007)（Future Garage / Dubstep 的代表专辑）
     - *进阶延伸*：Goldie — **《Timeless》**(1995)（切碎 Amen Break 碎拍并融入恢弘环境弦乐的 90 年代英国 Jungle / Drum and Bass 史诗）

#### 代表性音乐故事与文化资料（Electronic & Club Culture）
- **Simon Reynolds《Energy Flash: A Journey Through Rave Music and Dance Culture》（《能量闪耀：锐舞音乐与舞曲文化之旅》）**｜Simon Reynolds｜1998｜书籍 —— 写 1980 年代中期以来的舞曲与锐舞文化；美国版书名是 Generation Ecstasy。
- **Laurent Garnier & David Brun-Lambert《Électrochoc》（《电击》）**｜Laurent Garnier、David Brun-Lambert｜2003（2013 增订版）｜口述回忆录/书籍 —— Laurent Garnier 1980 年代末在曼彻斯特开始做 DJ，这是他与 David Brun-Lambert 合写的书。
- **Ben Whalley《Krautrock: The Rebirth of Germany》（《泡菜摇滚：德国的重生》）**｜Ben Whalley（导演，BBC Four）｜2009｜纪录片 —— BBC Four 的纪录片，讲 Neu!、Can、Faust、Kraftwerk 等乐队在 1968–1977 年间做出的新德国音乐。
- **Gary Bredow《High Tech Soul: The Creation of Techno Music》（《高科技灵魂：科技舞曲的诞生》）**｜Gary Bredow（导演）｜2006｜纪录片 —— 讲 Techno 在底特律的诞生，主角是 Juan Atkins、Derrick May 和 Kevin Saunderson。

---

### 谱系 5：Hip-Hop & Beats（嘻哈与节拍谱系：从布朗克斯街区派对到抽象采样炼金术）

#### 进阶节点路径
1. **Old School（老派嘻哈）**
   - **单曲 (Single)**：Grandmaster Flash and the Furious Five — 〈The Message〉(1982) —— “别推我，我已站在悬崖边”，首次让说唱走出派对助兴口号，直面里根时代纽约贫民窟的生存真相。
   - **音乐家 (Musician)**：**Grandmaster Flash（Joseph Saddler，1958–，美国纽约南布朗克斯）** —— 与 DJ Kool Herc、Afrika Bambaataa 并列嘻哈三大奠基人，创立双唱盘精准接拍与搓盘科学，让唱机正式成为乐器。
   - **专辑 (Album)**：
     - *核心必听*：Run-D.M.C. — **《Raising Hell》**(1986)（极简硬朗鼓机与摇滚吉他跨界破圈，将嘻哈推入专辑时代）
     - *进阶延伸*：Eric B. & Rakim — **《Paid in Full》**(1987)（Rakim 发明复杂内押韵与冷静多音节流动感，直接叩开黄金年代大门）
2. **Golden Age Boom Bap（黄金年代硬核节拍）**
   - **单曲 (Single)**：Nas — 〈N.Y. State of Mind〉(1994) —— DJ Premier 阴冷爵士钢琴循环与铁锤般的军鼓底鼓一响，年仅二十岁的 Nas 一气呵成绘出皇后桥街头电影长镜头。
   - **音乐家 (Musician)**：**Nas（Nasir Jones，1973–，美国纽约皇后区）与制作群星（DJ Premier、Large Professor、Pete Rock、Q-Tip）** —— 代表 90 年代东海岸 Boom Bap 采样制作与高密度文学叙事的完美结晶。
   - **专辑 (Album)**：
     - *核心必听*：Nas — **《Illmatic》**(1994)（十首无废曲的黄金年代圣经）
     - *进阶延伸*：Wu-Tang Clan — **《Enter the Wu-Tang (36 Chambers)》**(1993)（RZA 以邵氏功夫片对白采样与粗粝低保真灵魂乐切片打造地下武林帝国）
3. **Jazz Rap（爵士说唱）**
   - **单曲 (Single)**：A Tribe Called Quest — 〈Electric Relaxation〉(1993) —— 采样自 Ronnie Foster 爵士吉他与松弛低频贝斯线，温柔摇摆中透出都会夜行惬意。
   - **音乐家 (Musician)**：**A Tribe Called Quest（Q-Tip、Phife Dawg、Ali Shaheed Muhammad，1985–2016，美国纽约）** —— Native Tongues 积极说唱运动灵魂，让黑胶爵士挖掘成为嘻哈美学的核心语言。
   - **专辑 (Album)**：
     - *核心必听*：A Tribe Called Quest — **《The Low End Theory》**(1991)（传奇爵士贝斯手 Ron Carter 跨刀献奏的 Jazz Rap 奠基经典）
     - **更正**：〈Electric Relaxation〉收录在《Midnight Marauders》(1993)，不在《The Low End Theory》里。游戏里这张卡的专辑是《Midnight Marauders》。
     - *进阶延伸*：Kendrick Lamar — **《To Pimp a Butterfly》**(2015)（携 Kamasi Washington、Thundercat 等当代爵士巨匠参与录制的专辑；亚洲脉络可同听 Nujabes《Modal Soul》2005）
4. **Instrumental Beats & Plunderphonics（器乐节拍与掠夺音学拼贴）**
   - **单曲 (Single)**：DJ Shadow — 〈Midnight in a Perfect World〉(1996) —— 忧郁钢琴、芬兰冷门民谣人声与沉稳鼓点无缝层叠，完全脱离饶舌人声亦能讲述深邃夜曲。
   - **音乐家 (Musician)**：**J Dilla（James Dewitt Yancey，1974–2006，美国底特律）** —— 在采样器 MPC3000 上彻底摒弃机器自动量化，创造出前倾与拖拍并存的微醺人性律动（Dilla Time），深刻改写当代爵士、Neo-Soul 与 Lo-Fi Beats。
   - **专辑 (Album)**：
     - *核心必听*：J Dilla — **《Donuts》**(2006)（病榻之上完成、31 首灵魂乐微型拼贴组成的生命绝唱）
     - *进阶延伸*：The Avalanches — **《Since I Left You》**(2000)（几乎全由黑胶采样拼贴而成的 Plunderphonics 专辑；及 DJ Shadow《Endtroducing.....》1996）
5. **Experimental Hip-Hop（实验与抽象嘻哈）**
   - **单曲 (Single)**：Madvillain — 〈All Caps〉(2004) —— 美漫反派动画弦乐采样、无副歌怪诞结构与连环多音节押韵迷宫令人拍案叫绝。
   - **音乐家 (Musician)**：**MF DOOM（Daniel Dumile，1971–2020）& Madlib（Otis Jackson Jr.，1973–）** —— 戴铁面具的地下韵脚怪杰遇上嗜碟如命的迷幻采样巫师，彻底打破主流说唱曲式与人设陈规。
   - **专辑 (Album)**：
     - *核心必听*：Madvillain — **《Madvillainy》**(2004)（抽象与实验嘻哈的代表专辑）
     - *进阶延伸*：Danny Brown — **《Atrocity Exhibition》**(2016)（取名自 Joy Division 开篇曲，将后朋克焦虑、怪诞工业电子与癫狂声线推向极限；或更暴烈的 Death Grips《The Money Store》2012）

#### 代表性音乐故事与文化资料（Hip-Hop & Beats）
- **Jeff Chang《Can't Stop Won't Stop: A History of the Hip-Hop Generation》（《永不止步：嘻哈世代史》）**｜Jeff Chang｜2005｜书籍 —— 一本记录早期嘻哈现场的历史书。
- **Dan Charnas《Dilla Time: The Life and Afterlife of J Dilla, the Hip-Hop Producer Who Reinvented Rhythm》（《迪拉时间》）**｜Dan Charnas｜2022｜书籍 —— J Dilla 的传记，写到他 2006 年去世和身后的影响；书名指的是他标志性的节奏感。
- **Tony Silver & Henry Chalfant《Style Wars》（《风格之战》）**｜Tony Silver（导演）、Henry Chalfant（制片）｜1983｜纪录片 —— 在 PBS 首播的嘻哈文化纪录片，重点拍的是涂鸦。
- **Doug Pray《Scratch》（《搓盘手》）**｜Doug Pray（导演）｜2001｜纪录片 —— 讲嘻哈 DJ 的纪录片：从延长唱片里的 break，到搓盘，再到 turntablism。
- **One9《Nas: Time Is Illmatic》**｜One9｜2014｜影片 —— 讲 Nas 做出 1994 年首张专辑《Illmatic》之前的经历，在专辑发行 20 周年时上映。
- **Charlie Ahearn《Wild Style》**｜Charlie Ahearn｜1982｜影片 —— 被视为第一部嘻哈电影，Grandmaster Flash 等人出镜。

---

### 谱系 6：Art Pop, City Pop & Synth（艺术流行、都会流行与合成器谱系：从先锋剧场到东京霓虹）

#### 进阶节点路径
1. **Art Rock（艺术摇滚）**
   - **单曲 (Single)**：Talking Heads — 〈Once in a Lifetime〉(1980) —— 非洲复节奏放克循环托起现代中产灵魂拷问：“你可能会问自己，我是怎么走到这一步的？”
   - **音乐家 (Musician)**：**Talking Heads（传声头乐队，David Byrne、Tina Weymouth 等，1975–1991，美国纽约）与 Brian Eno / David Bowie** —— 将纽约艺术学院观念艺术、极简主义、电子合成器与非洲律动嫁接，证明先锋实验同样能令人起舞。
   - **专辑 (Album)**：
     - *核心必听*：Talking Heads — **《Remain in Light》**(1980)（Brian Eno 监制，后朋克、Art Rock 与 Afrobeat 交融的巅峰）
     - *进阶延伸*：David Bowie — **《Low》**(1977)（柏林三部曲首篇，A 面破碎未来流行与 B 面阴郁电子环境音景改写摇滚构图）
2. **Japanese City Pop & Shibuya-kei（日本都会流行与涩谷系）**
   - **单曲 (Single)**：竹内玛莉亚 (Mariya Takeuchi) — 〈Plastic Love〉(〈プラスティック・ラブ〉, 1984) —— 山下达郎编曲制作，清脆放克吉他切分与都会午夜失恋伪装，在三十年后借互联网算法席卷全球。
   - **音乐家 (Musician)**：**山下达郎 (Tatsuro Yamashita，1953–，日本东京) 与 小山田圭吾 (Cornelius / Flipper's Guitar，1969–)** —— 前者承接细野晴臣 Happy End 脉络，将美式 Soul/AOR/Jazz-Fusion 打磨成晶莹剔透的东京海岸都会之声；后者在 90 年代涩谷外资唱片店浪潮中，将 Bossa Nova、法国电影配乐、Jangle Pop 与立体声拼贴玩成元流行艺术。
   - **专辑 (Album)**：
     - *核心必听*：山下达郎 (Tatsuro Yamashita) — **《For You》**(1982)（夏日海风与顶级录音室乐手律动交织的 City Pop 教科书；亦可同听细野晴臣、铃木茂、山下达郎合作的源头名盘《Pacific》1978 或大贯妙子《Sunshower》1977）
     - *进阶延伸*：Cornelius — **《Fantasma》**(1997)（涩谷系 Shibuya-kei 极繁拼贴与耳机立体声实验代表作；乐队阶段可溯至 Flipper's Guitar《Doctor Head's World Tower》1991）
3. **Chamber & Baroque Pop（室内流行与巴洛克流行）**
   - **单曲 (Single)**：The Beach Boys — 〈God Only Knows〉(1966) —— 法国圆号、羽管键琴、马铃薯雪橇铃与层叠天籁和声交织，是《Pet Sounds》里的一首。
   - **音乐家 (Musician)**：**Brian Wilson / The Beach Boys（布莱恩·威尔逊与海滩男孩，美国加州）与 Kate Bush / Weyes Blood** —— 把流行三分钟单曲升华为精密室内管弦建筑，用古典对位承载最私密的脆弱情感。
   - **专辑 (Album)**：
     - *核心必听*：The Beach Boys — **《Pet Sounds》**(1966)（Baroque Pop 开山宗师，以录音室为乐器的现代流行里程碑）
     - *进阶延伸*：Weyes Blood — **《Titanic Rising》**(2019)（水下卧室封面与恢弘胶片感弦乐共鸣的当代 Chamber Pop 复兴神作；及 Kate Bush《Hounds of Love》1985）
4. **Indietronica & Art Pop（独立电子与当代艺术流行）**
   - **单曲 (Single)**：Björk — 〈Jóga〉(1997) —— 冰岛火山地貌般的古典弦乐群与撕裂感电子碎拍并置，唱出超越理性的情感共振。
   - **音乐家 (Musician)**：**Björk（比约克，1965–，冰岛雷克雅未克）** —— 始终站在声学乐器、前沿数字电子（Matmos、Arca）与先锋视觉艺术交界处的当代 Art Pop 女祭司。
   - **专辑 (Album)**：
     - *核心必听*：Björk — **《Vespertine》**(2001)（以八音盒、竖琴、踩雪微采样与贴耳私语编织极北冬夜亲密宇宙）
     - **更正**：〈Jóga〉收录在《Homogenic》(1997)，不在《Vespertine》里。游戏里这张卡的专辑是《Homogenic》。
     - *进阶延伸*：Stereolab — **《Dots and Loops》**(1997)（将 Krautrock 律动、Bossa Nova 轻盈和声、复古模拟合成器与左翼哲学拼贴为一体的 Indietronica 典范）

#### 代表性音乐故事与文化资料（Art Pop, City Pop & Synth）
- **Jonathan Demme《Stop Making Sense》（《别讲道理》）**｜Jonathan Demme（导演）、Talking Heads｜1984｜演唱会电影 —— Talking Heads 的演唱会电影，1983 年 12 月在好莱坞 Pantages 剧院拍了四晚。
- **David Byrne《How Music Works》（《音乐是怎么起作用的》）**｜David Byrne｜2012｜书籍 —— Talking Heads 主唱 David Byrne 写的书，一半是自传，一半谈音乐本身。
- **Stephen Nomura Schible《Ryuichi Sakamoto: Coda》（《坂本龙一：终曲》）**｜Stephen Nomura Schible（导演）｜2017｜纪录片 —— 坂本龙一的纪录片，拍到他患癌后的生活和福岛核事故之后的环保行动。
- **栗本齐《「シティポップの基本」がこの100枚でわかる！》（《100 张唱片读懂 City Pop》）**｜栗本齐｜2022｜书籍 —— 用 100 张专辑介绍 City Pop 的一本书。
- **牧村宪一、藤井丈司、柴那典《渋谷音楽図鑑》（《涩谷音乐图鉴》）**｜牧村宪一、藤井丈司、柴那典｜2017｜书籍 —— 涩谷出身的音乐制作人牧村宪一与藤井丈司、柴那典合著，太田出版。

---

### 谱系 7：Folk, Psych & Regional Scenes（民谣、迷幻与在地场景谱系：从木吉他私语到热带主义、非洲节拍与打口青春）

#### 进阶节点路径
1. **60s–70s Folk Revival（六七十年代民谣复兴）**
   - **单曲 (Single)**：Nick Drake — 〈Pink Moon〉(1972) —— 清澈孤绝的特殊调弦原声吉他与简短钢琴过门，两分多钟道尽静夜苍凉预言。
   - **音乐家 (Musician)**：**Nick Drake（尼克·德雷克，1948–1974，英国沃里克郡）与 Bob Dylan / Joni Mitchell** —— 生前寂寂无名，身后却凭繁复温润的指弹技法与内省诗意成为全球独立民谣精神灯塔。
   - **专辑 (Album)**：
     - *核心必听*：Nick Drake — **《Pink Moon》**(1972)（仅凭一把木吉他、人声与一处钢琴叠录完成的纯粹室内民谣绝唱；北美自白派巅峰可同听 Joni Mitchell《Blue》1971）
     - *进阶延伸*：Bob Dylan — **《Highway 61 Revisited》**(1965)（民谣插电转向民谣摇滚与超现实长诗的历史分水岭）
2. **Indie & Freak Folk（独立民谣与怪诞民谣）**
   - **单曲 (Single)**：Neutral Milk Hotel — 〈Holland, 1945〉(1998) —— 过载破音的原声吉他狂扫与欢快悲怆交织的铜管军乐，唱出穿越二战梦魇的奇异生命力。
   - **音乐家 (Musician)**：**Neutral Milk Hotel（Jeff Mangum 领衔，美国路易斯安那/雅典城 Elephant 6 公社）与 Joanna Newsom** —— 以粗糙低保真录音与炽烈无伪的嗓音，将民谣从传统叙事推向超现实拼贴与巴洛克奇想。
   - **专辑 (Album)**：
     - *核心必听*：Neutral Milk Hotel — **《In the Aeroplane Over the Sea》**(1998)（90 年代末独立民谣传奇圣典）
     - *进阶延伸*：Joanna Newsom — **《Ys》**(2006)（踏板竖琴、Van Dyke Parks 管弦编配与五首史诗叙事长歌构筑的 Freak / Chamber Folk 奇峰）
3. **Tropicália（巴西热带主义与后波萨诺瓦浪潮）**
   - **单曲 (Single)**：Os Mutantes — 〈A Minha Menina〉(1968) —— Jorge Ben 桑巴律动撞上自制缝纫机踏板法兹迷幻吉他与戏谑怪声，灿烂而叛逆。
   - **音乐家 (Musician)**：**Caetano Veloso、Gilberto Gil 与 Os Mutantes（巴西巴伊亚/圣保罗，60 年代末）** —— 在巴西军政府独裁审查阴影下实践“文化食人主义”，将 Bossa Nova 传统、披头士迷幻摇滚与先锋混凝土诗歌熔为一炉。
   - **专辑 (Album)**：
     - *核心必听*：Os Mutantes — **《Os Mutantes》**(1968)（及运动宣言合辑《Tropicália ou Panis et Circencis》1968）
     - *进阶延伸*：Milton Nascimento & Lô Borges — **《Clube da Esquina》**(1972)（米纳斯吉拉斯州青年将巴西 MPB、迷幻民谣、爵士和声推向天际的双张神作）
4. **Zamrock & Afrobeat（赞比亚摇滚与非洲节拍）**
   - **单曲 (Single)**：Fela Kuti — 〈Zombie〉(1976) —— 层层推进的萨克斯铜管呼应、切分吉他与 Tony Allen 如蛛网般精密的多重鼓律，无畏嘲讽独裁军政府士兵。
   - **音乐家 (Musician)**：**Fela Kuti（费拉·库蒂，1938–1997，尼日利亚拉各斯）与 W.I.T.C.H.（Emanuel "Jagari" Chanda 领衔，赞比亚铜带省）** —— 前者与鼓王 Tony Allen 创立 Afrobeat；后者在赞比亚独立初期“本土音乐播出配额令”催化下，将 James Brown 放克、Jimi Hendrix 法兹迷幻与中南部非洲律动锻造成 Zamrock。
   - **专辑 (Album)**：
     - *核心必听*：Fela Kuti & Africa 70 — **《Zombie》**(1976)（Afrobeat 政治锋芒与催眠律动巅峰）
     - *进阶延伸*：W.I.T.C.H. — **《Lazy Bones!!》**(1975)（70 年代赞比亚铜矿区车库迷幻摇滚代表作）
5. **Chinese Folk & Dakou-era Rock（中国民谣与打口世代摇滚）**
   - **单曲 (Single)**：万能青年旅店 (Omnipotent Youth Society) — 〈杀死那个石家庄人〉(2010) —— 清冷木吉他叙事铺陈重工业国企家庭日常，中段小号如大雾突围般撕裂时代黄昏。
   - **音乐家 (Musician)**：**窦唯 (Dou Wei，1969–，北京)、野孩子 (张佺、索文俊等，1995–，兰州) 与 万能青年旅店 (董亚千、姬赓等，石家庄)** —— 从 90 年代塑料切口“打口磁带/CD”地下启蒙出发，一条脉络沿黄河民间信天游生出土地民谣（野孩子、周云蓬），另一条脉络消化后朋克、前卫摇滚与爵士铜管，凝结出当代中国城市与工业锈带的声音史诗。
   - **专辑 (Album)**：
     - *核心必听*：窦唯 — **《黑梦》**(1994)（窦唯离开黑豹后的首张个人专辑，带后朋克与梦幻流行色彩）
     - *进阶延伸*：万能青年旅店 — **《万能青年旅店》**(2010)（乐队 2010 年的同名首张专辑；西北民谣脉络可同听野孩子《咒语》1999 与周云蓬《中国孩子》2007）

#### 代表性音乐故事与文化资料（Folk, Psych & Regional Scenes）
- **高原《把青春唱完：1990–1999 中国摇滚与一个文化群体的生活影像》**｜高原｜2015｜摄影纪实/书籍 —— 摄影师高原拍下的 1990 年代中国摇滚台前幕后，中信出版社出版。
- **颜峻《内心的噪音》**｜颜峻｜2001｜书籍 —— 颜峻的乐评集，收有《崔健之后》《摇滚乐在中国的可能性》等文章。
- **Jeroen de Kloet《China with a Cut: Globalisation, Urban Youth and Popular Music》**｜Jeroen de Kloet｜2010｜书籍 —— 一本研究全球化、城市青年与中国流行音乐的书。
- **Ruy Castro《Chega de Saudade》（英译《Bossa Nova: The Story of the Brazilian Music That Seduced the World》，《波萨诺瓦史》）**｜Ruy Castro｜1990（英译 2000）｜书籍 —— 游戏没有采用：它讲的不是游戏里任何一张唱片的音乐家或流派。原稿的介绍没有核对，已删去。
- **Marcelo Machado《Tropicália》（《热带主义》）**｜Marcelo Machado（导演）｜2012｜纪录片 —— 大量用档案影像讲 1967–1969 年的热带主义运动，Caetano Veloso、Gilberto Gil、Tom Zé 和 Os Mutantes 的成员出镜。
- **Alex Gibney《Finding Fela》（《寻找费拉》）**｜Alex Gibney（导演）｜2014｜纪录片 —— 讲尼日利亚音乐家 Fela Kuti 生平的纪录片，2014 年在圣丹斯电影节首映。
- **Martin Scorsese《No Direction Home: Bob Dylan》（《没有方向的家》）**｜Martin Scorsese（导演）｜2005｜纪录片 —— 讲 Bob Dylan 从 1961 年到纽约，到 1966 年摩托车事故后停止巡演的这几年；片名出自〈Like a Rolling Stone〉的歌词。

---

### 谱系 8：Heavy, Industrial & Avant-Garde（重型、工业与前卫金属谱系：从伯明翰铁砧到粉红自赏黑金属）

#### 进阶节点路径
1. **Heavy Psych & Doom（重型迷幻与厄运金属）**
   - **单曲 (Single)**：Black Sabbath — 〈Paranoid〉(1970)（及同名慢速咒语〈Black Sabbath〉1970） —— 疾驰下拨强力和弦与雨夜钟声三全音（魔鬼音程），直接宣告重金属纪元降临。
   - **音乐家 (Musician)**：**Black Sabbath（黑色安息日，Tony Iommi、Ozzy Osbourne、Geezer Butler、Bill Ward，1968–2017，英国伯明翰）** —— 吉他手 Tony Iommi 因钣金工厂事故伤及指尖而调松琴弦降调演奏，无意间锻造出浑厚阴沉的 Doom 与 Heavy Metal 母体。
   - **专辑 (Album)**：
     - *核心必听*：Black Sabbath — **《Paranoid》**(1970)（重金属与重型迷幻不朽基石）
     - *进阶延伸*：Electric Wizard — **《Dopethrone》**(2000)（将降调法兹放大器开至震耳欲聋的 Stoner / Doom Metal 泥沼神作；东亚重迷幻先驱可溯及日本 Flower Travellin' Band《Satori》1971）
2. **Post-Metal（后金属）**
   - **单曲 (Single)**：Isis — 〈So Did We〉(2004) —— 沉重污泥金属吉他律动与清澈延迟空间旋律层层铺展，如巨浪拍岸般恢弘悲壮。
   - **音乐家 (Musician)**：**Isis（Aaron Turner 等，1997–2010，美国波士顿/洛杉矶）与 Neurosis** —— 摒弃传统金属炫技独奏，引入后摇滚的耐心留白、建筑感递进与福柯式全景敞视社会隐喻。
   - **专辑 (Album)**：
     - *核心必听*：Isis — **《Panopticon》**(2004)（大气后金属 Atmospheric Sludge / Post-Metal 的代表专辑）
     - *进阶延伸*：Neurosis — **《Through Silver in Blood》**(1996)（部落双鼓与工业末世压迫感交织的后金属开山巨石）
3. **Industrial（工业音乐与工业摇滚）**
   - **单曲 (Single)**：Nine Inch Nails — 〈Closer〉(1994)（或〈Head Like a Hole〉1989） —— 采样自 Iggy Pop 鼓点的机械脉冲层层失真堆叠，危险、性感而充满自我毁灭张力。
   - **音乐家 (Musician)**：**Nine Inch Nails（Trent Reznor，1988–至今，美国俄亥俄）与 Throbbing Gristle（英国伦敦/赫尔，1975–1981）** —— 前者将地下工业噪音淬炼为震撼全球的概念摇滚录音室杰作；后者创立 Industrial Records，以“为工业时代制造工业音乐”之名掀起反艺术声音游击战。
   - **专辑 (Album)**：
     - *核心必听*：Nine Inch Nails — **《The Downward Spiral》**(1994)（90 年代工业摇滚概念杰作，连接主流另类与极端声音实验）
     - *进阶延伸*：Throbbing Gristle — **《20 Jazz Funk Greats》**(1979)（甜美海崖封面下包裹着尸检房般合成器噪音与扭曲律动的初代工业圣典；德国废铁打击乐脉络可同听 Einstürzende Neubauten《Halber Mensch》1985）
4. **Blackgaze（黑自赏与前卫极端重型）**
   - **单曲 (Single)**：Deafheaven — 〈Dream House〉(2013) —— 高速暴风雪般的黑金属轮拨吉他与凄厉黑嗓，却在大调和弦推进中绽放出夺眶而出的灿烂阳光。
   - **音乐家 (Musician)**：**Alcest（Neige / Stéphane Paut，2000–至今，法国）与 Deafheaven（George Clarke、Kerry McCoy 等，2010–至今，美国旧金山）** —— 打破挪威黑金属森严的地下教条，将 My Bloody Valentine 与 Mogwai 式的自赏/后摇音墙无缝嫁接进极端金属。
   - **专辑 (Album)**：
     - *核心必听*：Deafheaven — **《Sunbather》**(2013)（粉橙渐变封面，Blackgaze 的代表专辑）
     - *进阶延伸*：Alcest — **《Écailles de lune》**(2010)（确立 Blackgaze 海洋月光意象的法式奠基之作；若进一步迈向纯粹前卫重型无人机音墙，可延伸至日本乐队 Boris《Feedbacker》2003）

#### 代表性音乐故事与文化资料（Heavy, Industrial & Avant-Garde）
- **S. Alexander Reed《Assimilate: A Critical History of Industrial Music》（《同化：工业音乐批判史》）**｜S. Alexander Reed｜2013｜书籍 —— 牛津大学出版社出版的工业音乐史，从意大利未来主义、William S. Burroughs 这些早期影响写到当下。
- **V. Vale & Andrea Juno《RE/Search #6/7: Industrial Culture Handbook》（《工业文化手册》）**｜V. Vale、Andrea Juno（编）｜1983｜访谈档案/口述史 —— RE/Search 出版的访谈集，收有 Throbbing Gristle、Cabaret Voltaire、SPK 等人的访谈。
- **Julian Cope《Japrocksampler: How the Post-War Japanese Blew Their Minds on Rock 'n' Roll》（《日本摇滚采样志》）**｜Julian Cope｜2007｜书籍 —— 游戏没有采用：它讲的不是游戏里任何一张唱片的音乐家或流派。原稿的介绍没有核对，已删去。
- **Dayal Patterson《Black Metal: Evolution of the Cult》**｜Dayal Patterson｜2013｜书籍 —— 讲黑金属的演变：从第一张 Black Sabbath 专辑写起，经过挪威，再到其他国家的场景。
- **Aaron Aites & Audrey Ewell《Until the Light Takes Us》**｜Aaron Aites、Audrey Ewell（导演）｜2008｜纪录片 —— 游戏没有采用：它讲的是早期挪威黑金属，和游戏里的 Blackgaze 唱片只在流派上沾边，讲的不是其中任何一位音乐家。

---

## 四、通关结算：玩家人格 (End-of-Game Persona)

游戏固定九张唱片。结束时的人格只看玩家收下了哪些唱片，规则写在代码仓库的 `src/engine/persona.ts`，人格名单在 `src/data/catalog.json`：

- 一张也没收下：**空手过关的旅客**
- 收下的流行曲比任何一条谱系的都多：**电台流行听众**
- 三条或更多谱系各收下一张、没有哪条领先：**什么都听的唱片店员**
- 其余情况取收下最多的那条谱系；并列时取先收下的那条：
  1. **午夜蓝音萨克斯手** —— `Jazz`
  2. **后工业暗房贝斯手** —— `Punk & Post-Punk`
  3. **混响踏板筑梦师** —— `Indie, Shoegaze & Post-Rock`
  4. **凌晨四点模组炼金师** —— `Electronic & Club`
  5. **地下唱片箱挖掘者** —— `Hip-Hop & Beats`
  6. **霓虹录音室建筑师** —— `Art Pop, City Pop & Synth`
  7. **无国界吟游者** —— `Folk, Psych & Regional`
  8. **音墙锻铁匠** —— `Heavy, Industrial & Avant-Garde`
