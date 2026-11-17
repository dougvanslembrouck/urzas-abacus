/* =========================================================
   HistoryModel (Model)
   Logged games, newest first, saved in this browser.
   Handles import, export and clearing.
   ========================================================= */
(function (EDH) {
  'use strict';

  class HistoryModel extends EDH.Emitter {
    constructor(config, storage) {
      super();
      this.storage = storage;
      this.storageKey = config.STORAGE_KEYS.history;
      const saved = storage.readJSON(this.storageKey, []);
      this.matches = Array.isArray(saved) ? saved : [];
    }

    get isEmpty() { return this.matches.length === 0; }

    add(matchRecord) {
      this.matches.unshift(matchRecord);
      this._save();
    }

    /**
     * Merge games from an exported file. Imported games go first.
     * Throws if the text isn't a JSON array of matches.
     */
    importFromJSON(text) {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('not-an-array');
      this.matches = parsed.concat(this.matches);
      this._save();
      return parsed.length;
    }

    exportToJSON() {
      return JSON.stringify(this.matches, null, 2);
    }

    clear() {
      this.matches = [];
      this._save();
    }

    _save() {
      this.storage.writeJSON(this.storageKey, this.matches);
      this.emit('change', this);
    }
  }

  EDH.HistoryModel = HistoryModel;
})(window.EDH = window.EDH || {});
