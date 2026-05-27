"use client";

import { useState } from "react";
import { LAUNCH_SOURCES } from "@/lib/sources";

interface SearchLauncherProps {
  query: string;
  filterChips: { icon: string; label: string }[];
}

export default function SearchLauncher({ query, filterChips }: SearchLauncherProps) {
  const [copied, setCopied] = useState(false);

  const copyQuery = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      {/* Término de búsqueda + copiar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Tu búsqueda
        </p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xl font-semibold text-gray-900 break-words">«{query}»</p>
          <button
            onClick={copyQuery}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors shrink-0"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copiado
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar término
              </>
            )}
          </button>
        </div>
        {filterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filterChips.map((c) => (
              <span
                key={c.label}
                className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md"
              >
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cómo usar el lanzador */}
      <div className="flex items-start gap-3 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
        <span className="text-lg shrink-0">💡</span>
        <p>
          Estos organismos oficiales muestran sus fallos solo dentro de su propio buscador.
          Al tocar una fuente se abre su sitio en una pestaña nueva. Tu término ya queda{" "}
          <button onClick={copyQuery} className="underline font-medium hover:text-blue-700">
            copiado
          </button>{" "}
          — si no aparece cargado, pegalo con <kbd className="px-1 py-0.5 bg-white border border-blue-200 rounded text-xs">Ctrl</kbd>+
          <kbd className="px-1 py-0.5 bg-white border border-blue-200 rounded text-xs">V</kbd>.
        </p>
      </div>

      {/* Fuentes oficiales primarias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LAUNCH_SOURCES.map((s) => (
          <a
            key={s.id}
            href={s.buildUrl(query)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={copyQuery}
            className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <span
              className={`inline-flex items-center justify-center w-10 h-10 ${s.color} text-white rounded-lg text-lg shrink-0`}
            >
              {s.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 group-hover:text-blue-700">{s.nombre}</h3>
                <svg
                  className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 leading-snug mt-0.5">{s.mejorPara}</p>
              <p className="text-xs text-blue-600 font-medium mt-1.5 group-hover:underline">
                Abrir buscador oficial →
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
