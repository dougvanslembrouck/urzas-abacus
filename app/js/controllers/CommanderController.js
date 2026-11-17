/* =========================================================
   CommanderController (Controller)
   Runs each seat's commander picker: opens it, searches
   Scryfall (through CommanderCatalog) after a pause in
   typing, and stores the pick on the GameModel.
   ========================================================= */
(function (EDH) {
  'use strict';

  class CommanderController {
    constructor({ gameModel, catalog, boardView, config }) {
      this.model = gameModel;
      this.catalog = catalog;
      this.board = boardView;
      this.maxResults = config.COMMANDER_PICKER_MAX_RESULTS;
      this.searchDelay = config.COMMANDER_SEARCH_DELAY_MS;

      // Per seat: pending typing timer, in-flight request, and a counter so a slow
      // reply to an old search never overwrites a newer one.
      this._timers = {};
      this._requests = {};
      this._searchIds = {};

      this.board.forEachCard((card, playerId) => {
        card.bind({ onOpenPicker: () => this.open(playerId) });
        card.picker.bind({
          onQuery: text => this.queueSearch(playerId, text),
          onPick: (name, colors) => this.pick(playerId, name, colors),
          onClose: () => this.close(playerId)
        });
      });
    }

    open(playerId) {
      if (this.model.getPlayer(playerId).isDead) return;
      this.board.card(playerId).picker.open();
      this.queueSearch(playerId, '');
    }

    close(playerId) {
      this._cancel(playerId);
      this.board.card(playerId).picker.close();
    }

    /** Wait for a pause in typing, then search. Short or empty text shows the prompt. */
    queueSearch(playerId, text) {
      this._cancel(playerId);
      const picker = this.board.card(playerId).picker;
      if (!this.catalog.canSearch(text)) {
        picker.render(this._state(playerId, { status: 'prompt', query: text }));
        return;
      }
      picker.render(this._state(playerId, { status: 'loading', query: text }));
      this._timers[playerId] = setTimeout(() => this._search(playerId, text), this.searchDelay);
    }

    async _search(playerId, text) {
      const searchId = (this._searchIds[playerId] || 0) + 1;
      this._searchIds[playerId] = searchId;
      const request = new AbortController();
      this._requests[playerId] = request;
      const picker = this.board.card(playerId).picker;

      try {
        const { results, more } = await this.catalog.search(text, request.signal);
        if (this._searchIds[playerId] !== searchId) return;
        picker.render(this._state(playerId, {
          status: 'results',
          query: text,
          results: results.slice(0, this.maxResults),
          more: more || results.length > this.maxResults
        }));
      } catch (err) {
        if (err.name === 'AbortError' || this._searchIds[playerId] !== searchId) return;
        picker.render(this._state(playerId, { status: 'error', query: text }));
      }
    }

    /**
     * Picking shows the commander's name and color pips right away (colors come
     * with the search result), then fills in the art and artist from Scryfall. If that lookup fails (offline), the name stays and the
     * seat keeps its land background.
     */
    pick(playerId, name, colors) {
      this.close(playerId);
      if (!name) {
        this.model.setCommander(playerId, null);
        return;
      }
      const commander = { name };
      if (typeof colors === 'string') commander.colors = colors;
      this.model.setCommander(playerId, commander);
      this.loadDetails(playerId, name);
    }

    /** Look up art and artist for a commander chosen by name, if it's still that seat's pick. */
    loadDetails(playerId, name) {
      this.catalog.findStandardPrinting(name)
        .then(commander => {
          const current = this.model.getPlayer(playerId).commander;
          if (current && current.name === name) this.model.setCommander(playerId, commander);
        })
        .catch(() => { /* offline: keep the name, no art */ });
    }

    _state(playerId, state) {
      const current = this.model.getPlayer(playerId).commander;
      return { results: [], more: false, selectedName: current ? current.name : null, ...state };
    }

    _cancel(playerId) {
      clearTimeout(this._timers[playerId]);
      if (this._requests[playerId]) this._requests[playerId].abort();
      this._searchIds[playerId] = (this._searchIds[playerId] || 0) + 1;
    }
  }

  EDH.CommanderController = CommanderController;
})(window.EDH = window.EDH || {});
