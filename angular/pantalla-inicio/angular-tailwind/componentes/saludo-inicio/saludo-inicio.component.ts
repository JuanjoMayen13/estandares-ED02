// Estándar pantalla de inicio v1.0.0 — saludo de la tarjeta de bienvenida (README §2.7 y §3.8)
import { Component, NgZone, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ColoresCirculo, Temporada } from '../../servicios/temporadas';
import { BanderaGuatemalaComponent } from '../bandera-guatemala/bandera-guatemala.component';

type Periodo = 'manana' | 'tarde' | 'noche';

/** Saludo, ícono y colores de cada momento del día. */
const PERIODOS: Record<Periodo, { clave: string; icono: string; colores: ColoresCirculo }> = {
  manana: {
    clave: 'inicio.buenosDias',
    icono: 'fa-solid fa-sun',
    colores: { fondo: '#fef3c7', color: '#f59e0b', fondoOscuro: 'rgb(120 53 15 / 0.4)', colorOscuro: '#fcd34d' },
  },
  tarde: {
    clave: 'inicio.buenasTardes',
    icono: 'fa-solid fa-cloud-sun',
    colores: { fondo: '#ffedd5', color: '#f97316', fondoOscuro: 'rgb(124 45 18 / 0.4)', colorOscuro: '#fdba74' },
  },
  noche: {
    clave: 'inicio.buenasNoches',
    icono: 'fa-solid fa-moon',
    colores: { fondo: '#e0e7ff', color: '#6366f1', fondoOscuro: 'rgb(49 46 129 / 0.4)', colorOscuro: '#a5b4fc' },
  },
};

/** Del amanecer (5:00) a antes del mediodía es mañana; hasta las 19:00, tarde; el resto, noche. */
export function periodoDelDia(hora: number): Periodo {
  if (hora >= 5 && hora < 12) return 'manana';
  if (hora >= 12 && hora < 19) return 'tarde';
  return 'noche';
}

/**
 * Saludo de la bienvenida, por orden de prioridad:
 * 1. En una fecha especial (`temporada`), el mensaje y el ícono de la temporada.
 * 2. El saludo según el contexto (`saludoContexto`), con el ícono del momento del día.
 * 3. El saludo por hora del día («Buenos días, juan»), que se actualiza al cambiar de minuto.
 *
 * `variante="tarjeta"`: círculo de 48 px, saludo y fecha. `variante="linea"`: una sola línea
 * (celular y vista limpia), con un círculo de 24 px solo si hay temporada.
 */
@Component({
  selector: 'app-saludo-inicio',
  standalone: true,
  templateUrl: './saludo-inicio.component.html',
  imports: [TranslatePipe, NgTemplateOutlet, BanderaGuatemalaComponent],
  host: { style: 'display: block' },
})
export class SaludoInicioComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly zone = inject(NgZone);

  readonly usuario = input('');
  /** Clave del saludo según el contexto, o null para el de la hora del día. */
  readonly saludoContexto = input<string | null>(null);
  readonly temporada = input<Temporada | null>(null);
  /** El año que empieza (emblema de Año Nuevo). */
  readonly anio = input(new Date().getFullYear());
  readonly variante = input<'tarjeta' | 'linea'>('tarjeta');

  private readonly ahora = signal(new Date());
  protected readonly fecha = signal('');

  protected readonly periodo = computed(() => PERIODOS[periodoDelDia(this.ahora().getHours())]);
  /** Colores del círculo: los de la temporada o los del momento del día. */
  protected readonly colores = computed<ColoresCirculo | null>(() => {
    const t = this.temporada();
    return t ? t.colores : this.periodo().colores;
  });

  private temporizador?: ReturnType<typeof setTimeout>;
  private idioma?: Subscription;

  ngOnInit(): void {
    this.actualizarFecha();
    this.idioma = this.translate.onLangChange.subscribe(() => this.actualizarFecha());
    // Fuera de la zona: solo se vuelve a entrar cuando hay un minuto nuevo que mostrar
    this.zone.runOutsideAngular(() => this.programar());
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
    this.idioma?.unsubscribe();
  }

  private programar(): void {
    const alSiguienteMinuto = 60_000 - (Date.now() % 60_000) + 50;
    this.temporizador = setTimeout(() => {
      this.zone.run(() => {
        this.ahora.set(new Date());
        this.actualizarFecha();
      });
      this.programar();
    }, alSiguienteMinuto);
  }

  /** «Martes, 24 de noviembre», en el idioma elegido. */
  private actualizarFecha(): void {
    const texto = new Date().toLocaleDateString(this.translate.currentLang || 'es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    this.fecha.set(texto.charAt(0).toUpperCase() + texto.slice(1));
  }
}
