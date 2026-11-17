# Contributing

Thanks for helping make Urza's Abacus better. Bug reports, ideas, and code are all welcome.

## Reporting a bug or suggesting a feature

Open an [issue](../../issues/new/choose) and pick **Bug report** or **Feature request**. For bugs, these details help most:

- the tablet and browser (for example "iPad Air, Safari" or "Galaxy Tab S9, Chrome")
- the layout (2P, 3P, or 4P Ends / Sides / Around)
- what you tapped, what you expected, and what happened instead
- a screenshot, if you can

## Making a change

There's no build step and nothing to install.

1. Fork the repository and clone it, or download the ZIP.
2. Open `app/index.html` in your browser.
3. Edit a file, save, and reload the page.
4. Test on a portrait tablet-sized screen using your browser's device toolbar (Chrome: F12 → the device icon, e.g. iPad Air 820 × 1180), in 2P, 3P, and all three 4P layouts.
5. Open a pull request describing what you changed and why.

## Where things go

The app lives in `app/`. The `index.html` at the top level is the project website: a single page with its pictures in `images/site/`.

The app is organized as **Model–View–Controller**. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) first; the short version:

| If you want to… | Edit |
|---|---|
| Change a rule (starting life, lethal damage, tax step, seat names or colors) | `app/js/config.js` |
| Change how the game behaves (what a tap does to the numbers) | `app/js/models/` |
| Change what's shown or how a tap is detected | `app/js/views/` and the templates in `app/index.html` |
| Connect a new button to a new model action | `app/js/controllers/` |
| Change how something looks | `app/css/` |
| Change how commanders are searched or which printing's art is used | `app/js/models/CommanderCatalog.js` and the `SCRYFALL_*` settings in `app/js/config.js` |

**Keep the layers separate.** Models never touch the page, views never change game data, and controllers stay thin.

## Adding a new file

The app uses plain `<script>` tags instead of JavaScript modules, so it still works when `app/index.html` is opened straight from a folder. Each file adds its class to the shared `EDH` object:

```js
(function (EDH) {
  'use strict';

  class MyThing { /* ... */ }

  EDH.MyThing = MyThing;
})(window.EDH = window.EDH || {});
```

Then add a `<script>` tag for it in `app/index.html`, in the right group. The order is config → utils → models → views → controllers → app.

## Code style

- Plain modern JavaScript (ES2020), two-space indents, `'use strict'` in every file.
- Classes in `PascalCase`, files named after their class.
- Short comments that say *why*, not *what*.
- Escape anything shown with `innerHTML` using `EDH.dom.escapeHtml`.
- Wrap `localStorage` in `EDH.storage`, never call it directly.
- Colors and sizes come from the CSS variables in `app/css/base.css` where possible.

## Before opening a pull request

Check that:

- [ ] nothing shows in the browser console (F12 → Console)
- [ ] 2P, 3P, and the three 4P layouts (Ends, Sides, Around) all work on a portrait tablet-sized screen, e.g. 820 × 1180 and 744 × 1133
- [ ] the app still works when opened by double-clicking `app/index.html`
- [ ] if you touched Scryfall requests: they stay at least 100 ms apart, and the picker still behaves when offline
- [ ] any new behavior is described in `CHANGELOG.md` under an *Unreleased* heading
- [ ] the README is updated if what players see has changed

## License

By contributing, you agree that your contribution is released under the project's [MIT License](LICENSE).
