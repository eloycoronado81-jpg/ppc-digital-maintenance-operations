# Registro de cambios

## V0.6.0 — Responsables, PSSR de entrega, sentido de giro y adjuntos

### Terminología
- Plan 52: se usa "fluido de barrera (propanol)" en toda la app, alineado con POP-005002.

### Responsables
- Mantenimiento: Supervisor de Mantenimiento PPC, Supervisor de Mecánica de la contratista APTIM y QA/QC (los tres obligatorios para liberar).
- Operaciones: Operador PPC de turno y Supervisor de Producción PPC (obligatorios para la preparación y la autorización de arranque).
- Cierre: Especialista CBM que evaluó la estabilización (obligatorio para cerrar el expediente).

### PSSR · entrega de la bomba a Operaciones
- Después de liberar Mantenimiento, la entrega solo se inicia con el N.° de PSSR y las firmas de los supervisores PPC de Mecánica, Instrumentación, Electricidad y Seguridad.
- Nuevo estado "PSSR pendiente de firmas". Si Mantenimiento revoca la liberación o se retorna por fuga, las firmas anteriores quedan anuladas y se deben volver a registrar.

### Mantenimiento
- Verificación crítica del sentido de giro del motor eléctrico (horario mirando hacia abajo sobre el motor, IOM pág. 32 y 34; método desacoplado con energización momentánea, informe John Crane 2013).
- Adjunto del protocolo de torque en PDF o imagen (también con la cámara de la tablet), por cada unión bridada o como referencia general. Obligatorio para liberar cuando hubo intervención. Se guarda en el dispositivo con huella SHA-256; quitar un adjunto queda en la auditoría y los adjuntos se congelan al liberar.

## V0.5.0 — Biblioteca técnica, diagnóstico y desempeño hidráulico

Basado en la documentación técnica de las bombas de reflujo (manual IOM Afton 40824, POP-005002, informe John Crane 2013, correos JC PAY-14225, MMP-PPC-002 rev. 12, Piping Plan Pocket Pal, manual y plano Lemco Plan 52, PGRAL-100-IN-M-001). Cada dato muestra su fuente y página.

### Biblioteca técnica
- Ficha precargada para PAY-4210/4220 (CRIO 1) y PAY-4410/4420 (CRIO 2): Afton ILVS 3x4-11H S/N 40824, sello John Crane 48 tándem, Plan 13 + 52, motor Reliance 40 HP; datos de diseño y de operación actual.
- Área asignada automáticamente según el TAG. Se agregan CRIO 1 y CRIO 2.
- Aviso cuando el área no está cubierta por POP-005002 (CRIO 1–2).
- Discrepancia visible sobre la apertura de descarga al arranque (POP 50% / IOM cerrada / John Crane <10%).

### Mantenimiento
- Uniones bridadas con protocolo FORM-TORQ por unión: succión 4" #300, descarga 3" #300 y drenaje 3/4" (0.75") #300.
- Mediciones mecánicas de aceptación con límites documentados (descentramientos del IOM pág. 35, buje de garganta y concentricidad del informe John Crane), obligatorias después de cambio de sello o correctivo; fuera de límite bloquean la liberación.
- Referencia de rondas de apriete de PGRAL-100-IN-M-001.

### Diagnóstico y desempeño (nueva sección, siempre disponible)
- Punto de operación sobre la curva certificada 40824TR digitalizada (H-Q, eficiencia, NPSHr, BHP): altura medida, desviación, % BEP, potencia estimada, margen de NPSH.
- Margen de presión de vapor en la cavidad frente a las referencias del informe John Crane (130%) y del MMP-PPC-002 (50 psi).
- Diagnóstico por reglas: tabla de síntomas y causas del IOM (pág. 33) con verificaciones respaldadas, y síntomas del sistema de sello (Plan 52, brida, vaporización en caras, venteo, instalación del reservorio, cambio de buffer).
- Hallazgos automáticos desde las mediciones; el diagnóstico registrado queda en el expediente y en el reporte.

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

### Ficha de equipo, criterios y tendencias (basado en el diseño AFTON V3.0)
- Ficha del equipo por TAG: modelo, servicio, sello/API Plan y motor.
- Criterios de aceptación configurables por TAG (alerta y acción, mín/máx, unidad) con fuente obligatoria; sin fuente no se aplican. No hay límites por defecto.
- Cada medición se evalúa al registrarse (Normal / Alerta / Acción) y guarda la fuente del criterio usado.
- Indicadores del último valor por parámetro, coloreados según el criterio.
- Tendencia multivariable por grupo compatible (presiones, vibraciones, temperatura, corriente, caudal, nivel Plan 52) con bandas por fase y líneas de alerta/acción.
- No se puede cerrar como ESTABLE si la última medición está en nivel de acción.

### Mediciones
- Mediciones estructuradas con unidad por parámetro, ΔP calculado, condición de sello y ruido.

### PWA y seguridad
- Service worker versionado con estrategia red-primero y limpieza de cachés antiguos: las tablets reciben la versión publicada.
- Íconos en el manifest (instalable en Android).
- Indicador real de conexión.
- Todo texto ingresado se escapa antes de mostrarse.
