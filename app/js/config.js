/* =========================================================
   config.js: game rules and seat setup in one place.
   Every other file reads from EDH.config instead of
   hard-coding numbers or names.
   ========================================================= */
(function (EDH) {
  'use strict';

  EDH.config = Object.freeze({
    APP_NAME: "Urza's Abacus",
    VERSION: '2.2.1',

    STARTING_LIFE: 40,
    LETHAL_COMMANDER_DAMAGE: 21,
    COMMANDER_TAX_STEP: 2,           // each recast from the command zone costs {2} more
    PLAYER_COUNTS: [2, 3, 4],
    DEFAULT_PLAYER_COUNT: 4,

    // Four-player table layouts, for a portrait tablet lying flat:
    //   ends:   2 × 2 grid, two players at each short end (top and bottom)
    //   sides:  2 × 2 grid, two players along each long side (left and right)
    //   around: one player on each side of the tablet
    FOUR_PLAYER_LAYOUTS: Object.freeze([
      { id: 'ends',   label: 'Ends',   description: 'Two at each end' },
      { id: 'sides',  label: 'Sides',  description: 'Two on each side' },
      { id: 'around', label: 'Around', description: 'One on each side' }
    ]),
    DEFAULT_FOUR_PLAYER_LAYOUT: 'ends',

    // The five basic lands. A seat shows its land as the background, and goes by the
    // land's name, until a commander is picked. Each land's id matches a
    // [data-land] rule in css/player-card.css; accent colors the damage rows.
    LANDS: Object.freeze({
      plains:   Object.freeze({ id: 'plains',   name: 'Plains',   color: 'W', accent: '#e2b93b' }),
      island:   Object.freeze({ id: 'island',   name: 'Island',   color: 'U', accent: '#3b82f6' }),
      swamp:    Object.freeze({ id: 'swamp',    name: 'Swamp',    color: 'B', accent: '#9b87b5' }),
      mountain: Object.freeze({ id: 'mountain', name: 'Mountain', color: 'R', accent: '#ef4444' }),
      forest:   Object.freeze({ id: 'forest',   name: 'Forest',   color: 'G', accent: '#10b981' })
    }),
    LAND_ORDER: Object.freeze(['plains', 'island', 'swamp', 'mountain', 'forest']),   // W U B R G

    // One entry per seat, with the land it starts on. Any seat can switch to any land.
    SEATS: Object.freeze([
      Object.freeze({ id: 1, defaultLand: 'mountain' }),
      Object.freeze({ id: 2, defaultLand: 'plains' }),
      Object.freeze({ id: 3, defaultLand: 'forest' }),
      Object.freeze({ id: 4, defaultLand: 'swamp' })
    ]),

    STORAGE_KEYS: Object.freeze({
      history: 'edh_match_history',          // kept from v1.x (before the Urza's Abacus name) so saved data still loads
      commanders: 'edh_player_commanders',
      fourPlayerLayout: 'urzas_abacus_4p_layout',   // remembered 4P layout choice (v2.1.1+)
      seatLands: 'urzas_abacus_seat_lands'          // each seat's land background (v2.2.0+)
    }),

    // Commander search runs live against Scryfall (https://scryfall.com/docs/api)
    COMMANDER_PICKER_MAX_RESULTS: 40,
    COMMANDER_SEARCH_MIN_CHARS: 2,       // don't search on a single letter
    COMMANDER_SEARCH_DELAY_MS: 300,      // wait for a pause in typing before searching
    SCRYFALL_API: 'https://api.scryfall.com',
    SCRYFALL_REQUEST_GAP_MS: 100,        // Scryfall asks for 50–100 ms between requests
    SCRYFALL_COMMANDER_QUERY: 'is:commander game:paper legal:commander',
    // "Standard" printing: available in nonfoil, not a promo, not a special frame
    SCRYFALL_STANDARD_PRINTING: 'is:nonfoil not:promo -is:boosterfun -frame:showcase -frame:extendedart -frame:etched'
  });
})(window.EDH = window.EDH || {});
