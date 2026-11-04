/* עמוד יצירת קשר (2.18): סוג פנייה מהכתובת (?subject=), תצלומים מתחלפים בחצי השני, בדיקת שדות חובה עם הודעות מתחת לשדה
   וסיכום בראש הטופס, בדיקת מגבלות הקבצים, ושליחה מדומה (שולחים → תודה). ביישום זה טופס וורדפרס. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('cform'); if (!form) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* כניסה מדורגת: המחלקה יורדת אחרי שהכניסה הסתיימה, כדי שמצבים מאוחרים לא יפעילו אותה שוב */
  var cp = $('cp');
  setTimeout(function () { if (cp) cp.classList.remove('is-entering'); }, 1800);

  /* הגעה מקישור "הצעת תוכן לארכיון" (?subject=content) ודומיו */
  var qs = new URLSearchParams(location.search), pre = qs.get('subject');
  if (pre) { var sel = $('cf-topic'); if (sel && sel.querySelector('option[value="' + pre.replace(/[^a-z]/g, '') + '"]')) sel.value = pre; }

  /* ---- תצלומים: אחד מוצג ושלושה בהמתנה. החלפה כל 5.5 שניות, דהייה ב-CSS. עצירה כשהלשונית מוסתרת או כשהלוח מחוץ למסך. בהפחתת תנועה: הראשון קבוע ---- */
  var pics = Array.prototype.slice.call(document.querySelectorAll('.cp__photos img')), cur = 0, timer = null;
  function show(i) {
    var prev = pics[cur], img = pics[i];
    if (img === prev) { img.classList.add('is-on'); return; }
    var go = function () {
      prev.classList.remove('is-on', 'is-settle'); prev.classList.add('is-leave');
      setTimeout(function () { prev.classList.remove('is-leave'); }, 520);
      img.classList.remove('is-leave'); img.classList.add('is-on'); img.classList.remove('is-settle'); void img.offsetWidth; img.classList.add('is-settle');
      cur = i;
    };
    (img.decode ? img.decode().catch(function () {}) : Promise.resolve()).then(go);
  }
  function next() { show((cur + 1) % pics.length); }
  function start() { if (timer || reduce.matches || pics.length < 2) return; timer = setInterval(next, 5500); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  if (pics.length > 1 && !reduce.matches) {
    var seen = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { seen = es[0].isIntersecting; if (seen && !document.hidden) start(); else stop(); }, { threshold: .05 }).observe(pics[0].parentNode);
    } else start();
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (seen) start(); });
    reduce.addEventListener && reduce.addEventListener('change', function () { if (reduce.matches) { stop(); show(0); } else if (seen && !document.hidden) start(); });
  }

  /* ---- בדיקה ---- */
  var RULES = [
    { id: 'cf-name', err: 'cf-name-e', label: 'שם מלא', test: function (v) { return v.trim().length > 1; }, msg: 'כתבו את השם המלא.' },
    { id: 'cf-mail', err: 'cf-mail-e', label: 'דוא״ל', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'כתבו כתובת דוא״ל תקינה, למשל name@example.com.' },
    { id: 'cf-msg', err: 'cf-msg-e', label: 'ההודעה', test: function (v) { return v.trim().length > 4; }, msg: 'כתבו כמה מילים על הפנייה.' }
  ];
  var MAX_FILES = 10, MAX_MB = 20;
  function setErr(id, errId, msg) {
    var el = $(id), er = $(errId);
    if (msg) { el.setAttribute('aria-invalid', 'true'); er.textContent = msg; er.hidden = false; }
    else { el.removeAttribute('aria-invalid'); er.hidden = true; er.textContent = ''; }
  }
  RULES.forEach(function (r) {
    var el = $(r.id);
    el.addEventListener('blur', function () { if (el.value !== '' || el.hasAttribute('aria-invalid')) setErr(r.id, r.err, r.test(el.value) ? '' : r.msg); });
    el.addEventListener('input', function () { if (el.hasAttribute('aria-invalid') && r.test(el.value)) setErr(r.id, r.err, ''); });
  });
  /* קבצים: עד 10, כל אחד עד 20MB. נבדק בבחירה ובשליחה */
  function filesMsg() {
    var f = $('cf-files').files; if (!f || !f.length) return '';
    if (f.length > MAX_FILES) return 'אפשר לצרף עד ' + MAX_FILES + ' קבצים. נבחרו ' + f.length + '.';
    for (var i = 0; i < f.length; i++) if (f[i].size > MAX_MB * 1024 * 1024) return 'הקובץ "' + f[i].name + '" גדול מ-' + MAX_MB + 'MB.';
    return '';
  }
  /* אחרי בחירה: בכפתור נכתבת כמות הקבצים (לא שמות), ובריחוף או במיקוד מופיע tooltip עם השמות; שם ארוך מקוצר מההתחלה: …ome-photo.png */
  function shortName(s) { return s.length > 26 ? '\u2026' + s.slice(-24) : s; }
  function picked() {
    var f = $('cf-files').files, n = f ? f.length : 0, tip = $('cf-files-tip');
    var label = !n ? 'צירוף קבצים' : n === 1 ? 'קובץ אחד צורף' : n + ' קבצים צורפו';
    document.querySelector('.cp__picktext').textContent = label;
    $('cf-files-list').textContent = n ? label : '';
    $('cf-files-tip').textContent = '';
    if (n) {
      var ul = document.createElement('ul');
      for (var i = 0; i < n; i++) { var li = document.createElement('li'); var sp = document.createElement('span'); sp.dir = 'ltr'; sp.textContent = shortName(f[i].name); li.appendChild(sp); ul.appendChild(li); }
      tip.appendChild(ul);
      $('cf-files').setAttribute('aria-describedby', 'cf-files-tip cf-files-e');
    } else { tip.hidden = true; $('cf-files').setAttribute('aria-describedby', 'cf-files-e'); }
  }
  (function () {
    var pick = document.querySelector('.cp__pick'), tip = $('cf-files-tip'), input = $('cf-files');
    function show() { if (input.files && input.files.length) tip.hidden = false; }
    function hide() { tip.hidden = true; }
    pick.addEventListener('mouseenter', show); pick.addEventListener('mouseleave', hide);
    input.addEventListener('focus', show); input.addEventListener('blur', hide);
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  })();
  $('cf-files').addEventListener('change', function () { picked(); setErr('cf-files', 'cf-files-e', filesMsg()); });

  var sending = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault(); if (sending) return;
    var bad = [];
    RULES.forEach(function (r) { var ok = r.test($(r.id).value); setErr(r.id, r.err, ok ? '' : r.msg); if (!ok) bad.push({ id: r.id, text: r.label + ': ' + r.msg }); });
    var fm = filesMsg(); setErr('cf-files', 'cf-files-e', fm); if (fm) bad.push({ id: 'cf-files', text: 'צירוף קבצים: ' + fm });
    var sum = $('cf-err');
    if (bad.length) {
      sum.innerHTML = 'עוד לא אפשר לשלוח. יש ' + (bad.length === 1 ? 'שדה אחד' : bad.length + ' שדות') + ' לתיקון:<ul>' + bad.map(function (b) { return '<li><a href="#' + b.id + '">' + b.text + '</a></li>'; }).join('') + '</ul>';
      sum.hidden = false; sum.focus(); return;
    }
    sum.hidden = true;
    /* משוב לשליחה (שליחה מדומה): הכפתור מראה "שולחים…" ואז מצב ההצלחה במקום הטופס */
    var btn = $('cf-send'), lbl = btn.querySelector('span');
    sending = true; btn.setAttribute('aria-disabled', 'true'); lbl.textContent = 'שולחים…';
    setTimeout(function () {
      form.hidden = true; if (cp) cp.classList.add('is-done'); var done = $('cf-done'); done.hidden = false; done.classList.add('is-in'); done.focus({ preventScroll: true });
      var y = done.getBoundingClientRect().top + window.pageYOffset - 140;
      if (y < window.pageYOffset) window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
    }, 700);
  });
  $('cf-err').addEventListener('click', function (e) { var a = e.target.closest('a'); if (!a) return; e.preventDefault(); var t = $(a.getAttribute('href').slice(1)); if (t) t.focus(); });
})();
