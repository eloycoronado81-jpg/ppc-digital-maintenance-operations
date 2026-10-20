# Registro de cambios

## V0.4.0 — Persistencia, gates y alineamiento con POP-005002

### Expediente y persistencia
- Expediente independiente por intervención guardado en IndexedDB (respaldo en localStorage). Sobrevive a recargas y pérdida de señal.
- "Nueva intervención" crea un expediente limpio; los anteriores se pueden reabrir desde el selector.
- Usuario en turno obligatorio: cada respuesta, hito, prueba y medición guarda responsable y hora (ISO).
- Auditoría completa por expediente, sin límite de 250 líneas.
- Exportación JSON e impresión/PDF del expediente.

### Gates
- Las etapas se habilitan en orden; las bloqueadas muestran qué falta.
- Liberación de Mantenimiento exige OT/SAP, referencia del protocolo de torque (FORM-TORQ-001), Supervisor y QA/QC. Al liberar, el checklist queda congelado; revocar exige motivo.
- Operaciones recibe la liberación de forma automática; si Mantenimiento la revoca o la reemite, Operaciones, Plan 52 y enfriamiento deben re-verificarse.
- Plan 52 "no aplica" exige justificación. Presión y nivel inicial obligatorios.
- Prueba opcional de consumo de buffer en stand-by; si detecta consumo, bloquea el arranque.
- Leak Test con fuga exige ubicación y bloquea "SIN FUGA" hasta registrar resolución: retorno a Mantenimiento (revoca la liberación) o corrección operativa y re-test.
- Autorización de arranque exige PSSR y pasos 4–6; cierre exige START, mediciones de estabilización y pasos 8–16. No se puede declarar ESTABLE si la última medición reporta fuga o ruido anormal.
- Expediente cerrado queda en solo lectura.

### Procedimiento PEPDG-OPS-POP-005002 v1.1 (rotación de bombas de reflujo)
- Pasos 1 a 16 incorporados como checklist en Preparación, Enfriamiento, Arranque y Post-arranque.
- Enfriamiento: si la bomba en S/B no está adecuadamente fría, la purga a COLD FLARE y sus hitos son obligatorios; si está adecuada, las purgas admiten N/A.
- Referencias del procedimiento mostradas como guía y advertencia (no bloquean): descarga ≈400–450 psig en CRIO 3–4 y ≈400 psig en CRIO 5; tanque de líquido de barrera 0–5 psig; reposición de propanol hasta 70% del visor.

### Mediciones
- Mediciones estructuradas con unidad por parámetro, ΔP calculado, condición de sello y ruido.
- Tendencia gráfica por variable con marcadores de hitos.

### PWA y seguridad
- Service worker versionado con estrategia red-primero y limpieza de cachés antiguos: las tablets reciben la versión publicada.
- Íconos en el manifest (instalable en Android).
- Indicador real de conexión.
- Todo texto ingresado se escapa antes de mostrarse.
