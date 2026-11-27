// Estándar pantalla de inicio v1.0.0 — ejemplo para armar el árbol desde una lista plana (README §4.3)
import { NodoPantalla } from './modelos';

/** Una fila de una fuente de datos plana: cada nodo dice quién es su padre. */
export interface FilaPantalla {
  id: number;
  /** `null` o 0 en el primer nivel. */
  padreId: number | null;
  nombre: string;
  /** `true` si la fila es una pantalla que se puede abrir (no un grupo vacío). */
  esPantalla: boolean;
}

/**
 * Arma el árbol de un aplicativo a partir de una lista plana y quita las ramas que no llevan a
 * nada: un grupo sin hijos válidos o una fila que no es pantalla. Respeta el orden de la lista.
 * Una fila cuyo padre no vino en la lista se descarta.
 *
 * Es un ejemplo: si la fuente de datos del proyecto ya entrega un árbol, basta con convertirlo a
 * `NodoPantalla`.
 */
export function construirArbol(filas: FilaPantalla[]): NodoPantalla[] {
  const porId = new Map<number, NodoPantalla & { esPantalla: boolean }>();
  for (const fila of filas) porId.set(fila.id, { id: fila.id, nombre: fila.nombre, hijos: [], esPantalla: fila.esPantalla });

  const raices: (NodoPantalla & { esPantalla: boolean })[] = [];
  for (const fila of filas) {
    const nodo = porId.get(fila.id)!;
    if (!fila.padreId) raices.push(nodo);
    else porId.get(fila.padreId)?.hijos.push(nodo);
  }

  const esValido = (nodo: NodoPantalla): boolean => {
    if (nodo.hijos.length > 0) {
      nodo.hijos = nodo.hijos.filter(esValido);
      return nodo.hijos.length > 0;
    }
    return (nodo as NodoPantalla & { esPantalla: boolean }).esPantalla;
  };

  return raices.filter(esValido);
}
