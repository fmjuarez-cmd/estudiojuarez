#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera estudio_juridico_appsheet.xlsx: fuente de datos para AppSheet
de un estudio jurídico de Entre Ríos (familia, laboral, civil/daños,
sucesiones, salud)."""

import sys
from datetime import date, time, timedelta

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table, TableStyleInfo

TODAY = date(2026, 7, 2)
OUT = sys.argv[1] if len(sys.argv) > 1 else "estudio_juridico_appsheet.xlsx"

DATE_FMT = "DD/MM/YYYY"
TIME_FMT = "HH:MM"

HEADER_FILL = PatternFill("solid", fgColor="1F3864")
HEADER_FONT = Font(color="FFFFFF", bold=True)


def add_table(ws, name, n_cols, n_rows):
    """Convierte el rango con datos en Tabla de Excel."""
    ref = f"A1:{get_column_letter(n_cols)}{max(n_rows + 1, 2)}"
    t = Table(displayName=name, ref=ref)
    t.tableStyleInfo = TableStyleInfo(
        name="TableStyleMedium2", showFirstColumn=False, showLastColumn=False,
        showRowStripes=True, showColumnStripes=False)
    ws.add_table(t)


def fill_sheet(ws, headers, rows, date_cols=(), time_cols=(), widths=None):
    ws.append(headers)
    for c in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=c)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(vertical="center")
    for row in rows:
        ws.append(row)
    for col in date_cols:
        for r in range(2, len(rows) + 2):
            ws.cell(row=r, column=col).number_format = DATE_FMT
    for col in time_cols:
        for r in range(2, len(rows) + 2):
            ws.cell(row=r, column=col).number_format = TIME_FMT
    if widths:
        for i, w in enumerate(widths, start=1):
            ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A2"


wb = Workbook()
wb.remove(wb.active)

# ----------------------------------------------------------------------
# Hoja 9 (se crea primero para poder referenciar las listas): Configuracion
# ----------------------------------------------------------------------
LISTAS = {
    "Fuero": ["Familia", "Laboral", "Civil-Daños", "Sucesiones", "Salud"],
    "Juzgado": [
        "Juzgado de Familia Victoria - Dr. Lloveras",
        "Juzgado Civil y Comercial Victoria - Dr. Márquez",
        "Cámara Civil y Comercial Sala 3 Paraná",
        "Secretaría de Trabajo ER",
        "Otro",
    ],
    "Localidad": ["Victoria", "Paraná", "Otra"],
    "Instancia": ["Primera Instancia", "Cámara"],
    "Rol_Cliente": ["Actor", "Demandado", "Tercero"],
    "Estado_Procesal": [
        "Inicio", "Contestación", "Prueba", "Alegatos", "Sentencia",
        "Apelación", "Ejecución de sentencia", "Archivado",
    ],
    "Estado_Causa": ["Activa", "Paralizada", "Archivada", "Finalizada"],
    "Abogado": ["Fernando Martín Juárez", "Socio", "Otro"],
    "Honorarios_Estado": ["Pactado", "Cuota Litis", "Pendiente de cobro"],
    "Tipo_Vencimiento": [
        "Contestar demanda", "Ofrecer prueba", "Alegar", "Apelar",
        "Expresar agravios", "Contestar traslado", "Cumplir intimación", "Otro",
    ],
    "Estado_Vencimiento": ["Pendiente", "Cumplido", "Vencido"],
    "Prioridad": ["Alta", "Media", "Baja"],
    "Tipo_Audiencia": [
        "Conciliación", "Vista de causa", "Testimonial",
        "Absolución de posiciones", "Mediación", "Otra",
    ],
    "Modalidad": ["Presencial", "Virtual"],
    "Estado_Audiencia": ["Programada", "Realizada", "Suspendida", "Reprogramada"],
    "Estado_Tarea": ["Pendiente", "En curso", "Completada"],
    "Tipo_Movimiento": [
        "Escrito presentado", "Providencia", "Cédula", "Oficio",
        "Resolución", "Sentencia",
    ],
    "Tipo_Contacto": [
        "Cliente", "Parte contraria", "Perito", "Testigo",
        "Letrado contrario", "Juzgado-Personal",
    ],
    "Tipo_Comunicacion": [
        "Recordatorio de vencimiento", "Aviso de audiencia",
        "Informe a cliente", "Notificación interna",
    ],
    "Estado_Envio": ["Pendiente", "Enviado", "Error"],
    "Si_No": ["Sí", "No"],
    "Origen_Evento": ["Vencimiento", "Audiencia", "Tarea"],
}

ws_cfg = wb.create_sheet("Configuracion")
for idx, (nombre, valores) in enumerate(LISTAS.items(), start=1):
    col = get_column_letter(idx)
    ws_cfg.cell(row=1, column=idx, value=nombre).font = HEADER_FONT
    ws_cfg.cell(row=1, column=idx).fill = HEADER_FILL
    for r, v in enumerate(valores, start=2):
        ws_cfg.cell(row=r, column=idx, value=v)
    ws_cfg.column_dimensions[col].width = max(len(nombre), *(len(v) for v in valores)) + 3
    rango = f"Configuracion!${col}$2:${col}${len(valores) + 1}"
    wb.defined_names.add(DefinedName(f"Lst_{nombre}", attr_text=rango))
ws_cfg.freeze_panes = "A2"

# Parámetros generales (debajo de las listas, separados)
PARAM_ROW = max(len(v) for v in LISTAS.values()) + 4
ws_cfg.cell(row=PARAM_ROW, column=1, value="PARÁMETROS GENERALES").font = Font(bold=True, size=12)
params = [
    ("Dias_Recordatorio_Default", 3),
    ("Email_Estudio", "fmjuarez@yahoo.com.ar"),
    ("Firma_Mails",
     "Estudio Jurídico Juárez — Victoria, Entre Ríos. "
     "Este es un mensaje automático de recordatorio; no responder a este correo."),
    ("Hora_Envio_Recordatorios", "08:00"),
]
for i, (k, v) in enumerate(params, start=PARAM_ROW + 1):
    ws_cfg.cell(row=i, column=1, value=k).font = Font(bold=True)
    ws_cfg.cell(row=i, column=2, value=v)


def dv_list(ws, list_name, col_letter, last_row=500):
    dv = DataValidation(type="list", formula1=f"=Lst_{list_name}", allow_blank=True)
    dv.error = "Elegí un valor de la lista desplegable."
    dv.errorTitle = "Valor inválido"
    ws.add_data_validation(dv)
    dv.add(f"{col_letter}2:{col_letter}{last_row}")


# ----------------------------------------------------------------------
# 1. Expedientes
# ----------------------------------------------------------------------
ws = wb.create_sheet("Expedientes", 0)
headers = [
    "ID_Expediente", "Caratula", "N_Expediente", "Fuero", "Juzgado",
    "Localidad", "Instancia", "Cliente_Patrocinado", "Rol_Cliente",
    "Parte_Contraria", "Estado_Procesal", "Estado_Causa", "Fecha_Inicio",
    "Fecha_Ultima_Actuacion", "Abogado_Responsable", "Link_MEV",
    "Carpeta_Drive", "Observaciones", "Honorarios_Estado",
]
rows = [
    ["EXP-0001",
     "CENTURIÓN, MARÍA SOLEDAD C/ ROMERO, JORGE DANIEL S/ ALIMENTOS",
     "8452/2026", "Familia", "Juzgado de Familia Victoria - Dr. Lloveras",
     "Victoria", "Primera Instancia", "María Soledad Centurión", "Actor",
     "Jorge Daniel Romero", "Prueba", "Activa",
     date(2026, 2, 10), TODAY - timedelta(days=7), "Fernando Martín Juárez",
     "https://mev.jusentrerios.gov.ar/exp/8452-2026", "",
     "Alimentos a favor de dos hijos menores; se pidió cuota provisoria.",
     "Cuota Litis"],
    ["EXP-0002",
     "GÓMEZ, WALTER ARIEL C/ FRIGORÍFICO DEL LITORAL S.A. S/ COBRO DE PESOS - DESPIDO",
     "3311/2025", "Laboral", "Secretaría de Trabajo ER", "Paraná",
     "Primera Instancia", "Walter Ariel Gómez", "Actor",
     "Frigorífico del Litoral S.A.", "Contestación", "Activa",
     date(2025, 11, 18), TODAY - timedelta(days=12), "Fernando Martín Juárez",
     "", "", "Despido indirecto; diferencias salariales y art. 80 LCT.",
     "Pactado"],
    ["EXP-0003",
     "PÉREZ, LUCIANA C/ TRANSPORTES VICTORIA S.R.L. Y OTRO S/ DAÑOS Y PERJUICIOS",
     "5120/2025", "Civil-Daños",
     "Juzgado Civil y Comercial Victoria - Dr. Márquez", "Victoria",
     "Primera Instancia", "Luciana Pérez", "Actor",
     "Transportes Victoria S.R.L. / La Segunda Seguros", "Prueba", "Activa",
     date(2025, 9, 2), TODAY - timedelta(days=3), "Fernando Martín Juárez",
     "", "", "Accidente de tránsito ruta 11; lesiones leves, citada en garantía la aseguradora.",
     "Cuota Litis"],
    ["EXP-0004",
     "FERNÁNDEZ, RAMÓN ANTONIO S/ SUCESORIO AB INTESTATO",
     "7789/2026", "Sucesiones",
     "Juzgado Civil y Comercial Victoria - Dr. Márquez", "Victoria",
     "Primera Instancia", "Marta Fernández (heredera)", "Actor", "",
     "Inicio", "Activa", date(2026, 5, 20), TODAY - timedelta(days=20),
     "Fernando Martín Juárez", "", "",
     "Declaratoria de herederos; falta partida de defunción legalizada.",
     "Pendiente de cobro"],
    ["EXP-0005",
     "LÓPEZ, ANA BEATRIZ C/ OSDE S/ ACCIÓN DE AMPARO (SALUD)",
     "1044/2026", "Salud", "Cámara Civil y Comercial Sala 3 Paraná",
     "Paraná", "Cámara", "Ana Beatriz López", "Actor", "OSDE",
     "Apelación", "Activa", date(2026, 3, 5), TODAY - timedelta(days=1),
     "Fernando Martín Juárez", "", "",
     "Cobertura de medicación oncológica; sentencia favorable apelada por la demandada.",
     "Pactado"],
]
fill_sheet(ws, headers, rows, date_cols=(13, 14),
           widths=[13, 55, 12, 12, 42, 11, 17, 26, 11, 38, 16, 12, 13, 20, 22, 38, 22, 55, 18])
add_table(ws, "tbl_Expedientes", len(headers), len(rows))
for lst, col in [("Fuero", "D"), ("Juzgado", "E"), ("Localidad", "F"),
                 ("Instancia", "G"), ("Rol_Cliente", "I"),
                 ("Estado_Procesal", "K"), ("Estado_Causa", "L"),
                 ("Abogado", "O"), ("Honorarios_Estado", "S")]:
    dv_list(ws, lst, col)

# ----------------------------------------------------------------------
# 2. Vencimientos
# ----------------------------------------------------------------------
ws = wb.create_sheet("Vencimientos")
headers = [
    "ID_Vencimiento", "ID_Expediente", "Tipo_Vencimiento",
    "Fecha_Notificacion", "Fecha_Vencimiento", "Dias_Otorgados", "Estado",
    "Prioridad", "Responsable", "Dias_Recordatorio_Previo", "Notas",
]
rows = [
    ["VTO-0001", "EXP-0002", "Contestar traslado",
     TODAY - timedelta(days=10), TODAY - timedelta(days=2), 5, "Pendiente",
     "Alta", "Fernando Martín Juárez", 3,
     "Traslado de la liquidación practicada por la demandada. ¡VENCIDO!"],
    ["VTO-0002", "EXP-0001", "Ofrecer prueba",
     TODAY - timedelta(days=5), TODAY + timedelta(days=3), 10, "Pendiente",
     "Alta", "Fernando Martín Juárez", 3,
     "Vence el ofrecimiento de prueba en alimentos; testigos ya confirmados."],
    ["VTO-0003", "EXP-0005", "Expresar agravios",
     TODAY - timedelta(days=1), TODAY + timedelta(days=9), 10, "Pendiente",
     "Alta", "Fernando Martín Juárez", 5,
     "Contestar los agravios de OSDE ante la Cámara."],
    ["VTO-0004", "EXP-0003", "Contestar demanda",
     date(2025, 10, 1), date(2025, 10, 16), 15, "Cumplido",
     "Media", "Fernando Martín Juárez", 3,
     "Contestada en término por la citada en garantía."],
    ["VTO-0005", "EXP-0004", "Cumplir intimación",
     TODAY - timedelta(days=15), TODAY + timedelta(days=20), 30, "Pendiente",
     "Baja", "Fernando Martín Juárez", 5,
     "Acompañar partida de defunción legalizada bajo apercibimiento de archivo."],
]
fill_sheet(ws, headers, rows, date_cols=(4, 5),
           widths=[15, 14, 22, 17, 17, 14, 12, 11, 24, 22, 60])
add_table(ws, "tbl_Vencimientos", len(headers), len(rows))
for lst, col in [("Tipo_Vencimiento", "C"), ("Estado_Vencimiento", "G"),
                 ("Prioridad", "H")]:
    dv_list(ws, lst, col)

# Formato condicional: verde cumplido, rojo vencido, amarillo próx. 5 días
rng = "A2:K500"
ws.conditional_formatting.add(rng, FormulaRule(
    formula=['$G2="Cumplido"'], stopIfTrue=True,
    fill=PatternFill("solid", fgColor="C6EFCE"), font=Font(color="006100")))
ws.conditional_formatting.add(rng, FormulaRule(
    formula=['AND($E2<>"",$E2<TODAY(),$G2<>"Cumplido")'], stopIfTrue=True,
    fill=PatternFill("solid", fgColor="FFC7CE"), font=Font(color="9C0006")))
ws.conditional_formatting.add(rng, FormulaRule(
    formula=['AND($E2<>"",$E2>=TODAY(),$E2<=TODAY()+5,$G2<>"Cumplido")'],
    stopIfTrue=True,
    fill=PatternFill("solid", fgColor="FFEB9C"), font=Font(color="9C5700")))

# ----------------------------------------------------------------------
# 3. Audiencias
# ----------------------------------------------------------------------
ws = wb.create_sheet("Audiencias")
headers = [
    "ID_Audiencia", "ID_Expediente", "Tipo_Audiencia", "Fecha", "Hora",
    "Modalidad", "Lugar_o_Link", "Estado", "Resultado", "Notas_Preparacion",
]
rows = [
    ["AUD-0001", "EXP-0001", "Conciliación", TODAY + timedelta(days=1),
     time(9, 30), "Presencial",
     "Juzgado de Familia Victoria, calle Sarmiento 145", "Programada", "",
     "Llevar propuesta de cuota alimentaria actualizada por IPC."],
    ["AUD-0002", "EXP-0002", "Vista de causa", TODAY + timedelta(days=12),
     time(10, 0), "Presencial", "Secretaría de Trabajo ER, Paraná",
     "Programada", "",
     "Citar a los dos testigos; repasar recibos de sueldo con el cliente."],
    ["AUD-0003", "EXP-0003", "Testimonial", TODAY + timedelta(days=6),
     time(8, 45), "Virtual", "https://meet.google.com/abc-defg-hij",
     "Programada", "",
     "Testigo ocular del accidente; preparar pliego de preguntas."],
    ["AUD-0004", "EXP-0001", "Mediación", TODAY - timedelta(days=30),
     time(11, 0), "Presencial", "Centro de Mediación Victoria",
     "Realizada", "Sin acuerdo; se habilitó la vía judicial.",
     ""],
]
fill_sheet(ws, headers, rows, date_cols=(4,), time_cols=(5,),
           widths=[14, 14, 22, 12, 8, 12, 46, 14, 45, 55])
add_table(ws, "tbl_Audiencias", len(headers), len(rows))
for lst, col in [("Tipo_Audiencia", "C"), ("Modalidad", "F"),
                 ("Estado_Audiencia", "H")]:
    dv_list(ws, lst, col)

# ----------------------------------------------------------------------
# 4. Tareas
# ----------------------------------------------------------------------
ws = wb.create_sheet("Tareas")
headers = [
    "ID_Tarea", "ID_Expediente", "Descripcion", "Fecha_Asignacion",
    "Fecha_Limite", "Responsable", "Prioridad", "Estado", "Notas",
]
rows = [
    ["TAR-0001", "EXP-0004",
     "Tramitar partida de defunción legalizada en el Registro Civil",
     TODAY - timedelta(days=10), TODAY + timedelta(days=10),
     "Fernando Martín Juárez", "Media", "En curso",
     "El Registro Civil de Victoria demora ~7 días hábiles."],
    ["TAR-0002", "EXP-0002", "Redactar alegato sobre la prueba testimonial",
     TODAY - timedelta(days=2), TODAY + timedelta(days=14),
     "Fernando Martín Juárez", "Alta", "Pendiente", ""],
    ["TAR-0003", "EXP-0005",
     "Recopilar historia clínica actualizada y receta de la medicación",
     TODAY - timedelta(days=5), TODAY + timedelta(days=4),
     "Fernando Martín Juárez", "Alta", "En curso",
     "Pedir turno con la médica tratante de la clienta."],
    ["TAR-0004", "",
     "Renovar matrícula y pagar cuota del Colegio de Abogados de Entre Ríos",
     TODAY - timedelta(days=1), TODAY + timedelta(days=25),
     "Fernando Martín Juárez", "Baja", "Pendiente",
     "Tarea general del estudio (sin expediente)."],
    ["TAR-0005", "EXP-0003", "Impulsar pericia mecánica: dejar nota en secretaría",
     TODAY - timedelta(days=20), TODAY - timedelta(days=6),
     "Fernando Martín Juárez", "Media", "Completada",
     "Nota presentada; perito aceptó el cargo."],
]
fill_sheet(ws, headers, rows, date_cols=(4, 5),
           widths=[12, 14, 62, 16, 13, 24, 11, 12, 50])
add_table(ws, "tbl_Tareas", len(headers), len(rows))
for lst, col in [("Prioridad", "G"), ("Estado_Tarea", "H")]:
    dv_list(ws, lst, col)

# ----------------------------------------------------------------------
# 5. Actuaciones_Movimientos
# ----------------------------------------------------------------------
ws = wb.create_sheet("Actuaciones_Movimientos")
headers = ["ID_Movimiento", "ID_Expediente", "Fecha", "Tipo", "Descripcion",
           "Archivo_Adjunto"]
rows = [
    ["MOV-0001", "EXP-0001", date(2026, 2, 10), "Escrito presentado",
     "Demanda de alimentos con beneficio de litigar sin gastos.", ""],
    ["MOV-0002", "EXP-0001", TODAY - timedelta(days=7), "Providencia",
     "Se fija cuota alimentaria provisoria del 25% de los haberes del demandado.", ""],
    ["MOV-0003", "EXP-0002", TODAY - timedelta(days=12), "Cédula",
     "Notificación del traslado de la liquidación.", ""],
    ["MOV-0004", "EXP-0003", TODAY - timedelta(days=3), "Oficio",
     "Oficio a la Comisaría 2ª de Victoria solicitando copia del acta del accidente.", ""],
    ["MOV-0005", "EXP-0005", TODAY - timedelta(days=1), "Resolución",
     "Se concede el recurso de apelación de OSDE en relación y con efecto devolutivo.", ""],
]
fill_sheet(ws, headers, rows, date_cols=(3,),
           widths=[14, 14, 12, 20, 75, 20])
add_table(ws, "tbl_Actuaciones", len(headers), len(rows))
dv_list(ws, "Tipo_Movimiento", "D")

# ----------------------------------------------------------------------
# 6. Contactos
# ----------------------------------------------------------------------
ws = wb.create_sheet("Contactos")
headers = ["ID_Contacto", "Nombre_Completo", "DNI", "Tipo", "Telefono",
           "Email", "Direccion", "ID_Expediente_Relacionado"]
rows = [
    ["CON-0001", "María Soledad Centurión", "32456789", "Cliente",
     "+54 9 3436 55-1234", "msol.centurion@gmail.com",
     "Bv. Sarmiento 234, Victoria, ER", "EXP-0001"],
    ["CON-0002", "Walter Ariel Gómez", "28901234", "Cliente",
     "+54 9 343 555-6789", "walter.gomez78@hotmail.com",
     "Los Ceibos 1120, Paraná, ER", "EXP-0002"],
    ["CON-0003", "Luciana Pérez", "35678901", "Cliente",
     "+54 9 3436 55-9012", "lu.perez@gmail.com",
     "9 de Julio 456, Victoria, ER", "EXP-0003"],
    ["CON-0004", "Ana Beatriz López", "24567890", "Cliente",
     "+54 9 343 555-3456", "anab.lopez@yahoo.com.ar",
     "Av. Ramírez 2130, Paraná, ER", "EXP-0005"],
    ["CON-0005", "Dr. Sergio Malvasio", "22345678", "Letrado contrario",
     "+54 9 343 555-7890", "estudiomalvasio@gmail.com",
     "Urquiza 890, Paraná, ER", "EXP-0002"],
    ["CON-0006", "Ing. Carlos Benítez (perito mecánico)", "20123456", "Perito",
     "+54 9 343 555-2468", "cbenitez.perito@gmail.com",
     "Paraná, ER", "EXP-0003"],
]
fill_sheet(ws, headers, rows,
           widths=[13, 34, 11, 18, 20, 30, 34, 24])
add_table(ws, "tbl_Contactos", len(headers), len(rows))
dv_list(ws, "Tipo_Contacto", "D")

# ----------------------------------------------------------------------
# 7. Comunicaciones_Mails
# ----------------------------------------------------------------------
ws = wb.create_sheet("Comunicaciones_Mails")
headers = ["ID_Comunicacion", "ID_Expediente", "Fecha", "Tipo",
           "Destinatario", "Asunto", "Cuerpo_Mensaje", "Estado_Envio",
           "Enviado_Por_Bot"]
rows = [
    ["COM-0001", "EXP-0001", TODAY - timedelta(days=1),
     "Aviso de audiencia", "msol.centurion@gmail.com",
     "Recordatorio: audiencia de conciliación 03/07/2026 9:30 hs",
     "Estimada María Soledad: le recordamos la audiencia de conciliación fijada para "
     "mañana a las 9:30 hs en el Juzgado de Familia de Victoria. Concurrir con DNI.",
     "Enviado", "Sí"],
    ["COM-0002", "EXP-0002", TODAY - timedelta(days=2),
     "Recordatorio de vencimiento", "fmjuarez@yahoo.com.ar",
     "URGENTE: vence contestación de traslado (VTO-0001)",
     "Recordatorio automático: el traslado de la liquidación en GÓMEZ c/ FRIGORÍFICO "
     "vence el 30/06/2026. Quedan menos de 3 días.",
     "Enviado", "Sí"],
    ["COM-0003", "EXP-0005", TODAY, "Informe a cliente",
     "anab.lopez@yahoo.com.ar",
     "Estado de su amparo de salud contra OSDE",
     "Estimada Ana: le informamos que OSDE apeló la sentencia. Presentaremos la "
     "contestación de agravios dentro del plazo legal. La mantendremos al tanto.",
     "Pendiente", "No"],
]
fill_sheet(ws, headers, rows, date_cols=(3,),
           widths=[16, 14, 12, 26, 28, 50, 80, 13, 15])
add_table(ws, "tbl_Comunicaciones", len(headers), len(rows))
for lst, col in [("Tipo_Comunicacion", "D"), ("Estado_Envio", "H"),
                 ("Si_No", "I")]:
    dv_list(ws, lst, col)

# ----------------------------------------------------------------------
# 8. Calendario_Vista
# ----------------------------------------------------------------------
ws = wb.create_sheet("Calendario_Vista")
headers = ["ID_Evento", "Origen", "ID_Origen", "Titulo", "Fecha", "Hora",
           "ID_Expediente", "Color_Sugerido"]
rows = [
    ["EVT-0001", "Vencimiento", "VTO-0001",
     "GÓMEZ c/ FRIGORÍFICO — Contestar traslado", TODAY - timedelta(days=2),
     None, "EXP-0002", "Rojo"],
    ["EVT-0002", "Vencimiento", "VTO-0002",
     "CENTURIÓN c/ ROMERO — Ofrecer prueba", TODAY + timedelta(days=3),
     None, "EXP-0001", "Rojo"],
    ["EVT-0003", "Vencimiento", "VTO-0003",
     "LÓPEZ c/ OSDE — Expresar agravios", TODAY + timedelta(days=9),
     None, "EXP-0005", "Naranja"],
    ["EVT-0004", "Audiencia", "AUD-0001",
     "CENTURIÓN c/ ROMERO — Conciliación", TODAY + timedelta(days=1),
     time(9, 30), "EXP-0001", "Azul"],
    ["EVT-0005", "Audiencia", "AUD-0003",
     "PÉREZ c/ TRANSPORTES VICTORIA — Testimonial", TODAY + timedelta(days=6),
     time(8, 45), "EXP-0003", "Azul"],
    ["EVT-0006", "Audiencia", "AUD-0002",
     "GÓMEZ c/ FRIGORÍFICO — Vista de causa", TODAY + timedelta(days=12),
     time(10, 0), "EXP-0002", "Azul"],
    ["EVT-0007", "Tarea", "TAR-0003",
     "LÓPEZ c/ OSDE — Recopilar historia clínica", TODAY + timedelta(days=4),
     None, "EXP-0005", "Verde"],
    ["EVT-0008", "Tarea", "TAR-0001",
     "SUC. FERNÁNDEZ — Partida de defunción", TODAY + timedelta(days=10),
     None, "EXP-0004", "Verde"],
]
fill_sheet(ws, headers, rows, date_cols=(5,), time_cols=(6,),
           widths=[12, 13, 12, 52, 12, 8, 14, 15])
add_table(ws, "tbl_Calendario", len(headers), len(rows))
dv_list(ws, "Origen_Evento", "B")

# ----------------------------------------------------------------------
# 10. Notas_para_AppSheet (texto, no tabla)
# ----------------------------------------------------------------------
ws = wb.create_sheet("Notas_para_AppSheet")
ws.column_dimensions["A"].width = 130
NOTAS = """NOTAS TÉCNICAS PARA CONFIGURAR LA APP EN APPSHEET
==================================================

1) COLUMNAS KEY (clave) POR TABLA
   - tbl_Expedientes      -> ID_Expediente
   - tbl_Vencimientos     -> ID_Vencimiento
   - tbl_Audiencias       -> ID_Audiencia
   - tbl_Tareas           -> ID_Tarea
   - tbl_Actuaciones      -> ID_Movimiento
   - tbl_Contactos        -> ID_Contacto
   - tbl_Comunicaciones   -> ID_Comunicacion
   - tbl_Calendario       -> ID_Evento
   Sugerencia: en cada tabla, poné como Initial Value de la key:
   CONCATENATE("VTO-", RIGHT("0000"&(COUNT(Vencimientos[ID_Vencimiento])+1), 4))
   o usá UNIQUEID() si preferís claves automáticas.

2) COLUMNAS REF (relaciones)
   - Vencimientos.ID_Expediente            -> Ref a Expedientes (Is a part of: ON)
   - Audiencias.ID_Expediente              -> Ref a Expedientes (Is a part of: ON)
   - Tareas.ID_Expediente                  -> Ref a Expedientes (permitir blanco: tareas generales)
   - Actuaciones_Movimientos.ID_Expediente -> Ref a Expedientes (Is a part of: ON)
   - Contactos.ID_Expediente_Relacionado   -> Ref a Expedientes
   - Comunicaciones_Mails.ID_Expediente    -> Ref a Expedientes
   - Comunicaciones_Mails.Destinatario     -> puede quedar como Email o convertirse en Ref a Contactos
   - Calendario_Vista.ID_Expediente        -> Ref a Expedientes
   AppSheet creará automáticamente las columnas inversas Related Vencimientos,
   Related Audiencias, etc. en Expedientes: usalas en la vista Detail del expediente.

3) COLUMNAS ENUM (Valid If)
   Usar la hoja Configuracion como origen, p. ej. Valid If de Fuero:
   Configuracion[Fuero]  — o copiar los valores como Enum fijo en la columna.
   Columnas: Fuero, Juzgado, Localidad, Instancia, Rol_Cliente, Estado_Procesal,
   Estado_Causa, Abogado_Responsable, Honorarios_Estado, Tipo_Vencimiento,
   Estado (Vencimientos/Tareas/Audiencias), Prioridad, Tipo_Audiencia, Modalidad,
   Tipo (Actuaciones/Contactos/Comunicaciones), Estado_Envio, Enviado_Por_Bot.
   Actuaciones_Movimientos.Archivo_Adjunto -> tipo File.

4) VIRTUAL COLUMNS SUGERIDAS
   En Vencimientos:
   - Dias_Restantes (Number):  HOUR([Fecha_Vencimiento] - TODAY()) / 24
   - Semaforo_Vencimiento (Text):
     IFS([Estado]="Cumplido","🟢",
         [Fecha_Vencimiento]<TODAY(),"🔴",
         [Fecha_Vencimiento]<=TODAY()+5,"🟡",
         TRUE,"⚪")
   En Audiencias:
   - Es_Manana (Yes/No): [Fecha] = TODAY()+1
   En Expedientes:
   - Vencimientos_Pendientes_Count:
     COUNT(SELECT([Related Vencimientos][ID_Vencimiento], [Estado]="Pendiente"))

5) SLICES SUGERIDAS
   - Vencimientos_Pendientes:      [Estado]="Pendiente"
   - Vencimientos_Urgentes:        AND([Estado]="Pendiente", [Fecha_Vencimiento]<=TODAY()+5)
   - Audiencias_Proximas_7_dias:   AND([Estado]="Programada", [Fecha]>=TODAY(), [Fecha]<=TODAY()+7)
   - Tareas_Abiertas:              [Estado]<>"Completada"
   - Expedientes_Activos:          [Estado_Causa]="Activa"

6) BOTS (Automation)
   BOT 1 — Sincronizar con Google Calendar:
     Evento: Data change (Adds & updates) en Vencimientos y en Audiencias.
     Proceso: step "Call a task" > Google Calendar > Create/Update event.
     Título: [ID_Expediente].[Caratula] & " — " & [Tipo_Vencimiento] (o Tipo_Audiencia).
     Requiere conectar la cuenta de Google Calendar como fuente de datos en AppSheet
     (Data > Add new Data > Google Calendar) y usar "Add a row to another table".
   BOT 2 — Recordatorio diario de vencimientos (8:00):
     Evento: Schedule, todos los días 8:00, tabla Vencimientos, ForEachRowInTable ON.
     Condición: AND([Estado]="Pendiente", [Dias_Restantes]<=[Dias_Recordatorio_Previo])
     Paso 1: Send an email (Gmail) al Responsable / Email_Estudio con caratula,
             tipo y fecha de vencimiento.
     Paso 2: Add a new row a Comunicaciones_Mails registrando el envío
             (Tipo="Recordatorio de vencimiento", Enviado_Por_Bot="Sí").
   BOT 3 — Aviso de audiencias del día siguiente:
     Evento: Schedule diario (p. ej. 18:00), tabla Audiencias.
     Condición: AND([Estado]="Programada", [Fecha]=TODAY()+1)
     Acción: mail al cliente (Ref a Contactos) y al abogado + registro en
             Comunicaciones_Mails (Tipo="Aviso de audiencia").

7) VISTA CALENDARIO
   - Crear una vista tipo Calendar sobre la tabla Calendario_Vista
     (Start: Fecha, End: Fecha, Category/Color: Origen o Color_Sugerido).
   - Alternativa recomendada para evitar duplicar datos: en lugar de la hoja física,
     crear TRES vistas Calendar (Vencimientos, Audiencias, Tareas) o mantener
     Calendario_Vista alimentada por el Bot 1 cada vez que se crea un evento.
   - Agrupar/colorear por Origen: Vencimiento=Rojo, Audiencia=Azul, Tarea=Verde.

8) ORDEN SUGERIDO DE CONFIGURACIÓN
   1. Subir este Excel a Google Drive y crear la app desde AppSheet (Start with your data).
   2. Verificar que AppSheet detecte las 8 tablas (Configuracion y esta hoja NO se agregan como tablas).
   3. Configurar Keys, Refs y Enums (puntos 1-3).
   4. Crear Virtual Columns y Slices (puntos 4-5).
   5. Crear las vistas (Deck de Expedientes, Calendar, Detail con Related).
   6. Configurar los Bots (punto 6) conectando Gmail y Google Calendar.
   7. Probar con los datos de ejemplo y después borrarlos.
"""
for i, line in enumerate(NOTAS.splitlines(), start=1):
    c = ws.cell(row=i, column=1, value=line)
    if line and (line[0].isdigit() or line.startswith("NOTAS") or line.startswith("=")):
        c.font = Font(bold=True) if not line.startswith("=") else Font(bold=True)

ORDEN = ["Expedientes", "Vencimientos", "Audiencias", "Tareas",
         "Actuaciones_Movimientos", "Contactos", "Comunicaciones_Mails",
         "Calendario_Vista", "Configuracion", "Notas_para_AppSheet"]
wb._sheets.sort(key=lambda s: ORDEN.index(s.title))

wb.save(OUT)
print(f"OK -> {OUT}")
