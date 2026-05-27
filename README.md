# JuriSearch — Buscador de Jurisprudencia Argentina

Aplicación web para buscar jurisprudencia argentina. Consulta la **CSJN**
(Corte Suprema de Justicia de la Nación) como fuente primaria y, de forma
subsidiaria, **SAIJ**, **JUBA** (Suprema Corte de Buenos Aires) y **CIJ**.
Incluye accesos directos a plataformas especializadas (La Ley, Microjuris,
Jurídica, Civilia, Al Día Argentina, entre otras).

## Funcionalidades

- Búsqueda por texto libre con autocompletado de términos jurídicos
- Filtros por **provincia/jurisdicción** (23 provincias + CABA), **fuero**
  (civil, penal, laboral, familia, etc.) y **materia**
- Cita oficial de cada fallo (`Fallos: tomo:página`), expediente y tipo de
  resolución
- Acceso al fallo completo y descarga desde la fuente oficial
- Aviso claro cuando una fuente no responde (nunca muestra datos falsos como
  reales)

## Desarrollo local

Requiere [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install      # instala dependencias (solo la primera vez)
npm run dev      # arranca en http://localhost:3000
npm test         # corre los tests automáticos
npm run build    # genera la versión de producción
```

## Poner la app online (deploy)

La forma más simple es **Vercel** (gratuito, creado por los autores de Next.js):

1. Entrá a [vercel.com](https://vercel.com) y registrate con tu cuenta de GitHub.
2. Hacé clic en **"Add New… → Project"**.
3. Elegí el repositorio `estudiojuarez` de la lista.
4. Vercel detecta Next.js automáticamente: hacé clic en **"Deploy"**.
5. En 1–2 minutos te da una URL pública (ej. `jurisearch.vercel.app`).

No hay que configurar nada más: la app no requiere variables de entorno ni
base de datos.

## Estructura del proyecto

| Carpeta / archivo | Contenido |
|---|---|
| `app/page.tsx` | Página de inicio con buscador y fuentes |
| `app/buscar/page.tsx` | Resultados de búsqueda con filtros |
| `lib/csjn.ts` | Integración con CSJN y SAIJ + parsers |
| `lib/sources.ts` | JUBA, CIJ y catálogo de fuentes externas |
| `lib/types.ts` | Tipos y listas de provincias/fueros/materias |
| `components/` | Buscador, tarjeta de resultado, filtros |
| `lib/csjn.test.ts` | Tests automáticos de los parsers |

## Nota sobre las fuentes

Los fallos son propiedad de sus respectivos tribunales y organismos oficiales.
JuriSearch solo facilita la búsqueda y enlaza a las fuentes originales.
