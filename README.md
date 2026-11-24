# 请出示唱片 Record, Please

A small pixel-style music game. Pick the decade you were born in and where you are from, hear nine records one at a time, keep or skip each, and leave with a playlist and a listener persona.

## Run

```
npm install
npm run dev        # development server
npm run build      # validates the catalog, type-checks, builds to dist/
npm run preview    # serves dist/ on port 4173
npm test           # catalog rules, game rules, preview player, link choice, font coverage
npm run test:e2e   # builds, then plays the game in Chrome and checks the screen against the catalog
npm run lint
```

## Publishing

Every push to `main` runs the lint, the tests and the browser run, and if they pass deploys `dist/` to GitHub Pages (`.github/workflows/deploy.yml`). The build uses relative asset paths (`base: './'` in `vite.config.ts`), so the same build works at a domain root and under a sub-path such as `/record-please/`.

## How it works

- `src/data/catalog.json` is the only source of content: cards (one recording each), artists, albums, the decade × region entry cards, lineages, books and films, personas. `npm run validate` enforces its rules and the build fails without it.
- `src/engine/game.ts` is the whole game as one pure function: which card comes next, when the game ends. `src/engine/persona.ts` reads the persona off the kept cards. Both are covered by `tests/`.
- `src/components/` holds the three screens: start, booth, result.
- `e2e/play.mjs` plays every decade × region to the end in a real browser. It needs Google Chrome (or `CHROME_PATH`) and network access to Apple. `E2E_URL=<address> node e2e/play.mjs` plays a copy that is already being served; `--shots <dir>` saves screenshots.

## Music data

Every card is pinned to a recording in Apple's catalogue.

```
npm run match      # match cards against the iTunes Search API (pins live in scripts/apple-hints.json)
npm run match:cn   # record which songs Apple's mainland China store carries
```

`scripts/apple-match-report.json` keeps what was matched and why, for review. `scripts/crosscheck-musicbrainz.mjs` adds a second opinion from MusicBrainz.

Previews are streamed from Apple and never stored; covers are loaded from Apple at a small size and shown enlarged. Both sit next to Apple's "Listen on Apple Music" badge and credit line, as Apple's Search API terms ask. Read those terms before publishing a copy of this game.

## Credits

- 30-second previews and cover art: provided courtesy of iTunes.
- Font: [Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font), SIL Open Font License 1.1. Licence texts are in `public/fonts/`.

## Font

The game ships a subset of the font: only the characters the catalog and the UI can show (about 22 KB instead of 680 KB). The full font is in `fonts-src/`. After adding text with new characters, run

```
npm run font:subset   # needs fonttools: pip install fonttools brotli
```

`npm test` fails when the shipped font lacks a character the game can show.
