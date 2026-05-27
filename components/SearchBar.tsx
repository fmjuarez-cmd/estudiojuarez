"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { SearchFilters } from "@/lib/types";
import { PROVINCIAS, FUEROS, MATERIAS } from "@/lib/types";

interface SearchBarProps {
  initialFilters?: Partial<SearchFilters>;
  compact?: boolean;
}

const SUGERENCIAS = [
  "daños y perjuicios accidente tránsito",
  "despido sin causa indemnización",
  "alimentos menores cuota",
  "recurso extraordinario admisibilidad",
  "amparo derecho a la salud",
  "divorcio bienes gananciales",
  "contrato locación rescisión",
  "accidente de trabajo ART",
  "inconstitucionalidad ley",
  "hábeas corpus libertad",
];

export default function SearchBar({ initialFilters, compact = false }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialFilters?.query || "");
  const [provincia, setProvincia] = useState(initialFilters?.provincia || "");
  const [fuero, setFuero] = useState(initialFilters?.fuero || "");
  const [materia, setMateria] = useState(initialFilters?.materia || "");
  const [fechaDesde, setFechaDesde] = useState(initialFilters?.fechaDesde || "");
  const [fechaHasta, setFechaHasta] = useState(initialFilters?.fechaHasta || "");
  const [showFilters, setShowFilters] = useState(false);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length > 1) {
      setSugerenciasFiltradas(
        SUGERENCIAS.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
      );
    } else {
      setSugerenciasFiltradas([]);
    }
  }, [query]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    const params = new URLSearchParams({ q: query.trim() });
    if (provincia) params.set("provincia", provincia);
    if (fuero) params.set("fuero", fuero);
    if (materia) params.set("materia", materia);
    if (fechaDesde) params.set("fechaDesde", fechaDesde);
    if (fechaHasta) params.set("fechaHasta", fechaHasta);

    setShowSugerencias(false);
    router.push(`/buscar?${params.toString()}`);
  };

  const selectSugerencia = (s: string) => {
    setQuery(s);
    setShowSugerencias(false);
    inputRef.current?.focus();
  };

  const hasActiveFilters = provincia || fuero || materia || fechaDesde || fechaHasta;

  return (
    <form onSubmit={handleSearch} className="w-full">
      {/* Main search row */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSugerencias(true); }}
            onFocus={() => setShowSugerencias(true)}
            onBlur={() => setTimeout(() => setShowSugerencias(false), 150)}
            placeholder="Buscá jurisprudencia: ej. daños y perjuicios, despido, alimentos..."
            className={`w-full pl-10 pr-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${compact ? "py-2 text-sm" : "py-3 text-base"}`}
          />
          {/* Sugerencias dropdown */}
          {showSugerencias && sugerenciasFiltradas.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {sugerenciasFiltradas.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => selectSugerencia(s)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${hasActiveFilters ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
          title="Filtros avanzados"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {hasActiveFilters && (
            <span className="ml-1 text-xs">•</span>
          )}
        </button>

        <button
          type="submit"
          className={`px-5 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors ${compact ? "py-2 text-sm" : "py-3"}`}
        >
          Buscar
        </button>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Provincia / Jurisdicción</label>
            <select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {PROVINCIAS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fuero</label>
            <select
              value={fuero}
              onChange={(e) => setFuero(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {FUEROS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Materia</label>
            <select
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {MATERIAS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => { setProvincia(""); setFuero(""); setMateria(""); setFechaDesde(""); setFechaHasta(""); }}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
