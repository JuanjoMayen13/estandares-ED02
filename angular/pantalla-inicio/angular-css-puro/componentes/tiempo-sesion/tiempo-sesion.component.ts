// Estándar pantalla de inicio v1.0.0 — tiempo de sesión restante (README §2.7 y §3.9)
import { Component, NgZone, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

type Nivel = 'ok' | 'aviso' | 'critico' | 'vencida';

/** Con 10 minutos o menos se cuenta segundo a segundo; antes, cada 15 s alcanza. */
const UMBRAL_SEGUNDOS_MS = 10 * 60_000;

/**
 * Cuánto le queda a la sesión, con una barra que se vacía.
 *
 * - `vence`: hora de vencimiento (ms desde 1970). Sin ella no se muestra nada.
 * - `inicio`: hora de inicio de la sesión, para la barra. Sin ella se muestra el tiempo sin barra.
 *
 * La hora se toma del equipo: un reloj desfasado respecto al servidor se vería como una diferencia.
 */
@Component({
  selector: 'app-tiempo-sesion',
  standalone: true,
  templateUrl: './tiempo-sesion.component.html',
  imports: [TranslatePipe],
  // Sin display fijo: quien lo usa lo pone, y lo oculta cuando queda vacío (`empty:hidden`)
})
export class TiempoSesionComponent implements OnInit, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly vence = input<number | null>(null);
  readonly inicio = input<number | null>(null);

  private readonly ahora = signal(Date.now());

  readonly visible = computed(() => this.vence() !== null);
  readonly restante = computed(() => Math.max(0, (this.vence() ?? 0) - this.ahora()));
  /** `null` si no se sabe cuánto duraba la sesión: se muestra el tiempo, sin barra. */
  readonly porcentaje = computed(() => {
    const vence = this.vence();
    const inicio = this.inicio();
    const total = vence !== null && inicio !== null && vence > inicio ? vence - inicio : null;
    return total ? Math.min(100, (this.restante() / total) * 100) : null;
  });
  readonly porcentajeRedondeado = computed(() => Math.round(this.porcentaje() ?? 0));

  readonly nivel = computed<Nivel>(() => {
    if (this.restante() === 0) return 'vencida';
    const porcentaje = this.porcentaje();
    if (porcentaje === null || porcentaje > 50) return 'ok';
    return porcentaje > 20 ? 'aviso' : 'critico';
  });

  /** «3 h 20 min», «45 min», «8 min 12 s», «40 s». */
  readonly texto = computed(() => {
    const segundos = Math.ceil(this.restante() / 1000);
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const resto = segundos % 60;
    if (horas > 0) return `${horas} h ${minutos} min`;
    if (minutos >= 10) return `${minutos} min`;
    if (minutos > 0) return `${minutos} min ${resto} s`;
    return `${resto} s`;
  });

  readonly horaVence = computed(() => {
    const vence = this.vence();
    return vence ? new Date(vence).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  });

  private temporizador?: ReturnType<typeof setTimeout>;
  private readonly alVolverALaPestana = () => {
    if (!document.hidden) this.zone.run(() => this.ahora.set(Date.now()));
  };

  ngOnInit(): void {
    // Una pestaña en segundo plano frena los temporizadores: al volver se recalcula de inmediato
    document.addEventListener('visibilitychange', this.alVolverALaPestana);
    this.zone.runOutsideAngular(() => this.programar());
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
    document.removeEventListener('visibilitychange', this.alVolverALaPestana);
  }

  private programar(): void {
    const restante = this.restante();
    const espera = restante > 0 && restante <= UMBRAL_SEGUNDOS_MS ? 1000 : 15_000;
    this.temporizador = setTimeout(() => {
      this.zone.run(() => this.ahora.set(Date.now()));
      this.programar();
    }, espera);
  }
}
