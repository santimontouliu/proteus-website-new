/* Proteus Analytics — portfolio demos: canvas charts, funnel, cohort grid, model comparison.
   All data is simulated. Charts repaint from the active palette when appearance changes. */
(function () {
  var LINE_PTS = [78,79,80,78,82,83,81,84,85,84,86,85,87,86,88,87,86,88,89,88,90,89,91,88,90,91,91,92,91,91];
  var FUNNEL = [
    { name: 'Landing Page', pct: 100, drop: null },
    { name: 'Sign Up', pct: 62, drop: 38 },
    { name: 'Email Verified', pct: 51, drop: 18 },
    { name: 'Create Profile', pct: 29, drop: 43 },
    { name: 'First Action', pct: 21, drop: 28 },
    { name: 'Day 7 Active', pct: 14, drop: 33 }
  ];
  var COHORT_WEEKS = ['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5','Wk 6'];
  var COHORT_ROWS = ['Aug 4','Aug 11','Aug 18','Aug 25','Sep 1','Sep 8'];
  var COHORT_DATA = [
    [100,62,48,39,33,29],
    [100,58,44,36,31,null],
    [100,65,51,42,null,null],
    [100,60,47,null,null,null],
    [100,63,null,null,null,null],
    [100,null,null,null,null,null]
  ];
  var DIMENSIONS = ['Accuracy', 'Coherence', 'Refusal Rate', 'Instruction Follow', 'Tone Consistency'];
  var MODELS = [
    { name: 'GPT-4o', key: 'alt', scores: [88, 82, 91, 76, 85], insight: '<strong>GPT-4o leads on factual accuracy and instruction following</strong>, but shows higher latency variance on complex reasoning tasks. Refusal rate is elevated — likely over-tuned safety. Recommended use case: customer-facing Q&A where accuracy is non-negotiable.' },
    { name: 'Claude 3.5', key: 'warn', scores: [84, 91, 78, 88, 90], insight: '<strong>Claude 3.5 dominates on coherence and tone consistency</strong>, making it the strongest fit for long-form generation. Context retention across extended conversations outperforms competitors by ~12 pp. Recommended use case: document drafting, summarization, content workflows.' },
    { name: 'Gemini 1.5', key: 'accent', scores: [81, 80, 86, 92, 79], insight: '<strong>Gemini 1.5 has the best instruction-following score in the set</strong>, particularly on structured output tasks. Lowest hallucination rate on factual recall when grounded with retrieval. Recommended use case: RAG pipelines, structured extraction, code explanation.' }
  ];
  var KPIS = [['pass', 91.4, '%', 1], ['hall', 6.2, '%', 1], ['lat', 840, 'ms', 0], ['cov', 73, '%', 0]];
  var MONO = "'IBM Plex Mono', monospace";
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

  var root, reduced, frames = new Map(), activeModel = 0, resizeFrame;

  function palette() {
    var css = getComputedStyle(root);
    var read = function (n) { return css.getPropertyValue(n).trim(); };
    return {
      accent: read('--accent'), muted: read('--muted'), line: read('--line'),
      surface: read('--surface'), ink: read('--ink'), ok: read('--ok'),
      accentSoft: read('--accent-soft'),
      warn: read('--warn'), bad: read('--bad'), alt: read('--alt')
    };
  }
  function canvasFor(name) { return root.querySelector('[data-chart=' + name + ']'); }
  function begin(canvas) { cancelAnimationFrame(frames.get(canvas)); frames.delete(canvas); }
  function queue(canvas, cb) { frames.set(canvas, requestAnimationFrame(cb)); }
  function fit(canvas, height) {
    var dpr = window.devicePixelRatio || 1;
    var W = Math.max(200, canvas.parentElement.offsetWidth - 44);
    canvas.width = W * dpr;
    canvas.height = height * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = height + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { ctx: ctx, W: W, H: height };
  }

  function drawLine(animate) {
    var canvas = canvasFor('line');
    if (!canvas) return;
    begin(canvas);
    var p = palette();
    var f = fit(canvas, 160), ctx = f.ctx, W = f.W, H = f.H;
    var pad = { t: 14, r: 14, b: 28, l: 38 };
    var cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    var minV = 74, maxV = 96;
    var px = function (i) { return pad.l + (i / (LINE_PTS.length - 1)) * cw; };
    var py = function (v) { return pad.t + ch - ((v - minV) / (maxV - minV)) * ch; };
    var grid = function () {
      [80, 85, 90, 95].forEach(function (v) {
        ctx.beginPath();
        ctx.strokeStyle = p.line;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(pad.l, py(v));
        ctx.lineTo(pad.l + cw, py(v));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = p.muted;
        ctx.font = '9px ' + MONO;
        ctx.textAlign = 'right';
        ctx.fillText(v + '%', pad.l - 6, py(v) + 3);
      });
      ['30d', '20d', '10d', 'Today'].forEach(function (l, i) {
        var idx = [0, 9, 19, 29][i];
        ctx.fillStyle = p.muted;
        ctx.font = '9px ' + MONO;
        ctx.textAlign = 'center';
        ctx.fillText(l, px(idx), H - pad.b + 15);
      });
    };
    var start = performance.now();
    var frame = function (now) {
      var t = animate && !reduced.matches ? Math.min((now - start) / 1000, 1) : 1;
      var progress = easeOutCubic(t);
      ctx.clearRect(0, 0, W, H);
      grid();
      var count = Math.max(2, Math.round(progress * LINE_PTS.length));
      var grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
      grad.addColorStop(0, p.accent + '2e');
      grad.addColorStop(1, p.accent + '00');
      ctx.beginPath();
      ctx.moveTo(px(0), py(LINE_PTS[0]));
      for (var i = 1; i < count; i++) ctx.lineTo(px(i), py(LINE_PTS[i]));
      ctx.lineTo(px(count - 1), pad.t + ch);
      ctx.lineTo(px(0), pad.t + ch);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.moveTo(px(0), py(LINE_PTS[0]));
      for (var j = 1; j < count; j++) ctx.lineTo(px(j), py(LINE_PTS[j]));
      ctx.stroke();
      if (t < 1) queue(canvas, frame);
      else {
        var last = LINE_PTS.length - 1;
        ctx.fillStyle = p.accent;
        ctx.beginPath(); ctx.arc(px(last), py(LINE_PTS[last]), 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = p.surface;
        ctx.beginPath(); ctx.arc(px(last), py(LINE_PTS[last]), 2, 0, Math.PI * 2); ctx.fill();
      }
    };
    frame(performance.now());
  }

  function drawBars(name, data, maxV, height, ratio, animate, labelWrap) {
    var canvas = canvasFor(name);
    if (!canvas) return;
    begin(canvas);
    var f = fit(canvas, height), ctx = f.ctx, W = f.W, H = f.H;
    var pad = { t: 10, r: 10, b: 36, l: 16 };
    var cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    var gap = cw / data.length;
    var bw = gap * ratio;
    var start = performance.now();
    var frame = function (now) {
      var t = animate && !reduced.matches ? Math.min((now - start) / 1000, 1) : 1;
      var progress = easeOutCubic(t);
      ctx.clearRect(0, 0, W, H);
      var p = palette();
      data.forEach(function (d, i) {
        var color = d.color || p.muted;
        var x = pad.l + i * gap + (gap - bw) / 2;
        var bh = (d.val / maxV) * ch * progress;
        var y = pad.t + ch - bh;
        ctx.fillStyle = color + '1f';
        ctx.fillRect(x, pad.t, bw, ch);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, bw, bh);
        if (progress > 0.6) {
          ctx.fillStyle = color;
          ctx.font = '500 10px ' + MONO;
          ctx.textAlign = 'center';
          ctx.fillText(d.val + '%', x + bw / 2, y - 6);
        }
        ctx.fillStyle = p.muted;
        ctx.font = '9px ' + MONO;
        ctx.textAlign = 'center';
        if (labelWrap) d.label.split(' ').forEach(function (w, wi) { ctx.fillText(w, x + bw / 2, H - pad.b + 13 + wi * 11); });
        else ctx.fillText(d.label, x + bw / 2, H - pad.b + 13);
      });
      if (t < 1) queue(canvas, frame);
    };
    frame(performance.now());
  }

  function drawFailures(animate) {
    var p = palette();
    drawBars('bar', [
      { label: 'Factual Ground.', val: 38, color: p.bad },
      { label: 'Context Loss', val: 24, color: p.warn },
      { label: 'Refusal Fail', val: 19, color: p.warn },
      { label: 'Format Drift', val: 12, color: p.accent },
      { label: 'Tone Issues', val: 7, color: p.accent }
    ], 40, 200, 0.6, animate, true);
  }
  function drawLatency(animate) {
    var p = palette();
    var vals = [['<400', 8], ['400–600', 18], ['600–800', 29], ['800–1000', 24], ['1–1.5s', 13], ['>1.5s', 8]];
    drawBars('lat', vals.map(function (v, i) {
      return { label: v[0], val: v[1], color: (i === 2 || i === 3) ? p.accent : p.muted };
    }), 32, 200, 0.65, animate, false);
  }

  function renderFunnel() {
    var host = root.querySelector('[data-funnel]');
    if (!host) return;
    var p = palette();
    host.innerHTML = FUNNEL.map(function (step, i) {
      var color = step.drop === null ? p.accent : step.drop > 35 ? p.bad : step.drop > 20 ? p.warn : p.ok;
      var dropColor = step.drop === null ? p.muted : step.drop > 35 ? p.bad : step.drop > 20 ? p.warn : p.ok;
      return '<div data-row="1">' +
        '<span style="font-size:12px;color:var(--muted)">' + step.name + '</span>' +
        '<div style="height:22px;background:var(--surface-2);position:relative"><div data-bar="1" style="height:100%;width:' + step.pct + '%;background:' + color + '"></div></div>' +
        '<span style="font-family:' + MONO + ';font-size:12px;color:' + (i === 0 ? p.accent : p.ink) + ';font-variant-numeric:tabular-nums">' + step.pct + '%</span>' +
        '<span style="font-family:' + MONO + ';font-size:11px;color:' + dropColor + ';text-align:right">' + (step.drop !== null ? '↓ –' + step.drop + '%' : '') + '</span>' +
        '</div>';
    }).join('');
  }
  function animateFunnel() {
    if (reduced.matches) return;
    root.querySelectorAll('[data-funnel] [data-bar]').forEach(function (bar, i) {
      bar.getAnimations().forEach(function (a) { a.cancel(); });
      bar.animate([{ width: '0%' }, { width: bar.style.width }], {
        duration: 750, delay: i * 60, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards'
      });
    });
  }

  function renderCohort() {
    var table = root.querySelector('[data-cohort]');
    if (!table) return;
    var p = palette();
    var dark = document.documentElement.dataset.theme === 'dark';
    var head = '<thead><tr><th>Cohort</th>' + COHORT_WEEKS.map(function (w) { return '<th>' + w + '</th>'; }).join('') + '</tr></thead>';
    var body = '<tbody>' + COHORT_ROWS.map(function (c, ri) {
      return '<tr><td>' + c + '</td>' + COHORT_DATA[ri].map(function (v) {
        if (v === null) return '<td style="background:transparent"></td>';
        var strong = v >= 50;
        var bg = strong ? p.accent : 'var(--surface)';
        var fg = strong ? (dark ? '#0d1117' : '#ffffff') : p.ink;
        return '<td style="background:' + bg + ';color:' + fg + '">' + v + '%</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    table.innerHTML = head + body;
  }

  function drawRadar(active) {
    var canvas = canvasFor('radar');
    if (!canvas) return;
    var p = palette();
    var size = 280, cx = size / 2, cy = size / 2, r = 100;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    var n = DIMENSIONS.length;
    var angles = DIMENSIONS.map(function (_, i) { return (i / n) * Math.PI * 2 - Math.PI / 2; });
    [0.25, 0.5, 0.75, 1].forEach(function (scale) {
      ctx.beginPath();
      angles.forEach(function (a, i) {
        var x = cx + Math.cos(a) * r * scale, y = cy + Math.sin(a) * r * scale;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (scale < 1) {
        ctx.fillStyle = p.muted;
        ctx.font = '8px ' + MONO;
        ctx.textAlign = 'center';
        ctx.fillText(String(Math.round(scale * 100)), cx + 4, cy - r * scale - 3);
      }
    });
    angles.forEach(function (a, i) {
      ctx.beginPath();
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 1;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
      var lx = cx + Math.cos(a) * (r + 16), ly = cy + Math.sin(a) * (r + 14);
      ctx.fillStyle = p.muted;
      ctx.font = '9px ' + MONO;
      ctx.textAlign = 'center';
      var half = ctx.measureText(DIMENSIONS[i]).width / 2;
      ctx.fillText(DIMENSIONS[i], Math.max(half + 3, Math.min(size - half - 3, lx)), ly);
    });
    MODELS.forEach(function (m, mi) {
      var on = mi === active;
      var color = p[m.key];
      ctx.beginPath();
      m.scores.forEach(function (s, i) {
        var scale = s / 100;
        var x = cx + Math.cos(angles[i]) * r * scale, y = cy + Math.sin(angles[i]) * r * scale;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = color + (on ? '28' : '10');
      ctx.fill();
      ctx.strokeStyle = color + (on ? 'ff' : '44');
      ctx.lineWidth = on ? 2 : 1;
      ctx.stroke();
    });
  }

  function renderScores(idx) {
    var table = root.querySelector('[data-scores]');
    if (!table) return;
    var p = palette();
    var model = MODELS[idx];
    table.innerHTML = '<thead><tr><th>Dimension</th><th>Score</th><th style="min-width:120px"></th></tr></thead><tbody>' +
      DIMENSIONS.map(function (d, i) {
        var score = model.scores[i];
        var color = score >= 85 ? p.ok : score >= 75 ? p.accent : p.warn;
        return '<tr><td style="color:var(--muted)">' + d + '</td>' +
          '<td><span style="font-family:' + MONO + ';font-size:14px;color:' + color + ';font-variant-numeric:tabular-nums">' + score + '</span></td>' +
          '<td><div style="height:5px;background:var(--surface-2)"><div data-score-bar="1" style="height:100%;width:' + score + '%;background:' + color + '"></div></div></td></tr>';
      }).join('') + '</tbody>';
  }

  function renderLegend(idx) {
    var host = root.querySelector('[data-legend]');
    if (!host) return;
    var p = palette();
    host.innerHTML = MODELS.map(function (m, i) {
      return '<button type="button" data-legend-item="' + i + '" style="display:flex;align-items:center;gap:9px;background:transparent;border:0;padding:0;font:inherit;font-size:12px;color:var(--ink);cursor:pointer;opacity:' + (i === idx ? 1 : 0.6) + ';transition:opacity .2s">' +
        '<span style="width:9px;height:9px;border-radius:50%;background:' + p[m.key] + ';flex-shrink:0"></span><span>' + m.name + '</span></button>';
    }).join('');
    host.querySelectorAll('[data-legend-item]').forEach(function (btn) {
      btn.addEventListener('click', function () { selectModel(Number(btn.dataset.legendItem)); });
    });
  }

  function selectModel(idx, animate) {
    activeModel = idx;
    var p = palette();
    root.querySelectorAll('[data-model]').forEach(function (btn) {
      var on = Number(btn.dataset.model) === idx;
      btn.setAttribute('aria-pressed', String(on));
      btn.style.background = on ? p.accentSoft : 'transparent';
      btn.style.color = on ? p.accent : p.ink;
    });
    drawRadar(idx);
    renderScores(idx);
    renderLegend(idx);
    var insight = root.querySelector('[data-insight]');
    if (insight) insight.innerHTML = MODELS[idx].insight;
    if (animate !== false && !reduced.matches) {
      root.querySelectorAll('[data-score-bar]').forEach(function (bar, i) {
        bar.animate([{ width: '0%' }, { width: bar.style.width }], {
          duration: 700, delay: i * 50, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards'
        });
      });
    }
  }

  function setKpis() {
    KPIS.forEach(function (k) {
      var el = root.querySelector('[data-kpi=' + k[0] + ']');
      if (el) el.textContent = k[1].toFixed(k[3]) + k[2];
    });
  }
  function countKpis() {
    if (reduced.matches) { setKpis(); return; }
    var start = performance.now();
    KPIS.forEach(function (k) {
      var el = root.querySelector('[data-kpi=' + k[0] + ']');
      if (!el) return;
      var tick = function (now) {
        var t = Math.min((now - start) / 1000, 1);
        el.textContent = (k[1] * easeOutCubic(t)).toFixed(k[3]) + k[2];
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function renderAll() {
    drawLine(false);
    drawFailures(false);
    drawLatency(false);
    renderFunnel();
    renderCohort();
    selectModel(activeModel, false);
    setKpis();
  }

  function observeDemos() {
    if (!('IntersectionObserver' in window)) return;
    var actions = new Map([
      [canvasFor('line'), function () { drawLine(true); }],
      [canvasFor('bar'), function () { drawFailures(true); }],
      [canvasFor('lat'), function () { drawLatency(true); }],
      [root.querySelector('[data-funnel]'), animateFunnel],
      [root.querySelector('[data-kpis]'), countKpis]
    ]);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var fn = actions.get(entry.target);
        if (fn) fn();
      });
    }, { threshold: 0.2 });
    actions.forEach(function (_, el) { if (el) io.observe(el); });
  }

  window.ProteusPortfolio = {
    init: function (siteRoot, reducedQuery) {
      root = siteRoot;
      reduced = reducedQuery || window.matchMedia('(prefers-reduced-motion: reduce)');
      renderAll();
      observeDemos();
      root.querySelectorAll('[data-model]').forEach(function (btn) {
        btn.addEventListener('click', function () { selectModel(Number(btn.dataset.model)); });
      });
      window.addEventListener('resize', function () {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(renderAll);
      });
    },
    repaint: function () { if (root) renderAll(); }
  };
})();
