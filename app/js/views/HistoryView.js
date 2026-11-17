/* =========================================================
   HistoryView (View)
   The slide-up Match History panel and its buttons.
   ========================================================= */
(function (EDH) {
  'use strict';

  const { escapeHtml, role } = EDH.dom;

  class HistoryView {
    constructor(element) {
      this.el = element;
      this.stream = role(element, 'history-stream');
      this.fileInput = role(element, 'import-file');
      this.handlers = {};

      element.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        switch (button.dataset.action) {
          case 'export':        return this._call('onExport');
          case 'import':        return this.fileInput.click();
          case 'clear':         return this._call('onClear');
          case 'close-history': return this._call('onClose');
          default:              return undefined;
        }
      });

      this.fileInput.addEventListener('change', () => {
        const file = this.fileInput.files[0];
        this.fileInput.value = '';     // so the same file can be chosen again
        if (file) this._call('onImportFile', file);
      });
    }

    /** handlers: { onExport(), onImportFile(file), onClear(), onClose() } */
    bind(handlers) {
      Object.assign(this.handlers, handlers);
    }

    open() { this.el.classList.add('open'); }
    close() { this.el.classList.remove('open'); }

    render(matches) {
      if (!matches.length) {
        this.stream.innerHTML = '<div class="empty-state">No recorded match data found locally.</div>';
        return;
      }
      this.stream.innerHTML = matches.map(match => this._matchCard(match)).join('');
    }

    _matchCard(match) {
      const winners = Array.isArray(match.winners) ? match.winners : [];
      const rows = (match.players || []).map(p => {
        const won = winners.includes(p.id);
        const statusClass = won ? 'winner' : p.isDead ? 'dead' : '';
        const statusText = won ? '🏆 WIN' : p.isDead ? 'ELIMINATED' : `${escapeHtml(p.lifeLeft)} HP`;
        const crown = p.isMonarch ? '<span class="log-monarch" title="Monarch">♛</span> ' : '';
        const commander = p.commander && p.commander !== p.name
          ? ` <span class="log-commander">· ${escapeHtml(p.commander)}</span>` : '';
        const tax = p.commanderTax ? ` <span class="log-tax">· tax ${escapeHtml(p.commanderTax)}</span>` : '';
        return `
          <div class="log-row-player ${statusClass}">
            <span>${crown}${escapeHtml(p.name)}${commander}${tax}</span>
            <span>${statusText}</span>
          </div>`;
      }).join('');

      return `
        <div class="log-card">
          <div class="log-meta"><span>${escapeHtml(match.mode)}</span><span>${escapeHtml(match.timestamp)}</span></div>
          <div class="log-lineup">${rows}</div>
        </div>`;
    }

    _call(name, ...args) {
      if (this.handlers[name]) this.handlers[name](...args);
    }
  }

  EDH.HistoryView = HistoryView;
})(window.EDH = window.EDH || {});
