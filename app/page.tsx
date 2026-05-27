import SearchBar from "@/components/SearchBar";
import Link from "next/link";

const BUSQUEDAS_FRECUENTES = [
  { label: "Daños y perjuicios", href: "/buscar?q=da%C3%B1os+y+perjuicios" },
  { label: "Despido sin causa", href: "/buscar?q=despido+sin+causa" },
  { label: "Alimentos menores", href: "/buscar?q=alimentos+menores" },
  { label: "Recurso extraordinario", href: "/buscar?q=recurso+extraordinario" },
  { label: "Amparo salud", href: "/buscar?q=amparo+derecho+salud" },
  { label: "Divorcio bienes", href: "/buscar?q=divorcio+bienes+gananciales" },
  { label: "Accidente de trabajo ART", href: "/buscar?q=accidente+trabajo+ART" },
  { label: "Locación rescisión", href: "/buscar?q=locaci%C3%B3n+rescisi%C3%B3n+contrato" },
];

const TRIBUNALES = [
  {
    nombre: "CSJN",
    descripcion: "Corte Suprema de Justicia de la Nación",
    href: "https://sjconsulta.csjn.gov.ar",
    color: "bg-blue-700",
    icon: "⚖️",
    badge: "Primaria",
  },
  {
    nombre: "SAIJ",
    descripcion: "Sistema Argentino de Información Jurídica — gratuito",
    href: "https://www.saij.gob.ar",
    color: "bg-green-700",
    icon: "📚",
    badge: null,
  },
  {
    nombre: "JUBA",
    descripcion: "Base provincial más completa — Suprema Corte de Buenos Aires",
    href: "https://juba.scba.gov.ar",
    color: "bg-purple-700",
    icon: "🏛️",
    badge: null,
  },
  {
    nombre: "CIJ",
    descripcion: "Centro de Información Judicial — PJN",
    href: "https://www.cij.gov.ar",
    color: "bg-red-700",
    icon: "📰",
    badge: null,
  },
  {
    nombre: "Microjuris",
    descripcion: "Laboral, comercial y modelos de escritos",
    href: "https://ar.microjuris.com",
    color: "bg-orange-600",
    icon: "📋",
    badge: null,
  },
  {
    nombre: "Jurídica",
    descripcion: "IA jurídica — integra SAIJ + CSJN + JUBA",
    href: "https://juridica.ar",
    color: "bg-indigo-700",
    icon: "🤖",
    badge: null,
  },
  {
    nombre: "La Ley",
    descripcion: "Thomson Reuters — estándar premium",
    href: "https://thomsonreuters.com/es-ar/productos-servicios/legal/la-ley.html",
    color: "bg-slate-700",
    icon: "⭐",
    badge: null,
  },
  {
    nombre: "Cita Forte",
    descripcion: "Verificación de citas y seguimiento normativo",
    href: "https://citaforte.com.ar",
    color: "bg-teal-700",
    icon: "🔗",
    badge: null,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900">
      {/* Hero */}
      <header className="pt-12 pb-10 px-4 text-center text-white">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-4xl">⚖️</span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">JuriSearch</h1>
        </div>
        <p className="text-blue-200 text-lg sm:text-xl mb-1">
          Buscador de Jurisprudencia Argentina
        </p>
        <p className="text-blue-300 text-sm mb-8">
          CSJN · Cámaras de Apelaciones · Tribunales Provinciales · SAIJ
        </p>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-4 shadow-2xl">
            <SearchBar />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {BUSQUEDAS_FRECUENTES.map((b) => (
            <Link
              key={b.label}
              href={b.href}
              className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors border border-white/20"
            >
              {b.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="bg-gray-50 rounded-t-3xl">
        {/* How it works */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Cómo funciona</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-semibold text-gray-800 mb-2">1. Buscá</h3>
              <p className="text-sm text-gray-600">
                Ingresá términos jurídicos, número de expediente, partes del juicio o el tema del fallo.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-800 mb-2">2. Filtrá</h3>
              <p className="text-sm text-gray-600">
                Acotá por provincia, fuero (civil, penal, laboral) y materia. CSJN siempre incluida.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl mb-3">📄</div>
              <h3 className="font-semibold text-gray-800 mb-2">3. Accedé</h3>
              <p className="text-sm text-gray-600">
                Leé el sumario, abrí el fallo completo o descargalo desde la fuente oficial.
              </p>
            </div>
          </div>
        </section>

        {/* Fuentes */}
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Fuentes consultadas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {TRIBUNALES.map((t) => (
              <a
                key={t.nombre}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative"
              >
                {t.badge && (
                  <span className="absolute top-3 right-3 text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                    {t.badge}
                  </span>
                )}
                <div className={`inline-flex items-center justify-center w-10 h-10 ${t.color} text-white rounded-lg mb-3 text-lg group-hover:scale-110 transition-transform`}>
                  {t.icon}
                </div>
                <h3 className="font-bold text-gray-900">{t.nombre}</h3>
                <p className="text-xs text-gray-500 mt-1">{t.descripcion}</p>
                <p className="text-xs text-blue-600 mt-2 group-hover:underline">Ir al sitio oficial →</p>
              </a>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            + Cámaras de Casación · Juzgados Laborales · Tribunales de todas las provincias argentinas
          </p>
        </section>

        {/* Por provincia */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Buscá por provincia</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: "Buenos Aires", value: "buenos_aires" },
              { label: "CABA", value: "caba" },
              { label: "Córdoba", value: "cordoba" },
              { label: "Santa Fe", value: "santa_fe" },
              { label: "Mendoza", value: "mendoza" },
              { label: "Tucumán", value: "tucuman" },
              { label: "Salta", value: "salta" },
              { label: "Entre Ríos", value: "entre_rios" },
              { label: "Chaco", value: "chaco" },
              { label: "Corrientes", value: "corrientes" },
              { label: "Misiones", value: "misiones" },
              { label: "Neuquén", value: "neuquen" },
            ].map((p) => (
              <Link
                key={p.value}
                href={`/buscar?q=jurisprudencia&provincia=${p.value}`}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-colors text-center"
              >
                📍 {p.label}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-blue-900 text-blue-300 text-center text-xs py-6 px-4">
        <p className="mb-1">
          JuriSearch — Buscador de Jurisprudencia Argentina. Fuentes: CSJN, SAIJ, tribunales provinciales.
        </p>
        <p>Los fallos son propiedad de sus respectivos tribunales y organismos oficiales.</p>
      </footer>
    </div>
  );
}
