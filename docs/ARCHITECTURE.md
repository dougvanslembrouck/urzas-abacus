# Architecture

How Urza's Abacus's code fits together, for anyone changing it. The app lives in `app/`, and every path below is inside that folder. The `index.html` at the top of the repository is the project website, which is separate from the app.

## The big picture

The app is plain HTML, CSS, and JavaScript organized as **Model–View–Controller (MVC)**:

| Layer | Job | Never does |
|---|---|---|
| **Models** (`js/models/`) | Hold the data and enforce the rules | Touch the page |
| **Views** (`js/views/`) | Draw the screen and report taps | Change game data or apply rules |
| **Controllers** (`js/controllers/`) | Turn taps into model updates and redraw views | Hold state of their own |

`js/app.js` creates one of each and connects them. It's the only file that knows about all three layers.

## What happens when you tap

Gaining 1 life, step by step:

```
 You tap the right half of the life area
        │
        ▼
 PlayerCardView      sees a click on [data-action="life"][data-step="1"]
        │            calls its handler: onLife(+1)
        ▼
 GameController      calls gameModel.changeLife(seat, +1)
        │
        ▼
 GameModel           checks the rules (eliminated players can't change life),
        │            updates the number, emits "change"
        ▼
 GameController      hears "change", calls boardView.render(model)
        │
        ▼
 BoardView           asks every PlayerCardView to redraw from the model
```

Every interaction follows this loop. Views report, controllers translate, models decide, views redraw.

## Models

### `GameModel`
Everything about the game in progress.

| State | Meaning |
|---|---|
| `playerCount` | 2, 3, or 4 |
| `fourPlayerLayout` | `ends`, `sides`, or `around`; saved on the device |
| `layout` (getter) | The board's layout: `2`, `3`, or the 4P layout |
| `monarchId` | Seat number of the monarch, or `null` |
| `players[id].name` | What the player typed, or the commander's name |
| `players[id].life` | Life total |
| `players[id].isDead` | Eliminated or not |
| `players[id].commanderTax` | Commander tax, in steps of `COMMANDER_TAX_STEP` |
| `players[id].commanderDamage[fromId]` | Damage taken from each opponent's commander |
| `players[id].commander` | A commander from `CommanderCatalog`, or `null`. Right after a pick it's `{ name, colors }` until the art lookup fills in the rest |

Rules it enforces:
- Eliminated players can't change life, commander damage, tax, or take the crown.
- Commander damage can't go below 0, and every point of it also changes life.
- Only one monarch. An eliminated monarch, or one whose seat leaves the table, loses the crown.
- Picking a commander renames the seat. Choosing the land background again restores the default name, unless the player typed their own.
- `resetGame()` resets life, damage, eliminations, tax, and the monarch, and keeps names, commanders, and layout.
- `buildMatchRecord()` decides the winner: the last player standing, or else the surviving player(s) with the highest life.

It saves each seat's commander to `localStorage` and restores them with `restoreCommanderChoices()`.

### `HistoryModel`
The list of logged games, newest first, saved under the `edh_match_history` key. It handles `add`, `importFromJSON`, `exportToJSON`, and `clear`, and emits `change` after each.

### `CommanderCatalog`
The app's connection to Scryfall. Nothing is bundled or downloaded ahead of time; every search goes to Scryfall live. It provides:

| Method | What it does |
|---|---|
| `canSearch(query)` | Whether the text is long enough to search (2+ letters) |
| `search(query, signal)` | Returns `{ results: [{ name, colors }], more }` for commander-legal paper cards |
| `findStandardPrinting(name)` | Returns a full commander, `{ name, scryfallId, artist, colors, art }`, from its standard printing (cached for the session) |
| `artUrl(commander)` | The art image link (only `cards.scryfall.io` links are trusted) |

Search normalizes text by lowercasing it and removing accents and apostrophes, so `T'Challa` matches `tchalla`. It then requires every typed word to match the start of a word in the name, so `thing` finds The Thing but not "Seething".

## Views

Views build their elements from the `<template>` blocks in `index.html` and use `data-role` / `data-action` attributes rather than IDs to find parts.

| View | Element | Handlers it calls |
|---|---|---|
| `BoardView` | `#board` | creates one `PlayerCardView` per seat |
| `PlayerCardView` | one `.player-card` | `onLife`, `onCommanderDamage`, `onToggleDead`, `onToggleMonarch`, `onTax`, `onNameInput`, `onOpenPicker` |
| `CommanderPickerView` | the picker inside a card | `onQuery`, `onPick(name, colors)`, `onClose` |
| `HudView` | `#hud` and `#layout-chooser` | `onPlayerCount`, `onFourPlayers`, `onFourPlayerLayout`, `onReset`, `onLogGame`, `onOpenHistory` |
| `HistoryView` | `#history-panel` | `onExport`, `onImportFile`, `onClear`, `onClose` |

`render()` redraws a view from the model and is safe to call after every change. It never overwrites a name the player is in the middle of typing, and it only reloads commander art when the commander changes. `PlayerCardView` preloads commander art and keeps the land background if the image fails to load.

## Controllers

| Controller | Connects |
|---|---|
| `GameController` | card taps and the 2P/3P/4P, layout chooser and Reset buttons → `GameModel`; redraws the board on every change. Tapping 4P goes straight to the remembered layout, or opens the chooser if 4P is already showing or nothing has been chosen yet |
| `CommanderController` | the picker → `CommanderCatalog` search → `GameModel.setCommander` |
| `HistoryController` | Log Game → `GameModel.buildMatchRecord()` → `HistoryModel`; the history panel's buttons |

Several controllers can bind to the same view. `bind()` merges handlers, so `GameController` and `HistoryController` both bind to `HudView`.

## Shared helpers (`js/utils/`)

- `emitter.js`: `on(event, fn)` / `emit(event)`. Models extend it.
- `storage.js`: `readJSON` / `writeJSON` around `localStorage` that never throw, for private windows or blocked storage.
- `dom.js`: `escapeHtml`, template cloning, `confirm` / `notify` wrappers, file download and file reading.
- `mana.js`: turns a color identity string (`"RW"`, `""` for colorless) into mana pips in printed-card order. `PlayerCardView` shows them under the tax counter and `CommanderPickerView` beside each result. Symbols load from `svgs.scryfall.io`; offline, each pip shows its letter on a colored circle.

## Styles (`css/`)

One file per part of the screen, loaded in this order: `base`, `layout`, `player-card`, `commander-picker`, `hud`, `history`. Seat placement uses `[data-players]` on the board and `[data-seat]` on each card.

Two details worth knowing:

- **Container queries.** Each card is a size container. The life total uses `cqw` units so it scales with the card.
- **Tablet only.** The app is designed for a portrait tablet. There are no phone-specific rules.
- **Layouts.** `BoardView` sets `data-players` and `data-layout` on the board (`2`, `3`, `ends`, `sides`, `around`). `ends`, 2P and 3P are CSS grids with seats turned 180°. `sides` and `around` turn cards 90°: since a grid cell can't swap its width and height, those cards are positioned absolutely on the board, sized to what they'll be once turned (`--w`, `--h` from `vw`/`vh`), centered on their cell (`--cx`, `--cy`), and rotated (`--rot`). In `around`, the top and bottom bands switch to a two-column grid: life on the left, commander damage on the right.
- **The bar follows the seam.** `HudView` copies the layout onto the bar, and in `sides` / `around` it turns 90° to lie along the vertical seam that every sideways card's top edge faces. The 4P chooser lives outside the bar so it never turns, and its diagrams always match the tablet.
- **The centered bar.** `--hud-height` is defined in `hud.css`. Cards and the commander picker add half of it to their top padding, because every card's top edge faces the center of the table.

## Why plain scripts instead of ES modules

Browsers refuse to load `import` / `export` modules from a page opened as a local file (`file://`). To keep "double-click `index.html` and play" working, each file is a plain script that adds its class to one shared `EDH` object, and `index.html` loads them in dependency order:

```
config → utils → models → views → controllers → app
```

## Saved data

| Key | Contents |
|---|---|
| `edh_match_history` | Array of match records (format in the README) |
| `urzas_abacus_4p_layout` | The chosen 4P layout: `"ends"`, `"sides"` or `"around"` (v2.1.1+) |
| `edh_player_commanders` | `{ "1": { "name": "Kirk, Commanding Officer", "scryfallId": "245d0430-…", "artist": "Cliff Nielsen", "colors": "RW", "art": "https://cards.scryfall.io/art_crop/…" }, "2": null, … }` |

The two `edh_` keys are the same as in v1.x, and were kept through the rename to Urza's Abacus so nobody loses data. The JavaScript namespace is still `EDH` for the same reason: it's internal and renaming it would only add risk. v2.0 saved commanders as plain names; v2.1 reads those and looks them up on Scryfall once, then saves the full object.

## Talking to Scryfall

All commander data comes from the [Scryfall API](https://scryfall.com/docs/api) at the moment it's needed.

**Searching** (`GET /cards/search`, `unique=cards`, `order=name`):
```
is:commander game:paper legal:commander name:<word> name:<word> …
```
Scryfall's `name:` filter ignores punctuation and accents and matches anywhere in a name. The app then keeps only names where each word starts a word, and ranks names that start with the query first. One page (up to 175 cards) is plenty once two letters are typed; when Scryfall has more, the picker asks the player to keep typing.

**Picking** (`GET /cards/search`, `unique=prints`, `order=released`, `dir=desc`):
```
!"<exact name>" game:paper is:nonfoil not:promo -is:boosterfun -frame:showcase -frame:extendedart -frame:etched
```
From the newest release day, the app prefers a bordered printing over a borderless alternate (Scryfall doesn't tag those as special; most Star Trek commanders have one), then the lowest collector number. If no printing qualifies, it falls back to `GET /cards/named?exact=<name>`, Scryfall's default printing. The artist comes from the printing shown; on double-faced cards, from the front face.

**Being a good API citizen**
- Requests are at least `SCRYFALL_REQUEST_GAP_MS` (100 ms) apart, as Scryfall asks.
- The picker waits `COMMANDER_SEARCH_DELAY_MS` (300 ms) after typing stops, and cancels a search that's been overtaken by newer typing (`AbortController`).
- Standard-printing lookups are cached for the session.
- Searching starts at 2 letters.

**When Scryfall can't be reached**, the picker shows a message, saved commanders keep their names (and their art if the image loads), and seats without art fall back to their land background.
