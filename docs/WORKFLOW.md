# Flujo y gates de autorización

| Etapa | Responsable principal | Entrada requerida | Salida |
|---|---|---|---|
| Apertura | Supervisor Mantenimiento | TAG + OT/SAP + tipo de intervención | Expediente creado |
| Preparación | Mantenimiento | documentación, aislamiento/requisitos aplicables | Habilitado para ejecución |
| Torque | Mecánico | junta configurada + herramienta/calibración válida | Protocolo ejecutado |
| QA/QC | QA/QC | protocolo + evidencias | Conforme / rechazado |
| Liberación | Supervisor Mantenimiento | torque y QA/QC conformes | Mantenimiento liberado |
| Pruebas | Operaciones | liberación + requisitos operativos | Leak Test conforme/no conforme |
| Arranque | Operaciones | pruebas conformes + autorización | Equipo arrancado |
| Estabilización | Operaciones/Mantenimiento/CBM según aplique | parámetros | estable / requiere evaluación |
| Cierre | responsables | firmas + evidencias + reporte | expediente cerrado |

## Gate 1 — Torque
Bloquea si faltan datos críticos de junta, torque objetivo aprobado, herramienta o calibración vigente.

## Gate 2 — Liberación de Mantenimiento
Bloquea si existen puntos críticos NO OK, protocolo incompleto, rechazo QA/QC o evidencia obligatoria pendiente.

## Gate 3 — Operaciones
Operaciones puede visualizar el expediente previo, pero no alterar el protocolo de torque. El flujo operativo inicia después de la liberación requerida.

## Gate 4 — Leak Test
Si se registra fuga: estado NON_CONFORMING; se captura ubicación, evidencia y observación; no se permite avanzar a autorización de arranque. Si corresponde intervención mecánica, cambia a RETURNED_TO_MAINTENANCE.

## Gate 5 — Arranque
Solo se habilita con pruebas y requisitos críticos conformes. El botón representa autorización documental/digital; no acciona físicamente el equipo.

## Gate 6 — Cierre
Exige resultado de estabilización, firmas y trazabilidad completa. El expediente cerrado queda inmutable; cualquier corrección se realiza como revisión.