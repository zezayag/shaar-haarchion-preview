/* עמוד יצירת קשר (דוגמה, דסקטופ): בחירת נושא מראה או מסתירה את שדות הצעת התוכן, בדיקת שדות חובה עם הודעות מתחת לשדה וסיכום בראש הטופס, ואישור שליחה במקום הטופס. אין שליחה אמיתית: ביישום זה טופס וורדפרס. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('cform'); if (!form) return;
  var qs = new URLSearchParams(location.search), pre = qs.get('subject');
  var map = { content: 'content', question: 'question', access: 'access', other: 'other' };
  if (pre && map[pre]) { var r = form.querySelector('input[name="topic"][value="' + map[pre] + '"]'); if (r) r.checked = true; }

  /* הצעת תוכן: מציגים צירוף קבצים והצהרת זכויות */
  var files = $('cf-files-wrap'), rights = $('cf-rights-wrap'), hint = $('cf-msg-h');
  function topic() { return form.querySelector('input[name="topic"]:checked').value; }
  function sync() {
    var c = topic() === 'content';
    files.hidden = !c; rights.hidden = !c;
    hint.textContent = c ? 'בהצעת תוכן: מה החומר, מאיזו שנה, ומי מופיע בו אם אפשר.' : 'כתבו לנו במה אפשר לעזור.';
  }
  form.querySelectorAll('input[name="topic"]').forEach(function (r) { r.addEventListener('change', sync); });
  sync();

  /* בדיקה */
  var RULES = [
    { id: 'cf-name', err: 'cf-name-e', label: 'שם מלא', test: function (v) { return v.trim().length > 1; }, msg: 'נא לכתוב שם מלא.' },
    { id: 'cf-mail', err: 'cf-mail-e', label: 'דוא״ל', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'נא לכתוב כתובת דוא״ל תקינה, למשל name@example.com.' },
    { id: 'cf-msg', err: 'cf-msg-e', label: 'ההודעה', test: function (v) { return v.trim().length > 4; }, msg: 'נא לכתוב כמה מילים על הפנייה.' }
  ];
  function setErr(id, errId, msg) {
    var el = $(id), er = $(errId);
    if (msg) { el.setAttribute('aria-invalid', 'true'); er.textContent = msg; er.hidden = false; }
    else { el.removeAttribute('aria-invalid'); er.hidden = true; er.textContent = ''; }
  }
  RULES.forEach(function (r) { $(r.id).addEventListener('blur', function () { if ($(r.id).value !== '' || $(r.id).hasAttribute('aria-invalid')) setErr(r.id, r.err, r.test($(r.id).value) ? '' : r.msg); }); $(r.id).addEventListener('input', function () { if ($(r.id).hasAttribute('aria-invalid') && r.test($(r.id).value)) setErr(r.id, r.err, ''); }); });
  $('cf-ok').addEventListener('change', function () { if ($('cf-ok').checked) setErr('cf-ok', 'cf-ok-e', ''); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = [];
    RULES.forEach(function (r) { var ok = r.test($(r.id).value); setErr(r.id, r.err, ok ? '' : r.msg); if (!ok) bad.push({ id: r.id, text: r.label + ': ' + r.msg }); });
    if (!$('cf-ok').checked) { setErr('cf-ok', 'cf-ok-e', 'נא לאשר שיצרו איתך קשר.'); bad.push({ id: 'cf-ok', text: 'אישור יצירת קשר: נא לאשר שיצרו איתך קשר.' }); } else setErr('cf-ok', 'cf-ok-e', '');
    var sum = $('cf-err');
    if (bad.length) {
      sum.innerHTML = 'לא ניתן לשלוח עדיין. יש ' + bad.length + ' שדות לתיקון:<ul>' + bad.map(function (b) { return '<li><a href="#' + b.id + '">' + b.text + '</a></li>'; }).join('') + '</ul>';
      sum.hidden = false; sum.focus(); return;
    }
    sum.hidden = true;
    form.hidden = true; $('cf-done').hidden = false; $('cf-done').focus();
    window.scrollTo({ top: $('cf-done').getBoundingClientRect().top + window.pageYOffset - 140, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  $('cf-err').addEventListener('click', function (e) { var a = e.target.closest('a'); if (!a) return; e.preventDefault(); var t = $(a.getAttribute('href').slice(1)); if (t) t.focus(); });
})();
