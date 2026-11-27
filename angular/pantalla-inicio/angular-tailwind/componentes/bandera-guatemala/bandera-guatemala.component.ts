// Estándar pantalla de inicio v1.0.0 — bandera de Guatemala del mes patrio (README §2.14), nivel 4
import { Component } from '@angular/core';

/**
 * Tres franjas verticales iguales, celeste, blanco y celeste, en proporción 8:5, sin el escudo (al
 * tamaño del saludo no se distinguiría). Colores fijos a propósito: es la bandera, no parte de la
 * interfaz. Un borde tenue la separa del fondo para que la franja blanca no se pierda en claro.
 * Se dimensiona por el ancho; el alto sale de la proporción. Igual en las dos implementaciones.
 */
@Component({
  selector: 'app-bandera-guatemala',
  standalone: true,
  host: { style: 'display: inline-block', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 24 15" style="display: block; width: 100%; height: auto" focusable="false">
      <rect width="24" height="15" rx="1.6" fill="#4997D0" />
      <rect x="8" width="8" height="15" fill="#ffffff" />
      <rect x="0.25" y="0.25" width="23.5" height="14.5" rx="1.45" fill="none" stroke="rgb(0 0 0 / 0.15)" stroke-width="0.5" />
    </svg>
  `,
})
export class BanderaGuatemalaComponent {}
