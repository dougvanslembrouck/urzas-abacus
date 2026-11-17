/* =========================================================
   CommanderCatalog (Model)
   Looks up commanders live on Scryfall (https://scryfall.com),
   so new sets show up as soon as Scryfall lists them.
   Nothing is stored locally except what a player picks.

   A commander looks like:
     { name, scryfallId, artist, colors, art }
   where `art` is the Scryfall art-crop image for the
   commander's newest standard printing and `artist` is
   that printing's artist.
   ========================================================= */
(function (EDH) {
  'use strict';

  /** Lowercase, strip accents and apostrophes, collapse punctuation to spaces. */
  function normalize(text) {
    return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/['’]/g, '')          // T'Challa -> tchalla, Sauron's -> saurons
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** The first image-bearing face of a card (double-faced cards keep images per face). */
  function artOf(card) {
    return card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop || null;
  }
  /** Artist of the art we show: the front face's artist on double-faced cards. */
  function artistOf(card) {
    if (card.card_faces?.[0]?.image_uris) return card.card_faces[0].artist || card.artist || '';
    return card.artist || card.card_faces?.[0]?.artist || '';
  }

  /**
   * Pick the standard printing from a newest-first list. Printings released the same
   * day often include a borderless alternate that Scryfall doesn't tag as special
   * (most Star Trek commanders have one), so on the newest day prefer a bordered
   * printing, then the lowest collector number.
   */
  function pickStandard(printings) {
    const withArt = printings.filter(artOf);
    if (!withArt.length) return null;
    const newestDay = withArt[0].released_at;
    const borderless = c => (c.border_color === 'borderless' ? 1 : 0);
    const number = c => parseInt(c.collector_number, 10) || Number.MAX_SAFE_INTEGER;
    return withArt
      .filter(c => c.released_at === newestDay)
      .sort((a, b) => borderless(a) - borderless(b) || number(a) - number(b))[0];
  }

  class CommanderCatalog {
    constructor(config) {
      this.config = config;
      this._lastRequestAt = 0;
      this._printingCache = new Map();   // name -> Promise<commander>
    }

    /** Whether typed text is long enough to search. */
    canSearch(query) {
      return normalize(query).length >= this.config.COMMANDER_SEARCH_MIN_CHARS;
    }

    /**
     * Search Scryfall for commanders whose name matches what was typed.
     * Every typed word must match the start of a word in the name, so "black pan"
     * finds T'Challa but "thing" doesn't match "Seething". Names that start with the
     * query come first.
     * @returns {Promise<{results: Array, more: boolean}>} results are { name, colors }
     */
    async search(query, signal) {
      const q = normalize(query);
      const terms = q.split(' ').filter(Boolean);
      // Scryfall's name: search ignores punctuation and accents and matches anywhere in
      // the name; the word-start rule is applied here afterwards.
      const nameFilters = terms.map(t => `name:${t}`).join(' ');
      const json = await this._get('cards/search', {
        q: `${this.config.SCRYFALL_COMMANDER_QUERY} ${nameFilters}`,
        unique: 'cards',
        order: 'name'
      }, signal);

      if (json.object === 'error') {
        if (json.status === 404) return { results: [], more: false };   // no matches
        throw new Error(json.details || 'Scryfall error');
      }

      const matches = json.data
        .map(card => {
          const norm = normalize(card.name);
          return { card, norm, words: norm.split(' ') };
        })
        .filter(entry => terms.every(t => entry.words.some(w => w.startsWith(t))))
        .map(entry => ({ entry, rank: entry.norm.startsWith(q) ? 0 : 1 }))
        .sort((a, b) => a.rank - b.rank || a.entry.norm.localeCompare(b.entry.norm))
        .map(({ entry }) => ({ name: entry.card.name, colors: (entry.card.color_identity || []).join('') }));

      return { results: matches, more: Boolean(json.has_more) };
    }

    /**
     * Full details for a commander picked by name: art and artist from its newest
     * standard printing (available in nonfoil, not a promo, not showcase, extended-art,
     * etched or other "booster fun"; bordered preferred over borderless on the same day).
     * Cards that only exist in special versions use Scryfall's default printing.
     * Results are cached for the session.
     */
    findStandardPrinting(name) {
      if (!this._printingCache.has(name)) {
        const lookup = this._lookUpPrinting(name).catch(err => {
          this._printingCache.delete(name);   // let a later try go back online
          throw err;
        });
        this._printingCache.set(name, lookup);
      }
      return this._printingCache.get(name);
    }

    async _lookUpPrinting(name) {
      const exact = `!"${name.replace(/"/g, '')}"`;
      const standard = await this._get('cards/search', {
        q: `${exact} game:paper ${this.config.SCRYFALL_STANDARD_PRINTING}`,
        unique: 'prints',
        order: 'released',
        dir: 'desc'
      });
      let card = standard.object === 'list' ? pickStandard(standard.data) : null;

      if (!card) {
        const fallback = await this._get('cards/named', { exact: name });
        if (fallback.object === 'error') throw new Error(fallback.details || 'Commander not found');
        card = fallback;
      }

      return {
        name: card.name,
        scryfallId: card.id,
        artist: artistOf(card),
        colors: (card.color_identity || []).join(''),
        art: artOf(card)
      };
    }

    /** Image link for a commander's art (v2.0 saves only had the id, so build it from that). */
    artUrl(commander) {
      if (typeof commander.art === 'string' && commander.art.startsWith('https://cards.scryfall.io/')) return commander.art;
      const id = commander.scryfallId;
      return id ? `https://cards.scryfall.io/art_crop/front/${id[0]}/${id[1]}/${id}.jpg` : null;
    }

    /** GET from the Scryfall API, keeping requests at least REQUEST_GAP_MS apart as Scryfall asks. */
    async _get(path, params, signal) {
      const wait = this._lastRequestAt + this.config.SCRYFALL_REQUEST_GAP_MS - Date.now();
      this._lastRequestAt = Date.now() + Math.max(0, wait);
      if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
      if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');

      const url = `${this.config.SCRYFALL_API}/${path}?${new URLSearchParams(params)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
      return response.json();
    }
  }

  EDH.CommanderCatalog = CommanderCatalog;
})(window.EDH = window.EDH || {});
