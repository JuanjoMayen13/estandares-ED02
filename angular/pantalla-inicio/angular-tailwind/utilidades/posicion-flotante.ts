// Estándar pantalla de inicio v1.0.0 — posición de los paneles flotantes (README §3.2)

/** Dónde dibujar un panel flotante junto a un ícono de una barra compacta. */
export interface PosicionFlotante {
  top: number;
  left: number;
  maxAlto: number;
}

const MARGEN = 12;
const SEPARACION = 8;
/** Alto mínimo que se intenta dejar visible; si no cabe debajo del ícono, el panel sube. */
const ALTO_MINIMO = 320;

/**
 * Posición (fija, en px de la ventana) de un panel flotante de `ancho` px junto al ícono que lo
 * abrió: a la derecha del ícono si la barra está a la izquierda de la pantalla, y a la izquierda
 * si la barra está a la derecha. Nunca se sale de la ventana.
 */
export function posicionFlotante(icono: DOMRect, lado: 'derecha' | 'izquierda', ancho: number): PosicionFlotante {
  const altoVentana = window.innerHeight;
  const top = Math.max(MARGEN, Math.min(icono.top, altoVentana - ALTO_MINIMO));
  const left =
    lado === 'derecha'
      ? Math.min(icono.right + SEPARACION, window.innerWidth - ancho - MARGEN)
      : Math.max(MARGEN, icono.left - ancho - SEPARACION);

  return { top, left, maxAlto: altoVentana - top - MARGEN };
}
