/* =========================================================
   GameModel (Model)
   Everything about the game in progress: player count,
   names, life, commander damage, eliminations, monarch,
   commander tax and each seat's commander.
   It enforces the rules and emits "change" after every
   update. It never touches the page.
   ========================================================= */
(function (EDH) {
  'use strict';

  class GameModel extends EDH.Emitter {
    constructor(config, storage) {
      super();
      this.config = config;
      this.storage = storage;
      this.playerCount = config.DEFAULT_PLAYER_COUNT;
      // Which 4P layout to use, and whether the player has ever chosen one on this device
      const savedLayout = storage.readJSON(config.STORAGE_KEYS.fourPlayerLayout, null);
      this.hasChosenFourPlayerLayout = this._isLayout(savedLayout);
      this.fourPlayerLayout = this.hasChosenFourPlayerLayout ? savedLayout : config.DEFAULT_FOUR_PLAYER_LAYOUT;
      this.monarchId = null;
      this.players = {};

      config.SEATS.forEach(seat => {
        const commanderDamage = {};
        config.SEATS.forEach(other => { if (other.id !== seat.id) commanderDamage[other.id] = 0; });
        this.players[seat.id] = {
          id: seat.id,
          name: seat.defaultName,
          life: config.STARTING_LIFE,
          isDead: false,
          commanderTax: 0,
          commanderDamage,            // damage this player has taken from each opponent's commander
          commander: null             // a commander from CommanderCatalog, or null for the land background
        };
      });
    }

    /* ---------- Reading state ---------- */

    get seats() { return this.config.SEATS; }

    get activeSeatIds() {
      return this.seats.map(s => s.id).filter(id => id <= this.playerCount);
    }

    /** The table layout in use: '2', '3', or for four players 'ends' | 'sides' | 'around'. */
    get layout() {
      return this.playerCount === 4 ? this.fourPlayerLayout : String(this.playerCount);
    }

    isActive(playerId) {
      return playerId <= this.playerCount;
    }

    getPlayer(playerId) {
      return this.players[playerId];
    }

    /** The name to show: what the player typed, or the seat's default if blank. */
    displayName(playerId) {
      const seat = this.seats.find(s => s.id === playerId);
      return this.players[playerId].name.trim() || seat.defaultName;
    }

    isLethalCommanderDamage(defenderId, attackerId) {
      return this.players[defenderId].commanderDamage[attackerId] >= this.config.LETHAL_COMMANDER_DAMAGE;
    }

    /* ---------- Changing state ---------- */

    setPlayerCount(count) {
      if (!this.config.PLAYER_COUNTS.includes(count)) return;
      this.playerCount = count;
      // A monarch whose seat left the table loses the crown
      if (this.monarchId && !this.isActive(this.monarchId)) this.monarchId = null;
      this._changed();
    }

    /** Choose a 4P layout (also switches to four players) and remember it on this device. */
    setFourPlayerLayout(layoutId) {
      if (!this._isLayout(layoutId)) return;
      this.fourPlayerLayout = layoutId;
      this.hasChosenFourPlayerLayout = true;
      this.storage.writeJSON(this.config.STORAGE_KEYS.fourPlayerLayout, layoutId);
      this.setPlayerCount(4);   // emits change
    }

    _isLayout(layoutId) {
      return this.config.FOUR_PLAYER_LAYOUTS.some(l => l.id === layoutId);
    }

    setName(playerId, name) {
      this.players[playerId].name = name;
      this._changed();
    }

    changeLife(playerId, delta) {
      const player = this.players[playerId];
      if (player.isDead) return;
      player.life += delta;
      this._changed();
    }

    /** Commander damage also comes off life, so one tap does both. */
    changeCommanderDamage(defenderId, attackerId, delta) {
      const defender = this.players[defenderId];
      if (defender.isDead) return;
      const next = defender.commanderDamage[attackerId] + delta;
      if (next < 0) return;
      defender.commanderDamage[attackerId] = next;
      defender.life -= delta;
      this._changed();
    }

    toggleEliminated(playerId) {
      const player = this.players[playerId];
      player.isDead = !player.isDead;
      // The crown leaves the game with the monarch; players tap it onto the new monarch
      if (player.isDead && this.monarchId === playerId) this.monarchId = null;
      this._changed();
    }

    /** Only one monarch at a time. Tapping the current monarch removes the crown. */
    toggleMonarch(playerId) {
      if (this.players[playerId].isDead) return;
      this.monarchId = this.monarchId === playerId ? null : playerId;
      this._changed();
    }

    changeCommanderTax(playerId, direction) {
      const player = this.players[playerId];
      if (player.isDead) return;
      player.commanderTax = Math.max(0, player.commanderTax + direction * this.config.COMMANDER_TAX_STEP);
      this._changed();
    }

    /**
     * Picking a commander also renames the seat to that commander, which updates the
     * name on the card and in every opponent's commander damage rows.
     * Going back to the land background restores the seat's default name, unless the
     * player has typed their own name since.
     */
    setCommander(playerId, commander) {
      this._applyCommander(playerId, commander || null);
      this._saveCommanderChoices();
      this._changed();
    }

    _applyCommander(playerId, commander) {
      const player = this.players[playerId];
      const previous = player.commander;
      player.commander = commander;
      if (commander) {
        player.name = commander.name;
      } else if (previous && player.name === previous.name) {
        player.name = this.seats.find(s => s.id === playerId).defaultName;
      }
    }

    /** New game: life, damage, eliminations, tax and monarch reset. Names, commanders and layout stay. */
    resetGame() {
      this.monarchId = null;
      Object.values(this.players).forEach(player => {
        player.life = this.config.STARTING_LIFE;
        player.isDead = false;
        player.commanderTax = 0;
        Object.keys(player.commanderDamage).forEach(id => { player.commanderDamage[id] = 0; });
      });
      this._changed();
    }

    /* ---------- Match records ---------- */

    /**
     * Snapshot of the current game for match history.
     * Winner: the last player standing; otherwise the surviving
     * player(s) with the highest life (ties share the win).
     */
    buildMatchRecord() {
      const players = this.activeSeatIds.map(id => {
        const p = this.players[id];
        return {
          id,
          name: this.displayName(id),
          lifeLeft: p.life,
          isDead: p.isDead,
          isMonarch: this.monarchId === id,
          commanderTax: p.commanderTax,
          commander: p.commander ? p.commander.name : null
        };
      });

      const survivors = players.filter(p => !p.isDead);
      let winners = [];
      if (survivors.length === 1) {
        winners = [survivors[0].id];
      } else if (survivors.length > 1) {
        // Compare survivors only, so an eliminated player's life can't block the win
        const topLife = Math.max(...survivors.map(p => p.lifeLeft));
        winners = survivors.filter(p => p.lifeLeft === topLife).map(p => p.id);
      }

      const now = new Date();
      return {
        id: 'match_' + now.getTime(),
        timestamp: now.toLocaleString(),
        mode: `${this.playerCount} Players`,
        players,
        winners
      };
    }

    /* ---------- Persistence for commander picks ---------- */

    /**
     * Restore each seat's last commander from this device.
     * Commanders are saved whole (name, Scryfall id, artist, colors, art link), so they
     * come back without going online. v2.0 saved only the name: those seats are
     * returned so the app can look them up on Scryfall and call setCommander.
     * @returns {Array<{playerId: number, name: string}>} seats that still need a lookup
     */
    restoreCommanderChoices() {
      const saved = this.storage.readJSON(this.config.STORAGE_KEYS.commanders, {}) || {};
      const needsLookup = [];
      Object.keys(saved).forEach(key => {
        const playerId = Number(key);
        const value = saved[key];
        if (!this.players[playerId] || !value) return;
        if (typeof value === 'string') {
          needsLookup.push({ playerId, name: value });
        } else if (typeof value === 'object' && typeof value.name === 'string') {
          this._applyCommander(playerId, value);
          if (!value.art && !value.scryfallId) needsLookup.push({ playerId, name: value.name });
        }
      });
      this._changed();
      return needsLookup;
    }

    _saveCommanderChoices() {
      const choices = {};
      Object.values(this.players).forEach(p => { choices[p.id] = p.commander || null; });
      this.storage.writeJSON(this.config.STORAGE_KEYS.commanders, choices);
    }

    _changed() {
      this.emit('change', this);
    }
  }

  EDH.GameModel = GameModel;
})(window.EDH = window.EDH || {});
