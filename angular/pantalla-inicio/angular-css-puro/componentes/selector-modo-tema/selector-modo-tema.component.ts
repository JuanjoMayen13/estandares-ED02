// Estándar pantalla de inicio v1.0.0 — selector del modo de la interfaz (README §2.6)
import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ModoTema } from '../../utilidades/modelos';

interface OpcionModo {
  valor: ModoTema;
  etiqueta: string;
  icono: string;
}

/**
 * Elección del modo de la interfaz: Claro, Oscuro o Automático (el del sistema), en tres tarjetas
 * con una miniatura de cómo se ve la interfaz en cada modo. Es la sección «Tema de la interfaz» del
 * panel de preferencias; el título lo pone el panel.
 *
 * No aplica el tema: avisa la elección (`cambiar`) y el proyecto la aplica con su propio servicio
 * de tema y devuelve el modo actual en `modo`.
 */
@Component({
  selector: 'app-selector-modo-tema',
  standalone: true,
  templateUrl: './selector-modo-tema.component.html',
  styleUrl: './selector-modo-tema.component.css',
  imports: [TranslatePipe],
})
export class SelectorModoTemaComponent {
  readonly modo = input<ModoTema>('claro');
  readonly cambiar = output<ModoTema>();

  protected readonly opciones: OpcionModo[] = [
    { valor: 'claro', etiqueta: 'inicio.modoClaro', icono: 'fa-solid fa-sun' },
    { valor: 'oscuro', etiqueta: 'inicio.modoOscuro', icono: 'fa-solid fa-moon' },
    { valor: 'automatico', etiqueta: 'inicio.modoAutomatico', icono: 'fa-solid fa-circle-half-stroke' },
  ];

  protected indice(): number {
    return Math.max(0, this.opciones.findIndex((o) => o.valor === this.modo()));
  }

  protected elegir(modo: ModoTema): void {
    if (modo !== this.modo()) this.cambiar.emit(modo);
  }

  /** Flechas: pasan a la opción vecina y la eligen (patrón de un grupo de radios). */
  protected alPresionarTecla(evento: KeyboardEvent): void {
    const salto =
      evento.key === 'ArrowRight' || evento.key === 'ArrowDown'
        ? 1
        : evento.key === 'ArrowLeft' || evento.key === 'ArrowUp'
          ? -1
          : 0;
    if (!salto) return;

    evento.preventDefault();
    const n = this.opciones.length;
    const siguiente = (this.indice() + salto + n) % n;
    const grupo = evento.currentTarget as HTMLElement;

    this.elegir(this.opciones[siguiente].valor);
    // Espera a que el tabindex de la opción elegida se actualice
    setTimeout(() => grupo.querySelectorAll<HTMLElement>('[role="radio"]')[siguiente]?.focus());
  }
}
