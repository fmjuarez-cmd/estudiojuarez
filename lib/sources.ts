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
  // URL del buscador oficial. Se le pasa el término por si el sitio lo
  // pre-carga; si no, el usuario lo pega (queda copiado al portapapeles).
  buildUrl: (query: string) => string;
}

export const LAUNCH_SOURCES: LaunchSource[] = [
  {
    id: "csjn",
    nombre: "CSJN",
    mejorPara:
      "Corte Suprema. Recursos extraordinarios, doctrina de arbitrariedad y citas oficiales «Fallos: tomo:página».",
    icon: "⚖️",
    color: "bg-blue-700",
    // Portal SPA: no admite búsqueda por URL; se abre y se pega el término.
    buildUrl: () => "https://sj.csjn.gov.ar/homeSJ/",
  },
  {
    id: "saij",
    nombre: "SAIJ",
    mejorPara:
      "Sistema Argentino de Información Jurídica. Gratuito. Jurisprudencia nacional y provincial, legislación y doctrina.",
    icon: "📚",
    color: "bg-green-700",
    buildUrl: (q) => `https://www.saij.gob.ar/busqueda?t=${encodeURIComponent(q)}`,
  },
  {
    id: "juba",
    nombre: "JUBA",
    mejorPara:
      "Suprema Corte de Buenos Aires. La base provincial más completa: civil, laboral y familia bonaerense.",
    icon: "🏛️",
    color: "bg-purple-700",
    buildUrl: () => "https://juba.scba.gov.ar/",
  },
  {
    id: "cij",
    nombre: "CIJ",
    mejorPara:
      "Centro de Información Judicial del PJN. Novedades, acordadas y fallos relevantes recientes.",
    icon: "📰",
    color: "bg-red-700",
    buildUrl: () => "https://www.cij.gov.ar/buscador.html",
  },
];

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
    url: (_q: string) => `https://sj.csjn.gov.ar/homeSJ/`,
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
    url: (_q: string) => `https://www.cij.gov.ar/buscador.html`,
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
