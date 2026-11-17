/* =========================================================
   HistoryController (Controller)
   Logs finished games from the GameModel into the
   HistoryModel and runs the Match History panel
   (open, export, import, clear).
   ========================================================= */
(function (EDH) {
  'use strict';

  class HistoryController {
    constructor({ gameModel, historyModel, hudView, historyView }) {
      this.game = gameModel;
      this.history = historyModel;
      this.view = historyView;

      hudView.bind({
        onLogGame: () => this.logGame(),
        onOpenHistory: () => this.open()
      });

      this.view.bind({
        onExport: () => this.exportHistory(),
        onImportFile: file => this.importHistory(file),
        onClear: () => this.clearHistory(),
        onClose: () => this.view.close()
      });

      this.history.on('change', () => this.view.render(this.history.matches));
    }

    logGame() {
      this.history.add(this.game.buildMatchRecord());
      EDH.dom.notify('Game logged to match history.');
    }

    open() {
      this.view.render(this.history.matches);
      this.view.open();
    }

    exportHistory() {
      if (this.history.isEmpty) {
        EDH.dom.notify('There are no logged games to export yet.');
        return;
      }
      EDH.dom.downloadText(`urzas-abacus-history_${Date.now()}.json`, this.history.exportToJSON());
    }

    async importHistory(file) {
      try {
        const text = await EDH.dom.readFileAsText(file);
        const count = this.history.importFromJSON(text);
        EDH.dom.notify(`Imported ${count} game${count === 1 ? '' : 's'} into match history.`);
      } catch (err) {
        EDH.dom.notify("That file couldn't be imported. Choose a match history file exported from this app.");
      }
    }

    clearHistory() {
      if (EDH.dom.confirm('Are you completely sure you want to permanently erase ALL history logs?')) {
        this.history.clear();
      }
    }
  }

  EDH.HistoryController = HistoryController;
})(window.EDH = window.EDH || {});
