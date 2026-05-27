import { describe, it, expect } from "vitest";
import {
  parseSAIJResponse,
  parseCSJNResults,
  detectMateria,
  mapProvinciaToSAIJ,
  generateDemoResults,
} from "./csjn";
import type { SearchFilters } from "./types";

const baseFilters: SearchFilters = { query: "despido sin causa" };

describe("parseSAIJResponse — formato JSON real de SAIJ", () => {
  // SAIJ devuelve documentAbstract como JSON stringificado (doble codificado)
  const saijJson = JSON.stringify({
    searchResults: {
      totalNumberOfResults: 142,
      documentResultList: [
        {
          uuid: "fa20230001",
          documentAbstract: JSON.stringify({
            document: {
              content: {
                uuid: "fa20230001",
                titulo: "Pérez c/ Empresa S.A. s/ despido",
                fecha: "2023-08-15",
                tribunal: "Cámara Nacional de Apelaciones del Trabajo",
                jurisdiccion: { codigo: "NAC", descripcion: "Nacional" },
                rama: "laboral",
                sumario: "El despido sin causa genera derecho a indemnización conforme la LCT.",
              },
            },
          }),
        },
      ],
    },
  });

  it("extrae el contenido del documentAbstract doble-codificado", () => {
    const { fallos, total } = parseSAIJResponse(saijJson, baseFilters);
    expect(total).toBe(142);
    expect(fallos).toHaveLength(1);
    expect(fallos[0].titulo).toBe("Pérez c/ Empresa S.A. s/ despido");
    expect(fallos[0].tribunal).toBe("Cámara Nacional de Apelaciones del Trabajo");
    expect(fallos[0].fuero).toBe("laboral");
    expect(fallos[0].fuente).toBe("SAIJ");
  });

  it("normaliza la jurisdicción 'Nacional' al valor interno", () => {
    const { fallos } = parseSAIJResponse(saijJson, baseFilters);
    expect(fallos[0].provincia).toBe("nacional");
  });

  it("construye una URL al documento usando el uuid", () => {
    const { fallos } = parseSAIJResponse(saijJson, baseFilters);
    expect(fallos[0].url).toContain("fa20230001");
  });

  it("normaliza jurisdicción provincial al value interno", () => {
    const provincial = JSON.stringify({
      searchResults: {
        totalNumberOfResults: 1,
        documentResultList: [
          {
            documentAbstract: JSON.stringify({
              document: {
                content: {
                  titulo: "Fallo bonaerense",
                  jurisdiccion: { descripcion: "Buenos Aires" },
                },
              },
            }),
          },
        ],
      },
    });
    const { fallos } = parseSAIJResponse(provincial, baseFilters);
    expect(fallos[0].provincia).toBe("buenos_aires");
  });

  it("soporta entradas planas (sin documentAbstract)", () => {
    const flat = JSON.stringify({
      total: 2,
      items: [
        { id: "x1", titulo: "Fallo plano A", fecha: "2022-01-01" },
        { id: "x2", title: "Fallo plano B" },
      ],
    });
    const { fallos, total } = parseSAIJResponse(flat, baseFilters);
    expect(total).toBe(2);
    expect(fallos).toHaveLength(2);
    expect(fallos[0].titulo).toBe("Fallo plano A");
  });

  it("cae al parser HTML si la respuesta no es JSON", () => {
    const html = `<article class="resultado"><h3>Fallo HTML</h3><p>Sumario de prueba</p><span>12/05/2023</span></article>`;
    const { fallos } = parseSAIJResponse(html, baseFilters);
    expect(fallos).toHaveLength(1);
    expect(fallos[0].titulo).toBe("Fallo HTML");
  });

  it("no rompe ante JSON vacío o malformado", () => {
    expect(parseSAIJResponse("{}", baseFilters).fallos).toEqual([]);
    expect(parseSAIJResponse("no es json {[", baseFilters).fallos).toEqual([]);
    expect(parseSAIJResponse("", baseFilters).fallos).toEqual([]);
  });

  it("limita a 10 resultados por página", () => {
    const many = {
      searchResults: {
        totalNumberOfResults: 50,
        documentResultList: Array.from({ length: 25 }, (_, i) => ({
          documentAbstract: JSON.stringify({
            document: { content: { titulo: `Fallo ${i}` } },
          }),
        })),
      },
    };
    const { fallos, total } = parseSAIJResponse(JSON.stringify(many), baseFilters);
    expect(fallos).toHaveLength(10);
    expect(total).toBe(50);
  });
});

describe("parseCSJNResults — parsing HTML de CSJN", () => {
  it("extrae fallos de la estructura HTML de resultados", () => {
    const html = `
      <div class="resultados">
        <a title="Recurso extraordinario por arbitrariedad" href="/documentos/listarDocumentos?id=1">ver</a>
        <span>10/03/2024</span>
      </div>
      <div class="resultados">
        <a title="Amparo derecho a la salud" href="/documentos/listarDocumentos?id=2">ver</a>
        <span>22/11/2023</span>
      </div>
    `;
    const { fallos } = parseCSJNResults(html, "amparo");
    expect(fallos.length).toBeGreaterThanOrEqual(1);
    expect(fallos[0].tribunal).toContain("Corte Suprema");
    expect(fallos[0].fuente).toBe("CSJN");
  });

  it("devuelve vacío ante HTML sin resultados", () => {
    expect(parseCSJNResults("<html><body>nada</body></html>", "x").fallos).toEqual([]);
  });
});

describe("detectMateria", () => {
  it.each([
    ["juicio por alimentos", "alimentos"],
    ["divorcio vincular", "divorcio"],
    ["daños y perjuicios por accidente", "daños_perjuicios"],
    ["despido sin justa causa", "despido"],
    ["recurso extraordinario federal", "recurso_extraordinario"],
    ["acción de amparo", "amparo"],
    ["texto sin materia reconocible", ""],
  ])("detecta '%s' como '%s'", (texto, esperado) => {
    expect(detectMateria(texto)).toBe(esperado);
  });
});

describe("mapProvinciaToSAIJ", () => {
  it("mapea values internos a nombres de SAIJ", () => {
    expect(mapProvinciaToSAIJ("buenos_aires")).toBe("Buenos Aires");
    expect(mapProvinciaToSAIJ("caba")).toBe("Ciudad Autónoma de Buenos Aires");
    expect(mapProvinciaToSAIJ("cordoba")).toBe("Córdoba");
  });

  it("devuelve el value original si no hay mapeo", () => {
    expect(mapProvinciaToSAIJ("desconocida")).toBe("desconocida");
  });
});

describe("generateDemoResults", () => {
  it("siempre incluye un fallo de CSJN", () => {
    const { fallos } = generateDemoResults(baseFilters);
    expect(fallos.some((f) => f.fuente === "CSJN")).toBe(true);
  });

  it("filtra por provincia incluyendo siempre los nacionales", () => {
    const { fallos } = generateDemoResults({ query: "x", provincia: "cordoba" });
    for (const f of fallos) {
      expect(["cordoba", "nacional"]).toContain(f.provincia);
    }
  });
});
