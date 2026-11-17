/* =========================================================
   app.js: starts the app.
   Builds the models, views and controllers and connects
   them. This is the only file that knows about all three.
   ========================================================= */
(function (EDH) {
  'use strict';

  const config = EDH.config;

  // Models
  const catalog = new EDH.CommanderCatalog(config);   // live Scryfall lookups
  const gameModel = new EDH.GameModel(config, EDH.storage);
  const historyModel = new EDH.HistoryModel(config, EDH.storage);

  // Views
  const boardView = new EDH.BoardView(document.getElementById('board'), config.SEATS);
  const hudView = new EDH.HudView(document.getElementById('hud'), document.getElementById('layout-chooser'), config.FOUR_PLAYER_LAYOUTS);
  const historyView = new EDH.HistoryView(document.getElementById('history-panel'));

  // Controllers
  const gameController = new EDH.GameController({ gameModel, catalog, boardView, hudView });
  const commanderController = new EDH.CommanderController({ gameModel, catalog, boardView, config });
  new EDH.HistoryController({ gameModel, historyModel, hudView, historyView });

  // First draw, then bring back each seat's commander from last time.
  // Seats saved by v2.0 (name only) or saved while offline get their art looked up.
  gameController.render();
  gameModel.restoreCommanderChoices().forEach(({ playerId, name }) => {
    gameModel.setCommander(playerId, { name });
    commanderController.loadDetails(playerId, name);
  });

  // Handy for debugging in the browser console: EDH.app.gameModel, etc.
  EDH.app = { config, catalog, gameModel, historyModel, boardView, hudView, historyView };
})(window.EDH = window.EDH || {});
