/* =========================================================
   BoardView (View)
   The table: creates one PlayerCardView per seat and
   arranges them for 2, 3 or 4 players. Where each seat sits
   is set in css/layout.css from data-players and data-layout.
   ========================================================= */
(function (EDH) {
  'use strict';

  class BoardView {
    constructor(element, seats) {
      this.el = element;
      this.cards = {};
      seats.forEach(seat => {
        const card = new EDH.PlayerCardView(seat, seats);
        this.cards[seat.id] = card;
        this.el.appendChild(card.el);
      });
    }

    card(playerId) {
      return this.cards[playerId];
    }

    forEachCard(fn) {
      Object.values(this.cards).forEach(card => fn(card, card.seat.id));
    }

    render(model, artUrlFor) {
      this.el.dataset.players = model.playerCount;
      this.el.dataset.layout = model.layout;
      this.forEachCard(card => card.render(model, artUrlFor));
    }
  }

  EDH.BoardView = BoardView;
})(window.EDH = window.EDH || {});
