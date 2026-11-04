/* תבנית עמוד כתבה (דסקטופ): זמן קריאה, תוכן עניינים עם סימון הקטע הנוכחי, פוסטים קשורים (לפי יישוב ועשור) ו'חדשים בארכיון' כמו בעמוד הבית. */
(function () {
  'use strict';
  var POSTS = window.ARCHIVE_POSTS || [];
  var IMG = '../1st/assets/img/arch/';
  var PLACES = { council: 'המועצה', dorot: 'דורות', 'nir-am': 'ניר עם', ruhama: 'רוחמה', gvim: 'גבים', ivim: 'איבים', 'bror-hayil': 'ברור חיל', erez: 'ארז', mefalsim: 'מפלסים', yachini: 'יכיני', 'kfar-aza': 'כפר עזה', 'nahal-oz': 'נחל עוז', 'or-haner': 'אור הנר' };
  /* נתוני הכתבה: ביישום האמיתי מגיעים משדות וורדפרס */
  var ART = { title: 'הקמת יישובי האזור וההתיישבות בנגב המערבי', kind: 'תיעוד', year: 1941, decade: 1940, tags: [], places: ['dorot', 'nir-am', 'ruhama', 'gvim', 'bror-hayil'] };
  var $ = function (id) { return document.getElementById(id); };

  /* כותרת: שקופה בראש העמוד, אטומה אחרי גלילה (24px פנימה, 8px החוצה) */
  var hd = document.querySelector('.site-header'), hq = false;
  function syncHeader() { hq = false; var y = window.pageYOffset, top = hd.classList.contains('is-over') ? y < 24 : y < 8; hd.classList.toggle('is-over', top); }
  function queueHeader() { if (!hq) { hq = true; requestAnimationFrame(syncHeader); } }
  window.addEventListener('scroll', queueHeader, { passive: true }); window.addEventListener('resize', queueHeader); hd.classList.add('is-over'); syncHeader();

  /* זמן קריאה: כ־180 מילים בדקה */
  var words = $('body').innerText.split(/\s+/).filter(Boolean).length, mins = Math.max(1, Math.round(words / 180));
  setTimeout(function () { var hr = document.getElementById('hero'); if (hr) hr.classList.remove('is-entering'); }, 2000); /* אחרי כניסת ההירו */
  $('rt').textContent = mins === 1 ? 'דקת קריאה' : mins + ' דקות קריאה';

  /* תוכן עניינים מכותרות h2 של הכתבה, עם סימון הקטע שבתצוגה */
  var heads = Array.prototype.slice.call(document.querySelectorAll('#body > h2[id]')).filter(function (h) { return !h.classList.contains('art__th'); });
  $('toc').innerHTML = heads.map(function (h) { return '<li><a href="#' + h.id + '">' + h.textContent + '</a></li>'; }).join('');
  var links = Array.prototype.slice.call($('toc').querySelectorAll('a'));
  /* 2.13: בטאבלט/טלפון תוכן העניינים מתקפל: כפתור "בכתבה · N" פותח וסוגר (aria-expanded), לחיצה על סעיף סוגרת; בדסקטופ הכפתור מוסתר (CSS) והרשימה פתוחה תמיד */
  (function () {
    var toc = document.querySelector('.toc'), tgl = document.createElement('button');
    tgl.type = 'button'; tgl.className = 'toc__toggle'; tgl.setAttribute('aria-expanded', 'false'); tgl.setAttribute('aria-controls', 'toc');
    tgl.innerHTML = '<span>בכתבה</span><small>' + heads.length + ' סעיפים</small><svg class="icon" aria-hidden="true"><use href="#i-next"/></svg>';
    toc.insertBefore(tgl, $('toc'));
    function set(open) { toc.classList.toggle('is-open', open); tgl.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    tgl.addEventListener('click', function () { set(!toc.classList.contains('is-open')); });
    links.forEach(function (a) { a.addEventListener('click', function () { if (innerWidth < 1024) set(false); }); });
    toc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && toc.classList.contains('is-open') && innerWidth < 1024) { set(false); tgl.focus(); } });
  })();
  function mark(id) { links.forEach(function (a) { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
  if (heads.length) {
    mark(heads[0].id);
    /* הקטע הנוכחי: הכותרת האחרונה שחלפה את 30% העליונים של המסך */
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

  /* שווה קריאה: פוסטים מאותו סוג, תגית, שנה, עשור או יישוב כמו הכתבה (אורי), בלי הכתבה עצמה */
  var fresh = POSTS.filter(function (p) { return p.t !== ART.title; }).map(function (p) {
    var tagHit = (p.tags || []).some(function (t) { return ART.tags.indexOf(t) >= 0; });
    var s = (p.k === ART.kind ? 2 : 0) + (p.y === ART.year ? 3 : 0) + (p.d === ART.decade ? 1 : 0) + (ART.places.indexOf(p.p) >= 0 ? 3 : 0) + (tagHit ? 2 : 0) + (p.img ? 0.5 : 0);
    return { p: p, s: s };
  }).filter(function (x) { return x.s >= 3; }).sort(function (a, b) { return b.s - a.s || a.p.y - b.p.y; }).slice(0, 5).map(function (x) { return x.p; });
  $('ledger').innerHTML = fresh.map(function (p, i) {
    return '<li><a href="' + p.h + '" data-img="' + (p.img || '') + '" data-excerpt="' + p.x.replace(/"/g, '&quot;') + '"' + (i === 0 ? ' class="is-active"' : '') + '><span class="t">' + p.t + '</span><span class="k"><svg class="icon" aria-hidden="true"><use href="#' + p.ic + '"/></svg>' + p.k + '</span><span class="y">שנת ' + p.y + '</span></a></li>';
  }).join('');
  var anchors = Array.prototype.slice.call($('ledger').querySelectorAll('a'));
  function show(a) {
    anchors.forEach(function (x) { x.classList.toggle('is-active', x === a); });
    if (a.dataset.img) $('pvImg').src = IMG + a.dataset.img;
    $('pvText').textContent = a.dataset.excerpt;
  }
  anchors.forEach(function (a) { a.addEventListener('mouseenter', function () { show(a); }); a.addEventListener('focus', function () { show(a); }); });
  if (anchors[0]) show(anchors[0]);
})();
