// Estándar pantalla de inicio v1.0.0 — estado de los paneles laterales (README §3.1 y §3.7)
import { DestroyRef, Injectable, computed, signal } from '@angular/core';
import { EstadoPanel } from '../utilidades/modelos';

export type Panel = 'modulos' | 'preferencias';

/**
 * Rangos de ancho con regla propia (ver `TAMANOS`):
 * - `grande` (≥ 1536): caben los dos paneles expandidos.
 * - `laptop` (1280–1535): módulos expandido y preferencias compacto por defecto.
 * - `chica` (1024–1279): un solo panel expandido a la vez.
 * - `tablet` (768–1023): los dos paneles son barras compactas; expandir abre una capa.
 * - `movil` (< 768): sin paneles laterales; se llega a ellos desde la barra inferior.
 */
export type Tamano = 'grande' | 'laptop' | 'chica' | 'tablet' | 'movil';

const TAMANOS: { tamano: Tamano; desde: number }[] = [
  { tamano: 'grande', desde: 1536 },
  { tamano: 'laptop', desde: 1280 },
  { tamano: 'chica', desde: 1024 },
  { tamano: 'tablet', desde: 768 },
  { tamano: 'movil', desde: 0 },
];

/** Tamaños donde los paneles van al lado del contenido y el usuario elige su estado. */
const TAMANOS_CON_PANELES: Tamano[] = ['grande', 'laptop', 'chica'];

type EstadosPorPanel = Record<Panel, EstadoPanel>;

interface Guardado {
  /** El estado de cada panel se recuerda por separado en cada tamaño de pantalla. */
  porTamano: Partial<Record<Tamano, EstadosPorPanel>>;
  limpio: boolean;
}

const POR_DEFECTO: Record<Tamano, EstadosPorPanel> = {
  grande: { modulos: 'expandido', preferencias: 'expandido' },
  laptop: { modulos: 'expandido', preferencias: 'compacto' },
  chica: { modulos: 'expandido', preferencias: 'compacto' },
  tablet: { modulos: 'compacto', preferencias: 'compacto' },
  movil: { modulos: 'oculto', preferencias: 'oculto' },
};

const ESTADOS: EstadoPanel[] = ['expandido', 'compacto', 'oculto'];

/**
 * Cómo tiene el usuario los paneles laterales (módulos a la izquierda, preferencias a la derecha),
 * si está en «vista limpia» y qué aplicativo tiene desplegado en el acordeón. Se guarda en este
 * equipo, por usuario.
 *
 * - Cada tamaño de pantalla recuerda su propio estado.
 * - En `chica` solo un panel puede estar expandido: expandir uno compacta el otro.
 * - En `tablet` los paneles siempre son barras compactas (o están ocultos); expandir abre una
 *   capa encima del contenido, que maneja la pantalla de inicio.
 * - La vista limpia muestra compacto todo lo expandido sin tocar lo guardado.
 *
 * PROYECTO: si la aplicación limpia el almacenamiento al iniciar o cerrar sesión, debe conservar
 * las claves que empiezan por `PREFIJO` (README §3.12).
 */
@Injectable({ providedIn: 'root' })
export class EstadoPanelesService {
  static readonly PREFIJO = 'inicioPaneles:';

  private usuario = '';

  readonly tamano = signal<Tamano>(this.medir());
  private readonly guardado = signal<Guardado>({ porTamano: {}, limpio: false });

  readonly limpio = computed(() => this.guardado().limpio);
  /** Aplicativo desplegado en el acordeón del panel de módulos (null = ninguno). */
  readonly aplicativoAbierto = signal<number | null>(null);
  /** Los paneles van al lado del contenido (desde 1024 px). */
  readonly conPaneles = computed(() => TAMANOS_CON_PANELES.includes(this.tamano()));

  readonly modulos = computed(() => this.efectivo('modulos'));
  readonly preferencias = computed(() => this.efectivo('preferencias'));

  /** Lee lo guardado del usuario y empieza a seguir el ancho de la ventana. */
  inicializar(destroyRef: DestroyRef, usuario: string): void {
    this.usuario = (usuario || '').trim().toLowerCase();
    this.guardado.set(this.leer());
    this.aplicativoAbierto.set(this.leerAplicativoAbierto());
    this.tamano.set(this.medir());

    const consultas = TAMANOS.filter((t) => t.desde > 0).map((t) => window.matchMedia(`(min-width: ${t.desde}px)`));
    const alCambiar = () => this.tamano.set(this.medir());
    consultas.forEach((c) => c.addEventListener('change', alCambiar));
    destroyRef.onDestroy(() => consultas.forEach((c) => c.removeEventListener('change', alCambiar)));
  }

  /**
   * Cambia el estado de un panel en el tamaño actual. Si estaba en vista limpia, primero fija lo
   * que se veía (para que el otro panel no se reexpanda de golpe) y la apaga.
   */
  cambiar(panel: Panel, estado: EstadoPanel): void {
    const tamano = this.tamano();
    const estados: EstadosPorPanel = { modulos: this.modulos(), preferencias: this.preferencias(), [panel]: estado };

    if (tamano === 'chica' && estado === 'expandido') {
      const otro: Panel = panel === 'modulos' ? 'preferencias' : 'modulos';
      if (estados[otro] === 'expandido') estados[otro] = 'compacto';
    }

    this.guardar({ porTamano: { ...this.guardado().porTamano, [tamano]: estados }, limpio: false });
  }

  /** Ctrl+B y los botones de los paneles: expandido ⇄ compacto; si estaba oculto, lo expande. */
  alternar(panel: Panel): void {
    const actual = panel === 'modulos' ? this.modulos() : this.preferencias();
    this.cambiar(panel, actual === 'expandido' ? 'compacto' : 'expandido');
  }

  /** Despliega ese aplicativo en el acordeón, o lo cierra si ya estaba abierto. */
  alternarAplicativo(id: number): void {
    const nuevo = this.aplicativoAbierto() === id ? null : id;
    this.aplicativoAbierto.set(nuevo);
    try {
      if (nuevo === null) localStorage.removeItem(this.claveAplicativo());
      else localStorage.setItem(this.claveAplicativo(), String(nuevo));
    } catch {
      // Almacenamiento bloqueado: se recuerda mientras dure la pantalla
    }
  }

  alternarLimpio(): void {
    this.guardar({ ...this.guardado(), limpio: !this.guardado().limpio });
  }

  private efectivo(panel: Panel): EstadoPanel {
    const tamano = this.tamano();
    const elegido = this.guardado().porTamano[tamano]?.[panel] ?? POR_DEFECTO[tamano][panel];

    if (tamano === 'movil') return 'oculto';
    // En tablet no cabe un panel expandido al lado: se muestra la barra y la capa hace el resto
    if (tamano === 'tablet') return elegido === 'oculto' ? 'oculto' : 'compacto';
    if (this.guardado().limpio && elegido === 'expandido') return 'compacto';
    return elegido;
  }

  private medir(): Tamano {
    const ancho = window.innerWidth;
    return TAMANOS.find((t) => ancho >= t.desde)!.tamano;
  }

  private leerAplicativoAbierto(): number | null {
    try {
      const id = Number(localStorage.getItem(this.claveAplicativo()));
      return Number.isFinite(id) && id > 0 ? id : null;
    } catch {
      return null;
    }
  }

  private guardar(guardado: Guardado): void {
    this.guardado.set(guardado);
    try {
      localStorage.setItem(this.clave(), JSON.stringify(guardado));
    } catch {
      // Almacenamiento bloqueado: el estado dura lo que dure la pantalla
    }
  }

  private leer(): Guardado {
    try {
      const datos = JSON.parse(localStorage.getItem(this.clave()) ?? 'null') as Guardado | null;
      if (!datos || typeof datos !== 'object') return { porTamano: {}, limpio: false };

      // Descarta lo que no sea un estado válido (p. ej. guardado por una versión anterior)
      const porTamano: Guardado['porTamano'] = {};
      for (const [tamano, estados] of Object.entries(datos.porTamano ?? {})) {
        if (ESTADOS.includes(estados?.modulos) && ESTADOS.includes(estados?.preferencias)) {
          porTamano[tamano as Tamano] = estados;
        }
      }
      return { porTamano, limpio: datos.limpio === true };
    } catch {
      return { porTamano: {}, limpio: false };
    }
  }

  private clave(): string {
    return EstadoPanelesService.PREFIJO + this.usuario;
  }

  private claveAplicativo(): string {
    return EstadoPanelesService.PREFIJO + 'app:' + this.usuario;
  }
}
