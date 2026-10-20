'use strict';
/* PPC Digital · adjuntos de protocolo de torque (PDF o imagen).
 * Los archivos se guardan en IndexedDB del dispositivo, en un almacén separado del expediente,
 * con su huella SHA-256. Un adjunto quitado queda registrado en la auditoría; no se borra la evidencia. */

const FILE_STORE = 'files';
const MAX_FILE_MB = 15;
const ACCEPT = 'application/pdf,image/*';

const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const attachList = (scope) => (job?.attachments || []).filter((a) => !a.removedAt && (!scope || a.scope === scope));
function attachScopeLabel(scope) {
  if (scope === 'torque') return 'Protocolo de torque (general)';
  const jt = libOf(job.tag)?.joints?.find((x) => 'joint:' + x.id === scope);
  return jt ? `Protocolo de torque · ${jt.t}` : scope;
}

function filePut(rec) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite');
    tx.objectStore(FILE_STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
function fileGet(id) {
  return new Promise((resolve, reject) => {
    const q = db.transaction(FILE_STORE).objectStore(FILE_STORE).get(id);
    q.onsuccess = () => resolve(q.result || null);
    q.onerror = () => reject(q.error);
  });
}
async function sha256(buf) {
  if (!crypto.subtle) return '';
  const h = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function attachWidget(scope, locked) {
  const items = attachList(scope);
  const list = items.map((a) => `<div class="att">
      <span>${a.type === 'application/pdf' ? '📄' : '🖼️'} <b>${esc(a.name)}</b> <small class="muted">${esc(fmtSize(a.size))} · ${esc(a.by)} · ${esc(fmtTime(a.at))}</small></span>
      <span><button type="button" class="mini" data-view-att="${esc(a.id)}">Ver</button>${locked ? '' : `<button type="button" class="mini danger" data-del-att="${esc(a.id)}">Quitar</button>`}</span></div>`).join('');
  const picker = locked ? '' : `<label class="file-btn">📎 Adjuntar PDF o imagen<input type="file" data-attach="${esc(scope)}" accept="${ACCEPT}" hidden></label>`;
  return `<div class="att-box">${list || (locked ? '<small class="muted">Sin adjunto</small>' : '')}${picker}</div>`;
}

async function addAttachment(scope, file) {
  if (!db) return flash('Este dispositivo no permite guardar archivos (IndexedDB no disponible).', 'bad');
  if (!(file.type === 'application/pdf' || file.type.startsWith('image/'))) return flash('Solo se aceptan archivos PDF o imágenes.', 'bad');
  if (file.size > MAX_FILE_MB * 1048576) return flash(`El archivo supera ${MAX_FILE_MB} MB.`, 'bad');
  const buf = await file.arrayBuffer();
  const hash = await sha256(buf);
  const id = uuid();
  await filePut({ id, jobId: job.id, name: file.name, type: file.type, blob: new Blob([buf], { type: file.type }) });
  job.attachments = [...(job.attachments || []), { id, scope, name: file.name, type: file.type, size: file.size, hash, at: nowISO(), by: currentUser() }];
  await commit('Protocolo de torque adjuntado', `${attachScopeLabel(scope)}: ${file.name} (${fmtSize(file.size)})`);
  flash('Protocolo adjuntado al expediente.', 'good');
}

document.addEventListener('change', async (e) => {
  const inp = e.target;
  if (!inp.matches('[data-attach]') || !job) return;
  const file = inp.files?.[0];
  inp.value = '';
  if (!file) return;
  if (!requireUser()) return;
  try { await addAttachment(inp.dataset.attach, file); } catch (err) { flash('No se pudo guardar el adjunto: ' + err.message, 'bad'); }
});
document.addEventListener('click', async (e) => {
  const v = e.target.closest('[data-view-att]');
  const d = e.target.closest('[data-del-att]');
  if (!job || (!v && !d)) return;
  if (v) {
    const rec = db ? await fileGet(v.dataset.viewAtt) : null;
    if (!rec) return flash('El archivo no está en este dispositivo.', 'bad');
    const url = URL.createObjectURL(rec.blob);
    const w = window.open(url, '_blank');
    if (!w) { const a = document.createElement('a'); a.href = url; a.download = rec.name; a.click(); }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return;
  }
  if (!requireUser()) return;
  const a = job.attachments.find((x) => x.id === d.dataset.delAtt);
  if (!a || !window.confirm(`¿Quitar "${a.name}" del expediente? Quedará registrado en la auditoría.`)) return;
  a.removedAt = nowISO();
  a.removedBy = currentUser();
  await commit('Adjunto quitado', `${attachScopeLabel(a.scope)}: ${a.name}`);
});
