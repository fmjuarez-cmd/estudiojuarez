// ─── Fuentes oficiales primarias (modo lanzador) ────────────────────────────
// Estos organismos arman sus resultados con JavaScript dentro del navegador y
// bloquean las peticiones automáticas desde servidores, así que no se pueden
// "raspar" de forma fiable. En su lugar, abrimos el buscador oficial de cada
// uno en una pestaña nueva: el sitio corre en el navegador del usuario y
// muestra los fallos reales. El término de búsqueda se ofrece para copiar.
export interface LaunchSource {
  id: string;
  nombre: string;
  mejorPara: string;
  icon: string;
  color: string;
  // true: el sitio acepta la búsqueda por URL y abre directamente los
  // resultados. false: es una SPA o formulario que no admite búsqueda por
  // enlace, así que se abre el buscador y el usuario pega el término.
  precarga: boolean;
  buildUrl: (query: string) => string;
}

// Las fuentes que abren directo con los resultados van primero.
export const LAUNCH_SOURCES: LaunchSource[] = [
  {
    id: "saij",
    nombre: "SAIJ",
    mejorPara:
      "Sistema Argentino de Información Jurídica. Gratuito. Jurisprudencia nacional y provincial, legislación y doctrina.",
    icon: "📚",
    color: "bg-green-700",
    precarga: true,
    buildUrl: (q) =>
      `https://www.saij.gob.ar/resultados.jsp?f=Total%7CTipo+de+Documento/Jurisprudencia&t=${encodeURIComponent(q)}&v=colapsada`,
  },
  {
    id: "cij",
    nombre: "CIJ",
    mejorPara:
      "Centro de Información Judicial del PJN. Novedades, acordadas y fallos relevantes recientes.",
    icon: "📰",
    color: "bg-red-700",
    precarga: true,
    buildUrl: (q) => `https://www.cij.gov.ar/buscador.html?acc=search&search=${encodeURIComponent(q)}`,
  },
  {
    id: "csjn",
    nombre: "CSJN",
    mejorPara:
      "Corte Suprema. Recursos extraordinarios, doctrina de arbitrariedad y citas oficiales «Fallos: tomo:página».",
    icon: "⚖️",
    color: "bg-blue-700",
    // Portal SPA: no admite búsqueda por URL; se abre y se pega el término.
    precarga: false,
    buildUrl: (_q) => "https://sj.csjn.gov.ar/homeSJ/",
  },
  {
    id: "juba",
    nombre: "JUBA",
    mejorPara:
      "Suprema Corte de Buenos Aires. La base provincial más completa: civil, laboral y familia bonaerense.",
    icon: "🏛️",
    color: "bg-purple-700",
    // Formulario ASP.NET con operadores: no admite búsqueda por URL.
    precarga: false,
    buildUrl: (_q) => "https://juba.scba.gov.ar/busquedas.aspx",
  },
];

// ─── Plataformas premium/especializadas (link-out con búsqueda precargada) ───
// Las fuentes oficiales gratuitas (SAIJ, CSJN, JUBA, CIJ) están en
// LAUNCH_SOURCES; acá quedan las plataformas privadas con suscripción.
export const EXTERNAL_SOURCES = [
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
