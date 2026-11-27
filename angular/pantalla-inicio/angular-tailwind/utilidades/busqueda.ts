// Estándar pantalla de inicio v1.0.0 — búsqueda de pantallas (README §3.3 y §3.4)
import { Aplicativo, NodoPantalla, Pantalla } from './modelos';

/** Minúsculas y sin tildes: «Depósito» y «deposito» deben encontrarse igual. */
export function normalizarBusqueda(texto: string): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** `true` si todas las palabras de la búsqueda aparecen en el texto, en cualquier orden. */
export function coincideBusqueda(textoNormalizado: string, busqueda: string): boolean {
  const palabras = normalizarBusqueda(busqueda).split(/\s+/).filter(Boolean);
  return palabras.every((p) => textoNormalizado.includes(p));
}

/**
 * Todas las pantallas que el usuario puede abrir, en el orden de los aplicativos y del árbol.
 * Los grupos no son pantallas: se recorren para armar la ubicación.
 */
export function aplanarPantallas(
  aplicativos: Aplicativo[],
  arboles: Record<number, NodoPantalla[]>,
  puedeAbrir: (nodo: NodoPantalla) => boolean,
): Pantalla[] {
  const salida: Pantalla[] = [];

  const recorrer = (aplicativo: Aplicativo, nodos: NodoPantalla[], camino: string[]): void => {
    for (const nodo of nodos) {
      if (nodo.hijos.length > 0) {
        recorrer(aplicativo, nodo.hijos, [...camino, nodo.nombre]);
      } else if (puedeAbrir(nodo)) {
        const ubicacion = camino.join(' › ');
        salida.push({
          aplicativo,
          nodo,
          nombre: nodo.nombre,
          ubicacion,
          textoBusqueda: normalizarBusqueda(`${nodo.nombre} ${ubicacion}`),
        });
      }
    }
  };

  for (const aplicativo of aplicativos) {
    recorrer(aplicativo, arboles[aplicativo.id] ?? [], [aplicativo.nombre]);
  }
  return salida;
}
