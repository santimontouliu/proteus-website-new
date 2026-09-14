/* Proteus Analytics — shared behavior: appearance, mobile menu, reveals, counters,
   the homepage signal map and the audit example explorer. Progressive enhancement only. */
(function () {
  var root = document.getElementById('site-root');
  if (!root) return;

  var page = document.body.dataset.page || 'home';
  var es = page === 'es' || page === 'ai-es';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobile = window.matchMedia('(max-width: 760px)');

  var CONFIG = {
    home: { stagger: 80, heroStep: 90, threshold: 0.1 },
    audit: { stagger: 70, heroStep: 90, threshold: 0.1 },
    ai: { stagger: 80, heroStep: 85, threshold: 0.1 },
    es: { stagger: 75, heroStep: 85, threshold: 0.1 },
    'ai-es': { stagger: 75, heroStep: 85, threshold: 0.1 },
    portfolio: { stagger: 0, heroStep: 85, threshold: 0.08 }
  };
  var cfg = CONFIG[page] || CONFIG.home;

  var LABELS = es ? { dark: 'Modo oscuro', light: 'Modo claro' } : { dark: 'Dark mode', light: 'Light mode' };

  /* ---------- appearance ---------- */
  var themeBtn = root.querySelector('[data-theme-toggle]');
  var themeLabel = root.querySelector('[data-theme-label]');

  function isDark() { return document.documentElement.dataset.theme === 'dark'; }
  function syncTheme() {
    var dark = isDark();
    if (themeLabel) themeLabel.textContent = dark ? LABELS.light : LABELS.dark;
    if (themeBtn) themeBtn.setAttribute('aria-pressed', String(dark));
  }
  function afterThemeChange() {
    syncTheme();
    if (page === 'audit') setTimeout(function () { paintLayers(activeLayer || 'product'); }, 80);
    if (page === 'portfolio' && window.ProteusPortfolio) setTimeout(window.ProteusPortfolio.repaint, 60);
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      try { localStorage.setItem('proteus-theme', next); } catch (e) {}
      afterThemeChange();
    });
  }
  /* keep tabs in step */
  window.addEventListener('storage', function (e) {
    if (e.key !== 'proteus-theme' || !e.newValue) return;
    document.documentElement.dataset.theme = e.newValue;
    document.documentElement.style.colorScheme = e.newValue;
    afterThemeChange();
  });
  syncTheme();

  /* ---------- mobile menu ---------- */
  var nav = document.getElementById('site-nav');
  var menuBtn = root.querySelector('[data-menu-btn]');
  var menuOpen = false;
  function applyMenu() {
    if (!nav || !menuBtn) return;
    var small = mobile.matches;
    menuBtn.style.display = small ? 'inline-flex' : 'none';
    if (small) {
      nav.style.order = '3';
      nav.style.width = '100%';
      nav.style.flexWrap = 'wrap';
      nav.style.gap = '4px 22px';
      nav.style.borderTop = '1px solid var(--line)';
      nav.style.padding = '12px 0 18px';
      nav.style.marginLeft = '0';
      nav.style.display = menuOpen ? 'flex' : 'none';
    } else {
      nav.style.cssText = 'display:flex;align-items:center;gap:28px;font-size:13.5px;margin-left:auto';
    }
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      menuOpen = !menuOpen;
      menuBtn.setAttribute('aria-expanded', String(menuOpen));
      applyMenu();
    });
  }
  window.addEventListener('resize', function () { menuOpen = false; applyMenu(); });
  applyMenu();

  /* ---------- reveals ---------- */
  function reveal(el, delay, shift) {
    if (reduced.matches || !el.animate) return;
    el.animate([
      { opacity: 0, transform: 'translateY(' + (shift || 18) + 'px)' },
      { opacity: 1, transform: 'none' }
    ], { duration: 680, delay: delay || 0, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var kids = cfg.stagger ? entry.target.querySelectorAll('[data-stagger]') : [];
        if (!kids.length) { reveal(entry.target, 0); return; }
        reveal(entry.target, 0, 10);
        Array.prototype.slice.call(kids).forEach(function (el, i) { reveal(el, 90 + i * cfg.stagger); });
      });
    }, { threshold: cfg.threshold });
    root.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  /* hero + map entry */
  var hero = root.querySelector('[data-hero]');
  if (hero) Array.prototype.slice.call(hero.children).forEach(function (el, i) { reveal(el, i * cfg.heroStep, 22); });
  var mapFig = root.querySelector('[data-map]');
  if (mapFig) reveal(mapFig, 240, 26);
  var summary = root.querySelector('[data-summary]');
  if (summary) reveal(summary, 240, 26);

  /* ---------- homepage signal map ---------- */
  var nodes = Array.prototype.slice.call(root.querySelectorAll('[data-node]'));
  if (nodes.length) {
    var pulse = root.querySelector('[data-pulse]');
    var loop;
    var setNode = function (index, all) {
      nodes.forEach(function (node, k) {
        var on = all || k <= index;
        var last = k === nodes.length - 1;
        node.style.borderLeftColor = on ? 'var(--accent)' : (last ? 'var(--deep)' : 'var(--line)');
        node.style.transform = (!all && k === index) ? 'translateX(5px)' : 'none';
        node.querySelectorAll('[data-dim]').forEach(function (d) { d.style.opacity = on ? '1' : '0.5'; });
        var check = node.querySelector('[data-check]');
        if (check) {
          check.style.opacity = on ? '1' : '0';
          check.style.transform = on ? 'scale(1)' : 'scale(.6)';
        }
      });
      var target = nodes[all ? nodes.length - 1 : index];
      if (pulse && target) pulse.style.transform = 'translateY(' + (target.offsetTop + target.offsetHeight / 2 - 3) + 'px)';
    };
    if (reduced.matches) {
      setNode(3, true);
    } else {
      setNode(0);
      var i = 0;
      loop = setInterval(function () { i = (i + 1) % nodes.length; setNode(i); }, 1500);
      window.addEventListener('scroll', function () {
        if (window.scrollY < 30) return;
        clearInterval(loop);
        var r = mapFig.getBoundingClientRect();
        var p = (window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.35);
        var idx = Math.max(0, Math.min(nodes.length - 1, Math.floor(p * (nodes.length + 0.6))));
        setNode(idx);
      }, { passive: true });
    }
  }

  /* ---------- results counters ---------- */
  var counters = Array.prototype.slice.call(root.querySelectorAll('[data-count]'));
  var bars = Array.prototype.slice.call(root.querySelectorAll('[data-bar]'));
  function countUp(el) {
    var target = Number(el.dataset.count);
    var sign = el.dataset.sign || '';
    var start = performance.now();
    var step = function (now) {
      var t = Math.min(1, (now - start) / 1100);
      var eased = 1 - Math.pow(1 - t, 3);
      el.firstChild.nodeValue = sign + Math.round(target * eased);
      if (t < 1) requestAnimationFrame(step);
      else el.firstChild.nodeValue = sign + target;
    };
    requestAnimationFrame(step);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        cio.unobserve(entry.target);
        bars.forEach(function (bar) { bar.style.width = (Number(bar.dataset.bar) * 0.9) + '%'; });
        if (reduced.matches) return;
        counters.forEach(countUp);
      });
    }, { threshold: page === 'home' ? 0.4 : 0.35 });
    cio.observe(counters[0].closest('[data-reveal]') || counters[0]);
  }

  /* ---------- audit example explorer ---------- */
  var FINDINGS = {
    product: ['01 / Product behavior', 'The action works. The signal is missing.', 'A user completes onboarding in the app, but the completion event is absent on one mobile release. The product passes a functional test; the funnel still undercounts activation.', 'Trace the completed journey against the emitted events, properties, and release version.'],
    tracking: ['02 / Instrumentation', 'One action. Two events.', 'A retry sends the same completion event twice. The analytics chart looks healthy, but the reported activation count is inflated.', 'Inspect event payloads, deduplication, identity handling, and the conditions that trigger each event.'],
    metric: ['03 / KPI definition', '“Activated” means different things.', 'The Product dashboard counts completed onboarding. The executive report counts the first meaningful action. Both use the label “activated users.”', 'Compare definitions, filters, time windows, and calculation logic. Document a shared definition and its owner.'],
    decision: ['04 / Business decision', 'A better conversion rate — or a tracking change?', 'An apparent lift follows a release that changed the event definition. Comparing the two periods does not yet support a claim that onboarding improved.', 'Identify comparable periods, explain the evidence gap, and specify what must be repaired before using the KPI to judge the release.']
  };
  var FIELDS = ['label', 'title', 'description', 'action'];
  var activeLayer = null;
  function paintLayers(active) {
    var css = getComputedStyle(root);
    var read = function (n) { return css.getPropertyValue(n).trim(); };
    var accent = read('--accent'), ink = read('--ink'), muted = read('--muted'), soft = read('--accent-soft');
    root.querySelectorAll('[data-layer]').forEach(function (btn) {
      var on = btn.dataset.layer === active;
      btn.setAttribute('aria-pressed', String(on));
      btn.style.background = on ? soft : 'transparent';
      btn.style.color = on ? accent : ink;
      btn.style.boxShadow = on ? 'inset 3px 0 ' + accent : 'inset 0 0 ' + accent;
      var idx = btn.querySelector('span');
      if (idx) idx.style.color = on ? accent : muted;
    });
    activeLayer = active;
  }
  var layerBtns = root.querySelectorAll('[data-layer]');
  if (layerBtns.length) {
    paintLayers('product');
    layerBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var finding = FINDINGS[btn.dataset.layer];
        if (!finding) return;
        paintLayers(btn.dataset.layer);
        FIELDS.forEach(function (name, i) {
          var el = root.querySelector('[data-field=' + name + ']');
          if (el) el.textContent = finding[i];
        });
        var panel = root.querySelector('[data-panel]');
        if (panel && panel.animate && !reduced.matches) {
          panel.animate([
            { opacity: 0.25, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'none' }
          ], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
        }
      });
    });
  }

  if (page === 'portfolio' && window.ProteusPortfolio) window.ProteusPortfolio.init(root, reduced);
})();
