# Biblioteca Técnica — Bombas de Reflujo Afton

> Uso: referencia documental del piloto. Los documentos internos originales NO se almacenan en este repositorio público. Esta biblioteca registra títulos, alcance y reglas extraídas; los PDF deben mantenerse en almacenamiento privado/autorizado.

## Afton / Bombas verticales criogénicas
- `40824_IOM_Manual-r0 REFLUJO.en.es.pdf` — IOM de bombas de reflujo Afton.
- `ANEXO 10 Propuesta económica 2 Afton Pump Motobomba ILVS-E-3X4X11 40 HP.pdf` — información de motobomba ILVS.
- `Informe Complementario Pluspetrol- Bombas Crio.pdf`.

## Sellos mecánicos / John Crane / API Plans
- `Manual Instalação - Planos API 52_53 (Inglés).pdf`.
- `Piping_Plan_Pocket_Pal.pdf`.
- `Buffer and Barrier Fluids.pdf`.
- `Sello Mecanico PAY-14225.pdf`.
- `LP52-54N1-REDA1.pdf`.
- `Catalog type 48.pdf`.

## Operaciones PPC
- `PEPDG-OPS-POP-005002 OPERACION NORMAL EN CRIOGÉNICA 3, 4 y 5.pdf`.

## Torque PPC
- `PGRAL-100-IN-M-001-Rev 2 - Instructivo de ensamble y desensamble de uniones empernadas en bridas.pdf`.
- `PROTOCOLO DE TORQUE_1000023578.pdf`.

# Motor de torque — reglas documentales

## Selección obligatoria antes de mostrar torque
1. Tipo de junta: RF/FF, RTJ o dieléctrica.
2. NPS de brida.
3. Clase de brida.
4. Condición del perno: desnudo + Molykote 1000, Xylan 1424 o Xylan 1070.
5. Materiales/empaque aplicables según instructivo.
6. Confirmar si instalación está en operación o es nueva instalación.

No se debe inferir un torque si falta alguno de los datos que condicionan la tabla. Para juntas dieléctricas, el torque objetivo debe ser suministrado por el proveedor de la junta.

## Tolerancias de alineación del instructivo
- Paralelismo de caras: 1/32 in (0.8 mm) en O.D. de la brida.
- Desalineamiento: 1/16 in (1.5 mm).
- Separación de caras: máximo 2 veces el espesor del empaque.
- Alineación de agujeros de pernos: 1/8 in (3 mm).
- Ingresos/descargas de bombas y otros equipos rotativos: prevalecen tolerancias del vendedor u hoja técnica del proveedor.

## Secuencia RF/FF y RTJ
- Ajuste manual inicial y patrón cruzado.
- Primera ronda: aproximadamente 30% del torque objetivo.
- Segunda ronda: aproximadamente 70% del torque objetivo.
- Tercera ronda: 100% torque objetivo en patrón cruzado, repetir hasta que no se observe rotación.
- Durante corrección de paralelismo en tercera ronda, no superar 110% del torque objetivo; si no se logra tolerancia, detener y escalar.
- Cuarta ronda / pase reloj: secuencia rotacional horaria al 100% hasta que no rote ninguna tuerca.
- Quinta ronda: sólo bajo las condiciones indicadas en el instructivo; si la instalación está en operación requiere aprobación de gerencia de campo.
- Verificar paralelismo en cada ronda: 4 posiciones a 90° hasta 8 espárragos; más posiciones para >8, por ejemplo cada 45°.

## Fuga durante prueba
El instructivo indica identificar la fuga, solicitar despresurización al 50% de la presión de prueba y repetir tercera/cuarta ronda desde la zona de fuga aplicando 110% del torque objetivo. Si la fuga persiste: despresurizar completamente, reinspeccionar superficies de sello, reemplazar empaque/anillo según junta, reensamblar y repetir prueba. Esta lógica debe implementarse como flujo controlado, nunca como botón libre de '+10%'.

# Tabla PPC — WN/RF, pernos desnudos + Molykote 1000 (ft-lb)

| NPS | 150# min-max | 300# min-max | 600# min-max |
|---|---:|---:|---:|
| 1/2 | 30-35 | 35-40 | 35-40 |
| 3/4 | 30-35 | 65-75 | 65-80 |
| 1 | 30-35 | 65-75 | 65-80 |
| 1 1/4 | 30-35 | 65-75 | 75-90 |
| 1 1/2 | 35-40 | 115-135 | 135-150 |
| 2 | 75-85 | 65-75 | 75-90 |
| 2 1/2 | 85-90 | 115-135 | 135-150 |
| 3 | 85-95 | 125-145 | 135-150 |
| 4 | 75-85 | 125-145 | 235-250 |
| 5 | 120-145 | 125-145 | 360-380 |
| 6 | 140-155 | 125-145 | 335-360 |
| 8 | 150-155 | 215-240 | 525-560 |
| 10 | 200-250 | 310-365 | 660-735 |
| 12 | 200-250 | 435-535 | 660-735 |
| 14 | 315-370 | 435-535 | 825-985 |
| 16 | 290-350 | 605-690 | 1170-1290 |
| 18 | 435-505 | 605-690 | 1500-1640 |
| 20 | 435-505 | 605-690 | 1500-1640 |
| 24 | 590-685 | 1070-1305 | 2360-2540 |

Nota: los valores anteriores corresponden a la Tabla 6 del instructivo PPC y sus condiciones específicas. El torque mínimo sólo podrá aplicarse para instalaciones en operación; para nuevas instalaciones el instructivo requiere calcular el torque objetivo final según su metodología.

# Tabla PPC — RTJ, pernos desnudos + Molykote 1000 (ft-lb)

| NPS | 900# min-max | 1500# min-max | 2500# min-max |
|---|---:|---:|---:|
| 1/2 | 120-150 | 120-160 | 150-170 |
| 3/4 | 120-150 | 130-160 | 150-170 |
| 1 | 190-240 | 210-245 | 230-280 |
| 1 1/4 | 190-240 | 225-255 | 375-455 |
| 1 1/2 | 285-380 | 335-380 | 545-660 |
| 2 | 190-255 | 235-255 | 375-415 |
| 2 1/2 | 285-380 | 335-380 | 545-600 |
| 3 | 235-255 | 515-555 | 750-840 |
| 4 | 470-605 | 720-800 | 1335-1480 |
| 5 | 680-760 | 1250-1350 | 2140-2380 |
| 6 | 490-550 | 990-1030 | 3235-3590 |
| 8 | 880-1030 | 1640-1730 | 3235-3590 |
| 10 | 880-1030 | 2520-2680 | 6400-7090 |
| 12 | 880-1030 | 3100-3265 | 8520-9325 |

Las tablas Xylan 1424 y Xylan 1070 también están en el instructivo y deben mantenerse como datasets separados; nunca se debe reutilizar el torque de perno desnudo para un perno recubierto.
