// Estándar pantalla de inicio v1.0.0 — buscador de pantallas, Ctrl+K (README §2.10 y §3.4)
import { Component, ElementRef, ViewChild, computed, effect, input, model, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { coincideBusqueda, normalizarBusqueda } from '../../utilidades/busqueda';
import { Pantalla } from '../../utilidades/modelos';

const MAXIMO_RESULTADOS = 50;

/**
 * Busca en todas las pantallas de todos los aplicativos del usuario por nombre y por ubicación, y
 * la abre con Enter. Sin texto, sugiere los accesos rápidos.
 */
@Component({
  selector: 'app-buscador-pantallas',
  standalone: true,
  templateUrl: './buscador-pantallas.component.html',
  imports: [TranslatePipe],
})
export class BuscadorPantallasComponent {
  readonly abierto = model(false);
  readonly pantallas = input<Pantalla[]>([]);
  readonly sugeridas = input<Pantalla[]>([]);

  readonly abrir = output<Pantalla>();

  @ViewChild('campo') private campo?: ElementRef<HTMLInputElement>;
  @ViewChild('lista') private lista?: ElementRef<HTMLElement>;

  protected readonly texto = signal('');
  protected readonly activo = signal(0);

  protected readonly resultados = computed<Pantalla[]>(() => {
    const texto = this.texto().trim();
    if (!texto) return this.sugeridas();

    const inicio = normalizarBusqueda(texto);
    return this.pantallas()
      .filter((p) => coincideBusqueda(p.textoBusqueda, texto))
      // Primero las que empiezan por lo escrito: «dep» → «Depósitos» antes que «Reporte de depósitos»
      .sort(
        (a, b) =>
          Number(normalizarBusqueda(b.nombre).startsWith(inicio)) - Number(normalizarBusqueda(a.nombre).startsWith(inicio)),
      )
      .slice(0, MAXIMO_RESULTADOS);
  });

  constructor() {
    // Cada vez que se abre: texto vacío, primera opción activa y foco en el campo
    effect(() => {
      if (this.abierto()) {
        this.texto.set('');
        this.activo.set(0);
        setTimeout(() => this.campo?.nativeElement.focus());
      }
    });
  }

  protected escribir(valor: string): void {
    this.texto.set(valor);
    this.activo.set(0);
  }

  protected alTeclear(evento: KeyboardEvent): void {
    const total = this.resultados().length;
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        if (total) this.moverA((this.activo() + 1) % total);
        break;
      case 'ArrowUp':
        evento.preventDefault();
        if (total) this.moverA((this.activo() - 1 + total) % total);
        break;
      case 'Enter': {
        evento.preventDefault();
        const elegida = this.resultados()[this.activo()];
        if (elegida) this.elegir(elegida);
        break;
      }
      case 'Escape':
        evento.preventDefault();
        evento.stopPropagation();
        this.cerrar();
        break;
    }
  }

  protected elegir(pantalla: Pantalla): void {
    this.cerrar();
    this.abrir.emit(pantalla);
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected idOpcion(indice: number): string {
    return `buscador-opcion-${indice}`;
  }

  private moverA(indice: number): void {
    this.activo.set(indice);
    // Que la opción activa quede a la vista al recorrer con las flechas
    setTimeout(() => this.lista?.nativeElement.querySelector(`#${this.idOpcion(indice)}`)?.scrollIntoView({ block: 'nearest' }));
  }
}
