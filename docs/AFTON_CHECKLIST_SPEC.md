# Especificación — Lista de Verificación Afton / Bombas de Reflujo

## Objetivo
Módulo digital compartido entre Mantenimiento y Operaciones para verificar y documentar la preparación, liberación, pruebas, arranque y estabilización de bombas Afton de reflujo. Tablet-first, offline-first y trazable por TAG.

## Principio de autoridad
- Mantenimiento libera la condición mecánica.
- Operaciones verifica condiciones operativas y autoriza/ejecuta las maniobras de arranque conforme al procedimiento vigente.
- La aplicación guía, registra y bloquea requisitos digitales; no acciona físicamente la bomba.
- Los límites numéricos deben provenir de documentación aprobada, alarmas/trips, datasheet o CBM. No se inventan límites.

## Identificación
- TAG dinámico / + Agregar equipo
- Área / CRIO
- fabricante / modelo
- fecha/hora
- horómetro
- motivo: normal / post-MP / post-correctivo / post-sello
- OT/SAP
- PSSR
- operador
- supervisor Operaciones
- supervisor Mantenimiento

## Etapa A — Liberación de Mantenimiento
1. Trabajo mecánico concluido.
2. Sello mecánico instalado/verificado.
3. Protocolo digital de torque de juntas aplicables conforme.
4. Alineamiento/paralelismo verificado cuando aplique.
5. Acoplamiento y pernos verificados.
6. Guardas instaladas.
7. Rotación manual libre.
8. Lubricación/nivel según configuración.
9. Área libre de materiales/herramientas.
10. Evidencias y observaciones completas.
11. Firma de liberación de Mantenimiento.

Un punto crítico NO OK bloquea la liberación.

## Etapa B — Preparación previa al arranque
Lista configurable por TAG:
- disponibilidad/liberación recibida
- válvulas/alineamiento según procedimiento operativo
- instrumentación disponible
- protecciones/interlocks disponibles
- bomba llena/cebada
- venteo/purga ejecutado según procedimiento
- condición térmica/enfriamiento adecuado
- ausencia de fugas visibles
- condición del sistema de sello

La guía del fabricante se presenta como ayuda contextual; la maniobra concreta se rige por el procedimiento operativo vigente.

## Etapa C — Sistema de sello / API Plan 52 cuando aplique
- configuración Plan 52 confirmada
- fluido buffer compatible/configurado
- nivel inicial registrado
- válvulas requeridas en condición operativa
- suministro desde conexión inferior y retorno a conexión superior verificados según instalación
- líneas sin restricciones evidentes
- venteo/recuperación/flare alineado según procedimiento
- instrumentos de presión/nivel disponibles cuando existan
- enfriamiento del reservorio cuando aplique
- ausencia de fugas
- presión y nivel inicial registrados

## Etapa D — Enfriamiento / cebado / Leak Test
Registrar hitos, hora y responsable. La pantalla debe permitir evidencia fotográfica y resultado CONFORME/NO CONFORME.

Si se detecta fuga: bloquear autorización de arranque, capturar ubicación/evidencia/observación y retornar a Mantenimiento cuando corresponda.

## Etapa E — Autorización de arranque
Gate digital. Requiere que los puntos críticos previos estén conformes y que las liberaciones/firmas requeridas existan. El botón significa HABILITADO DOCUMENTALMENTE, no comando físico.

## Etapa F — Durante el arranque
Registro configurable:
- presión de succión
- presión de descarga
- ΔP calculada
- caudal
- corriente motor
- vibración bomba
- vibración motor
- temperatura de rodamientos
- presión/nivel Plan 52 cuando aplique
- condición/fuga de sello
- ruido anormal
- observaciones

## Etapa G — Estabilización
Múltiples mediciones con timestamp. Intervalos configurables por el administrador; no se presentan como requisito de fabricante. Resultado final: EQUIPO ESTABLE / REQUIERE EVALUACIÓN.

## Tendencia de arranque
Gráficas por variable/escala con marcadores de eventos:
Enfriamiento → Purga/Cebado → Leak Test → Habilitación → Arranque → Estabilización.

Cada punto conserva usuario, fecha/hora, valor, unidad, etapa y fuente. Comparación histórica por TAG se habilita posteriormente.

## Estados del checklist
DRAFT → MAINTENANCE_RELEASE → OPERATIONS_PREP → COOLING_PRIMING → LEAK_TEST → START_READY → STARTED → STABILIZING → COMPLETED.

Excepciones: BLOCKED, NON_CONFORMING, RETURNED_TO_MAINTENANCE.

## Resultado global
- Verde: CONFORME / HABILITADO.
- Amarillo: VERIFICACIÓN INCOMPLETA.
- Rojo: NO CONFORME / NO HABILITADO.

El sistema lista automáticamente todos los puntos bloqueantes.

## Registro por ítem
Cada ítem incluye: estado OK/NO OK/N/A, valor, unidad, criterio/referencia, observación, responsable, timestamp, criticidad, evidencia y versión.

N/A se deshabilita para requisitos universales definidos como críticos.

## Reporte
El cierre genera expediente imprimible/PDF con identificación, checklist completo, protocolo de torque vinculado, pruebas, parámetros/tendencias, desviaciones, evidencias, responsables, firmas y resultado final.