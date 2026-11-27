// Estándar pantalla de inicio v1.0.0 — accesos rápidos (README §2.8 y §3.5)
import { Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AccesoRapido } from '../../utilidades/modelos';

/**
 * Fijados y recientes como tarjetas en el centro de la pantalla de inicio. Siguen a la vista
 * aunque el usuario compacte u oculte el panel de módulos.
 *
 * No guarda nada: avisa `fijar`, `quitarFijado` y `borrarRecientes`, y la pantalla de inicio
 * actualiza las listas (ver `AccesosService`).
 */
@Component({
  selector: 'app-accesos-rapidos',
  standalone: true,
  templateUrl: './accesos-rapidos.component.html',
  imports: [TranslatePipe, NgTemplateOutlet],
  host: { style: 'display: block' },
})
export class AccesosRapidosComponent {
  readonly fijados = input<AccesoRapido[]>([]);
  readonly recientes = input<AccesoRapido[]>([]);
  /** Cuántos fijados hay guardados (incluye los que hoy no se muestran), para el límite. */
  readonly totalFijados = input(0);
  readonly maximoFijados = input(8);
  readonly cargado = input(false);
  /** Celular: una tira que se desliza de lado (por debajo de 640 px) en lugar de una cuadrícula. */
  readonly horizontal = input(false);

  readonly abrir = output<AccesoRapido>();
  readonly fijar = output<AccesoRapido>();
  readonly quitarFijado = output<AccesoRapido>();
  readonly borrarRecientes = output<void>();
}
