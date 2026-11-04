/* גלילה נעימה לאנקורים בעמוד (תוכן עניינים, "חזרה למעלה" ועוד), משותף לכל עמודי הארכיון והכתבה (אורי).
   עקומת האצה והאטה רכה (ease-in-out), משך לפי המרחק (כ-450 עד 900ms), היעד מתחת לכותרת הדבוקה; עוצרת כשהמשתמש מגלל בעצמו;
   מעבירה את המיקוד ליעד (נגישות) בלי לקפוץ; מעדכנת את הכתובת בלי להוסיף היסטוריה; prefers-reduced-motion: קפיצה מיידית.
   קישור הדילוג לתוכן (skip-link) נשאר רגיל, כי הוא למקלדת. */
(function () {
  'use strict';
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false }, raf = 0;
  function ease(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function offsetFor(el) {
    if (el.id === 'main' || el.id === 'top') return 0;
    var h = document.querySelector('.site-header'); return (h ? h.getBoundingClientRect().height : 64) + 16;
  }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function go(y, done) {
    stop();
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    y = Math.max(0, Math.min(max, Math.round(y)));
    var start = window.pageYOffset, dist = y - start;
    if (reduce.matches || Math.abs(dist) < 2) { window.scrollTo(0, y); if (done) done(); return; }
    var dur = Math.min(900, Math.max(450, 380 + Math.abs(dist) * 0.2)), t0 = performance.now();
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, Math.round(start + dist * ease(p)));
      if (p < 1) raf = requestAnimationFrame(step); else { raf = 0; if (done) done(); }
    }
    raf = requestAnimationFrame(step);
  }
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, stop, { passive: true }); });
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.classList.contains('skip-link') || (a.target && a.target !== '_self')) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) !== '#' || href.length < 2) return;
    var id; try { id = decodeURIComponent(href.slice(1)); } catch (err) { id = href.slice(1); }
    var t = document.getElementById(id); if (!t) return;
    e.preventDefault();
    go(t.getBoundingClientRect().top + window.pageYOffset - offsetFor(t), function () {
      if (history.replaceState) history.replaceState(null, '', href);
      if (!t.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) t.setAttribute('tabindex', '-1');
      try { t.focus({ preventScroll: true }); } catch (err2) {}
    });
  });
})();
