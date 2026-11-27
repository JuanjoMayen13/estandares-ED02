// Estándar pantalla de inicio v1.0.0 — árbol de pantallas de un aplicativo (README §2.5)
import { Component, OnChanges, SimpleChanges, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NodoPantalla } from '../../utilidades/modelos';

/**
 * Árbol de un aplicativo (grupos y pantallas): «+»/«−» para expandir, contador de hijos y un punto
 * en las pantallas. Respeta el orden y los nombres que entrega la fuente de datos y admite
 * cualquier profundidad. No modifica los nodos: lo expandido vive en este componente.
 * Elegir un grupo lo expande; elegir una pantalla emite `seleccionado`.
 */
@Component({
  selector: 'app-arbol-pantallas',
  standalone: true,
  templateUrl: './arbol-pantallas.component.html',
  imports: [NgTemplateOutlet, TranslatePipe],
  host: { style: 'display: block' },
})
export class ArbolPantallasComponent implements OnChanges {
  readonly nodos = input<NodoPantalla[]>([]);
  /** Id de la pantalla actual, resaltada. */
  readonly idActual = input<number | null>(null);
  /** Ids de los grupos que empiezan expandidos (normalmente, el camino hasta la pantalla actual). */
  readonly expandirHasta = input<number[]>([]);
  /** Las pantallas que no se pueden abrir se muestran deshabilitadas. */
  readonly puedeAbrir = input<(nodo: NodoPantalla) => boolean>(() => true);

  readonly seleccionado = output<NodoPantalla>();

  protected readonly expandidos = signal(new Set<number>());

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['expandirHasta']) this.expandidos.set(new Set(this.expandirHasta()));
  }

  protected esGrupo(nodo: NodoPantalla): boolean {
    return nodo.hijos.length > 0;
  }

  protected estaExpandido(nodo: NodoPantalla): boolean {
    return this.expandidos().has(nodo.id);
  }

  protected alElegir(nodo: NodoPantalla): void {
    if (this.esGrupo(nodo)) {
      const nuevos = new Set(this.expandidos());
      if (!nuevos.delete(nodo.id)) nuevos.add(nodo.id);
      this.expandidos.set(nuevos);
    } else if (this.puedeAbrir()(nodo)) {
      this.seleccionado.emit(nodo);
    }
  }
}
