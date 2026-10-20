'use strict';
/* PPC Digital · Afton · Lista de verificación de arranque de bombas de reflujo
 * V0.4 — expediente persistente por intervención (IndexedDB), gates en orden,
 * bloqueo de fuga con resolución, mediciones estructuradas y tendencia.
 * La aplicación guía y registra; no acciona físicamente equipos. */

const APP_VERSION = 'V0.4.0';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nowISO = () => new Date().toISOString();
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('es-PE') : '');
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '');
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

/* ---------- Configuración ---------- */
const DEFAULT_TAGS = ['PAY-14425', 'PAY-14210', 'PAY-4210', 'PAY-4220', 'PAY-4410', 'PAY-4420'];
const TITLES = ['1. Liberación de Mantenimiento', '2. Preparación de Operaciones', '3. Sistema de sello / API Plan 52', '4. Enfriamiento / Cebado', '5. Leak Test', '6. Autorización y Arranque', '7. Estabilización'];

const CHECKS = {
  m: [
    { id: 'm1', t: 'Trabajo mecánico concluido', c: 1 },
    { id: 'm2', t: 'Sello mecánico instalado/verificado', c: 1 },
    { id: 'm3', t: 'Protocolo de torque aplicable conforme', c: 1 },
    { id: 'm4', t: 'Alineamiento/paralelismo verificado', c: 0 },
    { id: 'm5', t: 'Acoplamiento y pernos verificados', c: 1 },
    { id: 'm6', t: 'Guardas instaladas', c: 1 },
    { id: 'm7', t: 'Rotación manual libre', c: 1 },
    { id: 'm8', t: 'Lubricación/nivel verificado', c: 1 },
    { id: 'm9', t: 'Área libre de materiales y herramientas', c: 1 },
  ],
  o: [
    { id: 'o11', t: 'Paso 1 · Maniobra comunicada a Sala de Control', c: 1 },
    { id: 'o2', t: 'Alineamiento de válvulas verificado según procedimiento', c: 1 },
    { id: 'o3', t: 'Instrumentación disponible', c: 1 },
    { id: 'o4', t: 'Protecciones/interlocks disponibles', c: 1 },
    { id: 'o9', t: 'Drenajes y venteos en posición verificada por segunda persona', c: 1 },
    { id: 'o10', t: 'Área delimitada y EPP para fluido criogénico', c: 1 },
    { id: 'o8', t: 'Ausencia de fugas visibles', c: 1 },
  ],
  /* POP-005002 · Paso 2 (enfriamiento de bomba en S/B) y Paso 3 (cierre de purgas).
     Los ítems "purge" admiten N/A solo cuando el enfriamiento inicial se declaró adecuado. */
  c: [
    { id: 'c1', t: 'Válvulas de drenaje a cajas cerradas', c: 1, purge: 1 },
    { id: 'c2', t: 'Ventes de manifold de manómetros cerrados', c: 1, purge: 1 },
    { id: 'c3', t: 'XV de succión abierta (solicitada a Sala de Control)', c: 1, purge: 1 },
    { id: 'c4', t: 'Purga ¾" compuerta abierta', c: 1, purge: 1 },
    { id: 'c5', t: 'By-pass ¾" globo de la check de descarga abierto', c: 1, purge: 1 },
    { id: 'c6', t: 'Purga ¾" globo restringida hacia COLD FLARE · Operador de Servicios avisado', c: 1, purge: 1 },
    { id: 'c7', t: 'Congelamiento observado en el cuerpo de la bomba', c: 1, purge: 1 },
    { id: 'c8', t: 'Paso 3 · Purgas cerradas: ¾" globo, ¾" compuerta y by-pass de la check', c: 1, purge: 1 },
    { id: 'c9', t: 'Sala de Control informada: bomba con condiciones de arranque', c: 1 },
  ],
  /* POP-005002 · Pasos 4 a 6 + precauciones del Paso 7 (antes del START). */
  sa: [
    { id: 'sa1', t: 'Paso 4 · Válvula de descarga abierta al 50%', c: 1 },
    { id: 'sa2', t: 'Paso 5 · Lazo de recirculación de la descarga en MANUAL (Delta-V)', c: 1 },
    { id: 'sa3', t: 'Paso 6 · Lazos de válvulas de reflujo a la torre en MANUAL', c: 1 },
    { id: 'sa4', t: 'Puntos testigo cerrados, EPP y distancia segura durante el arranque', c: 1 },
  ],
  /* POP-005002 · Pasos 8 a 16 (después del START). */
  sb: [
    { id: 'sb1', t: 'Paso 8 · Apertura completa de la válvula de descarga', c: 1 },
    { id: 'sb2', t: 'Paso 9 · Bomba saliente detenida (STOP)', c: 0 },
    { id: 'sb3', t: 'Paso 10 · Presión de descarga mantenida (FV de reflujo restringidas / recirculación al acumulador)', c: 1 },
    { id: 'sb4', t: 'Paso 11 · Presión de descarga verificada en PIT y PI', c: 1 },
    { id: 'sb5', t: 'Paso 12 · Válvulas de flujo a la torre abiertas en MANUAL · nivel del acumulador mantenido', c: 1 },
    { id: 'sb6', t: 'Paso 13 · Lazo de recirculación en AUTOMÁTICO', c: 1 },
    { id: 'sb7', t: 'Paso 14 · Lazos de reflujo a la torre en CASCADA', c: 1 },
    { id: 'sb8', t: 'Paso 15 · Bomba en S/B acondicionada (MOV succión abierta, descarga 50%, by-pass check abierto, fría)', c: 0 },
    { id: 'sb9', t: 'Paso 16 · Sala de Control informada del fin de maniobras', c: 1 },
  ],
  p: [
    { id: 'p1', t: 'Fluido buffer configurado/compatible', c: 1 },
    { id: 'p2', t: 'Nivel inicial verificado', c: 1 },
    { id: 'p3', t: 'Válvulas requeridas en condición operativa', c: 1 },
    { id: 'p4', t: 'Líneas del sistema verificadas sin restricción evidente', c: 1 },
    { id: 'p5', t: 'Venteo/recuperación/flare alineado según procedimiento', c: 1 },
    { id: 'p6', t: 'Instrumentos de presión/nivel disponibles', c: 0 },
    { id: 'p7', t: 'Enfriamiento del reservorio verificado cuando aplique', c: 0 },
    { id: 'p8', t: 'Ausencia de fugas', c: 1 },
  ],
};

const MILESTONES = {
  COOL_START: 'Inicio de purga / enfriamiento hacia COLD FLARE',
  COOL_END: 'Congelamiento observado · fin de enfriamiento',
  PURGE: 'Purgas cerradas',
  START: 'Paso 7 · Arranque (START) ejecutado',
};

/* Referencias del procedimiento aprobado. Se muestran como guía y generan advertencias;
   no bloquean, porque el criterio final lo da la copia controlada vigente. */
const PROC = {
  code: 'PEPDG-OPS-POP-005002',
  version: '1.1',
  title: 'Operación Normal en Criogénica 3, 4 y 5',
  discharge: {
    'CRIO 3': { min: 400, max: 450, text: 'Presión de descarga ≈ 400–450 psig (Pasos 10–11, Criogénica 3–4)' },
    'CRIO 4': { min: 400, max: 450, text: 'Presión de descarga ≈ 400–450 psig (Pasos 10–11, Criogénica 3–4)' },
    'CRIO 5': { min: null, max: null, text: 'Presión de descarga ≈ 400 psig (Paso 11, Criogénica 5)' },
  },
  barrier: { min: 0, max: 5, unit: 'psig', text: 'Presión normal del tanque de líquido de barrera 0–5 psig' },
  propanol: 'Reponer propanol por bajo nivel (≈30%) y rellenar hasta el 70% del visor, coordinando con Sala de Control',
};
const TO_PSIG = { psig: 1, barg: 14.5038, kPa: 0.145038 };
const toPsig = (v, u) => (v === null || !(u in TO_PSIG) ? null : v * TO_PSIG[u]);
function outOfRef(v, u, ref) {
  const p = toPsig(v, u);
  return !!ref && ref.min !== null && p !== null && (p < ref.min || p > ref.max);
}
const dischargeRef = () => PROC.discharge[job?.area] || null;

const PARAMS = [
  { k: 'ps', t: 'Presión succión', u: ['psig', 'barg', 'kPa'] },
  { k: 'pd', t: 'Presión descarga', u: ['psig', 'barg', 'kPa'] },
  { k: 'flow', t: 'Caudal', u: ['m³/h', 'gpm', 'bbl/d'] },
  { k: 'amps', t: 'Corriente motor', u: ['A'] },
  { k: 'vp', t: 'Vibración bomba', u: ['mm/s', 'in/s'] },
  { k: 'vm', t: 'Vibración motor', u: ['mm/s', 'in/s'] },
  { k: 'temp', t: 'Temp. rodamiento', u: ['°C', '°F'] },
  { k: 'p52', t: 'Presión Plan 52', u: ['psig', 'barg', 'kPa'] },
  { k: 'l52', t: 'Nivel Plan 52', u: ['%', 'mm'] },
];

const STATUS_LABEL = {
  DRAFT: 'Borrador',
  MAINTENANCE_RELEASE: 'Liberación Mantenimiento',
  OPERATIONS_PREP: 'Preparación Operaciones',
  COOLING_PRIMING: 'Enfriamiento / cebado',
  LEAK_TEST: 'Leak Test',
  START_READY: 'Listo para arranque',
  STARTED: 'Arrancado',
  STABILIZING: 'Estabilizando',
  COMPLETED: 'Cerrado',
  BLOCKED: 'Bloqueado',
  NON_CONFORMING: 'No conforme',
  RETURNED_TO_MAINTENANCE: 'Retornado a Mantenimiento',
};

/* ---------- Almacenamiento (IndexedDB con respaldo en localStorage) ---------- */
const DB_NAME = 'ppc-digital';
const STORE = 'interventions';
const LS_FALLBACK = 'ppcInterventions';
let db = null;

function openDB() {
  return new Promise((resolve) => {
    if (!('indexedDB' in window)) return resolve(null);
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}
function lsAll() {
  try { return JSON.parse(localStorage.getItem(LS_FALLBACK) || '[]'); } catch (e) { return []; }
}
function dbAll() {
  if (!db) return Promise.resolve(lsAll());
  return new Promise((resolve, reject) => {
    const q = db.transaction(STORE).objectStore(STORE).getAll();
    q.onsuccess = () => resolve(q.result || []);
    q.onerror = () => reject(q.error);
  });
}
function dbPut(rec) {
  const copy = JSON.parse(JSON.stringify(rec));
  if (!db) {
    const all = lsAll().filter((x) => x.id !== copy.id);
    all.push(copy);
    localStorage.setItem(LS_FALLBACK, JSON.stringify(all));
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(copy);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------- Estado ---------- */
let tags = loadTags();
let jobs = [];
let job = null;
let currentStage = 0;
let gateMsg = { m: '', s: '' }; // motivo del último rechazo de gate (no persistente)

function loadTags() {
  try {
    const t = JSON.parse(localStorage.getItem('aftonTags') || 'null');
    return Array.isArray(t) && t.length ? t : [...DEFAULT_TAGS];
  } catch (e) {
    return [...DEFAULT_TAGS];
  }
}
const currentUser = () => (localStorage.getItem('ppcUser') || '').trim();

function blankJob() {
  return {
    id: uuid(),
    appVersion: APP_VERSION,
    revision: 0,
    createdAt: nowISO(),
    createdBy: currentUser(),
    updatedAt: nowISO(),
    tag: $('#tag').value || tags[0],
    area: '',
    reason: $('#reason').options[0].text,
    ot: '',
    pssr: '',
    people: { maint: '', qa: '', operator: '', ops: '' },
    checks: { m: {}, o: {}, p: {}, c: {}, sa: {}, sb: {} },
    torqueRef: '',
    cooling: { initial: '' },
    maintenanceObs: '',
    maintenanceRelease: null,
    releaseHistory: [],
    plan52: { applicable: true, justification: '', pressure: '', pressureUnit: 'psig', level: '', levelUnit: '%', standby: { l0: null, l1: null, result: '' } },
    milestones: [],
    leakEvents: [],
    startAuth: null,
    units: Object.fromEntries(PARAMS.map((p) => [p.k, p.u[0]])),
    measurements: [],
    closure: null,
    status: 'DRAFT',
    audit: [],
  };
}

/* Completa campos faltantes en expedientes creados por versiones previas. */
function normalize(j) {
  const base = blankJobShape();
  for (const [k, v] of Object.entries(base)) if (j[k] === undefined) j[k] = v;
  for (const k of Object.keys(base.checks)) if (!j.checks[k]) j.checks[k] = {};
  return j;
}
function blankJobShape() {
  return {
    checks: { m: {}, o: {}, p: {}, c: {}, sa: {}, sb: {} }, torqueRef: '', cooling: { initial: '' }, releaseHistory: [],
    units: Object.fromEntries(PARAMS.map((p) => [p.k, p.u[0]])), leakEvents: [], milestones: [], measurements: [], audit: [],
  };
}

/* ---------- Reglas de negocio ---------- */
const naAllowed = (k, it) => !it.c || (k === 'c' && it.purge && job.cooling.initial === 'ADECUADO');
const released = () => !!job?.maintenanceRelease;
const closed = () => !!job?.closure;
const releaseAt = () => job?.maintenanceRelease?.at || '';

/* Las respuestas de Operaciones y Plan 52 solo valen si son posteriores a la liberación vigente. */
function answer(k, id) {
  const a = job.checks[k][id];
  if (!a) return null;
  if (k !== 'm' && released() && a.at < releaseAt()) return { ...a, stale: true };
  return a;
}
function checkState(k) {
  const rows = CHECKS[k].map((it) => {
    const a = answer(k, it.id);
    return { it, v: a && !a.stale ? a.v : '' };
  });
  return {
    complete: rows.every((r) => r.v === 'OK' || (r.v === 'NA' && naAllowed(k, r.it))),
    criticalNo: rows.filter((r) => r.it.c && r.v === 'NO').map((r) => r.it.t),
    nonCriticalNo: rows.filter((r) => !r.it.c && r.v === 'NO').map((r) => r.it.t),
    invalidNa: rows.filter((r) => r.v === 'NA' && !naAllowed(k, r.it)).map((r) => r.it.t),
    pending: rows.filter((r) => !r.v).map((r) => r.it.t),
  };
}
function milestone(code) {
  return job.milestones.filter((m) => m.code === code && m.at > releaseAt()).at(-1) || null;
}
const lastLeak = () => job.leakEvents.at(-1) || null;

function criticalBlockers() {
  const out = [];
  checkState('m').criticalNo.forEach((t) => out.push(`Mantenimiento NO OK: ${t}`));
  if (released()) {
    checkState('o').criticalNo.forEach((t) => out.push(`Operaciones NO OK: ${t}`));
    if (job.plan52.applicable) checkState('p').criticalNo.forEach((t) => out.push(`Plan 52 NO OK: ${t}`));
    checkState('c').criticalNo.forEach((t) => out.push(`Enfriamiento NO OK: ${t}`));
    checkState('sa').criticalNo.forEach((t) => out.push(`Pre-arranque NO OK: ${t}`));
    checkState('sb').criticalNo.forEach((t) => out.push(`Post-arranque NO OK: ${t}`));
  }
  if (job.plan52.applicable && job.plan52.standby.result === 'CONSUMO') out.push('Consumo de buffer detectado en stand-by');
  if (lastLeak()?.result === 'FUGA') out.push('Leak Test NO CONFORME sin resolución');
  return out;
}

/* gates()[n] = requisitos pendientes para habilitar la etapa n+1 (acumulativos). */
function gates() {
  const g = [];
  const r0 = [];
  if (!released()) r0.push('Liberación de Mantenimiento pendiente');
  g[0] = r0;

  const r1 = [...r0];
  const o = checkState('o');
  if (released()) {
    if (!o.complete) r1.push(`Checklist de Operaciones incompleto (${o.pending.length + o.criticalNo.length + o.nonCriticalNo.length} punto/s)`);
    if (!job.people.operator.trim()) r1.push('Registrar Operador');
    if (!job.people.ops.trim()) r1.push('Registrar Supervisor de Operaciones');
  }
  g[1] = r1;

  const r2 = [...r1];
  const p52 = job.plan52;
  if (r1.length === 0) {
    if (p52.applicable) {
      const p = checkState('p');
      if (!p.complete) r2.push('Checklist Plan 52 incompleto');
      if (num(p52.pressure) === null || num(p52.level) === null) r2.push('Registrar presión y nivel inicial del Plan 52');
      if (p52.standby.result === 'CONSUMO') r2.push('Consumo de buffer detectado en stand-by');
    } else if (!p52.justification.trim()) {
      r2.push('Justificar por qué el Plan 52 no aplica');
    }
  }
  g[2] = r2;

  const r3 = [...r2];
  if (r2.length === 0) {
    const ci = job.cooling.initial;
    if (!ci) r3.push('Declarar condición inicial de enfriamiento de la bomba en S/B');
    if (ci === 'NO_ADECUADO') {
      if (!milestone('COOL_START')) r3.push('Registrar inicio de purga / enfriamiento');
      if (!milestone('COOL_END')) r3.push('Registrar congelamiento observado');
      if (!milestone('PURGE')) r3.push('Registrar cierre de purgas');
    }
    const c = checkState('c');
    if (ci && !c.complete) r3.push(`Checklist de enfriamiento incompleto${c.invalidNa.length ? ' (N/A no válido con enfriamiento no adecuado)' : ''}`);
  }
  g[3] = r3;

  const r4 = [...r3];
  if (r3.length === 0) {
    const l = lastLeak();
    const coolRef = [releaseAt(), ...['COOL_START', 'COOL_END', 'PURGE'].map((c) => milestone(c)?.at || '')].sort().at(-1);
    if (!l || l.at < coolRef) r4.push('Leak Test pendiente');
    else if (l.result === 'FUGA') r4.push('Leak Test NO CONFORME: registrar resolución');
    else if (l.result !== 'CONFORME') r4.push('Repetir Leak Test tras la resolución');
  }
  g[4] = r4;

  const r5 = [...r4];
  if (r4.length === 0 && !job.startAuth) r5.push('Autorización de arranque pendiente');
  g[5] = r5;
  return g;
}
const stageUnlocked = (n, g = gates()) => n === 0 || g[n - 1].length === 0;

function computeStatus() {
  if (job.closure) return 'COMPLETED';
  const l = lastLeak();
  if (l?.result === 'FUGA') return 'NON_CONFORMING';
  if (!released() && job.releaseHistory.some((r) => r.revokedReason === 'LEAK')) return 'RETURNED_TO_MAINTENANCE';
  if (criticalBlockers().length) return 'BLOCKED';
  if (job.startAuth && milestone('START')) return job.measurements.some((m) => m.stage === 'ESTABILIZACION') ? 'STABILIZING' : 'STARTED';
  const g = gates();
  if (g[4].length === 0) return 'START_READY';
  if (g[3].length === 0) return 'LEAK_TEST';
  if (g[2].length === 0) return 'COOLING_PRIMING';
  if (g[0].length === 0) return 'OPERATIONS_PREP';
  return Object.keys(job.checks.m).length ? 'MAINTENANCE_RELEASE' : 'DRAFT';
}

/* ---------- Persistencia y auditoría ---------- */
function requireUser() {
  if (currentUser()) return true;
  flash('Ingrese su nombre en “Usuario en turno” antes de registrar.', 'bad');
  $('#user').focus();
  return false;
}
async function commit(action, detail = '') {
  job.audit.push({ at: nowISO(), by: currentUser(), action, detail });
  job.updatedAt = nowISO();
  job.revision += 1;
  job.status = computeStatus();
  try {
    await dbPut(job);
    $('#savedAt').textContent = `Guardado ${fmtTime(job.updatedAt)}`;
  } catch (e) {
    flash('No se pudo guardar en el dispositivo: ' + e.message, 'bad');
  }
  const i = jobs.findIndex((x) => x.id === job.id);
  if (i >= 0) jobs[i] = job; else jobs.push(job);
  render();
}
let flashTimer = null;
function flash(msg, kind = 'warn') {
  const el = $('#flash');
  el.textContent = msg;
  el.className = `flash show ${kind}`;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => (el.className = 'flash'), 5000);
}

/* ---------- Render ---------- */
/* No sobrescribe el campo que el usuario está editando. */
function setVal(sel, v) {
  const el = $(sel);
  if (el && el !== document.activeElement) el.value = v ?? '';
}
function renderTags() {
  const sel = $('#tag');
  const v = job?.tag || sel.value;
  const list = job && !tags.includes(job.tag) ? [...tags, job.tag] : tags;
  sel.innerHTML = list.map((t) => `<option>${esc(t)}</option>`).join('');
  if (v) sel.value = v;
}
function renderJobSelect() {
  const sorted = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  $('#jobSelect').innerHTML = sorted.length
    ? sorted.map((j) => `<option value="${esc(j.id)}">${esc(j.tag)} · ${esc(STATUS_LABEL[j.status] || j.status)} · ${esc(fmt(j.createdAt))}</option>`).join('')
    : '<option value="">— Sin expedientes —</option>';
  if (job) setVal('#jobSelect', job.id);
}
function renderChecklist(container, k, locked) {
  $(container).innerHTML = CHECKS[k].map((it) => {
    const a = answer(k, it.id);
    const v = a && !a.stale ? a.v : '';
    const meta = a ? (a.stale ? '<em class="stale">Re-verificar tras nueva liberación</em>' : `<em>${esc(a.by)} · ${esc(fmtTime(a.at))}</em>`) : '';
    return `<div class="checkrow ${v === 'NO' ? 'is-no' : v === 'OK' ? 'is-ok' : ''}">
      <div><b>${esc(it.t)}</b>${it.c ? '<small>CRÍTICO</small>' : ''}${meta}</div>
      <select data-check="${k}" data-id="${it.id}" ${locked ? 'disabled' : ''}>
        <option value="">Pendiente</option><option value="OK">OK</option><option value="NO">NO OK</option>${naAllowed(k, it) || v === 'NA' ? '<option value="NA">N/A</option>' : ''}
      </select></div>`;
  }).join('');
  $$(`${container} select`).forEach((s) => {
    const a = answer(k, s.dataset.id);
    s.value = a && !a.stale ? a.v : '';
  });
}
function paramForm(prefix) {
  const fields = PARAMS.map((p) => `<label>${esc(p.t)}
      <div class="inline"><input id="${prefix}-${p.k}" type="number" step="any" inputmode="decimal">
      <select id="${prefix}-${p.k}-u" class="unit" data-unit="${p.k}">${p.u.map((u) => `<option>${esc(u)}</option>`).join('')}</select></div></label>`).join('');
  return fields + `
    <label>Condición del sello<select id="${prefix}-seal"><option value="">—</option><option value="SIN_FUGA">Sin fuga</option><option value="FUGA">Fuga / goteo</option></select></label>
    <label>Ruido<select id="${prefix}-noise"><option value="">—</option><option value="NORMAL">Normal</option><option value="ANORMAL">Anormal</option></select></label>
    <label class="span2">Observación<input id="${prefix}-obs"></label>
    <p id="${prefix}-dp" class="dp span2 muted">ΔP: —</p>`;
}
function updateDp(prefix) {
  const ps = num($(`#${prefix}-ps`).value), pd = num($(`#${prefix}-pd`).value);
  const el = $(`#${prefix}-dp`);
  const warn = pd !== null && outOfRef(pd, job.units.pd, dischargeRef()) ? ` · ⚠ Descarga fuera de referencia (${dischargeRef().min}–${dischargeRef().max} psig)` : '';
  el.classList.toggle('red', !!warn);
  if (ps === null || pd === null) { el.textContent = 'ΔP: ingrese succión y descarga' + warn; return; }
  if (job.units.ps !== job.units.pd) { el.textContent = 'ΔP no calculado: succión y descarga en unidades distintas' + warn; return; }
  el.textContent = `ΔP calculada: ${+(pd - ps).toFixed(3)} ${job.units.pd}${warn}`;
}

function renderMilestones() {
  const items = job.milestones.map((m) => {
    const old = m.at < releaseAt() ? ' <em class="stale">(previo a la liberación vigente)</em>' : '';
    return `<div><b>${esc(fmt(m.at))}</b> · ${esc(MILESTONES[m.code] || m.code)} · ${esc(m.by)}${m.obs ? ' · ' + esc(m.obs) : ''}${old}</div>`;
  });
  $('#milestoneList').innerHTML = items.length ? items.join('') : '<i>Sin hitos registrados.</i>';
  ['COOL_START', 'COOL_END', 'PURGE'].forEach((c) => {
    const b = $(`[data-milestone="${c}"]`);
    b.classList.toggle('done', !!milestone(c));
  });
}
const LEAK_LABEL = { CONFORME: '✓ SIN FUGA · CONFORME', FUGA: '✕ FUGA · NO CONFORME', RETORNO_MANT: '↩ Retornado a Mantenimiento', CORRECCION_OP: '🔧 Corrección operativa · pendiente re-test' };
function renderLeak() {
  const l = lastLeak();
  $('#leakResolution').classList.toggle('hidden', l?.result !== 'FUGA');
  $('#leakOk').disabled = l?.result === 'FUGA';
  $('#leakList').innerHTML = job.leakEvents.length
    ? job.leakEvents.map((e) => `<div class="${e.result === 'FUGA' ? 'red' : e.result === 'CONFORME' ? 'green' : ''}"><b>${esc(fmt(e.at))}</b> · ${esc(LEAK_LABEL[e.result])} · ${esc(e.by)}${e.obs ? ' · ' + esc(e.obs) : ''}</div>`).join('')
    : '<i>Sin pruebas registradas.</i>';
}
/* ---------- Ficha de equipo y criterios por TAG ----------
 * Los criterios solo se aplican si tienen fuente registrada (datasheet, manual, CBM, alarma/trip).
 * La aplicación no trae límites por defecto. */
const EQUIP_KEY = 'ppcEquipment';
let equipment = (() => { try { return JSON.parse(localStorage.getItem(EQUIP_KEY) || '{}'); } catch (e) { return {}; } })();
const eqOf = (tag) => equipment[tag] || { model: '', service: '', seal: '', motor: '', criteria: {} };
const CRIT_KEYS = ['vp', 'vm', 'temp', 'amps', 'ps', 'pd', 'flow', 'p52', 'l52'];
function evalParam(tag, k, v, u) {
  const c = eqOf(tag).criteria[k];
  if (!c || !c.source || v === null || v === undefined) return '';
  if (c.unit && c.unit !== u) return 'U';
  const n = num;
  if ((n(c.xMax) !== null && v > n(c.xMax)) || (n(c.xMin) !== null && v < n(c.xMin))) return 'X';
  if ((n(c.aMax) !== null && v > n(c.aMax)) || (n(c.aMin) !== null && v < n(c.aMin))) return 'A';
  return [c.aMin, c.aMax, c.xMin, c.xMax].some((x) => n(x) !== null) ? 'N' : '';
}
const EVAL_LABEL = { N: 'Normal', A: 'Alerta', X: 'Acción', U: 'Unidad distinta al criterio', '': 'Sin criterio configurado' };
const SERIES_COLOR = { ps: '#2563eb', pd: '#dc2626', dp: '#16a34a', flow: '#7c3aed', amps: '#ea580c', vp: '#0891b2', vm: '#9333ea', temp: '#b91c1c', p52: '#0d9488', l52: '#ca8a04' };
const TREND_GROUPS = [
  { id: 'press', t: 'Presiones y ΔP', keys: ['ps', 'pd', 'dp', 'p52'] },
  { id: 'vib', t: 'Vibraciones', keys: ['vp', 'vm'] },
  { id: 'temp', t: 'Temperatura de rodamiento', keys: ['temp'] },
  { id: 'amps', t: 'Corriente motor', keys: ['amps'] },
  { id: 'flow', t: 'Caudal', keys: ['flow'] },
  { id: 'l52', t: 'Nivel Plan 52', keys: ['l52'] },
];
const labelOf = (k) => (k === 'dp' ? 'ΔP' : PARAMS.find((p) => p.k === k)?.t || k);

function renderEquipSummary() {
  const e = eqOf(job.tag);
  const parts = [e.model && `Modelo: ${e.model}`, e.service && `Servicio: ${e.service}`, e.seal && `Sello: ${e.seal}`, e.motor && `Motor: ${e.motor}`].filter(Boolean);
  const nCrit = Object.values(e.criteria || {}).filter((c) => c.source).length;
  $('#equipSummary').innerHTML = (parts.length ? parts.map(esc).join(' · ') : '<i>Sin ficha de equipo configurada para este TAG.</i>')
    + ` · <b>${nCrit}</b> criterio/s de aceptación con fuente`;
}
function openEquipDialog() {
  const e = eqOf(job.tag);
  $('#eqTag').textContent = job.tag;
  ['model', 'service', 'seal', 'motor'].forEach((f) => ($(`#eq-${f}`).value = e[f] || ''));
  $('#eqCriteria').innerHTML = `<table><thead><tr><th>Parámetro</th><th>Unidad</th><th>Alerta mín</th><th>Alerta máx</th><th>Acción mín</th><th>Acción máx</th><th>Fuente *</th></tr></thead><tbody>${CRIT_KEYS.map((k) => {
    const p = PARAMS.find((x) => x.k === k), c = e.criteria?.[k] || {};
    const inp = (f) => `<input data-crit="${k}" data-f="${f}" type="number" step="any" inputmode="decimal" value="${esc(c[f] ?? '')}">`;
    return `<tr><td>${esc(p.t)}</td><td><select data-crit="${k}" data-f="unit" class="unit">${p.u.map((u) => `<option ${u === (c.unit || p.u[0]) ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></td><td>${inp('aMin')}</td><td>${inp('aMax')}</td><td>${inp('xMin')}</td><td>${inp('xMax')}</td><td><input data-crit="${k}" data-f="source" value="${esc(c.source || '')}" placeholder="Datasheet, manual, CBM, alarma/trip"></td></tr>`;
  }).join('')}</tbody></table>`;
  $('#eqError').textContent = '';
  $('#equipDialog').showModal();
}
async function saveEquip(ev) {
  ev.preventDefault();
  if (!requireUser()) return;
  const e = { model: $('#eq-model').value.trim(), service: $('#eq-service').value.trim(), seal: $('#eq-seal').value.trim(), motor: $('#eq-motor').value.trim(), criteria: {}, updatedAt: nowISO(), updatedBy: currentUser() };
  const errs = [];
  CRIT_KEYS.forEach((k) => {
    const c = {};
    $$(`[data-crit="${k}"]`).forEach((el) => (c[el.dataset.f] = el.value.trim()));
    const hasLimit = ['aMin', 'aMax', 'xMin', 'xMax'].some((f) => num(c[f]) !== null);
    if (hasLimit && !c.source) errs.push(labelOf(k));
    if (num(c.aMax) !== null && num(c.xMax) !== null && num(c.xMax) < num(c.aMax)) errs.push(`${labelOf(k)} (acción máx menor que alerta máx)`);
    if (hasLimit || c.source) e.criteria[k] = c;
  });
  if (errs.length) { $('#eqError').textContent = `Revise: ${errs.join(', ')}. Todo límite requiere fuente.`; return; }
  equipment[job.tag] = e;
  localStorage.setItem(EQUIP_KEY, JSON.stringify(equipment));
  $('#equipDialog').close();
  await commit('Ficha de equipo / criterios actualizados', `${job.tag} · ${Object.keys(e.criteria).length} criterio/s`);
}

function renderKpis(sel) {
  const last = {};
  job.measurements.forEach((m) => {
    Object.entries(m.values).forEach(([k, v]) => (last[k] = { v, u: m.units[k], at: m.at, ev: m.eval?.[k] ?? evalParam(job.tag, k, v, m.units[k]) }));
    if (m.dp !== null) last.dp = { v: m.dp, u: m.dpUnit, at: m.at, ev: '' };
  });
  const keys = ['ps', 'pd', 'dp', 'flow', 'amps', 'vp', 'vm', 'temp', 'p52', 'l52'];
  $(sel).innerHTML = keys.map((k) => {
    const x = last[k];
    const cls = x ? { N: 'k-ok', A: 'k-alert', X: 'k-action', U: 'k-unit' }[x.ev] || '' : 'k-empty';
    return `<div class="kpi ${cls}" style="--c:${SERIES_COLOR[k]}" title="${x ? esc(EVAL_LABEL[x.ev]) : 'Sin medición'}"><span>${esc(labelOf(k))}</span><b>${x ? esc(x.v) : '—'}</b><small>${x ? esc(x.u) + ' · ' + esc(fmtTime(x.at)) : 'sin dato'}</small></div>`;
  }).join('');
}

function renderMeasureTable() {
  const rows = job.measurements;
  if (!rows.length) { $('#measureTable').innerHTML = '<i>Sin mediciones registradas.</i>'; return; }
  const head = ['Hora', 'Etapa', ...PARAMS.map((p) => p.t), 'ΔP', 'Sello', 'Ruido', 'Usuario'];
  const body = rows.map((m) => {
    const pdOut = m.values.pd !== undefined && outOfRef(m.values.pd, m.units.pd, dischargeRef());
    const evs = m.eval || {};
    const cells = PARAMS.map((p) => {
      if (m.values[p.k] === undefined) return '<td></td>';
      const ev = evs[p.k] ?? '';
      const cls = { A: 'c-alert', X: 'c-action' }[ev] || '';
      return `<td class="${cls}" title="${esc(EVAL_LABEL[ev])}">${m.values[p.k]} ${esc(m.units[p.k])}${p.k === 'pd' && pdOut ? ' ⚠' : ''}</td>`;
    });
    const alert = m.seal === 'FUGA' || m.noise === 'ANORMAL' || pdOut || Object.values(evs).includes('X');
    return `<tr class="${alert ? 'row-alert' : ''}"><td>${esc(fmtTime(m.at))}</td><td>${m.stage === 'ARRANQUE' ? 'Arranque' : 'Estab.'}</td>${cells.join('')}<td>${m.dp !== null ? `${m.dp} ${esc(m.dpUnit)}` : ''}</td><td>${m.seal === 'FUGA' ? 'Fuga' : m.seal === 'SIN_FUGA' ? 'OK' : ''}</td><td>${m.noise === 'ANORMAL' ? 'Anormal' : m.noise === 'NORMAL' ? 'Normal' : ''}</td><td>${esc(m.by)}</td></tr>`;
  }).join('');
  $('#measureTable').innerHTML = `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
}

/* Fases del arranque derivadas de los hitos registrados. */
function phases() {
  const T = (iso) => (iso ? new Date(iso).getTime() : null);
  const leakOk = job.leakEvents.filter((e) => e.result === 'CONFORME').at(-1);
  const firstStab = job.measurements.find((m) => m.stage === 'ESTABILIZACION');
  const pts = [
    ['Enfriamiento', T(milestone('COOL_START')?.at), T(milestone('COOL_END')?.at)],
    ['Purga', T(milestone('COOL_END')?.at), T(milestone('PURGE')?.at)],
    ['Leak Test', T(milestone('PURGE')?.at || releaseAt()), T(leakOk?.at)],
    ['Habilitación', T(leakOk?.at), T(milestone('START')?.at)],
    ['Arranque', T(milestone('START')?.at), T(firstStab?.at)],
    ['Estabilización', T(firstStab?.at), T(job.closure?.at) || Date.now()],
  ];
  return pts.filter(([, a, b]) => a !== null && b !== null && b > a).map(([label, a, b]) => ({ label, a, b }));
}
const BAND_COLOR = { Enfriamiento: '#dbeafe', Purga: '#dcfce7', 'Leak Test': '#fef3c7', 'Habilitación': '#ede9fe', Arranque: '#fee2e2', 'Estabilización': '#d1fae5' };

function renderTrend() {
  const g = TREND_GROUPS.find((x) => x.id === $('#trendGroup').value) || TREND_GROUPS[0];
  const series = g.keys.map((k) => {
    const raw = job.measurements.filter((m) => (k === 'dp' ? m.dp !== null : m.values[k] !== undefined))
      .map((m) => ({ t: new Date(m.at).getTime(), v: k === 'dp' ? m.dp : m.values[k], u: k === 'dp' ? m.dpUnit : m.units[k] }));
    return { k, raw };
  }).filter((s) => s.raw.length);
  if (!series.length) {
    $('#trend').innerHTML = '<div class="empty-chart">Sin datos para este grupo.<br><small>Registre mediciones para construir la tendencia.</small></div>';
    return;
  }
  // Una sola unidad por gráfico: la de la medición más reciente del grupo.
  const unit = series.flatMap((s) => s.raw).sort((a, b) => a.t - b.t).at(-1).u;
  series.forEach((s) => (s.pts = s.raw.filter((p) => p.u === unit)));
  const omitted = series.reduce((n, s) => n + s.raw.length - s.pts.length, 0);
  const shown = series.filter((s) => s.pts.length);
  const bands = phases();
  const crit = shown.map((s) => ({ k: s.k, c: eqOf(job.tag).criteria?.[s.k] })).filter((x) => x.c?.source && (!x.c.unit || x.c.unit === unit));
  const W = 760, H = 320, L = 56, R = 16, T = 30, B = 36;
  const all = shown.flatMap((s) => s.pts);
  const ts = [...all.map((p) => p.t), ...bands.flatMap((b) => [b.a, b.b])];
  let t0 = Math.min(...ts), t1 = Math.max(...ts);
  if (t1 - t0 < 60000) { t0 -= 30000; t1 += 30000; }
  const limVals = crit.flatMap((x) => ['aMax', 'xMax', 'aMin', 'xMin'].map((f) => num(x.c[f])).filter((v) => v !== null));
  let v0 = Math.min(...all.map((p) => p.v), ...limVals), v1 = Math.max(...all.map((p) => p.v), ...limVals);
  if (v1 === v0) { v0 -= Math.abs(v0) * 0.1 || 1; v1 += Math.abs(v1) * 0.1 || 1; }
  const pad = (v1 - v0) * 0.08; v0 -= pad; v1 += pad;
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (v) => T + (1 - (v - v0) / (v1 - v0)) * (H - T - B);
  const bandSvg = bands.map((b) => {
    const xa = x(b.a), xb = x(b.b), w = Math.max(1, xb - xa);
    const lbl = w > b.label.length * 6.2 ? `<text x="${xa + w / 2}" y="${T - 10}" text-anchor="middle" class="bandlabel">${esc(b.label)}</text>` : '';
    return `<rect x="${xa}" y="${T}" width="${w}" height="${H - T - B}" fill="${BAND_COLOR[b.label]}" opacity=".7"><title>${esc(b.label)}</title></rect>${lbl}`;
  }).join('');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => v0 + f * (v1 - v0));
  const grid = ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="axis">${+v.toPrecision(4)}</text>`).join('');
  const lim = crit.flatMap(({ k, c }) => [['aMax', 'Alerta'], ['xMax', 'Acción'], ['aMin', 'Alerta mín'], ['xMin', 'Acción mín']]
    .filter(([f]) => num(c[f]) !== null)
    .map(([f, t]) => `<line x1="${L}" x2="${W - R}" y1="${y(num(c[f]))}" y2="${y(num(c[f]))}" class="${f[0] === 'x' ? 'lim-x' : 'lim-a'}"/><text x="${W - R - 2}" y="${y(num(c[f])) - 3}" text-anchor="end" class="limlabel">${esc(t)} ${esc(labelOf(k))} ${num(c[f])}</text>`)).join('');
  const lines = shown.map((s) => {
    const d = s.pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    const dots = s.pts.map((p) => `<circle cx="${x(p.t)}" cy="${y(p.v)}" r="3.5" fill="${SERIES_COLOR[s.k]}" class="dot"><title>${esc(labelOf(s.k))} · ${esc(fmt(new Date(p.t).toISOString()))}: ${p.v} ${esc(p.u)}</title></circle>`).join('');
    return `<path d="${d}" stroke="${SERIES_COLOR[s.k]}" class="line"/>${dots}`;
  }).join('');
  const xl = `<text x="${L}" y="${H - 10}" class="axis">${esc(fmtTime(new Date(t0).toISOString()))}</text><text x="${W - R}" y="${H - 10}" text-anchor="end" class="axis">${esc(fmtTime(new Date(t1).toISOString()))}</text>`;
  const legend = `<div class="legend">${shown.map((s) => `<span><i style="background:${SERIES_COLOR[s.k]}"></i>${esc(labelOf(s.k))}</span>`).join('')}${crit.length ? '<span><i class="lg-a"></i>Alerta</span><span><i class="lg-x"></i>Acción</span>' : '<span class="muted">Sin criterios con fuente para este grupo</span>'}</div>`;
  const note = omitted ? `<p class="muted">Se grafican solo los puntos en ${esc(unit)}; ${omitted} punto/s en otra unidad omitidos.</p>` : '';
  $('#trend').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tendencia ${esc(g.t)}">${bandSvg}${grid}${lim}${lines}${xl}<text x="${L}" y="${T + 12}" class="axis">${esc(unit)}</text></svg>${legend}${note}`;
}

function renderLog() {
  const items = [...job.audit].reverse();
  $('#log').innerHTML = items.length ? items.map((a) => `<div><b>${esc(fmt(a.at))}</b> · ${esc(a.by || '—')} · ${esc(a.action)}${a.detail ? ' · ' + esc(a.detail) : ''}</div>`).join('') : '<i>Sin registros todavía.</i>';
}

function render() {
  document.body.classList.toggle('no-job', !job);
  renderJobSelect();
  if (!job) return;
  renderTags();
  const g = gates();
  const isClosed = closed();
  const lockedAfterStart = !!job.startAuth;

  $('#jobId').textContent = `Expediente ${job.id.slice(0, 8).toUpperCase()}`;
  $('#jobStatus').textContent = STATUS_LABEL[job.status] || job.status;
  $('#jobStatus').className = `pill st-${job.status}`;
  if (!$('#savedAt').textContent) $('#savedAt').textContent = `Actualizado ${fmtTime(job.updatedAt)}`;

  // Identificación
  setVal('#tag', job.tag);
  setVal('#area', job.area);
  setVal('#reason', job.reason);
  setVal('#ot', job.ot);
  setVal('#pssr', job.pssr);
  ['#tag', '#addTag', '#area', '#reason', '#ot', '#torqueRef'].forEach((s) => ($(s).disabled = isClosed || released()));
  $('#pssr').disabled = isClosed || lockedAfterStart;

  // Personas
  setVal('#pMaint', job.people.maint);
  setVal('#pQa', job.people.qa);
  setVal('#pOperator', job.people.operator);
  setVal('#pOps', job.people.ops);
  setVal('#maintenanceObs', job.maintenanceObs);
  setVal('#torqueRef', job.torqueRef);

  // Referencias del procedimiento
  const dref = dischargeRef();
  $$('.proc-code').forEach((e) => (e.textContent = `${PROC.code} v${PROC.version} · ${PROC.title}`));
  $('#refDischarge').textContent = dref ? dref.text : 'Seleccione el Área / CRIO para mostrar la presión de descarga de referencia.';
  $('#refBarrier').textContent = `${PROC.barrier.text}. ${PROC.propanol}.`;
  const sp = num(job.plan52.pressure);
  $('#sealPressureWarn').textContent = sp !== null && outOfRef(sp, job.plan52.pressureUnit, PROC.barrier)
    ? `⚠ Fuera de la referencia del procedimiento (${PROC.barrier.min}–${PROC.barrier.max} psig). Evaluar antes de continuar.` : '';

  // Etapa 1
  renderChecklist('#maintenanceChecklist', 'm', isClosed || released());
  const rel = job.maintenanceRelease;
  $('#maintenanceResult').innerHTML = !rel && gateMsg.m ? gateMsg.m : rel
    ? `<b class="green">MANTENIMIENTO LIBERADO · ${esc(fmt(rel.at))} · ${esc(rel.by)} (Sup.: ${esc(rel.supervisor)} · QA/QC: ${esc(rel.qa)})</b>`
    : job.releaseHistory.length
      ? `<b class="red">Liberación revocada ${esc(fmt(job.releaseHistory.at(-1).revokedAt))}: ${esc(job.releaseHistory.at(-1).revokeReasonText)}</b>`
      : '';
  $('#reopenMaintenance').classList.toggle('hidden', !rel || isClosed || lockedAfterStart);

  // Etapa 2
  $('#releaseReceived').innerHTML = rel ? `✔ Liberación de Mantenimiento recibida: ${esc(fmt(rel.at))} · ${esc(rel.by)}` : '✖ Sin liberación de Mantenimiento vigente.';
  renderChecklist('#operationsChecklist', 'o', isClosed || lockedAfterStart || !released());

  // Etapa 3
  const p52 = job.plan52;
  $('#plan52Applicable').checked = p52.applicable;
  $('#plan52JustWrap').classList.toggle('hidden', p52.applicable);
  setVal('#plan52Justification', p52.justification);
  $('#plan52Body').classList.toggle('dimmed', !p52.applicable);
  renderChecklist('#plan52Checklist', 'p', isClosed || lockedAfterStart || !p52.applicable || !released());
  setVal('#sealPressure', p52.pressure);
  setVal('#sealPressureUnit', p52.pressureUnit);
  setVal('#sealLevel', p52.level);
  setVal('#sealLevelUnit', p52.levelUnit);
  const sb = p52.standby;
  setVal('#sb0', sb.l0?.v ?? '');
  setVal('#sb1', sb.l1?.v ?? '');
  $('#sb0At').textContent = sb.l0 ? `${fmt(sb.l0.at)} · ${sb.l0.by}` : '';
  $('#sb1At').textContent = sb.l1 ? `${fmt(sb.l1.at)} · ${sb.l1.by}` : '';
  setVal('#sbResult', sb.result);
  $('#sbSummary').textContent = sb.l0 && sb.l1
    ? `Variación: ${+(sb.l1.v - sb.l0.v).toFixed(3)} ${p52.levelUnit} en ${Math.round((new Date(sb.l1.at) - new Date(sb.l0.at)) / 60000)} min. El criterio de aceptación lo define el procedimiento vigente.`
    : '';

  // Etapa 4 y 5
  setVal('#coolInitial', job.cooling.initial);
  $('#purgeSteps').classList.toggle('dimmed', job.cooling.initial === 'ADECUADO');
  renderChecklist('#coolingChecklist', 'c', isClosed || lockedAfterStart || !released() || !job.cooling.initial);
  renderChecklist('#preStartChecklist', 'sa', isClosed || !!job.startAuth || !released());
  renderChecklist('#postStartChecklist', 'sb', isClosed || !milestone('START'));
  renderMilestones();
  renderLeak();

  // Etapa 6
  $('#authorizeStart').disabled = !!job.startAuth;
  $('#startDone').disabled = !job.startAuth || !!milestone('START');
  $('#startResult').innerHTML = [
    !job.startAuth ? gateMsg.s : '',
    job.startAuth ? `<b class="green">HABILITADO DOCUMENTALMENTE · ${esc(fmt(job.startAuth.at))} · ${esc(job.startAuth.by)}</b>` : '',
    milestone('START') ? `<br><b>Arranque ejecutado · ${esc(fmt(milestone('START').at))} · ${esc(milestone('START').by)}</b>` : '',
  ].join('');
  PARAMS.forEach((p) => ['a', 's'].forEach((pre) => ($(`#${pre}-${p.k}-u`).value = job.units[p.k])));
  updateDp('a');
  updateDp('s');

  // Etapa 7
  renderEquipSummary();
  renderKpis('#kpiStart');
  renderKpis('#kpiStab');
  renderMeasureTable();
  renderTrend();
  if (job.closure) {
    setVal('#closeResult', job.closure.result);
    setVal('#closeObs', job.closure.obs);
    $('#closeMsg').innerHTML = `<b class="${job.closure.result === 'ESTABLE' ? 'green' : 'red'}">EXPEDIENTE CERRADO · ${job.closure.result === 'ESTABLE' ? 'EQUIPO ESTABLE' : 'REQUIERE EVALUACIÓN'} · ${esc(fmt(job.closure.at))} · ${esc(job.closure.by)}</b>`;
  } else {
    $('#closeMsg').innerHTML = '';
  }
  renderLog();

  // Bloqueo por etapa
  const stageLocked = [released(), lockedAfterStart, lockedAfterStart, lockedAfterStart, lockedAfterStart, false, false];
  for (let n = 0; n < 7; n++) {
    const unlocked = stageUnlocked(n, g);
    $$(`[data-fs="${n}"]`).forEach((fs) => (fs.disabled = isClosed || !unlocked || stageLocked[n]));
    const lm = $(`[data-lock="${n}"]`);
    if (isClosed) lm.innerHTML = '🔒 Expediente cerrado: solo lectura.';
    else if (!unlocked) lm.innerHTML = `🔒 Etapa bloqueada. Pendiente: ${g[n - 1].map(esc).join(' · ')}`;
    else if (stageLocked[n]) lm.innerHTML = n === 0 ? '🔒 Mantenimiento liberado: checklist congelado.' : '🔒 Arranque autorizado: etapa congelada.';
    else lm.innerHTML = '';
    lm.classList.toggle('show', !!lm.innerHTML);
  }
  const canMeasure = !!job.startAuth && !isClosed;
  $('[data-fs="m5"]').disabled = !canMeasure;
  $('[data-fs="m6"]').disabled = !canMeasure || !milestone('START');

  // Pasos
  $$('[data-stage]').forEach((b) => {
    const n = Number(b.dataset.stage);
    b.classList.toggle('active', n === currentStage);
    b.classList.toggle('locked', !stageUnlocked(n, g));
    b.classList.toggle('passed', n < 6 ? g[n].length === 0 : isClosed);
  });

  // Estado global y bloqueantes
  const crit = criticalBlockers();
  const el = $('#globalStatus');
  if (isClosed) {
    el.className = `banner ${job.closure.result === 'ESTABLE' ? 'good' : 'bad'}`;
    el.textContent = job.closure.result === 'ESTABLE' ? 'CERRADO · EQUIPO ESTABLE' : 'CERRADO · REQUIERE EVALUACIÓN';
  } else if (crit.length) {
    el.className = 'banner bad';
    el.textContent = 'NO HABILITADO · BLOQUEANTE';
  } else if (g[4].length === 0) {
    el.className = 'banner good';
    el.textContent = job.startAuth ? 'ARRANQUE HABILITADO DOCUMENTALMENTE' : 'CONDICIONES PREVIAS CONFORMES';
  } else {
    el.className = 'banner warn';
    el.textContent = 'VERIFICACIÓN INCOMPLETA';
  }
  const nextGate = g.find((x) => x.length) || [];
  const list = [...crit.map((c) => `<li class="red">⛔ ${esc(c)}</li>`), ...(isClosed ? [] : nextGate.filter((x) => !crit.includes(x)).slice(0, 6).map((x) => `<li>• ${esc(x)}</li>`))];
  $('#blockers').innerHTML = list.length ? `<ul>${list.join('')}</ul>` : '';

  // Navegación
  $('#stageTitle').textContent = TITLES[currentStage];
  $('#stageCounter').textContent = `Etapa ${currentStage + 1} de 7`;
  $('#prevStage').disabled = currentStage === 0;
  $('#nextStage').disabled = currentStage === 6 || !stageUnlocked(currentStage + 1, g);
  $('#nextStage').classList.toggle('hidden', currentStage === 6);
}

function showStage(n) {
  currentStage = Math.max(0, Math.min(6, n));
  $$('.stage').forEach((s) => s.classList.toggle('active-stage', Number(s.dataset.panel) === currentStage));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Acciones ---------- */
async function loadJob(id) {
  job = jobs.find((j) => j.id === id) || null;
  gateMsg = { m: '', s: '' };
  if (job) localStorage.setItem('ppcCurrentJob', job.id);
  $('#savedAt').textContent = '';
  const g = job ? gates() : [];
  let s = 0;
  while (job && s < 6 && stageUnlocked(s + 1, g)) s++;
  showStage(job ? s : 0);
}

$('#newJob').onclick = async () => {
  if (!requireUser()) return;
  job = blankJob();
  gateMsg = { m: '', s: '' };
  jobs.push(job);
  localStorage.setItem('ppcCurrentJob', job.id);
  $('#savedAt').textContent = '';
  await commit('Nueva intervención', `${job.tag} · ${job.reason}`);
  showStage(0);
  flash('Expediente nuevo creado. Complete la identificación y el checklist de Mantenimiento.', 'good');
};
$('#jobSelect').onchange = (e) => e.target.value && loadJob(e.target.value);

setVal('#user', currentUser());
$('#user').addEventListener('change', (e) => {
  localStorage.setItem('ppcUser', e.target.value.trim());
  flash(e.target.value.trim() ? `Usuario en turno: ${e.target.value.trim()}` : 'Usuario vacío.', e.target.value.trim() ? 'good' : 'bad');
});

// Identificación y responsables
const FIELD_MAP = {
  '#tag': ['tag', 'TAG'], '#area': ['area', 'Área'], '#reason': ['reason', 'Motivo'], '#ot': ['ot', 'OT/SAP'], '#pssr': ['pssr', 'PSSR'],
  '#maintenanceObs': ['maintenanceObs', 'Observación Mantenimiento'],
  '#torqueRef': ['torqueRef', 'Referencia protocolo de torque'],
};
$('#coolInitial').addEventListener('change', async (e) => {
  if (!job || !requireUser()) { document.activeElement?.blur(); return render(); }
  job.cooling.initial = e.target.value;
  // Al declarar enfriamiento no adecuado, los N/A previos de purga dejan de ser válidos.
  await commit('Condición inicial de enfriamiento en S/B', e.target.selectedOptions[0].text);
});
Object.entries(FIELD_MAP).forEach(([sel, [key, label]]) => {
  $(sel).addEventListener('change', async (e) => {
    if (!job || !requireUser()) { document.activeElement?.blur(); return render(); }
    job[key] = e.target.value.trim();
    await commit(`${label} actualizado`, job[key]);
  });
});
const PEOPLE_MAP = { '#pMaint': ['maint', 'Supervisor Mantenimiento'], '#pQa': ['qa', 'QA/QC'], '#pOperator': ['operator', 'Operador'], '#pOps': ['ops', 'Supervisor Operaciones'] };
Object.entries(PEOPLE_MAP).forEach(([sel, [key, label]]) => {
  $(sel).addEventListener('change', async (e) => {
    if (!job || !requireUser()) { document.activeElement?.blur(); return render(); }
    job.people[key] = e.target.value.trim();
    await commit(`${label} registrado`, job.people[key]);
  });
});

// Checklists
document.addEventListener('change', async (e) => {
  const s = e.target;
  if (!s.matches('[data-check]') || !job) return;
  if (!requireUser()) { document.activeElement?.blur(); return render(); }
  const k = s.dataset.check, id = s.dataset.id;
  const it = CHECKS[k].find((x) => x.id === id);
  if (s.value) job.checks[k][id] = { v: s.value, by: currentUser(), at: nowISO() };
  else delete job.checks[k][id];
  await commit(`${it.t}`, s.value || 'Pendiente');
  if (s.value === 'NO' && it.c) flash(`Punto crítico NO OK: “${it.t}”. Bloquea el avance.`, 'bad');
});

// Gate 1 — Liberación de Mantenimiento
$('#releaseMaintenance').onclick = async () => {
  if (!requireUser()) return;
  const m = checkState('m');
  const missing = [];
  if (!job.ot) missing.push('OT/SAP');
  if (!job.torqueRef) missing.push('referencia del protocolo de torque (FORM-TORQ) o “No aplica”');
  if (!job.people.maint) missing.push('Supervisor de Mantenimiento');
  if (!job.people.qa) missing.push('QA/QC');
  if (m.criticalNo.length) missing.push(`puntos críticos NO OK (${m.criticalNo.length})`);
  if (m.pending.length) missing.push(`puntos pendientes (${m.pending.length})`);
  if (m.nonCriticalNo.length) missing.push('puntos NO OK no críticos: márquelos N/A u OK');
  if (missing.length) {
    gateMsg.m = `<b class="red">MANTENIMIENTO NO LIBERADO · Falta: ${esc(missing.join(', '))}</b>`;
    job.audit.push({ at: nowISO(), by: currentUser(), action: 'Gate Mantenimiento: NO LIBERADO', detail: missing.join(', ') });
    await commit('Intento de liberación rechazado');
    return;
  }
  gateMsg.m = '';
  job.maintenanceRelease = { at: nowISO(), by: currentUser(), supervisor: job.people.maint, qa: job.people.qa, revision: job.revision };
  await commit('Gate Mantenimiento: LIBERADO', `Sup. ${job.people.maint} · QA/QC ${job.people.qa}`);
  flash('Mantenimiento liberado. Operaciones puede iniciar su preparación.', 'good');
};
$('#reopenMaintenance').onclick = async () => {
  if (!requireUser()) return;
  const reason = window.prompt('Motivo de la revocación de la liberación (obligatorio):');
  if (!reason || !reason.trim()) return flash('Revocación cancelada: el motivo es obligatorio.', 'warn');
  revokeRelease('MANUAL', reason.trim());
  await commit('Liberación de Mantenimiento REVOCADA', reason.trim());
  showStage(0);
};
function revokeRelease(kind, text) {
  job.releaseHistory.push({ ...job.maintenanceRelease, revokedAt: nowISO(), revokedBy: currentUser(), revokedReason: kind, revokeReasonText: text });
  job.maintenanceRelease = null;
  job.cooling.initial = '';
}

// Plan 52
$('#plan52Applicable').onchange = async (e) => {
  if (!requireUser()) { document.activeElement?.blur(); return render(); }
  job.plan52.applicable = e.target.checked;
  await commit(`Plan 52: ${e.target.checked ? 'APLICA' : 'NO APLICA'}`);
  if (!e.target.checked) $('#plan52Justification').focus();
};
$('#plan52Justification').addEventListener('change', async (e) => {
  if (!requireUser()) { document.activeElement?.blur(); return render(); }
  job.plan52.justification = e.target.value.trim();
  await commit('Justificación Plan 52 NO aplica', job.plan52.justification);
});
[['#sealPressure', 'pressure', 'Presión inicial Plan 52'], ['#sealPressureUnit', 'pressureUnit', 'Unidad presión Plan 52'], ['#sealLevel', 'level', 'Nivel inicial Plan 52'], ['#sealLevelUnit', 'levelUnit', 'Unidad nivel Plan 52']].forEach(([sel, key, label]) => {
  $(sel).addEventListener('change', async (e) => {
    if (!requireUser()) { document.activeElement?.blur(); return render(); }
    job.plan52[key] = e.target.value;
    const unit = key === 'pressure' ? ' ' + job.plan52.pressureUnit : key === 'level' ? ' ' + job.plan52.levelUnit : '';
    await commit(label, e.target.value + unit);
  });
});
[['#sb0Btn', '#sb0', 'l0', 'inicial'], ['#sb1Btn', '#sb1', 'l1', 'final']].forEach(([btn, inp, key, label]) => {
  $(btn).onclick = async () => {
    if (!requireUser()) return;
    const v = num($(inp).value);
    if (v === null) return flash(`Ingrese el nivel ${label} de stand-by.`, 'warn');
    if (key === 'l1' && !job.plan52.standby.l0) return flash('Registre primero el nivel inicial de stand-by.', 'warn');
    job.plan52.standby[key] = { v, at: nowISO(), by: currentUser() };
    await commit(`Stand-by: nivel ${label}`, `${v} ${job.plan52.levelUnit}`);
  };
});
$('#sbResult').onchange = async (e) => {
  if (!requireUser()) { document.activeElement?.blur(); return render(); }
  if (e.target.value && !(job.plan52.standby.l0 && job.plan52.standby.l1)) {
    flash('Registre nivel inicial y final antes de concluir la prueba de stand-by.', 'warn');
    return render();
  }
  job.plan52.standby.result = e.target.value;
  await commit('Prueba de consumo de buffer en stand-by', e.target.selectedOptions[0].text);
};

// Hitos de enfriamiento
$$('[data-milestone]').forEach((b) => {
  b.onclick = async () => {
    if (!requireUser()) return;
    const code = b.dataset.milestone;
    if (code === 'COOL_END' && !milestone('COOL_START')) return flash('Registre primero el inicio de enfriamiento.', 'warn');
    if (code === 'PURGE' && !milestone('COOL_END')) return flash('Registre primero el fin de enfriamiento.', 'warn');
    if (milestone(code) && !window.confirm(`“${MILESTONES[code]}” ya está registrado. ¿Registrar de nuevo?`)) return;
    const obs = $('#milestoneObs').value.trim();
    job.milestones.push({ code, at: nowISO(), by: currentUser(), obs });
    $('#milestoneObs').value = '';
    await commit(`Hito: ${MILESTONES[code]}`, obs);
  };
});

// Leak Test
$('#leakOk').onclick = async () => {
  if (!requireUser()) return;
  if (lastLeak()?.result === 'FUGA') return flash('Hay una fuga sin resolución registrada.', 'bad');
  job.leakEvents.push({ result: 'CONFORME', at: nowISO(), by: currentUser(), obs: $('#leakObs').value.trim() });
  $('#leakObs').value = '';
  await commit('Leak Test: SIN FUGA / CONFORME');
};
$('#leakBad').onclick = async () => {
  if (!requireUser()) return;
  const obs = $('#leakObs').value.trim();
  if (!obs) { $('#leakObs').focus(); return flash('Registre la ubicación/observación de la fuga.', 'bad'); }
  job.leakEvents.push({ result: 'FUGA', at: nowISO(), by: currentUser(), obs });
  $('#leakObs').value = '';
  await commit('Leak Test: FUGA / NO CONFORME', obs);
};
$('#leakReturn').onclick = async () => {
  if (!requireUser()) return;
  const obs = $('#leakResObs').value.trim();
  if (!obs) { $('#leakResObs').focus(); return flash('Describa la acción tomada.', 'bad'); }
  job.leakEvents.push({ result: 'RETORNO_MANT', at: nowISO(), by: currentUser(), obs });
  revokeRelease('LEAK', `Fuga en Leak Test: ${obs}`);
  $('#leakResObs').value = '';
  await commit('Retorno a Mantenimiento por fuga', obs);
  showStage(0);
  flash('Equipo retornado a Mantenimiento. Se requiere nueva liberación, re-verificación de Operaciones y nuevo Leak Test.', 'bad');
};
$('#leakCorrect').onclick = async () => {
  if (!requireUser()) return;
  const obs = $('#leakResObs').value.trim();
  if (!obs) { $('#leakResObs').focus(); return flash('Describa la corrección operativa realizada.', 'bad'); }
  job.leakEvents.push({ result: 'CORRECCION_OP', at: nowISO(), by: currentUser(), obs });
  $('#leakResObs').value = '';
  await commit('Corrección operativa tras fuga', obs);
  flash('Corrección registrada. Repita el Leak Test.', 'warn');
};

// Autorización y arranque
$('#authorizeStart').onclick = async () => {
  if (!requireUser()) return;
  const g = gates();
  const missing = [...g[4], ...criticalBlockers()];
  if (!job.pssr) missing.push('Registrar PSSR');
  const sa = checkState('sa');
  if (!sa.complete) missing.push('Completar pasos 4 a 6 y precauciones de arranque');
  if (missing.length) {
    gateMsg.s = `<b class="red">NO HABILITADO · ${esc([...new Set(missing)].join(' · '))}</b>`;
    job.audit.push({ at: nowISO(), by: currentUser(), action: 'Gate de arranque: NO HABILITADO', detail: [...new Set(missing)].join(' · ') });
    await commit('Intento de autorización rechazado');
    return;
  }
  gateMsg.s = '';
  job.startAuth = { at: nowISO(), by: currentUser(), ops: job.people.ops, revision: job.revision };
  await commit('Gate de arranque: HABILITADO DOCUMENTALMENTE', `Sup. Operaciones ${job.people.ops}`);
};
$('#startDone').onclick = async () => {
  if (!requireUser()) return;
  job.milestones.push({ code: 'START', at: nowISO(), by: currentUser(), obs: '' });
  await commit('Hito: Arranque ejecutado');
  flash('Arranque registrado. Registre parámetros y continúe con la estabilización.', 'good');
};

// Mediciones
$('#paramsStart').innerHTML = paramForm('a');
$('#paramsStab').innerHTML = paramForm('s');
$$('[data-unit]').forEach((sel) => {
  sel.addEventListener('change', async (e) => {
    if (!job) return;
    job.units[e.target.dataset.unit] = e.target.value;
    await commit('Unidad configurada', `${e.target.dataset.unit}: ${e.target.value}`);
  });
});
['a', 's'].forEach((pre) => ['ps', 'pd'].forEach((k) => $(`#${pre}-${k}`).addEventListener('input', () => job && updateDp(pre))));
$$('[data-save-measure]').forEach((b) => {
  b.onclick = async () => {
    if (!requireUser()) return;
    const stage = b.dataset.saveMeasure;
    const pre = stage === 'ARRANQUE' ? 'a' : 's';
    const values = {}, units = {};
    PARAMS.forEach((p) => {
      const v = num($(`#${pre}-${p.k}`).value);
      if (v !== null) { values[p.k] = v; units[p.k] = job.units[p.k]; }
    });
    if (!Object.keys(values).length) return flash('Ingrese al menos un parámetro.', 'warn');
    let dp = null, dpUnit = '';
    if (values.ps !== undefined && values.pd !== undefined && units.ps === units.pd) { dp = +(values.pd - values.ps).toFixed(3); dpUnit = units.pd; }
    const evalAt = Object.fromEntries(Object.keys(values).map((k) => [k, evalParam(job.tag, k, values[k], units[k])]));
    const rec = { id: uuid(), at: nowISO(), by: currentUser(), stage, values, units, eval: evalAt, criteriaRef: Object.fromEntries(Object.keys(values).map((k) => [k, eqOf(job.tag).criteria?.[k]?.source || ''])), dp, dpUnit, seal: $(`#${pre}-seal`).value, noise: $(`#${pre}-noise`).value, obs: $(`#${pre}-obs`).value.trim() };
    job.measurements.push(rec);
    PARAMS.forEach((p) => ($(`#${pre}-${p.k}`).value = ''));
    [`#${pre}-seal`, `#${pre}-noise`, `#${pre}-obs`].forEach((s) => ($(s).value = ''));
    await commit(`Medición (${stage === 'ARRANQUE' ? 'arranque' : 'estabilización'})`, Object.entries(values).map(([k, v]) => `${k}=${v} ${units[k]}`).join(', ') + (dp !== null ? `, ΔP=${dp} ${dpUnit}` : ''));
    const nX = Object.values(evalAt).filter((v) => v === 'X').length;
    const nA = Object.values(evalAt).filter((v) => v === 'A').length;
    if (nX) flash(`Medición en nivel de ACCIÓN según criterio configurado (${Object.entries(evalAt).filter(([, v]) => v === 'X').map(([k]) => labelOf(k)).join(', ')}).`, 'bad');
    else if (nA) flash(`Medición en nivel de ALERTA (${Object.entries(evalAt).filter(([, v]) => v === 'A').map(([k]) => labelOf(k)).join(', ')}).`, 'warn');
    else if (rec.seal === 'FUGA' || rec.noise === 'ANORMAL') flash('Medición con condición anormal registrada: evaluar antes de declarar el equipo estable.', 'bad');
  };
});
$('#trendGroup').innerHTML = TREND_GROUPS.map((g) => `<option value="${g.id}">${esc(g.t)}</option>`).join('');
$('#trendGroup').onchange = () => job && renderTrend();
$('#editEquip').onclick = () => job && openEquipDialog();
$('#eqSave').onclick = saveEquip;

// Cierre
$('#closeJob').onclick = async () => {
  if (!requireUser()) return;
  const result = $('#closeResult').value;
  const obs = $('#closeObs').value.trim();
  const stab = job.measurements.filter((m) => m.stage === 'ESTABILIZACION');
  const missing = [];
  if (!milestone('START')) missing.push('arranque ejecutado');
  if (!stab.length) missing.push('al menos una medición de estabilización');
  if (!checkState('sb').complete) missing.push('pasos 8 a 16 del procedimiento');
  if (!result) missing.push('resultado final');
  if (result === 'REQUIERE_EVALUACION' && !obs) missing.push('observación de cierre');
  const last = job.measurements.at(-1);
  if (result === 'ESTABLE' && last && (last.seal === 'FUGA' || last.noise === 'ANORMAL')) missing.push('la última medición reporta fuga o ruido anormal: no puede declararse ESTABLE');
  if (result === 'ESTABLE' && last && Object.values(last.eval || {}).includes('X')) missing.push('la última medición está en nivel de ACCIÓN: no puede declararse ESTABLE');
  if (missing.length) {
    $('#closeMsg').innerHTML = `<b class="red">No se puede cerrar · Falta: ${esc(missing.join(', '))}</b>`;
    return;
  }
  job.closure = { at: nowISO(), by: currentUser(), result, obs };
  await commit('Expediente CERRADO', `${result === 'ESTABLE' ? 'EQUIPO ESTABLE' : 'REQUIERE EVALUACIÓN'}${obs ? ' · ' + obs : ''}`);
  flash('Expediente cerrado. Queda en solo lectura.', 'good');
};
$('#exportJson').onclick = () => {
  if (!job) return;
  const blob = new Blob([JSON.stringify(job, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `expediente-${job.tag}-${job.createdAt.slice(0, 10)}-${job.id.slice(0, 8)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('#printReport').onclick = () => {
  if (!job) return;
  buildReport();
  window.print();
};
function buildReport() {
  const chk = (k) => CHECKS[k].map((it) => {
    const a = answer(k, it.id);
    const v = a && !a.stale ? a.v : 'Pendiente';
    return `<tr><td>${esc(it.t)}${it.c ? ' (crítico)' : ''}</td><td>${esc(v)}</td><td>${a ? esc(a.by) + ' · ' + esc(fmt(a.at)) : ''}</td></tr>`;
  }).join('');
  const p = job.people;
  $('#report').innerHTML = `
    <h1>Expediente de arranque · ${esc(job.tag)}</h1>
    <p>Expediente ${esc(job.id)} · Estado: ${esc(STATUS_LABEL[job.status])} · Generado ${esc(fmt(nowISO()))} · ${esc(APP_VERSION)}</p>
    <table><tr><td>Área</td><td>${esc(job.area)}</td><td>Motivo</td><td>${esc(job.reason)}</td></tr>
    <tr><td>OT/SAP</td><td>${esc(job.ot)}</td><td>PSSR</td><td>${esc(job.pssr)}</td></tr>
    <tr><td>Sup. Mantenimiento</td><td>${esc(p.maint)}</td><td>QA/QC</td><td>${esc(p.qa)}</td></tr>
    <tr><td>Operador</td><td>${esc(p.operator)}</td><td>Sup. Operaciones</td><td>${esc(p.ops)}</td></tr></table>
    <h2>Liberación de Mantenimiento</h2><table>${chk('m')}</table>
    <p>${job.maintenanceRelease ? `Liberado ${esc(fmt(job.maintenanceRelease.at))} por ${esc(job.maintenanceRelease.by)}` : 'Sin liberación vigente'} · Observación: ${esc(job.maintenanceObs)}</p>
    <h2>Preparación de Operaciones</h2><table>${chk('o')}</table>
    <h2>Plan 52</h2>${job.plan52.applicable ? `<table>${chk('p')}</table><p>Presión inicial: ${esc(job.plan52.pressure)} ${esc(job.plan52.pressureUnit)} · Nivel inicial: ${esc(job.plan52.level)} ${esc(job.plan52.levelUnit)} · Stand-by: ${esc($('#sbResult').selectedOptions[0]?.text || '')}</p>` : `<p>No aplica: ${esc(job.plan52.justification)}</p>`}
    <p>Equipo: ${esc([eqOf(job.tag).model, eqOf(job.tag).service, eqOf(job.tag).seal, eqOf(job.tag).motor].filter(Boolean).join(' · ') || 'sin ficha')} · Criterios: ${esc(Object.entries(eqOf(job.tag).criteria || {}).filter(([, c]) => c.source).map(([k, c]) => `${labelOf(k)} [A ${c.aMin || ''}–${c.aMax || ''} / X ${c.xMin || ''}–${c.xMax || ''} ${c.unit}; ${c.source}]`).join(' · ') || 'ninguno')}</p>
    <p>Procedimiento de referencia: ${esc(PROC.code)} v${esc(PROC.version)} · ${esc(PROC.title)} · Protocolo de torque: ${esc(job.torqueRef)}</p>
    <h2>Enfriamiento / purgas (Pasos 2–3)</h2><p>Condición inicial: ${esc(job.cooling.initial === 'ADECUADO' ? 'Enfriamiento adecuado' : job.cooling.initial === 'NO_ADECUADO' ? 'Enfriamiento no adecuado: purga ejecutada' : 'No declarada')}</p><table>${chk('c')}</table>
    <h2>Hitos</h2>${$('#milestoneList').innerHTML}
    <h2>Leak Test</h2>${$('#leakList').innerHTML}
    <h2>Pre-arranque (Pasos 4–6)</h2><table>${chk('sa')}</table>
    <h2>Arranque</h2><p>${job.startAuth ? `Habilitado documentalmente ${esc(fmt(job.startAuth.at))} por ${esc(job.startAuth.by)}` : 'Sin autorización'}</p>
    <h2>Post-arranque (Pasos 8–16)</h2><table>${chk('sb')}</table>
    <h2>Mediciones</h2>${$('#measureTable').innerHTML}
    <h2>Cierre</h2><p>${job.closure ? `${job.closure.result === 'ESTABLE' ? 'EQUIPO ESTABLE' : 'REQUIERE EVALUACIÓN'} · ${esc(fmt(job.closure.at))} · ${esc(job.closure.by)} · ${esc(job.closure.obs)}` : 'Expediente abierto'}</p>
    <h2>Auditoría</h2>${$('#log').innerHTML}
    <p class="sig">Firmas: ________________ Mantenimiento &nbsp; ________________ QA/QC &nbsp; ________________ Operaciones</p>`;
}

// TAGs
$('#addTag').onclick = () => {
  $('#newTagInput').value = '';
  $('#tagError').textContent = '';
  $('#tagDialog').showModal();
};
$('#tagConfirm').onclick = async (e) => {
  e.preventDefault();
  const tag = $('#newTagInput').value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9\-_.\/ ]{1,29}$/.test(tag)) {
    $('#tagError').textContent = 'TAG inválido: use letras, números y guiones (2 a 30 caracteres).';
    return;
  }
  if (!tags.includes(tag)) {
    tags.push(tag);
    localStorage.setItem('aftonTags', JSON.stringify(tags));
  }
  $('#tagDialog').close();
  renderTags();
  setVal('#tag', tag);
  if (job && !released()) {
    job.tag = tag;
    await commit('Equipo agregado y seleccionado', tag);
  }
};

// Navegación
$$('[data-stage]').forEach((b) => (b.onclick = () => {
  const n = Number(b.dataset.stage);
  showStage(n);
  if (job && !stageUnlocked(n)) flash('Etapa bloqueada: complete los requisitos previos.', 'warn');
}));
$('#prevStage').onclick = () => showStage(currentStage - 1);
$('#nextStage').onclick = () => showStage(currentStage + 1);

// Conectividad
function renderConn() {
  const on = navigator.onLine;
  const el = $('#connStatus');
  el.textContent = on ? '● EN LÍNEA · guardado local' : '● SIN CONEXIÓN · guardado local';
  el.className = `pill ${on ? 'ok' : 'off'}`;
}
window.addEventListener('online', renderConn);
window.addEventListener('offline', renderConn);

/* ---------- Inicio ---------- */
(async function init() {
  $('#appVersion').textContent = APP_VERSION;
  renderConn();
  renderTags();
  db = await openDB();
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  try {
    jobs = (await dbAll()).map(normalize);
  } catch (e) {
    jobs = [];
    flash('No se pudo leer el almacenamiento local: ' + e.message, 'bad');
  }
  const last = localStorage.getItem('ppcCurrentJob');
  const open = jobs.filter((j) => !j.closure).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const pick = jobs.find((j) => j.id === last) || open[0] || null;
  if (pick) await loadJob(pick.id);
  else render();
  if (!currentUser()) flash('Ingrese su nombre en “Usuario en turno” para comenzar.', 'warn');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
