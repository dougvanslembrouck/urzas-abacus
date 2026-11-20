/* =========================================================
   CommanderPickerView (View)
   The search overlay inside one player card. It shows
   whatever results the controller hands it and reports
   typing, picks and closing back through handlers.
   ========================================================= */
(function (EDH) {
  'use strict';

  const { escapeHtml, role } = EDH.dom;

  class CommanderPickerView {
    constructor(element) {
      this.el = element;
      this.input = role(element, 'picker-search');
      this.results = role(element, 'picker-results');
      this.handlers = {};

      this.input.addEventListener('input', () => this._call('onQuery', this.input.value));
      this.input.addEventListener('keydown', event => {
        if (event.key === 'Escape') this._call('onClose');
        if (event.key === 'Enter') {
          const first = this.results.querySelector('.picker-item');
          if (first) first.click();
        }
      });
      element.querySelector('[data-action="close-picker"]').addEventListener('click', () => this._call('onClose'));
      this.results.addEventListener('click', event => {
        const land = event.target.closest('.land-chip');
        if (land) return this._call('onPickLand', land.dataset.land);
        const item = event.target.closest('.picker-item');
        if (item) this._call('onPick', item.getAttribute('data-pick') || null, item.getAttribute('data-colors'));
      });
    }

    /** handlers: { onQuery(text), onPick(name, colors), onPickLand(landId), onClose() } */
    bind(handlers) {
      Object.assign(this.handlers, handlers);
    }

    get isOpen() { return this.el.classList.contains('open'); }

    open() {
      this.input.value = '';
      this.el.classList.add('open');
      setTimeout(() => this.input.focus(), 50);
    }

    close() {
      this.el.classList.remove('open');
      this.input.blur();
    }

    /**
     * @param {object} state
     *   status: 'prompt' | 'loading' | 'results' | 'error'
     *   query: text typed, results: [{ name, colors }], more: whether more matches exist,
     *   selectedName: the seat's current commander
     *   lands: [{ id, name, color }], currentLand: the seat's land id
     */
    render(state) {
      const lands = (state.lands || []).map(land => `
          <button class="land-chip${!state.selectedName && land.id === state.currentLand ? ' selected' : ''}" type="button" data-land="${escapeHtml(land.id)}">
            ${EDH.mana.pipsHtml(land.color)}<span>${escapeHtml(land.name)}</span>
          </button>`).join('');
      let html = `<div class="picker-lands"><div class="picker-lands-label">Land background</div><div class="picker-lands-row">${lands}</div></div>`;

      if (state.status === 'prompt') {
        html += '<div class="picker-hint">Type at least 2 letters to search every commander on Scryfall, including the newest sets.</div>';
      } else if (state.status === 'loading') {
        html += '<div class="picker-hint" role="status">Searching Scryfall…</div>';
      } else if (state.status === 'error') {
        html += '<div class="picker-hint" role="status">Can\'t reach Scryfall right now. Check your internet connection, then keep typing to try again.</div>';
      } else {
        html += state.results.map(commander => `
          <button class="picker-item${commander.name === state.selectedName ? ' selected' : ''}" type="button" data-pick="${escapeHtml(commander.name)}" data-colors="${escapeHtml(commander.colors)}">
            <span>${escapeHtml(commander.name)}</span>${EDH.mana.pipsHtml(commander.colors)}
          </button>`).join('');
        if (!state.results.length) {
          html += `<div class="picker-hint">No commanders match "${escapeHtml(state.query)}"</div>`;
        } else if (state.more) {
          html += '<div class="picker-hint">More matches on Scryfall. Keep typing to narrow it down.</div>';
        }
      }
      this.results.innerHTML = html;
    }

    _call(name, ...args) {
      if (this.handlers[name]) this.handlers[name](...args);
    }
  }

  EDH.CommanderPickerView = CommanderPickerView;
})(window.EDH = window.EDH || {});
