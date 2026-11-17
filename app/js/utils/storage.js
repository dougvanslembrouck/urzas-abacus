/* =========================================================
   storage.js: safe wrappers around localStorage.
   Private windows or blocked storage never crash the app;
   data just doesn't persist.
   ========================================================= */
(function (EDH) {
  'use strict';

  EDH.storage = {
    readJSON(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },

    writeJSON(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        return false;
      }
    }
  };
})(window.EDH = window.EDH || {});
