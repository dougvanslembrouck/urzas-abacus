/* =========================================================
   emitter.js: tiny event system. Models extend this so
   controllers can react whenever data changes.
   ========================================================= */
(function (EDH) {
  'use strict';

  class Emitter {
    constructor() {
      this._listeners = {};
    }

    /** Subscribe to an event. Returns a function that unsubscribes. */
    on(eventName, listener) {
      (this._listeners[eventName] = this._listeners[eventName] || []).push(listener);
      return () => {
        this._listeners[eventName] = this._listeners[eventName].filter(fn => fn !== listener);
      };
    }

    emit(eventName, payload) {
      (this._listeners[eventName] || []).forEach(listener => listener(payload));
    }
  }

  EDH.Emitter = Emitter;
})(window.EDH = window.EDH || {});
