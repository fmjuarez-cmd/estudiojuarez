"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROVINCIAS, FUEROS, MATERIAS } from "@/lib/types";

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentProvincia = searchParams.get("provincia") || "";
  const currentFuero = searchParams.get("fuero") || "";
  const currentMateria = searchParams.get("materia") || "";
  const currentQ = searchParams.get("q") || "";

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("pagina", "1");
    router.push(`/buscar?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(`/buscar?q=${encodeURIComponent(currentQ)}`);
  };

  const hasFilters = currentProvincia || currentFuero || currentMateria;

  return (
    <aside className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Filtros</h3>
        {hasFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-600 hover:text-red-800 underline"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Fuente / Tribunal */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-800 mb-1">📌 Fuente primaria</p>
        <p className="text-xs text-blue-700">
          CSJN (Corte Suprema de Justicia de la Nación) — siempre consultada
        </p>
        <p className="text-xs text-blue-600 mt-1">
          + SAIJ, Cámaras, Tribunales provinciales (subsidiarias)
        </p>
      </div>

      {/* Provincia */}
      <FilterGroup
        title="Provincia / Jurisdicción"
        icon="📍"
        options={PROVINCIAS.slice(0, 8)}
        allOptions={PROVINCIAS}
        current={currentProvincia}
        onChange={(v) => applyFilter("provincia", v)}
      />

      {/* Fuero */}
      <FilterGroup
        title="Fuero"
        icon="⚖️"
        options={FUEROS.slice(0, 6)}
        allOptions={FUEROS}
        current={currentFuero}
        onChange={(v) => applyFilter("fuero", v)}
      />

      {/* Materia */}
      <FilterGroup
        title="Materia"
        icon="📂"
        options={MATERIAS.slice(0, 8)}
        allOptions={MATERIAS}
        current={currentMateria}
        onChange={(v) => applyFilter("materia", v)}
      />
    </aside>
  );
}

interface FilterGroupProps {
  title: string;
  icon: string;
  options: { value: string; label: string }[];
  allOptions: { value: string; label: string }[];
  current: string;
  onChange: (v: string) => void;
}

function FilterGroup({ title, icon, options, allOptions, current, onChange }: FilterGroupProps) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        {icon} {title}
      </h4>
      <div className="space-y-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value === current ? "" : opt.value)}
            className={`w-full text-left text-sm px-2.5 py-1.5 rounded-md transition-colors ${
              current === opt.value
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {allOptions.length > options.length && (
          <select
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="w-full mt-1 text-xs border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Ver todas las opciones...</option>
            {allOptions.slice(options.length).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
