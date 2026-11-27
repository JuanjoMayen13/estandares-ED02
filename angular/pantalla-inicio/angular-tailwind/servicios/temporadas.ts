// Estándar pantalla de inicio v1.0.0 — calendario de la ambientación por temporada (README §2.14 y §3.10)

/** Lo que dibuja la decoración de la tarjeta de bienvenida (ver `DecoracionTemporadaComponent`). */
export type Decoracion = 'copos' | 'confeti' | 'fuegos';

/**
 * Lo que va dentro del círculo del saludo en lugar del `icono`:
 * - `banderaGT`: la bandera de Guatemala (`BanderaGuatemalaComponent`).
 * - `anio`: el número del año que empieza (`TemporadaService.anioQueEmpieza`).
 */
export type Emblema = 'banderaGT' | 'anio';

/** Colores del círculo del saludo en claro y oscuro. */
export interface ColoresCirculo {
  fondo: string;
  color: string;
  fondoOscuro: string;
  colorOscuro: string;
}

/**
 * Una fecha especial con su ambientación. Los colores van como datos (no como clases) para que
 * este archivo sea el mismo en las implementaciones con Tailwind y con CSS puro.
 */
export interface Temporada {
  id: string;
  /** Rango 'MM-DD' a 'MM-DD', ambos incluidos. Si `desde` es mayor que `hasta`, cruza el año. */
  desde?: string;
  hasta?: string;
  /** Para fechas que cambian cada año (Semana Santa): el rango 'MM-DD' de ese año. */
  rango?: (anio: number) => { desde: string; hasta: string };
  /** Códigos ISO de país donde aplica; sin `paises`, aplica en todos. */
  paises?: string[];
  /** Si dos temporadas se cruzan, gana la de mayor prioridad (Año Nuevo sobre Navidad). */
  prioridad: number;
  /** Clave del saludo; recibe `{{usuario}}`. */
  saludo: string;
  icono: string;
  /** Si se indica, se muestra en lugar del `icono` (ver `Emblema`). */
  emblema?: Emblema;
  /** Colores del círculo; `null` usa la superficie elevada (`surface-raised`). */
  colores: ColoresCirculo | null;
  /** Fondo (CSS `background`) de la franja superior de la tarjeta de bienvenida. */
  franja: string;
  decoracion?: Decoracion;
}

/**
 * Domingo de Pascua de un año (algoritmo de Meeus/Jones/Butcher, calendario gregoriano). Es
 * aritmética pura: no necesita internet ni tablas. Comprobado con 2024 (31 mar), 2025 (20 abr),
 * 2026 (5 abr), 2027 (28 mar), 2028 (16 abr) y 2030 (21 abr).
 */
export function domingoDePascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

/** 'MM-DD' de una fecha. */
export function mesDia(fecha: Date): string {
  return `${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

/** Semana Santa: del Domingo de Ramos (una semana antes de Pascua) al Domingo de Resurrección. */
function semanaSanta(anio: number): { desde: string; hasta: string } {
  const pascua = domingoDePascua(anio);
  const ramos = new Date(pascua);
  ramos.setDate(pascua.getDate() - 7);
  return { desde: mesDia(ramos), hasta: mesDia(pascua) };
}

/**
 * Calendario de ambientaciones. Agregar una fecha es agregar una entrada aquí y su saludo en los
 * archivos de idioma.
 */
export const TEMPORADAS: Temporada[] = [
  {
    id: 'navidad',
    desde: '12-01',
    hasta: '01-06',
    prioridad: 1,
    saludo: 'inicio.temporadaNavidad',
    icono: 'fa-solid fa-tree',
    colores: { fondo: '#d1fae5', color: '#047857', fondoOscuro: 'rgb(6 78 59 / 0.5)', colorOscuro: '#6ee7b7' },
    franja: 'linear-gradient(to right, #059669, #ef4444, #059669)',
    decoracion: 'copos',
  },
  {
    id: 'anioNuevo',
    desde: '12-31',
    hasta: '01-02',
    prioridad: 2,
    saludo: 'inicio.temporadaAnioNuevo',
    icono: 'fa-solid fa-champagne-glasses',
    emblema: 'anio',
    colores: { fondo: '#fef3c7', color: '#b45309', fondoOscuro: 'rgb(120 53 15 / 0.5)', colorOscuro: '#fcd34d' },
    franja: 'linear-gradient(to right, #fbbf24, #d946ef, #0ea5e9)',
    decoracion: 'fuegos',
  },
  {
    id: 'mesPatrio',
    desde: '09-01',
    hasta: '09-15',
    paises: ['GT'],
    prioridad: 1,
    saludo: 'inicio.temporadaMesPatrio',
    icono: 'fa-solid fa-flag',
    emblema: 'banderaGT',
    // Fondo neutro: sobre celeste, la franja celeste de la bandera se perdería
    colores: null,
    // La bandera en bandas: celeste, blanco y celeste, en tercios iguales
    franja: 'linear-gradient(to right, #4997D0 33.33%, #ffffff 33.33% 66.66%, #4997D0 66.66%)',
  },
  {
    // Las vacaciones de Semana Santa: el tono es de descanso (playa), no religioso
    id: 'semanaSanta',
    rango: semanaSanta,
    prioridad: 1,
    saludo: 'inicio.temporadaSemanaSanta',
    icono: 'fa-solid fa-umbrella-beach',
    colores: { fondo: '#cffafe', color: '#0e7490', fondoOscuro: 'rgb(22 78 99 / 0.5)', colorOscuro: '#67e8f9' },
    franja: 'linear-gradient(to right, #0ea5e9, #67e8f9, #fcd34d)',
  },
];
