// Estándar pantalla de inicio v1.0.0 — menú del usuario (README §2.11 y §3.11)
import { Component, ElementRef, HostListener, ViewChild, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { colorUsuario, inicialesUsuario } from '../../utilidades/iniciales';
import { AccionMenu } from '../../utilidades/modelos';

const SELECTOR_ITEMS = '[role="menuitem"], [role="menuitemcheckbox"]';

/**
 * Menú del avatar en el header: quién está conectado y dónde, las acciones del proyecto
 * (`acciones`), la ambientación de temporada (a propósito aquí y no a la vista: es de poco uso) y
 * el cierre de sesión.
 */
@Component({
  selector: 'app-menu-usuario',
  standalone: true,
  templateUrl: './menu-usuario.component.html',
  imports: [TranslatePipe],
  host: { style: 'position: relative; display: block' },
})
export class MenuUsuarioComponent {
  private readonly elemento = inject(ElementRef<HTMLElement>);

  readonly usuario = input('');
  readonly empresa = input('');
  readonly estacion = input('');
  readonly acciones = input<AccionMenu[]>([]);
  /** Estado de la ambientación de temporada; `null` oculta la opción. */
  readonly ambientacion = input<boolean | null>(null);

  readonly accion = output<string>();
  readonly cambiarAmbientacion = output<boolean>();
  readonly cerrarSesion = output<void>();

  @ViewChild('disparador') private disparador?: ElementRef<HTMLButtonElement>;
  @ViewChild('lista') private lista?: ElementRef<HTMLElement>;

  protected readonly abierto = signal(false);
  protected readonly iniciales = computed(() => inicialesUsuario(this.usuario()));
  /** Siempre el mismo color para la misma persona y distinto entre compañeros. */
  protected readonly colorAvatar = computed(() => colorUsuario(this.usuario()));

  protected alternar(): void {
    if (this.abierto()) this.cerrar();
    else this.abrir();
  }

  protected elegir(id: string): void {
    this.cerrar(false);
    this.accion.emit(id);
  }

  protected salir(): void {
    this.cerrar(false);
    this.cerrarSesion.emit();
  }

  /** Flechas arriba/abajo recorren las opciones en círculo; Inicio/Fin van a la primera/última. */
  protected alTeclear(evento: KeyboardEvent): void {
    const items = Array.from(this.lista?.nativeElement.querySelectorAll<HTMLElement>(SELECTOR_ITEMS) ?? []);
    if (!items.length) return;
    const actual = items.indexOf(document.activeElement as HTMLElement);
    const destino: Record<string, number> = {
      ArrowDown: (actual + 1) % items.length,
      ArrowUp: (actual - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (evento.key in destino) {
      evento.preventDefault();
      items[destino[evento.key]].focus();
    }
  }

  private abrir(): void {
    this.abierto.set(true);
    // Foco a la primera opción cuando el menú ya está en el DOM
    setTimeout(() => this.lista?.nativeElement.querySelector<HTMLElement>(SELECTOR_ITEMS)?.focus());
  }

  private cerrar(devolverFoco = true): void {
    this.abierto.set(false);
    if (devolverFoco) this.disparador?.nativeElement.focus();
  }

  @HostListener('document:click', ['$event'])
  protected alClicFuera(evento: MouseEvent): void {
    if (this.abierto() && !this.elemento.nativeElement.contains(evento.target as Node)) this.abierto.set(false);
  }

  @HostListener('document:keydown.escape')
  protected alEscape(): void {
    if (this.abierto()) this.cerrar();
  }
}
