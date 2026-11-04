/* עמוד רגיל ו-404 (דוגמה): כותרת שקופה בראש העמוד, ובעמוד רגיל גם תוכן עניינים מכותרות h2 עם סימון הקטע שבתצוגה (כמו בכתבה, מקוצר). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  /* כותרת: שקופה בראש העמוד, אטומה אחרי גלילה (24px פנימה, 8px החוצה) */
  var hd = document.querySelector('.site-header'), hq = false;
  function syncHeader() { hq = false; var y = window.pageYOffset, top = hd.classList.contains('is-over') ? y < 24 : y < 8; hd.classList.toggle('is-over', top); }
  function queueHeader() { if (!hq) { hq = true; requestAnimationFrame(syncHeader); } }
  window.addEventListener('scroll', queueHeader, { passive: true }); window.addEventListener('resize', queueHeader); hd.classList.add('is-over'); syncHeader();
  setTimeout(function () { var hr = $('hero'); if (hr) hr.classList.remove('is-entering'); }, 2000); /* אחרי כניסת ההירו */

  /* תוכן עניינים: רק בעמוד שיש בו #toc */
  var tocList = $('toc'); if (!tocList) return;
  var heads = Array.prototype.slice.call(document.querySelectorAll('#body > h2[id]'));
  /* אורי: תוכן העניינים מופיע רק כשיש 3 כותרות h2 או יותר */
  if (heads.length < 3) { var side = document.querySelector('.art__side'); if (side) side.hidden = true; var art = document.querySelector('.art'); if (art) art.classList.add('art--no-toc'); return; }
  tocList.innerHTML = heads.map(function (h) { return '<li><a href="#' + h.id + '">' + h.textContent + '</a></li>'; }).join('');
  var links = Array.prototype.slice.call(tocList.querySelectorAll('a'));
  /* בטאבלט/טלפון תוכן העניינים מתקפל (כמו בכתבה): כפתור "בעמוד · N" פותח וסוגר; בדסקטופ הכפתור מוסתר (CSS) */
  (function () {
    var toc = document.querySelector('.toc'), tgl = document.createElement('button');
    tgl.type = 'button'; tgl.className = 'toc__toggle'; tgl.setAttribute('aria-expanded', 'false'); tgl.setAttribute('aria-controls', 'toc');
    tgl.innerHTML = '<span>בעמוד</span><small>' + heads.length + ' סעיפים</small><svg class="icon" aria-hidden="true"><use href="#i-next"/></svg>';
    toc.insertBefore(tgl, tocList);
    function set(open) { toc.classList.toggle('is-open', open); tgl.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    tgl.addEventListener('click', function () { set(!toc.classList.contains('is-open')); });
    links.forEach(function (a) { a.addEventListener('click', function () { if (innerWidth < 1024) set(false); }); });
    toc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && toc.classList.contains('is-open') && innerWidth < 1024) { set(false); tgl.focus(); } });
  })();
  function mark(id) { links.forEach(function (a) { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
  if (heads.length) {
    mark(heads[0].id);
    var spyQ = false;
    function spy() {
      spyQ = false;
      var line = window.innerHeight * 0.3, cur = heads[0];
      heads.forEach(function (h) { if (h.getBoundingClientRect().top <= line) cur = h; });
      mark(cur.id);
    }
    window.addEventListener('scroll', function () { if (!spyQ) { spyQ = true; requestAnimationFrame(spy); } }, { passive: true });
    window.addEventListener('resize', spy); spy();
  }
})();
