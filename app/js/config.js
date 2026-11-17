/* =========================================================
   config.js: game rules and seat setup in one place.
   Every other file reads from EDH.config instead of
   hard-coding numbers or names.
   ========================================================= */
(function (EDH) {
  'use strict';

  EDH.config = Object.freeze({
    APP_NAME: "Urza's Abacus",
    VERSION: '2.1.1',

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

    // One entry per seat. Theme names match the classes in css/player-card.css.
    SEATS: Object.freeze([
      { id: 1, defaultName: 'Arcane',  theme: 'arcane',  accent: '#a78bfa' },  // Plains
      { id: 2, defaultName: 'Inferno', theme: 'inferno', accent: '#ef4444' },  // Mountain
      { id: 3, defaultName: 'Forest',  theme: 'forest',  accent: '#10b981' },  // Forest
      { id: 4, defaultName: 'Shadow',  theme: 'shadow',  accent: '#64748b' }   // Swamp
    ]),

    STORAGE_KEYS: Object.freeze({
      history: 'edh_match_history',          // kept from v1.x (before the Urza's Abacus name) so saved data still loads
      commanders: 'edh_player_commanders',
      fourPlayerLayout: 'urzas_abacus_4p_layout'   // remembered 4P layout choice (v2.1.1+)
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
