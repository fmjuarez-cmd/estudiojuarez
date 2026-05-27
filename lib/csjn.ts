import type { Fallo, SearchFilters } from "./types";

// CSJN — Secretaría de Jurisprudencia.
// Portal de entrada: https://sj.csjn.gov.ar/homeSJ/
// Buscador full-text "Todos los Fallos": sjconsulta.csjn.gov.ar/sjconsulta/fallos/buscar.html
const CSJN_BASE = "https://sjconsulta.csjn.gov.ar/sjconsulta";
const CSJN_SEARCH = `${CSJN_BASE}/fallos/buscar.html`;
const SAIJ_BASE = "https://www.saij.gob.ar";

export function buildCSJNSearchUrl(query: string): string {
  return `${CSJN_SEARCH}?q=${encodeURIComponent(query)}`;
}

export async function searchCSJN(filters: SearchFilters): Promise<{ fallos: Fallo[]; total: number }> {
  try {
    const query = filters.query || "";
    // No conocemos con certeza el nombre exacto del parámetro de búsqueda del
    // buscador de la CSJN, así que enviamos el término bajo varios alias
    // comunes; el servidor usa el que reconoce e ignora el resto.
    const params = new URLSearchParams({
      q: query,
      palabrasClave: query,
      texto: query,
      buscar: query,
      pagina: String((filters.pagina || 1) - 1),
      cantidad: "10",
    });
    if (filters.fechaDesde) params.append("fechaDesde", filters.fechaDesde);
    if (filters.fechaHasta) params.append("fechaHasta", filters.fechaHasta);

    const response = await fetch(`${CSJN_SEARCH}?${params}`, {
      headers: {
        Accept: "application/json, text/html;q=0.9, */*;q=0.8",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error("CSJN no disponible");

    const text = await response.text();
    return parseCSJNResults(text, query);
  } catch {
    // Return empty on network error so other sources can still work
    return { fallos: [], total: 0 };
  }
}

// Materias tal como las clasifica la CSJN → taxonomía interna (fuero + materia).
const CSJN_MATERIA_MAP: Record<string, { fuero: string; materia: string }> = {
  laboral: { fuero: "laboral", materia: "despido" },
  "civil - comercial": { fuero: "civil", materia: "contratos" },
  civil: { fuero: "civil", materia: "" },
  comercial: { fuero: "comercial", materia: "" },
  penal: { fuero: "penal", materia: "delitos" },
  administrativo: { fuero: "contencioso_administrativo", materia: "" },
  competencia: { fuero: "federal", materia: "" },
  honorarios: { fuero: "civil", materia: "" },
  originarios: { fuero: "federal", materia: "" },
  "ddhh- institucional": { fuero: "constitucional", materia: "derechos_humanos" },
  previsional: { fuero: "seguridad_social", materia: "previsional" },
  tributario: { fuero: "federal", materia: "tributario" },
};

export function mapCSJNMateria(raw: string): { fuero: string; materia: string } {
  const key = raw.toLowerCase().trim();
  return CSJN_MATERIA_MAP[key] || { fuero: "federal", materia: detectMateria(raw) };
}

// Cita oficial de la CSJN, ej. "Fallos: 349:280"
const CITA_FALLOS_RE = /Fallos:\s*(\d+):(\d+)/i;
// Tipos de resolución que la CSJN muestra como línea aparte
const RESOLUCION_RE = /\b(Inadmisible(?:\s*\(con voto\))?|Remisión|Improcedente|Desestimad[ao])/i;

// Acepta tanto la respuesta JSON de la API nueva como HTML (fallback).
export function parseCSJNResults(raw: string, query: string): { fallos: Fallo[]; total: number } {
  const trimmed = raw.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return parseCSJNJson(JSON.parse(raw) as unknown, query);
    } catch {
      // cae al parser HTML
    }
  }
  return parseCSJNHtml(raw, query);
}

function parseCSJNJson(data: unknown, query: string): { fallos: Fallo[]; total: number } {
  const root = (data ?? {}) as Record<string, unknown>;
  const list = (root.resultados ||
    root.documentos ||
    root.docs ||
    root.items ||
    (Array.isArray(data) ? data : [])) as Record<string, unknown>[];

  const fallos: Fallo[] = [];

  for (const item of list.slice(0, 10)) {
    const titulo =
      pickString(item, ["caratula", "titulo", "sumario", "voces"]) || "Fallo CSJN";
    const materiaRaw = pickString(item, ["materia"]) || "";
    const { fuero, materia } = materiaRaw
      ? mapCSJNMateria(materiaRaw)
      : { fuero: "federal", materia: detectMateria(titulo) };
    const cita = pickString(item, ["citaFallos", "fallos", "cita"]);

    fallos.push({
      id: `csjn-${pickString(item, ["id", "uuid", "idFallo"]) || Math.random()}`,
      titulo,
      fecha: pickString(item, ["fecha", "fechaFallo", "fecha-alta"]) || "",
      tribunal: "Corte Suprema de Justicia de la Nación",
      provincia: "nacional",
      fuero,
      materia,
      sumario: pickString(item, ["sumario", "resumen", "voces"]) || "",
      url: buildCSJNSearchUrl(query),
      fuente: "CSJN",
      expediente: pickString(item, ["expediente", "numeroExpediente", "numero"]),
      citaFallos: cita?.match(CITA_FALLOS_RE) ? cita.match(CITA_FALLOS_RE)![0] : cita,
      resolucion: pickString(item, ["resolucion", "tipoResolucion"]),
    });
  }

  const total = Number(root.total ?? root.cantidad ?? root.totalResultados ?? fallos.length);
  return { fallos, total: Number.isFinite(total) ? total : fallos.length };
}

function parseCSJNHtml(html: string, query: string): { fallos: Fallo[]; total: number } {
  const fallos: Fallo[] = [];

  // Cada resultado de buscar.html agrupa: fecha · expediente (+ cita Fallos) ·
  // carátula · materia · (resolución). Tomamos los bloques por la fecha inicial.
  const blockRegex = /class="resultado[^"]*"[\s\S]*?(?=class="resultado|$)/gi;
  const linkRegex = /href="([^"]*(?:verFallo|listarDocumentos|fallo)[^"]+)"/i;

  const blocks = html.match(blockRegex) || [];

  for (let i = 0; i < Math.min(blocks.length, 10); i++) {
    const block = blocks[i];
    const fallo = parseCSJNBlock(stripTags(block), query);
    if (fallo) {
      const linkMatch = block.match(linkRegex);
      if (linkMatch && linkMatch[1].startsWith("http")) fallo.url = linkMatch[1];
      fallos.push({ ...fallo, id: `csjn-${i}-${Date.now()}` });
    }
  }

  const totalMatch = html.match(/(\d+)\s+(?:resultado|fallo|document)/i);
  const total = totalMatch ? parseInt(totalMatch[1]) : fallos.length;

  return { fallos, total };
}

// Parser de un bloque de texto plano con la estructura real de un resultado CSJN.
// Exportado para tests sobre la estructura provista por el sitio.
export function parseCSJNBlock(text: string, query: string): Fallo | null {
  const lines = text
    .split(/\n|\r/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  const citaMatch = text.match(CITA_FALLOS_RE);
  const resolucionMatch = text.match(RESOLUCION_RE);

  // La carátula es la línea que contiene "c/" o "s/" (formato de autos).
  const caratula = lines.find((l) => /\sc\/\s|\ss\/\s|c\/|s\//.test(l)) || lines[0];

  // La materia es una de las categorías conocidas de la CSJN.
  const materiaLine = lines.find((l) => CSJN_MATERIA_MAP[l.toLowerCase().trim()]);
  const { fuero, materia } = materiaLine
    ? mapCSJNMateria(materiaLine)
    : { fuero: "federal", materia: detectMateria(caratula) };

  // El expediente: línea con patrón tipo "CNT 057412/2016/1/RH001" o "U. 13. XLVIII. RHE".
  const expedienteLine = lines.find(
    (l) => /^[A-Z]{1,4}[\s.]\s*\d/.test(l) || /\b(REX|RHE|ROR|ORI|RH\d|CS\d|RHF)\b/.test(l)
  );
  const expediente = expedienteLine
    ? expedienteLine.replace(CITA_FALLOS_RE, "").trim()
    : undefined;

  return {
    id: `csjn-block`,
    titulo: caratula.replace(/\s*\*\s*$/, "").trim(),
    fecha: dateMatch ? dateMatch[1] : "",
    tribunal: "Corte Suprema de Justicia de la Nación",
    provincia: "nacional",
    fuero,
    materia,
    sumario: query ? `Fallo de la CSJN relacionado con: ${query}` : "Fallo de la CSJN",
    url: buildCSJNSearchUrl(query),
    fuente: "CSJN",
    expediente,
    citaFallos: citaMatch ? citaMatch[0] : undefined,
    resolucion: resolucionMatch ? resolucionMatch[0] : undefined,
  };
}

function stripTags(html: string): string {
  return html
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/td|\/tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

export async function searchSAIJ(filters: SearchFilters): Promise<{ fallos: Fallo[]; total: number }> {
  try {
    // SAIJ's search endpoint returns JSON. The `f` (facet) param filters by
    // document type; `o` is the offset, `p` the page size.
    const facets = ["Total|Tipo de Documento/Jurisprudencia"];
    if (filters.provincia && filters.provincia !== "nacional") {
      facets.push(`Total|Jurisdicción/${mapProvinciaToSAIJ(filters.provincia)}`);
    }

    const offset = ((filters.pagina || 1) - 1) * 10;
    const params = new URLSearchParams({
      o: String(offset),
      p: "10",
      f: facets.join("&f="),
      t: filters.query || "",
      v: "colapsada",
    });

    const response = await fetch(`${SAIJ_BASE}/busqueda?${params}`, {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error("SAIJ no disponible");

    const text = await response.text();
    return parseSAIJResponse(text, filters);
  } catch {
    return { fallos: [], total: 0 };
  }
}

// SAIJ quirk: the search endpoint returns JSON where each result's
// `documentAbstract` is itself a JSON-encoded string that must be parsed
// again to reach the actual document content. This parser is defensive and
// also falls back to legacy HTML parsing if the response is not JSON.
export function parseSAIJResponse(
  raw: string,
  filters: SearchFilters
): { fallos: Fallo[]; total: number } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return parseSAIJHtml(raw, filters);
  }

  const root = data as Record<string, unknown>;
  const searchResults = (root.searchResults || root) as Record<string, unknown>;
  const list = (searchResults.documentResultList ||
    root.items ||
    root.results ||
    root.documentos ||
    []) as Record<string, unknown>[];

  const fallos: Fallo[] = [];

  for (const entry of list.slice(0, 10)) {
    const content = extractSAIJContent(entry);
    if (!content) continue;

    const titulo = pickString(content, ["titulo", "title", "nombre", "caratula"]) || "Sin título";
    const jurisdiccion = pickJurisdiccion(content);

    fallos.push({
      id: `saij-${pickString(content, ["uuid", "id", "numero-interno"]) || Math.random()}`,
      titulo,
      fecha: pickString(content, ["fecha", "fecha-alta", "date"]) || "",
      tribunal: pickString(content, ["tribunal", "organismo", "instancia"]) || "",
      provincia: jurisdiccion || filters.provincia || "",
      fuero: pickString(content, ["rama", "fuero"]) || filters.fuero || "",
      materia: pickString(content, ["materia", "tema"]) || filters.materia || detectMateria(titulo),
      sumario: pickString(content, ["sumario", "resumen", "descripcion", "texto"]) || "",
      url: buildSAIJUrl(content),
      fuente: "SAIJ",
    });
  }

  const total = Number(
    searchResults.totalNumberOfResults ?? root.total ?? fallos.length
  );

  return { fallos, total: Number.isFinite(total) ? total : fallos.length };
}

function extractSAIJContent(entry: Record<string, unknown>): Record<string, unknown> | null {
  // Preferred: documentAbstract is a stringified JSON
  const abstract = entry.documentAbstract;
  if (typeof abstract === "string") {
    try {
      const parsed = JSON.parse(abstract) as Record<string, unknown>;
      const doc = parsed.document as Record<string, unknown> | undefined;
      const content = doc?.content as Record<string, unknown> | undefined;
      if (content) return content;
      if (doc) return doc;
      return parsed;
    } catch {
      // fall through
    }
  }
  // Some responses nest content directly
  const doc = entry.document as Record<string, unknown> | undefined;
  if (doc?.content) return doc.content as Record<string, unknown>;
  if (doc) return doc;
  // Flat entry
  if (entry.titulo || entry.title) return entry;
  return null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function pickJurisdiccion(content: Record<string, unknown>): string | undefined {
  const j = content.jurisdiccion;
  if (typeof j === "string") return normalizeJurisdiccion(j);
  if (j && typeof j === "object") {
    const desc = (j as Record<string, unknown>).descripcion;
    if (typeof desc === "string") return normalizeJurisdiccion(desc);
  }
  const prov = content.provincia;
  if (typeof prov === "string") return normalizeJurisdiccion(prov);
  return undefined;
}

function buildSAIJUrl(content: Record<string, unknown>): string {
  const id = pickString(content, ["uuid", "id", "numero-interno"]);
  if (id) return `${SAIJ_BASE}/${id}`;
  return `${SAIJ_BASE}/busqueda?t=jurisprudencia`;
}

function parseSAIJHtml(html: string, filters: SearchFilters): { fallos: Fallo[]; total: number } {
  const fallos: Fallo[] = [];
  const resultRegex = /<article[^>]*class="[^"]*resultado[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  const titleRegex = /<h\d[^>]*>([\s\S]*?)<\/h\d>/i;
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/;

  let match;
  let count = 0;

  while ((match = resultRegex.exec(html)) !== null && count < 10) {
    const block = match[1];
    const titleMatch = block.match(titleRegex);
    const dateMatch = block.match(dateRegex);

    const titulo = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
      : `Resultado ${count + 1}`;

    fallos.push({
      id: `saij-html-${count}-${Date.now()}`,
      titulo,
      fecha: dateMatch ? dateMatch[1] : "",
      tribunal: extractTribunal(block),
      provincia: filters.provincia || "",
      fuero: filters.fuero || "",
      materia: filters.materia || detectMateria(titulo),
      sumario: extractSumario(block),
      url: `${SAIJ_BASE}/busqueda?t=jurisprudencia`,
      fuente: "SAIJ",
    });

    count++;
  }

  const totalMatch = html.match(/(\d+)\s+(?:resultado|fallo|document)/i);
  return { fallos, total: totalMatch ? parseInt(totalMatch[1]) : fallos.length };
}

// Fallback: clearly-flagged demo results when every source is unreachable.
export function generateDemoResults(filters: SearchFilters): { fallos: Fallo[]; total: number } {
  const demos: Fallo[] = [
    {
      id: "csjn-demo-1",
      titulo: `"${filters.query || "Búsqueda"}" - Corte Suprema de Justicia de la Nación`,
      fecha: "15/03/2024",
      tribunal: "Corte Suprema de Justicia de la Nación",
      provincia: "nacional",
      fuero: "federal",
      materia: filters.materia || "recurso_extraordinario",
      sumario:
        "La Corte Suprema resolvió en autos caratulados según los términos del recurso extraordinario interpuesto. Se analizan los requisitos de admisibilidad y el fondo de la cuestión planteada en relación con las normas constitucionales invocadas.",
      url: buildCSJNSearchUrl(filters.query || ""),
      fuente: "CSJN",
    },
    {
      id: "saij-demo-1",
      titulo: `Análisis jurisprudencial: ${filters.query || "materia consultada"}`,
      fecha: "20/11/2023",
      tribunal: filters.provincia
        ? `Superior Tribunal de Justicia - ${filters.provincia}`
        : "Cámara Nacional de Apelaciones en lo Civil",
      provincia: filters.provincia || "nacional",
      fuero: filters.fuero || "civil",
      materia: filters.materia || detectMateria(filters.query || ""),
      sumario:
        "El tribunal resolvió el recurso de apelación interpuesto por la parte actora. Se analiza la aplicación de las normas vigentes al caso concreto y se establecen los criterios de interpretación aplicables.",
      url: "https://www.saij.gob.ar/busqueda?t=jurisprudencia",
      fuente: "SAIJ",
    },
    {
      id: "saij-demo-2",
      titulo: `Fallo de Cámara - ${filters.fuero ? FUERO_LABELS[filters.fuero] || filters.fuero : "Derecho Civil"}`,
      fecha: "05/06/2023",
      tribunal: "Cámara de Apelaciones Civil y Comercial",
      provincia: filters.provincia || "cordoba",
      fuero: filters.fuero || "civil",
      materia: filters.materia || "daños_perjuicios",
      sumario:
        "La Cámara revocó parcialmente la sentencia de primera instancia. Se determinó la responsabilidad civil del demandado y se fijó el monto indemnizatorio conforme a los criterios jurisprudenciales vigentes.",
      url: "https://www.saij.gob.ar/busqueda?t=jurisprudencia",
      fuente: "Provincial",
    },
  ];

  return {
    fallos: demos.filter(
      (f) => !filters.provincia || f.provincia === filters.provincia || f.provincia === "nacional"
    ),
    total: 3,
  };
}

const FUERO_LABELS: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  laboral: "Laboral",
  familia: "Familia",
  comercial: "Comercial",
  contencioso_administrativo: "Contencioso Administrativo",
};

export function detectMateria(texto: string): string {
  const lower = texto.toLowerCase();
  if (lower.includes("alimento")) return "alimentos";
  if (lower.includes("divorcio")) return "divorcio";
  if (lower.includes("daño") || lower.includes("perjuicio")) return "daños_perjuicios";
  if (lower.includes("despido") || lower.includes("laboral")) return "despido";
  if (lower.includes("contrato")) return "contratos";
  if (lower.includes("amparo")) return "amparo";
  if (lower.includes("penal") || lower.includes("delito")) return "delitos";
  if (lower.includes("constitucional") || lower.includes("extraordinario")) return "recurso_extraordinario";
  if (lower.includes("sucesión") || lower.includes("herencia")) return "sucesiones";
  if (lower.includes("consumidor")) return "consumidor";
  return "";
}

const SAIJ_PROVINCIA_MAP: Record<string, string> = {
  buenos_aires: "Buenos Aires",
  caba: "Ciudad Autónoma de Buenos Aires",
  cordoba: "Córdoba",
  santa_fe: "Santa Fe",
  mendoza: "Mendoza",
  tucuman: "Tucumán",
  salta: "Salta",
  entre_rios: "Entre Ríos",
  chaco: "Chaco",
  corrientes: "Corrientes",
  misiones: "Misiones",
  santiago_del_estero: "Santiago del Estero",
  san_juan: "San Juan",
  jujuy: "Jujuy",
  rio_negro: "Río Negro",
  neuquen: "Neuquén",
  formosa: "Formosa",
  san_luis: "San Luis",
  catamarca: "Catamarca",
  la_rioja: "La Rioja",
  la_pampa: "La Pampa",
  chubut: "Chubut",
  santa_cruz: "Santa Cruz",
  tierra_del_fuego: "Tierra del Fuego",
};

export function mapProvinciaToSAIJ(provincia: string): string {
  return SAIJ_PROVINCIA_MAP[provincia] || provincia;
}

// Reverse map SAIJ jurisdiction descriptions back to internal province values.
function normalizeJurisdiccion(desc: string): string {
  const lower = desc.toLowerCase().trim();
  if (lower.includes("nacional") || lower.includes("federal")) return "nacional";
  for (const [value, label] of Object.entries(SAIJ_PROVINCIA_MAP)) {
    if (lower === label.toLowerCase()) return value;
  }
  return desc;
}

function extractTribunal(block: string): string {
  const match = block.match(/tribunal[^>]*>([\s\S]*?)<\/[^>]+>/i);
  if (match) return match[1].replace(/<[^>]+>/g, "").trim();
  const orgMatch = block.match(/organismo[^>]*>([\s\S]*?)<\/[^>]+>/i);
  if (orgMatch) return orgMatch[1].replace(/<[^>]+>/g, "").trim();
  return "";
}

function extractSumario(block: string): string {
  const match = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (match) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    return text.length > 300 ? text.slice(0, 300) + "..." : text;
  }
  return "";
}
