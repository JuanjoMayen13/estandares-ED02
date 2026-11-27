// Estándar pantalla de inicio v1.0.0 — decoración de temporada (README §2.14), nivel 4
import { Component, OnDestroy, OnInit, input, signal } from '@angular/core';
import { Decoracion } from '../../servicios/temporadas';

interface Particula {
  izquierda: number;
  retraso: number;
  duracion: number;
  tamano: number;
  giro: number;
  color: string;
}

interface Estallido {
  izquierda: number;
  arriba: number;
  tamano: number;
  retraso: number;
  color: string;
}

/** Nieve de Navidad: continua mientras se está en el inicio. Pocos copos, lentos y pequeños. */
const CANTIDAD_COPOS = 16;

/** Confeti: una caída breve, una vez por sesión. */
const CANTIDAD_CONFETI = 18;
/** Lo que dura la caída más larga del confeti; después se quita del DOM. */
const DURACION_CONFETI_MS = 5000;
const COLORES_CONFETI = ['#fbbf24', '#d946ef', '#0ea5e9', '#10b981'];

/**
 * Fuegos artificiales de Año Nuevo: posiciones fijas en la mitad derecha de la tarjeta (la
 * izquierda es la del saludo), escalonados para que no estallen todos a la vez.
 */
const ESTALLIDOS: Estallido[] = [
  { izquierda: 72, arriba: 40, tamano: 110, retraso: 0, color: '#fbbf24' },
  { izquierda: 88, arriba: 65, tamano: 80, retraso: 450, color: '#d946ef' },
  { izquierda: 58, arriba: 70, tamano: 90, retraso: 900, color: '#0ea5e9' },
  { izquierda: 82, arriba: 22, tamano: 70, retraso: 1300, color: '#f59e0b' },
];
/** El último estallido empieza a los 1,3 s y dura 1,4 s. */
const DURACION_FUEGOS_MS = 3000;

/**
 * Decoración sobre la tarjeta de bienvenida. No tapa nada (sin eventos de puntero) y con
 * «reducir movimiento» no se muestra. Igual en las dos implementaciones (su CSS es propio).
 *
 * - **Copos** (Navidad): nieve continua. Se mueve solo con `transform` y `opacity`, que el
 *   navegador anima sin recalcular la página. Al salir del inicio se detiene.
 * - **Confeti y fuegos**: una caída o estallido breve, una sola vez por sesión del navegador.
 */
@Component({
  selector: 'app-decoracion-temporada',
  standalone: true,
  templateUrl: './decoracion-temporada.component.html',
  styleUrl: './decoracion-temporada.component.css',
  host: { 'aria-hidden': 'true' },
})
export class DecoracionTemporadaComponent implements OnInit, OnDestroy {
  readonly tipo = input<Decoracion>('copos');
  /** Id de la temporada, para mostrar el confeti o los fuegos una sola vez por sesión. */
  readonly temporada = input('');

  protected readonly visible = signal(true);
  protected particulas: Particula[] = [];
  protected estallidos: Estallido[] = [];

  protected readonly RAYOS_LARGOS = [0, 60, 120, 180, 240, 300];
  protected readonly RAYOS_CORTOS = [30, 90, 150, 210, 270, 330];

  private temporizador?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    // La nieve no se cuenta por sesión: está siempre que se está en el inicio
    if (this.tipo() === 'copos') {
      this.particulas = Array.from({ length: CANTIDAD_COPOS }, () => {
        const duracion = 7000 + Math.random() * 5000;
        return {
          izquierda: Math.random() * 96,
          // Retraso negativo: al entrar, los copos ya están repartidos por la tarjeta
          retraso: Math.random() * duracion,
          duracion,
          tamano: 3 + Math.random() * 4,
          giro: 0,
          color: '',
        };
      });
      return;
    }

    const clave = `inicioTemporadaVista:${this.temporada()}`;
    try {
      if (sessionStorage.getItem(clave)) {
        this.visible.set(false);
        return;
      }
      sessionStorage.setItem(clave, '1');
    } catch {
      // Almacenamiento bloqueado: se muestra igual
    }

    if (this.tipo() === 'fuegos') {
      this.estallidos = ESTALLIDOS;
      this.temporizador = setTimeout(() => this.visible.set(false), DURACION_FUEGOS_MS);
      return;
    }

    this.particulas = Array.from({ length: CANTIDAD_CONFETI }, (_, i) => ({
      izquierda: Math.random() * 96,
      retraso: Math.random() * 1200,
      duracion: 2400 + Math.random() * 1400,
      tamano: 5 + Math.random() * 3,
      giro: 180 + Math.random() * 360,
      color: COLORES_CONFETI[i % COLORES_CONFETI.length],
    }));
    this.temporizador = setTimeout(() => this.visible.set(false), DURACION_CONFETI_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
  }
}
