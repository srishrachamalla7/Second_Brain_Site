/* VSM Staff Portal wireframe kit helpers. No dependencies (Lucide icons are optional, loaded from CDN by each page).
   Behaviour is declared with data attributes, so screen files need no script of their own:
   - Tabs:      <div class="tabs" data-tabs> <button data-tab="a" aria-selected="true">..</button> </div> ... <section data-panel="a">
                (panels are looked up inside the same .screen, or the nearest [data-tabs-scope])
   - Segmented / chips: .seg buttons and .chips .chip toggle aria-pressed (single-select; add data-multi on .chips for multi-select)
   - Sheets:    <button data-open="sheet-id">  opens  <div class="sheet" id="sheet-id">; [data-close] or the .scrim closes it.
                Dialogs (.dialog) use the same data-open / data-close.
   - Toast:     <button data-toast="Saved. Payslip sent to WhatsApp.">
   - Page chrome: #wf-toggle-frame (phone frame on/off), #wf-toggle-theme (light / dark / auto)
   - VSM.inr(123456) -> "₹1,23,456" (Indian grouping)                                                     */
(function () {
  'use strict';
  var VSM = (window.VSM = window.VSM || {});

  VSM.inr = function (n) {
    var neg = n < 0; n = Math.abs(Math.round(n));
    return (neg ? '−' : '') + '₹' + n.toLocaleString('en-IN');
  };

  function screenOf(el) { return el.closest('[data-tabs-scope]') || el.closest('.screen') || document; }
  function scrimFor(scope) {
    var s = scope.querySelector(':scope > .scrim');
    if (!s && scope !== document) { s = document.createElement('div'); s.className = 'scrim'; scope.appendChild(s); }
    return s;
  }

  VSM.open = function (id) {
    var el = document.getElementById(id); if (!el) return;
    var scope = screenOf(el), scrim = scrimFor(scope);
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    if (scrim) scrim.classList.add('is-open');
    var f = el.querySelector('input, textarea, select, button:not([data-close])'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 250);
  };
  VSM.close = function (el) {
    var scope = screenOf(el);
    scope.querySelectorAll('.sheet.is-open, .dialog.is-open').forEach(function (s) {
      if (s.hasAttribute('data-static')) return; s.classList.remove('is-open'); s.setAttribute('aria-hidden', 'true');
    });
    var scrim = scope.querySelector(':scope > .scrim'); if (scrim && !scope.querySelector('.sheet.is-open, .dialog.is-open')) scrim.classList.remove('is-open');
  };

  VSM.toast = function (from, msg) {
    var scope = screenOf(from), t = scope.querySelector('.toast[data-auto]');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('data-auto', ''); t.setAttribute('role', 'status'); (scope === document ? document.body : scope).appendChild(t); }
    t.textContent = msg; t.classList.add('is-open');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('is-open'); }, 2600);
  };

  document.addEventListener('click', function (e) {
    var t = e.target;
    var tab = t.closest('[data-tabs] [data-tab]');
    if (tab) {
      var bar = tab.closest('[data-tabs]'), scope = screenOf(bar), name = tab.getAttribute('data-tab');
      bar.querySelectorAll('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b === tab ? 'true' : 'false'); });
      var names = Array.prototype.map.call(bar.querySelectorAll('[data-tab]'), function (b) { return b.getAttribute('data-tab'); });
      scope.querySelectorAll('[data-panel]').forEach(function (p) { if (names.indexOf(p.getAttribute('data-panel')) > -1) p.hidden = p.getAttribute('data-panel') !== name; });
      return;
    }
    var seg = t.closest('.seg button');
    if (seg) { seg.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === seg ? 'true' : 'false'); }); return; }
    var chip = t.closest('.chips .chip');
    if (chip && chip.tagName === 'BUTTON') {
      var group = chip.closest('.chips');
      if (group.hasAttribute('data-multi')) chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      else group.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      return;
    }
    var op = t.closest('[data-open]'); if (op) { e.preventDefault(); VSM.open(op.getAttribute('data-open')); return; }
    var cl = t.closest('[data-close]'); if (cl) { e.preventDefault(); VSM.close(cl); return; }
    if (t.classList.contains('scrim')) { VSM.close(t); return; }
    var to = t.closest('[data-toast]'); if (to) { VSM.toast(to, to.getAttribute('data-toast')); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.sheet.is-open:not([data-static]), .dialog.is-open:not([data-static])').forEach(function (s) { VSM.close(s); });
  });

  /* Page chrome: frame and theme toggles (remembered per browser, best effort) */
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (_) { return null; } }
  function applyTheme(mode) {
    if (mode === 'light' || mode === 'dark') document.documentElement.setAttribute('data-theme', mode);
    else document.documentElement.removeAttribute('data-theme');
    var b = document.getElementById('wf-toggle-theme'); if (b) b.textContent = 'Theme: ' + (mode || 'auto');
  }
  var q = new URLSearchParams(location.search);
  applyTheme(q.get('theme') || store('vsm-wf-theme'));
  if (q.get('frame') === 'off' || (store('vsm-wf-frame') === 'off' && q.get('frame') !== 'on')) document.body.classList.add('no-frame');

  document.addEventListener('DOMContentLoaded', function () {
    var fb = document.getElementById('wf-toggle-frame');
    function label() { if (fb) fb.textContent = document.body.classList.contains('no-frame') ? 'Frame: off' : 'Frame: on'; }
    label();
    if (fb) fb.addEventListener('click', function () { document.body.classList.toggle('no-frame'); store('vsm-wf-frame', document.body.classList.contains('no-frame') ? 'off' : 'on'); label(); });
    var tb = document.getElementById('wf-toggle-theme');
    if (tb) { applyTheme(document.documentElement.getAttribute('data-theme')); tb.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme'), next = cur === 'light' ? 'dark' : cur === 'dark' ? 'auto' : 'light';
      applyTheme(next); store('vsm-wf-theme', next);
    }); }
    /* fill [data-inr] with formatted money */
    document.querySelectorAll('[data-inr]').forEach(function (el) { el.textContent = VSM.inr(Number(el.getAttribute('data-inr'))); });
    /* sheets start closed unless .is-open is set in the HTML (for static "sheet shown" screens) */
    document.querySelectorAll('.sheet.is-open, .dialog.is-open').forEach(function (s) { s.setAttribute('data-static', ''); var sc = scrimFor(screenOf(s)); if (sc) sc.classList.add('is-open'); });
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
  });
})();
