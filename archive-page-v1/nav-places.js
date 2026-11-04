/* תפריט נפתח מתחת ל"היישובים" בכותרת: זהה לעמוד הבית (design/1st/assets/app.js, v44): 12 היישובים לפי א-ב, פתיחה בריחוף או מיקוד, Esc סוגר. */
(function () {
  var PLACES = [['or-haner', 'אור הנר', '1957'], ['ivim', 'איבים', '1947'], ['erez', 'ארז', '1949'], ['bror-hayil', 'ברור חיל', '1948'], ['gvim', 'גבים', '1947'], ['dorot', 'דורות', '1941'], ['yachini', 'יכיני', '1950'], ['kfar-aza', 'כפר עזה', '1951'], ['mefalsim', 'מפלסים', '1949'], ['nahal-oz', 'נחל עוז', '1951'], ['nir-am', 'ניר עם', '1943'], ['ruhama', 'רוחמה', '1944']];
  var link = document.querySelector('#siteNav ul > li:nth-child(2) > a');
  if (!link) return;
  var li = link.parentNode; li.classList.add('has-sub');
  var rows = PLACES.map(function (p) { return '<li><a href="index.html?type=all&place=' + p[0] + '"><span class="n">' + p[1] + '</span><span class="y">' + p[2] + '</span></a></li>'; }).join('');
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'subnav__toggle'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'subPlaces'); btn.setAttribute('aria-label', 'פתיחת רשימת היישובים');
  btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-next"/></svg>';
  var sub = document.createElement('div');
  sub.className = 'subnav'; sub.id = 'subPlaces';
  sub.innerHTML = '<p class="subnav__sub"><b>12 היישובים</b><span>לפי א-ב</span></p><ol>' + rows + '</ol>';
  link.after(btn); btn.after(sub);
  link.insertAdjacentHTML('beforeend', '<svg class="icon subnav__chev" aria-hidden="true"><use href="#i-next"/></svg>');
  link.addEventListener('click', function (e) {
    if (innerWidth >= 1024 && window.matchMedia && matchMedia('(hover: none)').matches && !li.classList.contains('is-open')) { e.preventDefault(); set(true); }
  });
  link.setAttribute('aria-haspopup', 'true'); link.setAttribute('aria-expanded', 'false');
  link.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); set(true); sub.querySelector('a').focus(); } }); /* חץ למטה פותח ועובר לרשימה; Tab ממשיך הלאה בלי לעבור על 12 היישובים */
  function set(open) { li.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); link.setAttribute('aria-expanded', open ? 'true' : 'false'); btn.setAttribute('aria-label', open ? 'סגירת רשימת היישובים' : 'פתיחת רשימת היישובים'); }
  btn.addEventListener('click', function (e) { e.stopPropagation(); set(!li.classList.contains('is-open')); });
  li.addEventListener('keydown', function (e) { if (e.key === 'Escape' && li.classList.contains('is-open')) { set(false); btn.focus(); e.stopPropagation(); } });
  li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget) && innerWidth >= 1024) set(false); });
  document.addEventListener('click', function (e) { if (!li.contains(e.target) && innerWidth >= 1024) set(false); });
})();

/* 2.13: מגירת הניווט בטאבלט/טלפון — זהה לעמוד הבית (design/1st/assets/app.js, v44 / 2.11): כפתור התפריט פותח מגירה עם רקע כהה,
   המיקוד נשאר בתוכה (Tab מסתובב), Esc / הרקע / כפתור הסגירה סוגרים, ובמעבר לרוחב דסקטופ היא נסגרת */
(function () {
  var header = document.getElementById('siteHeader'), btn = header && header.querySelector('.site-header__menu');
  var drawer = document.getElementById('drawer');
  if (!btn || !drawer) return;
  function set(open) {
    drawer.classList.toggle('is-open', open); drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.documentElement.classList.toggle('is-drawer', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { var a = drawer.querySelector('.drawer__panel a'); a && a.focus(); }
  }
  btn.addEventListener('click', function () { set(true); });
  drawer.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { set(false); btn.focus(); }); });
  document.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('is-open')) return;
    if (e.key === 'Escape') { set(false); btn.focus(); return; }
    if (e.key === 'Tab') {
      var f = drawer.querySelectorAll('.drawer__panel button, .drawer__panel a'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('resize', function () { if (innerWidth >= 1024 && drawer.classList.contains('is-open')) set(false); });
})();
