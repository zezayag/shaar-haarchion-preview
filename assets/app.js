/* שער הארכיון · עמוד הבית v2 · התנהגות (שיפור הדרגתי)
   כל התוכן קיים ב-HTML. הקובץ הזה רק משפר: מצבים, החלפות והצעות.
   שכבת התנועה (motion.js) מקבלת אירועים מפורשים: document 'sng:change' עם detail.type. */
(function () {
  'use strict';
  var IMG = 'assets/img/arch/';
  function $(id) { return document.getElementById(id); }
  function emit(detail) {
    try { document.dispatchEvent(new CustomEvent('sng:change', { detail: detail })); } catch (e) { /* בלי תנועה, המצב כבר נקבע */ }
  }
  function setImg(img, file, kind) {
    var next = IMG + file, old = img.getAttribute('src');
    if (old === next) return;
    img.setAttribute('src', next);
    emit({ type: 'image', el: img, oldSrc: old, kind: kind });
  }
  function setText(el, text, kind) {
    if (el.textContent === text) return;
    var prev = el.textContent;
    el.textContent = text;
    emit({ type: 'text', el: el, prev: prev, kind: kind });
  }

  /* ---------- 1. כותרת: שקופה רק מעל ההירו, ואטומה לפני פס היישובים ---------- */
  var header = $('siteHeader');
  var headerQueued = false;
  function syncHeader() {
    headerQueued = false;
    // גלילה ראשונה: תוכן ההירו יוצא, ורקע הכותרת, הלוגו והחיפוש נכנסים יחד
    // מצב בינארי עם השהיה (hysteresis): נכנס אחרי 24px, יוצא רק מתחת ל-8px — אין מצב ביניים ואין הבהוב סביב הסף.
    // המעבר עצמו רץ עד הסוף בזמן קבוע (CSS), כך שהכותרת תמיד מוצגת במלואה או מוסתרת במלואה.
    var y = window.scrollY, wasTop = header.classList.contains('is-top');
    var top = wasTop ? y < 24 : y < 8;
    header.style.removeProperty('--hp');
    header.classList.toggle('is-over', top);
    header.classList.toggle('is-top', top);
    document.documentElement.classList.toggle('is-scrolled', !top);
  }
  function queueHeader() { if (!headerQueued) { headerQueued = true; requestAnimationFrame(syncHeader); } }
  window.addEventListener('scroll', queueHeader, { passive: true });
  window.addEventListener('resize', queueHeader);
  syncHeader();

  /* ---------- 2. חיפוש: הצעות תוך כדי הקלדה (combobox, APG) ---------- */
  // סוג התוכן = פורמט הפוסט בוורדפרס (רגיל = תיעוד)
  var FORMAT_LABEL = { standard: 'תיעוד', gallery: 'גלריה', link: 'קישור', image: 'תמונה', quote: 'ציטוט', video: 'וידאו', audio: 'אודיו' };
  var placesNames = ['המועצה', 'איבים', 'יכיני', 'ארז', 'אור הנר', 'ברור חיל', 'ניר עם', 'נחל עוז', 'גבים', 'דורות', 'כפר עזה', 'מפלסים', 'רוחמה'];
  var topics = ['7 באוקטובר', 'הקמת המועצה האזורית שער הנגב', 'מפעלי שער הנגב', 'בית הספר האזורי', 'קריית החינוך', 'המרכז האזורי', 'מכללת ספיר', 'שותפות שער הנגב–סן דייגו', 'רועי רוטברג', 'שדרות'];
  var suggestions = placesNames.map(function (p) { return { t: p, k: 'יישוב' }; })
    .concat(['1940', '1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020'].map(function (d) { return { t: 'שנות ה-' + d.slice(2), k: 'עשור', q: d }; }))
    .concat(topics.map(function (t) { return { t: t, k: 'נושא' }; }))
    // פוסטים (כרגע: האוצרות שבעמוד) — הכותרת, וסוג התוכן לפי פורמט הפוסט בוורדפרס; בחירה ← לפוסט עצמו
    .concat(Array.prototype.map.call(document.querySelectorAll('#trData a'), function (a) {
      return { t: a.dataset.title, k: FORMAT_LABEL[a.dataset.format] || FORMAT_LABEL.standard, href: a.getAttribute('href'), post: true };
    }));

  var input = $('q'), list = $('qList'), empty = $('qEmpty'), status = $('qStatus');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', 'qList');
  $('qHint').textContent = 'יופיעו הצעות לחיפוש. אפשר לעבור ביניהן בחצים.';
  input.setAttribute('aria-describedby', 'qHint');
  var active = -1, shown = [];

  function clearActive() { active = -1; input.removeAttribute('aria-activedescendant'); }
  function close() {
    list.hidden = true; empty.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    clearActive();
  }
  // השוואה סלחנית: מקף, מקף עברי, גרשיים ומירכאות = רווח ("השישה עשר" מוצא את "השישה-עשר")
  function norm(x) { return x.replace(/[-–־״"׳'’,]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function render() {
    var v = input.value.trim();
    list.innerHTML = '';
    clearActive();
    if (v.length < 2 && document.activeElement !== input) { close(); status.textContent = ''; return; }
    // שדה ריק במיקוד: הדוגמאות מוצגות כרשימת הצעות (כמו בגוגל), במקום שורת צ'יפים קבועה מתחת לשדה
    // תוצאות מתחילות מהאות השנייה; עד אז מוצגות הדוגמאות
    // שורה ראשונה "חיפוש" — חיפוש חופשי של מה שהוקלד; מתחתיה פריטים מהמאגר עם סוג התוכן (יישוב / עשור / נושא)
    shown = v.length < 2 ? examples : [{ t: v, k: 'חיפוש', q: v }].concat(
      suggestions.filter(function (s) { return (s.post || s.t !== v) && (norm(s.t).indexOf(norm(v)) !== -1 || (s.q && s.q.indexOf(v) === 0)); })
        .slice(0, 30));
    if (!shown.length) {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      empty.textContent = 'אין הצעות ל"' + v + '". אפשר לחפש שם יישוב או שנה, למשל 1950.';
      empty.hidden = false;
      status.textContent = empty.textContent;
      return;
    }
    empty.hidden = true;
    shown.forEach(function (s, i) {
      var li = document.createElement('li');
      li.id = 'q-opt-' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      var ic = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ic.setAttribute('class', 'icon'); ic.setAttribute('aria-hidden', 'true');
      var use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '#i-search'); ic.appendChild(use);
      li.appendChild(ic);
      var t = document.createElement('span'); t.className = 'text'; t.textContent = s.t;
      var k = document.createElement('span'); k.className = 'kind'; k.textContent = s.k;
      li.appendChild(t); li.appendChild(k);
      li.addEventListener('mousedown', function (e) { e.preventDefault(); choose(i); });
      list.appendChild(li);
    });
    list.hidden = false;
    // גובה הרשימה: עד קצת מעל תחתית המסך, ומשם גלילה
    list.style.maxHeight = Math.max(160, window.innerHeight - list.getBoundingClientRect().top - 16) + 'px';
    input.setAttribute('aria-expanded', 'true');
    status.textContent = shown.length === 1 ? 'הצעה אחת זמינה.' : shown.length + ' הצעות זמינות.';
  }
  function highlight(i) {
    Array.prototype.forEach.call(list.children, function (el, n) { el.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
    active = i;
    input.setAttribute('aria-activedescendant', 'q-opt-' + i);
  }
  // בחירה: "חיפוש" / דוגמה ← שולחים את הטופס לעמוד תוצאות החיפוש (?s=); פריט מהמאגר ← לעמוד שלו
  var PLACE_URL = {}; Array.prototype.forEach.call(document.querySelectorAll('.places .place a'), function (a) { PLACE_URL[a.querySelector('.name').textContent.trim()] = a.getAttribute('href'); });
  var TOPIC_URL = { 'הקמת המועצה האזורית שער הנגב': '/founding-of-the-council/', 'קריית החינוך': '/regional-center/', 'המרכז האזורי': '/regional-center/',
    'מכללת ספיר': '/sapir-college/', 'שותפות שער הנגב–סן דייגו': '/san-diego-partnership/', 'רועי רוטברג': '/roi-rotberg/',
    // עמודים שעוד לא קיימים בעמוד הבית — כתובות זמניות עד שייבנו בוורדפרס
    '7 באוקטובר': '/topic/october-7/', 'מפעלי שער הנגב': '/shaar-hanegev-factories/', 'בית הספר האזורי': '/regional-school/', 'שדרות': '/sderot/' };
  function urlFor(s) {
    if (s.k === 'יישוב') return PLACE_URL[s.t] || null;
    if (s.k === 'עשור') return '/topic/' + s.q + 's/';
    if (s.k === 'נושא') return TOPIC_URL[s.t] || null;
    if (s.k === 'הצעה') return s.href || null; // כל הצעה ← לעמוד שלה
    if (s.post) return s.href || null;
    return null;
  }
  function choose(i) {
    var s = shown[i], url = urlFor(s);
    close();
    if (url) { window.location.href = url; return; }
    input.value = s.q || s.t;
    input.form.submit();
  }
  // הדוגמאות לקוחות מהקישורים שב-HTML (נשארים כגיבוי בלי JS)
  var examples = Array.prototype.map.call(document.querySelectorAll('.search__examples a'), function (a) { return { t: a.textContent.trim(), k: 'הצעה', href: a.getAttribute('href') }; });
  document.documentElement.classList.add('js-examples-in-list');
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!list.hidden || !empty.hidden) { e.preventDefault(); close(); } return; }
    if (list.hidden || !shown.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight((active + 1) % shown.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight((active - 1 + shown.length) % shown.length); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(active); }
  });
  input.addEventListener('blur', close);

  /* ---------- 3. אוצרות: חצים ומונה, בלי החלפה אוטומטית ---------- */
  var treasures = Array.prototype.map.call(document.querySelectorAll('#trData a'), function (a) {
    return { href: a.getAttribute('href'), img: a.dataset.img, year: a.dataset.year, title: a.dataset.title, place: a.dataset.place, alt: a.dataset.alt, kind: a.dataset.kind || 'photo', format: a.dataset.format || 'standard' };
  });
  var ti = 0;
  var trImg = $('trImg'), trPeek = $('trPeek'), trPrev = $('trPrev'), trNext = $('trNext');
  function showTreasure(i, dir) {
    var prevYear = $('trYear').textContent;
    ti = i;
    var t = treasures[i];
    setImg(trImg, t.img, 'treasure');
    trImg.alt = t.alt;
    // כרזות: מוצגות שלמות על נייר, בצבע המקורי (הסטייל גייד); צילומים: חתוכים למסגרת
    trImg.parentNode.classList.toggle('is-poster', t.kind === 'poster');

    $('trYear').textContent = t.year;
    if (prevYear !== t.year) emit({ type: 'year', el: $('trYear'), prev: prevYear, next: t.year, dir: dir || 1 });
    setText($('trTitle'), t.title, 'treasure-title');
    // מתחת לכותרת: תבנית הפוסט של וורדפרס (Post Format) — רגיל = "תיעוד"
    var fmt = FORMAT_LABEL[t.format] ? t.format : 'standard', pl = $('trPlace');
    pl.querySelector('use').setAttribute('href', '#f-' + fmt);
    setText(pl.querySelector('span'), FORMAT_LABEL[fmt], 'treasure-place');
    $('trLink').setAttribute('href', t.href);
    $('trCounter').textContent = (i + 1) + ' מתוך ' + treasures.length;
    var st = $('trStatus'); if (st) st.textContent = [t.title, t.place, t.year].filter(Boolean).join(', ') + '. ' + (i + 1) + ' מתוך ' + treasures.length;
    sheetBtns.forEach(function (b, n) { b.setAttribute('aria-current', n === i ? 'true' : 'false'); b.tabIndex = n === i ? 0 : -1; });
    var next = treasures[(i + 1) % treasures.length]; // אינסופי: אחרי האחרון מציץ הראשון
    trPeek.parentNode.style.visibility = next ? 'visible' : 'hidden';
    if (next) { setImg(trPeek, next.img, 'peek'); trPeek.parentNode.classList.toggle('is-poster', next.kind === 'poster'); }
  }
  // מסגרת נייר אחידה: ההדפס בגודל שמתאים לפרופורציית התמונה, עם 24px נייר מכל צד, בתוך תא הבמה
  var trFrame = trImg && trImg.closest('.treasure__frame'), MAT = 24;
  function layoutMat() {
    if (!trFrame || !trImg.naturalWidth) return;
    var W = trFrame.clientWidth, H = trFrame.clientHeight, ar = trImg.naturalWidth / trImg.naturalHeight;
    // גובה ההדפס קבוע (לפי גובה הבמה ברזולוציה הנוכחית) — לא קופץ בין סליידים; רק הרוחב משתנה לפי הפרופורציה.
    // כרזה רחבה מהבמה נחתכת מעט בצדדים (object-fit: cover), עד ~4%
    var ih = H - 2 * MAT, iw = W - 2 * MAT; // ההדפס באותו רוחב ובאותו גובה לכל הפריטים; התמונה נכנסת שלמה (contain) והנייר משלים רווח למעלה או בצדדים
    // המשתנים על הבמה כולה: גם עמודת הטקסט מקבלת את גובה ההדפס, כך שהגלריה מיושרת לתחתית התמונה
    var stage = trFrame.parentNode;
    stage.style.setProperty('--mat-w', Math.round(iw + 2 * MAT) + 'px');
    stage.style.setProperty('--mat-h', Math.round(ih + 2 * MAT) + 'px');
    if (trPeek.naturalWidth) stage.style.setProperty('--peek-w', Math.round(ih * trPeek.naturalWidth / trPeek.naturalHeight + 2 * MAT) + 'px');
  }
  if (trFrame) {
    trImg.addEventListener('load', layoutMat); trPeek.addEventListener('load', layoutMat);
    window.addEventListener('resize', layoutMat); layoutMat();
    // התמונה היא קישור לפוסט (כמו "לפוסט המלא"); הקישור עצמו נשאר הפקד הנגיש במקלדת
    var trLinkEl = $('trLink');
    trFrame.addEventListener('click', function (e) {
      // לחיצה על ההצצה (הפריט הבא, לא פעיל) הופכת אותו לפעיל — כמו החץ "הבא"; לחיצה על ההדפס הפעיל ← לפוסט
      if (e.target.closest('.tr-nav')) return; // החצים יושבים על ההדפס, אבל אינם קישור לפוסט
      if (e.target.closest('.treasure__peek')) { showTreasure((ti + 1) % treasures.length, 1); return; }
      window.location.href = trLinkEl.getAttribute('href');
    });
    trFrame.addEventListener('pointerenter', function () { trLinkEl.classList.add('is-hover'); });
    trFrame.addEventListener('pointerleave', function () { trLinkEl.classList.remove('is-hover'); trFrame.classList.remove('is-zoom'); });
    // זום הריחוף רק אחרי תנועת עכבר אמיתית מעל ההדפס: גלילה שמביאה את הסקשן מתחת לסמן העומד לא מגדילה את התמונה
    // ריחוף על "לפוסט המלא" = אותו קישור, ולכן גם הוא מפעיל את הזום העדין על התמונה (ההפך כבר קיים: ריחוף על התמונה מדגיש את הכפתור)
    trLinkEl.addEventListener('pointerenter', function () { trFrame.classList.add('is-zoom'); });
    trLinkEl.addEventListener('pointerleave', function () { trFrame.classList.remove('is-zoom'); });
    trFrame.addEventListener('pointermove', function (e) { trFrame.classList.toggle('is-zoom', !!e.target.closest('.treasure__mat') && !e.target.closest('.tr-nav')); });
  }
  if (treasures.length) {
    trPrev.addEventListener('click', function () { showTreasure((ti - 1 + treasures.length) % treasures.length, -1); }); // אינסופי לשני הצדדים
    trNext.addEventListener('click', function () { showTreasure((ti + 1) % treasures.length, 1); });
  }
  // דף מגע (v3): כפתור תמונה לכל אוצר, לחיצה בוחרת אותו (בנוסף לחצים)
  var sheet = $('trSheet'), sheetBtns = [];
  if (sheet && treasures.length) {
    treasures.forEach(function (t, n) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', [t.title, t.place, t.year].filter(Boolean).join(', '));
      if (t.kind === 'poster') b.classList.add('is-poster');
      b.setAttribute('aria-controls', 'trStage');
      b.setAttribute('aria-current', n === 0 ? 'true' : 'false');
      var im = document.createElement('img');
      im.src = IMG + t.img; im.alt = ''; im.loading = 'lazy'; im.width = 160; im.height = 120;
      b.appendChild(im);
      b.tabIndex = n === 0 ? 0 : -1;
      b.addEventListener('click', function () { if (n !== ti) showTreasure(n, n > ti ? 1 : -1); });
      // עצירת Tab אחת לדף המגע; חצים (RTL: שמאל = הבא), Home / End
      b.addEventListener('keydown', function (e) {
        var k = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 1, ArrowUp: -1 }[e.key], to = null;
        if (k) to = Math.max(0, Math.min(treasures.length - 1, n + k));
        if (e.key === 'Home') to = 0; if (e.key === 'End') to = treasures.length - 1;
        if (to === null || to === n) return;
        e.preventDefault(); showTreasure(to, to > ti ? 1 : -1); sheetBtns[to].focus();
      });
      li.appendChild(b); sheet.appendChild(li); sheetBtns.push(b);
    });
    sheet.hidden = false;
  }

  /* ---------- 4. ציר הזמן: כל העשורים קיימים ב-HTML (פאנל לכל עשור); JS רק מחליף ---------- */
  var tablist = $('decades'), panelsBox = $('tlPanels'), tlImg = $('tlImg'), tlFigure = $('tlFigure');
  var tlAll = $('tlAll'), tlAllLabel = $('tlAllLabel'), tlStatus = $('tlStatus'), tlCap = $('tlCap');
  var panels = Array.prototype.slice.call(panelsBox.querySelectorAll('.tl-panel'));
  var order = panels.map(function (pn) { return pn.dataset.decade; });

  // קישורי העשורים ← לשוניות (APG tabs). ה-tablist הוא div בתוך ה-nav.
  tablist.setAttribute('role', 'tablist'); tablist.setAttribute('aria-label', 'עשורים');
  tablist.parentNode.setAttribute('role', 'none');
  Array.prototype.forEach.call(tablist.querySelectorAll('a.decade'), function (a, i) {
    var d = a.dataset.decade;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'decade'; b.id = 'tab-' + d;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'panel-' + d); b.dataset.decade = d;
    b.style.setProperty('--im-i', i);
    b.innerHTML = a.innerHTML;
    b.addEventListener('click', function (e) { selectDecade((e.detail && slotAt(e.clientX)) || d, { user: true }); });
    b.addEventListener('keydown', function (e) {
      var k = order.indexOf(d), n = null;
      if (e.key === 'ArrowLeft') n = order[(k + 1) % order.length];   // RTL: שמאלה = הבא; v39: במעגל, כמו השורה המסתובבת
      if (e.key === 'ArrowRight') n = order[(k - 1 + order.length) % order.length];
      if (e.key === 'Home') n = order[0];
      if (e.key === 'End') n = order[order.length - 1];
      if (n) { e.preventDefault(); selectDecade(n, { user: true, instant: true }); $('tab-' + n).focus({ preventScroll: true }); }
    });
    a.replaceWith(b);
  });
  // העיגול הזהב (v9 + v7): אחד, נע על קו הציר אל מרכז הלשונית הנבחרת. transform בלבד; מקלדת ושינוי גודל ⇐ מיידי
  var ind = document.createElement('span');
  ind.className = 'decades__ind is-instant'; ind.setAttribute('aria-hidden', 'true');
  tablist.parentNode.appendChild(ind);
  var indOn = null;
  function moveInd(instant) {
    var b = indOn && $('tab-' + indOn);
    if (!b) return;
    ind.classList.toggle('is-instant', !!instant);
    ind.style.transform = 'translateX(' + (spineX() - ind.offsetWidth / 2) + 'px)'; // v39: מרכז הלשונית הימנית (הנבחרת תמיד שם); השורה רחבה מה-nav (יישור הספרות לקווי הגריד)
  }
  window.addEventListener('resize', function () { moveInd(true); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInd(true); });
  panels.forEach(function (pn) {
    var d = pn.dataset.decade;
    pn.setAttribute('role', 'tabpanel');
    pn.setAttribute('aria-labelledby', 'tab-' + d);
    if (!pn.querySelector('a, button')) pn.tabIndex = 0; // פאנל ריק: עדיין ניתן להגיע אליו
    Array.prototype.forEach.call(pn.querySelectorAll('.tl-item'), enhanceItem);
  });

  // v44: בטאבלט/מובייל הצילום עובר לראש הכרטיס הפתוח (ממשיך להתחלף לכל פריט); בדסקטופ — חוזר לעמודה הדביקה
  var tlMq = window.matchMedia ? matchMedia('(max-width: 1023px)') : { matches: false };
  var tlFigHome = tlFigure.parentNode, tlFigNext = tlFigure.nextSibling;
  function placeFigure(li) {
    if (tlMq.matches && li) { var body = li.querySelector('.tl-item__body'); if (body && tlFigure.parentNode !== body) body.insertBefore(tlFigure, body.firstChild); }
    else if (!tlMq.matches && tlFigure.parentNode !== tlFigHome) tlFigHome.insertBefore(tlFigure, tlFigNext);
  }
  function setPhoto(li, kind) {
    placeFigure(li);
    // עשור ריק: ההדפסה נשארת, ריקה, עם כיתוב העשור (v15)
    tlFigure.classList.toggle('is-empty', !li);
    if (li) setImg(tlImg, li.dataset.img, kind || 'timeline');
  }
  function enhanceItem(li) {
    // APG accordion: <h3><button aria-expanded aria-controls>…</button></h3>
    var row = li.querySelector('.tl-item__row');
    var body = li.querySelector('.tl-item__body');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tl-item__row tl-item__btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', body.id);
    while (row.firstChild) btn.appendChild(row.firstChild);
    row.replaceWith(btn);
    btn.addEventListener('click', function () { activate(li, true); });
  }
  // הצילום תמיד שייך לפריט הפתוח (אין החלפה בריחוף)
  function activate(li, user, kind) {
    // סקירה 25.10: פריט פתוח למעלה נסגר ⇐ השורה שנלחצה הייתה קופצת מתחת לסמן. שומרים את מקומה במסך
    var anchor = user && li.querySelector('.tl-item__btn'), before = anchor ? anchor.getBoundingClientRect().top : 0;
    Array.prototype.forEach.call(li.parentNode.querySelectorAll('.tl-item'), function (el) {
      var on = el === li;
      var body = el.querySelector('.tl-item__body');
      var wasHidden = body.hidden;
      el.classList.toggle('is-active', on);
      el.querySelector('.tl-item__btn').setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) el.querySelector('.tl-item__btn').setAttribute('aria-disabled', 'true'); else el.querySelector('.tl-item__btn').removeAttribute('aria-disabled');
      body.hidden = !on;
      if (on && wasHidden && user) emit({ type: 'open', el: body });
    });
    if (anchor) { var dy = anchor.getBoundingClientRect().top - before; if (Math.abs(dy) > 1) window.scrollBy({ top: dy, behavior: 'instant' }); }
    setPhoto(li, kind);
    // v40 (אורי): הכיתוב מתחת לצילום = שנת הפריט הפתוח ("שנת 1950"), לא העשור
    var yr = li.querySelector('.tl-item__year');
    // אורי: "שנת 1941 – יישוב דורות" — כשהפריט שייך ליישוב (קישור ‎/community/…), השם נלקח מפס היישובים; פריט של המועצה — רק השנה
    var lk = li.querySelector('.tl-item__body a[href^="/community/"]'), pl = lk && document.querySelector('.places .place:not(.place--council) a[href="' + lk.getAttribute('href') + '"] .name');
    if (yr) { tlCap.textContent = 'שנת ' + yr.textContent.trim() + (pl ? ' – יישוב ' + pl.textContent.trim() : ''); if (li.dataset.credit) { var cr = document.createElement('small'); cr.className = 'tl-photo__credit'; cr.textContent = li.dataset.credit; tlCap.appendChild(cr); } } // קרדיט לצילום ברישיון CC
  }
  function selectDecadeBase(d, opts) {
    opts = opts || {};
    var panel = $('panel-' + d), short = d.slice(2);
    order.forEach(function (x) {
      var b = $('tab-' + x), on = x === d;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('panel-' + x).hidden = !on;
    });
    var items = Array.prototype.slice.call(panel.querySelectorAll('.tl-item'));
    if (items.length) activate(items[0], false, 'timeline-decade'); else setPhoto(null);
    if (!items.length) tlCap.textContent = 'שנות ה-' + short; // עשור ריק בלבד; אחרת — שנת הפריט הפתוח (activate)
    indOn = d; moveInd(opts.initial || opts.instant);
    tlAll.setAttribute('href', panel.dataset.all);
    tlAll.parentNode.hidden = !items.length; // v38: עשור ריק — בלי "לכל הסיפורים" לעמוד ריק (empty-states: הפאנל כבר מציע דרך אחרת)
    tlAllLabel.textContent = 'לכל הסיפורים של שנות ה-' + short;
    if (!opts.initial) {
      tlStatus.textContent = items.length > 1 ? 'מוצגים ' + items.length + ' פריטים משנות ה-' + short : items.length ? 'מוצג פריט אחד משנות ה-' + short : 'אין עדיין פריטים משנות ה-' + short;
      emit({ type: 'list', el: panel, items: items.length ? items : [panel.firstElementChild] });
      emit({ type: 'decade', el: tlFigure });
    }
    if (opts.user && history.replaceState) history.replaceState(null, '', '#' + d + 's');
  }
  // ---- v39: שורת העשורים מסתובבת (הנבחר תמיד בקצה הימני), וקו מקווקו יורד ממנו אל השנים ברשימה ----
  function tlReduce() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function slotAt(x) { var L = tablist.getBoundingClientRect().left, hit = null; order.forEach(function (o) { var b = $('tab-' + o), l = L + b.offsetLeft; if (x >= l && x < l + b.offsetWidth) hit = o; }); return hit; }
  var spine = document.createElement('div');
  spine.className = 'tl-spine'; spine.setAttribute('aria-hidden', 'true');
  $('timeline').appendChild(spine);
  // v40: הקו עובר מאחורי הכרטיס הפתוח, הנקודות מעליו (שכבה נפרדת באותו מיקום)
  var spineDots = document.createElement('div');
  spineDots.className = 'tl-spine tl-spine--dots'; spineDots.setAttribute('aria-hidden', 'true');
  $('timeline').appendChild(spineDots);
  // הקו יורד ממרכז הלשונית הנבחרת (תמיד הימנית). הרשימה מוזזת פנימה כך שהקו עובר בין קצה הכרטיסים לקצה הסקשן
  function tabHalf() { var b = tablist.querySelector('.decade'); return b ? b.offsetWidth / 2 : 66; }
  // יחסית ל-nav: מרכז הספרה של העשור הנבחר. הנבחר ״דולק״ ומיושר לקו הימני של הגריד — הזזה של 16px (m3.css)
  function spineX() { return tablist.offsetLeft + tablist.offsetWidth - tabHalf() + 16; }
  function snapTabs() { var m = {}; order.forEach(function (x) { m[x] = $('tab-' + x).getBoundingClientRect().left; }); return m; }
  function rotateTabs(d, first, instant) {
    var k = order.indexOf(d), n = order.length;
    // לחיצות מהירות / חץ באמצע תנועה: מבטלים את ה-FLIP הקודם כדי שלשונית לא תישאר מוזזת
    order.forEach(function (x) { $('tab-' + x).getAnimations().forEach(function (a) { if (!(window.CSSTransition && a instanceof CSSTransition)) a.cancel(); }); });
    order.forEach(function (x, i) { var b = $('tab-' + x); b.style.order = (i - k + n) % n; b.classList.toggle('is-wrap', k > 0 && i === 0); });
    if (tablist.scrollWidth > tablist.clientWidth + 1) tablist.scrollTo({ left: 0, behavior: 'instant' }); // v44: שורה שנגללת — הנבחר תמיד בתחילתה
    if (instant || tlReduce() || !first) return;
    var half = tablist.clientWidth / 2;
    order.forEach(function (x) {
      var b = $('tab-' + x), dx = first[x] - b.getBoundingClientRect().left;
      if (!dx) return;
      if (Math.abs(dx) > half) b.animate([{ opacity: .4, transform: 'translateX(' + (dx > 0 ? -24 : 24) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,0,0,1)' });
      else b.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,0,0,1)' });
    });
  }
  // מיקום לפי offsetTop/offsetLeft (לא getBoundingClientRect): מתעלם מ-transform של אנימציות הכניסה (rise / listIn), אז הנקודות לא "קופצות"
  function offTo(el, root) { var x = 0, y = 0; while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x: x, y: y }; }
  function drawSpine() {
    var sec = $('timeline'), nav = tablist.parentNode;
    sec.style.setProperty('--tl-spine-pad', Math.round(nav.clientWidth - spineX() + 20) + 'px');
    // v40: מבנה כמו בפרסומים — ריפוד 24, עמודת שנה 88; הנקודה במקום המילה "שנת", והספרות מתחילות 8px אחריה
    sec.style.setProperty('--tl-year-pad', Math.max(0, Math.round(nav.clientWidth - spineX() - 24 + 6 + 8)) + 'px');
    var panel = panels.filter(function (p) { return !p.hidden; })[0];
    var no = offTo(nav, sec), x = no.x + spineX(), top = no.y + nav.offsetHeight, last = top, dots = '';
    if (panel) Array.prototype.forEach.call(panel.querySelectorAll('.tl-item'), function (li) {
      var yr = li.querySelector('.tl-item__year');
      if (!yr) return;
      var cy = offTo(yr, sec).y + yr.offsetHeight / 2;
      last = cy;
      dots += '<i class="tl-spine__dot' + (li.classList.contains('is-active') ? ' is-on' : '') + '" style="top:' + (cy - top) + 'px"></i>';
    });
    [spine, spineDots].forEach(function (el) { el.style.left = x + 'px'; el.style.top = top + 'px'; el.style.height = Math.max(0, last - top) + 'px'; });
    spineDots.innerHTML = dots;
  }
  function selectDecade(d, opts) {
    opts = opts || {};
    if (!opts.initial && d === indOn) return;
    var first = opts.initial ? null : snapTabs();
    selectDecadeBase(d, opts);
    rotateTabs(d, first, opts.initial || opts.instant);
    // v40 (אורי): השורה דביקה והרשימה גלולה ⇐ בחירת עשור מחזירה לתחילת הרשימה, 16px מתחת לקו (כמו הצילום הדביק — ריווח מינימלי אחיד, אורי: "ככה")
    if (opts.user) {
      var nv = tablist.parentNode, stuckBottom = (parseFloat(getComputedStyle(nv).top) || 0) + nv.offsetHeight + 16;
      var listT = panelsBox.getBoundingClientRect().top;
      if (listT < stuckBottom - 1) window.scrollBy({ top: listT - stuckBottom, behavior: (opts.instant || tlReduce()) ? 'instant' : 'smooth' });
    }
    drawSpine();
    spine.getAnimations().forEach(function (a) { a.cancel(); }); spineDots.getAnimations().forEach(function (a) { a.cancel(); });
    if (!opts.initial && !opts.instant && !tlReduce() && spine.animate) [spine, spineDots].forEach(function (el) { el.animate([{ clipPath: 'inset(0 -8px 100% -8px)' }, { clipPath: 'inset(0 -8px -8px -8px)' }], { duration: 300, delay: 80, easing: 'cubic-bezier(.2,0,0,1)', fill: 'backwards' }); });
  }
  if (tlMq.addEventListener) tlMq.addEventListener('change', function () { var p = panels.filter(function (x) { return !x.hidden; })[0]; placeFigure(p && p.querySelector('.tl-item.is-active')); drawSpine(); });
  if (window.ResizeObserver) new ResizeObserver(function () { drawSpine(); }).observe(panelsBox);
  window.addEventListener('resize', drawSpine);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawSpine);
  panelsBox.addEventListener('click', function () { setTimeout(drawSpine, 0); }); // צבע הנקודה של הפריט הפתוח; שינויי גובה — ResizeObserver

  // v40: הרקע המטושטש של השורה מופיע רק כשהיא דבוקה (אחרת אין מתחתיה מה לטשטש, והשכבה רק מבהירה)
  (function () {
    var nv = tablist.parentNode, raf = 0;
    function check() { raf = 0; var top = parseFloat(getComputedStyle(nv).top) || 0; nv.classList.toggle('is-stuck', nv.getBoundingClientRect().top <= top + 0.5 && $('timeline').getBoundingClientRect().top < top); }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(check); }, { passive: true });
    window.addEventListener('resize', check); check();
  })();

  function decadeFromHash() { var m = location.hash.match(/^#(\d{4})s$/); return m && order.indexOf(m[1]) !== -1 ? m[1] : null; }
  var initialPanel = panelsBox.querySelector('[data-active]') || panels[0];
  selectDecade(initialPanel.dataset.decade, { initial: true });
  function goToHash(e) {
    var d = decadeFromHash();
    if (!d) return;
    selectDecade(d, { instant: !e });
    $('timeline').scrollIntoView({ block: 'start' });
  }
  if (decadeFromHash()) goToHash();
  window.addEventListener('hashchange', goToHash);

  /* ---------- 7. פרסומים אחרונים: תצוגה מקדימה בריחוף ובמיקוד ---------- */
  var ledger = $('ledger');
  var rows = Array.prototype.slice.call(ledger.querySelectorAll('a'));
  var pvImg = $('pvImg'), pvText = $('pvText');
  function preview(i) {
    var a = rows[i];
    setImg(pvImg, a.dataset.img, 'preview');
    setText(pvText, a.dataset.excerpt, 'preview-text');
    rows.forEach(function (r, n) { r.classList.toggle('is-active', n === i); });
  }
  rows.forEach(function (a, i) {
    a.addEventListener('mouseenter', function () { preview(i); });
    a.addEventListener('focus', function () { preview(i); });
  });
  if (rows.length) rows[0].classList.add('is-active');
  // הכרטיס (צילום + תקציר) מקשר לפוסט של השורה הפעילה — כמו ההדפס באוצרות. נשאר מוסתר מקורא מסך ובלי עצירת Tab:
  // הקישור הנגיש הוא השורה עצמה. מעבר עכבר: זום עדין על הצילום והכותרת בשורה הפעילה נצבעת, כמו באוצרות
  var pvCard = document.querySelector('.preview');
  if (pvCard) {
    var activeRow = function () { return ledger.querySelector('a.is-active') || rows[0]; };
    pvCard.addEventListener('click', function () { var a = activeRow(); if (a) window.location.href = a.getAttribute('href'); });
    // מעבר מהיר בין שורה לכרטיס: מבטלים את "ההתיישבות" של ההחלפה (אנימציית transform) כדי שלא תתנגש בזום ותיתקע
    pvCard.addEventListener('pointerenter', function () { var im = document.getElementById('pvImg'); if (im && im.getAnimations) im.getAnimations().forEach(function (a) { a.cancel(); }); pvCard.classList.add('is-zoom'); var a = activeRow(); if (a) a.classList.add('is-hover'); });
    pvCard.addEventListener('pointerleave', function () { pvCard.classList.remove('is-zoom'); rows.forEach(function (r) { r.classList.remove('is-hover'); }); });
  }

  /* ---------- 8. פס היישובים: הצילום ברקע ההירו מתחלף לצילום של היישוב ---------- */
  (function () {
    var hero = document.getElementById('hero'), base = hero && hero.querySelector('.hero__photo'), scrim = hero && hero.querySelector('.hero__scrim');
    var nav = hero && hero.querySelector('.places');
    if (!base || !nav) return;
    var PHOTO = { 'dorot': 'dorot-1941-1.jpg', 'nir-am': 'niram-1949-3.jpg', 'ruhama': 'ruhama-1944-2.jpg', 'gvim': 'gvim-1947-1.jpg',
      'bror-hayil': 'brorhayil-1953-1.jpg', 'erez': 'erez-1950-1.jpg', 'mefalsim': 'mefalsim-1949-1.jpg', 'yachini': 'yachini-1954-1.jpg',
      'kfar-aza': 'kfaraza-1951-1.jpg', 'nahal-oz': 'nahaloz-1953-1.jpg', 'or-haner': 'orhaner-1960-1.jpg', 'council': 'ruhama-1944-3.jpg', 'ivim': 'ivim-mirror-1.jpg' };
    var dflt = base.getAttribute('src'), current = dflt, preloaded = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    function preload() { if (preloaded) return; preloaded = true; Object.keys(PHOTO).forEach(function (k) { new Image().src = 'assets/img/hero/' + PHOTO[k]; }); }
    function swap(src, out) {
      if (src === current) return;
      current = src;
      var layer = document.createElement('div'); layer.className = 'hero__swap'; layer.setAttribute('aria-hidden', 'true');
      var img = document.createElement('img'); img.src = src; img.alt = ''; layer.appendChild(img);
      hero.insertBefore(layer, scrim);
      var done = function () {
        var all = hero.querySelectorAll('.hero__swap'), last = all[all.length - 1];
        if (last !== layer) return; // הגיעה החלפה חדשה יותר — היא תנקה
        for (var i = 0; i < all.length - 1; i++) all[i].remove();
        if (current === dflt) layer.remove(); // חזרה לצילום הבסיס: אין צורך בשכבה
      };
      if (reduce.matches || !layer.animate) { layer.animate ? layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }).onfinish = done : done(); return; }
      // חשיפה בכיוון הקריאה (מימין), ביציאה מהכיוון ההפוך; החול קודם והצילום אחריו
      var from = out ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
      layer.animate([{ clipPath: from }, { clipPath: 'inset(0 0 0 0)' }], { duration: 780, easing: 'cubic-bezier(0.76, 0, 0.24, 1)' }).onfinish = done;
      img.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 720, delay: 280, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
    }
    nav.addEventListener('pointerenter', preload);

    // ---- החלפה אוטומטית: 5 שניות אחרי הנחיתה, ואז כל 5 שניות, לפי סדר הפס; עיגול צהוב מעל הפריט המוצג ----
    var items = Array.prototype.map.call(nav.querySelectorAll('.place'), function (li) {
      var key = (li.querySelector('a').getAttribute('href').match(/community\/([^/]+)/) || [])[1];
      return { li: li, src: PHOTO[key] ? 'assets/img/hero/' + PHOTO[key] : null };
    }).filter(function (x) { return x.src; });
    var councilIdx = items.findIndex(function (x) { return x.src === dflt; });
    // ---- הכי פשוט: כל 7 שניות צילום אקראי אחר; העיגול הצהוב מסמן את היישוב שמוצג ----
    var autoT = 0, inBand = false;
    function mark(i) { items.forEach(function (x, n) { x.li.classList.toggle('is-current', n === i); }); }
    function randomStep() {
      var options = items.map(function (x, n) { return n; }).filter(function (n) { return items[n].src !== current; });
      var i = options[Math.floor(Math.random() * options.length)];
      swap(items[i].src, false); mark(i);
      schedule();
    }
    function schedule() { clearTimeout(autoT); if (!inBand && !reduce.matches && !document.hidden) autoT = setTimeout(randomStep, 7000); }
    document.addEventListener('visibilitychange', schedule);
    mark(councilIdx);
    if (!reduce.matches) { preload(); schedule(); }

    nav.querySelectorAll('.place a').forEach(function (a) {
      var key = (a.getAttribute('href').match(/community\/([^/]+)/) || [])[1];
      var file = PHOTO[key];
      var hoverT = 0;
      function on(delay) {
        clearTimeout(hoverT); preload();
        // מעבר עכבר: הצילום של היישוב, העיגול הצהוב של ההחלפה האוטומטית יורד, וההחלפה מחכה
        // v44 (אורי): אחרי הריחוף הצילום נשאר — וגם העיגול הצהוב נשאר על היישוב שהצילום שלו מוצג
        inBand = true; clearTimeout(autoT);
        var idx = items.findIndex(function (x) { return x.li === a.closest('.place'); });
        if (file) hoverT = setTimeout(function () { swap('assets/img/hero/' + file, false); mark(idx); }, delay);
      }
      // החלפת הצילום רק אחרי 0.35 שניות של ריחוף (מעבר מהיר על הפס לא מחליף); במקלדת — מיד
      a.addEventListener('pointerenter', function () { on(350); });
      a.addEventListener('pointerleave', function () { clearTimeout(hoverT); });
      a.addEventListener('focus', function () { on(0); });
    });
    // יציאה מהפס: הצילום האחרון נשאר, וההחלפה האקראית חוזרת — הבאה בעוד 7 שניות
    function off() { inBand = false; schedule(); }
    nav.addEventListener('pointerleave', off);
    nav.addEventListener('focusout', function (e) { if (!nav.contains(e.relatedTarget)) off(); });
  })();

  /* ---------- 9. שדה החיפוש: טבעת מיקוד רק במקלדת ---------- */
  (function () {
    var row = document.querySelector('.hero .search__row'); if (!row) return;
    var byPointer = false;
    row.addEventListener('pointerdown', function () { byPointer = true; });
    row.addEventListener('focusin', function () { row.classList.toggle('is-pointer', byPointer); byPointer = false; });
    row.addEventListener('focusout', function () { row.classList.remove('is-pointer'); });
  })();
  // שכבת התנועה מאותחלת אחרי זה (DOMContentLoaded), כשכל הרכיבים כבר משופרים
  document.documentElement.classList.add('sng-ready');
})();

/* v44: תפריט במובייל/טאבלט — כפתור Material שפותח את הניווט כגיליון מתחת לכותרת */
(function () {
  var header = document.getElementById('siteHeader'), btn = header && header.querySelector('.site-header__menu');
  if (!btn) return;
  function set(open) {
    header.classList.toggle('is-menu', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'סגירת התפריט' : 'תפריט');
  }
  btn.addEventListener('click', function () { set(!header.classList.contains('is-menu')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('is-menu')) { set(false); btn.focus(); } });
  document.addEventListener('click', function (e) { if (header.classList.contains('is-menu') && !header.contains(e.target)) set(false); });
  header.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  window.addEventListener('resize', function () { if (innerWidth >= 1024) set(false); });
})();

/* v44 (אורי, אפשרות ב): בטלפון/טאבלט פס היישובים = גלולת המועצה בלבד; לחיצה פותחת גיליון תחתון (Material bottom sheet)
   עם המועצה ו-12 היישובים ושנות ההקמה. בדסקטופ — הקישור רגיל */
(function () {
  var mq = window.matchMedia ? matchMedia('(max-width: 1023px)') : { matches: false };
  var places = document.querySelector('.places'); if (!places) return;
  var council = places.querySelector('.place--council a'); if (!council) return;
  var sheet = document.createElement('div');
  sheet.className = 'places-sheet'; sheet.hidden = true;
  var rows = Array.prototype.map.call(places.querySelectorAll('.place:not(.place--council) a'), function (a) {
    return '<li><a href="' + a.getAttribute('href') + '"><span class="n">' + a.querySelector('.name').textContent + '</span><span class="y">' + a.querySelector('.year').textContent + '</span></a></li>';
  }).join('');
  sheet.innerHTML = '<div class="places-sheet__scrim" data-close></div>' +
    '<div class="places-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="psTitle">' +
    '<button type="button" class="places-sheet__handle" data-close aria-label="סגירה"><span aria-hidden="true"></span></button>' +
    '<div class="places-sheet__head"><h2 id="psTitle">12 הקהילות של שער הנגב</h2></div>' +
    '<a class="places-sheet__council" href="' + council.getAttribute('href') + '">המועצה האזורית שער הנגב<svg class="icon" aria-hidden="true"><use href="#i-next"/></svg></a>' +
    '<p class="places-sheet__sub">לפי שנת ההקמה</p><ol>' + rows + '</ol></div>';
  document.body.appendChild(sheet);
  council.setAttribute('aria-haspopup', 'dialog');
  function open() {
    sheet.hidden = false; document.documentElement.classList.add('sheet-open');
    council.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { sheet.classList.add('is-open'); sheet.querySelector('.places-sheet__council').focus(); });
  }
  function close() {
    sheet.classList.remove('is-open'); document.documentElement.classList.remove('sheet-open');
    council.setAttribute('aria-expanded', 'false');
    setTimeout(function () { sheet.hidden = true; }, 260); council.focus();
  }
  council.addEventListener('click', function (e) { if (!mq.matches) return; e.preventDefault(); open(); });
  sheet.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
  // גרירה למטה מהידית / מהכותרת סוגרת (כמו גיליון של Material); פחות מ-80px — חוזר למקום
  var panel = sheet.querySelector('.places-sheet__panel'), y0 = null, dy = 0;
  panel.addEventListener('pointerdown', function (e) { if (!e.target.closest('.places-sheet__handle, .places-sheet__head')) return; y0 = e.clientY; dy = 0; panel.style.transition = 'none'; });
  window.addEventListener('pointermove', function (e) { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); panel.style.transform = 'translateY(' + dy + 'px)'; });
  window.addEventListener('pointerup', function () { if (y0 === null) return; y0 = null; panel.style.transition = ''; panel.style.transform = ''; if (dy > 80) close(); });
})();

/* v44 (אורי): תפריט נפתח מתחת ל"היישובים" בכותרת — המועצה ו-12 היישובים עם שנות ההקמה.
   דסקטופ: מעבר עכבר / מיקוד / כפתור החץ; מובייל: אקורדיון בתוך התפריט (כפתור החץ). Esc סוגר */
(function () {
  var link = document.querySelector('#siteNav a[href="/community/"]'), places = document.querySelector('.places');
  if (!link || !places) return;
  var li = link.parentNode; li.classList.add('has-sub');
  var council = places.querySelector('.place--council a');
  var rows = Array.prototype.map.call(places.querySelectorAll('.place:not(.place--council) a'), function (a) {
    return '<li><a href="' + a.getAttribute('href') + '"><span class="n">' + a.querySelector('.name').textContent + '</span><span class="y">' + a.querySelector('.year').textContent + '</span></a></li>';
  }).join('');
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'subnav__toggle'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'subPlaces'); btn.setAttribute('aria-label', 'פתיחת רשימת היישובים');
  btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-next"/></svg>';
  var sub = document.createElement('div');
  sub.className = 'subnav'; sub.id = 'subPlaces';
  sub.innerHTML = '<p class="subnav__sub"><b>12 היישובים</b><span>לפי שנת ההקמה</span></p><ol>' + rows + '</ol>'; // אורי: בלי כפתור המועצה; כותרת כמו בפוטר
  link.after(btn); btn.after(sub);
  // אורי: בדסקטופ כפתור אחד כמו החיפוש — החץ בתוך הגלולה של "היישובים" (התפריט נפתח בריחוף/מיקוד); כפתור החץ הנפרד רק במובייל
  link.insertAdjacentHTML('beforeend', '<svg class="icon subnav__chev" aria-hidden="true"><use href="#i-next"/></svg>');
  // ui-ux-pro-max "Hover vs Tap": במסך מגע רחב (טאבלט לרוחב) אין ריחוף — הקשה ראשונה פותחת את התפריט, השנייה עוברת לעמוד היישובים
  link.addEventListener('click', function (e) {
    if (innerWidth >= 1024 && window.matchMedia && matchMedia('(hover: none)').matches && !li.classList.contains('is-open')) { e.preventDefault(); set(true); }
  });
  function set(open) { li.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); btn.setAttribute('aria-label', open ? 'סגירת רשימת היישובים' : 'פתיחת רשימת היישובים'); }
  btn.addEventListener('click', function (e) { e.stopPropagation(); set(!li.classList.contains('is-open')); });
  li.addEventListener('keydown', function (e) { if (e.key === 'Escape' && li.classList.contains('is-open')) { set(false); btn.focus(); e.stopPropagation(); } });
  li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget) && innerWidth >= 1024) set(false); });
  document.addEventListener('click', function (e) { if (!li.contains(e.target) && innerWidth >= 1024) set(false); });
})();

/* v44 (אורי): פס היישובים יוצא רק בגלילה השנייה — אחרי שתוכן ההירו כבר יצא בראשונה.
   סף שני עם השהיה (כמו הכותרת): נכנס אחרי 160px, חוזר מתחת ל-120px */
(function () {
  var root = document.documentElement, q = false;
  function sync() { q = false; var y = window.scrollY, out = root.classList.contains('is-places-out'); root.classList.toggle('is-places-out', out ? y > 120 : y > 160); }
  window.addEventListener('scroll', function () { if (!q) { q = true; requestAnimationFrame(sync); } }, { passive: true });
  sync();
})();
