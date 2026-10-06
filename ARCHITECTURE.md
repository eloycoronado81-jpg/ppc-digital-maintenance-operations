# Arquitectura PPC Digital — V0.2

## Objetivo
Una sola aplicación PWA, tablet-first y offline-first, para Mantenimiento, Mecánicos, QA/QC y Operaciones. Cada intervención genera un expediente digital único por TAG.

La aplicación guía, registra, valida y bloquea el flujo según permisos y requisitos. No controla físicamente equipos y no sustituye procedimientos vigentes.

## Flujo maestro
1. Crear intervención / seleccionar TAG.
2. Preparación de Mantenimiento.
3. Inspección de junta y documentación.
4. Ejecución digital de torque por Mecánico.
5. Verificación QA/QC.
6. Liberación de Mantenimiento.
7. Recepción de Operaciones / PSSR.
8. Enfriamiento, cebado/purgas y Leak Test.
9. Autorización de arranque.
10. Arranque y registro de parámetros.
11. Estabilización y tendencias.
12. Cierre, firmas y reporte final.

Si una prueba detecta fuga o condición crítica, el flujo se bloquea y retorna a evaluación de Mantenimiento. Nunca se prescribe automáticamente un incremento de torque: la acción debe corresponder al procedimiento aprobado.

## Roles y permisos
### Mecánico
- Ejecuta protocolo de torque.
- Selecciona herramienta calibrada.
- Registra cada espárrago, pase, valor y evidencia.
- No libera el equipo ni modifica registros firmados.

### Supervisor de Mantenimiento
- Crea/revisa intervención.
- Verifica documentación y requisitos.
- Revisa protocolo y evidencias.
- Libera Mantenimiento mediante firma digital.

### QA/QC
- Verifica junta, materiales, herramienta, calibración, secuencia, paralelismo y protocolo.
- Aprueba/rechaza con observación y firma.

### Operaciones
- Recibe equipo liberado.
- Ejecuta PSSR, enfriamiento/cebado/purgas, Leak Test, arranque y estabilización.
- Registra parámetros operativos y resultado.

### Administrador
- Configura TAGs, plantillas, usuarios, roles, herramientas, unidades, criterios aprobados y versiones de procedimiento.

## Módulos
- Autenticación y RBAC.
- Maestro de equipos/TAG.
- Intervenciones y estados.
- Protocolo digital de torque.
- Herramientas y calibración.
- QA/QC y liberación.
- Operaciones y pruebas.
- Parámetros operativos y tendencias.
- Evidencias/fotografías.
- Firmas y auditoría.
- Historial por TAG.
- Reporte PDF.
- Sincronización offline/online.

## Motor de torque
Datos mínimos: TAG, ID de junta, diámetro/rating/cara, materiales, empaque, sujetadores, lubricante, torque objetivo aprobado, herramienta y calibración.

La plantilla define las rondas/pases aplicables y el patrón de apriete. El mecánico ve un espárrago activo a la vez. Cada confirmación almacena: espárrago, pase, torque requerido, torque registrado, usuario, herramienta, fecha/hora y observación.

El pase de verificación debe permitir registrar si hubo rotación por tuerca. Las verificaciones de paralelismo se almacenan por posición angular configurada. Los valores porcentuales nunca deben inferirse para un tipo de junta no configurado.

## Operaciones y arranque
El flujo operativo se habilita únicamente cuando Mantenimiento y QA/QC hayan completado sus hitos requeridos. El módulo admite PSSR, alineamiento operativo, enfriamiento, cebado/purgas, Leak Test, autorización, arranque y estabilización.

Los parámetros se configuran por TAG: presión de succión, presión de descarga, ΔP calculada, caudal, corriente, vibración, temperaturas y variables del sistema de sello/API Plan cuando correspondan. Los límites normal/alerta/acción deben provenir de fuentes aprobadas; la aplicación no inventará límites.

## Tendencias
Cada medición incluye timestamp, etapa, usuario y unidad. La UI grafica una variable o grupo compatible por escala y marca hitos: enfriamiento, purga/cebado, Leak Test, habilitación, arranque y estabilización. Se contempla comparación futura con arranques anteriores.

## Modelo de datos lógico
- users
- roles
- equipment
- equipment_configurations
- interventions
- intervention_states
- joints
- torque_protocols
- torque_passes
- bolt_readings
- parallelism_readings
- tools
- calibration_records
- inspections
- approvals
- operational_tests
- measurements
- evidence
- signatures
- audit_events
- procedure_versions
- sync_queue

Todos los registros transaccionales deben usar UUID, created_at, created_by, updated_at y version. Registros firmados son inmutables; una corrección crea revisión y conserva el original.

## Estados
DRAFT → MAINTENANCE_IN_PROGRESS → TORQUE_IN_PROGRESS → QA_PENDING → MAINTENANCE_RELEASED → OPERATIONS_TESTING → START_AUTHORIZED → STARTED → STABILIZING → CLOSED.

Estados de excepción: BLOCKED, NON_CONFORMING, RETURNED_TO_MAINTENANCE y CANCELLED.

## Offline-first
IndexedDB será la fuente local de trabajo. Service Worker cachea la aplicación. Toda mutación genera un evento en sync_queue. Al recuperar conectividad se sincroniza con backend. Nunca se pierde el registro local por falta de señal.

Para conflictos: registros firmados no se fusionan; se conserva evidencia y se requiere resolución supervisada. Para borradores se usa versionado y control de última versión.

## Backend objetivo
Netlify Functions + Netlify Blobs para piloto controlado. Separar almacenamiento de producción de previews/desarrollo. Para escalamiento multiusuario/relacional, migrar capa de persistencia a Postgres sin cambiar el dominio de la aplicación.

## Seguridad
- Autenticación real antes de uso de campo.
- RBAC por acción, no solo por pantalla.
- Evidencia y firmas vinculadas al usuario.
- Auditoría append-only.
- No guardar secretos en frontend.
- Validación servidor de cambios de estado.
- Registros firmados no editables.
- El repositorio debe mantenerse privado antes de incorporar documentación o datos internos.

## Estructura de código objetivo
src/
  app/
  domain/
    equipment/
    interventions/
    torque/
    operations/
    measurements/
    approvals/
  components/
  pages/
  storage/
    indexeddb/
    sync/
  services/
  config/
  styles/
netlify/functions/
docs/
tests/

## Entornos Git
- main: base estable actual.
- architecture-v0.2: arquitectura en construcción.
- develop: integración de desarrollo.
- qa-validation: validación funcional.
- field-test: prueba controlada en campo.
- pilot: piloto aprobado.
- production: producción.
- backup-v0.1 / rollback-v0.1 / release-v0.1: puntos de recuperación de la versión inicial.

## Gate de salida a campo
No liberar para campo hasta validar: permisos, calibraciones, flujo de estados, bloqueos críticos, funcionamiento offline, sincronización, integridad de registros, firmas, reporte, recuperación ante fallos y pruebas con casos simulados conforme/no conforme.