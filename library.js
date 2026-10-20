'use strict';
/* Biblioteca técnica PPC Digital · bombas de reflujo.
 * Todo dato aquí proviene de un documento identificado en SOURCES con su página.
 * La aplicación no agrega límites propios: lo que no está en los documentos queda configurable. */

const SOURCES = {
  IOM: { t: 'Manual IOM Afton 40824 · Bomba de reflujo del desetanizador (Howe-Baker / Pluspetrol, edición 11/04/2013)', short: 'IOM Afton 40824' },
  POP: { t: 'PEPDG-OPS-POP-005002 v1.1 · Operación Normal en Criogénica 3, 4 y 5', short: 'POP-005002' },
  JC13: { t: 'John Crane · Informe complementario de servicio en Malvinas, sellos mecánicos de bombas CRIO (09/07/2013)', short: 'Informe John Crane 2013' },
  JC12: { t: 'John Crane / Pluspetrol · Correos "Sello Mecánico PAY-14225" (noviembre 2012)', short: 'Correos JC PAY-14225' },
  ING26: { t: 'MMP-PPC-002 rev. 12 · Ingeniería del upgrade de bombas de reflujo CRIO 1 PAY-4210/4220 (30/04/2026)', short: 'MMP-PPC-002 rev. 12' },
  PPP: { t: 'Flowserve · Piping Plan Pocket Pal (planes API de sellos)', short: 'Piping Plan Pocket Pal' },
  LEMCO: { t: 'John Crane Lemco · Pressure Reservoir Plan 52 and Plan 53 Instruction Manual', short: 'Manual Lemco Plan 52/53' },
  LP52: { t: 'John Crane Lemco · Plano LP52-54N1-REDA1, reservorio 5 gal Plan 52', short: 'Plano LP52-54N1' },
  PGRAL: { t: 'PGRAL-100-IN-M-001 rev. 2 · Instructivo de ensamble y desensamble de uniones empernadas en bridas', short: 'PGRAL-100-IN-M-001' },
};
const cite = (id, page) => `${SOURCES[id].short}${page ? ', pág. ' + page : ''}`;

/* Curva 40824TR · ILVS 3x4-11H · 3550 rpm · impulsor construido 10.375" · SG 0.442.
 * Puntos digitalizados del gráfico certificado (IOM pág. 13). Precisión de lectura aprox. ±3%. */
const CURVES = {
  '40824TR': {
    title: 'Curva 40824TR · ILVS 3x4-11H · 3550 rpm · Ø10.375"',
    source: cite('IOM', 13) + ' (digitalizada, ±3%)',
    sgCurve: 0.442,
    design: { q: 460, h: 366 },
    bep: 460,
    head: [[0, 413], [100, 412], [200, 407], [300, 399], [400, 381], [460, 366], [500, 357], [600, 320], [700, 271], [710, 263]],
    eff: [[0, 0], [50, 17], [100, 30], [200, 50], [300, 64], [400, 68.6], [460, 69.7], [500, 69.5], [600, 66], [700, 60]],
    npshr: [[100, 7], [200, 7.8], [300, 9], [400, 10.4], [460, 11.7], [500, 12.5], [600, 15.8], [700, 20.2], [800, 27]],
    bhp: [[0, 14.8], [100, 16.7], [200, 19.7], [300, 22.2], [400, 25.6], [460, 27.5], [500, 29], [600, 31.5], [700, 33.4]],
  },
};

/* Ficha precargada para las 4 bombas Afton del trabajo 40824. */
const AFTON_40824 = {
  model: 'Afton ILVS 3x4-11H · S/N 40824 · 1 etapa',
  service: 'Bomba de reflujo del desetanizador',
  seal: 'John Crane tipo 48 tándem (2-1/8" y 1-7/8", 48MP/S48) · Plan 13 + Plan 52',
  motor: 'Reliance 40 HP · 3550 rpm · 460 V 3/60 · marco 324LP TEFC-XEX · SF 1.15',
  curve: '40824TR',
  design: [
    ['Caudal / TDH de diseño', '460 gpm / 366 pies', cite('IOM', 5)],
    ['Gravedad específica de diseño', '0.442', cite('IOM', 5)],
    ['NPSH disponible de diseño', '10–12 pies en CL de boquilla de succión', cite('IOM', 13)],
    ['Presión de trabajo (succión y descarga)', '720 psig @ 100 °F · hidro 1110 psig', cite('IOM', 5)],
    ['Temperatura de diseño', '−85 / 150 °F', cite('IOM', 12)],
    ['Ajuste de impulsor', '1/8"', cite('IOM', 12)],
    ['Rotación', 'Horaria (CW) mirando hacia abajo sobre el motor', cite('IOM', 32)],
    ['Cojinetes radial y de empuje', 'En el motor', cite('IOM', 12)],
    ['Arreglo de sello actual', 'Plan 13 + Plan 52 (CRIO 1 y 2)', `${cite('ING26', 13)}; ${cite('JC13', 2)}`],
  ],
  operation: [
    ['Caudal de operación', '360–380 gpm', cite('ING26', 11)],
    ['ΔP de operación', '67 psi', cite('ING26', 11)],
    ['Temperatura del fluido', '−95 °F', cite('ING26', 11)],
    ['Densidad', '440.6 kg/m³', cite('ING26', 12)],
    ['NPSH disponible', '14.63 pies', cite('ING26', 12)],
    ['Presión de vapor', '358.2 psig (verificar referencia y unidades frente a la presión de alimentación de 333 psi)', cite('ING26', 11)],
  ],
  defaults: { sg: 0.442, npsha: 14.63, pv: 358.2 },
  /* Uniones bridadas de la bomba sujetas a protocolo de torque (FORM-TORQ-001). */
  joints: [
    { id: 'suc', t: 'Brida de succión 4" clase 300', src: cite('ING26', 11) },
    { id: 'dis', t: 'Brida de descarga 3" clase 300', src: cite('ING26', 11) },
    { id: 'drn', t: 'Brida de drenaje 3/4" (0.75") clase 300', src: 'Indicado por Eloy Coronado (Inspección Mecánica), 19/10/2026' },
  ],
  /* Mediciones mecánicas de aceptación al montar el sello o tras un correctivo. Valores en pulgadas. */
  mech: [
    { k: 'runoutBox', t: 'Descentramiento del eje entre prensaestopas y acople (TIR)', max: 0.003, unit: 'in', src: cite('IOM', 35) },
    { k: 'runoutCpl', t: 'Descentramiento del diámetro exterior del acople', max: 0.002, unit: 'in', src: cite('IOM', 35) },
    { k: 'runoutMotor', t: 'Descentramiento del eje del motor', max: 0.0005, unit: 'in', src: cite('IOM', 35) },
    { k: 'throat', t: 'Juego radial eje – buje de garganta', max: 0.002, unit: 'in', src: cite('JC13', 1) },
    { k: 'concent', t: 'Concentricidad del eje respecto al alojamiento del sello', max: 0.002, unit: 'in', src: cite('JC13', 5) + ' (API 610)' },
  ],
};
const EQUIPMENT_LIBRARY = {
  'PAY-4210': { ...AFTON_40824, area: 'CRIO 1', areaSrc: cite('ING26', 4) },
  'PAY-4220': { ...AFTON_40824, area: 'CRIO 1', areaSrc: cite('ING26', 4) },
  'PAY-4410': { ...AFTON_40824, area: 'CRIO 2', areaSrc: cite('ING26', 4) },
  'PAY-4420': { ...AFTON_40824, area: 'CRIO 2', areaSrc: cite('ING26', 4) },
};
/* Áreas conocidas para TAGs sin ficha completa. */
const TAG_AREAS = { 'PAY-14410': { area: 'CRIO 4', src: cite('JC12', 2) } };

/* Referencias que aparecen en más de una fuente y no coinciden. */
const DISCREPANCIES = {
  dischargeAtStart: {
    t: 'Apertura de la válvula de descarga al dar START',
    items: [
      ['POP-005002 paso 4', 'Descarga abierta al 50% antes del arranque'],
      ['Manual IOM Afton, pág. 34', 'Descarga cerrada; arrancar y abrir lentamente observando el manómetro de descarga'],
      ['Informe John Crane 2013, pág. 5', 'Descarga ligeramente abierta, generalmente menos del 10%'],
    ],
    note: 'Las fuentes no coinciden. Confirme el criterio vigente con Operaciones antes del arranque y registre cuál se aplicó.',
  },
};

/* Tabla de solución de problemas (Hydraulic Institute) del manual IOM, pág. 33. */
const HI_CAUSES = {
  1: ['Succión', 'Bomba no cebada'],
  2: ['Succión', 'La bomba o la tubería de succión no están completamente llenas de líquido'],
  3: ['Succión', 'Altura de succión demasiado alta'],
  4: ['Succión', 'Margen insuficiente entre la presión de succión y la presión de vapor'],
  5: ['Succión', 'Cantidad excesiva de aire o gas en el líquido'],
  6: ['Succión', 'Bolsa de aire o vapor en la línea de succión'],
  7: ['Succión', 'Fugas de aire en la línea de succión'],
  8: ['Succión', 'Entrada de aire a la bomba por el prensaestopas'],
  9: ['Succión', 'Válvula de pie demasiado pequeña', true],
  10: ['Succión', 'Válvula de pie parcialmente obstruida', true],
  11: ['Succión', 'Entrada de la tubería de succión insuficientemente sumergida', true],
  12: ['Succión', 'Tubería del sello de agua obstruida', true],
  13: ['Succión', 'Jaula del sello mal ubicada en la caja de empaquetadura', true],
  14: ['Sistema', 'Velocidad demasiado baja'],
  15: ['Sistema', 'Velocidad demasiado alta'],
  16: ['Sistema', 'Sentido de giro incorrecto'],
  17: ['Sistema', 'Altura total del sistema mayor que la de diseño de la bomba'],
  18: ['Sistema', 'Altura total del sistema menor que la de diseño de la bomba'],
  19: ['Sistema', 'Gravedad específica del líquido diferente de la de diseño'],
  20: ['Sistema', 'Viscosidad del líquido diferente de la de diseño'],
  21: ['Sistema', 'Operación a muy baja capacidad'],
  22: ['Sistema', 'Operación en paralelo de bombas no aptas para ello'],
  23: ['Mecánico', 'Materia extraña en el impulsor'],
  24: ['Mecánico', 'Desalineación'],
  25: ['Mecánico', 'Fundación no rígida'],
  26: ['Mecánico', 'Eje doblado'],
  27: ['Mecánico', 'Rozamiento de pieza giratoria con pieza estacionaria'],
  28: ['Mecánico', 'Cojinetes desgastados'],
  29: ['Mecánico', 'Anillos de desgaste desgastados'],
  30: ['Mecánico', 'Impulsor dañado'],
  31: ['Mecánico', 'Junta de la carcasa defectuosa que permite fuga interna'],
  32: ['Mecánico', 'Eje o camisas desgastados o rayados en la empaquetadura', true],
  33: ['Mecánico', 'Empaquetadura mal instalada', true],
  34: ['Mecánico', 'Tipo de empaquetadura incorrecto para la operación', true],
  35: ['Mecánico', 'Eje girando fuera de centro por cojinetes desgastados o desalineación'],
  36: ['Mecánico', 'Rotor desbalanceado que provoca vibración'],
  37: ['Mecánico', 'Prensaestopas demasiado apretado', true],
  38: ['Mecánico', 'Sin líquido refrigerante en cajas de empaque enfriadas por agua', true],
  39: ['Mecánico', 'Holgura excesiva entre eje y fondo de caja: empaquetadura forzada hacia la bomba', true],
  40: ['Mecánico', 'Suciedad o arena en el líquido de sellado', true],
  41: ['Mecánico', 'Empuje excesivo por falla mecánica interna o del balanceo hidráulico'],
  42: ['Mecánico', 'Exceso de grasa o aceite en cojinetes antifricción'],
  43: ['Mecánico', 'Falta de lubricación'],
  44: ['Mecánico', 'Instalación incorrecta de cojinetes antifricción'],
  45: ['Mecánico', 'Suciedad en cojinetes'],
  46: ['Mecánico', 'Oxidación de cojinetes por agua en la carcasa'],
  47: ['Mecánico', 'Enfriamiento excesivo del cojinete con condensación de humedad'],
};
/* Las marcadas con true corresponden a válvula de pie o empaquetadura: no aplican a esta bomba
   en línea con succión inundada y sello mecánico, salvo indicación contraria. */

const HI_SYMPTOMS = [
  { id: 'noflow', t: 'La bomba no entrega líquido', causes: [1, 2, 3, 4, 6, 11, 14, 16, 17, 22, 23] },
  { id: 'lowq', t: 'Capacidad insuficiente', causes: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 17, 20, 22, 23, 29, 30, 31] },
  { id: 'lowp', t: 'Presión desarrollada insuficiente', causes: [5, 14, 16, 17, 20, 22, 29, 30, 31] },
  { id: 'loseprime', t: 'Pierde cebado después de arrancar', causes: [2, 3, 5, 6, 7, 8, 11, 12, 13] },
  { id: 'power', t: 'Consume demasiada potencia', causes: [15, 16, 17, 18, 19, 20, 23, 24, 26, 27, 29, 33, 34, 37] },
  { id: 'vib', t: 'Vibra o hace ruido', causes: [2, 3, 4, 9, 10, 11, 21, 23, 24, 25, 26, 27, 28, 30, 35, 36, 41, 42, 43, 44, 45, 46, 47] },
  { id: 'bearings', t: 'Cojinetes con vida corta', causes: [24, 26, 27, 28, 35, 36, 41, 42, 43, 44, 45, 46, 47] },
  { id: 'overheat', t: 'Se sobrecalienta y se agarrota', causes: [1, 4, 21, 22, 24, 27, 28, 35, 36, 41] },
];

/* Verificaciones respaldadas por los documentos para causas específicas. */
const HI_CHECKS = {
  1: ['Ventear hasta observar chorro de líquido antes del START', cite('IOM', 34)],
  2: ['Purgar hasta observar congelamiento en el cuerpo de la bomba y ventear la cavidad de sellado', `${cite('POP', 15)}; ${cite('JC13', 1)}`],
  4: ['Comparar NPSH disponible con NPSH requerido al caudal actual (panel hidráulico); revisar filtro de succión, presión de vapor y presión de succión', `${cite('IOM', 13)}; ${cite('IOM', 32)}`],
  6: ['Eliminar bolsas de vapor en la succión; la bomba no debe quedar en el punto alto del sistema', cite('IOM', 34)],
  16: ['Rotación horaria (CW) mirando hacia abajo sobre el motor', cite('IOM', 32)],
  17: ['Ubicar el punto de operación en la curva (panel hidráulico)', cite('IOM', 13)],
  18: ['Ubicar el punto de operación en la curva (panel hidráulico)', cite('IOM', 13)],
  19: ['SG de diseño 0.442; densidad de operación 440.6 kg/m³', `${cite('IOM', 5)}; ${cite('ING26', 12)}`],
  21: ['Caudal de operación 360–380 gpm frente a 460 gpm de diseño: revisar % del BEP en el panel hidráulico', `${cite('ING26', 11)}; ${cite('IOM', 13)}`],
  24: ['Descentramiento ≤ 0.003" TIR prensaestopas–acople; OD del acople ≤ 0.002"; eje del motor ≤ 0.0005"', cite('IOM', 35)],
  26: ['Verificar el eje de la bomba en varios puntos', cite('IOM', 35)],
  27: ['Girar a mano: debe rotar libre. Revisar roce eje – buje de garganta', `${cite('IOM', 32)}; ${cite('JC13', 1)}`],
  28: ['Los cojinetes radial y de empuje están en el motor: ver manual del motor', cite('IOM', 12)],
  35: ['Concentricidad del eje respecto al alojamiento del sello ≤ 0.002"', cite('JC13', 5)],
  43: ['Revisar el programa de lubricación del motor', cite('IOM', 19)],
};

/* Diagnóstico del sistema de sello (servicio criogénico, sello tándem + Plan 52). */
const SEAL_SYMPTOMS = [
  {
    id: 's_p52up', t: 'Presión del reservorio Plan 52 en aumento o alarma de alta presión',
    causes: [
      ['Fuga del sello interno (primario) hacia el fluido de barrera (propanol)', cite('PPP', 'Plan 52')],
      ['Venteo del reservorio restringido (orificio 1/8") o contrapresión del flare de baja presión (5–10 psi)', `${cite('LP52')}; ${cite('ING26', 10)}`],
    ],
    checks: [
      ['Presión normal del tanque de líquido de barrera: 0–5 psig', cite('POP', 3)],
      ['Revisar el presostato del reservorio (rango 5–30 psi) y su ajuste', cite('LP52')],
      ['Registrar la tendencia de presión y nivel del Plan 52 (panel de tendencias)', ''],
    ],
  },
  {
    id: 's_p52low', t: 'Consumo de propanol: el nivel del reservorio Plan 52 baja',
    causes: [
      ['Fuga del sello externo hacia la atmósfera', cite('PPP', 'Plan 52')],
      ['Fuga del sello interno: el propanol se va al flare con el producto vaporizado', cite('JC13', 3)],
    ],
    checks: [
      ['Prueba de consumo de fluido de barrera (propanol) en stand-by con la bomba fría y detenida (etapa Plan 52)', ''],
      ['Reponer propanol por bajo nivel (≈30%) hasta el 70% del visor, coordinando con Sala de Control', cite('POP', 3)],
    ],
  },
  {
    id: 's_gland', t: 'Fuga de producto al exterior por la brida del sello',
    causes: [
      ['Contracción del empaque de PTFE por la baja temperatura: deja de sellar', cite('JC12', 1)],
      ['Brida del sello no asentada metal-metal contra la cavidad, o ranura del empaque deformada', cite('JC12', 1)],
    ],
    checks: [
      ['Empaque de 4.0 × 4.0 mm (resultado satisfactorio en CRIO 4 y PAY-14210) o espirometálico según plano GA-122149-1 rev. C', `${cite('JC12', 2)}; ${cite('JC13', 2)}`],
      ['Verificar con lainas que la cara de la brida y la cara de la cavidad estén completamente juntas', cite('JC12', 1)],
      ['Alojamiento medido en sellos nuevos: 3.0 mm de profundidad × 4.8 mm de ancho', cite('JC12', 3)],
    ],
  },
  {
    id: 's_dry', t: 'Falla prematura del sello o huellas de operación en seco en las caras',
    causes: [
      ['Vaporización del producto en las caras del sello (causa principal identificada)', `${cite('JC13', 1)}; ${cite('ING26', 10)}`],
      ['Cavidad de sellado sin venteo: el sello arranca sin líquido', cite('JC13', 1)],
      ['Presión en la cavidad menor a 30% sobre la presión de vapor (API 682, ítem 6.1.2.14)', cite('JC13', 1)],
      ['Juego radial del buje de garganta excesivo (medido 0.005" frente a 0.002" máx. en CRIO 5)', cite('JC13', 1)],
      ['Roce eje – buje de garganta que calienta la cavidad', cite('JC13', 1)],
      ['Orificio del plan de lavado obstruido (falla típica)', cite('PPP', 'Plan 13/14')],
      ['Descentramiento del eje respecto al alojamiento del sello > 0.002"', cite('JC13', 5)],
    ],
    checks: [
      ['Antes del arranque, la línea de venteo de la cavidad debe estar fría, incluso con hielo', cite('JC13', 2)],
      ['Calcular el margen de presión de vapor en la cavidad (panel hidráulico)', ''],
      ['Verificar temperaturas en los extremos de la tubería del plan de lavado; orificio mínimo 0.125"', cite('PPP', 'Plan 13/14')],
      ['Registrar las mediciones mecánicas de aceptación en la liberación de Mantenimiento', ''],
    ],
  },
  {
    id: 's_nofrost', t: 'La línea del plan 11/13/14 no congela antes del arranque',
    causes: [['Cavidad de sellado sin líquido por venteo insuficiente', cite('JC13', 1)]],
    checks: [
      ['Ventear la cavidad desde el punto más alto de la línea del plan hacia el flare', cite('JC13', 2)],
      ['No arrancar hasta confirmar la línea fría o con hielo', cite('JC13', 2)],
    ],
  },
  {
    id: 's_install', t: 'Instalación del reservorio Plan 52 fuera de recomendación',
    causes: [['Alturas y pendientes de las tuberías del Plan 52 fuera de lo recomendado (observado en CRIO 1 y 2)', cite('JC13', 2)]],
    checks: [
      ['Fondo del reservorio 12–30" sobre la línea central del eje, a no más de 2–3 pies de la vertical del prensaestopas', cite('LEMCO', 2)],
      ['Suministro desde la conexión inferior del reservorio a la entrada inferior de la brida; retorno desde la superior', cite('LEMCO', 2)],
      ['Tubería ≥ 1/2", pendiente ascendente ≥ 1/4" por pie, máximo 6 curvas de radio largo, sin válvulas restrictivas', cite('LEMCO', 2)],
      ['Longitud total de líneas de entrada y salida ≤ 10 pies (3 m)', cite('JC13', 5)],
    ],
  },
  {
    id: 's_fluid', t: 'Fluido de barrera (propanol) del Plan 52 con cambio vencido o contaminado',
    causes: [['Degradación o contaminación del fluido de barrera (propanol)', cite('IOM', 19)]],
    checks: [['Cambiar a las primeras 500 horas y luego cada 6 a 8 meses, o si se contamina; enjuagar el reservorio antes de llenar', cite('IOM', 19)]],
  },
];

/* Criterios de referencia de margen de presión de vapor en la cavidad de sellado. */
const VAPOR_MARGIN = [
  { id: 'jc13', t: 'Presión en la cavidad ≥ 1.30 × presión de vapor (absolutas)', src: cite('JC13', 1) + ' (API 682, ítem 6.1.2.14)', test: (pc, pv) => pc + 14.7 >= 1.3 * (pv + 14.7) },
  { id: 'ing26', t: 'Margen ≥ 50 psi (3.5 bar) entre cavidad y presión de vapor máxima · requisito para la bomba nueva con sello presurizado', src: cite('ING26', 11), test: (pc, pv) => pc - pv >= 50 },
];

const TORQUE_REF = 'Apriete en rondas al 30%, 70% y 100% del torque objetivo, pase en secuencia horaria y quinta ronda de verificación; paralelismo verificado en 4 posiciones a 90° en cada ronda (' + cite('PGRAL', 20) + ').';
