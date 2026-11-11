import { Directive, ElementRef, NgZone, OnDestroy, OnInit } from '@angular/core';

// Ventana (ms) de los últimos movimientos con la que se calcula la velocidad al soltar la bola
const VENTANA_VELOCIDAD_MS = 100;
// Fracción de la velocidad del mouse que conserva la bola al soltarla (1 = la misma; menos = giro más suave)
const FUERZA_LANZAMIENTO = 0.65;
// Velocidad máxima (grados por ms) con la que puede salir una bola: 1 = 1000 grados por segundo
const VELOCIDAD_MAXIMA = 1;
// Qué tan rápido frena la inercia hasta la velocidad normal de la órbita (ms; más alto = gira más tiempo)
const FRENADO_MS = 900;
// Por debajo de esta diferencia con la velocidad normal (grados por ms) la inercia termina
const VELOCIDAD_MINIMA = 0.005;

/**
 * Bola de la ilustración del login que el usuario puede arrastrar con el mouse (o el dedo) sobre su propio anillo.
 * La bola nunca sale de su órbita: al arrastrarla se gira la órbita completa hasta donde apunta el mouse. Si se suelta
 * en movimiento, sigue girando con ese impulso (inercia) y frena poco a poco hasta su velocidad normal; si se suelta
 * quieta, la órbita sigue girando desde ese punto.
 * El padre debe ser el elemento que gira (`.satelite`, con la animación `girar`) y el abuelo el contenedor
 * cuadrado de la ilustración (`.orbita`), cuyo centro es el centro de los anillos. Es solo decorativo.
 */
@Directive({ selector: '[appBolaArrastrable]', standalone: true })
export class BolaArrastrableDirective implements OnInit, OnDestroy {
  private arrastrando = false;
  // Giro de la órbita en grados, sin limitar a 0–360 para poder medir la velocidad aunque dé varias vueltas
  private giro = 0;
  private anguloPrevio = 0;
  private muestras: { tiempo: number; giro: number }[] = [];
  private cuadroInercia = 0;
  private quitarEventos: (() => void)[] = [];

  constructor(
    private el: ElementRef<HTMLElement>,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    // Fuera de Angular: mover la bola no cambia nada de la pantalla, no hace falta detectar cambios en cada movimiento
    this.zone.runOutsideAngular(() => {
      this.escuchar('pointerdown', this.alPresionar);
      this.escuchar('pointermove', this.alMover);
      this.escuchar('pointerup', this.alSoltar);
      this.escuchar('pointercancel', this.alSoltar);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.cuadroInercia);
    this.quitarEventos.forEach((quitar) => quitar());
  }

  private get bola(): HTMLElement {
    return this.el.nativeElement;
  }

  private get orbita(): HTMLElement | null {
    return this.bola.parentElement;
  }

  // Animación CSS de giro de la órbita (no existe con movimiento reducido)
  private get animacion(): Animation | undefined {
    return this.orbita?.getAnimations()[0];
  }

  private escuchar(tipo: string, manejador: (event: PointerEvent) => void): void {
    const listener = manejador as EventListener;
    this.bola.addEventListener(tipo, listener);
    this.quitarEventos.push(() => this.bola.removeEventListener(tipo, listener));
  }

  private alPresionar = (event: PointerEvent): void => {
    if (!this.orbita) return;
    event.preventDefault();
    // Si la bola venía girando por inercia, se detiene donde se agarró
    cancelAnimationFrame(this.cuadroInercia);
    this.bola.setPointerCapture(event.pointerId);
    this.arrastrando = true;
    this.animacion?.pause();
    this.giro = this.leerGiro();
    this.anguloPrevio = this.anguloDelPuntero(event);
    this.muestras = [{ tiempo: performance.now(), giro: this.giro }];
    this.bola.classList.add('arrastrando');
  };

  private alMover = (event: PointerEvent): void => {
    if (!this.arrastrando) return;
    // Suma solo lo que avanzó el mouse alrededor del centro, para que la bola no salte al cruzar los 180°
    const angulo = this.anguloDelPuntero(event);
    this.giro += this.diferenciaAngular(angulo, this.anguloPrevio);
    this.anguloPrevio = angulo;
    this.aplicarGiro(this.giro);

    const ahora = performance.now();
    this.muestras.push({ tiempo: ahora, giro: this.giro });
    this.muestras = this.muestras.filter((muestra) => ahora - muestra.tiempo <= VENTANA_VELOCIDAD_MS);
  };

  private alSoltar = (event: PointerEvent): void => {
    if (!this.arrastrando) return;
    this.arrastrando = false;
    if (this.bola.hasPointerCapture(event.pointerId)) {
      this.bola.releasePointerCapture(event.pointerId);
    }
    this.bola.classList.remove('arrastrando');
    this.iniciarInercia(this.velocidadAlSoltar());
  };

  // Velocidad (grados por ms) de los últimos movimientos; 0 si el mouse ya estaba quieto al soltar
  private velocidadAlSoltar(): number {
    const ahora = performance.now();
    const recientes = this.muestras.filter((muestra) => ahora - muestra.tiempo <= VENTANA_VELOCIDAD_MS);
    if (recientes.length < 2) return 0;
    const primera = recientes[0];
    const ultima = recientes[recientes.length - 1];
    const tiempo = ultima.tiempo - primera.tiempo;
    if (tiempo <= 0) return 0;
    const velocidad = ((ultima.giro - primera.giro) / tiempo) * FUERZA_LANZAMIENTO;
    return Math.max(-VELOCIDAD_MAXIMA, Math.min(VELOCIDAD_MAXIMA, velocidad));
  }

  // Sigue girando con la velocidad del lanzamiento y frena hasta la velocidad normal; luego devuelve el control a la animación CSS
  private iniciarInercia(velocidadInicial: number): void {
    const animacion = this.animacion;
    const normal = this.velocidadNormal();
    const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animacion || sinMovimiento || Math.abs(velocidadInicial - normal) < VELOCIDAD_MINIMA) {
      animacion?.play();
      return;
    }

    let velocidad = velocidadInicial;
    let anterior = performance.now();
    const paso = (ahora: number) => {
      const transcurrido = Math.min(ahora - anterior, 50);
      anterior = ahora;
      // Frenado suave: la diferencia con la velocidad normal se reduce de forma exponencial
      velocidad = normal + (velocidad - normal) * Math.exp(-transcurrido / FRENADO_MS);
      this.giro += velocidad * transcurrido;
      this.aplicarGiro(this.giro);

      if (Math.abs(velocidad - normal) < VELOCIDAD_MINIMA) {
        animacion.play();
        return;
      }
      this.cuadroInercia = requestAnimationFrame(paso);
    };
    this.cuadroInercia = requestAnimationFrame(paso);
  }

  // Velocidad propia de la órbita (grados por ms): positiva si gira a la derecha, negativa si gira en reversa
  private velocidadNormal(): number {
    const tiempos = this.animacion?.effect?.getComputedTiming();
    const duracion = Number(tiempos?.duration);
    if (!(duracion > 0)) return 0;
    return (tiempos?.direction === 'reverse' ? -360 : 360) / duracion;
  }

  // Ángulo (grados) del puntero alrededor del centro de los anillos
  private anguloDelPuntero(event: PointerEvent): number {
    const contenedor = this.orbita?.parentElement ?? this.orbita!;
    const caja = contenedor.getBoundingClientRect();
    const centroX = caja.left + caja.width / 2;
    const centroY = caja.top + caja.height / 2;
    return (Math.atan2(event.clientY - centroY, event.clientX - centroX) * 180) / Math.PI;
  }

  // Diferencia entre dos ángulos por el camino más corto (-180 a 180)
  private diferenciaAngular(actual: number, previo: number): number {
    return ((((actual - previo) % 360) + 540) % 360) - 180;
  }

  // Giro actual de la órbita (grados, 0 a 360) leído de su transformación
  private leerGiro(): number {
    const transformacion = getComputedStyle(this.orbita!).transform;
    const matriz = transformacion && transformacion !== 'none' ? new DOMMatrix(transformacion) : new DOMMatrix();
    return this.normalizar((Math.atan2(matriz.b, matriz.a) * 180) / Math.PI);
  }

  // Lleva la órbita al giro indicado moviendo su animación al punto equivalente (o con un giro fijo si no tiene animación)
  private aplicarGiro(grados: number): void {
    const giro = this.normalizar(grados);
    const animacion = this.animacion;
    const tiempos = animacion?.effect?.getComputedTiming();
    const duracion = Number(tiempos?.duration);

    if (animacion && duracion > 0) {
      // `girar` va de 0 a 360 grados; las órbitas en reversa van de 360 a 0
      const avance = tiempos?.direction === 'reverse' ? 1 - giro / 360 : giro / 360;
      animacion.currentTime = avance * duracion;
    } else {
      this.orbita!.style.transform = `rotate(${giro}deg)`;
    }
  }

  private normalizar(grados: number): number {
    return ((grados % 360) + 360) % 360;
  }
}
