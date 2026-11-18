/* =========================================================
   HudView (View)
   The floating control bar: 2P / 3P / 4P, Reset,
   Log Game and History, plus the 4P layout chooser
   that opens from the 4P button.
   ========================================================= */
(function (EDH) {
  'use strict';

  const { escapeHtml } = EDH.dom;

  /* ---- Mini table diagrams for the chooser (portrait tablet seen from above) ---- */

  // A player at the edge of the tablet: shoulders on the edge, head just inside.
  // (x, y) is where they meet the edge; (dx, dy) points into the tablet.
  function person(x, y, dx, dy) {
    const r = 4.5;
    // Half circle bulging inward from the edge
    const sweep = (dx + dy) > 0 ? 1 : 0;
    const ax = x - dy * r, ay = y - dx * r, bx = x + dy * r, by = y + dx * r;
    return `<path d="M${ax} ${ay} A${r} ${r} 0 0 ${sweep} ${bx} ${by} Z" />` +
           `<circle cx="${x + dx * 9}" cy="${y + dy * 9}" r="2.6" />`;
  }

  const W = 40, H = 58;   // tablet outline in the diagram
  const DIAGRAMS = {
    ends:
      `<line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" /><line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" />` +
      person(10, 0, 0, 1) + person(30, 0, 0, 1) + person(10, H, 0, -1) + person(30, H, 0, -1),
    sides:
      `<line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" /><line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" />` +
      person(0, 14.5, 1, 0) + person(0, 43.5, 1, 0) + person(W, 14.5, -1, 0) + person(W, 43.5, -1, 0),
    around:
      `<line x1="0" y1="${H / 4}" x2="${W}" y2="${H / 4}" /><line x1="0" y1="${H * 3 / 4}" x2="${W}" y2="${H * 3 / 4}" />` +
      `<line x1="${W / 2}" y1="${H / 4}" x2="${W / 2}" y2="${H * 3 / 4}" />` +
      person(W / 2, 0, 0, 1) + person(W / 2, H, 0, -1) + person(0, H / 2, 1, 0) + person(W, H / 2, -1, 0)
  };

  function diagram(layoutId) {
    return `<svg class="layout-diagram" viewBox="-3 -3 ${W + 6} ${H + 6}" aria-hidden="true">` +
      `<rect class="ld-tablet" x="0" y="0" width="${W}" height="${H}" rx="5" />` +
      `<g class="ld-parts">${DIAGRAMS[layoutId] || ''}</g></svg>`;
  }

  class HudView {
    /**
     * @param {HTMLElement} element  the control bar
     * @param {HTMLElement} chooser  the 4P layout chooser
     * @param {Array} layouts        config.FOUR_PLAYER_LAYOUTS
     */
    constructor(element, chooser, layouts) {
      this.el = element;
      this.handlers = {};
      this.countButtons = Array.from(element.querySelectorAll('[data-players]'));
      this.fourButton = element.querySelector('[data-players="4"]');
      this.chooser = chooser;
      this._swallowNextClick = false;

      this.chooser.innerHTML = layouts.map(layout => `
        <button class="layout-option" type="button" role="menuitemradio" aria-checked="false" data-layout="${escapeHtml(layout.id)}">
          ${diagram(layout.id)}
          <span class="layout-option-label">${escapeHtml(layout.label)}</span>
          <span class="layout-option-desc">${escapeHtml(layout.description)}</span>
        </button>`).join('');
      this.layoutOptions = Array.from(this.chooser.querySelectorAll('[data-layout]'));

      this.chooser.addEventListener('click', event => {
        const option = event.target.closest('[data-layout]');
        if (option) this._call('onFourPlayerLayout', option.dataset.layout);
      });

      element.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.dataset.players) {
          const count = Number(button.dataset.players);
          if (count === 4) return this._call('onFourPlayers');
          this.closeChooser();
          return this._call('onPlayerCount', count);
        }
        this.closeChooser();
        switch (button.dataset.action) {
          case 'reset':        return this._call('onReset');
          case 'clear-commanders': return this._call('onClearCommanders');
          case 'log-game':     return this._call('onLogGame');
          case 'open-history': return this._call('onOpenHistory');
          default:             return undefined;
        }
      });

      // A tap anywhere else, or Esc, closes the chooser without changing anything.
      // That tap is swallowed, so closing the chooser never also changes a life total.
      document.addEventListener('pointerdown', event => {
        if (!this.isChooserOpen || this.el.contains(event.target) || this.chooser.contains(event.target)) return;
        this.closeChooser();
        this._swallowNextClick = true;
      }, true);
      document.addEventListener('click', event => {
        if (!this._swallowNextClick) return;
        this._swallowNextClick = false;
        event.stopPropagation();
        event.preventDefault();
      }, true);
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && this.isChooserOpen) this.closeChooser();
      });
    }

    /** handlers: { onPlayerCount(n), onFourPlayers(), onFourPlayerLayout(id), onReset(), onClearCommanders(), onLogGame(), onOpenHistory() } */
    bind(handlers) {
      Object.assign(this.handlers, handlers);
    }

    get isChooserOpen() { return this.chooser.classList.contains('open'); }

    openChooser() {
      this._swallowNextClick = false;
      this.chooser.classList.add('open');
      this.el.classList.add('chooser-open');
      this.fourButton.setAttribute('aria-expanded', 'true');
    }

    closeChooser() {
      this.chooser.classList.remove('open');
      this.el.classList.remove('chooser-open');
      this.fourButton.setAttribute('aria-expanded', 'false');
    }

    /**
     * @param {number} playerCount
     * @param {string} layout  the board's layout: '2', '3', 'ends', 'sides' or 'around'
     * @param {string} fourPlayerLayout  the remembered 4P layout (marked in the chooser)
     */
    render(playerCount, layout, fourPlayerLayout) {
      this.el.dataset.layout = layout;        // the bar turns to lie along the seam in sideways layouts
      this.chooser.dataset.layout = layout;   // ...and the chooser moves so it doesn't cover the bar
      this.countButtons.forEach(button => {
        button.classList.toggle('active', Number(button.dataset.players) === playerCount);
      });
      this.layoutOptions.forEach(option => {
        const chosen = playerCount === 4 && option.dataset.layout === fourPlayerLayout;
        option.classList.toggle('selected', chosen);
        option.setAttribute('aria-checked', String(chosen));
      });
    }

    _call(name, ...args) {
      if (this.handlers[name]) this.handlers[name](...args);
    }
  }

  EDH.HudView = HudView;
})(window.EDH = window.EDH || {});
