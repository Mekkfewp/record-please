# Ten-decade extension (parked)

Stopped on 2026-11-24 when the scope changed to one slice (1980s, UK and US). Nothing here is shipped and the
tree does not build: the code expects `eras[].start/end/caption/sources` and `unfilled`, which the catalog does
not have yet.

Done in code: decades of music instead of birth decades (`EraId`, `Era.start/end/caption/sources`), singles
without an album (`Album.kind`), cells that may be listed as `unfilled` and are greyed out on the start screen,
validator rules for all of that, matcher support for singles.

Not done: the catalog itself (eras, 70 cells, about 80 new entry cards), tests, e2e.

Candidate search (`cand.mjs`, `list1.json` -> `out1.txt`; `list2.json` was never run). Recordings found on Apple
(Hong Kong / Taiwan stores) that looked like the originals but were not yet cross-checked:

- 周璇〈天涯歌女〉(1937 film song): EMI/Pathé reissues, e.g. hk 724705036
- 姚莉〈玫瑰玫瑰我爱你〉(1940): hk 720236040
- 葛蘭〈我要你的愛〉: hk 727598338 (year not yet sourced)
- 姚蘇蓉〈今天不回家〉(1969): tw 1854943544
- 鄧麗君〈月亮代表我的心〉(1977): hk 1443430112
- 羅大佑〈鹿港小鎮〉(1982): tw 1720705000
- 許巍〈藍蓮花〉(2002): hk 905191009

Not found or not verifiable: 純純〈望春風〉(1933) is not on Apple; 郭兰英〈我的祖国〉, 王玉珍〈洪湖水浪打浪〉,
才旦卓玛〈唱支山歌给党听〉and 李谷一〈乡恋〉exist only on later collections with no way to tell which recording
they carry.

Captions and their sources for the ten decades are in the design study (`game-design-v3.md`, section 3, as of
this date).
