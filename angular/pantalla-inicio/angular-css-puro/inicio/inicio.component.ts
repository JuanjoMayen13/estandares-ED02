// Estándar pantalla de inicio v1.0.0 — pantalla de inicio base (README §4.3)
//
// Une los componentes del estándar. Todo lo que depende de cada aplicación está marcado con
// PROYECTO: datos del usuario y de la sesión, aplicativos y pantallas, navegación, acciones del
// menú, secciones de preferencias, widgets y cierre de sesión.
import {
  ApplicationRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AccesoGuardado, AccesosService } from '../servicios/accesos.service';
import { EstadoPanelesService, Panel } from '../servicios/estado-paneles.service';
import { TemporadaService } from '../servicios/temporada.service';
import { aplanarPantallas } from '../utilidades/busqueda';
import {
  AccesoRapido,
  AccionMenu,
  AccionRapida,
  Aplicativo,
  EstadoCarga,
  EstadoPanel,
  NodoPantalla,
  Pantalla,
  SeccionPreferencias,
} from '../utilidades/modelos';
import { AccesosRapidosComponent } from '../componentes/accesos-rapidos/accesos-rapidos.component';
import { AvisoSesionComponent } from '../componentes/aviso-sesion/aviso-sesion.component';
import { BuscadorPantallasComponent } from '../componentes/buscador-pantallas/buscador-pantallas.component';
import { DecoracionTemporadaComponent } from '../componentes/decoracion-temporada/decoracion-temporada.component';
import { MenuUsuarioComponent } from '../componentes/menu-usuario/menu-usuario.component';
import { PanelModulosComponent } from '../componentes/panel-modulos/panel-modulos.component';
import { PanelPreferenciasComponent } from '../componentes/panel-preferencias/panel-preferencias.component';
import { SaludoInicioComponent } from '../componentes/saludo-inicio/saludo-inicio.component';
import { TiempoSesionComponent } from '../componentes/tiempo-sesion/tiempo-sesion.component';
import { WidgetAtajosComponent } from '../componentes/widget-atajos/widget-atajos.component';
import { WidgetConexionComponent } from '../componentes/widget-conexion/widget-conexion.component';

/** Último día en que el usuario entró al inicio ('AAAA-MM-DD'), para el saludo según el contexto. */
const CLAVE_VISITA = EstadoPanelesService.PREFIJO + 'visita:';

/** Cuánto se ofrece «Deshacer» después de quitar un fijado. */
const DURACION_DESHACER_MS = 6000;

/**
 * Pantalla de inicio después del login. Tres zonas: módulos a la izquierda (navegar), lo del día
 * al centro y preferencias a la derecha. Los paneles laterales tienen tres estados y reglas por
 * tamaño de pantalla (`EstadoPanelesService`); en tablet y celular, un panel se abre como capa.
 *
 * Atajos: Ctrl+K buscador, Ctrl+B módulos, Ctrl+Shift+L vista limpia, Alt+1…8 fijados, Ctrl+Z deshacer.
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.component.html',
  imports: [
    TranslatePipe,
    AccesosRapidosComponent,
    AvisoSesionComponent,
    BuscadorPantallasComponent,
    DecoracionTemporadaComponent,
    MenuUsuarioComponent,
    PanelModulosComponent,
    PanelPreferenciasComponent,
    SaludoInicioComponent,
    TiempoSesionComponent,
    WidgetAtajosComponent,
    WidgetConexionComponent,
  ],
})
export class InicioComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appRef = inject(ApplicationRef);
  private readonly route = inject(ActivatedRoute);
  private readonly accesos = inject(AccesosService);

  protected readonly paneles = inject(EstadoPanelesService);
  protected readonly temporadas = inject(TemporadaService);

  @ViewChild('contenido') private contenido?: ElementRef<HTMLElement>;

  // ---------- PROYECTO: datos del usuario y de la sesión ----------

  protected readonly usuario = signal('');
  protected readonly empresa = signal('');
  protected readonly estacion = signal('');
  /** URL o data URI del logo de la empresa; `null` muestra el ícono genérico. */
  protected readonly logoEmpresa = signal<string | null>(null);
  /** Hora de inicio de sesión ya formateada para mostrar («24/11/2026 08:02»). */
  protected readonly horaInicioSesion = signal<string | null>(null);
  /** Vencimiento y comienzo de la sesión, en ms desde 1970 (tiempo restante y aviso). */
  protected readonly venceSesion = signal<number | null>(null);
  protected readonly inicioSesion = signal<number | null>(null);

  // ---------- PROYECTO: aplicativos y pantallas ----------

  protected readonly aplicativos = signal<Aplicativo[]>([]);
  protected readonly arboles = signal<Record<number, NodoPantalla[]>>({});
  protected readonly carga = signal<EstadoCarga>('cargando');

  /** PROYECTO: si el usuario tiene una pantalla para ese nodo. Las demás se ven deshabilitadas. */
  protected readonly puedeAbrir = (nodo: NodoPantalla): boolean => !!nodo;

  protected readonly pantallas = computed(() => aplanarPantallas(this.aplicativos(), this.arboles(), this.puedeAbrir));

  // ---------- PROYECTO: menú del usuario, preferencias y widgets ----------

  /** Opciones del menú del usuario, entre «quién y dónde» y «Cerrar sesión». */
  protected readonly accionesMenu: AccionMenu[] = [
    { id: 'servidor', icono: 'fa-solid fa-server', etiqueta: 'inicio.configurarServidor' },
  ];

  /**
   * Secciones del panel de preferencias. Las plantillas están en inicio.component.html, fuera de
   * cualquier @if: `static: true` las tiene listas en ngOnInit, donde se arma la lista.
   */
  @ViewChild('seccionConfiguracion', { static: true }) private seccionConfiguracion!: TemplateRef<unknown>;
  protected readonly secciones = signal<SeccionPreferencias[]>([]);

  /** Acción directa de la barra compacta de preferencias (p. ej. claro ⇄ oscuro), o null. */
  protected readonly accionRapida = signal<AccionRapida | null>(null);

  /** Datos del widget de conexión (ejemplo de widget del proyecto). */
  protected readonly conexion = signal({ conectado: true, url: '', versionWeb: null as string | null, versionApi: null as string | null });

  // ---------- Estado de la pantalla ----------

  protected readonly fijados = signal<AccesoRapido[]>([]);
  protected readonly recientes = signal<AccesoRapido[]>([]);
  protected readonly totalFijados = signal(0);
  protected readonly maximoFijados = AccesosService.MAXIMO_FIJADOS;
  /** Lo que el buscador sugiere antes de escribir. */
  protected readonly sugeridas = computed(() => [...this.fijados(), ...this.recientes()]);

  protected readonly esMovil = computed(() => this.paneles.tamano() === 'movil');
  /** Panel abierto como capa encima del contenido (tablet y celular). */
  protected readonly capa = signal<Panel | null>(null);
  protected readonly buscadorAbierto = signal(false);

  /** Saludo según el contexto (null = el de la hora del día). Se decide una vez al entrar. */
  protected readonly saludoContexto = signal<string | null>(null);

  /** Fijado recién quitado: su nombre (para el aviso) y los fijados como estaban antes. */
  protected readonly deshacer = signal<{ nombre: string; fijados: AccesoGuardado[] } | null>(null);
  private temporizadorDeshacer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.temporizadorDeshacer));

    // Fijados y recientes se resuelven contra las pantallas; hay que esperar a tenerlas
    effect(() => {
      if (this.carga() === 'listo') this.actualizarAccesos();
    });

    // Si la ventana se agranda hasta que los paneles caben al lado, la capa ya no hace falta
    effect(() => {
      if (this.paneles.conPaneles()) this.capa.set(null);
    });
  }

  ngOnInit(): void {
    // PROYECTO: llenar con los datos de la sesión de la aplicación. Ejemplo:
    // this.usuario.set(this.sesion.usuario());
    // this.empresa.set(this.sesion.empresa()?.nombre ?? '');
    // this.estacion.set(this.sesion.estacion()?.descripcion ?? '');
    // this.logoEmpresa.set(this.sesion.logoEmpresa());
    // this.venceSesion.set(this.sesion.vencimiento());   // p. ej. `exp * 1000` del token
    // this.inicioSesion.set(this.sesion.inicio());       // p. ej. `iat * 1000` del token

    // PROYECTO: las secciones de preferencias, en orden (ejemplo: una sección de configuración)
    this.secciones.set([
      { id: 'configuracion', icono: 'fa-solid fa-gears', etiqueta: 'inicio.configuracion', plantilla: this.seccionConfiguracion },
    ]);

    this.paneles.inicializar(this.destroyRef, this.usuario());
    // `?temporada=navidad` (anioNuevo, semanaSanta, mesPatrio, ninguna) la fuerza para probarla.
    // PROYECTO: si sabe el país de la empresa, pasarlo en `pais` (código ISO, p. ej. 'GT').
    this.temporadas.inicializar(this.destroyRef, this.usuario(), {
      forzar: this.route.snapshot.queryParamMap.get('temporada'),
      pais: null,
    });
    this.saludoContexto.set(this.decidirSaludo());
    this.cargarCatalogo();
  }

  /** PROYECTO: consultar los aplicativos del usuario y el árbol de pantallas de cada uno. */
  protected cargarCatalogo(): void {
    this.carga.set('cargando');
    // Ejemplo:
    // this.api.aplicativosDelUsuario().subscribe({
    //   next: ({ aplicativos, arboles }) => {
    //     this.aplicativos.set(aplicativos);
    //     this.arboles.set(arboles);      // Record<idAplicativo, NodoPantalla[]> (ver construirArbol)
    //     this.carga.set('listo');
    //   },
    //   error: () => this.carga.set('error'),
    // });
    this.carga.set('listo');
  }

  /**
   * PROYECTO: navegar a la pantalla. Devuelve `true` solo si se llegó (si el usuario cancela, por
   * ejemplo, un aviso de cambios sin guardar, no cuenta como reciente).
   */
  protected navegar(pantalla: Pantalla): Promise<boolean> {
    console.warn('PROYECTO: navegar a', pantalla);
    return Promise.resolve(false);
  }

  /** PROYECTO: lo que hace cada opción del menú del usuario (`accionesMenu`). */
  protected alElegirAccion(id: string): void {
    this.capa.set(null);
    switch (id) {
      case 'servidor':
        // PROYECTO: abrir la configuración del servidor
        break;
    }
  }

  /** PROYECTO: lo que hace la acción rápida de la barra compacta de preferencias. */
  protected alElegirAccionRapida(): void {}

  /** PROYECTO: confirmar y cerrar la sesión. */
  protected cerrarSesion(): void {}

  /** PROYECTO: si la pantalla actual tiene cambios sin guardar (aviso de sesión). */
  protected readonly hayCambios = (): boolean => false;

  /** PROYECTO: `true` mientras hay un modal del proyecto encima (los atajos no actúan). */
  protected hayModalAbierto(): boolean {
    return false;
  }

  // ---------- Saludo ----------

  private decidirSaludo(): string | null {
    const ahora = new Date();
    const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
    const clave = CLAVE_VISITA + this.usuario().trim().toLowerCase();

    let anterior: string | null = null;
    try {
      anterior = localStorage.getItem(clave);
      localStorage.setItem(clave, hoy);
    } catch {
      // Almacenamiento bloqueado: sin «de nuevo», el resto del saludo funciona igual
    }

    if (anterior === hoy) return 'inicio.saludoRegreso';
    const dia = ahora.getDay(); // 0 domingo … 6 sábado
    if (dia === 1) return 'inicio.saludoLunes';
    if (dia === 5) return 'inicio.saludoViernes';
    return null;
  }

  // ---------- Paneles ----------

  /** Con paneles al lado (≥ 1024 px) se guarda el estado; en tablet, «expandir» abre la capa. */
  protected cambiarPanel(panel: Panel, estado: EstadoPanel): void {
    if (estado === 'expandido' && !this.paneles.conPaneles()) this.capa.set(panel);
    else this.paneles.cambiar(panel, estado);
  }

  /** Botones del header para un panel oculto o sin lugar al lado. */
  protected mostrarPanel(panel: Panel): void {
    if (this.paneles.conPaneles()) {
      this.paneles.cambiar(panel, 'expandido');
      return;
    }
    // En tablet vuelve la barra compacta (si estaba oculta) y se abre la capa
    if (this.paneles.tamano() === 'tablet') this.paneles.cambiar(panel, 'compacto');
    this.capa.set(panel);
  }

  protected alternarCapa(panel: Panel): void {
    this.capa.update((actual) => (actual === panel ? null : panel));
  }

  /** «Inicio» de la barra inferior: cierra lo que esté abierto y vuelve arriba. */
  protected irAlInicio(): void {
    this.capa.set(null);
    this.contenido?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- Navegación ----------

  protected abrirPantalla(pantalla: Pantalla): void {
    this.capa.set(null);
    this.navegar(pantalla).then((llego) => {
      if (llego) this.accesos.registrarReciente(this.usuario(), pantalla);
    });
  }

  protected abrirBuscador(): void {
    this.capa.set(null);
    this.buscadorAbierto.set(true);
  }

  // ---------- Accesos rápidos ----------

  protected fijar(item: AccesoRapido): void {
    this.conTransicion(() => {
      this.accesos.fijar(this.usuario(), item);
      this.actualizarAccesos();
    });
  }

  /** Quita el fijado y ofrece «Deshacer» unos segundos (también con Ctrl+Z). */
  protected quitarFijado(item: AccesoRapido): void {
    const antes = this.accesos.leerFijados(this.usuario());
    this.conTransicion(() => {
      this.accesos.desfijar(this.usuario(), item);
      this.actualizarAccesos();
    });

    clearTimeout(this.temporizadorDeshacer);
    this.deshacer.set({ nombre: item.nombre, fijados: antes });
    this.temporizadorDeshacer = setTimeout(() => this.deshacer.set(null), DURACION_DESHACER_MS);
  }

  /** Devuelve los fijados a como estaban antes de quitar (el fijado vuelve a su lugar). */
  protected deshacerQuitarFijado(): void {
    const pendiente = this.deshacer();
    if (!pendiente) return;
    clearTimeout(this.temporizadorDeshacer);
    this.deshacer.set(null);
    this.conTransicion(() => {
      this.accesos.reemplazarFijados(this.usuario(), pendiente.fijados);
      this.actualizarAccesos();
    });
  }

  protected cerrarDeshacer(): void {
    clearTimeout(this.temporizadorDeshacer);
    this.deshacer.set(null);
  }

  protected borrarRecientes(): void {
    this.accesos.borrarRecientes(this.usuario());
    this.recientes.set([]);
  }

  /**
   * Aplica un cambio de los accesos rápidos con una transición de vista: el navegador desliza cada
   * tarjeta de su lugar viejo al nuevo (cada una tiene su `view-transition-name`). Sin soporte del
   * navegador, o con «reducir movimiento», el cambio es inmediato.
   */
  private conTransicion(cambio: () => void): void {
    const doc = document as Document & { startViewTransition?: (actualizar: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cambio();
      return;
    }
    // tick(): el DOM tiene que quedar actualizado antes de que el navegador tome la «foto» nueva
    const transicion = doc.startViewTransition(() => {
      cambio();
      this.appRef.tick();
    });
    // Dos cambios seguidos: el navegador cancela la transición anterior y rechaza `ready`. No es
    // un error; sin este catch quedaría «Uncaught (in promise) AbortError» en la consola.
    transicion.ready.catch(() => {});
  }

  /** Una pantalla fijada no se repite entre los recientes. */
  private actualizarAccesos(): void {
    const usuario = this.usuario();
    const pantallas = this.pantallas();
    const guardados = this.accesos.leerFijados(usuario);

    this.totalFijados.set(guardados.length);
    this.fijados.set(this.accesos.resolver(guardados, pantallas));
    this.recientes.set(
      this.accesos
        .resolver(this.accesos.leerRecientes(usuario), pantallas)
        .filter((item) => !guardados.some((f) => this.accesos.esLaMisma(f, this.accesos.guardadoDe(item)))),
    );
  }

  // ---------- Atajos de teclado ----------

  /**
   * - Ctrl+K: buscador.  - Ctrl+B: panel de módulos.  - Ctrl+Shift+L: vista limpia.
   * - Alt+1…8: abre el fijado de esa posición.  - Ctrl+Z: deshace «quitar fijado».
   * ⌘ en lugar de Ctrl en Mac.
   */
  @HostListener('document:keydown', ['$event'])
  protected alTeclear(evento: KeyboardEvent): void {
    // Con un modal encima, los atajos no deben abrir nada debajo
    if (this.hayModalAbierto()) return;

    const ctrl = evento.ctrlKey || evento.metaKey;
    const tecla = evento.key.toLowerCase();

    // Ctrl+Z deshace «quitar fijado» mientras se ofrece, salvo que se esté escribiendo en un campo
    const escribiendo = (evento.target as HTMLElement | null)?.closest('input, textarea, [contenteditable="true"]');
    if (ctrl && !evento.altKey && !evento.shiftKey && tecla === 'z' && this.deshacer() && !escribiendo) {
      evento.preventDefault();
      this.deshacerQuitarFijado();
      return;
    }

    if (ctrl && !evento.altKey && !evento.shiftKey && tecla === 'k') {
      evento.preventDefault();
      this.abrirBuscador();
    } else if (ctrl && !evento.altKey && !evento.shiftKey && tecla === 'b' && !this.buscadorAbierto()) {
      evento.preventDefault();
      if (this.paneles.conPaneles()) this.paneles.alternar('modulos');
      else this.alternarCapa('modulos');
    } else if (ctrl && evento.shiftKey && !evento.altKey && tecla === 'l') {
      evento.preventDefault();
      this.paneles.alternarLimpio();
    } else if (evento.altKey && !ctrl && !evento.shiftKey && /^Digit[1-8]$/.test(evento.code) && !this.buscadorAbierto()) {
      // `code` y no `key`: con Alt, algunas distribuciones de teclado cambian el carácter
      const fijado = this.fijados()[Number(evento.code.slice(5)) - 1];
      if (fijado) {
        evento.preventDefault();
        this.abrirPantalla(fijado);
      }
    }
  }

  @HostListener('document:keydown.escape')
  protected alEscape(): void {
    if (this.capa()) this.capa.set(null);
  }
}
