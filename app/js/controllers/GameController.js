/* =========================================================
   GameController (Controller)
   Connects the board and control bar to the GameModel:
   taps become model updates, and every model change
   redraws the board.
   ========================================================= */
(function (EDH) {
  'use strict';

  class GameController {
    constructor({ gameModel, catalog, loreCatalog, boardView, hudView }) {
      this.model = gameModel;
      this.catalog = catalog;
      this.lore = loreCatalog;
      this.board = boardView;
      this.hud = hudView;
      this.artUrlFor = commander => this.catalog.artUrl(commander);

      this.board.forEachCard((card, playerId) => {
        card.bind({
          onLife: step => this.model.changeLife(playerId, step),
          onCommanderDamage: (fromId, step) => this.model.changeCommanderDamage(playerId, fromId, step),
          onToggleDead: () => this.model.toggleEliminated(playerId),
          onToggleMonarch: () => this.model.toggleMonarch(playerId),
          onTax: step => this.model.changeCommanderTax(playerId, step),
          onNameInput: text => this.model.setName(playerId, text),
          onLore: () => this.toggleLore(playerId)
        });
      });

      this.hud.bind({
        onPlayerCount: count => this.model.setPlayerCount(count),
        onFourPlayers: () => this.fourPlayers(),
        onFourPlayerLayout: layoutId => {
          this.hud.closeChooser();
          this.model.setFourPlayerLayout(layoutId);
        },
        onReset: () => this.resetGame(),
        onClearCommanders: () => this.clearCommanders()
      });

      this.model.on('change', () => this.render());
    }

    /**
     * 4P button: switch straight to the remembered 4P layout. The chooser opens
     * instead when 4P is already showing (to change layout) or when no layout
     * has been chosen on this device yet.
     */
    fourPlayers() {
      if (this.hud.isChooserOpen) return this.hud.closeChooser();
      if (this.model.playerCount === 4 || !this.model.hasChosenFourPlayerLayout) return this.hud.openChooser();
      return this.model.setPlayerCount(4);
    }

    /** Flip a seat's card to the AlphaCryptids of its land, or back. */
    toggleLore(playerId) {
      const card = this.board.card(playerId);
      if (card.isLoreOpen) return card.closeLore();
      const landId = this.model.landOf(playerId);
      return card.openLore(this.model.config.LANDS[landId], this.lore.forLand(landId));
    }

    clearCommanders() {
      if (!this.model.hasAnyCommander) {
        EDH.dom.notify('Every seat is already showing its land background.');
        return;
      }
      if (EDH.dom.confirm('Clear every commander? Each seat goes back to its land background. Life totals are not changed.')) {
        this.model.clearAllCommanders();
      }
    }

    resetGame() {
      if (EDH.dom.confirm('Reset game? All player life totals and commander damage will start over.')) {
        this.model.resetGame();
      }
    }

    render() {
      this.board.render(this.model, this.artUrlFor);
      this.hud.render(this.model.playerCount, this.model.layout, this.model.fourPlayerLayout);
    }
  }

  EDH.GameController = GameController;
})(window.EDH = window.EDH || {});
