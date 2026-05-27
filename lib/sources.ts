import type { Fallo, SearchFilters } from "./types";

// ─── JUBA – Suprema Corte de Buenos Aires ───────────────────────────────────
export async function searchJUBA(filters: SearchFilters): Promise<{ fallos: Fallo[]; total: number }> {
  try {
    const params = new URLSearchParams({ textoBusqueda: filters.query || "" });
    if (filters.materia) params.append("rama", filters.materia);

    const res = await fetch(`https://juba.scba.gov.ar/VerTextoCompleto.aspx?${params}`, {
      headers: { Accept: "text/html" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error("JUBA no disponible");
    const html = await res.text();
    return parseJUBAHtml(html, filters);
  } catch {
    return { fallos: [], total: 0 };
  }
}

function parseJUBAHtml(html: string, filters: SearchFilters): { fallos: Fallo[]; total: number } {
  const fallos: Fallo[] = [];
  const rowRegex = /<tr[^>]*class="[^"]*fila[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let rowMatch;
  let count = 0;

  while ((rowMatch = rowRegex.exec(html)) !== null && count < 10) {
    const row = rowMatch[1];
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, "").trim());
    }
    if (cells.length >= 2) {
      fallos.push({
        id: `juba-${count}-${Date.now()}`,
        titulo: cells[0] || `Fallo JUBA ${count + 1}`,
        fecha: cells[1] || "",
        tribunal: "Suprema Corte de Buenos Aires",
        provincia: "buenos_aires",
        fuero: filters.fuero || "civil",
        materia: filters.materia || "",
        sumario: cells[2] || "",
        url: "https://juba.scba.gov.ar",
        fuente: "Provincial",
      });
      count++;
    }
  }

  const totalMatch = html.match(/(\d+)\s+resultado/i);
  return { fallos, total: totalMatch ? parseInt(totalMatch[1]) : fallos.length };
}

// ─── CIJ – Centro de Información Judicial ────────────────────────────────────
export async function searchCIJ(filters: SearchFilters): Promise<{ fallos: Fallo[]; total: number }> {
  try {
    const params = new URLSearchParams({ q: filters.query || "", tipo: "jurisprudencia" });
    const res = await fetch(`https://www.cij.gov.ar/nota.html?${params}`, {
      headers: { Accept: "text/html" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error("CIJ no disponible");
    const html = await res.text();
    return parseCIJHtml(html, filters);
  } catch {
    return { fallos: [], total: 0 };
  }
}

function parseCIJHtml(html: string, filters: SearchFilters): { fallos: Fallo[]; total: number } {
  const fallos: Fallo[] = [];
  const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
  const titleRegex = /<h\d[^>]*>([\s\S]*?)<\/h\d>/i;
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/;
  const linkRegex = /href="([^"]+)"/i;

  let match;
  let count = 0;

  while ((match = articleRegex.exec(html)) !== null && count < 5) {
    const block = match[1];
    const titleMatch = block.match(titleRegex);
    const dateMatch = block.match(dateRegex);
    const linkMatch = block.match(linkRegex);

    const titulo = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : `Nota CIJ ${count + 1}`;

    fallos.push({
      id: `cij-${count}-${Date.now()}`,
      titulo,
      fecha: dateMatch ? dateMatch[1] : "",
      tribunal: "Poder Judicial de la Nación",
      provincia: filters.provincia || "nacional",
      fuero: filters.fuero || "federal",
      materia: filters.materia || "",
      sumario: "Información del Centro de Información Judicial del Poder Judicial de la Nación.",
      url: linkMatch ? `https://www.cij.gov.ar${linkMatch[1]}` : "https://www.cij.gov.ar",
      fuente: "CSJN",
    });
    count++;
  }

  return { fallos, total: fallos.length };
}

// ─── Microjuris (link-out) ────────────────────────────────────────────────────
export function getMicrojurisUrl(filters: SearchFilters): string {
  const params = new URLSearchParams({ q: filters.query || "" });
  if (filters.materia) params.append("materia", filters.materia);
  return `https://ar.microjuris.com/search?${params}`;
}

// ─── External premium/specialized sources ────────────────────────────────────
export const EXTERNAL_SOURCES = [
  {
    id: "saij",
    nombre: "SAIJ",
    descripcion: "Sistema Argentino de Información Jurídica. Gratuito. Jurisprudencia nacional y provincial + legislación + doctrina.",
    url: (q: string) => `https://www.saij.gob.ar/busqueda-basica?palabras-clave=${encodeURIComponent(q)}&tipo=jurisprudencia`,
    tipo: "publica",
    icon: "📚",
  },
  {
    id: "csjn",
    nombre: "CSJN Jurisprudencia",
    descripcion: "Sistema de Jurisprudencia de la Corte Suprema (sj.csjn.gov.ar). Indispensable para recursos extraordinarios y doctrina de arbitrariedad.",
    url: (q: string) => `https://sj.csjn.gov.ar/homeSJ/#/buscar?texto=${encodeURIComponent(q)}`,
    tipo: "publica",
    icon: "⚖️",
  },
  {
    id: "juba",
    nombre: "JUBA",
    descripcion: "Base provincial más completa del país. Suprema Corte de Buenos Aires. Fundamental para civil, laboral y familia bonaerense.",
    url: (q: string) => `https://juba.scba.gov.ar/VerTextoCompleto.aspx?textoBusqueda=${encodeURIComponent(q)}`,
    tipo: "publica",
    icon: "🏛️",
  },
  {
    id: "cij",
    nombre: "CIJ",
    descripcion: "Centro de Información Judicial. Novedades judiciales, acordadas, fallos relevantes y seguimiento del PJN.",
    url: (q: string) => `https://www.cij.gov.ar/nota.html?q=${encodeURIComponent(q)}`,
    tipo: "publica",
    icon: "📰",
  },
  {
    id: "microjuris",
    nombre: "Microjuris",
    descripcion: "Muy útil para laboral, comercial y modelos de escritos. Buena sistematización temática. Requiere suscripción.",
    url: (q: string) => `https://ar.microjuris.com/search?q=${encodeURIComponent(q)}`,
    tipo: "premium",
    icon: "📋",
  },
  {
    id: "laley",
    nombre: "La Ley (Thomson Reuters)",
    descripcion: "Estándar premium en estudios grandes. Fuerte en doctrina, comentarios y jurisprudencia seleccionada.",
    url: (_q: string) => "https://thomsonreuters.com/es-ar/productos-servicios/legal/la-ley.html",
    tipo: "premium",
    icon: "⭐",
  },
  {
    id: "abeledo",
    nombre: "Abeledo Perrot",
    descripcion: "Plataforma premium con jurisprudencia comentada, legislación y doctrina especializada.",
    url: (_q: string) => "https://abeledoperrot.com",
    tipo: "premium",
    icon: "⭐",
  },
  {
    id: "juridica",
    nombre: "Jurídica",
    descripcion: "Plataforma con IA jurídica que integra SAIJ, CSJN y JUBA en una sola búsqueda. Muy práctica para investigación rápida.",
    url: (q: string) => `https://juridica.ar/?s=${encodeURIComponent(q)}`,
    tipo: "premium",
    icon: "🤖",
  },
  {
    id: "ijuridica",
    nombre: "I-Jurídica",
    descripcion: "Buscador privado con IA, resúmenes de fallos y seguimiento jurisprudencial.",
    url: (q: string) => `https://www.ijuridica.com.ar/?s=${encodeURIComponent(q)}`,
    tipo: "premium",
    icon: "🤖",
  },
  {
    id: "civilia",
    nombre: "Civilia",
    descripcion: "Plataforma de investigación jurídica con IA. Búsqueda y análisis de jurisprudencia y doctrina argentina.",
    url: (q: string) => `https://civilia.com.ar/?s=${encodeURIComponent(q)}`,
    tipo: "premium",
    icon: "🤖",
  },
  {
    id: "aldia",
    nombre: "Al Día Argentina",
    descripcion: "Microjuris Al Día. Novedades y comentarios de jurisprudencia y legislación argentina actualizada.",
    url: (q: string) => `https://aldiaargentina.microjuris.com/?s=${encodeURIComponent(q)}`,
    tipo: "premium",
    icon: "📰",
  },
  {
    id: "jurisprudenciaarg",
    nombre: "JurisprudenciaARG",
    descripcion: "Orientado a velocidad de búsqueda y resúmenes rápidos. Útil para precedentes recientes sin navegar PDFs.",
    url: (q: string) => `https://jurisprudenciaarg.com.ar/?s=${encodeURIComponent(q)}`,
    tipo: "premium",
    icon: "⚡",
  },
  {
    id: "citaforte",
    nombre: "Cita Forte",
    descripcion: "Fuerte en verificación de citas y actualización automática de fuentes oficiales. Ideal para litigación intensiva.",
    url: (_q: string) => "https://citaforte.com.ar",
    tipo: "premium",
    icon: "🔗",
  },
];
