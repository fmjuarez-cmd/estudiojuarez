export interface Fallo {
  id: string;
  titulo: string;
  fecha: string;
  tribunal: string;
  provincia: string;
  fuero: string;
  materia: string;
  sumario: string;
  texto?: string;
  url?: string;
  fuente: "CSJN" | "SAIJ" | "Provincial";
  expediente?: string;
}

export interface SearchFilters {
  query: string;
  provincia?: string;
  fuero?: string;
  materia?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  fuente?: string;
  pagina?: number;
}

export interface SearchResult {
  fallos: Fallo[];
  total: number;
  pagina: number;
  totalPaginas: number;
  fuentes: string[];
}

export const PROVINCIAS = [
  { value: "", label: "Todas las provincias" },
  { value: "nacional", label: "Justicia Nacional (CSJN / CNCIV / CNTRAB)" },
  { value: "buenos_aires", label: "Buenos Aires" },
  { value: "caba", label: "Ciudad Autónoma de Buenos Aires" },
  { value: "catamarca", label: "Catamarca" },
  { value: "chaco", label: "Chaco" },
  { value: "chubut", label: "Chubut" },
  { value: "cordoba", label: "Córdoba" },
  { value: "corrientes", label: "Corrientes" },
  { value: "entre_rios", label: "Entre Ríos" },
  { value: "formosa", label: "Formosa" },
  { value: "jujuy", label: "Jujuy" },
  { value: "la_pampa", label: "La Pampa" },
  { value: "la_rioja", label: "La Rioja" },
  { value: "mendoza", label: "Mendoza" },
  { value: "misiones", label: "Misiones" },
  { value: "neuquen", label: "Neuquén" },
  { value: "rio_negro", label: "Río Negro" },
  { value: "salta", label: "Salta" },
  { value: "san_juan", label: "San Juan" },
  { value: "san_luis", label: "San Luis" },
  { value: "santa_cruz", label: "Santa Cruz" },
  { value: "santa_fe", label: "Santa Fe" },
  { value: "santiago_del_estero", label: "Santiago del Estero" },
  { value: "tierra_del_fuego", label: "Tierra del Fuego" },
  { value: "tucuman", label: "Tucumán" },
];

export const FUEROS = [
  { value: "", label: "Todos los fueros" },
  { value: "civil", label: "Civil" },
  { value: "comercial", label: "Comercial" },
  { value: "penal", label: "Penal / Criminal" },
  { value: "laboral", label: "Laboral / Trabajo" },
  { value: "familia", label: "Familia" },
  { value: "contencioso_administrativo", label: "Contencioso Administrativo" },
  { value: "seguridad_social", label: "Seguridad Social" },
  { value: "constitucional", label: "Constitucional" },
  { value: "federal", label: "Federal" },
  { value: "electoral", label: "Electoral" },
  { value: "menores", label: "Menores / Niñez" },
];

export const MATERIAS = [
  { value: "", label: "Todas las materias" },
  { value: "daños_perjuicios", label: "Daños y Perjuicios" },
  { value: "alimentos", label: "Alimentos" },
  { value: "divorcio", label: "Divorcio" },
  { value: "filiacion", label: "Filiación" },
  { value: "sucesiones", label: "Sucesiones / Herencia" },
  { value: "contratos", label: "Contratos" },
  { value: "propiedad", label: "Propiedad / Dominio" },
  { value: "locacion", label: "Locación" },
  { value: "despido", label: "Despido / Laboral" },
  { value: "accidentes_trabajo", label: "Accidentes de Trabajo" },
  { value: "delitos", label: "Delitos / Derecho Penal" },
  { value: "derechos_humanos", label: "Derechos Humanos" },
  { value: "amparo", label: "Amparo" },
  { value: "habeas_corpus", label: "Hábeas Corpus" },
  { value: "recurso_extraordinario", label: "Recurso Extraordinario" },
  { value: "inconstitucionalidad", label: "Inconstitucionalidad" },
  { value: "medida_cautelar", label: "Medidas Cautelares" },
  { value: "concursos_quiebras", label: "Concursos y Quiebras" },
  { value: "consumidor", label: "Derecho del Consumidor" },
  { value: "previsional", label: "Previsional" },
  { value: "tributario", label: "Tributario / Impositivo" },
];
