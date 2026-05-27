import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import ExternalSources from "@/components/ExternalSources";
import SearchLauncher from "@/components/SearchLauncher";
import { PROVINCIAS, FUEROS, MATERIAS } from "@/lib/types";
import type { SearchFilters } from "@/lib/types";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

function getLabel(arr: { value: string; label: string }[], value: string): string {
  return arr.find((x) => x.value === value)?.label || value;
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
  };

  const hasQuery = !!filters.query && filters.query.trim().length >= 2;

  const filterChips: { icon: string; label: string }[] = [];
  if (filters.provincia) filterChips.push({ icon: "📍", label: getLabel(PROVINCIAS, filters.provincia) });
  if (filters.fuero) filterChips.push({ icon: "⚖️", label: getLabel(FUEROS, filters.fuero) });
  if (filters.materia) filterChips.push({ icon: "📂", label: getLabel(MATERIAS, filters.materia) });
  if (filters.fechaDesde) filterChips.push({ icon: "📅", label: `Desde ${filters.fechaDesde}` });
  if (filters.fechaHasta) filterChips.push({ icon: "📅", label: `Hasta ${filters.fechaHasta}` });

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

          {/* Main column */}
          <main className="flex-1 min-w-0">
            {!hasQuery ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">Ingresá un término para buscar jurisprudencia</p>
              </div>
            ) : (
              <>
                <SearchLauncher query={filters.query.trim()} filterChips={filterChips} />
                <ExternalSources query={filters.query.trim()} />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
