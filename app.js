/* ==========================================================================
   CERCOS MENDIETA | app.js
   Dependencias locales (carpeta /vendor): GSAP + ScrollTrigger, Lenis.

   Principios
   - Mejora progresiva: sin JS o con "reducir movimiento" la página es
     completa y legible. Los estados ocultos de las animaciones solo los
     crea este archivo cuando el movimiento está permitido.
   - Solo se anima transform / opacity / clip-path.
   - Sin listeners de scroll manuales: todo pasa por ScrollTrigger/Lenis.

   ÍNDICE
   01 Configuración y utilidades     09 Manifiesto (texto que se enciende)
   02 WhatsApp                       10 Imagen que se abre
   03 Loader (portón)                11 Sistemas (tarjetas apiladas)
   04 Scroll suave                   12 Obras (galería horizontal)
   05 Header y menú                  13 Sectores, proceso, preguntas
   06 Hero (intro + parallax)        14 Asistente de cotización
   07 Malla interactiva (canvas)     15 Botones, final y flotante
   08 Ticker                         16 Arranque
   ========================================================================== */
(() => {
    'use strict';

    /* ───────── 01 CONFIGURACIÓN Y UTILIDADES ───────── */
    const CONFIG = {
        // Número de WhatsApp en formato internacional, sin "+" ni espacios (52 + 10 dígitos).
        whatsapp: '528115276142',
    };

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const root = document.documentElement;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
    const motionOK = hasGSAP && !reduceMotion;

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const headerH = () => parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 64;

    let lenis = null;

    /** Divide un texto plano en palabras (.sw > .sw-in) para animarlas con máscara. */
    function splitWords(el) {
        const text = el.textContent.trim().replace(/\s+/g, ' ');
        el.setAttribute('aria-label', text);
        el.textContent = '';
        text.split(' ').forEach((word, i, all) => {
            const outer = document.createElement('span');
            outer.className = 'sw';
            outer.setAttribute('aria-hidden', 'true');
            const inner = document.createElement('span');
            inner.className = 'sw-in';
            inner.textContent = word;
            outer.appendChild(inner);
            el.appendChild(outer);
            if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
        });
        return $$('.sw-in', el);
    }

    /* ───────── 02 WHATSAPP ───────── */
    const waURL = (message) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;

    function initWhatsAppLinks() {
        $$('[data-wa]').forEach((a) => { a.href = waURL(a.dataset.wa); });
        const year = $('#year');
        if (year) year.textContent = new Date().getFullYear();
    }

    /* ───────── 03 LOADER (PORTÓN QUE SE ABRE) ───────── */
    function runLoader() {
        const loader = $('#loader');
        return new Promise((resolve) => {
            const finish = () => {
                if (loader) loader.remove();
                root.classList.remove('is-loading');
                resolve();
            };
            if (!loader) return finish();
            if (!hasGSAP) return finish();

            const ring = $('.ring-fill', loader);
            const num = $('#loader-num', loader);
            const core = $('.loader-core', loader);
            const gates = $$('.gate', loader);
            const blades = ['.m-a', '.m-b', '.m-c', '.m-d'].map((s) => $(s, loader));

            if (reduceMotion) {
                num.textContent = '100';
                ring.style.strokeDashoffset = 0;
                window.addEventListener('load', () => gsap.to(loader, { opacity: 0, duration: .4, onComplete: finish }), { once: true });
                if (document.readyState === 'complete') gsap.to(loader, { opacity: 0, duration: .4, onComplete: finish });
                return;
            }

            // Las cuatro láminas del isotipo llegan desde cuatro lados y se ensamblan.
            gsap.set(blades, { opacity: 0 });
            gsap.fromTo(blades[0], { x: -220, y: -260, rotate: -28 }, { x: 0, y: 0, rotate: 0, opacity: 1, duration: 1.2, ease: 'expo.out', delay: .15 });
            gsap.fromTo(blades[1], { x: 220, y: 260, rotate: 28 }, { x: 0, y: 0, rotate: 0, opacity: 1, duration: 1.2, ease: 'expo.out', delay: .28 });
            gsap.fromTo(blades[2], { x: -260, y: 180, rotate: -40 }, { x: 0, y: 0, rotate: 0, opacity: 1, duration: 1.1, ease: 'expo.out', delay: .42 });
            gsap.fromTo(blades[3], { x: 260, y: -180, rotate: 40 }, { x: 0, y: 0, rotate: 0, opacity: 1, duration: 1.1, ease: 'expo.out', delay: .52 });

            // Progreso: avanza solo hasta 88 y espera a que la página cargue de verdad.
            const state = { v: 0 };
            const render = () => {
                const v = Math.round(state.v);
                num.textContent = String(v);
                ring.style.strokeDashoffset = String(100 - state.v);
            };
            gsap.to(state, { v: 88, duration: 2.2, ease: 'power2.out', onUpdate: render });

            const started = performance.now();
            let loaded = document.readyState === 'complete';
            window.addEventListener('load', () => { loaded = true; }, { once: true });

            const heroImg = $('.hv-main img');
            const heroReady = heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve();

            const open = () => {
                const tl = gsap.timeline();
                tl.to(state, { v: 100, duration: .55, ease: 'power1.out', onUpdate: render })
                  .to(core, { scale: .86, opacity: 0, duration: .55, ease: 'power3.in' }, '+=.12')
                  .to(gates[0], { xPercent: -101, duration: 1.2, ease: 'power4.inOut' }, '>-.1')
                  .to(gates[1], { xPercent: 101, duration: 1.2, ease: 'power4.inOut' }, '<')
                  .add(() => resolve(), '<+.45')
                  .add(() => { loader.remove(); root.classList.remove('is-loading'); }, '>');
            };

            const wait = () => {
                const elapsed = performance.now() - started;
                if ((loaded && elapsed > 2300) || elapsed > 7000) heroReady.then(open);
                else setTimeout(wait, 80);
            };
            wait();
        });
    }

    /* ───────── 04 SCROLL SUAVE ───────── */
    function initScroll() {
        gsap.registerPlugin(ScrollTrigger);
        if (!reduceMotion && typeof window.Lenis !== 'undefined') {
            lenis = new Lenis({
                duration: 1.35,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                wheelMultiplier: .95,
            });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
            lenis.stop();
        }
    }

    function scrollToTarget(target) {
        if (lenis) lenis.scrollTo(target, { offset: -headerH() + 1, duration: 1.7, easing: (t) => 1 - Math.pow(1 - t, 4) });
        else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function initAnchors() {
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href^="#"]');
            if (!link) return;
            const id = link.getAttribute('href');
            if (id.length < 2) return;
            const target = $(id);
            if (!target) return;
            event.preventDefault();
            closeMenu(true);
            if (id === '#inicio') { lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
            scrollToTarget(target);
        });
    }

    /* ───────── 05 HEADER Y MENÚ ───────── */
    let menuOpen = false;
    const menuEl = () => $('#menu');
    const menuBtn = () => $('#menu-btn');

    function initHeader() {
        const header = $('.site-header');
        if (!header) return;
        const apply = (y, dir) => {
            header.classList.toggle('is-solid', y > 24);
            header.classList.toggle('is-hidden', dir === 1 && y > 560 && !menuOpen);
        };
        apply(window.scrollY, 0);
        if (!hasGSAP) {
            window.addEventListener('scroll', () => apply(window.scrollY, 0), { passive: true });
            return;
        }
        ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => apply(self.scroll(), self.direction) });
        if (motionOK) {
            gsap.to('.nav-progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
        }
        ['sistemas', 'obras', 'sectores', 'proceso', 'faq'].forEach((id) => {
            const link = $(`.nav a[href="#${id}"]`);
            if (!link || !$(`#${id}`)) return;
            ScrollTrigger.create({
                trigger: `#${id}`, start: 'top 55%', end: 'bottom 55%',
                onToggle: (self) => link.classList.toggle('is-current', self.isActive),
            });
        });
    }

    function openMenu() {
        const menu = menuEl(); const btn = menuBtn();
        if (!menu || menuOpen) return;
        menuOpen = true;
        menu.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', 'Cerrar menú');
        $('.site-header').classList.remove('is-hidden');
        if (lenis) lenis.stop(); else root.style.overflow = 'hidden';
        if (motionOK) {
            gsap.fromTo(menu, { clipPath: 'circle(0% at calc(100% - 44px) 32px)' }, { clipPath: 'circle(150% at calc(100% - 44px) 32px)', duration: .9, ease: 'power3.inOut' });
            gsap.fromTo('[data-menu-link]', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: .06, duration: .9, ease: 'expo.out', delay: .3 });
        }
        const first = $('[data-menu-link]', menu);
        if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
    }

    function closeMenu(immediate) {
        const menu = menuEl(); const btn = menuBtn();
        if (!menu || !menuOpen) return;
        menuOpen = false;
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Abrir menú');
        const done = () => { menu.hidden = true; if (lenis) lenis.start(); else root.style.overflow = ''; };
        if (motionOK && !immediate) {
            gsap.to(menu, { clipPath: 'circle(0% at calc(100% - 44px) 32px)', duration: .6, ease: 'power3.inOut', onComplete: done });
        } else {
            done();
        }
    }

    function initMenu() {
        const btn = menuBtn();
        if (!btn) return;
        btn.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { closeMenu(); btn.focus(); } });
        window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) closeMenu(true); });
    }

    /* ───────── 06 HERO ───────── */
    function heroIntro() {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('.hero-eyebrow', { y: 20, opacity: 0, duration: .9 }, 0)
          .from('.hero-title .hl-in', { yPercent: 118, duration: 1.4, stagger: .13 }, .05)
          .fromTo('.hero-underline', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.inOut' }, 1)
          .from('.hero-sub', { y: 28, opacity: 0, duration: 1.1 }, .4)
          .from('.hero-ctas .btn', { y: 30, opacity: 0, duration: 1.1, stagger: .1 }, .55)
          .fromTo('.hv-main', { clipPath: 'inset(100% 0% 0% 0% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.6, ease: 'power4.inOut' }, .1)
          .from('.hv-main img', { scale: 1.4, duration: 2 }, .1)
          .from('.hv-second', { y: 90, opacity: 0, duration: 1.3 }, .7)
          .from('.seal', { scale: .2, rotate: -140, opacity: 0, duration: 1.4, ease: 'back.out(1.6)' }, .95)
          .from('.hv-rings', { scale: .6, opacity: 0, duration: 1.9 }, .2);

        tl.eventCallback('onComplete', initHeroParallax);
    }

    function initHeroParallax() {
        const hero = $('.hero');
        if (!hero) return;

        // Parallax con el puntero: cada capa se mueve a distinta profundidad.
        if (finePointer) {
            const layers = [['.hv-main', 12], ['.hv-second', 34], ['.seal', 26], ['.hv-rings', -14]].map(([sel, depth]) => {
                const el = $(sel, hero);
                return { depth, x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3.out' }) };
            });
            hero.addEventListener('pointermove', (e) => {
                const r = hero.getBoundingClientRect();
                const nx = (e.clientX - r.left) / r.width - .5;
                const ny = (e.clientY - r.top) / r.height - .5;
                layers.forEach((l) => { l.x(nx * l.depth * 2); l.y(ny * l.depth * 2); });
            });
        }

        // Al bajar: el texto se desvanece y la imagen sube más lento.
        gsap.to('.hero-copy', { y: -60, opacity: .12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        gsap.to('.hero-visual', { yPercent: -7, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }

    /* ───────── 07 MALLA INTERACTIVA (CANVAS) ───────── */
    function initMesh() {
        const canvas = $('.hero-mesh');
        if (!canvas || !canvas.getContext) return;
        const hero = canvas.parentElement;
        const ctx = canvas.getContext('2d');

        let W = 0, H = 0, S = 70, cols = 0, rows = 0;
        let nodes = [], edges = [];
        let raf = 0, running = false, visible = true;
        const pointer = { x: 0, y: 0, tx: 0, ty: 0, on: false };

        // Tres "sondas" autónomas recorren la malla para que nunca esté quieta.
        const probes = [
            { fx: .00021, fy: .00017, px: 0, py: 1.7, r: 200, s: 24 },
            { fx: .00016, fy: .00023, px: 2.2, py: .4, r: 160, s: 20 },
            { fx: .00027, fy: .00013, px: 4.1, py: 3.0, r: 140, s: 18 },
        ];

        function resize() {
            const rect = hero.getBoundingClientRect();
            W = rect.width; H = rect.height;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            S = W < 640 ? 46 : W < 1100 ? 60 : 72;
            const dy = S * .78;
            cols = Math.ceil(W / S) + 3;
            rows = Math.ceil(H / dy) + 3;
            nodes = []; edges = [];
            for (let j = 0; j < rows; j++) {
                for (let i = 0; i < cols; i++) {
                    nodes.push({ bx: (i - 1) * S + ((j & 1) ? S / 2 : 0), by: (j - 1) * dy, x: 0, y: 0, ox: 0, oy: 0, g: 0 });
                }
            }
            // Rombos de malla ciclónica: cada nodo se une con sus dos vecinos de abajo.
            for (let j = 0; j < rows - 1; j++) {
                for (let i = 0; i < cols; i++) {
                    const n = j * cols + i;
                    const dl = (j & 1) ? i : i - 1;
                    const dr = (j & 1) ? i + 1 : i;
                    if (dl >= 0 && dl < cols) edges.push([n, (j + 1) * cols + dl]);
                    if (dr >= 0 && dr < cols) edges.push([n, (j + 1) * cols + dr]);
                }
            }
        }

        function draw(t, animate) {
            const sources = probes.map((p) => ({
                x: W * (.5 + .46 * Math.sin(t * p.fx * 6.283 + p.px)),
                y: H * (.5 + .42 * Math.sin(t * p.fy * 6.283 + p.py)),
                r: p.r, s: p.s,
            }));
            if (pointer.on) {
                pointer.x += (pointer.tx - pointer.x) * .2;
                pointer.y += (pointer.ty - pointer.y) * .2;
                sources.push({ x: pointer.x, y: pointer.y, r: 220, s: 36 });
            }
            // Barrido de escaneo: una banda de luz recorre el perímetro cada 9 s.
            const phase = (t % 9000) / 9000;
            const bw = W * .13;
            const bx = animate && phase < .36 ? (phase / .36) * (W + bw * 2) - bw : -99999;

            for (let k = 0; k < nodes.length; k++) {
                const n = nodes[k];
                let dx = 0, dy = 0, g = 0;
                for (let s = 0; s < sources.length; s++) {
                    const src = sources[s];
                    const ddx = n.bx - src.x, ddy = n.by - src.y;
                    const d2 = ddx * ddx + ddy * ddy;
                    if (d2 < src.r * src.r) {
                        const d = Math.sqrt(d2) || 1;
                        const f = 1 - d / src.r;
                        const f2 = f * f;
                        dx += (ddx / d) * f2 * src.s; dy += (ddy / d) * f2 * src.s; g += f2;
                    }
                }
                const bd = Math.abs(n.bx - bx);
                if (bd < bw) { const f = 1 - bd / bw; g += f * f * .95; }
                n.ox += (dx - n.ox) * .14; n.oy += (dy - n.oy) * .14;
                n.g += (Math.min(g, 1) - n.g) * .2;
                n.x = n.bx + n.ox; n.y = n.by + n.oy;
            }

            ctx.clearRect(0, 0, W, H);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(18,32,107,.11)';
            ctx.beginPath();
            for (let e = 0; e < edges.length; e++) {
                const a = nodes[edges[e][0]], b = nodes[edges[e][1]];
                ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            }
            ctx.stroke();

            for (let e = 0; e < edges.length; e++) {
                const a = nodes[edges[e][0]], b = nodes[edges[e][1]];
                const g = (a.g + b.g) * .5;
                if (g > .07) {
                    ctx.strokeStyle = 'rgba(13,140,219,' + (g * .8).toFixed(2) + ')';
                    ctx.lineWidth = 1 + g * 1.5;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                }
            }
            for (let k = 0; k < nodes.length; k++) {
                const n = nodes[k];
                if (n.g > .06) {
                    if (n.g > .4) { ctx.fillStyle = 'rgba(13,140,219,' + (n.g * .13).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(n.x, n.y, 4 + n.g * 9, 0, 6.2832); ctx.fill(); }
                    ctx.fillStyle = 'rgba(13,140,219,' + (.4 + n.g * .6).toFixed(2) + ')';
                    ctx.beginPath(); ctx.arc(n.x, n.y, 1.5 + n.g * 3, 0, 6.2832); ctx.fill();
                } else {
                    ctx.fillStyle = 'rgba(18,32,107,.3)';
                    ctx.beginPath(); ctx.arc(n.x, n.y, 1.4, 0, 6.2832); ctx.fill();
                }
            }
        }

        const loop = (now) => { if (!running) return; draw(now, true); raf = requestAnimationFrame(loop); };
        const start = () => { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(loop); };
        const stop = () => { running = false; cancelAnimationFrame(raf); };

        resize();
        if (reduceMotion) { draw(14000, false); } else { start(); }

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { resize(); if (reduceMotion) draw(14000, false); }, 160);
        });
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible && !document.hidden) start(); else stop(); }, { threshold: 0 }).observe(hero);
        document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (visible) start(); });

        hero.addEventListener('pointermove', (e) => {
            const r = hero.getBoundingClientRect();
            pointer.tx = e.clientX - r.left; pointer.ty = e.clientY - r.top;
            if (!pointer.on) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
            pointer.on = true;
        });
        hero.addEventListener('pointerleave', () => { pointer.on = false; });
    }

    /* ───────── 08 TICKER ───────── */
    function initTicker() {
        const track = $('[data-ticker]');
        if (!track || !motionOK) return;
        const loop = gsap.to(track, { xPercent: -50, duration: 42, ease: 'none', repeat: -1 });
        const skew = gsap.quickTo(track, 'skewX', { duration: .5, ease: 'power3.out' });
        let timer;
        ScrollTrigger.create({
            start: 0, end: 'max',
            onUpdate: (self) => {
                const v = self.getVelocity();
                const dir = self.direction < 0 ? -1 : 1;
                gsap.to(loop, { timeScale: dir * (1 + clamp(Math.abs(v) / 240, 0, 5)), duration: .25, overwrite: true });
                skew(clamp(v / -420, -4, 4));
                clearTimeout(timer);
                timer = setTimeout(() => { gsap.to(loop, { timeScale: dir, duration: 1.4, overwrite: true }); skew(0); }, 110);
            },
        });
    }

    /* ───────── 09 MANIFIESTO ───────── */
    function initManifesto() {
        const el = $('[data-manifesto]');
        if (!el || !motionOK) return;
        const words = [];
        Array.from(el.childNodes).forEach((node) => {
            if (node.nodeType === 3) {
                const frag = document.createDocumentFragment();
                node.textContent.split(/(\s+)/).forEach((part) => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                    const span = document.createElement('span');
                    span.className = 'w';
                    span.textContent = part;
                    words.push(span);
                    frag.appendChild(span);
                });
                node.replaceWith(frag);
            } else if (node.nodeType === 1 && node.classList.contains('inline-img')) {
                words.push(node);
            }
        });
        gsap.set(words, { opacity: .28 });
        gsap.to(words, {
            opacity: 1, stagger: .1, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: true },
        });
        $$('.inline-img', el).forEach((box) => {
            gsap.fromTo(box, { clipPath: 'inset(0 100% 0 0 round .34em)' }, {
                clipPath: 'inset(0 0% 0 0 round .34em)', ease: 'none',
                scrollTrigger: { trigger: box, start: 'top 80%', end: 'top 48%', scrub: true },
            });
        });
    }

    /* ───────── 10 IMAGEN QUE SE ABRE ───────── */
    function initExpand() {
        const section = $('.expand');
        if (!section || !motionOK) return;
        const frame = $('.expand-frame', section);
        const img = $('img', frame);
        const scrim = $('.expand-scrim', section);
        const word = $('.expand-word', section);
        const lines = $$('.ex-line > span', section);
        const note = $('.expand-note', section);

        // fromTo con el mismo formato en ambos extremos: evita que el navegador normalice el inset y GSAP desalinee los valores.
        const small = () => (window.innerWidth < 700 ? 'inset(24% 11% 24% 11% round 20px)' : 'inset(19% 31% 19% 31% round 24px)');
        gsap.set(img, { scale: 1.4 });
        gsap.set(scrim, { opacity: 0 });
        gsap.set(lines, { yPercent: 118 });
        gsap.set(note, { opacity: 0, y: 24 });

        gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: section, start: 'top top', end: '+=240%', pin: '.expand-pin', scrub: .7, anticipatePin: 1, invalidateOnRefresh: true },
        })
            .fromTo(frame, { clipPath: small }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1 }, 0)
            .to(img, { scale: 1, duration: 1 }, 0)
            .to(word, { scale: 1.18, duration: 1 }, 0)
            .to(scrim, { opacity: 1, duration: .45 }, .65)
            .to(lines, { yPercent: 0, stagger: .2, duration: .38, ease: 'power3.out' }, .8)
            .to(note, { opacity: 1, y: 0, duration: .3, ease: 'power2.out' }, 1.5)
            .to({}, { duration: .35 });
    }

    /* ───────── 11 SISTEMAS (TARJETAS APILADAS) ───────── */
    function initSystems() {
        const cards = $$('.sys-card');
        if (!cards.length || !motionOK) return;
        cards.forEach((card, i) => {
            const img = $('.sys-media img', card);
            gsap.fromTo(img, { yPercent: -7, scale: 1.12 }, {
                yPercent: 7, ease: 'none',
                scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
            });
            const next = cards[i + 1];
            if (!next) return;
            gsap.to(card, {
                scale: .93, '--dim': .2, ease: 'none',
                scrollTrigger: {
                    trigger: next, start: 'top 92%',
                    end: () => 'top ' + (headerH() + 12 + (i + 1) * 12 + 6),
                    scrub: true,
                },
            });
        });
    }

    /* ───────── 12 OBRAS (GALERÍA HORIZONTAL) ───────── */
    function initWorks() {
        const section = $('.works');
        if (!section) return;
        const connection = navigator.connection || {};
        if (!connection.saveData) $$('img', section).forEach((img) => { img.loading = 'eager'; });
        if (!hasGSAP) return;

        gsap.matchMedia().add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
            section.classList.add('is-pan');
            const track = $('.works-track', section);
            const distance = () => Math.max(0, track.scrollWidth - root.clientWidth);
            const tween = gsap.to(track, {
                x: () => -distance(), ease: 'none',
                scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + distance(), pin: '.works-pin', scrub: .8, anticipatePin: 1, invalidateOnRefresh: true },
            });
            gsap.to('.works-progress span', {
                scaleX: 1, ease: 'none',
                scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + distance(), scrub: true, invalidateOnRefresh: true },
            });
            $$('.work-media img', section).forEach((img) => {
                gsap.fromTo(img, { xPercent: -3 }, {
                    xPercent: 3, ease: 'none',
                    scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
                });
            });
            return () => section.classList.remove('is-pan');
        });
    }

    /* ───────── 13 SECTORES, PROCESO, PREGUNTAS ───────── */
    function initSectors() {
        const tiles = $$('.tile');
        if (!tiles.length || !motionOK) return;
        gsap.set(tiles, { y: 70, opacity: 0 });
        ScrollTrigger.batch(tiles, {
            start: 'top 90%', once: true,
            onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: .12 }),
        });
        if (!finePointer) return;
        $$('[data-tilt]').forEach((tile) => {
            gsap.set(tile, { transformPerspective: 900 });
            const rx = gsap.quickTo(tile, 'rotationX', { duration: .7, ease: 'power3.out' });
            const ry = gsap.quickTo(tile, 'rotationY', { duration: .7, ease: 'power3.out' });
            tile.addEventListener('pointermove', (e) => {
                const r = tile.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
                ry((x - .5) * 7); rx((.5 - y) * 7);
                tile.style.setProperty('--px', (x * 100).toFixed(1) + '%');
                tile.style.setProperty('--py', (y * 100).toFixed(1) + '%');
            });
            tile.addEventListener('pointerleave', () => { rx(0); ry(0); });
        });
    }

    function initProcess() {
        const list = $('.steps');
        if (list && motionOK) {
            ScrollTrigger.create({
                trigger: list, start: 'top 66%', end: 'bottom 62%', scrub: true,
                onUpdate: (self) => list.style.setProperty('--p', self.progress.toFixed(3)),
            });
            $$('.step', list).forEach((step) => {
                gsap.set(step, { y: 40, opacity: 0 });
                ScrollTrigger.create({
                    trigger: step, start: 'top 80%', once: true,
                    onEnter: () => gsap.to(step, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }),
                });
                ScrollTrigger.create({
                    trigger: step, start: 'top 62%',
                    onEnter: () => step.classList.add('is-active'),
                    onLeaveBack: () => step.classList.remove('is-active'),
                });
            });
        } else if (list) {
            $$('.step', list).forEach((s) => s.classList.add('is-active'));
            list.style.setProperty('--p', 1);
        }

        // Video: se reproduce solo cuando se ve, y el usuario puede pausarlo.
        const video = $('#proc-video');
        const toggle = $('#proc-video-toggle');
        if (!video || !toggle) return;
        let userPaused = reduceMotion;
        const sync = () => {
            toggle.classList.toggle('is-paused', video.paused);
            toggle.setAttribute('aria-label', video.paused ? 'Reproducir video' : 'Pausar video');
        };
        sync();
        new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !userPaused) video.play().catch(() => {});
            else video.pause();
            sync();
        }, { threshold: .35 }).observe(video);
        toggle.addEventListener('click', () => {
            if (video.paused) { userPaused = false; video.play().catch(() => {}); }
            else { userPaused = true; video.pause(); }
            sync();
        });
        video.addEventListener('play', sync);
        video.addEventListener('pause', sync);
    }

    function initFaq() {
        const items = $$('.faq-item');
        items.forEach((item) => {
            const btn = $('.faq-q', item);
            btn.addEventListener('click', () => {
                const open = !item.classList.contains('is-open');
                items.forEach((other) => {
                    other.classList.remove('is-open');
                    $('.faq-q', other).setAttribute('aria-expanded', 'false');
                });
                if (open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
                if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 700);
            });
        });
    }

    /* ───────── 14 ASISTENTE DE COTIZACIÓN → WHATSAPP ───────── */
    function initWizard() {
        const form = $('#wizard');
        if (!form) return;
        const panels = $$('.wiz-panel', form);
        const labels = $$('[data-step-label]', form);
        const bar = $('.wiz-bar', form);
        const back = $('#wiz-back'), next = $('#wiz-next'), send = $('#wiz-send');
        const done = $('#wiz-done');
        const range = $('#metros'), rangeOut = $('#metros-out');
        const preview = $('#wa-preview');
        const total = panels.length;
        let step = 1;

        const fmtMeters = (v) => (Number(v) >= 1000 ? '1,000+ m' : v + ' m');
        const syncRange = () => {
            const pct = ((range.value - range.min) / (range.max - range.min)) * 100;
            range.style.setProperty('--p', pct.toFixed(1) + '%');
            rangeOut.textContent = fmtMeters(range.value);
        };
        range.addEventListener('input', syncRange);
        syncRange();

        const field = (name) => form.elements[name];
        const showError = (name, message) => {
            const out = $(`[data-error-for="${name}"]`, form);
            if (out) out.textContent = message || '';
            const input = field(name);
            if (input && input.setAttribute && input.type !== 'radio') input.setAttribute('aria-invalid', message ? 'true' : 'false');
            return !message;
        };
        const cleanPhone = (raw) => {
            let d = String(raw).replace(/\D/g, '');
            if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
            if (d.length === 13 && d.startsWith('521')) d = d.slice(3);
            return d;
        };

        const validate = (n) => {
            if (n === 1) return showError('tipo', field('tipo').value ? '' : 'Elige qué quieres proteger para continuar.');
            if (n === 2) return showError('sistema', $$('input[name="sistema"]:checked', form).length ? '' : 'Elige al menos un sistema.');
            const nameOk = showError('nombre', field('nombre').value.trim().length >= 2 ? '' : 'Escribe tu nombre.');
            const telOk = showError('telefono', cleanPhone(field('telefono').value).length === 10 ? '' : 'Escribe un teléfono de 10 dígitos.');
            if (!nameOk) field('nombre').focus(); else if (!telOk) field('telefono').focus();
            return nameOk && telOk;
        };

        const buildMessage = () => {
            const data = new FormData(form);
            const name = String(data.get('nombre')).trim();
            const zone = String(data.get('zona') || '').trim();
            const extra = String(data.get('mensaje') || '').trim();
            const lines = [
                `Hola, soy ${name || '...'}. Quiero cotizar un cerco perimetral.`, '',
                `Proyecto: ${data.get('tipo') || 'Por definir'}`,
                `Sistemas: ${data.getAll('sistema').join(', ') || 'Por definir'}`,
                `Metros lineales aprox.: ${fmtMeters(data.get('metros'))}`,
            ];
            if (zone) lines.push(`Zona: ${zone}`);
            lines.push(`Mi teléfono: ${cleanPhone(data.get('telefono')) || '...'}`);
            if (extra) lines.push('', `Detalles: ${extra}`);
            lines.push('', 'Lo envié desde su página web.');
            return lines.join('\n');
        };
        const updatePreview = () => { if (preview) preview.textContent = buildMessage(); };
        form.addEventListener('input', () => { if (step === total) updatePreview(); });

        const setStep = (n, dir) => {
            const from = panels[step - 1], to = panels[n - 1];
            step = n;
            labels.forEach((li, i) => {
                li.classList.toggle('is-active', i === n - 1);
                li.classList.toggle('is-done', i < n - 1);
                if (i === n - 1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
            });
            bar.style.setProperty('--p', (n / total).toFixed(4));
            back.hidden = n === 1; next.hidden = n === total; send.hidden = n !== total;
            from.hidden = true; to.hidden = false;
            if (n === total) updatePreview();
            if (motionOK) gsap.fromTo(to, { x: 44 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: .7, ease: 'expo.out', clearProps: 'transform' });
            const legend = $('.wiz-title', to);
            if (legend) { legend.setAttribute('tabindex', '-1'); legend.focus({ preventScroll: true }); }
        };

        next.addEventListener('click', () => { if (validate(step)) setStep(step + 1, 1); });
        back.addEventListener('click', () => setStep(step - 1, -1));
        form.addEventListener('change', (e) => { if (e.target.name === 'tipo') showError('tipo', ''); if (e.target.name === 'sistema') showError('sistema', ''); });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (step < total) { if (validate(step)) setStep(step + 1, 1); return; }
            if (!validate(3)) return;
            const url = waURL(buildMessage());
            $('#wiz-wa-link').href = url;
            const win = window.open(url, '_blank', 'noopener');
            form.classList.add('is-done');
            done.hidden = false;
            done.focus({ preventScroll: true });
            if (motionOK) gsap.from(done, { y: 24, opacity: 0, duration: 1, ease: 'expo.out' });
            if (!win) done.dataset.blocked = 'true';
        });

        $('#wiz-reset').addEventListener('click', () => {
            form.reset(); syncRange();
            form.classList.remove('is-done');
            done.hidden = true;
            panels.forEach((p, i) => { p.hidden = i !== 0; });
            step = 1;
            labels.forEach((li, i) => { li.classList.toggle('is-active', i === 0); li.classList.remove('is-done'); });
            bar.style.setProperty('--p', (1 / total).toFixed(4));
            back.hidden = true; next.hidden = false; send.hidden = true;
        });
    }

    /* ───────── 15 BOTONES, FINAL Y FLOTANTE ───────── */
    function initButtons() {
        // El relleno del botón nace exactamente donde entra y sale el puntero.
        $$('.btn').forEach((btn) => {
            const set = (e) => {
                const r = btn.getBoundingClientRect();
                btn.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                btn.style.setProperty('--my', (e.clientY - r.top) + 'px');
            };
            btn.addEventListener('pointerenter', set);
            btn.addEventListener('pointerleave', set);
        });
        if (!finePointer || !motionOK) return;
        $$('[data-magnetic]').forEach((el) => {
            const x = gsap.quickTo(el, 'x', { duration: .7, ease: 'elastic.out(1, .6)' });
            const y = gsap.quickTo(el, 'y', { duration: .7, ease: 'elastic.out(1, .6)' });
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                x((e.clientX - (r.left + r.width / 2)) * .22);
                y((e.clientY - (r.top + r.height / 2)) * .3);
            });
            el.addEventListener('pointerleave', () => { x(0); y(0); });
        });
    }

    function initReveals() {
        if (!motionOK) return;
        $$('[data-split]').forEach((heading) => {
            const words = splitWords(heading);
            gsap.set(words, { yPercent: 118 });
            ScrollTrigger.create({
                trigger: heading, start: 'top 88%', once: true,
                onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .05 }),
            });
        });
        $$('[data-reveal]').forEach((el) => {
            gsap.set(el, { y: 36, opacity: 0 });
            ScrollTrigger.create({
                trigger: el, start: 'top 92%', once: true,
                onEnter: () => gsap.to(el, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', clearProps: 'transform' }),
            });
        });
        // Etiquetas de obras: aparecen con el contenido de la galería.
        const works = $$('.works-intro > *');
        gsap.from(works, { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.works', start: 'top 70%', once: true } });
    }

    function initFinale() {
        if (!motionOK) return;
        const mark = $('.wordmark span');
        // Se completa justo al llegar al final de la página (el wordmark queda cerca del borde inferior).
        if (mark) gsap.fromTo(mark, { yPercent: 55, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.footer-legal', start: 'top bottom', end: 'bottom bottom', scrub: true } });
        const bg = $('.finale-bg img');
        if (bg) gsap.fromTo(bg, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    function initFab() {
        const fab = $('.fab');
        if (!fab) return;
        setTimeout(() => fab.classList.add('is-visible'), 900);
        setTimeout(() => fab.classList.add('show-tip'), 5200);
        setTimeout(() => fab.classList.remove('show-tip'), 11500);
    }

    /* ───────── 16 ARRANQUE ───────── */
    // Cada módulo corre aislado: si uno falla, el resto de la página (y el loader) sigue funcionando.
    function safe(fn) {
        try { fn(); } catch (error) { console.error('[Cercos Mendieta] ' + fn.name + ' falló:', error); }
    }

    function boot() {
        [initWhatsAppLinks, initFaq, initWizard, initMenu, initMesh, initFab].forEach(safe);

        if (!hasGSAP) {
            // Sin librerías: la página funciona completa, solo sin coreografía.
            root.classList.remove('is-loading');
            const loader = $('#loader');
            if (loader) loader.remove();
            [initHeader, initAnchors, initProcess, initWorks, initButtons].forEach(safe);
            return;
        }

        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);

        safe(initScroll);
        [initAnchors, initHeader, initReveals, initTicker, initManifesto, initExpand, initSystems,
            initWorks, initSectors, initProcess, initFinale, initButtons].forEach(safe);

        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener('load', refresh, { once: true });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

        runLoader().catch(() => {
            const stuck = $('#loader');
            if (stuck) stuck.remove();
            root.classList.remove('is-loading');
        }).then(() => {
            if (lenis) lenis.start();
            if (motionOK) safe(heroIntro);
            refresh();
        });
    }

    boot();
})();
