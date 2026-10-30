/**
 * Diagram Rendering Module
 * Functions for rendering interactive 2D and 3D diagrams
 * 
 * @module diagrams
 */

// Diagram counter for unique IDs
let dgCount = 0;

/**
 * Solid shapes data with volume formulas
 * @type {Object<string, string>}
 */
const SOLID_FACT = {
  cylinder: 'V = πr²h',
  cone: 'V = ⅓πr²h',
  sphere: 'V = ⁴⁄₃πr³',
  hemisphere: 'V = ⅔πr³',
  cuboid: 'V = l × b × h',
  cube: 'V = a³'
};

/**
 * Create an iframe for TikZ diagram rendering
 * @param {string} code - TikZ code
 * @returns {string} HTML for TikZ iframe
 * @function
 */
window.tikzFrame = function(code) {
  const CONFIG = window.HydrogenConfig;
  const doc = `<!DOCTYPE html><html><head><script src="https://tikzjax.com/v1/tikzjax.js"><\/script>
<style>body{margin:0;display:flex;justify-content:center;align-items:center;background:transparent}svg text{fill:#0f172a}</style></head>
<body><script type="text/tikz">${code}<\/script></body></html>`;
  
  return `<div class="flex justify-center my-4">
    <div class="grid-card p-4 rounded-2xl border border-slate-200 max-w-md w-full flex justify-center shadow-sm">
      <iframe 
        sandbox="allow-scripts" 
        srcdoc="${window.escapeHtml(doc)}" 
        style="width:100%;height:200px;border:none" 
        scrolling="no" 
        aria-label="TikZ diagram"
        title="TikZ Diagram"
      ></iframe>
    </div>
  </div>`;
};

/**
 * Render problem HTML with TikZ support
 * @param {string} text - Problem text
 * @returns {string} Rendered HTML
 * @function
 */
window.renderProblemHTML = function(text) {
  const tikz = [];
  let t = String(text ?? '').replace(
    /<script type="text\/tikz">([\s\S]*?)<\/script>/g,
    (m, code) => { tikz.push(code); return `@@TIKZ${tikz.length - 1}@@`; }
  );
  
  t = window.clean(t);
  return t.replace(/@@TIKZ(\d+)@@/g, (m, i) => window.tikzFrame(tikz[+i]));
};

/**
 * Build an interactive 2D polygon diagram
 * @param {Object} d - Diagram data
 * @param {Array<Object>} d.points - Array of {label, x, y} points
 * @param {Array<string>} d.sides - Side labels
 * @param {Array<string>} d.angle_labels - Angle labels
 * @param {string} d.fact - Fact to display
 * @param {boolean} d.inferred - Whether diagram was auto-inferred
 * @returns {string} SVG HTML for the diagram
 * @function
 */
window.buildDiagram = function(d) {
  if (d && d.shape) return window.buildSolid(d);
  if (!d || !Array.isArray(d.points) || d.points.length < 3 || d.points.length > 8) return '';
  
  const P = d.points.map(p => ({
    l: String(p.label ?? ''),
    x: Number(p.x),
    y: Number(p.y)
  }));
  
  if (P.some(p => !isFinite(p.x) || !isFinite(p.y))) return '';
  
  const W = 420, H = 300, pad = 64, n = P.length, id = 'dg' + (dgCount++);
  const xs = P.map(p => p.x), ys = P.map(p => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const spanX = (Math.max(...xs) - minX) || 1, spanY = (Math.max(...ys) - minY) || 1;
  const sc = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);
  const ox = (W - spanX * sc) / 2, oy = (H - spanY * sc) / 2;
  
  const S = P.map(p => ({
    l: p.l,
    X: ox + (p.x - minX) * sc,
    Y: H - oy - (p.y - minY) * sc
  }));
  
  const cx = S.reduce((a, p) => a + p.X, 0) / n;
  const cy = S.reduce((a, p) => a + p.Y, 0) / n;
  
  const unit = (dx, dy) => { 
    const m = Math.hypot(dx, dy) || 1; 
    return [dx / m, dy / m]; 
  };
  
  const f = v => v.toFixed(1);
  const sides = Array.isArray(d.sides) ? d.sides : [];
  const names = Array.isArray(d.angle_labels) ? d.angle_labels : [];
  
  let svg = `<polygon points="${S.map(p => f(p.X) + ',' + f(p.Y)).join(' ')}" fill="rgba(37,99,235,.12)" stroke="#1d4ed8" stroke-width="2.5" stroke-linejoin="round"/>`;
  
  S.forEach((A, i) => {
    const B = S[(i + 1) % n];
    if (sides[i] == null || sides[i] === '') return;
    
    const mx = (A.X + B.X) / 2, my = (A.Y + B.Y) / 2;
    const [ux, uy] = unit(mx - cx, my - cy);
    
    svg += `<text x="${f(mx + ux * 16)}" y="${f(my + uy * 16)}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="600" fill="#2563eb">${window.escapeHtml(sides[i])}</text>`;
  });
  
  S.forEach((V, i) => {
    const Pv = S[(i + n - 1) % n], Nx = S[(i + 1) % n];
    const [ax, ay] = unit(Pv.X - V.X, Pv.Y - V.Y);
    const [bx, by] = unit(Nx.X - V.X, Nx.Y - V.Y);
    const ang = Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by))) * 180 / Math.PI;
    const deg = (Math.round(ang * 10) / 10) + '°';
    const shown = names[i] != null && names[i] !== '' ? String(names[i]) : deg;
    const r = 24, sweep = (ax * by - ay * bx) > 0 ? 1 : 0;
    const [mx, my] = unit(ax + bx, ay + by);
    const [lx, ly] = unit(V.X - cx, V.Y - cy);
    
    let mark = '';
    if (Math.abs(ang - 90) < 0.6) {
      const k = 11;
      mark = `<polyline points="${f(V.X + ax * k)},${f(V.Y + ay * k)} ${f(V.X + (ax + bx) * k)},${f(V.Y + (ay + by) * k)} ${f(V.X + bx * k)},${f(V.Y + by * k)}" fill="none" stroke="#1d4ed8" stroke-width="1.5"/>`;
    }
    
    svg += `<g class="dg-v" data-info="${window.escapeHtml('∠' + V.l + ' = ' + shown)}" role="button" tabindex="0" aria-label="Angle ${V.l} = ${shown}">
      <circle cx="${f(V.X)}" cy="${f(V.Y)}" r="18" fill="transparent"/>${mark}
      <path class="dg-ang" d="M${f(V.X + ax * r)} ${f(V.Y + ay * r)} A${r} ${r} 0 0 ${sweep} ${f(V.X + bx * r)} ${f(V.Y + by * r)}" fill="rgba(245,158,11,.25)" stroke="#f59e0b" stroke-width="2"/>
      <text class="dg-ang" x="${f(V.X + mx * (r + 18))}" y="${f(V.Y + my * (r + 18))}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#b45309">${window.escapeHtml(shown)}</text>
      <circle class="dg-dot" cx="${f(V.X)}" cy="${f(V.Y)}" r="5" fill="#1d4ed8"/>
      <text x="${f(V.X + lx * 20)}" y="${f(V.Y + ly * 20)}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#0f172a">${window.escapeHtml(V.l)}</text>
    </g>`;
  });
  
  const fact = d.fact ? String(d.fact) : `Sum of interior angles = ${(n - 2) * 180}°`;
  
  return `<div class="dg flex justify-center my-4" role="figure" aria-label="Interactive geometry diagram">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto block" role="img" aria-label="Diagram">
        <defs><pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#e2e8f0" stroke-width="1"/></pattern></defs>
        <rect width="${W}" height="${H}" fill="#fbfcfe"/><rect width="${W}" height="${H}" fill="url(#${id})"/>${svg}
      </svg>
      <div class="dg-hint no-print flex items-center justify-between gap-2 px-4 py-2.5 border-t border-dashed border-slate-200 text-[11px] text-slate-500">
        <span>${d.inferred ? 'Not to scale · ' : ''}✨ Tap or hover angles &amp; vertices to inspect</span>
        <span class="dg-chip bg-brand-50 text-brand-700 border border-brand-100 rounded-full px-3 py-1 font-semibold" data-default="${window.escapeHtml(fact)}">${window.escapeHtml(fact)}</span>
      </div>
    </div>
  </div>`;
};

/**
 * Build an interactive 3D solid diagram
 * @param {Object} d - Diagram data
 * @param {string} d.shape - Shape type (cylinder, cone, sphere, hemisphere, cuboid, cube)
 * @param {Object} d.labels - Dimension labels
 * @param {string} d.fact - Formula to display
 * @param {boolean} d.inferred - Whether diagram was auto-inferred
 * @returns {string} SVG HTML for the 3D solid
 * @function
 */
window.buildSolid = function(d) {
  const sh = String(d.shape || '').toLowerCase();
  if (!SOLID_FACT[sh]) return '';
  
  const lab = d.labels && typeof d.labels === 'object' ? d.labels : {};
  const id = 'dg' + (dgCount++);
  const B = '#1d4ed8';
  const F = 'rgba(37,99,235,.12)';
  const F2 = 'rgba(37,99,235,.22)';
  
  const st = `stroke="${B}" stroke-width="2.5" stroke-linejoin="round"`;
  const hid = `fill="none" stroke="${B}" stroke-width="1.5" stroke-dasharray="5 4" opacity=".6"`;
  
  const dim = (x1, y1, x2, y2, lx, ly, k, thin, anchor, short) => {
    const v = lab[k] != null && lab[k] !== '' ? String(lab[k]) : '';
    const full = v ? `${k} = ${v}` : k;
    return `<g class="dg-v" data-info="${window.escapeHtml(full)}" role="button" tabindex="0" aria-label="${full}">
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="18"/>
      ${thin ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4 3"/>` : ''}
      <line class="dg-ang" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
      <text x="${lx}" y="${ly}" text-anchor="${anchor || 'middle'}" dominant-baseline="middle" font-size="12" font-weight="700" fill="#2563eb">${window.escapeHtml(short ? k : full)}</text>
    </g>`;
  };
  
  let g = '';
  
  if (sh === 'cylinder') {
    g = `<path d="M140 80V220A70 20 0 0 0 280 220V80A70 20 0 0 1 140 80Z" fill="${F}" ${st}/>
      <path d="M140 220A70 20 0 0 1 280 220" ${hid}/><ellipse cx="210" cy="80" rx="70" ry="20" fill="${F2}" ${st}/>
      <circle cx="210" cy="80" r="3.5" fill="${B}"/>` +
      dim(210, 80, 280, 80, 245, 68, 'r', true) + 
      dim(312, 80, 312, 220, 324, 150, 'h', true, 'start');
  } else if (sh === 'cone') {
    g = `<path d="M210 50L125 230A85 22 0 0 0 295 230Z" fill="${F}" ${st}/><path d="M125 230A85 22 0 0 1 295 230" ${hid}/>
      <circle cx="210" cy="230" r="3.5" fill="${B}"/>` +
      dim(210, 50, 210, 230, 198, 140, 'h', true, 'end') + 
      dim(210, 230, 295, 230, 252, 247, 'r', true) +
      (lab.l ? dim(210, 50, 295, 230, 268, 134, 'l', false, 'start') : '');
  } else if (sh === 'sphere') {
    g = `<defs><radialGradient id="${id}s" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#bfdbfe"/></radialGradient></defs>
      <circle cx="210" cy="150" r="90" fill="url(#${id}s)" ${st}/><path d="M120 150A90 24 0 0 0 300 150" fill="none" stroke="${B}" stroke-width="1.5"/>
      <path d="M120 150A90 24 0 0 1 300 150" ${hid}/><circle cx="210" cy="150" r="3.5" fill="${B}"/>` +
      dim(210, 150, 300, 150, 258, 138, 'r', true);
  } else if (sh === 'hemisphere') {
    g = `<path d="M120 190A90 90 0 0 1 300 190Z" fill="${F}" ${st}/><ellipse cx="210" cy="190" rx="90" ry="24" fill="${F2}" ${st}/>
      <circle cx="210" cy="190" r="3.5" fill="${B}"/>` +
      dim(210, 190, 300, 190, 258, 206, 'r', true);
  } else {
    const cube = sh === 'cube';
    const W = cube ? 130 : 170;
    const H = cube ? 130 : 110;
    const dx = cube ? 50 : 60;
    const dy = cube ? -40 : -45;
    const x0 = (420 - (W + dx)) / 2;
    const y0 = (300 - (H - dy)) / 2 - dy;
    const x1 = x0 + W;
    const y1 = y0 + H;
    const kl = cube ? 'a' : 'l';
    const kb = cube ? 'a' : 'b';
    const kh = cube ? 'a' : 'h';
    
    if (cube && !lab.a && lab.l) lab.a = lab.l;
    
    g = `<polygon points="${x0},${y0} ${x1},${y0} ${x1 + dx},${y0 + dy} ${x0 + dx},${y0 + dy}" fill="${F2}" ${st}/>
      <polygon points="${x1},${y0} ${x1 + dx},${y0 + dy} ${x1 + dx},${y1 + dy} ${x1},${y1}" fill="rgba(37,99,235,.07)" ${st}/>
      <rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="${F}" ${st}/>
      <path d="M${x0} ${y1}L${x0 + dx} ${y1 + dy}H${x1 + dx}M${x0 + dx} ${y1 + dy}V${y0 + dy}" ${hid}/>` +
      dim(x0, y1, x1, y1, (x0 + x1) / 2, y1 + 20, kl, false) +
      dim(x1, y1, x1 + dx, y1 + dy, x1 + dx / 2 + 10, y1 + dy / 2 + 18, kb, false, 'start', cube) +
      dim(x0, y0, x0, y1, x0 - 10, (y0 + y1) / 2, kh, false, 'end', cube);
  }
  
  const fact = d.fact ? String(d.fact) : SOLID_FACT[sh];
  
  return `<div class="dg flex justify-center my-4" role="figure" aria-label="3D ${window.escapeHtml(sh)} diagram">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <svg viewBox="0 0 420 300" class="w-full h-auto block" role="img" aria-label="3D ${window.escapeHtml(sh)}">
        <defs><pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#e2e8f0" stroke-width="1"/></pattern></defs>
        <rect width="420" height="300" fill="#fbfcfe"/><rect width="420" height="300" fill="url(#${id})"/>${g}
      </svg>
      <div class="dg-hint no-print flex items-center justify-between gap-2 px-4 py-2.5 border-t border-dashed border-slate-200 text-[11px] text-slate-500">
        <span>${d.inferred ? 'Not to scale · ' : ''}✨ Tap or hover dimensions to inspect</span>
        <span class="dg-chip bg-brand-50 text-brand-700 border border-brand-100 rounded-full px-3 py-1 font-semibold" data-default="${window.escapeHtml(fact)}">${window.escapeHtml(fact)}</span>
      </div>
    </div>
  </div>`;
};

/**
 * Infer 3D solid from problem text
 * @param {string} text - Problem text
 * @returns {Object|null} Solid diagram data or null
 * @function
 */
window.inferSolid = function(text) {
  const raw = String(text || '');
  if (/<svg|text\/tikz/.test(raw) || /\b(draw|construct|sketch|plot)\b/i.test(raw)) return null;
  
  const t = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\(?:text|mathrm)/g, '')
    .replace(/[${} \\]/g, ' ')
    .replace(/\s+/g, ' ');
  
  const found = ['hemisphere', 'cylinder', 'cone', 'sphere', 'cuboid', 'cube'].filter(
    k => new RegExp('\\b' + k + 's?\\b', 'i').test(t)
  );
  
  if (found.length !== 1) return null;
  
  const num = k => {
    const m = t.match(new RegExp(
      '\\b(?:(?:' + k + ')\\s*(?:=|of|is)?\\s*(\\d+(?:\\.\\d+)?)\\s*(cm|mm|m)?)\\b', 
      'i'
    ));
    return m ? m[1] + (m[2] ? ' ' + m[2] : '') : '';
  };
  
  const labels = {
    r: num('r|radius'),
    h: num('(?<!slant )(?:h|height)'),
    l: num('slant height|l|length'),
    b: num('b|breadth|width'),
    a: num('a|edge|side')
  };
  
  Object.keys(labels).forEach(k => {
    if (!labels[k]) delete labels[k];
  });
  
  return { shape: found[0], labels, inferred: true };
};

/**
 * Infer 2D diagram from problem text
 * @param {string} text - Problem text
 * @returns {Object|null} Diagram data or null
 * @function
 */
window.inferDiagram = function(text) {
  const raw = String(text || '');
  if (/<svg|text\/tikz/.test(raw) || /\b(draw|construct|sketch|plot)\b/i.test(raw)) return null;
  
  const t = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\(?:triangle|bigtriangleup)/g, ' triangle ')
    .replace(/△/g, ' triangle ')
    .replace(/[${} \\]/g, ' ')
    .replace(/\s+/g, ' ');
  
  // Match quadrilaterals
  const q = t.match(/([Pp]arallelogram|[Rr]ectangle|[Ss]quare|[Rr]hombus|[Tt]rapezium|[Tt]rapezoid|[Qq]uadrilateral)\\s+([A-Z])\\s?([A-Z])\\s?([A-Z])\\s?([A-Z])(?![A-Za-z])/);
  
  if (q) {
    const Q = {
      parallelogram: [[0,0],[8,0],[10.5,4.5],[2.5,4.5]],
      rectangle: [[0,0],[8,0],[8,5],[0,5]],
      square: [[0,0],[6,0],[6,6],[0,6]],
      rhombus: [[0,0],[5,0],[8,4],[3,4]],
      trapezium: [[0,0],[9,0],[7,4.5],[2,4.5]],
      trapezoid: [[0,0],[9,0],[7,4.5],[2,4.5]],
      quadrilateral: [[0,0],[8,0],[7,5],[1.5,4]]
    };
    const k = q[1].toLowerCase();
    const sq = (k === 'rectangle' || k === 'square');
    return {
      inferred: true,
      points: Q[k].map((c, i) => ({ label: q[i + 2], x: c[0], y: c[1] })),
      angle_labels: Q[k].map(() => sq ? '90°' : '?')
    };
  }
  
  // Match triangles
  const m = t.match(/[Tt]riangle\\s+([A-Z])\\s?([A-Z])\\s?([A-Z])(?![A-Za-z])/);
  if (!m) return null;
  
  const L = [m[1], m[2], m[3]];
  
  // Check for right-angled triangle
  const rm = t.match(/right[- ]?angled\\s+(?:at\\s+)?([A-Z])(?![a-z])/) || 
             t.match(/(?:∠|angle)\\s*([A-Z])\\s*=\\s*90/);
  const ri = rm ? L.indexOf(rm[1]) : -1;
  
  if (ri >= 0) return {
    inferred: true,
    angle_labels: ['?', '90°', '?'],
    points: [
      { label: L[(ri + 2) % 3], x: 0, y: 5 },
      { label: L[ri], x: 0, y: 0 },
      { label: L[(ri + 1) % 3], x: 6.5, y: 0 }
    ]
  };
  
  const eq = /equilateral/i.test(t);
  const iso = /isosceles/i.test(t);
  
  return {
    inferred: true,
    angle_labels: eq ? ['60°', '60°', '60°'] : ['?', '?', '?'],
    points: [
      { label: L[0], x: eq || iso ? 4 : 2.6, y: eq ? 6.9 : 5.6 },
      { label: L[1], x: 0, y: 0 },
      { label: L[2], x: 8, y: 0 }
    ]
  };
};

/**
 * Handle diagram interaction (hover/click)
 * @param {HTMLElement} card - Diagram container element
 * @param {HTMLElement|null} v - Interactive element (vertex/angle)
 * @function
 */
window.dgSet = function(card, v) {
  card.querySelectorAll('.dg-v.on').forEach(g => g.classList.remove('on'));
  const chip = card.querySelector('.dg-chip');
  
  if (v) {
    v.classList.add('on');
    chip.textContent = v.dataset.info;
    chip.setAttribute('aria-label', `Selected: ${v.dataset.info}`);
  } else {
    chip.textContent = chip.dataset.default;
    chip.setAttribute('aria-label', `Default: ${chip.dataset.default}`);
  }
};

// Set up diagram interaction event listeners
document.addEventListener('DOMContentLoaded', function() {
  ['mouseover', 'click'].forEach(ev => {
    document.addEventListener(ev, e => {
      const card = e.target.closest && e.target.closest('.dg');
      if (card) window.dgSet(card, e.target.closest('.dg-v'));
    });
  });
  
  document.addEventListener('mouseout', e => {
    const card = e.target.closest && e.target.closest('.dg');
    if (card && !card.contains(e.relatedTarget)) {
      window.dgSet(card, null);
    }
  });
});

/**
 * Generate HTML for question badges (type and points)
 * @param {Object} item - Problem item
 * @returns {string} HTML for badges
 * @function
 */
window.badgesHTML = function(item) {
  const tag = item.question_type || item.tag;
  const pts = item.points ?? item.marks;
  
  if (!tag && pts == null) return '';
  
  return `<div class="flex items-center gap-1.5 mb-2" aria-label="Question metadata">` +
    (tag ? `<span class="text-[10px] font-bold uppercase tracking-wide text-brand-700 bg-brand-50 border border-brand-200 rounded-md px-2 py-0.5" aria-label="Question type: ${window.escapeHtml(tag)}">${window.escapeHtml(tag)}</span>` : '') +
    (pts != null ? `<span class="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5" aria-label="Points: ${window.escapeHtml(pts)}">[${window.escapeHtml(pts)} Pts]</span>` : '') +
    `</div>`;
};
