import { NextRequest, NextResponse } from "next/server";
import { searchCSJN, searchSAIJ, generateDemoResults } from "@/lib/csjn";
import type { SearchFilters, SearchResult } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const filters: SearchFilters = {
    query: searchParams.get("q") || "",
    provincia: searchParams.get("provincia") || undefined,
    fuero: searchParams.get("fuero") || undefined,
    materia: searchParams.get("materia") || undefined,
    fechaDesde: searchParams.get("fechaDesde") || undefined,
    fechaHasta: searchParams.get("fechaHasta") || undefined,
    pagina: parseInt(searchParams.get("pagina") || "1"),
  };

  if (!filters.query || filters.query.trim().length < 2) {
    return NextResponse.json({ error: "Ingresá al menos 2 caracteres para buscar" }, { status: 400 });
  }

  // Always search CSJN first (primary source), then SAIJ
  // allSettled so a CSJN outage never silences SAIJ results
  const [csjnSettled, saijSettled] = await Promise.allSettled([
    searchCSJN(filters),
    searchSAIJ(filters),
  ]);
  const csjnResult = csjnSettled.status === "fulfilled" ? csjnSettled.value : { fallos: [], total: 0 };
  const saijResult = saijSettled.status === "fulfilled" ? saijSettled.value : { fallos: [], total: 0 };

  let fallos = [...csjnResult.fallos, ...saijResult.fallos];
  let total = csjnResult.total + saijResult.total;

  // Apply province filter client-side if set
  if (filters.provincia) {
    const prov = filters.provincia;
    fallos = fallos.filter(
      (f) =>
        !f.provincia ||
        f.provincia === prov ||
        (prov !== "nacional" && f.provincia === "nacional") // always include national
    );
  }

  // Apply fuero filter
  if (filters.fuero) {
    const fuero = filters.fuero;
    fallos = fallos.filter((f) => !f.fuero || f.fuero === fuero);
  }

  // Apply materia filter
  if (filters.materia) {
    const materia = filters.materia;
    fallos = fallos.filter((f) => !f.materia || f.materia === materia);
  }

  // When real sources return nothing, surface demo data clearly flagged
  const isDemo = fallos.length === 0;
  if (isDemo) {
    const demo = generateDemoResults(filters);
    fallos = demo.fallos;
    total = demo.total;
  }

  const fuentes = [...new Set(fallos.map((f) => f.fuente))];
  const pageSize = 10;
  const paginaActual = filters.pagina || 1;

  const result: SearchResult & { isDemo?: boolean } = {
    fallos: fallos.slice(0, pageSize),
    total: Math.max(total, fallos.length),
    pagina: paginaActual,
    totalPaginas: Math.ceil(Math.max(total, fallos.length) / pageSize),
    fuentes,
    isDemo,
  };

  return NextResponse.json(result);
}
