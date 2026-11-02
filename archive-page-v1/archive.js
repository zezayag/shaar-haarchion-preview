/* תבנית עמוד ארכיון (דסקטופ) — דוגמה v1. נתוני הדוגמה: ARCHIVE_POSTS (28 פוסטים אמיתיים מציר הזמן של 1st).
   סוג העמוד ב-?type=settlement|council|tag|decade|search|all קובע רק את הסינון ההתחלתי.
   ההירו נקבע לפי מספר פריטי הסינון הפעילים (יישובים + עשורים + סוגי פוסט + תגית):
   0 → הירו כללי · 1 → ההירו של אותו פריט (יישוב/מועצה, עשור, תגית; סוג פוסט בלבד → כללי) · 2 ומעלה → ההירו של המועצה.
   התפריטים הם בחירה מרובה. מצב הסינון נשמר בכתובת (place, decade, kind, sort, q, shown; ערכים מופרדים בפסיק). */
(function () {
  'use strict';
  var POSTS = window.ARCHIVE_POSTS || [];
  var IMG = '../1st/assets/img/';
  var PLACES = { council: 'המועצה', dorot: 'דורות', 'nir-am': 'ניר עם', ruhama: 'רוחמה', gvim: 'גבים', ivim: 'איבים', 'bror-hayil': 'ברור חיל', erez: 'ארז', mefalsim: 'מפלסים', yachini: 'יכיני', 'kfar-aza': 'כפר עזה', 'nahal-oz': 'נחל עוז', 'or-haner': 'אור הנר' };
  /* שנת הקמה אמיתית (מפס היישובים); תאריך עברי, אוכלוסייה וכביש גישה הם ערכי דוגמה בלבד ולכן רק לדורות ולמועצה */
  var PINFO = {
    council: { name: 'המועצה', year: '1950', bg: 'hero/dorot-1941-1.jpg', extra: [['יישובים', '12', 'f-topic'], ['אוכלוסייה', '9,697 תושבים', 'i-people'], ['תחום שיפוט', '176 אלף דונם', 'i-pin']], about: 'מועצה אזורית שער הנגב היא מועצה בצפון־מערב הנגב, שהוקמה ב־1950 ומאגדת שנים־עשר יישובים: קיבוצים, מושב וכפר סטודנטים. היא גובלת ברצועת עזה ממערב, ושטחה כ־180 אלף דונם. בתחומה פועלים קמפוס המכללה האקדמית ספיר וקריית החינוך שער הנגב.', site: 'http://www.sng.org.il', desc: 'המועצה האזורית שער הנגב מאגדת שנים־עשר יישובים בצפון־מערב הנגב. בארכיון תמצאו את הסיפורים, התצלומים והמסמכים של כולם.', map: 'מועצה אזורית שער הנגב', more: 'לאתר המועצה' },
    dorot: { year: '1941', bg: 'hero/dorot-1941-1.jpg', extra: [['סוג יישוב', 'קיבוץ', 'f-topic'], ['אוכלוסייה', '887 תושבים', 'i-people'], ['גובה', '104 מטר', 'i-pin']], about: 'דורות הוא קיבוץ במישור החוף הדרומי, סמוך לשדרות. הוא הוקם בחנוכה תש״ב (1941) על קרקע שנרכשה מתושבי הכפר הוג׳, בידי עולים מגרמניה שאליהם הצטרפו גרעינים מהארץ, מלטביה וצ׳כיה, והיה הקיבוץ הראשון בנגב. שמו הוא ראשי תיבות של דב, רבקה ותרצה הוז, בני משפחה שנספו בתאונת דרכים בסוף 1940. בשנת 1946 נחנכה בו בריכת השחייה הראשונה בנגב.' },
    'nir-am': { year: '1943', bg: 'hero/niram-1949-3.jpg', extra: [['סוג יישוב', 'קיבוץ', 'f-topic'], ['אוכלוסייה', '733 תושבים', 'i-people'], ['גובה', '115 מטר', 'i-pin']], about: 'ניר עם הוא קיבוץ בנגב הצפוני־מערבי, ממערב לשדרות. הוא הוקם בט״ו בשבט תש״ג (1943) על אדמות בית חאנון. בתחילה נקרא בית חנון, אחר כך שדמות, ובשנת 1946 הוסב שמו לניר עם. בקיבוץ פועל מוזיאון המים והביטחון בנגב, ומפעל הסכו״ם שלו פועל בבעלותו מאז 1961.', site: 'http://www.nir-am.co.il' },
    ruhama: { year: '1944', bg: 'hero/ruhama-1944-2.jpg', extra: [['סוג יישוב', 'קיבוץ', 'f-topic'], ['אוכלוסייה', '770 תושבים', 'i-people'], ['גובה', '166 מטר', 'i-pin']], about: 'רוחמה הוא הקיבוץ המזרחי ביותר במועצה, כעשרה קילומטרים ממזרח לשדרות. כבר ב־1911 הוקמה במקום מושבה על ידי אגודת ״שארית ישראל״ ממוסקבה, היישוב היהודי הראשון בנגב בעת החדשה, שננטש ושוקם כמה פעמים. הקיבוץ הנוכחי הוקם ב־1944 בידי חברי קיבוץ העמל, גרעיני עלייה של השומר הצעיר מפולין, מרומניה ומבולגריה.' },
    gvim: { year: '1947', bg: 'hero/gvim-1947-1.jpg', extra: [['סוג יישוב', 'קיבוץ', 'f-topic'], ['אוכלוסייה', '703 תושבים', 'i-people'], ['גובה', '116 מטר', 'i-pin']], about: 'גבים הוא קיבוץ כחצי קילומטר מדרום לשדרות. הוא הוקם בי״ב באלול תש״ז (28 באוגוסט 1947), שלושה חודשים לפני החלטת האו״ם על החלוקה, בידי יוצאי הפלמ״ח וגרעין של בוגרי מוסד אהבה בכפר ביאליק. שמו המקורי היה שדה עקיבא, ואחר כך שונה לגבים על שם הגומות הטבעיות בנחלים. בתחומו נמצא בית חינוך שער הנגב.' },
    ivim: { year: '1991', bg: 'hero/ivim-mirror-1.jpg', extra: [['סוג יישוב', 'כפר סטודנטים', 'f-topic'], ['אוכלוסייה', '575 תושבים', 'i-people'], ['גובה', '89 מטר', 'i-pin']], about: 'איבים הוא כפר סטודנטים ליד שדרות, בשטח שבו פעלה משנת 1954 חווה חקלאית של חברת ״ייצור ופיתוח״. הכפר הוקם בראשית שנות ה־90 כדי לספק מגורים לעולים מברית המועצות לשעבר ומאתיופיה הלומדים במכללת ספיר הסמוכה, והוא מנוהל על ידי הסוכנות היהודית.' },
    'bror-hayil': { year: '1948', bg: 'hero/brorhayil-1953-1.jpg', extra: [['סוג יישוב', 'קיבוץ', 'f-topic'], ['אוכלוסייה', '1,084 תושבים', 'i-people'], ['גובה', '73 מטר', 'i-pin']], about: 'ברור חיל הוא קיבוץ ליד שדרות, והגדול ביותר במועצה. הוא החל כמשלט שהקימו הפלמ״ח ותושבי האזור באפריל 1948 ליד הכפר ברייר, כדי לפתוח את הדרך ליישובי הנגב. ב־5 במאי 1948 עלו למשלט גרעין ״הסנה״ ומקצת גרעין ״חרות״, צעירים יוצאי מצרים מתנועת החלוץ הצעיר.', site: 'http://www.brorhail.org.il/' },
    erez: { year: '1949', bg: 'hero/erez-1950-1.jpg', extra: [['סוג יישוב', 'קיבוץ', 'f-topic'], ['אוכלוסייה', '699 תושבים', 'i-people'], ['גובה', '41 מטר', 'i-pin']], about: 'ארז הוא קיבוץ בצפון־מערב הנגב, בין אשקלון לשדרות, והיישוב הצפוני ביותר במועצה. הוא עלה על הקרקע ב־26 באוקטובר 1949 בידי יוצאי הגדוד השלישי בחטיבת יפתח של הפלמ״ח, ושמו ניתן על שם קבוצת המייסדים ״ארז״. באוקטובר 1950 עבר למקום שבו היה עד 1948 הכפר דימרה. ליד הקיבוץ נמצא מעבר ארז לרצועת עזה.', site: 'http://www.erez.org.il' },
    mefalsim: { year: '1949', bg: 'hero/mefalsim-1949-1.jpg', extra: [['סוג יישוב', 'קיבוץ', 'f-topic'], ['אוכלוסייה', '949 תושבים', 'i-people'], ['גובה', '94 מטר', 'i-pin']], about: 'מפלסים הוא קיבוץ בנגב הצפוני־מערבי, ממערב לצומת שער הנגב. הוא הוקם ב־1949 בידי עולים שרובם בוגרי תנועת הנוער דרור מארגנטינה ומאורוגוואי. כעבור כשנה הועבר למיקומו הנוכחי, בגלל ירי תכוף על המיקום המקורי. ב־2001 הוקמה בו שכונה קהילתית צמודה, מהראשונות בקיבוצים.', site: 'http://www.mefalsim.co.il' },
    yachini: { year: '1950', bg: 'hero/yachini-1954-1.jpg', extra: [['סוג יישוב', 'מושב', 'f-topic'], ['אוכלוסייה', '815 תושבים', 'i-people'], ['גובה', '129 מטר', 'i-pin']], about: 'יכיני הוא מושב עובדים בצפון הנגב, על שם יכין בן שמעון. הוא הוקם ב־25 ביולי 1950 בידי עולים מפרס וכורדיסטן, בשם הזמני ״מוחרכה ב׳״, ופורק ב־1952. באותה שנה יושב מחדש בעולים מתימן שעלו במבצע מרבד הקסמים. בשנת 2006 נחנך בו כפר סטודנטים של מכללת ספיר.' },
    'kfar-aza': { year: '1951', bg: 'hero/kfaraza-1951-1.jpg', extra: [['סוג יישוב', 'קיבוץ', 'f-topic'], ['אוכלוסייה', '964 תושבים', 'i-people'], ['גובה', '89 מטר', 'i-pin']], about: 'כפר עזה הוא קיבוץ בנגב הצפוני על כביש 232, כשני קילומטרים מגבול רצועת עזה. הוא נוסד ב־23 באוגוסט 1951 כהיאחזות הנח״ל החמישית, בידי שני גרעיני מח״ל של תנועת הבונים, עולים ממצרים ומטנג׳יר. בראשיתו נקרא ״יגב״ ו״שדמות״, ובשנת 1953 קיבל את שמו הנוכחי.', site: 'http://www.kfar-aza.org.il' },
    'nahal-oz': { year: '1951', bg: 'hero/nahaloz-1953-1.jpg', extra: [['סוג יישוב', 'קיבוץ', 'f-topic'], ['אוכלוסייה', '579 תושבים', 'i-people'], ['גובה', '70 מטר', 'i-pin']], about: 'נחל עוז הוא קיבוץ בקצה המערבי של המועצה, סמוך לרצועת עזה. הוא הוקם ב־26 ביולי 1951 כהיאחזות הנח״ל הראשונה בישראל, בשם ״נחלאים א׳ - מול עזה״, על אדמות בארות יצחק הישן. בספטמבר 1953 אוזרח כקיבוץ בידי גרעין נח״ל של בני רחובות, קריית חיים ותל אביב.', site: 'http://nahaloz.org.il' },
    'or-haner': { year: '1957', bg: 'hero/orhaner-1960-1.jpg', extra: [['סוג יישוב', 'קיבוץ', 'f-topic'], ['אוכלוסייה', '1,048 תושבים', 'i-people'], ['גובה', '53 מטר', 'i-pin']], about: 'אור הנר הוא קיבוץ במערב הנגב הצפוני, מצפון לשדרות. הוא הוקם ב־1957 במקום שבו פעלה חווה חקלאית של חברת ״ייצור ופיתוח״, בידי יוצאי קיבוץ גבעות זייד שהתפרק וגרעין הנח״ל ״צל־צח״, רובם עולים מארגנטינה. שמו נגזר ממשפט בתלמוד הבבלי, ובקיבוץ מוצג ״נתיב המוראלים״ של ציורי קיר.' },
  };

  var KINDS = ['תיעוד', 'אודיו', 'תמונה', 'גלריה', 'וידאו', 'ציטוט', 'קישור'];
  var DECADES = ['1940', '1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020'];
  var PAGE = 12, EAGER = 3; /* שלוש תמונות ראשונות בטעינה רגילה, בלי עדיפות גבוהה (העדיפות לתצלום ההירו) */
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };

  /* ---------- מצב התחלתי לפי סוג העמוד ---------- */
  var INIT = {
    settlement: { place: ['dorot'] }, council: { place: ['council'] }, tag: { tag: 'october7' },
    decade: { decade: ['1960'] }, search: { q: 'הקמת' }, all: {}
  };
  var qs = new URLSearchParams(location.search);
  var typeKey = INIT[qs.get('type')] ? qs.get('type') : 'council';
  var DEF = { place: [], decade: [], kind: [], tag: '', q: '' };
  Object.keys(INIT[typeKey]).forEach(function (k) { DEF[k] = INIT[typeKey][k]; });
  var state = { place: DEF.place.slice(), decade: DEF.decade.slice(), kind: [], tag: DEF.tag, q: DEF.q, sort: 'asc', shown: PAGE };
  ['place', 'decade', 'kind'].forEach(function (k) { if (qs.has(k)) state[k] = qs.get(k) ? qs.get(k).split(',').slice(0, 1) : []; }); /* בחירה יחידה: ערך אחד בלבד מהכתובת */
  if (qs.has('q')) state.q = qs.get('q');
  if (qs.has('sort') && ['asc', 'desc', 'alpha'].indexOf(qs.get('sort')) >= 0) state.sort = qs.get('sort');
  state.place = state.place.filter(function (v) { return PLACES[v]; });
  if (qs.has('shown')) state.shown = Math.max(PAGE, Math.min(POSTS.length, +qs.get('shown') || PAGE));

  /* ---------- הירו לפי מספר פריטי הסינון ---------- */
  function itemsCount() { return state.place.length + state.decade.length + state.kind.length + (state.tag ? 1 : 0); }
  function heroFor() {
    /* סדר עדיפות (אורי): יישוב, אחריו תגית, אחריו עשור. סוג פוסט לא קובע הירו. בלי אף אחד מהם: חיפוש חופשי או הירו כללי */
    if (state.place.length) return placeHero(state.place[0]);
    if (state.tag) return { title: '7 באוקטובר', desc: 'עדויות וזיכרונות של הקהילות מהיום שבו הכול השתנה, בקצב שלהן ובמילים שלהן.', bg: 'arch/anemone-march-2006-037.jpg', about: 'ב־7 באוקטובר 2023 תקפו מחבלי חמאס את יישובי הנגב המערבי שליד רצועת עזה, ובהם יישובים במועצה האזורית שער הנגב. כפר עזה ונחל עוז היו בין היישובים שנפגעו קשה. ראש המועצה, אופיר ליבשטיין, נרצח באותו בוקר כשיצא להגן על כפר עזה.\n\nבנושא הזה מרוכזים בארכיון עדויות, תצלומים ומסמכים של הקהילות מהיום ההוא ואחריו. אפשר לסנן אותם לפי יישוב, עשור וסוג החומר, ולקרוא כל פריט בקצב שלכם.', tag: true, crumbs: ['ארכיון', 'נושאים', '7 באוקטובר'], nav: '/topic/october-7/' };
    if (state.decade.length) return decadeHero(state.decade[0]);
    if (state.q.trim() && !state.kind.length) return { title: 'תוצאות חיפוש', search: true, bg: 'hero/erez-1950-1.jpg', crumbs: ['ארכיון', 'תוצאות חיפוש'], nav: '/?s=' };
    return allHero();
  }
  function allHero() { return { title: 'הארכיון', desc: 'כל הסיפורים, התצלומים והמסמכים של הקהילות, לפי יישוב, עשור וסוג.', bg: 'hero/ruhama-1944-3.jpg', crumbs: ['ארכיון'], nav: '/?s=' }; }
  function decadeHero(d) { return { title: 'עשור ' + d, year: true, dec: d, desc: 'שנות ה־' + d.slice(2) + ' בקהילות שער הנגב: סיפורים, תצלומים ומסמכים מהעשור.', bg: d === '1960' ? 'arch/niram-1960-2-wide.jpg' : 'hero/ruhama-1944-3.jpg', crumbs: ['ארכיון', 'עשורים', d], nav: '/?s=' }; }
  function placeHero(slug) {
    var p = PINFO[slug], name = p.name || PLACES[slug];
    var facts = [['שנת הקמה', p.year, 'f-decade']].concat(p.extra || []);
    return { title: name, long: name.length > 12, logo: true, bg: p.bg, about: p.about, src: p.src,
      desc: p.desc || (name + ' היא אחת משתים־עשרה הקהילות של מועצה אזורית שער הנגב. בארכיון תמצאו את הסיפור שלה: צילומים, מסמכים ועדויות, מימי ההקמה ועד היום.'),
      crumbs: ['ארכיון', 'היישובים', slug === 'council' ? 'המועצה' : name], nav: slug === 'council' ? '/community/council/' : '/community/',
      card: { facts: facts, map: p.map || (name + ', שער הנגב'), more: p.more || 'לאתר היישוב', site: p.site || '' } };
  }
  function paintHero() {
    var h = heroFor();
    $('h1').textContent = h.title;
    $('h1').classList.toggle('is-long', !!h.long); $('h1').classList.remove('is-year');
    if (h.search) $('desc').innerHTML = 'מה שנמצא בארכיון עבור החיפוש <b>״' + esc(state.q.trim()) + '״</b>.'; else $('desc').textContent = h.desc;
    var bg = IMG + h.bg; if ($('bg').getAttribute('src') !== bg) $('bg').setAttribute('src', bg);
    var crumbs = ['בית'].concat(h.crumbs).slice(0, -1); /* 'בית' תמיד ראשון; בלי שם העמוד הנוכחי (אורי) */
    $('crumbs').closest('.hA__crumbs').hidden = crumbs.length < 2; /* פריט אחד בלבד ('בית'): בלי פירורי לחם בכלל (אורי) */
    var CU = { 'בית': '../1st/index.html', 'ארכיון': 'index.html?type=all', 'היישובים': 'index.html?type=all', 'עשורים': 'index.html?type=all', 'נושאים': 'index.html?type=all' };
    $('crumbs').innerHTML = crumbs.map(function (c, i) { return '<li>' + '<a href="' + CU[c] + '">' + c + '</a>' + '</li>'; }).join('');
    /* נתוני BreadcrumbList (JSON-LD) כפי שגוגל ממליץ; באתר האמיתי נוצרים בצד השרת. הפריט האחרון בלי קישור, כמו בתצוגה */
    var ld = $('ld-crumbs'); if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'ld-crumbs'; document.head.appendChild(ld); }
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(function (c, i) { var o = { '@type': 'ListItem', position: i + 1, name: c }; o.item = new URL(CU[c], location.href).href; return o; }) });
    document.querySelectorAll('.site-header nav a[aria-current]').forEach(function (a) { a.removeAttribute('aria-current'); });
    var navA = document.querySelector('.site-header nav a[data-nav="' + h.nav + '"]'); if (navA) navA.setAttribute('aria-current', 'page');
    document.title = h.title + ' · שער הארכיון (דוגמת תבנית)';
    var c = h.card;
    $('panel').classList.toggle('has-facts', !!c);
    $('logo').hidden = false; /* הלוגו בכל סוגי ההירו (אורי) */ $('acts').hidden = !c; $('infoActs').hidden = !c; $('facts').hidden = !c;
    if (c) {
      var links = '<a class="tlink" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.map) + '" target="_blank" rel="noopener"><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg>צפייה במפה<span class="visually-hidden"> ב־Google Maps (נפתח בלשונית חדשה)</span><svg class="icon tlink__go" aria-hidden="true"><use href="#i-next"/></svg></a><a class="tlink" href="' + (c.site || '#') + '"' + (c.site ? ' target="_blank" rel="noopener"' : '') + '><svg class="icon" aria-hidden="true"><use href="#f-link"/></svg>' + c.more + (c.site ? '<span class="visually-hidden"> (נפתח בלשונית חדשה)</span>' : '') + '<svg class="icon tlink__go" aria-hidden="true"><use href="#i-next"/></svg></a>';
      $('acts').innerHTML = links; $('infoActs').innerHTML = links;
      $('facts').innerHTML = c.facts.map(function (f) { return '<li><svg class="icon" aria-hidden="true"><use href="#' + f[2] + '"/></svg><small>' + f[0] + '</small><b>' + f[1] + '</b></li>'; }).join('');
    }
  }
  document.querySelectorAll('.demo a').forEach(function (a) { a.setAttribute('aria-current', a.dataset.t === typeKey ? 'true' : 'false'); });
  /* כותרת כמו בעמוד הבית: שקופה רק בראש העמוד, ואטומה בגלילה הראשונה (נכנס אחרי 24px, יוצא מתחת ל-8px) */
  var hd = document.querySelector('.site-header'), hq = false;
  function syncHeader() { hq = false; var y = window.pageYOffset, top = hd.classList.contains('is-over') ? y < 24 : y < 8; hd.classList.toggle('is-over', top); }
  function queueHeader() { if (!hq) { hq = true; requestAnimationFrame(syncHeader); } }
  window.addEventListener('scroll', queueHeader, { passive: true }); window.addEventListener('resize', queueHeader); hd.classList.add('is-over'); syncHeader();

  /* ---------- סינון, מיון, ספירות ---------- */
  function matches(p, skip) {
    if (state.tag && (!p.tags || p.tags.indexOf(state.tag) < 0)) return false;
    if (skip !== 'place' && state.place.length && state.place.indexOf(p.p) < 0) return false;
    if (skip !== 'decade' && state.decade.length && state.decade.indexOf(String(p.d)) < 0) return false;
    if (skip !== 'kind' && state.kind.length && state.kind.indexOf(p.k) < 0) return false;
    var q = state.q.trim();
    if (q && (p.t + ' ' + p.x).indexOf(q) < 0) return false;
    return true;
  }
  function filtered() {
    var list = POSTS.filter(function (p) { return matches(p); });
    list.sort(function (a, b) {
      if (state.sort === 'alpha') return a.t.localeCompare(b.t, 'he');
      return (state.sort === 'desc' ? b.y - a.y : a.y - b.y) || a.t.localeCompare(b.t, 'he');
    });
    return list;
  }
  /* ספירה לכל אפשרות = כמה פוסטים יתאימו אם תיבחר, לפי שאר המסננים הפעילים */
  function countFor(key, v) { return POSTS.filter(function (p) { return matches(p, key) && (key === 'place' ? p.p === v : key === 'decade' ? String(p.d) === v : p.k === v); }).length; }

  /* ---------- תפריטים נפתחים (בחירה מרובה; המיון — בחירה יחידה) ---------- */
  var dds = [];
  function makeDD(key, label, options, cls, multi, one) {
    var root = document.createElement('div'); root.className = 'dd ' + (cls || '');
    var id = 'dd-' + key;
    root.innerHTML = '<button type="button" class="dd__btn" id="' + id + '" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + id + '-m"><svg class="icon dd__ck" aria-hidden="true"><use href="#i-check"/></svg><span class="dd__k">' + label + '</span><span class="dd__v"></span><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></button><ul class="dd__menu" id="' + id + '-m" role="listbox"' + (multi && !one ? ' aria-multiselectable="true"' : '') + ' aria-labelledby="' + id + '" tabindex="-1" hidden></ul>';
    var btn = root.querySelector('button'), menu = root.querySelector('ul'), hl = -1;
    function sel(v) { return multi ? state[key].indexOf(String(v)) >= 0 : String(state[key]) === String(v); }
    function items() { return Array.prototype.slice.call(menu.children); }
    function draw() {
      var rows = options.map(function (o, i) {
        var isAll = multi && o.v === '';
        var on = isAll ? state[key].length === 0 : sel(o.v);
        var n = multi && !isAll ? countFor(key, String(o.v)) : null, off = multi && !isAll && n === 0 && !on;
        return { off: off, i: i, html: '<li role="option" id="' + id + '-o' + i + '" data-v="' + o.v + '" aria-selected="' + on + '"' + (off ? ' aria-disabled="true"' : '') + '><span>' + o.t + '</span>' + (n != null ? '<small aria-label="' + (n === 1 ? 'פוסט אחד' : n + ' פוסטים') + '">' + n + '</small>' : '') + '</li>' };
      });
      rows.sort(function (x, y) { return (x.off - y.off) || (x.i - y.i); }); /* אפשרויות עם תוצאות למעלה, ריקות למטה (אורי) */
      menu.innerHTML = rows.map(function (r) { return r.html; }).join('');
      if (hl >= 0 && !menu.hidden) { var it = items(); if (it[hl]) { it[hl].classList.add('is-hl'); menu.setAttribute('aria-activedescendant', it[hl].id); } }
      var v = '', set = false;
      if (multi) { var sv = state[key]; set = sv.length > 0; v = sv.length === 1 ? (key === 'place' ? PLACES[sv[0]] : sv[0]) : sv.length > 1 ? sv.length + ' נבחרו' : ''; }
      else { var cur = options.filter(function (o) { return String(state[key]) === String(o.v); })[0]; v = cur ? cur.t : ''; }
      root.querySelector('.dd__v').textContent = v;
      btn.classList.toggle('is-set', set);
    }
    function setHl(i) { var it = items(); if (!it.length) return; hl = (i + it.length) % it.length; it.forEach(function (x, n) { x.classList.toggle('is-hl', n === hl); }); menu.setAttribute('aria-activedescendant', it[hl].id); it[hl].scrollIntoView({ block: 'nearest' }); }
    function open() { dds.forEach(function (d) { if (d !== api) d.close(); }); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); var s = items().findIndex(function (x) { return x.getAttribute('aria-selected') === 'true'; }); menu.focus(); setHl(s < 0 ? 0 : s); }
    function close(refocus) { if (menu.hidden) return; menu.hidden = true; hl = -1; btn.setAttribute('aria-expanded', 'false'); menu.removeAttribute('aria-activedescendant'); if (refocus) btn.focus(); }
    function pick(i) {
      var li = items()[i]; if (!li || li.getAttribute('aria-disabled') === 'true') return;
      var v = String(li.getAttribute('data-v'));
      if (multi && one) { state[key] = v === '' ? [] : [v]; state.shown = PAGE; close(true); update(true); }
      else if (multi) {
        if (v === '') state[key] = [];
        else { var at = state[key].indexOf(v); if (at >= 0) state[key].splice(at, 1); else state[key].push(v); }
        state.shown = PAGE; hl = i; update(true);
      } else { state[key] = v; state.shown = PAGE; close(true); update(true); }
    }
    btn.addEventListener('click', function () { menu.hidden ? open() : close(true); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (menu.hidden) open(); } });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHl(hl + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setHl(hl - 1); }
      else if (e.key === 'Home') { e.preventDefault(); setHl(0); }
      else if (e.key === 'End') { e.preventDefault(); setHl(items().length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(hl); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') close(false);
    });
    menu.addEventListener('click', function (e) { var li = e.target.closest('li'); if (li) pick(items().indexOf(li)); });
    var api = { root: root, draw: draw, close: close };
    dds.push(api); draw();
    return api;
  }
  var bar = $('bar');
  bar.appendChild(makeDD('place', 'יישוב', [{ v: '', t: 'כל היישובים והמועצה' }].concat(Object.keys(PLACES).map(function (k) { return { v: k, t: PLACES[k] }; })), '', true, true).root);
  bar.appendChild(makeDD('decade', 'עשור', [{ v: '', t: 'כל העשורים' }].concat(DECADES.map(function (d) { return { v: d, t: d }; })), '', true, true).root);
  bar.appendChild(makeDD('kind', 'סוג פוסט', [{ v: '', t: 'כל הסוגים' }].concat(KINDS.map(function (k) { return { v: k, t: k }; })), '', true, true).root);
  var clear = document.createElement('button'); clear.type = 'button'; clear.className = 'af__clear'; clear.textContent = 'איפוס סינון'; clear.hidden = true; bar.appendChild(clear);
  bar.appendChild(makeDD('sort', 'מיון:', [{ v: 'asc', t: 'שנים עולות' }, { v: 'desc', t: 'שנים יורדות' }, { v: 'alpha', t: 'אלפבתי' }], 'af__sort', false).root);
  document.addEventListener('click', function (e) { if (!e.target.closest('.dd')) dds.forEach(function (d) { d.close(false); }); });

  /* ---------- רינדור ---------- */
  function card(p, i) {
    return '<li class="ac" data-i="' + i + '"><div class="ac__body"><div class="ac__meta"><span class="ac__year">' + p.y + '</span><span class="ac__type"><svg class="icon" aria-hidden="true"><use href="#' + (p.ic || 'f-standard') + '"/></svg>' + p.k + '</span></div>' +
      '<h3><a href="' + p.h + '">' + p.t + '</a></h3>' +
      (p.img ? '<div class="ac__img"><img src="' + IMG + 'arch/' + p.img + '" alt="" ' + (i < EAGER ? '' : 'loading="lazy" ') + 'decoding="async" width="640" height="560"></div>' : '') +
      '</div></li>';
  }
  function syncURL() {
    var p = new URLSearchParams(); p.set('type', typeKey);
    ['place', 'decade', 'kind'].forEach(function (k) { var cur = state[k].join(','), def = (DEF[k] || []).join(','); if (cur !== def) p.set(k, cur); });
    if (state.q !== DEF.q) p.set('q', state.q);
    if (state.sort !== 'asc') p.set('sort', state.sort);
    if (state.shown > PAGE) p.set('shown', state.shown);
    var url = location.pathname + '?' + p.toString();
    if (history.replaceState && url !== location.pathname + location.search) history.replaceState(null, '', url);
  }
  var lastMsg = '';
  function update(announce, appendFrom) {
    var list = filtered(), n = list.length, shown = Math.min(state.shown, n);
    paintHero();
    document.querySelector('.af').hidden = typeKey === 'tag' || typeKey === 'search'; /* בעמוד תגית ובתוצאות חיפוש אין סרגל סינון (אורי) */
    dds.forEach(function (d) { d.draw(); });
    clear.hidden = !['place', 'decade', 'kind'].some(function (k) { return state[k].length; }) && !state.tag && !state.q;
    $('count').textContent = n + (n === 1 ? ' פוסט' : ' פוסטים');
    if (typeof appendFrom === 'number' && $('list').children.length === appendFrom) {
      $('list').insertAdjacentHTML('beforeend', list.slice(appendFrom, shown).map(function (p, k) { return card(p, appendFrom + k); }).join(''));
    } else {
      $('list').innerHTML = list.slice(0, shown).map(card).join('');
    }
    $('list').hidden = !n;
    $('empty').hidden = !!n;
    if (!n) {
      var active = itemsCount() > 0 || state.q;
      $('emptyReset').hidden = !active;
      $('emptyP').textContent = active ? 'אפשר לאפס את הסינון, או לחפש בכל הארכיון.' : 'נסו חיפוש אחר בארכיון.';
    }
    var rest = n - shown;
    $('load').hidden = rest <= 0;
    $('loadN').textContent = rest > 0 ? 'מוצגים ' + shown + ' מתוך ' + n : '';
    /* אזור חי אחד: "נמצאו N פוסטים, מוצגים M" */
    var msg = n ? (n === 1 ? 'נמצא פוסט אחד' : 'נמצאו ' + n + ' פוסטים, מוצגים ' + shown) : 'לא נמצאו פוסטים בסינון הנוכחי';
    if (announce && msg !== lastMsg) { $('status').textContent = ''; setTimeout(function () { $('status').textContent = msg; }, 30); }
    lastMsg = msg;
    var h = heroFor();
    var infoOn = !!(h.card || h.tag); /* גוש 'על ...' רק ליישוב, למועצה ולתגית, שיש להם תיאור אמיתי; בעשור, בחיפוש ובארכיון הכללי מוסתר */
    document.querySelector('.ainfo').hidden = !infoOn;
    $('allPosts').hidden = !h.tag; /* בעמוד נושא: קישור לכל הפרסומים (אורי) */
    if (infoOn) {
      $('infoH').textContent = 'על ' + (h.card ? (h.title.length > 12 ? 'המועצה' : h.title) : h.title);
      var parts = (h.about || (h.card ? h.desc.split('. ')[0] + '.' : h.desc)).split('\n\n'); /* פסקה ריקה בין שתי פסקאות */
      $('infoT').textContent = parts[0];
      var t2 = $('infoT2'); if (!t2) { t2 = document.createElement('p'); t2.id = 'infoT2'; $('infoT').after(t2); }
      t2.textContent = parts[1] || ''; t2.hidden = !parts[1];
    }
    syncURL();
  }
  $('loadBtn').addEventListener('click', function () {
    var before = Math.min(state.shown, filtered().length);
    state.shown += PAGE; update(true, before);
    var a = $('list').querySelector('[data-i="' + before + '"] h3 a'); if (a) a.focus();
  });
  clear.addEventListener('click', function () { state.place = []; state.decade = []; state.kind = []; state.tag = ''; state.q = ''; state.shown = PAGE; update(true); $('dd-place').focus(); });
  setTimeout(function () { var hr = document.getElementById('hero'); if (hr) hr.classList.remove('is-entering'); }, 2000); /* אחרי כניסת ההירו */
  $('emptyReset').addEventListener('click', function () { clear.click(); });
  /* סרגל הסינון הדביק: צל כשהוא נדבק לכותרת, כדי שהכרטיסים לא ייחתכו בקו שקוף */
  var afEl = document.querySelector('.af'), afQ = false;
  function syncStuck() { afQ = false; if (!afEl.hidden) afEl.classList.toggle('is-stuck', window.pageYOffset > 0 && afEl.getBoundingClientRect().top <= parseFloat(getComputedStyle(afEl).top) + 0.5); }
  window.addEventListener('scroll', function () { if (!afQ) { afQ = true; requestAnimationFrame(syncStuck); } }, { passive: true });
  window.addEventListener('resize', syncStuck);
  update(false);
})();
