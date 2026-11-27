// Estándar pantalla de inicio v1.0.0 — tarjeta de widget (README §2.9)
import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * - `listo`: muestra el contenido.
 * - `cargando`: ícono de carga en lugar del contenido (es una sección, no toda la pantalla).
 * - `proximamente`: el widget todavía no tiene datos; lleva la etiqueta en el encabezado y su
 *   contenido se muestra con «—» en lugar de valores.
 */
export type EstadoWidget = 'listo' | 'cargando' | 'proximamente';

/**
 * Base de las tarjetas de información del inicio. Todas comparten la misma anatomía para que se
 * vean parejas una al lado de la otra:
 *
 * - Encabezado de una línea: ícono, título y, a la derecha, una acción opcional (atributo `accion`).
 * - Cuerpo con **4 filas** de dato de 36 px. Con el mismo número de filas, las tarjetas de una
 *   fila de la cuadrícula miden lo mismo sin forzar alturas. Ver las clases de fila en el README.
 */
@Component({
  selector: 'app-widget-card',
  standalone: true,
  templateUrl: './widget-card.component.html',
  imports: [TranslatePipe],
  host: { style: 'display: block' },
})
export class WidgetCardComponent {
  readonly titulo = input.required<string>();
  readonly icono = input('fa-solid fa-circle-info');
  readonly estado = input<EstadoWidget>('listo');
}
