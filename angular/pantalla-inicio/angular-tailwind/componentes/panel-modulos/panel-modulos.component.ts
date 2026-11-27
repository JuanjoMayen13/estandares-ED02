// Estándar pantalla de inicio v1.0.0 — panel de módulos (README §2.5 y §3.3)
import { Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { coincideBusqueda } from '../../utilidades/busqueda';
import { inicialesDe } from '../../utilidades/iniciales';
import { Aplicativo, EstadoCarga, EstadoPanel, NodoPantalla, Pantalla } from '../../utilidades/modelos';
import { PosicionFlotante, posicionFlotante } from '../../utilidades/posicion-flotante';
import { ArbolPantallasComponent } from '../arbol-pantallas/arbol-pantallas.component';

interface Flotante extends PosicionFlotante {
  aplicativo: Aplicativo;
}

const ANCHO_FLOTANTE = 288;
const MAXIMO_RESULTADOS = 50;

/**
 * Navegador de aplicativos de la pantalla de inicio: acordeón con el árbol de cada aplicativo y un
 * filtro sobre todas las pantallas. Tres estados (`estado`) y una variante `capa`, que es el mismo
 * panel expandido dentro de una capa en tablet y celular.
 *
 * No navega por su cuenta: emite `abrir` con la pantalla elegida y la pantalla de inicio decide.
 */
@Component({
  selector: 'app-panel-modulos',
  standalone: true,
  templateUrl: './panel-modulos.component.html',
  imports: [TranslatePipe, ArbolPantallasComponent],
  host: { style: 'display: block; height: 100%' },
})
export class PanelModulosComponent {
  private readonly elemento = inject(ElementRef<HTMLElement>);

  readonly estado = input<EstadoPanel>('expandido');
  readonly variante = input<'lateral' | 'capa'>('lateral');
  readonly aplicativos = input<Aplicativo[]>([]);
  readonly arboles = input<Record<number, NodoPantalla[]>>({});
  /** Todas las pantallas que el usuario puede abrir (ver `aplanarPantallas`). */
  readonly pantallas = input<Pantalla[]>([]);
  readonly carga = input<EstadoCarga>('cargando');
  readonly puedeAbrir = input<(nodo: NodoPantalla) => boolean>(() => true);
  /** Aplicativo desplegado en el acordeón; lo recuerda `EstadoPanelesService`. */
  readonly aplicativoAbierto = input<number | null>(null);

  readonly abrir = output<Pantalla>();
  readonly cambiarEstado = output<EstadoPanel>();
  readonly alternarAplicativo = output<number>();
  readonly reintentar = output<void>();
  readonly cerrar = output<void>();

  /** Filas de silueta mientras cargan los aplicativos. */
  protected readonly SILUETAS = [1, 2, 3, 4, 5, 6];
  protected readonly filtro = signal('');
  protected readonly flotante = signal<Flotante | null>(null);

  protected readonly compacto = computed(() => this.variante() === 'lateral' && this.estado() === 'compacto');

  protected readonly resultados = computed(() => {
    const texto = this.filtro().trim();
    if (!texto) return [];
    return this.pantallas()
      .filter((p) => coincideBusqueda(p.textoBusqueda, texto))
      .slice(0, MAXIMO_RESULTADOS);
  });

  protected readonly cantidadPorAplicativo = computed(() => {
    const conteo: Record<number, number> = {};
    for (const p of this.pantallas()) conteo[p.aplicativo.id] = (conteo[p.aplicativo.id] ?? 0) + 1;
    return conteo;
  });

  protected arbolDe(aplicativo: Aplicativo): NodoPantalla[] {
    return this.arboles()[aplicativo.id] ?? [];
  }

  protected iniciales(texto: string): string {
    return inicialesDe(texto);
  }

  /** Un nodo del árbol elegido: se arma la `Pantalla` con su ubicación. */
  protected elegirNodo(aplicativo: Aplicativo, nodo: NodoPantalla): void {
    const pantalla =
      this.pantallas().find((p) => p.aplicativo.id === aplicativo.id && p.nodo.id === nodo.id) ??
      ({ aplicativo, nodo, nombre: nodo.nombre, ubicacion: aplicativo.nombre, textoBusqueda: '' } as Pantalla);
    this.elegir(pantalla);
  }

  protected elegir(pantalla: Pantalla): void {
    this.flotante.set(null);
    this.abrir.emit(pantalla);
  }

  protected limpiarFiltro(): void {
    this.filtro.set('');
  }

  /** Modo compacto: abre (o cierra) junto al ícono el árbol de ese aplicativo. */
  protected alternarFlotante(aplicativo: Aplicativo, evento: MouseEvent): void {
    evento.stopPropagation();
    if (this.flotante()?.aplicativo === aplicativo) {
      this.flotante.set(null);
      return;
    }
    const icono = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    this.flotante.set({ aplicativo, ...posicionFlotante(icono, 'derecha', ANCHO_FLOTANTE) });
  }

  protected cerrarFlotante(): void {
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
