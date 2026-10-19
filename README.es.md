# Refit

Tomé un flujo de registro hecho mal a propósito, encontré qué fallaba, lo reconstruí y puse un script a medir la diferencia.

**Violaciones de axe: 9 → 0.** Elementos afectados: 15 → 0. Pantallas para terminar: 5 → 3.

Medido con axe-core 4.14.0, todas las reglas, con las etiquetas WCAG 2.0, 2.1 y 2.2 A y AA, en el flujo viejo y en cada paso del rediseño en inglés y en español. El número de después solo es válido porque la tarea completa, del primer campo a la confirmación, se puede terminar solo con el teclado. Una prueba en navegador lo hace en los dos idiomas.

Para reproducirlo: `bun run measure`. Imprime una línea de JSON por stdout y además escribe el detalle (reglas, nodos, versiones, fecha) en `data/measure.json`, que la página lee para su sección Comparar.

Versión en inglés: [README.md](README.md).

## Cómo ejecutarlo

Necesita Bun 1.3 y Node 22 (Playwright corre con Node, ver abajo).

```bash
bun install
bun run dev        # http://localhost:3000/en/app y /es/app, sin variables de entorno
bun run build
bun run test       # pruebas unitarias y de componentes
bun run typecheck
bun run lint
bun run measure    # compila, sirve, ejecuta axe e imprime el JSON
bun run test:e2e   # compila y luego pruebas en navegador: teclado, axe, rutas y 375 px
```

Modo en vivo opcional: define `GEMINI_API_KEY`, `GROQ_API_KEY` o `OPENROUTER_API_KEY` y la página muestra un botón que pide a un modelo que audite el flujo viejo. Sin clave no cambia nada: la página muestra mi auditoría guardada, con la etiqueta de que la escribí yo. `SITE_URL` fija la base de las imágenes para redes sociales.

## Páginas

| Ruta | Qué es |
|---|---|
| `/{en,es}/app` | La página del producto: la idea, probar los dos flujos, la auditoría, los números medidos |
| `/{en,es}/redesign` | El flujo rediseñado solo, `?step=account\|plan\|done` |
| `/broken/index.html` | El flujo viejo, copiado sin cambios al compilar |

## Arquitectura

- `broken/` nunca se edita. `scripts/copy-broken.ts` lo copia a `public/broken/` antes de dev y build, y una prueba revisa la copia byte a byte y el origen contra un hash guardado.
- Next.js App Router. `proxy.ts` llama a `lib/routing.ts`, una tabla pura de redirecciones y 404.
- Un solo diccionario tipado, `Record<"en" | "es", Dictionary>`, guarda cada texto visible.
- El flujo es un reductor (`lib/flow`) con estado solo local, guardado en `sessionStorage` y validado con zod. La contraseña nunca se guarda.
- `scripts/measure.mjs` (Node) compila, arranca la app en un puerto libre, ejecuta axe con Playwright e imprime JSON. Sus partes puras están en `scripts/measure-lib.mjs` y tienen pruebas unitarias.
- La auditoría son datos (`data/audit.json`, en los dos idiomas, cada entrada ligada a un criterio WCAG o una heurística). La auditoría en vivo pasa por el router de `ai-kit/` en `app/api/audit`.
- Los tokens de identidad están en `app/tokens.css` y se documentan, con sus contrastes, en `DESIGN.md`.

## Decisiones

- **Contar pantallas sin escribir el número.** `steps.before` se obtiene de la página vieja: el grupo más grande de bloques hermanos donde exactamente uno se ve y el resto está oculto, contando solo los bloques ocultos o que tienen un control. Un recorrido con script sería exacto, pero solo para esta página. La heurística sirve en otras páginas con forma de asistente y vuelve a 1 si no encuentra nada.
- **Las violaciones se suman por página.** Si una regla falla en tres páginas cuenta tres. Es lo que da volver a pasar axe por cada ruta, y mantiene el número honesto si un paso empeora.
- **Pro viene elegido.** La tarea es elegir Pro, así que ya está elegido, y Gratis y Equipo quedan a una flecha de distancia. Ahorra un paso sin esconder la elección.

## Lo que no funcionó

- Mi primera regla para contar pantallas pedía exactamente un hermano visible. El flujo viejo tiene una barra de pasos junto a sus pasos, así que contaba 1. Ahora se ignoran los bloques visibles sin controles.
- La versión de Chromium que corresponde a la versión instalada de Playwright no estaba en esta máquina. `measure` ahora usa el Chromium más nuevo que encuentre, y además instalé el que corresponde.
- `ai-kit/` no pasa TypeScript estricto (`noUncheckedIndexedAccess`) en dos archivos que no uso. No lo edité. Está excluido de `tsc` y del linter, e importo solo el router, el limitador y los tipos.
- La primera versión de la prueba de teclado falló porque Next agrega su propio anunciador con `role="alert"`, así que acoté la prueba al resumen de errores.
- No probé con un lector de pantalla. Las revisiones automáticas encuentran como mucho un tercio de los problemas reales; este repositorio demuestra lo que una máquina puede ver, más la finalización con teclado.
