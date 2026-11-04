/* כפתור מפת האתר (לסקיצות בלבד): מופיע כשהעכבר בפינה הימנית התחתונה של כל עמוד, עיגול עם אייקון וקישור למפת האתר (אורי).
   הנתיב ../sitemap.html נכון גם מ-1st וגם מ-archive-page-v1, וגם בפרסום ב-GitHub Pages. במכשיר מגע (בלי עכבר) לא מוצג; במקלדת מופיע בפוקוס. */
(function () {
  'use strict';
  if (window.self !== window.top) return; // לא בתוך iframe (הדמיית מכשירים)
  var css = '.sm-fab{position:fixed;right:20px;bottom:20px;z-index:90;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#fff;color:#1F134A;box-shadow:0 2px 10px rgba(31,19,74,.28),0 0 0 1px rgba(31,19,74,.08);opacity:0;transform:scale(.85);pointer-events:none;transition:opacity 200ms ease-out,transform 200ms ease-out,background-color 150ms linear}' +
    '.sm-fab.is-on,.sm-fab:focus-visible{opacity:1;transform:none;pointer-events:auto}' +
    '.sm-fab:hover{background:#B3E0EB}.sm-fab:focus-visible{outline:3px solid #11769C;outline-offset:3px}.sm-fab svg{width:24px;height:24px}' +
    '@media (prefers-reduced-motion:reduce){.sm-fab{transition:opacity 100ms linear;transform:none}}' +
    '@media (hover:none){.sm-fab:not(:focus-visible){display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var a = document.createElement('a');
  a.className = 'sm-fab'; a.href = '../sitemap.html'; a.setAttribute('aria-label', 'מפת האתר'); a.title = 'מפת האתר';
  a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2.5" y="16" width="6" height="5" rx="1"/><rect x="15.5" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5.5 16v-4h13v4"/></svg>';
  document.body.appendChild(a);
  var ZONE = 130, on = false;
  document.addEventListener('mousemove', function (e) {
    var inY = e.clientY > window.innerHeight - ZONE;
    var show = inY && e.clientX > window.innerWidth - ZONE; // פינה ימנית תחתונה (פיזית)
    if (show !== on) { on = show; a.classList.toggle('is-on', show); }
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { on = false; a.classList.remove('is-on'); });
})();
