// Estándar pantalla de inicio v1.0.0 — aviso de sesión por vencer (README §2.13 y §3.9), nivel 4
import { Component, NgZone, OnDestroy, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Cuánto antes del vencimiento aparece el aviso. */
const ANTICIPACION_MS = 10 * 60_000;
/** Cada cuánto se revisa (el aviso no necesita precisión de segundos). */
const INTERVALO_MS = 15_000;
/** Qué aviso cerró el usuario (vencimiento + tipo): ese no vuelve a salir. */
const CLAVE_CERRADO = 'avisoSesionCerrado';

/** `neutro`: solo avisa la hora. `cambios`: la pantalla tiene trabajo sin guardar. */
type TipoAviso = 'neutro' | 'cambios';

/**
 * Advertencia 10 minutos antes de que venza la sesión. No guarda nada ni extiende la sesión: solo
 * avisa a tiempo. La posición (fija, abajo a la derecha) la pone quien lo usa.
 *
 * - `vence`: hora de vencimiento (ms desde 1970). Sin ella no se muestra nada.
 * - `hayCambios`: función que dice si la pantalla actual tiene trabajo sin guardar. Si devuelve
 *   `true`, sale la versión «Tienes cambios sin guardar»; si no, la neutra.
 * - Se puede cerrar; cerrada, esa versión no vuelve para ese vencimiento en la sesión del navegador.
 */
@Component({
  selector: 'app-aviso-sesion',
  standalone: true,
  templateUrl: './aviso-sesion.component.html',
  imports: [TranslatePipe],
})
export class AvisoSesionComponent implements OnInit, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly vence = input<number | null>(null);
  readonly hayCambios = input<() => boolean>(() => false);

  private readonly ahora = signal(Date.now());
  private readonly cerrado = signal<string | null>(this.leerCerrado());
  /** `hayCambios` no es reactivo (pregunta en el momento), así que se consulta en cada revisión. */
  private readonly conCambios = signal(false);

  protected readonly tipo = computed<TipoAviso>(() => (this.conCambios() ? 'cambios' : 'neutro'));

  protected readonly visible = computed(() => {
    const vence = this.vence();
    if (vence === null || this.cerrado() === `${vence}|${this.tipo()}`) return false;
    const restante = vence - this.ahora();
    return restante > 0 && restante <= ANTICIPACION_MS;
  });

  protected readonly horaVence = computed(() => {
    const vence = this.vence();
    return vence ? new Date(vence).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  });

  private intervalo?: ReturnType<typeof setInterval>;
  private readonly alVolverALaPestana = () => {
    if (!document.hidden) this.zone.run(() => this.revisar());
  };

  constructor() {
    // Si cambia el vencimiento (p. ej. una sesión nueva), se revisa de inmediato
    effect(() => {
      this.vence();
      queueMicrotask(() => this.revisar());
    });
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.intervalo = setInterval(() => this.zone.run(() => this.revisar()), INTERVALO_MS);
    });
    document.addEventListener('visibilitychange', this.alVolverALaPestana);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
    document.removeEventListener('visibilitychange', this.alVolverALaPestana);
  }

  protected cerrar(): void {
    const valor = `${this.vence()}|${this.tipo()}`;
    this.cerrado.set(valor);
    try {
      sessionStorage.setItem(CLAVE_CERRADO, valor);
    } catch {
      // Almacenamiento bloqueado: queda cerrado mientras dure la pantalla
    }
  }

  private revisar(): void {
    this.ahora.set(Date.now());
    // Solo hace falta preguntar a la pantalla dentro de la ventana del aviso
    const vence = this.vence();
    const restante = vence === null ? 0 : vence - Date.now();
    this.conCambios.set(restante > 0 && restante <= ANTICIPACION_MS && this.hayCambios()());
  }

  private leerCerrado(): string | null {
    try {
      return sessionStorage.getItem(CLAVE_CERRADO);
    } catch {
      return null;
    }
  }
}
