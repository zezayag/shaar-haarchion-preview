/* final_var3b — התנהגויות בנוסח Google Arts & Culture: מגירת ניווט, הצעות חיפוש, קרוסלה, רצועות עשורים, שורות בגלילה */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rtl = document.documentElement.dir === 'rtl' ? -1 : 1;

  /* ---------- מגירת ניווט ---------- */
  var drawer = $('#drawer'), menuBtn = $('.hdr .hdr__menu');
  function setDrawer(open) {
    drawer.classList.toggle('is-open', open); drawer.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { var a = $('.drawer__panel a', drawer); a && a.focus(); } else menuBtn.focus();
  }
  menuBtn.addEventListener('click', function () { setDrawer(true); });
  $$('[data-close]', drawer).forEach(function (b) { b.addEventListener('click', function () { setDrawer(false); }); });
  $$('.drawer__panel a', drawer).forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('href').charAt(0) === '#') setDrawer(false); }); });
  document.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('is-open')) return;
    if (e.key === 'Escape') return setDrawer(false);
    if (e.key === 'Tab') { // המיקוד נשאר בתוך המגירה
      var f = $$('button, a', $('.drawer__panel', drawer)); var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- לשונית פעילה לפי הסקשן שבמסך ---------- */
  var tabs = $$('.tabs a');
  if ('IntersectionObserver' in window) {
    var map = {}; tabs.forEach(function (t) { map[t.getAttribute('href').slice(1)] = t; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = map[e.target.id] || (e.target.id === 'find' ? map.top : null); if (!t) return;
        tabs.forEach(function (x) { x.removeAttribute('aria-current'); }); t.setAttribute('aria-current', 'page');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['find', 'communities', 'timeline', 'oct7', 'recent'].forEach(function (id) { var el = document.getElementById(id); el && io.observe(el); });
  }

  /* ---------- הצעות חיפוש (Autocomplete) ---------- */
  var q = $('#q'), list = $('#qList'), sel = -1;
  var SUG = $$('.foot__places a').map(function (a) { return { t: a.textContent, h: a.getAttribute('href') }; })
    .concat($$('.chips a').map(function (a) { return { t: a.textContent, h: a.getAttribute('href') }; }))
    .concat(['1940', '1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020'].map(function (y) { return { t: y, h: '/topic/' + y + 's/' }; }));
  var ICO = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var clr = $('#qClear'), msg = $('#qMsg');
  function closeList() { list.hidden = true; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); sel = -1; }
  q.addEventListener('input', function () {
    var v = q.value.trim(); clr.hidden = !q.value; msg.textContent = ''; if (!v) return closeList();
    var hits = SUG.filter(function (s) { return s.t.indexOf(v) !== -1; }).slice(0, 6);
    list.innerHTML = hits.length ? hits.map(function (s, i) { return '<li role="option" id="qo' + i + '"><a href="' + s.h + '" tabindex="-1">' + ICO + '<span>' + s.t + '</span></a></li>'; }).join('')
      : '<li class="none" role="option" aria-disabled="true">אין הצעה מוכנה. Enter יחפש את ״' + v.replace(/[&<>"]/g, '') + '״ בכל הארכיון</li>';
    list.hidden = false; q.setAttribute('aria-expanded', 'true'); sel = -1;
  });
  q.addEventListener('keydown', function (e) {
    var items = $$('a', list); if (list.hidden || !items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach(function (a, i) { a.classList.toggle('is-on', i === sel); }); q.setAttribute('aria-activedescendant', 'qo' + sel);
    } else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); location.href = items[sel].href; }
    else if (e.key === 'Escape') closeList();
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.find__in')) closeList(); });
  clr.addEventListener('click', function () { q.value = ''; clr.hidden = true; closeList(); msg.textContent = ''; q.focus(); });
  $('#findForm').addEventListener('submit', function (e) {
    if (!q.value.trim()) { e.preventDefault(); msg.textContent = 'כתבו מילה אחת לפחות: שם יישוב, אדם, מקום או שנה.'; q.focus(); }
  });

  /* ---------- קרוסלת האוצרות: הכרטיס המרכזי גדול, השכנים קטנים מאחוריו ---------- */
  var cards = $$('.flow__card'), n = cards.length, cur = 0, status = $('#flowStatus');
  function layout() {
    var fl = $('.flow'), sv = parseFloat(getComputedStyle(fl).getPropertyValue('--flow-shrink')); // דסקטופ (≥1024): כרטיסי צד קטנים יותר, כמו ברפרנס; טאבלט/טלפון בלי שינוי
    var shrink = sv || 0.15, step = sv ? Math.min(300, ((fl.clientWidth || 1200) - cards[0].offsetWidth) / 4 + 24) : Math.min(250, ((fl.clientWidth || 1200) - 420) / 4 + 20);
    cards.forEach(function (c, i) {
      var p = i - cur; if (p > n / 2) p -= n; if (p < -n / 2) p += n;
      var a = Math.abs(p), s = 1 - Math.min(a, 3) * shrink;
      c.dataset.pos = p;
      c.style.transform = 'translateX(' + (p * step * rtl) + 'px) scale(' + s + ')';
      c.style.zIndex = String(10 - a); c.style.opacity = a > 2 ? '0' : '1';
      c.style.pointerEvents = a > 2 ? 'none' : '';
      var link = $('a', c); link.tabIndex = p === 0 ? 0 : -1; link.setAttribute('aria-hidden', p === 0 ? 'false' : 'true');
    });
    var t = $('.flow__cap b', cards[cur]); status.textContent = (cur + 1) + ' מתוך ' + n + ': ' + (t ? t.textContent : '');
  }
  function go(d) { cur = (cur + d + n) % n; layout(); }
  $('.flow__nav--next').addEventListener('click', function () { go(1); });
  $('.flow__nav--prev').addEventListener('click', function () { go(-1); });
  cards.forEach(function (c, i) {
    c.addEventListener('click', function (e) { if (i !== cur) { e.preventDefault(); cur = i; layout(); } });
  });
  $('.flow').addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(rtl === -1 ? 1 : -1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(rtl === -1 ? -1 : 1); }
  });
  addEventListener('resize', layout); layout();

  /* ---------- ציר הזמן: רצועה נפתחת + כרטיס הסיפורים של העשור ---------- */
  var DATA = JSON.parse($('#tlData').textContent), ARCH = 'assets/img/arch/';
  var COLOR = /^(campus-sapir-2007|sapir-college-2013|niram-reservoir-2021)\.jpg$|-color\.jpg$/; // הצילומים שקיימים בצבע
  function setStoryImg(file) {
    var img = $('#storyImg'), b = ARCH + file.replace(/\.jpg$/, '');
    var swap = function () { img.parentNode.classList.toggle('is-poster', /^poster-/.test(file)); img.srcset = b + '-640.jpg 640w, ' + b + '-1280.jpg 1280w'; img.src = b + '-640.jpg'; };
    if (reduced) return swap();
    img.classList.add('is-swap'); // החלפת תוכן באותו מקום = crossfade קצר
    setTimeout(function () { swap(); var done = function () { img.classList.remove('is-swap'); }; img.complete ? done() : (img.onload = img.onerror = done); }, 140);
  }
  function label(d) { return 'שנות ה-' + (+d >= 2000 ? d : d.slice(2)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  $$('.strip').forEach(function (li) {
    $('button', li).addEventListener('click', function () {
      var d = li.dataset.d, items = DATA[d] || [];
      $$('.strip').forEach(function (x) { x.classList.toggle('is-open', x === li); $('button', x).setAttribute('aria-pressed', String(x === li)); });
      $('#storyH').textContent = label(d);
      /* אורי 26.10: רק צילומים מלאים, בלי כרזות; מ-2000 ואילך רק צילומי צבע (כמו ברצועות). אין צילום מתאים = הצילום של הרצועה */
      var pics = items.filter(function (it) { return !/^poster-/.test(it.img) && (+d < 2000 || COLOR.test(it.img)); });
      var pic = pics[1] || pics[0]; // לא אותה תמונה כמו ברצועה כשיש שתיים
      setStoryImg(pic ? pic.img : $('img', li).getAttribute('src').split('/').pop().replace(/-640\.jpg$/, '.jpg'));
      /* אורי 26.10: כל הסיפורים של העשור, כמו ב-final_var1 (קודם 4 בלבד) */
      $('#storyList').innerHTML = items.map(function (it) {
        return '<li><a href="' + esc(it.h) + '"><span class="y">' + esc(it.y) + '</span><span class="t">' + esc(it.t) + '</span><span class="k">' + esc(it.k) + '</span></a></li>';
      }).join('');
      var all = $('#storyAll'); all.href = '/topic/' + d + 's/'; all.textContent = 'לכל הסיפורים של ' + label(d);
    });
  });

  /* ---------- שורות בגלילה אופקית: חצים ---------- */
  function rowArrows(row, prev, next) {
    function upd() {
      var max = row.scrollWidth - row.clientWidth, x = Math.abs(row.scrollLeft);
      if (prev) prev.disabled = x < 4; if (next) next.disabled = x > max - 4;
    }
    function by(dir) { row.scrollBy({ left: dir * rtl * row.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' }); }
    next && next.addEventListener('click', function () { by(1); });
    prev && prev.addEventListener('click', function () { by(-1); });
    row.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }
  rowArrows($('#railRow'), $('#railPrev'), $('#railNext'));
  rowArrows($('#recoRow'), $('#recoPrev'), $('#recoNext'));

  /* ---------- כניסה עדינה (פעם אחת, בלי להסתיר תוכן בלי סקריפט) ---------- */
  var rv = $$('.rv');
  if (reduced || !('IntersectionObserver' in window)) { rv.forEach(function (e) { e.classList.add('is-in'); }); return; }
  var ro = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { var el = e.target, i = rv.indexOf(el) % 4; setTimeout(function () { el.classList.add('is-in'); }, i * 50); ro.unobserve(el); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  rv.forEach(function (e) { ro.observe(e); });
})();

/* תפריט נפתח "היישובים" בכותרת: לחיצה פותחת, Esc / לחיצה בחוץ סוגרים, המיקוד עובר לפריט הראשון */
(function () {
  var btn = document.querySelector('.tabs__btn'), menu = document.getElementById('ddPlaces');
  if (!btn || !menu) return;
  function set(o, focus) { menu.hidden = !o; btn.setAttribute('aria-expanded', String(o)); if (o && focus) { var a = menu.querySelector('a'); a && a.focus(); } }
  btn.addEventListener('click', function (e) { e.stopPropagation(); set(menu.hidden, true); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.tabs__dd')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
})();

/* אורי 26.10: בנחיתה העשור הפתוח הוא 1940 (הראשון), לא 1950 — מפעילים את אותו מנגנון של לחיצה, כך שגם כרטיס הסיפורים מתעדכן */
(function () {
  var b = document.querySelector('.strip[data-d="1940"] button');
  if (b && !b.closest('.strip').classList.contains('is-open')) b.click();
})();

/* אורי 26.10: "הקהילה של היום" — דפדוף בין 12 הקהילות (הנתונים נלקחים מרשת הקהילות בעמוד); סמל המועצה נשאר קבוע */
(function () {
  var card = document.querySelector('.today__card'), prev = document.getElementById('todayPrev'), next = document.getElementById('todayNext');
  if (!card || !prev || !next) return;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var list = Array.prototype.map.call(document.querySelectorAll('#railRow a.tile'), function (a) {
    var nm = a.querySelector('.tile__name'), img = a.querySelector('img');
    return { h: a.getAttribute('href'), n: nm.firstChild.textContent.trim(), y: nm.querySelector('.y').textContent, src: img.getAttribute('src'), set: img.getAttribute('srcset') };
  });
  if (!list.length) return;
  var img = card.querySelector('img'), box = card.querySelector('.today__box'), status = document.getElementById('todayStatus');
  var cur = Math.max(0, list.map(function (c) { return c.h; }).indexOf(card.getAttribute('href')));
  function paint() {
    var c = list[cur];
    card.href = c.h; img.srcset = c.set; img.src = c.src;
    box.querySelector('.today__name').innerHTML = c.n + ' <span class="y">' + c.y + '</span>';
    box.querySelector('.today__text').textContent = 'תיעוד ימי ההקמה של ' + c.n + ': צילומים, מסמכים וזיכרונות של המייסדים מתוך אוסף הארכיון.';
    status.textContent = c.n + ', ' + (cur + 1) + ' מתוך ' + list.length;
  }
  function go(d) {
    cur = (cur + d + list.length) % list.length;
    if (reduced) return paint();
    img.classList.add('is-swap'); box.classList.add('is-swap');
    setTimeout(function () {
      paint();
      var done = function () { img.classList.remove('is-swap'); box.classList.remove('is-swap'); };
      img.complete ? done() : (img.onload = img.onerror = done);
    }, 200);
  }
  prev.addEventListener('click', function () { go(-1); });
  next.addEventListener('click', function () { go(1); });
})();
