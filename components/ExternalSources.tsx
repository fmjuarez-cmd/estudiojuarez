"use client";

import { useState } from "react";
import { EXTERNAL_SOURCES } from "@/lib/sources";

interface ExternalSourcesProps {
  query: string;
}

export default function ExternalSources({ query }: ExternalSourcesProps) {
  const [showAll, setShowAll] = useState(false);
  const publicas = EXTERNAL_SOURCES.filter((s) => s.tipo === "publica");
  const premium = EXTERNAL_SOURCES.filter((s) => s.tipo === "premium");
  const visiblePremium = showAll ? premium : premium.slice(0, 4);

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Buscar también en otras fuentes
      </h3>

      {/* Fuentes públicas */}
      <div className="mb-4">
        <p className="text-xs font-medium text-green-700 mb-2">🟢 Gratuitas / Oficiales</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {publicas.map((s) => (
            <SourceLink key={s.id} source={s} query={query} />
          ))}
        </div>
      </div>

      {/* Fuentes premium */}
      <div>
        <p className="text-xs font-medium text-amber-700 mb-2">⭐ Plataformas especializadas / Premium</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visiblePremium.map((s) => (
            <SourceLink key={s.id} source={s} query={query} />
          ))}
        </div>
        {premium.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {showAll ? "Ver menos" : `Ver ${premium.length - 4} fuentes más →`}
          </button>
        )}
      </div>
    </div>
  );
}

function SourceLink({
  source,
  query,
}: {
  source: (typeof EXTERNAL_SOURCES)[number];
  query: string;
}) {
  return (
    <a
      href={source.url(query)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2.5 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group text-left"
    >
      <span className="text-base shrink-0 mt-0.5">{source.icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 truncate">
          {source.nombre}
        </p>
        <p className="text-xs text-gray-500 leading-snug line-clamp-2">
          {source.descripcion}
        </p>
      </div>
      <svg
        className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 shrink-0 mt-0.5 ml-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
