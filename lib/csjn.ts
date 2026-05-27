import type { Fallo, SearchFilters } from "./types";

// CSJN public consultation system
const CSJN_BASE = "https://sjconsulta.csjn.gov.ar/sjconsulta";
const SAIJ_BASE = "https://www.saij.gob.ar";

export async function searchCSJN(filters: SearchFilters): Promise<{ fallos: Fallo[]; total: number }> {
  try {
    const params = new URLSearchParams({
      pageNumber: String((filters.pagina || 1) - 1),
      pageSize: "10",
      highLight: "true",
    });

    if (filters.query) params.append("palabrasClave", filters.query);
    if (filters.fechaDesde) params.append("fechaDesde", filters.fechaDesde);
    if (filters.fechaHasta) params.append("fechaHasta", filters.fechaHasta);

    const response = await fetch(
      `${CSJN_BASE}/documentos/listarDocumentosInputAction.html?${params}`,
      {
        headers: { Accept: "text/html,application/xhtml+xml" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) throw new Error("CSJN no disponible");

    const html = await response.text();
    return parseCSJNResults(html, filters.query || "");
  } catch {
    // Return empty on network error so other sources can still work
    return { fallos: [], total: 0 };
  }
}

function parseCSJNResults(html: string, query: string): { fallos: Fallo[]; total: number } {
  // Simple regex-based parsing of CSJN HTML structure
  const fallos: Fallo[] = [];

  // Match result blocks in CSJN response
  const blockRegex = /class="resultados[^"]*"[\s\S]*?(?=class="resultados|$)/gi;
  const titleRegex = /title="([^"]+)"/i;
  const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
  const linkRegex = /href="([^"]*listarDocumentos[^"]+)"/i;

  const blocks = html.match(blockRegex) || [];

  for (let i = 0; i < Math.min(blocks.length, 10); i++) {
    const block = blocks[i];
    const titleMatch = block.match(titleRegex);
    const dateMatch = block.match(dateRegex);
    const linkMatch = block.match(linkRegex);

    if (titleMatch) {
      fallos.push({
        id: `csjn-${i}-${Date.now()}`,
        titulo: titleMatch[1].trim(),
        fecha: dateMatch ? dateMatch[1] : "",
        tribunal: "Corte Suprema de Justicia de la Nación",
        provincia: "nacional",
        fuero: "federal",
        materia: detectMateria(titleMatch[1]),
        sumario: `Fallo de la CSJN relacionado con: ${query}`,
        url: linkMatch ? `${CSJN_BASE}${linkMatch[1]}` : `${CSJN_BASE}/documentos/listarDocumentosInputAction.html`,
        fuente: "CSJN",
      });
    }
  }

  // Try to get total count
  const totalMatch = html.match(/(\d+)\s+(?:resultado|fallo|document)/i);
  const total = totalMatch ? parseInt(totalMatch[1]) : fallos.length;

  return { fallos, total };
}

export async function searchSAIJ(filters: SearchFilters): Promise<{ fallos: Fallo[]; total: number }> {
  try {
    const params = new URLSearchParams({
      tipo: "jurisprudencia",
      "form-type": "basic",
      buscar: "true",
    });

    if (filters.query) params.append("palabras-clave", filters.query);
    if (filters.provincia && filters.provincia !== "nacional") {
      params.append("jurisdiccion", mapProvinciaToSAIJ(filters.provincia));
    }
    if (filters.fuero) params.append("rama", filters.fuero);

    const response = await fetch(`${SAIJ_BASE}/busqueda-basica?${params}`, {
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error("SAIJ no disponible");

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return parseSAIJJson(data);
    }

    const html = await response.text();
    return parseSAIJHtml(html, filters);
  } catch {
    return { fallos: [], total: 0 };
  }
}

function parseSAIJJson(data: Record<string, unknown>): { fallos: Fallo[]; total: number } {
  const fallos: Fallo[] = [];
  const items = (data.items || data.results || data.documentos || []) as Record<string, unknown>[];

  for (const item of items.slice(0, 10)) {
    fallos.push({
      id: `saij-${item.id || Math.random()}`,
      titulo: String(item.titulo || item.title || item.nombre || "Sin título"),
      fecha: String(item.fecha || item.date || ""),
      tribunal: String(item.tribunal || item.organismo || ""),
      provincia: String(item.jurisdiccion || item.provincia || ""),
      fuero: String(item.rama || item.fuero || ""),
      materia: String(item.materia || item.tema || ""),
      sumario: String(item.sumario || item.resumen || item.descripcion || ""),
      url: item.url ? `${SAIJ_BASE}${item.url}` : undefined,
      fuente: "SAIJ",
    });
  }

  return { fallos, total: Number(data.total || fallos.length) };
}

function parseSAIJHtml(html: string, filters: SearchFilters): { fallos: Fallo[]; total: number } {
  const fallos: Fallo[] = [];

  // Extract result entries from SAIJ HTML
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
      id: `saij-${count}-${Date.now()}`,
      titulo,
      fecha: dateMatch ? dateMatch[1] : "",
      tribunal: extractTribunal(block),
      provincia: filters.provincia || "",
      fuero: filters.fuero || "",
      materia: filters.materia || detectMateria(titulo),
      sumario: extractSumario(block),
      url: `${SAIJ_BASE}/busqueda-basica?tipo=jurisprudencia&palabras-clave=${encodeURIComponent(filters.query || "")}`,
      fuente: "SAIJ",
    });

    count++;
  }

  const totalMatch = html.match(/(\d+)\s+(?:resultado|fallo|document)/i);
  return { fallos, total: totalMatch ? parseInt(totalMatch[1]) : fallos.length };
}

// Fallback: generate demo results when both sources fail (for development/demo)
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
      url: "https://sjconsulta.csjn.gov.ar/sjconsulta/documentos/listarDocumentosInputAction.html",
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
      url: "https://www.saij.gob.ar/busqueda-basica?tipo=jurisprudencia",
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
      url: "https://www.saij.gob.ar/busqueda-basica?tipo=jurisprudencia",
      fuente: "Provincial",
    },
  ];

  return {
    fallos: demos.filter((f) => !filters.provincia || f.provincia === filters.provincia || f.provincia === "nacional"),
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

function detectMateria(texto: string): string {
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

function mapProvinciaToSAIJ(provincia: string): string {
  const map: Record<string, string> = {
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
  return map[provincia] || provincia;
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
