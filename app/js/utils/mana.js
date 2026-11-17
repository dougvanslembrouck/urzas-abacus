/* =========================================================
   mana.js: color identity as mana symbol pips.
   Used by the player card (under commander tax) and the
   commander search results.

   Each pip is a colored circle with the official mana
   symbol from Scryfall's symbol set on top. If the symbol
   image can't load (offline), the circle shows its letter.
   ========================================================= */
(function (EDH) {
  'use strict';

  const SYMBOL_URL = 'https://svgs.scryfall.io/card-symbols/';
  const NAMES = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green', C: 'Colorless' };

  // Conventional card order for every color combination (how printed costs list them),
  // e.g. Boros is R W, not W R. Keyed by the colors in WUBRG order.
  const ORDER = {
    W: 'W', U: 'U', B: 'B', R: 'R', G: 'G',
    WU: 'WU', UB: 'UB', BR: 'BR', RG: 'RG', WG: 'GW',
    WB: 'WB', UR: 'UR', BG: 'BG', WR: 'RW', UG: 'GU',
    WUB: 'WUB', UBR: 'UBR', BRG: 'BRG', WRG: 'RGW', WUG: 'GWU',
    WBG: 'WBG', WUR: 'URW', UBG: 'BGU', WBR: 'RWB', URG: 'GUR',
    WUBR: 'WUBR', UBRG: 'UBRG', WBRG: 'BRGW', WURG: 'RGWU', WUBG: 'GWUB',
    WUBRG: 'WUBRG'
  };

  /** "RW", ["W","R"] or "" -> ['R','W'] in card order; colorless -> ['C']. Unknown -> []. */
  function colorList(colors) {
    if (colors == null) return [];
    const set = new Set((Array.isArray(colors) ? colors.join('') : String(colors)).toUpperCase().split(''));
    const key = 'WUBRG'.split('').filter(c => set.has(c)).join('');
    return key ? ORDER[key].split('') : ['C'];
  }

  /** Readable label, e.g. "Color identity: Red, White". */
  function label(colors) {
    const list = colorList(colors);
    return list.length ? `Color identity: ${list.map(c => NAMES[c]).join(', ')}` : '';
  }

  /** HTML for a row of pips. Empty string when colors aren't known yet. */
  function pipsHtml(colors, extraClass) {
    const list = colorList(colors);
    if (!list.length) return '';
    const pips = list.map(c =>
      `<span class="mana-pip mana-${c}" data-letter="${c}"><img src="${SYMBOL_URL}${c}.svg" alt="" draggable="false" onerror="this.remove()"></span>`
    ).join('');
    return `<span class="mana-pips${extraClass ? ' ' + extraClass : ''}" role="img" aria-label="${label(colors)}">${pips}</span>`;
  }

  EDH.mana = { colorList, label, pipsHtml };
})(window.EDH = window.EDH || {});
