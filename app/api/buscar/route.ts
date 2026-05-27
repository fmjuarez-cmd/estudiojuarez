import { NextRequest, NextResponse } from "next/server";
import { searchCSJN, searchSAIJ, generateDemoResults } from "@/lib/csjn";
import { searchJUBA, searchCIJ } from "@/lib/sources";
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

  // CSJN siempre primaria; SAIJ, JUBA y CIJ subsidiarias
  const [csjnS, saijS, jubaS, cijS] = await Promise.allSettled([
    searchCSJN(filters),
    searchSAIJ(filters),
    searchJUBA(filters),
    searchCIJ(filters),
  ]);

  const csjn = csjnS.status === "fulfilled" ? csjnS.value : { fallos: [], total: 0 };
  const saij = saijS.status === "fulfilled" ? saijS.value : { fallos: [], total: 0 };
  const juba = jubaS.status === "fulfilled" ? jubaS.value : { fallos: [], total: 0 };
  const cij = cijS.status === "fulfilled" ? cijS.value : { fallos: [], total: 0 };

  // CSJN results first, then others
  let fallos = [...csjn.fallos, ...saij.fallos, ...juba.fallos, ...cij.fallos];
  let total = csjn.total + saij.total + juba.total + cij.total;

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
