/* תפריט נפתח מתחת ל"היישובים" בכותרת: זהה לעמוד הבית (design/1st/assets/app.js, v44): 12 היישובים לפי שנת ההקמה, פתיחה בריחוף או מיקוד, Esc סוגר. */
(function () {
  var PLACES = [['dorot', 'דורות', '1941'], ['nir-am', 'ניר עם', '1943'], ['ruhama', 'רוחמה', '1944'], ['gvim', 'גבים', '1947'], ['ivim', 'איבים', '1947'], ['bror-hayil', 'ברור חיל', '1948'], ['erez', 'ארז', '1949'], ['mefalsim', 'מפלסים', '1949'], ['yachini', 'יכיני', '1950'], ['kfar-aza', 'כפר עזה', '1951'], ['nahal-oz', 'נחל עוז', '1951'], ['or-haner', 'אור הנר', '1957']];
  var link = document.querySelector('#siteNav ul > li:nth-child(2) > a');
  if (!link) return;
  var li = link.parentNode; li.classList.add('has-sub');
  var rows = PLACES.map(function (p) { return '<li><a href="index.html?type=all&place=' + p[0] + '"><span class="n">' + p[1] + '</span><span class="y">' + p[2] + '</span></a></li>'; }).join('');
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'subnav__toggle'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'subPlaces'); btn.setAttribute('aria-label', 'פתיחת רשימת היישובים');
  btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-next"/></svg>';
  var sub = document.createElement('div');
  sub.className = 'subnav'; sub.id = 'subPlaces';
  sub.innerHTML = '<p class="subnav__sub"><b>12 היישובים</b><span>לפי שנת ההקמה</span></p><ol>' + rows + '</ol>';
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
