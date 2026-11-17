# Changelog

All notable changes to Urza's Abacus (called the NJA EDH Pod Life Tracker up to v2.1.0). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **AlphaCryptids AI art disclosure.** The AlphaCryptids V1 art was made with Midjourney. A new website page (`disclosure.html`), `AI_DISCLOSURE.md` and `alphacryptids-v1-sources.csv` list the prompt, seed, job and original image for all 26 cards. The giveaway section, the site footer and the README link to it.

## [2.1.1] – 2026-11-13

### Added
- **Project website.** A single-page site at the root of the repository explains every feature, with a live player card to try, the three 4P layouts, and an **Open the app** button. Its pictures are in `images/site/`.
- **Three four-player layouts.** Tapping **4P** opens a chooser with a diagram of each:
  - **Ends:** two players at each short end (the layout from earlier versions).
  - **Sides:** two players along each long side, cards turned 90°.
  - **Around:** one player on each side. Full-width bands at the top and bottom, two side seats in the middle, all the same size. The bands show life on the left and commander damage on the right.
- The chosen 4P layout is remembered on the tablet. **4P** goes straight to it, and tapping **4P** during a four-player game reopens the chooser.
- In Sides and Around, the center bar turns to lie along the middle seam, which every sideways card's top edge faces.
- Tapping outside the chooser closes it without changing anything underneath.
- **Commander color identity.** Each seat shows its commander's color identity as mana symbols, right under the commander tax counter. Pips use printed-card order (Boros {R}{W}, Esper {W}{U}{B}), colorless commanders show {C}, and land-background seats show none.
- Pips appear the moment a commander is picked, using the colors from the search result, before the art finishes loading.
- The commander search results use the same mana symbols in place of the old colored dots.
- Offline, each pip falls back to a colored circle with its letter.
- App icon (`favicon.svg`) and home-screen name, so "Add to Home Screen" is labeled *Urza's Abacus*.
- Bug report and feature request templates in `.github/ISSUE_TEMPLATE/`.

### Changed
- **The app moved to `app/`.** The root URL now shows the website, and the app is at `…/urzas-abacus/app/`. Nothing inside the app changed, and saved history, commander picks and layout choice carry over on the same site.
- **Tablet only.** Urza's Abacus is now designed for a tablet in portrait. The phone-specific tweaks (compact control bar, stacked commander line on narrow cards) are gone, and the docs and issue forms talk about tablets.
- **New name: Urza's Abacus.** The app, page title, README, docs, and release notes now use the new name. The repository moves to `urzas-abacus`.
- Exported history files are named `urzas-abacus-history_<time>.json`. Older `edh_match_history_*.json` exports still import.
- Saved data keys (`edh_match_history`, `edh_player_commanders`) are unchanged, so history and commander picks carry over.

### Removed
- Leftover v1.x files from the top-level folder: `commanders.js`, the five land PNGs, three old screenshots, and the v1.0.0 / v1.1.0 zips.
- `data/commanders.js` and `tools/update-commanders.html`, which v2.1.0 retired but were still in the folder.
- Unused v1 screenshots, the phone screenshots, and a duplicate v1.1.0 release page. New tablet screenshots show the three 4P layouts and the chooser.

## [2.1.0] – 2026-11-13

### Changed
- **Live commander search.** The commander picker now searches Scryfall directly instead of a bundled list, so new commanders appear as soon as Scryfall lists them. That includes the Star Trek and Star Trek Commander sets: about 3,750 commanders, up from 3,497.
- Searching starts after 2 letters and a short pause in typing, shows "Searching Scryfall…", and cancels searches that newer typing has replaced. Requests stay at least 100 ms apart, as Scryfall asks.
- Picking a commander shows its name right away, then fills in the art and artist.
- Commander picks are saved with their artist and art link, so they come back even without internet. Picks saved by v2.0 are looked up once and upgraded automatically.
- **Art choice:** when several standard printings came out the same day, a bordered printing beats a borderless alternate, then the lowest collector number. For example, Kirk, Commanding Officer now uses its regular printing by Cliff Nielsen.
- Double-faced commanders credit the artist of the face shown, not both faces.
- When art can't load, the card says "Art couldn't load" instead of "Art unavailable offline".

### Removed
- `data/commanders.js` (the bundled list) and `tools/update-commanders.html` (the tool that rebuilt it). Nothing needs updating by hand anymore.

### Note
- Commander search now needs internet. Everything else still works offline.

## [2.0.0] – 2026-11-03

A rebuild of the whole app into a Model–View–Controller structure, plus a reworked table layout. Saved match history and commander picks from v1.x carry over.

### Added
- **Tap-to-change life.** Tap anywhere on the right half of the life area to gain 1, and the left half to lose 1. Faint `−` / `+` marks show the sides. Rotated seats use the player's own left and right.
- **Commander names on seats.** Picking a commander renames the seat on its card and in every opponent's commander damage rows. Choosing the land background again restores the default name, unless the player typed their own.
- **Centered control bar.** 2P / 3P / 4P, Reset, Log Game, and History now sit in the exact center of the screen, where the seats meet. Cards and the commander search leave room for it.
- `js/config.js` with all rules and seat settings in one place (starting life, lethal damage, tax step, seat names and colors).
- `docs/ARCHITECTURE.md`, `CONTRIBUTING.md`, issue templates, and an MIT `LICENSE`.
- Accessibility labels on the life areas, commander damage buttons, and commander search.
- Reduced-motion support: animations turn off when the device asks for less motion.

### Changed
- **MVC architecture.** The single 1,250-line `index.html` is split into models (`GameModel`, `HistoryModel`, `CommanderCatalog`), views (`BoardView`, `PlayerCardView`, `CommanderPickerView`, `HudView`, `HistoryView`), and controllers (`GameController`, `CommanderController`, `HistoryController`).
- **Organized folders.** Styles in `css/`, scripts in `js/`, the commander list in `data/`, images in `images/lands/` and `images/screenshots/`.
- The player card is defined once as an HTML template instead of being repeated four times.
- **Bigger life total:** up to 96px (from 80px), scaling down on narrow cards.
- The round `+` / `—` life buttons are replaced by the tap areas.
- The control bar is more compact on phones, so all six buttons fit.
- Long names end in "…" in the card header and damage rows instead of being cut off.
- Match history doesn't repeat the commander when it's already the player's name.
- Clearer messages for logging, exporting, and importing.
- The commander updater now tells you to save the list to `data/commanders.js`.

### Fixed
- **Winner detection.** An eliminated player's life total no longer blocks the win. Previously, if an eliminated player had more life than every survivor, no winner was recorded.
- **Phone 4P layout.** The life total no longer spills off the card, and the control bar no longer runs off the screen.

### Upgrading from v1.x
Replace the whole folder with this release. The old root-level files (`commanders.js`, `plains.png`, `mountain.png`, `forest.png`, `forest-cropped.png`, `swamp.png`) are no longer used.

## [1.1.0] – 2026-10-20

### Added
- **Commander art backgrounds.** Search about 3,500 commander-legal cards and use the card's art as the seat background, with artist credit. Art comes from each commander's newest standard printing.
- **Monarch toggle.** A crown on each card; only one monarch at a time.
- **Commander tax counter** in steps of 2.
- `tools/update-commanders.html` to rebuild the commander list from Scryfall.
- Match history records each player's commander, the monarch, and commander tax.

### Changed
- On narrow cards, the commander button and tax counter stack.

### Fixed
- Player names in match history are displayed safely, so special characters can't break the page.

## [1.0.0] – 2026-10-19

First release.

- Life tracking for 2, 3, or 4 players, starting at 40, with seats rotated to face each player.
- Commander damage per opponent that also adjusts life, with a warning at 21.
- Editable player names that update everywhere.
- I'm Dead / Undo eliminations.
- Reset that keeps names and layout.
- Match history with winners, plus JSON export, import, and clear.
- Basic-land backgrounds (Plains, Mountain, Forest, Swamp) for the four seats.

[2.1.1]: https://github.com/dougvanslembrouck/urzas-abacus/releases/tag/v2.1.1
[2.1.0]: https://github.com/dougvanslembrouck/urzas-abacus/releases/tag/v2.1.0
[2.0.0]: https://github.com/dougvanslembrouck/urzas-abacus/releases/tag/v2.0.0
[1.1.0]: https://github.com/dougvanslembrouck/nja-mtg-life-tracker
[1.0.0]: https://github.com/dougvanslembrouck/nja-mtg-life-tracker
