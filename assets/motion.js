/* שער הארכיון · עמוד הבית v2 · שכבת התנועה (impeccable animate)
   נטען ב-defer לפני app.js, ומאותחל ב-DOMContentLoaded (אחרי app.js). המחלקה .im-js נוספת בשורה אחת ב-<head>, כדי שרגע ההירו יתחיל מהצביעה הראשונה.
   לא מתבונן ב-DOM: app.js שולח אירועים מפורשים (document 'sng:change'), וכאן רק מלווים אותם בתנועה. */
(function () {
  'use strict';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reduced() { return mq.matches; }
  var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var canAnimate = typeof Element !== 'undefined' && 'animate' in Element.prototype;

  /* מקשי ניווט (חצים, Home/End, Tab) הם סריקה מהירה: מה שהם מחליפים מתחלף מיד, בלי מעבר.
     Enter ורווח על כפתור הם בחירה, ונשארים עם התנועה. העכבר מאפס. (emil-design-eng) */
  var navKeyAt = -1e9;
  document.addEventListener('keydown', function (e) {
    if (/^(Arrow|Page)|^(Home|End|Tab)$/.test(e.key)) navKeyAt = Date.now();
  }, true);
  function pointerUsed() { navKeyAt = -1e9; }
  document.addEventListener('pointerdown', pointerUsed, true);
  document.addEventListener('mousemove', pointerUsed, { capture: true, passive: true });
  function byNavKey() { return Date.now() - navKeyAt < 400; }

  function anim(el, frames, opts) {
    if (!canAnimate || !el) return null;
    try { return el.animate(frames, opts); } catch (e) { return null; }
  }

  /* ---------- כניסות בגלילה ---------- */
  // [selector, material, delay]
  var TARGETS = [
    ['.treasures .section__head', 'rise', 0],
    ['.timeline .section__head', 'rise', 0],
    ['.decades-nav', 'axis', 0],                 // v38: קו השיער נמתח והסמן הזהב נפתח עליו (בלי stagger ללשוניות — excessive-motion)
    ['.tl-body', 'rise', 160],
    ['.tl-all', 'rise', 0],
    ['.recent .section__head', 'rise', 0]
  ];
  var pending = [];
  var io = null;

  function reveal(el, instant) {
    if (!el.classList.contains('im-pending')) return;
    if (instant) {
      el.classList.add('im-instant');
      el.classList.remove('im-pending');
      void el.offsetWidth;
      el.classList.remove('im-instant', 'im-r');
    } else {
      el.classList.remove('im-pending');
      // אחרי הכניסה מחזירים לרכיב את המעברים שלו (ריחוף וכו')
      setTimeout(function () { el.classList.remove('im-r'); }, 2400);
    }
    pending = pending.filter(function (p) { return p !== el; });
    if (io) io.unobserve(el);
  }
  function finish(el) {
    el.classList.add('im-instant');
    void el.offsetWidth;
    el.classList.remove('im-r');
    void el.offsetWidth;
    el.classList.remove('im-instant');
  }
  function revealAll(instant) { pending.slice().forEach(function (el) { reveal(el, instant); }); }

  function sweep() {
    // מה שכבר מעל קו התחתון של המסך (גם אם דילגו עליו בקפיצה) נחשף
    var limit = window.innerHeight * 0.92;
    pending.slice().forEach(function (el) {
      if (el.getBoundingClientRect().top < limit) reveal(el, false);
    });
  }

  function setupReveals() {
    if (reduced() || !('IntersectionObserver' in window)) return;
    var limit = window.innerHeight * 0.92;
    // קריאה אחת של כל המיקומים, ואז כתיבה: בלי פריסה כפויה לכל רכיב
    var found = [];
    TARGETS.forEach(function (t) {
      document.querySelectorAll(t[0]).forEach(function (el) { found.push({ el: el, t: t, top: el.getBoundingClientRect().top }); });
    });
    found.forEach(function (f) {
      if (f.top < limit) return; // כבר במסך: בלי הסתרה
      var el = f.el, t = f.t;
      el.setAttribute('data-im', t[1]);
      if (t[2]) el.style.setProperty('--im-delay', t[2] + 'ms');
      if (t[1] === 'list') Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty('--im-i', i); });
      el.classList.add('im-pending');   // מוסתר בלי מעבר (מחוץ למסך)
      pending.push(el);
    });
    if (!pending.length) return;
    void document.body.offsetWidth;     // פריסה אחת לכולם, ורק אז מפעילים מעברים
    pending.forEach(function (el) { el.classList.add('im-r'); });

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) reveal(e.target, false); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    pending.forEach(function (el) { io.observe(el); });

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking || !pending.length) return; ticking = true;
      requestAnimationFrame(function () { ticking = false; sweep(); });
    }, { passive: true });
    // מיקוד מקלדת לעולם לא נוחת על תוכן שקוף
    document.addEventListener('focusin', function (e) {
      if (!e.target.closest) return;
      var host = e.target.closest('.im-pending');
      if (host) reveal(host, true);
      var mid = e.target.closest('.im-r');
      if (mid) finish(mid);
    });
    // לחיצה על רכיב שעוד נכנס: הכניסה מסתיימת מיד
    document.addEventListener('pointerdown', function (e) {
      var mid = e.target.closest && e.target.closest('.im-r:not(.im-pending)');
      if (mid) finish(mid);
    }, true);
    window.addEventListener('beforeprint', function () { revealAll(true); });
    if (mq.addEventListener) mq.addEventListener('change', function () { if (reduced()) revealAll(true); });
  }

  /* ---------- מעבר צילומים: הצילום הקודם דוהה מעל החדש ---------- */
  // כל החלפות הצילום בעמוד באותה שפה כמו באוצרות: הצילום הקודם דוהה 460ms והחדש מתיישב מהגדלה קלה
  var IMAGE = { treasure: { dur: 460, settle: true }, peek: { dur: 460 }, timeline: { dur: 460, settle: true }, 'timeline-decade': { dur: 460, settle: true }, preview: { dur: 460, settle: true } };
  var ghosts = new Map(); // img -> { ghost, inAnim }
  function imageSwap(img, oldSrc, kind) {
    var opts = IMAGE[kind] || { dur: 300 };
    var st = ghosts.get(img) || {};
    // ביטול מעבר קודם: המצב הסופי נקבע מיד (ux: cancellable-state-transitions)
    if (st.ghost) st.ghost.remove();
    if (st.inAnim) st.inAnim.cancel();
    st = {}; ghosts.set(img, st);
    if (!oldSrc || byNavKey()) return; // ניווט מקלדת: מיד. v38: גם עשור חדש = crossfade כמו כל הצילומים בעמוד (fade-crossfade)
    var g = document.createElement('img');
    g.className = 'im-ghost'; g.alt = ''; g.setAttribute('aria-hidden', 'true');
    g.src = oldSrc;
    img.parentNode.appendChild(g);
    st.ghost = g;
    var go = function () {
      if (st.ghost !== g) return;
      var r = reduced();
      var a = anim(g, [{ opacity: 1 }, { opacity: 0 }], { duration: r ? 200 : opts.dur, easing: 'ease-out', fill: 'forwards' });
      // בלי "התיישבות" כשהעכבר מעל ההדפס (זום פעיל): שתי אנימציות transform על אותה תמונה נתקעות זו בזו
      var zoomed = img.closest('.is-zoom');
      if (!r && opts.settle && !zoomed) st.inAnim = anim(img, [{ transform: 'scale(1.035)' }, { transform: 'none' }], { duration: opts.dur * 1.6, easing: EASE });
      var done = function () { if (st.ghost === g) st.ghost = null; g.remove(); };
      if (a) a.onfinish = done; else done();
    };
    (img.decode ? img.decode() : Promise.resolve()).then(go, go);
  }

  /* ---------- אוצרות: קו המסגרת יוצא מהצילום ונמתח אל השנה, יחד עם החלפת הצילום (לא מנותק ממנו) ---------- */
  // מעבר בין אוצרות: הקו יוצא ונכנס שוב משמאל לימין (אורי). השנתה נאספת למעלה, הקו האופקי ממשיך החוצה ימינה,
  // ואז נבנה מחדש משמאל לימין והשנתה יורדת — כמו בכניסה הראשונה, בקצב קצר יותר (פעולה חוזרת)
  function frameLine(img) {
    var stage = img.closest('.treasures__stage'), text = stage && stage.querySelector('.treasure__text');
    if (!text || byNavKey() || reduced() || !text.animate) return;
    try {
      text.getAnimations({ subtree: true }).forEach(function (a) { if (a.effect && a.effect.pseudoElement) a.cancel(); });
      var L = 'left center', R = 'right center';
      text.animate([{ transform: 'scaleY(1)', transformOrigin: 'center top' }, { transform: 'scaleY(0)', transformOrigin: 'center top' }], { pseudoElement: '::after', duration: 120, easing: 'ease-in', fill: 'forwards' });
      text.animate([{ transform: 'scaleX(1)', transformOrigin: R }, { transform: 'scaleX(0)', transformOrigin: R }], { pseudoElement: '::before', duration: 220, delay: 100, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
      var inn = text.animate([{ transform: 'scaleX(0)', transformOrigin: L }, { transform: 'scaleX(1)', transformOrigin: L }], { pseudoElement: '::before', duration: 560, delay: 340, easing: EASE, fill: 'forwards' });
      var tick = text.animate([{ transform: 'scaleY(0)', transformOrigin: 'center top' }, { transform: 'scaleY(1)', transformOrigin: 'center top' }], { pseudoElement: '::after', duration: 220, delay: 880, easing: EASE, fill: 'forwards' });
      // בסוף: מנקים את כל האנימציות כדי שהמצב הסטטי (CSS) יחזור לשלוט
      tick.onfinish = function () { text.getAnimations({ subtree: true }).forEach(function (a) { if (a.effect && a.effect.pseudoElement) a.cancel(); }); };
    } catch (e) {}
  }

  /* ---------- אוצרות: כניסה ראשונה — אותה שפה כמו פתיחת ההירו, במינון שקט ----------
     ההדפס נחשף מימין לשמאל (כמו משטח החול בהירו), הצילום מופיע מתוכו בשקיפות בלבד, הטקסט עולה בזה אחר זה
     (כמו לוגו ← פתיח ← חיפוש), הקו נבנה מהשנה אל ההדפס, ובסוף התמונות הקטנות. פעם אחת בלבד. */
  (function () {
    var stage = document.getElementById('trStage');
    if (!stage || !stage.animate || reduced() || !('IntersectionObserver' in window)) return;
    if (stage.getBoundingClientRect().top < window.innerHeight * 0.92) return; // כבר במסך בטעינה: בלי הסתרה
    var text = stage.querySelector('.treasure__text');
    stage.classList.add('tr-intro-pending');
    function go() {
      io.disconnect();
      var WIPE = 'cubic-bezier(0.76, 0, 0.24, 1)', OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
      var a = function (el, frames, o) { if (el) try { el.animate(frames, Object.assign({ fill: 'backwards' }, o)); } catch (e) {} };
      a(stage.querySelector('.treasure__mat'), [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 900, easing: WIPE });
      a(stage.querySelector('.treasure__peek'), [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 700, delay: 380, easing: WIPE });
      a(document.getElementById('trImg'), [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 300, easing: 'ease-out' }); // בלי הגדלה: בתוך מסגרת ההגדלה נראתה כקפיצה
      ['trYear', 'trTitle', 'trPlace', 'trLink'].forEach(function (id, i) {
        a(document.getElementById(id), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 300 + i * 110, easing: OUT });
      });
      // הקו נבנה משמאל לימין: יוצא מההדפס, נמתח אל עמודת הטקסט, ואז השנתה יורדת אל השנה
      a(text, [{ transform: 'scaleX(0)', transformOrigin: 'left center' }, { transform: 'scaleX(1)', transformOrigin: 'left center' }], { pseudoElement: '::before', duration: 1000, delay: 760, easing: EASE });
      a(text, [{ transform: 'scaleY(0)', transformOrigin: 'center top' }, { transform: 'scaleY(1)', transformOrigin: 'center top' }], { pseudoElement: '::after', duration: 320, delay: 1680, easing: EASE });
      Array.prototype.forEach.call(document.querySelectorAll('#trSheet > li'), function (li, i) {
        a(li, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 1000 + i * 60, easing: OUT });
      });
      stage.classList.remove('tr-intro-pending');
    }
    var io = new IntersectionObserver(function (entries) { if (entries.some(function (e) { return e.isIntersecting; })) go(); }, { threshold: 0.3 });
    io.observe(stage);
    // מקלדת / הדפסה: מציגים מיד
    stage.addEventListener('focusin', function () { if (stage.classList.contains('tr-intro-pending')) { io.disconnect(); stage.classList.remove('tr-intro-pending'); } });
    window.addEventListener('beforeprint', function () { stage.classList.remove('tr-intro-pending'); });
  })();

  /* ---------- 7 באוקטובר: הלוח מתרחב לקצוות לפי גלילת העכבר ----------
     השוליים (96px) נאכלים ברציפות מהרגע שהלוח נכנס מתחתית המסך ועד שראשו מגיע לאמצע המסך — שם הוא כבר מלא.
     עדכון אחד לכל פריים (rAF), רק משתנה CSS אחד; בתנועה מופחתת: מלא מההתחלה, בלי תלות בגלילה. */
  (function () {
    var sec = document.getElementById('oct7');
    if (!sec) return;
    var pin = sec.querySelector('.oct7__pin');
    var queued = false, last = -1;
    if (reduced()) { sec.style.setProperty('--oct7-in', '0px'); sec.classList.add('oct7--reduced'); }
    // המעבר: כמו ההחלפה בהירו (משטח נפרש מימין, ואז הצילום) וכמו כניסת האוצרות (טקסט עולה שורה אחר שורה)
    var WIPE = 'cubic-bezier(0.76, 0, 0.24, 1)', OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
    var wash = sec.querySelector('.oct7__wash'), photoB = sec.querySelector('.oct7__photo-b'), photoBImg = photoB && photoB.querySelector('img');
    var cap = sec.querySelector('.oct7__photo figcaption');
    var textA = sec.querySelectorAll('.oct7__panel--a .focus-decade__card > *'), textB = sec.querySelectorAll('.oct7__panel--b .focus-decade__card > *');
    var panelA = sec.querySelector('.oct7__panel--a'), panelB = sec.querySelector('.oct7__panel--b');
    function stop(el) { if (el && el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); }); }
    function swapPanel(toB) {
      [wash, photoB, photoBImg, cap, panelA, panelB].forEach(stop);
      Array.prototype.forEach.call(textA, stop); Array.prototype.forEach.call(textB, stop);
      sec.classList.toggle('fd-b', toB);
      if (reduced() || !sec.animate) return;
      var inText = toB ? textB : textA, outPanel = toB ? panelA : panelB;
      // היציאה מהירה מהכניסה: הטקסט הקודם דוהה ב-200ms
      outPanel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
      if (toB) {
        wash.animate([{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0)' }], { duration: 900, easing: WIPE });
        photoB.animate([{ clipPath: 'inset(0 0 0 100%)', opacity: 1 }, { clipPath: 'inset(0)', opacity: 1 }], { duration: 780, delay: 120, easing: WIPE, fill: 'backwards' });
        if (photoBImg) photoBImg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 400, easing: 'ease-out', fill: 'backwards' });
      } else {
        // חזרה: אותה תנועה הפוך — המשטח והצילום נאספים חזרה ימינה, והדיו והקומביין נחשפים
        wash.animate([{ clipPath: 'inset(0)' }, { clipPath: 'inset(0 0 0 100%)' }], { duration: 900, easing: WIPE });
        photoB.animate([{ clipPath: 'inset(0)', opacity: 1 }, { clipPath: 'inset(0 0 0 100%)', opacity: 1 }], { duration: 780, easing: WIPE });
        if (cap) cap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 600, fill: 'backwards' });
      }
      Array.prototype.forEach.call(inText, function (el, i) {
        el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 300 + i * 110, easing: OUT, fill: 'backwards' });
      });
    }
    function sync() {
      queued = false;
      var vh = window.innerHeight, top = sec.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, (vh - top) / (vh / 2)));   // 0 = נכנס מלמטה, 1 = ראש הלוח באמצע המסך
      var inset = sec.classList.contains('oct7--reduced') ? 0 : Math.round(96 * (1 - p) * 10) / 10;   // 96px בכניסה: הלוח קטן בבירור, וההתרחבות מורגשת בעין
      if (inset !== last) { last = inset; sec.style.setProperty('--oct7-in', inset + 'px'); }
      // נעיצה: ב-40% ממרחק הנעיצה התוכן מתחלף (חזרה ב-28%, בלי הבהוב סביב הסף), כך ש"עשור בפוקוס" נשאר על המסך את רוב הדרך
      var pinTop = parseFloat(getComputedStyle(pin).top) || 0, dist = sec.offsetHeight - pin.offsetHeight;
      var raw = dist > 0 ? Math.min(1, Math.max(0, (pinTop - top) / dist)) : 0;
      var isB = sec.classList.contains('fd-b');
      if (!isB && raw > .4) swapPanel(true);
      else if (isB && raw < .28) swapPanel(false);
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(sync); } }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    sec.addEventListener('focusin', function (e) {
      var b = !!e.target.closest('.oct7__panel--b'), a = !!e.target.closest('.oct7__panel--a');
      if (!a && !b) return;
      var dist = sec.offsetHeight - pin.offsetHeight, pinTop = parseFloat(getComputedStyle(pin).top) || 0;
      var y = window.scrollY + sec.getBoundingClientRect().top - pinTop + (b ? dist * .7 : dist * .1);
      if ((b && !sec.classList.contains('fd-b')) || (a && sec.classList.contains('fd-b'))) window.scrollTo(0, y);
    });
    sync();
  })();

  /* ---------- 7 באוקטובר: כניסה פשוטה כמו באוצרות ----------
     כשהלוח נכנס למסך: הצילום מופיע בשקיפות, והטקסט עולה שורה אחר שורה (כותרת קטנה, שנה, סוג, כותרת, טקסט, כפתור). פעם אחת. */
  (function () {
    var board = document.querySelector('.oct7__board');
    if (!board || !board.animate || reduced() || !('IntersectionObserver' in window)) return;
    if (board.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    board.classList.add('o7-intro-pending');
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      var OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
      var a = function (el, f, o) { if (el) try { el.animate(f, Object.assign({ fill: 'backwards' }, o)); } catch (e) {} };
      a(board.querySelector('.oct7__photo > img'), [{ opacity: 0 }, { opacity: .89 }], { duration: 900, delay: 100, easing: 'ease-out' });
      Array.prototype.forEach.call(board.querySelectorAll('.oct7__panel--a .focus-decade__card > *'), function (el, i) {
        a(el, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 200 + i * 110, easing: OUT });
      });
      board.classList.remove('o7-intro-pending');
    }, { threshold: 0.35 });
    io.observe(board);
  })();

  /* ---------- פרסומים אחרונים: כניסה פשוטה כמו באוצרות ----------
     הכרטיס (צילום + תקציר) נחשף מימין לשמאל והצילום מופיע בשקיפות; השורות עולות אחת אחרי השנייה. פעם אחת. */
  (function () {
    var body = document.querySelector('.recent__body');
    if (!body || !body.animate || reduced() || !('IntersectionObserver' in window)) return;
    if (body.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    body.classList.add('rc-intro-pending');
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      var WIPE = 'cubic-bezier(0.76, 0, 0.24, 1)', OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
      var a = function (el, f, o) { if (el) try { el.animate(f, Object.assign({ fill: 'backwards' }, o)); } catch (e) {} };
      a(body.querySelector('.preview'), [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 900, easing: WIPE });
      a(document.getElementById('pvImg'), [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 300, easing: 'ease-out' });
      a(document.getElementById('pvText'), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 520, easing: OUT });
      Array.prototype.forEach.call(body.querySelectorAll('#ledger > li'), function (li, i) {
        a(li, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 200 + i * 110, easing: OUT });
      });
      body.classList.remove('rc-intro-pending');
    }, { threshold: 0.3 });
    io.observe(body);
    body.addEventListener('focusin', function () { if (body.classList.contains('rc-intro-pending')) { io.disconnect(); body.classList.remove('rc-intro-pending'); } });
  })();

  /* ---------- טקסט שמתחלף: נכנס בעדינות (היציאה מיידית) ---------- */
  var TEXT = { 'treasure-title': [8, 340], 'treasure-place': [6, 340], 'preview-meta': [6, 340], 'preview-text': [8, 340] }; // התצוגה בפרסומים כמו הטקסט באוצרות
  function swapIn(el, dist, dur) {
    var r = reduced();
    return anim(el, r ? [{ opacity: 0 }, { opacity: 1 }]
                      : [{ opacity: 0, transform: 'translateY(' + (dist || 6) + 'px)' }, { opacity: 1, transform: 'none' }],
      { duration: r ? 180 : (dur || 340), easing: EASE });
  }
  function textSwap(el, kind) {
    if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
    if (byNavKey()) return;
    var c = TEXT[kind] || [6, 300];
    swapIn(el, c[0], c[1]);
  }

  /* ---------- השנה: רק הספרות שהשתנו מתגלגלות ---------- */
  var measurer = null;
  function digitWidth(el, ch) {
    if (!measurer) { measurer = document.createElement('span'); measurer.setAttribute('aria-hidden', 'true'); measurer.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;letter-spacing:inherit'; }
    el.appendChild(measurer); measurer.textContent = ch; var w = measurer.getBoundingClientRect().width; measurer.remove(); return w;
  }
  // השנה: Material 3 "fade through" (ui-ux-pro-max: אין קשר מרחבי בין שני הערכים → בלי תנועה למעלה/למטה).
  // השנה כולה כיחידה אחת: הישנה דוהה מהר (90ms, האצה), החדשה נכנסת בדהייה + הגדלה עדינה 92%→100% (210ms, האטה).
  // ההחלפה קורה כשהשנה שקופה — לכן גם כשהרוחב משתנה אין קפיצה נראית.
  var yearSeq = new WeakMap();
  function yearRoll(el, prev, next, dir) {
    var seq = (yearSeq.get(el) || 0) + 1; yearSeq.set(el, seq);
    el.getAnimations().forEach(function (a) { a.cancel(); });
    el.textContent = next;
    if (byNavKey() || !canAnimate) return;
    if (reduced()) { swapIn(el, 0); return; }
    el.textContent = prev;
    var out = anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: 'cubic-bezier(.3, 0, 1, 1)', fill: 'forwards' });
    var go = function () {
      if (yearSeq.get(el) !== seq) return;
      if (out) out.cancel();
      el.textContent = next;
      anim(el, [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 210, easing: 'cubic-bezier(0, 0, 0, 1)', fill: 'backwards' });
    };
    if (out) out.onfinish = go; else go();
  }


  /* ---------- ציר הזמן: עשור חדש ופריט שנפתח ---------- */
  function listIn(items) {
    if (byNavKey()) return; // מעבר בין עשורים בחצים: הרשימה מתחלפת מיד
    var r = reduced();
    items.forEach(function (li, i) {
      // v38: כניסה בשפת העמוד — עלייה 14px + דהייה, Material emphasized, ‏40ms בין פריט לפריט (stagger-sequence)
      li.getAnimations().forEach(function (x) { x.cancel(); }); // החלפה מהירה בין עשורים מבטלת את הקודמת (cancellable-state-transitions)
      anim(li, r ? [{ opacity: 0 }, { opacity: 1 }]
                 : [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
        { duration: r ? 200 : 400, delay: r ? 0 : Math.min(i, 5) * 40, easing: 'cubic-bezier(.2, 0, 0, 1)', fill: 'backwards' });
    });
  }

  /* ---------- ציר הזמן: עשור חדש ⇐ ההדפסה מונחת מחדש והצילום נחשף מתוך משטח החול (ברוח 5 ו-9).
     פעולה שחוזרת הרבה: קצר מכניסת הגלילה (emil-design-eng), ובמקלדת מיידי ---------- */
  /* v38: עשור חדש ⇐ ההדפסה ישרה ונשארת במקומה (בלי הטיה ובלי חשיפת תריס); הצילום מתחלף ב-crossfade (imageSwap),
     והכיתוב "שנות ה-X" נכנס בדהייה + 6px. עשור ריק: המסגרת דוהה פנימה. במקלדת — מיד */
  function decadeIn(fig) {
    var frame = fig.querySelector('.tl-photo__frame'), cap = fig.querySelector('.tl-photo__cap');
    [fig, frame, cap].forEach(function (el) { if (el) el.getAnimations().forEach(function (a) { a.cancel(); }); });
    if (byNavKey()) return;
    if (cap) swapIn(cap, reduced() ? 0 : 6, 340);
    if (fig.classList.contains('is-empty') && frame) anim(frame, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
  }

  document.addEventListener('sng:change', function (e) {
    var d = e.detail || {};
    try {
      if (d.type === 'image') { imageSwap(d.el, d.oldSrc, d.kind); if (d.kind === 'treasure') frameLine(d.el); } // במעבר בין אוצרות הקו יוצא ונכנס שוב
      else if (d.type === 'text') textSwap(d.el, d.kind);
      else if (d.type === 'year') yearRoll(d.el, d.prev, d.next, d.dir || 1);
      else if (d.type === 'list') listIn(d.items || []);
      else if (d.type === 'decade') decadeIn(d.el);
      else if (d.type === 'open' && !byNavKey()) swapIn(d.el, 8);
    } catch (err) { /* תנועה בלבד: המצב כבר נקבע ב-app.js */ }
  });

  function setup() {
    try { setupReveals(); }
    catch (e) {
      // כשל בשכבת התנועה לא משאיר תוכן מוסתר
      document.querySelectorAll('.im-pending').forEach(function (el) { el.classList.remove('im-pending', 'im-r'); });
    }
  }
  // DOMContentLoaded נורה אחרי כל הסקריפטים ב-defer, כלומר אחרי ש-app.js הפך את העשורים ללשוניות.
  // כך ה-stagger של לחצני העשורים חל על הכפתורים הסופיים, בלי תלות בסדר הטעינה.
  if (document.readyState === 'complete') setup();
  else document.addEventListener('DOMContentLoaded', setup);
})();
