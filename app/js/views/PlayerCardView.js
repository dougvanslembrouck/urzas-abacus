/* =========================================================
   PlayerCardView (View)
   One seat at the table, built from the
   #player-card-template in index.html. It turns taps into
   handler calls and draws the GameModel's state. It holds
   no game rules of its own.
   ========================================================= */
(function (EDH) {
  'use strict';

  const { cloneTemplate, role } = EDH.dom;

  class PlayerCardView {
    /**
     * @param {object} seat   one entry from config.SEATS
     * @param {Array} seats   all seats (for the commander damage rows)
     */
    constructor(seat, seats) {
      this.seat = seat;
      this.handlers = {};
      this._shownArtUrl = null;
      this._requestedArtUrl = null;

      this.el = cloneTemplate('player-card-template');
      this.el.dataset.seat = seat.id;
      this.el.id = `p${seat.id}-container`;

      this.nameInput = role(this.el, 'name');
      this.lifeValue = role(this.el, 'life');
      this.deadButton = this.el.querySelector('[data-action="dead"]');
      this.monarchButton = this.el.querySelector('[data-action="monarch"]');
      this.loreButton = this.el.querySelector('.lore-btn');
      this.lorePanel = role(this.el, 'lore');
      this.loreTitle = role(this.el, 'lore-title');
      this.loreList = role(this.el, 'lore-list');
      this._loreLand = null;
      this.commanderLabel = role(this.el, 'commander-label');
      this.artCredit = role(this.el, 'art-credit');
      this.taxControl = role(this.el, 'tax');
      this.taxValue = role(this.el, 'tax-value');
      this.colorsBox = role(this.el, 'commander-colors');
      this._shownColors = null;

      // One commander damage row per opponent
      this.cmdRows = {};
      const rowsContainer = role(this.el, 'cmd-rows');
      seats.filter(other => other.id !== seat.id).forEach(other => {
        const row = cloneTemplate('cmd-row-template');
        row.dataset.from = other.id;
        row.id = `p${seat.id}-from-p${other.id}`;
        rowsContainer.appendChild(row);
        this.cmdRows[other.id] = {
          row,
          label: role(row, 'cmd-label'),
          value: role(row, 'cmd-value')
        };
      });

      this.picker = new EDH.CommanderPickerView(role(this.el, 'picker'));

      this._listen();
    }

    /**
     * handlers: { onLife(step), onCommanderDamage(fromId, step), onToggleDead(),
     *             onToggleMonarch(), onTax(step), onNameInput(text), onOpenPicker(), onLore() }
     */
    bind(handlers) {
      Object.assign(this.handlers, handlers);
    }

    _listen() {
      this.el.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button || !this.el.contains(button)) return;
        const step = Number(button.dataset.step || 0);
        switch (button.dataset.action) {
          case 'life':        return this._call('onLife', step);
          case 'cmd':         return this._call('onCommanderDamage', Number(button.closest('.cmd-row').dataset.from), step);
          case 'dead':        return this._call('onToggleDead');
          case 'monarch':     return this._call('onToggleMonarch');
          case 'tax':         return this._call('onTax', step);
          case 'open-picker': return this._call('onOpenPicker');
          case 'lore':        return this._call('onLore');
          default:            return undefined;   // picker buttons are handled by CommanderPickerView
        }
      });
      this.nameInput.addEventListener('input', () => this._call('onNameInput', this.nameInput.value));
    }

    /** Draw this seat from the model. Safe to call after every change. */
    render(model, artUrlFor) {
      const id = this.seat.id;
      const player = model.getPlayer(id);
      const isMonarch = model.monarchId === id;

      this.el.classList.toggle('is-hidden-seat', !model.isActive(id));
      this.el.classList.toggle('is-eliminated', player.isDead);
      this.el.classList.toggle('is-monarch', isMonarch);
      this.el.dataset.land = player.land;
      // A lore page belongs to one land: close it if the seat switches land
      if (this.isLoreOpen && this._loreLand !== player.land) this.closeLore();

      // Don't overwrite the name while the player is typing it
      if (document.activeElement !== this.nameInput && this.nameInput.value !== player.name) {
        this.nameInput.value = player.name;
      }

      this.lifeValue.textContent = player.life;
      this.deadButton.textContent = player.isDead ? 'Undo' : "I'm Dead";

      this.monarchButton.setAttribute('aria-pressed', String(isMonarch));
      this.monarchButton.title = isMonarch ? 'Monarch (tap to remove)' : 'Make monarch';

      const tax = player.commanderTax;
      this.taxValue.textContent = tax;
      this.taxControl.classList.toggle('has-tax', tax > 0);
      this.taxControl.title = tax
        ? `Commander cast ${tax / model.config.COMMANDER_TAX_STEP + 1} times. Next cast costs {${tax}} more.`
        : 'No commander tax yet';

      Object.keys(this.cmdRows).forEach(key => {
        const fromId = Number(key);
        const { row, label, value } = this.cmdRows[fromId];
        label.textContent = model.displayName(fromId);
        row.style.setProperty('--seat-accent', model.accentOf(fromId));
        value.textContent = player.commanderDamage[fromId];
        row.classList.toggle('lethal-warning', model.isLethalCommanderDamage(id, fromId));
        row.classList.toggle('is-hidden-seat', !model.isActive(fromId));
      });

      this._renderCommander(player.commander, artUrlFor);
    }

    _renderCommander(commander, artUrlFor) {
      this._renderColors(commander);
      if (!commander) {
        this.commanderLabel.textContent = 'Choose commander';
        this.artCredit.textContent = '';
        this._requestedArtUrl = null;
        this._showArt(null);
        return;
      }

      this.commanderLabel.textContent = commander.name;
      const url = artUrlFor(commander);
      if (!url) {
        // Name chosen, art and artist still on their way from Scryfall (or offline)
        this._requestedArtUrl = null;
        this.artCredit.textContent = '';
        this._showArt(null);
        return;
      }
      if (url === this._requestedArtUrl) return;   // already loading or showing this art

      this._requestedArtUrl = url;
      this.artCredit.textContent = commander.artist ? `Art: ${commander.artist}` : '';

      // Load the image first so a failed load (offline) keeps the land background
      const probe = new Image();
      probe.onload = () => { if (this._requestedArtUrl === url) this._showArt(url); };
      probe.onerror = () => {
        if (this._requestedArtUrl !== url) return;
        this._showArt(null);
        this.artCredit.textContent = "Art couldn't load";
      };
      probe.src = url;
    }

    /** Mana pips for the commander's color identity, under the tax counter. */
    _renderColors(commander) {
      const colors = commander && typeof commander.colors === 'string' ? commander.colors : null;
      if (colors === this._shownColors) return;   // don't reload the symbol images on every tap
      this._shownColors = colors;
      this.colorsBox.innerHTML = colors === null ? '' : EDH.mana.pipsHtml(colors);
      this.colorsBox.classList.toggle('has-colors', colors !== null);
    }

    /* ---------- Lore: the card flips to the cryptids of its land ---------- */

    get isLoreOpen() { return this.el.classList.contains('lore-open'); }

    /**
     * @param {object} land      config.LANDS entry: { id, name, color }
     * @param {Array} cryptids   from LoreCatalog.forLand: { name, region, description }
     */
    openLore(land, cryptids) {
      const { escapeHtml } = EDH.dom;
      this._loreLand = land.id;
      this.loreTitle.innerHTML = `Cryptids of the ${escapeHtml(land.name)} ${EDH.mana.pipsHtml(land.color, 'lore-pip')}`;
      this.loreList.innerHTML = cryptids.map(c => `
        <li class="lore-item">
          <div class="lore-name"><b class="lore-letter">${escapeHtml(c.name[0])}</b>${escapeHtml(c.name)}</div>
          <p class="lore-desc">${escapeHtml(c.description)}</p>
          <div class="lore-region">${escapeHtml(c.region)}</div>
        </li>`).join('');
      this.loreList.scrollTop = 0;
      this.el.classList.add('lore-open');
      this.lorePanel.setAttribute('aria-hidden', 'false');
      this.loreButton.setAttribute('aria-pressed', 'true');
    }

    closeLore() {
      this.el.classList.remove('lore-open');
      this.lorePanel.setAttribute('aria-hidden', 'true');
      this.loreButton.setAttribute('aria-pressed', 'false');
      this._loreLand = null;
    }

    _showArt(url) {
      if (url === this._shownArtUrl) return;
      this._shownArtUrl = url;
      if (url) {
        this.el.style.setProperty('--art', `url("${url}")`);
        this.el.classList.add('has-art');
      } else {
        this.el.style.removeProperty('--art');
        this.el.classList.remove('has-art');
      }
    }

    _call(name, ...args) {
      if (this.handlers[name]) this.handlers[name](...args);
    }
  }

  EDH.PlayerCardView = PlayerCardView;
})(window.EDH = window.EDH || {});
