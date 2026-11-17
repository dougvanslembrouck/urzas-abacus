/* =========================================================
   dom.js: small DOM helpers shared by the views.
   ========================================================= */
(function (EDH) {
  'use strict';

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  EDH.dom = {
    /** Make any text safe to drop into innerHTML. */
    escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, ch => ESCAPES[ch]);
    },

    /** Clone the first element inside a <template> by id. */
    cloneTemplate(templateId) {
      const template = document.getElementById(templateId);
      return template.content.firstElementChild.cloneNode(true);
    },

    /** Find an element by its data-role inside a root element. */
    role(root, roleName) {
      return root.querySelector(`[data-role="${roleName}"]`);
    },

    /** Browser dialogs, kept in one place so they're easy to replace with custom UI later. */
    confirm(message) {
      return window.confirm(message);
    },

    notify(message) {
      window.alert(message);
    },

    /** Save text as a file download. */
    downloadText(filename, text, mimeType) {
      const blob = new Blob([text], { type: mimeType || 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    /** Read a File chosen in an <input type="file"> as text. */
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
    }
  };
})(window.EDH = window.EDH || {});
