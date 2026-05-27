import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/ResultCard";
import FilterSidebar from "@/components/FilterSidebar";
import { searchCSJN, searchSAIJ, generateDemoResults } from "@/lib/csjn";
import type { SearchFilters, Fallo } from "@/lib/types";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

interface ResultsData {
  fallos: Fallo[];
  total: number;
  pagina: number;
  totalPaginas: number;
  fuentes: string[];
  isDemo: boolean;
}

async function getResults(filters: SearchFilters): Promise<ResultsData> {
  const [csjnSettled, saijSettled] = await Promise.allSettled([
    searchCSJN(filters),
    searchSAIJ(filters),
  ]);

  const csjnResult = csjnSettled.status === "fulfilled" ? csjnSettled.value : { fallos: [], total: 0 };
  const saijResult = saijSettled.status === "fulfilled" ? saijSettled.value : { fallos: [], total: 0 };

  let fallos = [...csjnResult.fallos, ...saijResult.fallos];
  let total = csjnResult.total + saijResult.total;

  if (filters.provincia) {
    const prov = filters.provincia;
    fallos = fallos.filter(
      (f) => !f.provincia || f.provincia === prov || f.provincia === "nacional"
    );
  }
  if (filters.fuero) {
    fallos = fallos.filter((f) => !f.fuero || f.fuero === filters.fuero);
  }
  if (filters.materia) {
    fallos = fallos.filter((f) => !f.materia || f.materia === filters.materia);
  }

  const isDemo = fallos.length === 0;
  if (isDemo) {
    const demo = generateDemoResults(filters);
    fallos = demo.fallos;
    total = demo.total;
  }

  const pageSize = 10;
  const pagina = filters.pagina || 1;

  return {
    fallos: fallos.slice(0, pageSize),
    total: Math.max(total, fallos.length),
    pagina,
    totalPaginas: Math.ceil(Math.max(total, fallos.length) / pageSize),
    fuentes: [...new Set(fallos.map((f) => f.fuente))],
    isDemo,
  };
}

function PaginationBar({
  pagina,
  totalPaginas,
  searchParams,
}: {
  pagina: number;
  totalPaginas: number;
  searchParams: Record<string, string>;
}) {
  if (totalPaginas <= 1) return null;

  const makeUrl = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pagina", String(p));
    return `/buscar?${params.toString()}`;
  };

  const pages: number[] = [];
  const start = Math.max(1, pagina - 2);
  const end = Math.min(totalPaginas, pagina + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {pagina > 1 && (
        <Link href={makeUrl(pagina - 1)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
          ← Anterior
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={makeUrl(p)}
          className={`px-3 py-1.5 text-sm rounded-lg border ${p === pagina ? "bg-blue-700 text-white border-blue-700 font-semibold" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
        >
          {p}
        </Link>
      ))}
      {pagina < totalPaginas && (
        <Link href={makeUrl(pagina + 1)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
          Siguiente →
        </Link>
      )}
    </div>
  );
}

export default async function BuscarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters: SearchFilters = {
    query: sp.q || "",
    provincia: sp.provincia || undefined,
    fuero: sp.fuero || undefined,
    materia: sp.materia || undefined,
    fechaDesde: sp.fechaDesde || undefined,
    fechaHasta: sp.fechaHasta || undefined,
    pagina: parseInt(sp.pagina || "1"),
  };

  const result = filters.query && filters.query.trim().length >= 2
    ? await getResults(filters)
    : null;

  const queryTerms = filters.query
    ? filters.query.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky search header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-700 font-bold text-lg shrink-0 hidden sm:block">
              ⚖️ JuriSearch
            </Link>
            <div className="flex-1">
              <SearchBar initialFilters={filters} compact />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="hidden lg:block w-56 shrink-0">
            <Suspense>
              <FilterSidebar />
            </Suspense>
          </div>

          {/* Results */}
          <main className="flex-1 min-w-0">
            {!filters.query && (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">Ingresá un término para buscar jurisprudencia</p>
              </div>
            )}

            {result && (
              <>
                {/* Demo warning — clearly visible */}
                {result.isDemo && (
                  <div className="flex items-start gap-3 mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl text-sm text-amber-900">
                    <span className="text-lg shrink-0">⚠️</span>
                    <div>
                      <p className="font-semibold">Resultados de ejemplo</p>
                      <p className="text-amber-800 mt-0.5">
                        No se pudo conectar con CSJN ni SAIJ. Estos son resultados ilustrativos —{" "}
                        <strong>no representan fallos reales</strong>. Accedé directamente a{" "}
                        <a href="https://sjconsulta.csjn.gov.ar" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                          sjconsulta.csjn.gov.ar
                        </a>{" "}
                        o{" "}
                        <a href="https://www.saij.gob.ar" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                          saij.gob.ar
                        </a>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Results header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{result.total.toLocaleString("es-AR")}</span> resultados para{" "}
                      <span className="font-semibold text-blue-700">&quot;{filters.query}&quot;</span>
                    </p>
                    {result.fuentes.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Fuentes: {result.fuentes.join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {filters.provincia && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        📍 {filters.provincia}
                      </span>
                    )}
                  </div>
                </div>

                {/* CSJN notice (only shown for real results) */}
                {!result.isDemo && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <span className="text-base">⚖️</span>
                    <span>
                      Incluye <strong>CSJN</strong> como fuente primaria + fuentes secundarias.{" "}
                      <a href="https://sjconsulta.csjn.gov.ar" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">
                        Ir directamente a CSJN →
                      </a>
                    </span>
                  </div>
                )}

                {result.fallos.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                    <p className="text-gray-500 text-lg mb-2">Sin resultados</p>
                    <p className="text-gray-400 text-sm">
                      Probá con otros términos o eliminá algunos filtros.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {result.fallos.map((fallo) => (
                      <ResultCard key={fallo.id} fallo={fallo} queryTerms={queryTerms} />
                    ))}
                  </div>
                )}

                <PaginationBar
                  pagina={result.pagina}
                  totalPaginas={result.totalPaginas}
                  searchParams={sp}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
