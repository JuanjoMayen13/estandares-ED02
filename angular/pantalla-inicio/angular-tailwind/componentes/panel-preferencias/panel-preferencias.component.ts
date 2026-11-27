// Estándar pantalla de inicio v1.0.0 — panel de preferencias (README §2.6)
import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AccionRapida, EstadoPanel, SeccionPreferencias } from '../../utilidades/modelos';
import { PosicionFlotante, posicionFlotante } from '../../utilidades/posicion-flotante';

interface Flotante extends PosicionFlotante {
  seccion: SeccionPreferencias;
}

const ANCHO_FLOTANTE = 304;

/**
 * Contenedor de preferencias en el lado derecho, con los mismos tres estados que el panel de
 * módulos. Las secciones las pone cada proyecto (`secciones`):
 *
 * - **Expandido**: todas las secciones una debajo de otra, cada una con su título.
 * - **Compacto**: barra de íconos; cada sección se abre en un panel flotante a la izquierda de la
 *   barra. `accionRapida`, si se indica, es un ícono que actúa directo (p. ej. claro ⇄ oscuro).
 * - **Oculto**: lo maneja la pantalla de inicio (no se dibuja).
 *
 * La variante `capa` es el panel expandido dentro de una capa (tablet y celular).
 */
@Component({
  selector: 'app-panel-preferencias',
  standalone: true,
  templateUrl: './panel-preferencias.component.html',
  imports: [TranslatePipe, NgTemplateOutlet],
  host: { style: 'display: block; height: 100%' },
})
export class PanelPreferenciasComponent {
  private readonly elemento = inject(ElementRef<HTMLElement>);

  readonly estado = input<EstadoPanel>('expandido');
  readonly variante = input<'lateral' | 'capa'>('lateral');
  readonly secciones = input<SeccionPreferencias[]>([]);
  readonly accionRapida = input<AccionRapida | null>(null);

  readonly cambiarEstado = output<EstadoPanel>();
  readonly cerrar = output<void>();
  readonly accionRapidaElegida = output<void>();

  protected readonly flotante = signal<Flotante | null>(null);

  protected esCompacto(): boolean {
    return this.variante() === 'lateral' && this.estado() === 'compacto';
  }

  /** Barra compacta: abre (o cierra) la sección a la izquierda de la barra. */
  protected alternarFlotante(seccion: SeccionPreferencias, evento: MouseEvent): void {
    evento.stopPropagation();
    if (this.flotante()?.seccion.id === seccion.id) {
      this.flotante.set(null);
      return;
    }
    const icono = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    this.flotante.set({ seccion, ...posicionFlotante(icono, 'izquierda', ANCHO_FLOTANTE) });
  }

  /** Para que el contenido de una sección pueda cerrar el flotante al ejecutar una acción. */
  cerrarFlotante(): void {
    this.flotante.set(null);
  }

  @HostListener('document:click', ['$event'])
  protected alClicFuera(evento: MouseEvent): void {
    if (this.flotante() && !this.elemento.nativeElement.contains(evento.target as Node)) this.flotante.set(null);
  }

  @HostListener('document:keydown.escape')
  protected alEscape(): void {
    if (this.flotante()) this.flotante.set(null);
  }

  @HostListener('window:resize')
  protected alRedimensionar(): void {
    this.flotante.set(null);
  }
}
