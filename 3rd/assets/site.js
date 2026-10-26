/* final_var5 — motion reimplemented from Onda by 8B (MIT), mirrored for RTL. Content stays visible without JS or with reduced motion. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- navigation: dropdown + phone menu ---------- */
  const nav = $('#navigation');
  const dropBtn = $('.nav__drop-btn', nav), drop = $('#drop');
  const setDrop = open => { drop.hidden = !open; dropBtn.setAttribute('aria-expanded', String(open)); };
  dropBtn.addEventListener('click', () => setDrop(drop.hidden));
  document.addEventListener('click', e => { if (!drop.hidden && !e.target.closest('.nav__links li:nth-child(2)')) setDrop(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drop.hidden) { setDrop(false); dropBtn.focus(); } });
  const toggle = $('.nav__menu', nav), menu = $('#menu'), close = $('.menu__close', menu);
  const setOpen = open => {
    menu.hidden = !open; toggle.setAttribute('aria-expanded', String(open));
    if (open) { window.lenis?.stop(); close.focus(); } else { window.lenis?.start(); toggle.focus(); }
  };
  toggle.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  menu.addEventListener('keydown', e => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key !== 'Tab') return;
    const items = $$('a, button', menu), first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); window.lenis?.start(); }));

  /* ---------- search form (contact) ---------- */
  const form = $('#contact .contact__form'), status = $('.contact__status', form);
  form.addEventListener('submit', e => {
    const input = form.elements.s;
    if (!input.value.trim()) { e.preventDefault(); status.textContent = status.dataset.error; input.focus(); }
  });

  /* ---------- pause rotating photos off screen ---------- */
  if ('IntersectionObserver' in window) ['hero', 'footer'].forEach(id => {
    const el = document.getElementById(id);
    new IntersectionObserver(([en]) => el.classList.toggle('is-offscreen', !en.isIntersecting)).observe(el);
  });

  /* ---------- timeline: open item → its photo irises into the ring ---------- */
  const eye = $('#method .method__eye');
  const peek = document.createElement('img'); peek.alt = ''; peek.className = 'method__peek'; peek.hidden = true; eye.append(peek);
  $$('#method .tl__item').forEach(item => item.addEventListener('toggle', () => {
    if (!item.open) { if (!$('#method .tl__item[open]')) peek.hidden = true; return; }
    $$('#method .tl__item[open]').forEach(o => { if (o !== item) o.open = false; });
    const file = item.dataset.img;
    peek.src = 'assets/img/arch/' + file; peek.classList.toggle('is-poster', file.startsWith('poster-')); peek.hidden = false;
    if (window.gsap && matchMedia('(prefers-reduced-motion: no-preference)').matches) gsap.fromTo(peek, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: .9, ease: 'expo.inOut', clearProps: 'clipPath' });
  }));

  /* ---------- motion ---------- */
  const start = () => {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cleanups = [];
      if (window.Lenis) {
        const lenis = window.lenis = new Lenis({ lerp: 0.09, anchors: { offset: -(nav.offsetHeight) } });
        const tick = t => lenis.raf(t * 1000);
        lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);
        cleanups.push(() => { gsap.ticker.remove(tick); gsap.ticker.lagSmoothing(500, 33); lenis.destroy(); window.lenis = null; });
      }
      const layoutBox = el => { let x = 0, y = 0, n = el; while (n) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 }; };

      /* shared effects: rise / ink / iris */
      $$('[data-8b-motion~="rise"]').forEach(el => {
        const dot = $('.m-dot', el), tl = gsap.timeline({ paused: true });
        tl.fromTo(el, { yPercent: 38, clipPath: 'inset(0% -6% 100% -6%)' }, { yPercent: 0, clipPath: 'inset(-30% -6% -30% -6%)', duration: .95, ease: 'expo.out', clearProps: 'clipPath,transform' }, 0);
        if (dot) tl.fromTo(dot, { scale: 0, yPercent: -260 }, { scale: 1, yPercent: 0, duration: .75, ease: 'back.out(2.2)', clearProps: 'transform' }, .42);
        ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, animation: tl });
      });
      $$('[data-8b-motion~="ink"]').forEach(el => {
        const original = el.innerHTML;
        el.innerHTML = el.textContent.split(/(\s+)/).map(p => /^\s+$/.test(p) || !p ? p : `<span class="ink__word">${p}</span>`).join('');
        gsap.fromTo($$('.ink__word', el), { opacity: .16 }, { opacity: 1, duration: .3, stagger: .06, ease: 'none', scrollTrigger: { trigger: el, start: 'top 88%', end: 'bottom 68%', scrub: .4 } });
        cleanups.push(() => { el.innerHTML = original; });
      });
      $$('[data-8b-motion~="iris"]').forEach(el => {
        const img = $('img', el), tl = gsap.timeline({ paused: true });
        tl.fromTo(el, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1.15, ease: 'expo.inOut', clearProps: 'clipPath' }, 0);
        if (img) tl.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 1.5, ease: 'expo.out', clearProps: 'transform' }, .15);
        ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, animation: tl });
      });

      /* hero → statement: the round photo travels down into the heading's dot */
      const hero = $('#hero'), aperture = $('.hero__aperture', hero), target = $('#statement .statement__dot');
      const geo = () => { const f = layoutBox(aperture), t = layoutBox(target); return { x: t.cx - f.cx, y: t.cy - f.cy, s: t.w / f.w }; };
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'bottom bottom', end: 'bottom 30%', scrub: true, invalidateOnRefresh: true } })
        .to(aperture, { x: () => geo().x, y: () => geo().y, ease: 'power1.inOut', duration: 1 }, 0)
        .to(aperture, { scale: () => geo().s, ease: 'power3.in', duration: 1 }, 0)
        .to($('.hero__tint', hero), { opacity: 1, ease: 'power2.in', duration: .6 }, .4)
        .to($('.hero__orbit', hero), { opacity: 0, duration: .3 }, 0)
        .to($('.hero__word', hero), { xPercent: () => (matchMedia('(min-width: 900px) and (orientation: landscape)').matches ? 10 : 0), ease: 'power1.in', duration: 1 }, 0)
        .to($('.hero__intro', hero), { y: -70, ease: 'power1.in', duration: 1 }, 0);

      /* statement: lines slide up, dot pops, index rises */
      const st = $('#statement');
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: st, start: 'top bottom', end: 'top 30%', scrub: true } })
        .fromTo($$('.statement__line', st), { yPercent: 85, xPercent: i => (i ? -9 : 6) }, { yPercent: 0, xPercent: 0, duration: .8, stagger: .12, ease: 'power2.out' }, 0)
        .fromTo(target, { scale: 0 }, { scale: 1, duration: .1 }, .9);
      gsap.from($$('.statement__index li', st), { yPercent: 70, opacity: 0, duration: .8, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: $('.statement__index', st), start: 'top 85%', once: true } });

      /* work → treasures: pinned sideways track, photos pan, cards bend onto a curve on exit */
      const work = $('#work'), track = $('.work__track', work), frame = $('.work__window', work), stage = $('.work__stage', work);
      work.classList.add('is-track');
      const run = () => Math.max(0, track.offsetWidth - (work.clientWidth - 2 * parseFloat(getComputedStyle(stage).paddingLeft)));
      const setRun = () => work.style.setProperty('--run', `${Math.round(run())}px`);
      setRun(); ScrollTrigger.addEventListener('refreshInit', setRun);
      gsap.fromTo($('.work__plate', work), { clipPath: 'inset(0% 3.2% 0% 3.2% round 44px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power1.out', scrollTrigger: { trigger: work, start: 'top bottom', end: 'top 15%', scrub: true } });
      const wtl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: work, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
      wtl.to(track, { x: () => run() }, 0);
      $$('.case--photo .case__img', work).forEach(img => wtl.fromTo(img, { xPercent: 5 }, { xPercent: -5 }, 0));
      $$('.case--poster .case__img', work).forEach(img => wtl.fromTo(img, { xPercent: 3 }, { xPercent: -3 }, 0));
      const cases = $$('.case', track);
      const R = () => (innerWidth < 700 ? innerWidth * 2.1 : innerWidth * 0.95);
      const bend = card => { const off = layoutBox(card).cx + run() - innerWidth / 2; const a = off / R(); return { x: R() * Math.sin(a) - off, y: R() * (1 - Math.cos(a)), r: a * 180 / Math.PI }; };
      const exit = gsap.timeline({ defaults: { ease: 'power1.in' }, scrollTrigger: { trigger: work, start: 'bottom bottom', end: 'bottom 30%', scrub: true, invalidateOnRefresh: true } });
      exit.to(frame, { x: () => innerWidth * 0.2, duration: 1 }, 0);
      cases.forEach(c => exit.to(c, { x: () => bend(c).x, y: () => bend(c).y, rotation: () => bend(c).r, duration: 1 }, 0));
      cleanups.push(() => { work.classList.remove('is-track'); work.style.removeProperty('--run'); ScrollTrigger.removeEventListener('refreshInit', setRun); });

      /* again → communities: cards ride a wheel that swings in and turns with scroll */
      const again = $('#again'), astage = $('.again__stage', again), head = $('.again__head', again), swing = $('.again__swing', again), wheel = $('.again__wheel', again);
      const partners = $$('.partner', wheel);
      again.classList.add('is-wheel');
      partners.forEach((p, i) => p.style.setProperty('--i', i));
      let step = 0, arcTop = 0, radius = 1;
      const measure = () => {
        const w = innerWidth, h = astage.offsetHeight, hb = head.offsetTop + head.offsetHeight, room = h - hb - innerHeight * 0.04;
        const card = Math.max(180, Math.min(w * (w < 700 ? 0.7 : 0.24), (room - 32) / 1.25));
        arcTop = hb + Math.max(28, (room - card * 1.25) * 0.4);
        radius = Math.max(w * 0.95, card * 3.3);
        step = 2 * Math.asin((card + Math.max(18, w * 0.024)) / (2 * radius)) * 180 / Math.PI;
        again.style.setProperty('--card', `${card.toFixed(1)}px`); again.style.setProperty('--radius', `${radius.toFixed(1)}px`);
        again.style.setProperty('--step', `${step.toFixed(3)}deg`); again.style.setProperty('--arc-top', `${arcTop.toFixed(1)}px`);
        again.style.setProperty('--spin', `${Math.round(partners.length * innerHeight * 0.27)}px`);
      };
      measure(); ScrollTrigger.addEventListener('refreshInit', measure);
      gsap.fromTo(wheel, { rotation: () => -step * 0.55 }, { rotation: () => (partners.length - 0.45) * step, ease: 'none', scrollTrigger: { trigger: again, start: 'top 30%', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: again, start: 'top bottom', end: 'top 30%', scrub: true, invalidateOnRefresh: true } })
        .fromTo(swing, { rotation: () => -Math.max(4, Math.asin(Math.min(1, innerWidth * 0.3 / radius)) * 180 / Math.PI - step * 0.55) }, { rotation: 0, ease: 'power1.out' }, 0)
        .fromTo(swing, { y: () => -(arcTop - 40) }, { y: 0, ease: 'power2.in' }, 0)
        .fromTo(head, { yPercent: 45 }, { yPercent: 0, ease: 'power2.out' }, 0);
      cleanups.push(() => { ScrollTrigger.removeEventListener('refreshInit', measure); again.classList.remove('is-wheel'); ['--card', '--radius', '--step', '--arc-top', '--spin'].forEach(n => again.style.removeProperty(n)); });

      /* capabilities → focus: cards stick and stack, each shrinking and darkening under the next */
      const cap = $('#capabilities'), services = $$('.service', cap);
      cap.classList.add('is-deck');
      services.forEach((c, i) => c.style.setProperty('--i', i));
      services.forEach((c, i) => {
        const next = services[i + 1]; if (!next) return;
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: next, start: 'top bottom', end: () => `top ${parseFloat(getComputedStyle(next).top) || 0}px`, scrub: true, invalidateOnRefresh: true } })
          .to(c, { scale: 0.9 }, 0).to($('.service__shade', c), { opacity: 0.55 }, 0);
      });
      cleanups.push(() => cap.classList.remove('is-deck'));

      /* method → timeline: the ring draws round, decade stations pop, each decade's photo irises in */
      const method = $('#method'), steps = $$('.step', method), stations = $$('.method__station', method), labels = $$('.method__label', method), eyes = $$('.method__eye > img[data-decade]', method);
      method.classList.add('is-cycle');
      const list = $('.method__steps', method);
      const mtl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: true } });
      const n = steps.length, total = list.offsetHeight || 1;
      const at = steps.map(s => Math.min(1, Math.max(0, (s.offsetTop - list.offsetTop) / total)));
      const arc = $('.method__arc', method), arm = $('.method__arm', method);
      gsap.set(arc, { attr: { 'stroke-dashoffset': 1 } });
      steps.forEach((s, i) => {
        const t0 = at[i], t1 = i + 1 < n ? at[i + 1] : 1;
        mtl.fromTo(arc, { attr: { 'stroke-dashoffset': 1 - i / n } }, { attr: { 'stroke-dashoffset': 1 - (i + 1) / n }, duration: t1 - t0, immediateRender: false }, t0)
          .fromTo(arm, { rotation: 360 * i / n }, { rotation: 360 * (i + 1) / n, duration: t1 - t0, immediateRender: false }, t0)
          .fromTo(s, { opacity: .2 }, { opacity: 1, duration: .04, immediateRender: i === 0 ? true : true }, Math.max(0, t0 - .03));
        if (stations[i]) mtl.fromTo(stations[i], { scale: .4 }, { scale: 1.35, duration: .03, ease: 'back.out(3)' }, t0).to(stations[i], { scale: 1, duration: .05 }, t0 + .03);
        if (labels[i]) mtl.fromTo(labels[i], { color: 'rgb(91,82,119)' }, { color: 'rgb(17,118,156)', duration: .03 }, t0);
        if (i && eyes[i]) mtl.fromTo(eyes[i], { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'power1.inOut', duration: .05 }, Math.max(0, t0 - .03));
      });
      cleanups.push(() => method.classList.remove('is-cycle'));

      /* journal → recent: sticky frame, stories brighten, photos open in a circle */
      const journal = $('#journal'), shots = $$('.journal__shot', journal), stories = $$('.story', journal);
      journal.classList.add('is-swap');
      stories.forEach((s, i) => {
        const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: s, start: 'top 84%', end: 'top 50%', scrub: true } });
        tl.fromTo(s, { opacity: .25 }, { opacity: 1, duration: .8 }, 0);
        if (i && shots[i]) tl.fromTo(shots[i], { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'power1.inOut', duration: 1 }, 0);
      });
      cleanups.push(() => journal.classList.remove('is-swap'));

      /* contact → search: the title grows from regular to black, then its dot drops in */
      const contact = $('#contact');
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: contact, start: 'top bottom', end: 'top 15%', scrub: true } })
        .fromTo($('.contact__voice', contact), { fontWeight: 400, scale: .82, transformOrigin: '100% 100%' }, { fontWeight: 900, scale: 1, duration: 1 }, 0)
        .fromTo($('.contact__title .m-dot', contact), { scale: 0, yPercent: -400 }, { scale: 1, yPercent: 0, duration: .25, ease: 'power2.in' }, .75);

      /* footer: the slogan rises while its full stop grows into a round photo */
      const footer = $('#footer'), fap = $('.footer__aperture', footer);
      const dot = () => $('.footer__period', footer).offsetWidth / fap.offsetWidth;
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: $('.footer__bye > span:last-child', footer), start: 'bottom bottom', end: 'bottom 40%', scrub: true, invalidateOnRefresh: true } })
        .fromTo(fap, { scale: dot }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
        .fromTo($('.footer__tint', footer), { opacity: 1 }, { opacity: 0, duration: .5 }, .45)
        .fromTo($$('.footer__bye > span', footer), { yPercent: 30 }, { yPercent: 0, ease: 'power2.out', duration: .8, stagger: .05 }, 0);

      ScrollTrigger.sort(); ScrollTrigger.refresh();
      return () => cleanups.forEach(f => f());
    });
  };
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(r => addEventListener('load', r, { once: true }));
  Promise.race([Promise.all([fontsReady, loaded]), new Promise(r => setTimeout(r, 2500))]).then(() => { try { start(); } catch (err) { console.error(err); } });
  window.__start = start;
})();
