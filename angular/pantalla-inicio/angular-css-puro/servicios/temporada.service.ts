// Estándar pantalla de inicio v1.0.0 — qué temporada se celebra hoy (README §3.10)
import { DestroyRef, Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { TEMPORADAS, Temporada, mesDia } from './temporadas';

/**
 * País por zona horaria del navegador, para cuando el proyecto no sabe el país de la empresa.
 * Si lo sabe, debe pasarlo en `inicializar` y tiene prioridad sobre esto.
 */
const PAIS_POR_ZONA: Record<string, string> = {
  'America/Guatemala': 'GT',
  'America/El_Salvador': 'SV',
  'America/Tegucigalpa': 'HN',
  'America/Managua': 'NI',
  'America/Costa_Rica': 'CR',
  'America/Panama': 'PA',
  'America/Mexico_City': 'MX',
};

/** Valor de `forzar` que apaga la ambientación aunque haya una fecha especial. */
const SIN_TEMPORADA = 'ninguna';

export interface OpcionesTemporada {
  /** Id de una temporada (o 'ninguna') para probarla sin esperar la fecha. */
  forzar?: string | null;
  /** Código ISO del país de la empresa, si el proyecto lo sabe. */
  pais?: string | null;
}

/**
 * Qué fecha especial se celebra hoy en la pantalla de inicio (ver `TEMPORADAS`).
 *
 * - Usa la fecha del equipo y el país de la empresa (o el de la zona horaria).
 * - Revisa cada minuto si cambió el día: con la pantalla abierta de un día para otro, la
 *   ambientación cambia sola.
 * - El usuario la puede apagar (`cambiarActivada`). Se guarda en este equipo, por usuario.
 * - Forzada (para probar), se muestra aunque el usuario la haya apagado.
 *
 * PROYECTO: si la aplicación limpia el almacenamiento al iniciar o cerrar sesión, debe conservar
 * las claves que empiezan por `PREFIJO` (README §3.12).
 */
@Injectable({ providedIn: 'root' })
export class TemporadaService {
  static readonly PREFIJO = 'inicioTemporada:';

  private readonly zone = inject(NgZone);

  private usuario = '';
  private paisEmpresa: string | null = null;
  private readonly hoy = signal(mesDia(new Date()));
  /** `undefined`: sin forzar. `null`: forzada a ninguna. Un id: forzada a esa temporada. */
  private readonly forzada = signal<string | null | undefined>(undefined);

  readonly activada = signal(true);

  readonly temporada = computed<Temporada | null>(() => {
    const forzada = this.forzada();
    if (forzada !== undefined) return TEMPORADAS.find((t) => t.id === forzada) ?? null;
    if (!this.activada()) return null;

    const dia = this.hoy();
    const pais = this.pais();
    // Las fechas que cambian cada año (Semana Santa) se calculan para el año en curso
    const anio = new Date().getFullYear();
    return (
      TEMPORADAS.filter((t) => {
        const { desde, hasta } = t.rango ? t.rango(anio) : { desde: t.desde ?? '', hasta: t.hasta ?? '' };
        return this.enRango(dia, desde, hasta) && (!t.paises || (pais !== null && t.paises.includes(pais)));
      }).sort((a, b) => b.prioridad - a.prioridad)[0] ?? null
    );
  });

  /**
   * El año que empieza: en la segunda mitad del año, el siguiente (31 de diciembre → 2027); en la
   * primera, el actual (1 de enero → 2027). Así, al forzar Año Nuevo en noviembre muestra el que viene.
   */
  readonly anioQueEmpieza = computed(() => {
    const anio = new Date().getFullYear();
    return this.hoy() >= '07-01' ? anio + 1 : anio;
  });

  /** Lee la elección del usuario, aplica `forzar` y empieza a revisar el cambio de día. */
  inicializar(destroyRef: DestroyRef, usuario: string, opciones: OpcionesTemporada = {}): void {
    this.usuario = (usuario || '').trim().toLowerCase();
    this.paisEmpresa = opciones.pais ?? null;
    this.activada.set(this.leer());
    this.hoy.set(mesDia(new Date()));

    const forzar = opciones.forzar ?? null;
    this.forzada.set(forzar === SIN_TEMPORADA ? null : TEMPORADAS.some((t) => t.id === forzar) ? forzar : undefined);

    // Fuera de la zona: solo se vuelve a entrar cuando de verdad cambió el día
    const intervalo = this.zone.runOutsideAngular(() =>
      setInterval(() => {
        const dia = mesDia(new Date());
        if (dia !== this.hoy()) this.zone.run(() => this.hoy.set(dia));
      }, 60_000),
    );
    destroyRef.onDestroy(() => clearInterval(intervalo));
  }

  cambiarActivada(activada: boolean): void {
    this.activada.set(activada);
    try {
      localStorage.setItem(TemporadaService.PREFIJO + this.usuario, activada ? '1' : '0');
    } catch {
      // Almacenamiento bloqueado: la elección dura lo que dure la pantalla
    }
  }

  private pais(): string | null {
    if (this.paisEmpresa) return this.paisEmpresa;
    try {
      return PAIS_POR_ZONA[Intl.DateTimeFormat().resolvedOptions().timeZone] ?? null;
    } catch {
      return null;
    }
  }

  private enRango(dia: string, desde: string, hasta: string): boolean {
    // '12-01' a '01-06' cruza el año: vale desde diciembre o hasta enero
    return desde <= hasta ? dia >= desde && dia <= hasta : dia >= desde || dia <= hasta;
  }

  private leer(): boolean {
    try {
      return localStorage.getItem(TemporadaService.PREFIJO + this.usuario) !== '0';
    } catch {
      return true;
    }
  }
}
