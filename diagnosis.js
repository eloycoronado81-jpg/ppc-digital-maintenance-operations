'use strict';
/* PPC Digital · módulo de uniones, mediciones mecánicas, desempeño hidráulico y diagnóstico.
 * Usa la biblioteca técnica (library.js) y el estado del expediente (app.js).
 * El diagnóstico es por reglas trazables a los documentos: sugiere causas, no las decide. */

const libOf = (tag) => EQUIPMENT_LIBRARY[tag] || null;
const areaFor = (tag) => libOf(tag)?.area || TAG_AREAS[tag]?.area || '';
const FLOW_TO_GPM = { gpm: 1, 'm³/h': 4.40287, 'bbl/d': 0.0291667 };
const fmtN = (v, d = 1) => (v === null || v === undefined || Number.isNaN(v) ? '—' : (+v).toFixed(d));

function interp(pts, x) {
  if (x === null || x === undefined) return null;
  if (x < pts[0][0] || x > pts.at(-1)[0]) return null;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return null;
}
/* Caudal que corresponde a una altura en la curva H-Q (descendente). */
function flowFromHead(pts, h) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if ((h <= y0 && h >= y1) || (h >= y0 && h <= y1)) return y0 === y1 ? x0 : x0 + ((h - y0) / (y1 - y0)) * (x1 - x0);
  }
  return null;
}

/* ---------- Uniones bridadas y mediciones mecánicas (etapa de Mantenimiento) ---------- */
const needsMech = () => /sello|correctivo/i.test(job.reason || '');
function jointState() {
  const lib = libOf(job.tag);
  if (!lib?.joints) return { applies: false, missing: [], blockers: [] };
  const missing = [], blockers = [];
  lib.joints.forEach((jt) => {
    const r = job.joints?.[jt.id] || {};
    if (!r.used) missing.push(`indicar si se intervino: ${jt.t}`);
    else if (r.used === 'SI') {
      if (!r.ref) missing.push(`protocolo FORM-TORQ de ${jt.t}`);
      if (!r.result) missing.push(`resultado del torque de ${jt.t}`);
      if (!attachList('joint:' + jt.id).length) missing.push(`adjuntar protocolo de torque de ${jt.t}`);
      if (r.result === 'NO_CONFORME') blockers.push(`Torque NO CONFORME: ${jt.t}`);
    }
  });
  return { applies: true, missing, blockers };
}
function mechState() {
  const lib = libOf(job.tag);
  if (!lib?.mech) return { applies: false, required: false, missing: [], blockers: [] };
  const required = needsMech();
  const missing = [], blockers = [];
  lib.mech.forEach((m) => {
    const v = num(job.mech?.[m.k]?.v);
    if (v === null) { if (required) missing.push(`medición: ${m.t}`); return; }
    if (v > m.max) blockers.push(`${m.t}: ${v}" > ${m.max}" (${m.src})`);
  });
  return { applies: true, required, missing, blockers };
}
function renderJointsMech() {
  const lib = libOf(job.tag);
  const locked = closed() || released();
  $('#torqueRefText').textContent = TORQUE_REF;
  $('#torqueRefWrap').classList.toggle('hidden', !!lib?.joints);
  if (!lib?.joints) {
    $('#jointsBox').innerHTML = '<p class="muted">Este TAG no tiene uniones precargadas en la biblioteca: registre la referencia general del protocolo de torque.</p>';
  } else {
    $('#jointsBox').innerHTML = `<div class="table-wrap"><table><thead><tr><th>Unión bridada</th><th>¿Intervenida?</th><th>Protocolo FORM-TORQ N.°</th><th>Resultado</th><th>Protocolo adjunto</th><th>Registro</th></tr></thead><tbody>${lib.joints.map((jt) => {
      const r = job.joints?.[jt.id] || {};
      const dis = locked ? 'disabled' : '';
      return `<tr class="${r.result === 'NO_CONFORME' ? 'row-alert' : ''}"><td><b>${esc(jt.t)}</b><br><small class="muted">${esc(jt.src)}</small></td>
        <td><select data-joint="${jt.id}" data-f="used" ${dis}><option value="">—</option><option value="SI" ${r.used === 'SI' ? 'selected' : ''}>Sí</option><option value="NO" ${r.used === 'NO' ? 'selected' : ''}>No</option></select></td>
        <td><input data-joint="${jt.id}" data-f="ref" value="${esc(r.ref || '')}" placeholder="FORM-TORQ-001 / OT" ${dis || (r.used !== 'SI' ? 'disabled' : '')}></td>
        <td><select data-joint="${jt.id}" data-f="result" ${dis || (r.used !== 'SI' ? 'disabled' : '')}><option value="">—</option><option value="CONFORME" ${r.result === 'CONFORME' ? 'selected' : ''}>Conforme</option><option value="NO_CONFORME" ${r.result === 'NO_CONFORME' ? 'selected' : ''}>No conforme</option></select></td>
        <td>${r.used === 'SI' ? attachWidget('joint:' + jt.id, locked) : '<small class="muted">—</small>'}</td>
        <td><small class="muted">${r.by ? esc(r.by) + ' · ' + esc(fmtTime(r.at)) : ''}</small></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  if (!lib?.mech) { $('#mechBox').innerHTML = ''; return; }
  const req = needsMech();
  $('#mechBox').innerHTML = `<h3 class="mt">Mediciones mecánicas de aceptación ${req ? '<small class="pill st-BLOCKED">obligatorias por el motivo</small>' : '<small class="pill">opcionales para este motivo</small>'}</h3>
    <div class="table-wrap"><table><thead><tr><th>Medición</th><th>Máximo</th><th>Valor (pulg.)</th><th>Estado</th></tr></thead><tbody>${lib.mech.map((m) => {
      const r = job.mech?.[m.k] || {};
      const v = num(r.v);
      const st = v === null ? '<span class="muted">Pendiente</span>' : v > m.max ? '<b class="red">Fuera de límite</b>' : '<b class="green">Conforme</b>';
      return `<tr class="${v !== null && v > m.max ? 'row-alert' : ''}"><td>${esc(m.t)}<br><small class="muted">${esc(m.src)}</small></td><td>${m.max}"</td>
        <td><input data-mech="${m.k}" type="number" step="0.0001" inputmode="decimal" value="${esc(r.v ?? '')}" ${locked ? 'disabled' : ''}></td><td>${st}${r.by ? `<br><small class="muted">${esc(r.by)} · ${esc(fmtTime(r.at))}</small>` : ''}</td></tr>`;
    }).join('')}</tbody></table></div>`;
}
document.addEventListener('change', async (e) => {
  const el = e.target;
  if (!job || !(el.matches('[data-joint]') || el.matches('[data-mech]'))) return;
  if (!requireUser()) { el.blur(); return render(); }
  if (el.matches('[data-joint]')) {
    job.joints = job.joints || {};
    const r = (job.joints[el.dataset.joint] = { ...(job.joints[el.dataset.joint] || {}) });
    r[el.dataset.f] = el.value.trim();
    if (r.used === 'NO') { r.ref = ''; r.result = ''; }
    r.by = currentUser(); r.at = nowISO();
    const jt = libOf(job.tag).joints.find((x) => x.id === el.dataset.joint);
    await commit(`Unión ${jt.t}`, `${el.dataset.f}: ${el.value || '—'}`);
  } else {
    job.mech = job.mech || {};
    job.mech[el.dataset.mech] = { v: el.value.trim(), by: currentUser(), at: nowISO() };
    const m = libOf(job.tag).mech.find((x) => x.k === el.dataset.mech);
    const v = num(el.value);
    await commit(`Medición mecánica: ${m.t}`, `${el.value}"`);
    if (v !== null && v > m.max) flash(`${m.t} fuera de límite (${v}" > ${m.max}"). Bloquea la liberación.`, 'bad');
  }
});

/* ---------- Desempeño hidráulico ---------- */
function hydParams() {
  const lib = libOf(job.tag);
  const d = lib?.defaults || {};
  const h = job.hyd || {};
  return {
    sg: num(h.sg) ?? d.sg ?? null,
    npsha: num(h.npsha) ?? d.npsha ?? null,
    pv: num(h.pv) ?? d.pv ?? null,
    pc: num(h.pc),
  };
}
function hydCalc(m) {
  const lib = libOf(job.tag);
  const c = CURVES[lib?.curve];
  const p = hydParams();
  if (!c || !m || !p.sg) return null;
  const ps = m.values.ps !== undefined ? toPsig(m.values.ps, m.units.ps) : null;
  const pd = m.values.pd !== undefined ? toPsig(m.values.pd, m.units.pd) : null;
  const dp = ps !== null && pd !== null ? pd - ps : null;
  const h = dp !== null ? (dp * 2.31) / p.sg : null;
  let q = m.values.flow !== undefined && FLOW_TO_GPM[m.units.flow] ? m.values.flow * FLOW_TO_GPM[m.units.flow] : null;
  let qEst = false;
  if (q === null && h !== null) { q = flowFromHead(c.head, h); qEst = q !== null; }
  const hCurve = interp(c.head, q);
  const eff = interp(c.eff, q);
  const npshr = interp(c.npshr, q);
  return {
    at: m.at, dp, h, q, qEst, hCurve,
    dev: h !== null && hCurve ? (h - hCurve) / hCurve : null,
    pctBep: q !== null ? (q / c.bep) * 100 : null,
    eff,
    bhp: q !== null && h !== null && eff ? (q * h * p.sg) / (3960 * (eff / 100)) : null,
    bhpCurve: interp(c.bhp, q) !== null ? interp(c.bhp, q) * (p.sg / c.sgCurve) : null,
    npshr, npshMargin: npshr !== null && p.npsha !== null ? p.npsha - npshr : null,
  };
}
const lastHyd = () => {
  const ms = job.measurements.filter((m) => m.values.pd !== undefined || m.values.flow !== undefined);
  return ms.length ? hydCalc(ms.at(-1)) : null;
};
function vaporMargin() {
  const p = hydParams();
  if (p.pc === null || p.pv === null) return null;
  return { pc: p.pc, pv: p.pv, diff: p.pc - p.pv, ratio: (p.pc + 14.7) / (p.pv + 14.7), tests: VAPOR_MARGIN.map((v) => ({ ...v, ok: v.test(p.pc, p.pv) })) };
}

function renderCurveChart() {
  const lib = libOf(job.tag);
  const c = CURVES[lib?.curve];
  if (!c) { $('#curveChart').innerHTML = '<div class="empty-chart">Sin curva del fabricante para este TAG.<br><small>Disponible para PAY-4210/4220 y PAY-4410/4420 (Afton 40824).</small></div>'; return; }
  const W = 760, H = 340, L = 56, R = 52, T = 24, B = 40;
  const q1 = 800, h0 = 200, h1 = 450;
  const x = (q) => L + (q / q1) * (W - L - R);
  const y = (h) => T + (1 - (h - h0) / (h1 - h0)) * (H - T - B);
  const ye = (e) => T + (1 - e / 80) * (H - T - B);
  const path = (pts, fy) => pts.map(([q, v], i) => `${i ? 'L' : 'M'}${x(q).toFixed(1)},${fy(v).toFixed(1)}`).join(' ');
  const grid = [200, 250, 300, 350, 400, 450].map((h) => `<line x1="${L}" x2="${W - R}" y1="${y(h)}" y2="${y(h)}" class="grid"/><text x="${L - 6}" y="${y(h) + 4}" text-anchor="end" class="axis">${h}</text>`).join('')
    + [0, 100, 200, 300, 400, 500, 600, 700, 800].map((q) => `<text x="${x(q)}" y="${H - B + 16}" text-anchor="middle" class="axis">${q}</text>`).join('')
    + [0, 20, 40, 60, 80].map((e) => `<text x="${W - R + 6}" y="${ye(e) + 4}" class="axis">${e}%</text>`).join('');
  const op = `<rect x="${x(360)}" y="${T}" width="${x(380) - x(360)}" height="${H - T - B}" class="op-band"><title>Caudal de operación 360–380 gpm (${cite('ING26', 11)})</title></rect>`;
  const pts = job.measurements.map(hydCalc).filter((r) => r && r.q !== null && r.h !== null);
  const dots = pts.map((r, i) => {
    const last = i === pts.length - 1;
    return `<circle cx="${x(r.q)}" cy="${y(Math.max(h0, Math.min(h1, r.h)))}" r="${last ? 7 : 4}" class="${last ? 'op-now' : 'op-old'}"><title>${fmt(r.at)} · ${fmtN(r.q, 0)} gpm${r.qEst ? ' (estimado por curva)' : ''} · ${fmtN(r.h, 0)} pies</title></circle>`;
  }).join('');
  const dsg = `<path d="M${x(c.design.q) - 6},${y(c.design.h)} L${x(c.design.q)},${y(c.design.h) - 6} L${x(c.design.q) + 6},${y(c.design.h)} L${x(c.design.q)},${y(c.design.h) + 6} Z" class="design-pt"><title>Punto de diseño ${c.design.q} gpm · ${c.design.h} pies</title></path>`;
  $('#curveChart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}">${op}${grid}
    <path d="${path(c.eff, ye)}" class="eff-line"/><path d="${path(c.head, y)}" class="hq-line"/>${dsg}${dots}
    <text x="${L}" y="${T - 8}" class="axis">TDH (pies)</text><text x="${W - R}" y="${T - 8}" text-anchor="end" class="axis">Eficiencia</text>
    <text x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle" class="axis">Caudal (gpm)</text></svg>
    <div class="legend"><span><i style="background:#dc2626"></i>H-Q Ø10.375"</span><span><i class="lg-eff"></i>Eficiencia</span><span><i style="background:#0b6e75;height:10px;width:10px;border-radius:50%"></i>Punto actual</span><span><i class="lg-design"></i>Diseño 460 gpm / 366 pies</span><span><i class="lg-op"></i>Operación 360–380 gpm</span></div>
    <p class="muted">${esc(c.source)}. La altura medida se calcula como ΔP × 2.31 / SG. Si no hay caudal medido, el caudal se estima desde la curva y se indica como estimado.</p>`;
}
function renderNpshChart() {
  const lib = libOf(job.tag);
  const c = CURVES[lib?.curve];
  const p = hydParams();
  if (!c) { $('#npshChart').innerHTML = ''; return; }
  const W = 760, H = 200, L = 56, R = 52, T = 18, B = 34, q1 = 800, n1 = 30;
  const x = (q) => L + (q / q1) * (W - L - R);
  const y = (n) => T + (1 - n / n1) * (H - T - B);
  const r = lastHyd();
  const grid = [0, 10, 20, 30].map((n) => `<line x1="${L}" x2="${W - R}" y1="${y(n)}" y2="${y(n)}" class="grid"/><text x="${L - 6}" y="${y(n) + 4}" text-anchor="end" class="axis">${n}</text>`).join('')
    + [0, 200, 400, 600, 800].map((q) => `<text x="${x(q)}" y="${H - B + 16}" text-anchor="middle" class="axis">${q}</text>`).join('');
  const na = p.npsha !== null ? `<line x1="${L}" x2="${W - R}" y1="${y(p.npsha)}" y2="${y(p.npsha)}" class="npsha-line"/><text x="${W - R - 4}" y="${y(p.npsha) - 4}" text-anchor="end" class="limlabel">NPSHa ${p.npsha} pies</text>` : '';
  const dsn = `<rect x="${L}" y="${y(12)}" width="${W - L - R}" height="${y(10) - y(12)}" class="npsha-design"><title>NPSHa de diseño 10–12 pies (${cite('IOM', 13)})</title></rect>`;
  const now = r?.q ? `<line x1="${x(r.q)}" x2="${x(r.q)}" y1="${T}" y2="${H - B}" class="event"/><circle cx="${x(r.q)}" cy="${y(r.npshr ?? 0)}" r="5" class="op-now"/>` : '';
  const path = c.npshr.map(([q, v], i) => `${i ? 'L' : 'M'}${x(q).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  $('#npshChart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="NPSH requerido vs disponible">${dsn}${grid}<path d="${path}" class="npshr-line"/>${na}${now}<text x="${L}" y="${T - 4}" class="axis">NPSH (pies)</text></svg>
    <div class="legend"><span><i style="background:#7c2d12"></i>NPSHr (curva)</span><span><i class="lg-npsha"></i>NPSHa usado en el cálculo</span><span><i class="lg-npshd"></i>NPSHa de diseño 10–12 pies</span></div>`;
}
function renderHydResults() {
  const r = lastHyd();
  const v = vaporMargin();
  const c = CURVES[libOf(job.tag)?.curve];
  const p = hydParams();
  const row = (label, val, cls = '', srcTxt = '') => `<tr class="${cls}"><td>${esc(label)}</td><td><b>${val}</b></td><td><small class="muted">${esc(srcTxt)}</small></td></tr>`;
  const rows = [];
  if (!c) rows.push(row('Curva', 'No disponible para este TAG'));
  else if (!r) rows.push(row('Punto de operación', 'Registre una medición con succión y descarga (y caudal si está disponible)'));
  else {
    rows.push(row('ΔP medido', `${fmtN(r.dp, 1)} psi`));
    rows.push(row('Altura medida (ΔP × 2.31 / SG)', `${fmtN(r.h, 0)} pies`, '', `SG ${p.sg}`));
    rows.push(row(r.qEst ? 'Caudal estimado por curva' : 'Caudal medido', r.q !== null ? `${fmtN(r.q, 0)} gpm${r.qEst ? ' (estimado)' : ''}` : 'Fuera del rango de la curva', r.qEst ? 'warn-row' : ''));
    if (!r.qEst) rows.push(row('Altura de curva al caudal medido', `${fmtN(r.hCurve, 0)} pies`, '', c.source));
    if (!r.qEst && r.dev !== null) rows.push(row('Desviación respecto a la curva', `${fmtN(r.dev * 100, 1)} %`, Math.abs(r.dev) > 0.1 ? 'row-alert' : '', 'Umbral de sugerencia ±10% (no es criterio de aceptación)'));
    rows.push(row('Caudal respecto al BEP', `${fmtN(r.pctBep, 0)} %`, '', `BEP ≈ ${c.bep} gpm`));
    rows.push(row('Eficiencia de curva', `${fmtN(r.eff, 1)} %`));
    rows.push(row('Potencia al freno estimada', `${fmtN(r.bhp, 1)} HP (curva: ${fmtN(r.bhpCurve, 1)} HP)`, '', 'TDH × gpm × SG / (3960 × η) · IOM pág. 32'));
    rows.push(row('NPSH requerido / margen', `${fmtN(r.npshr, 1)} pies / ${fmtN(r.npshMargin, 1)} pies`, r.npshMargin !== null && r.npshMargin < 0 ? 'row-alert' : r.npshMargin !== null && r.npshMargin < 3 ? 'warn-row' : '', `NPSHa ${p.npsha} pies`));
  }
  if (v) {
    rows.push(row('Margen de presión de vapor en la cavidad', `${fmtN(v.diff, 1)} psi · relación ${fmtN(v.ratio, 2)} (abs.)`));
    v.tests.forEach((t) => rows.push(row(t.t, t.ok ? '✓ Cumple' : '✕ No cumple', t.ok ? '' : 'row-alert', t.src)));
  } else rows.push(row('Margen de presión de vapor', 'Ingrese presión de la cavidad de sellado y presión de vapor'));
  $('#hydResults').innerHTML = `<table><tbody>${rows.join('')}</tbody></table>`;
  if (r && r.npshMargin !== null && r.npshMargin < 3) {
    $('#hydNote').innerHTML = `<b>${r.npshMargin < 0 ? '⛔' : '⚠'} Margen de NPSH ${r.npshMargin < 0 ? 'negativo' : 'reducido'}.</b> Con NPSHa de diseño de 10–12 pies (${esc(cite('IOM', 13))}) la bomba queda prácticamente sin margen a 460 gpm (NPSHr ≈ 11.7 pies).`;
  } else $('#hydNote').innerHTML = '';
}

/* ---------- Diagnóstico ---------- */
function detectFindings() {
  const out = [];
  const ms = job.measurements;
  const last = ms.at(-1);
  if (last) {
    const ev = last.eval || {};
    if (['vp', 'vm'].some((k) => ev[k] === 'A' || ev[k] === 'X')) out.push({ t: 'Vibración en alerta/acción según criterio del TAG', hi: ['vib'] });
    if (last.noise === 'ANORMAL') out.push({ t: 'Ruido anormal registrado', hi: ['vib'] });
    if (ev.temp === 'A' || ev.temp === 'X') out.push({ t: 'Temperatura de rodamiento en alerta/acción', hi: ['bearings'] });
    if (last.seal === 'FUGA') out.push({ t: 'Fuga o goteo de sello registrado en medición', seal: ['s_gland', 's_dry'] });
  }
  const r = lastHyd();
  if (r && !r.qEst && r.dev !== null && r.dev < -0.1) out.push({ t: `Altura ${fmtN(r.dev * 100, 0)}% bajo la curva al caudal medido`, hi: ['lowp'] });
  if (r && r.npshMargin !== null && r.npshMargin < 0) out.push({ t: 'NPSH disponible menor que el requerido', boost: [4] });
  const p52 = ms.filter((m) => m.values.p52 !== undefined);
  if (p52.length) {
    const lp = p52.at(-1);
    const psig = toPsig(lp.values.p52, lp.units.p52);
    const p0 = num(job.plan52.pressure) !== null ? toPsig(num(job.plan52.pressure), job.plan52.pressureUnit) : null;
    if (psig !== null && (psig > PROC.barrier.max || (p0 !== null && psig > p0 + 0.5))) out.push({ t: `Presión del Plan 52 en ${fmtN(psig, 1)} psig (inicial ${fmtN(p0, 1)} psig; normal 0–5 psig)`, seal: ['s_p52up'] });
  }
  const l52 = ms.filter((m) => m.values.l52 !== undefined);
  if (job.plan52.standby.result === 'CONSUMO' || (l52.length > 1 && l52.at(-1).values.l52 < l52[0].values.l52)) out.push({ t: 'Consumo de fluido de barrera (propanol) detectado (stand-by o tendencia de nivel)', seal: ['s_p52low'] });
  if (job.leakEvents.some((e) => e.result === 'FUGA')) out.push({ t: 'Leak Test con fuga registrada en este expediente', seal: ['s_gland'] });
  const v = vaporMargin();
  if (v && v.tests.some((t) => t.id === 'jc13' && !t.ok)) out.push({ t: 'Margen de presión de vapor en la cavidad bajo la referencia de 30%', seal: ['s_dry'] });
  return out;
}
function renderDiagnosis() {
  const findings = detectFindings();
  const sel = new Set(job.diagSel || []);
  const autoHi = new Set(findings.flatMap((f) => f.hi || []));
  const autoSeal = new Set(findings.flatMap((f) => f.seal || []));
  const boost = new Set(findings.flatMap((f) => f.boost || []));
  $('#diagFindings').innerHTML = findings.length
    ? `<ul>${findings.map((f) => `<li>🔎 ${esc(f.t)}</li>`).join('')}</ul>`
    : '<p class="muted">Sin hallazgos automáticos con las mediciones actuales.</p>';
  const chk = (id, t, auto) => `<label class="sym ${auto ? 'auto' : ''}"><input type="checkbox" data-sym="${id}" ${sel.has(id) || auto ? 'checked' : ''} ${auto || closed() ? 'disabled' : ''}> ${esc(t)}${auto ? ' <small>detectado</small>' : ''}</label>`;
  $('#diagHiSyms').innerHTML = HI_SYMPTOMS.map((s) => chk(s.id, s.t, autoHi.has(s.id))).join('');
  $('#diagSealSyms').innerHTML = SEAL_SYMPTOMS.map((s) => chk(s.id, s.t, autoSeal.has(s.id))).join('');

  const activeHi = HI_SYMPTOMS.filter((s) => sel.has(s.id) || autoHi.has(s.id));
  const showNa = $('#diagShowNa').checked;
  const score = {};
  activeHi.forEach((s) => s.causes.forEach((c) => (score[c] = (score[c] || 0) + 1)));
  boost.forEach((c) => (score[c] = (score[c] || 0) + 2));
  const ranked = Object.entries(score).map(([c, n]) => ({ c: +c, n })).filter(({ c }) => showNa || !HI_CAUSES[c][2]).sort((a, b) => b.n - a.n || a.c - b.c);
  const hidden = Object.keys(score).filter((c) => HI_CAUSES[c][2]).length;
  $('#diagHiCauses').innerHTML = !activeHi.length && !boost.size ? '<p class="muted">Seleccione al menos un síntoma de la bomba.</p>'
    : `<table><thead><tr><th>#</th><th>Causa posible (IOM pág. 33)</th><th>Coincidencias</th><th>Verificación respaldada</th></tr></thead><tbody>${ranked.map(({ c, n }) => {
      const [cat, t, na] = HI_CAUSES[c];
      const ck = HI_CHECKS[c];
      return `<tr class="${boost.has(c) ? 'row-alert' : ''}"><td>${c}</td><td><small class="muted">${esc(cat)}</small><br>${esc(t)}${na ? ' <small class="pill">no aplica habitualmente</small>' : ''}</td><td>${n}</td><td>${ck ? `${esc(ck[0])}<br><small class="muted">${esc(ck[1])}</small>` : '<small class="muted">Sin verificación específica en los documentos</small>'}</td></tr>`;
    }).join('')}</tbody></table>${hidden && !showNa ? `<p class="muted">${hidden} causa/s de válvula de pie o empaquetadura ocultas: no aplican a esta bomba en línea con succión inundada y sello mecánico.</p>` : ''}`;

  const activeSeal = SEAL_SYMPTOMS.filter((s) => sel.has(s.id) || autoSeal.has(s.id));
  $('#diagSealOut').innerHTML = activeSeal.length ? activeSeal.map((s) => `<div class="diag-card"><h4>${esc(s.t)}</h4>
      <b>Causas probables</b><ul>${s.causes.map(([t, src]) => `<li>${esc(t)} <small class="muted">· ${esc(src)}</small></li>`).join('')}</ul>
      <b>Verificaciones</b><ul>${s.checks.map(([t, src]) => `<li>${esc(t)}${src ? ` <small class="muted">· ${esc(src)}</small>` : ''}</li>`).join('')}</ul></div>`).join('')
    : '<p class="muted">Seleccione un síntoma del sistema de sello.</p>';
  $('#diagHistory').innerHTML = (job.diagnoses || []).length
    ? [...job.diagnoses].reverse().map((d) => `<div><b>${esc(fmt(d.at))}</b> · ${esc(d.by)} · ${esc(d.symptoms.join(', '))}${d.obs ? ' · ' + esc(d.obs) : ''}</div>`).join('')
    : '<i>Sin diagnósticos registrados.</i>';
}
function renderEquipData() {
  const lib = libOf(job.tag);
  if (!lib) { $('#equipData').innerHTML = '<p class="muted">Este TAG no está en la biblioteca técnica. La ficha y los criterios se cargan con "Ficha del equipo y criterios".</p>'; return; }
  const t = (rows) => `<table><tbody>${rows.map(([a, b, s]) => `<tr><td>${esc(a)}</td><td><b>${esc(b)}</b></td><td><small class="muted">${esc(s)}</small></td></tr>`).join('')}</tbody></table>`;
  $('#equipData').innerHTML = `<h3>Diseño</h3>${t([['Equipo', lib.model, cite('IOM', 5)], ['Servicio', lib.service, cite('IOM', 5)], ['Sello', lib.seal, cite('IOM', 7)], ['Motor', lib.motor, cite('IOM', 5)], ['Área', lib.area, lib.areaSrc], ...lib.design])}
    <h3 class="mt">Condiciones de operación actuales</h3>${t(lib.operation)}`;
}
function renderDiagStage() {
  if (!job) return;
  const p = job.hyd || {};
  const d = libOf(job.tag)?.defaults || {};
  [['#hySg', 'sg'], ['#hyNpsha', 'npsha'], ['#hyPv', 'pv'], ['#hyPc', 'pc']].forEach(([s, k]) => {
    setVal(s, p[k] ?? '');
    $(s).placeholder = d[k] !== undefined ? `${d[k]} (documento)` : '';
    $(s).disabled = closed();
  });
  renderEquipData();
  renderCurveChart();
  renderNpshChart();
  renderHydResults();
  renderDiagnosis();
}

[['#hySg', 'sg', 'SG para cálculo hidráulico'], ['#hyNpsha', 'npsha', 'NPSHa para cálculo'], ['#hyPv', 'pv', 'Presión de vapor'], ['#hyPc', 'pc', 'Presión de la cavidad de sellado']].forEach(([s, k, label]) => {
  $(s).addEventListener('change', async (e) => {
    if (!job || !requireUser()) { e.target.blur(); return render(); }
    job.hyd = { ...(job.hyd || {}), [k]: e.target.value.trim() };
    await commit(label, e.target.value || 'valor del documento');
  });
});
document.addEventListener('change', (e) => {
  if (!job || !e.target.matches('[data-sym]')) return;
  const s = new Set(job.diagSel || []);
  if (e.target.checked) s.add(e.target.dataset.sym); else s.delete(e.target.dataset.sym);
  job.diagSel = [...s];
  renderDiagnosis();
});
$('#diagShowNa').addEventListener('change', () => job && renderDiagnosis());
$('#saveDiag').onclick = async () => {
  if (!requireUser()) return;
  const findings = detectFindings();
  const ids = new Set([...(job.diagSel || []), ...findings.flatMap((f) => [...(f.hi || []), ...(f.seal || [])])]);
  const names = [...HI_SYMPTOMS, ...SEAL_SYMPTOMS].filter((s) => ids.has(s.id)).map((s) => s.t);
  if (!names.length) return flash('Seleccione al menos un síntoma antes de registrar el diagnóstico.', 'warn');
  const obs = $('#diagObs').value.trim();
  job.diagnoses = [...(job.diagnoses || []), { at: nowISO(), by: currentUser(), symptoms: names, findings: findings.map((f) => f.t), obs, hyd: lastHyd(), vapor: vaporMargin() }];
  $('#diagObs').value = '';
  await commit('Diagnóstico registrado', names.join(' · '));
  flash('Diagnóstico registrado en el expediente.', 'good');
};
