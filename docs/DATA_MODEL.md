# Modelo de datos — PPC Digital V0.2

## Equipment
`id, tag, description, area, manufacturer, model, seal_type, api_plan, active, configuration_version`

## Intervention
`id, equipment_id, work_type, ot_sap, pssr_ref, reason, status, opened_at, opened_by, closed_at`

## Joint
`id, intervention_id, joint_code, service, flange_size, flange_class, face_type, gasket_spec, stud_spec, nut_spec, lubricant, bolt_count`

## TorqueProtocol
`id, joint_id, procedure_version_id, approved_target_torque, torque_unit, pattern_id, status, mechanic_id, qa_id, supervisor_id, revision`

## TorquePass
`id, protocol_id, sequence_no, name, target_rule, target_value, status, started_at, completed_at`

## BoltReading
`id, pass_id, bolt_no, required_torque, recorded_torque, unit, tool_id, user_id, recorded_at, rotation_observed, observation`

## ParallelismReading
`id, protocol_id, pass_id, angular_position, value, unit, user_id, recorded_at`

## Tool
`id, asset_code, manufacturer, model, serial_number, type, active`

## CalibrationRecord
`id, tool_id, certificate_ref, calibrated_at, expires_at, status, evidence_id`

## Approval
`id, intervention_id, milestone, role, user_id, decision, comment, signed_at, signature_id, revision`

## OperationalTest
`id, intervention_id, type, status, started_at, completed_at, operator_id, observation`

## Measurement
`id, intervention_id, test_id, parameter_code, value, unit, stage, recorded_at, user_id, source`

## Evidence
`id, intervention_id, entity_type, entity_id, media_type, object_key, captured_at, captured_by, hash`

## AuditEvent
`id, intervention_id, entity_type, entity_id, action, actor_id, timestamp, before_version, after_version, details`

## ProcedureVersion
`id, code, title, version, effective_date, status, reference`

## Reglas de integridad
1. No existe protocolo de torque sin intervención y junta.
2. No se ejecuta torque con herramienta/calibración no habilitada.
3. No se libera Mantenimiento con pasos críticos incompletos.
4. Operaciones no autoriza arranque sin liberación requerida.
5. Una fuga marca la prueba NO CONFORME y bloquea continuidad hasta resolución documentada.
6. Una firma congela la revisión firmada; las correcciones crean nueva revisión.
7. Cada transición de estado genera AuditEvent.
8. Límites operativos se cargan por configuración aprobada; no se generan por defecto.
