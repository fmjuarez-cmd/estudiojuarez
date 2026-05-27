"use client";

import type { Fallo } from "@/lib/types";
import { PROVINCIAS, FUEROS, MATERIAS } from "@/lib/types";

interface ResultCardProps {
  fallo: Fallo;
  queryTerms?: string[];
}

const SOURCE_COLORS: Record<string, string> = {
  CSJN: "bg-blue-100 text-blue-800 border-blue-200",
  SAIJ: "bg-green-100 text-green-800 border-green-200",
  Provincial: "bg-purple-100 text-purple-800 border-purple-200",
};

const SOURCE_ICONS: Record<string, string> = {
  CSJN: "⚖️",
  SAIJ: "📚",
  Provincial: "🏛️",
};

function highlightText(text: string, terms: string[]): string {
  if (!terms.length) return text;
  const regex = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.replace(regex, "<mark class=\"bg-yellow-200 text-yellow-900 rounded px-0.5\">$1</mark>");
}

function getLabel(arr: { value: string; label: string }[], value: string): string {
  return arr.find((x) => x.value === value)?.label || value;
}

export default function ResultCard({ fallo, queryTerms = [] }: ResultCardProps) {
  const sourceClass = SOURCE_COLORS[fallo.fuente] || "bg-gray-100 text-gray-700";
  const highlightedTitle = highlightText(fallo.titulo, queryTerms);
  const highlightedSumario = highlightText(fallo.sumario, queryTerms);

  const provinciaLabel = getLabel(PROVINCIAS, fallo.provincia);
  const fueroLabel = getLabel(FUEROS, fallo.fuero);
  const materiaLabel = getLabel(MATERIAS, fallo.materia);

  return (
    <article className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${sourceClass}`}>
            <span>{SOURCE_ICONS[fallo.fuente] || "📄"}</span>
            {fallo.fuente}
          </span>
          {fallo.fecha && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              📅 {fallo.fecha}
            </span>
          )}
          {fallo.expediente && (
            <span className="text-xs text-gray-500">Exp: {fallo.expediente}</span>
          )}
        </div>
      </div>

      {/* Title */}
      <h2
        className="text-base font-semibold text-gray-900 mb-2 leading-snug"
        dangerouslySetInnerHTML={{ __html: highlightedTitle }}
      />

      {/* Tribunal */}
      {fallo.tribunal && (
        <p className="text-sm text-blue-700 font-medium mb-2">🏛️ {fallo.tribunal}</p>
      )}

      {/* Sumario */}
      {fallo.sumario && (
        <p
          className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-3"
          dangerouslySetInnerHTML={{ __html: highlightedSumario }}
        />
      )}

      {/* Tags row */}
      <div className="flex flex-wrap gap-2 mb-3">
        {fallo.provincia && (
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
            📍 {provinciaLabel}
          </span>
        )}
        {fallo.fuero && (
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
            ⚖️ {fueroLabel}
          </span>
        )}
        {fallo.materia && (
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
            📂 {materiaLabel}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        {fallo.url && (
          <a
            href={fallo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver fallo completo
          </a>
        )}
        {fallo.url && (
          <a
            href={fallo.url}
            download
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium hover:underline ml-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar
          </a>
        )}
      </div>
    </article>
  );
}
