# Estándar: Barra de estado

Barra al pie de las pantallas internas de la aplicación. En **una sola fila** y sobre un degradado azul, muestra **quién está trabajando** (usuario, estación de trabajo y empresa), la **firma** de la empresa desarrolladora y la **versión** de la aplicación. El usuario elige si la barra queda **fija** o se **auto-oculta** para dejar todo el alto a la pantalla.

| | |
|---|---|
| **Versión** | 2.0.0 — 2026-11-20 |
| **Origen** | Componente `app-barra-estado` del portal *Business* (Angular 20 + Tailwind CSS 3.4) |
| **Implementaciones** | 1) Angular + Tailwind · 2) Angular + CSS puro |

> **Alcance.** Este documento describe **solo el diseño** de la barra: cómo se ve, cuánto mide, qué colores usa, cómo se pliega y cómo se comporta al cambiar el ancho de la pantalla. No incluye la lógica interna de Business (servicios de sesión, andamio de pantallas, temas de color, contador de peticiones ni la pantalla de ajustes); esa lógica queda fuera del estándar.

> **Qué cambió respecto a la 1.0.0.** La barra ya no tiene pie aparte (copyright y versión pasan a la misma fila), mide 36 px en una fila en lugar de los 136 px de antes, tiene el modo auto-ocultar y una **línea de actividad opcional**. Ver el [historial](#historial) y la [guía de migración](#82-migrar-desde-la-100).

---

## Índice

1. [Especificación visual](#1-especificación-visual)
2. [Contenido, ubicación y preferencia del usuario](#2-contenido-ubicación-y-preferencia-del-usuario)
3. [Implementación 1 — Angular + Tailwind](#3-implementación-1--angular--tailwind)
4. [Implementación 2 — Angular + CSS puro (sin Tailwind)](#4-implementación-2--angular--css-puro-sin-tailwind)
5. [Reglas de uso](#5-reglas-de-uso)
6. [Checklist de QA](#6-checklist-de-qa)
7. [Observaciones de diseño](#7-observaciones-de-diseño)
8. [Mantenimiento del estándar](#8-mantenimiento-del-estándar)

---

## 1. Especificación visual

Valores reales del componente (CSS generado por Tailwind 3.4). Es la **fuente de verdad**: cualquier implementación debe reproducirlos.

### 1.1 Anatomía

**Modo fija** — la barra es la última fila del layout y ocupa su propio espacio:

```
┌─ barra con degradado azul · una fila · 36 px de alto ──────────────────────────────────────────────────┐
│ 👤 Usuario: jmayen │ 📍 Estacion trabajo: CAJA 01 │ 🏢 Empresa: ILGUA │ 🖥 Display: ALT    2024, Desarrollado por DMS.  [v4.15.1] 📌 │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   datos de la sesión (izquierda)                                        firma · versión · chincheta (derecha)
```

**Modo auto-ocultar, plegada** — la barra flota sobre el contenido y solo asoma una pestaña y una franja de 4 px:

```
                           ┌──────┐
   contenido de la pantalla│  ⌃   │  ← pestaña de 56 × 18
 ──────────────────────────┴──────┴────────────────────── ← franja de 4 px de la barra (aquí se ve la línea de actividad)
```

**Modo auto-ocultar, abierta** — la barra sube sobre el contenido (sin empujarlo); la pestaña queda arriba con el chevron girado (⌄).

Desde **768 px** las etiquetas (`Usuario:`, `Estacion trabajo:`…) y los separadores verticales entre datos son visibles. Por debajo de 768 px solo se ven el ícono y el valor (las etiquetas quedan para lectores de pantalla). Por debajo de **640 px** la firma, la versión y la chincheta bajan a una segunda fila a todo el ancho.

**Alto.** Con todo en una fila, la barra mide **36 px** (6 de relleno + 24 de la fila de la chincheta + 6). Si los datos y el grupo derecho no caben juntos (por debajo de 640 px, o con etiquetas visibles entre 768 y ≈ 1000 px), el grupo derecho pasa a una segunda fila y la barra mide **56–60 px**.

### 1.2 Modos

| Modo | Valor | Qué hace |
|---|---|---|
| **Fija** (por defecto) | `fija` | La barra está en la fila inferior del layout, siempre visible y con su propio espacio. |
| **Auto-ocultar** | `auto` | La barra está **fuera del flujo** (`position: fixed` al pie de la ventana) y plegada: solo asoma la pestaña y 4 px de la barra. Se despliega al acercar el mouse, al enfocarla con el teclado o al tocar la pestaña (táctil). La pantalla gana todo su alto. |

Se cambia con la **chincheta** de la propia barra (a la derecha) y, si la aplicación tiene un panel de ajustes, también desde allí (ver [§2.3](#23-preferencia-del-usuario)).

#### Comportamiento del modo auto-ocultar

| Evento | Resultado |
|---|---|
| Mouse sobre la **zona sensible** (10 px del borde inferior), la pestaña o la barra | Se abre |
| Mouse fuera | Se cierra tras **350 ms** (evita parpadeos al cruzar el borde) |
| Foco de teclado dentro de la barra (`focusin`) | Se abre |
| El foco sale de la barra | Se cierra tras 350 ms (no mientras el foco se mueve dentro de ella) |
| Tecla `Esc` con el foco dentro | Se cierra |
| Toque en la **pestaña** con dedo | Alterna (abre / cierra) |
| Clic con mouse en la pestaña | Solo abre (el cursor ya estaba encima; no debe cerrarla bajo el cursor) |
| Toque en cualquier otro lugar de la pantalla | Se cierra |
| Pulsar la chincheta (de auto a fija) | La barra pasa a ocupar su fila; (de fija a auto) queda **abierta** hasta que el mouse salga |

Movimiento: la barra y la pestaña se desplazan juntas con `transform: translateY` en **200 ms** `ease`. Con «reducir movimiento» (`prefers-reduced-motion`) no hay transición.

### 1.3 Puntos de quiebre

| Nombre | Desde | Qué cambia |
|---|---|---|
| (base) | 0 px | Márgenes laterales 16, margen inferior 8. Datos con texto 12/16. Firma, versión y chincheta en una segunda fila a todo el ancho (`justify-content: space-between`), con texto 11 |
| `sm` | 640 px | Márgenes laterales 32 y margen inferior 12 (en modo fija; en auto sigue en 8). Datos con texto 14/20. Firma, versión y chincheta a la **derecha de la misma fila** (ancho automático), texto 12/16 |
| `md` | 768 px | Aparecen las **etiquetas** de los datos y un **separador vertical** de 1 px entre ellos (con 12 de relleno) |

El margen lateral de la barra **es el margen del contenido** de la aplicación (en Business, el que pone el shell: 16 y 32). Si el layout de otra aplicación usa un margen distinto, la barra usa ese mismo para quedar alineada con el contenido.

### 1.4 Contenedor (`footer`)

| Propiedad | Modo fija | Modo auto-ocultar |
|---|---|---|
| Posición | `relative` (ver nota) | `fixed`, `left: 0`, `right: 0`, `bottom: 0` |
| `z-index` | — | **40**: por debajo de modales, paneles laterales y avisos (Business: 50 en adelante) |
| Relleno | 0 arriba · 16 / 32 (`sm`) laterales · 8 / 12 (`sm`) abajo | 0 arriba · 16 / 32 (`sm`) laterales · 8 abajo |
| Eventos de puntero | normales | `pointer-events: none` en el contenedor; solo la zona sensible, la pestaña y la barra los reciben (así el contenedor no bloquea el contenido que queda debajo) |

> **Nota — `relative` en modo fija.** Los textos solo para lectores de pantalla (`sr-only`) son `position: absolute`. Sin un ancestro posicionado, su bloque contenedor es la ventana y pueden escapar del scroll del layout y **alargar el scroll de toda la página** (síntoma: doble barra de desplazamiento). Por eso el `footer` es `relative` en modo fija; en modo auto ya lo contiene `fixed`.

### 1.5 Barra con degradado

| Propiedad | Valor |
|---|---|
| Fondo | Degradado azul `to bottom right` (ver [§1.11](#111-colores)) |
| Color de texto | `#FFFFFF` |
| Relleno | 6 vertical · 12 horizontal |
| Radio de borde | 6 |
| Disposición | Fila con salto de línea, centrada en vertical; espacio entre columnas 16 y entre filas 4 |
| Overflow | `hidden` (recorta la línea de actividad al radio) |
| Selección de texto | Desactivada (`user-select: none`) |

**Cómo se reparte el degradado.** `to bottom right` de CSS no es una diagonal simple: el navegador ajusta el ángulo para que las otras dos esquinas (arriba-derecha y abajo-izquierda) caigan justo en el **50 %** del degradado. La esquina arriba-izquierda lleva el **primer** color y la abajo-derecha el **último**. Cualquier reimplementación (móvil nativo, PDF…) debe respetar esa regla.

### 1.6 Datos (usuario, estación, empresa y display)

Van en una lista a la izquierda. Cada dato es: ícono + `Etiqueta: **valor**`.

| Elemento | Propiedad | Valor |
|---|---|---|
| Lista | Disposición | Fila con salto de línea, centrada en vertical; espacio entre columnas 12 y entre filas 2; ancho mínimo 0 |
| Lista | Texto | 12 / 16 (base) · 14 / 20 (`sm`) |
| Dato | Disposición | Fila centrada en vertical; ancho mínimo 0; espacio entre ícono y texto 6 |
| Dato (2.º en adelante) | Separador | Desde `md`: borde izquierdo de 1 px blanco al **20 %** y relleno izquierdo de 12 |
| Ícono | Tamaño | 12 / 16 |
| Texto | Overflow | Una línea, `overflow: hidden`, `text-overflow: ellipsis` |
| Etiqueta | Visibilidad | Visible desde `md`; por debajo, **solo para lectores de pantalla** (`sr-only`) |
| Valor | Peso de fuente | Negrita (`bolder`) |

Íconos (Font Awesome 6 Free, estilo *solid*):

| Dato | Clase | Obligatorio |
|---|---|---|
| Usuario | `fa-user` | Sí |
| Estación de trabajo | `fa-location-dot` | Sí |
| Empresa | `fa-building` | Sí |
| Display | `fa-desktop` | **No**: solo se dibuja si tiene valor |

### 1.7 Firma, versión y chincheta

Grupo a la derecha de la fila (segunda fila a todo el ancho por debajo de 640 px).

| Elemento | Propiedad | Valor |
|---|---|---|
| Grupo | Disposición | Fila, centrada en vertical, espacio entre elementos 12 |
| Grupo | Alineación | Base: ancho 100 % con `space-between` · `sm`: margen izquierdo automático, ancho automático, `justify-content: flex-end` |
| Grupo | Texto | 11 px (base) · 12 / 16 (`sm`); color blanco al **75 %** |
| Firma | Texto | `2024, {Desarrollado por} {empresa desarrolladora}.` (el «Desarrollado por» va traducido) |
| Firma | Fuente / overflow | Hereda la fuente de la aplicación · una línea con puntos suspensivos · sin enlace |
| Insignia de versión | Fondo / texto | Blanco al **15 %** / `#FFFFFF` |
| Insignia de versión | Relleno / radio | 2 vertical, 8 horizontal / 4 |
| Insignia de versión | Ancho mínimo / alineación | 56 / texto centrado |
| Insignia de versión | Texto | 11 px (base) · 12 / 16 (`sm`), peso 500 |
| Chincheta | Tamaño / radio | 24 × 24 / 4 |
| Chincheta | Color | Blanco al 80 %; con el mouse encima, fondo blanco al 15 % y texto blanco |
| Chincheta | Ícono | `fa-thumbtack` 12 / 16. Modo fija: recto, opacidad 100 %. Modo auto: girado **45°** y opacidad **60 %** |
| Chincheta | Estado | `aria-pressed` = `true` en modo fija |

### 1.8 Pestaña y plegado (solo modo auto-ocultar)

| Elemento | Propiedad | Valor |
|---|---|---|
| Zona sensible | Tamaño | 10 px de alto en el borde inferior, ancho completo, invisible (`aria-hidden`) |
| Pestaña | Tamaño / posición | **56 × 18**, centrada horizontalmente, pegada a la barra por arriba |
| Pestaña | Fondo | El **mismo degradado** de la barra |
| Pestaña | Radio | 6 arriba, 0 abajo |
| Pestaña | Ícono | `fa-chevron-up` 10 px, blanco al 85 % (100 % al pasar el mouse). **Gira 180°** cuando la barra está abierta (transición de 200 ms) |
| Pestaña | Accesibilidad | `aria-expanded`, `aria-label` = «Mostrar la barra de estado» (traducido) |
| Conjunto (pestaña + barra) | Plegado | `transform: translateY(calc(100% - 14px))` — con el relleno inferior de 8 del contenedor quedan visibles **22 px**: la pestaña (18) y una franja de 4 de la barra |
| Conjunto | Transición | `transform 200ms ease` |

### 1.9 Línea de actividad (**opcional**)

Pequeña luz que recorre el borde superior de la barra **mientras la aplicación tiene peticiones en curso**. Se ve también con la barra plegada (es lo que asoma de ella), así que avisa de la actividad sin ocupar espacio.

> **Es opcional.** Solo se muestra si la aplicación le avisa a la barra que hay actividad (entrada `actividad`). Si no la conecta, **la barra funciona igual y la línea no existe**. No todas las aplicaciones tienen una capa de peticiones donde contarlas; el estándar no exige construirla.

| Propiedad | Valor |
|---|---|
| Pista | Franja de **3 px** de alto en el borde superior de la barra, ancho completo, `overflow: hidden`, sin eventos de puntero, `aria-hidden` |
| Luz | 30 % del ancho de la pista, alto completo, radio 2, blanco al **85 %** |
| Animación | `translateX` de **−100 % a 333 %**, **1,1 s**, lineal, infinita |
| `prefers-reduced-motion` | Sin animación: la luz ocupa el 100 % del ancho con opacidad **0,6** (línea fija y tenue) |
| Accesibilidad | La barra lleva `aria-busy="true"` mientras hay actividad |

**Tiempos recomendados para quien la conecte** (lógica de la aplicación, fuera del componente): mostrar la línea solo tras **150 ms** de actividad continua (las peticiones muy rápidas no deben hacerla parpadear) y mantenerla visible al menos **500 ms** una vez encendida. Conviene ignorar las peticiones periódicas en segundo plano (verificaciones de conexión, refrescos automáticos de tableros) para que la línea no esté encendida todo el tiempo.

### 1.10 Tipografía

Toda la barra **hereda la fuente de la aplicación** (en Business, Roboto, con interlineado 1.5). No se declara otra familia.

### 1.11 Colores

El degradado de la barra y de la pestaña es **siempre azul**, con una variante para el modo oscuro. El resto (texto, separadores, insignia, chincheta) es blanco con opacidad y no cambia entre modos.

| Modo | Degradado (arriba-izquierda → abajo-derecha) | Clases Tailwind |
|---|---|---|
| Claro (por defecto) | `#1A365D` → `#2C5282` | `from-[#1a365d] to-[#2c5282]` |
| Oscuro | `#061B3C` → `#34495E` | `dark:from-[#061b3c] dark:to-[#34495e]` |

Opacidades de blanco: firma y texto del grupo derecho **75 %**, chincheta **80 %**, ícono de la pestaña **85 %**, separadores **20 %**, fondo de la insignia **15 %**, fondo de la chincheta con el mouse encima **15 %**, luz de actividad **85 %**.

> **Nota — los temas de color son aparte.** En Business el usuario puede cambiar el tema visual de toda la aplicación y por eso, allí, el degradado puede ser de otro color (lo resuelve un servicio propio, `TemaVisualService`). **Esa lógica no forma parte de este estándar y no hace falta implementarla**: la barra del estándar usa siempre el degradado azul de la tabla.

### 1.12 Textos

Todos los textos se pasan **ya traducidos** al idioma activo. Valores de referencia:

| Texto | es | en | fr | de |
|---|---|---|---|---|
| Etiqueta de usuario | Usuario | User | Utilisateur | Benutzer |
| Etiqueta de estación | Estacion trabajo | Workstation | Poste de travail | Arbeitsstation |
| Etiqueta de empresa | Empresa | Company | Entreprise | Unternehmen |
| Etiqueta de display | Display | Display | Display | Display |
| «Desarrollado por» (firma) | Desarrollado por | Developed by | Développé par | Entwickelt von |
| Pestaña (`aria-label`) | Mostrar la barra de estado | Show the status bar | Afficher la barre d'état | Statusleiste anzeigen |
| Chincheta en modo fija | Auto-ocultar la barra de estado | Auto-hide the status bar | Masquer automatiquement la barre d'état | Statusleiste automatisch ausblenden |
| Chincheta en modo auto | Fijar la barra de estado | Pin the status bar | Épingler la barre d'état | Statusleiste fixieren |

El año `2024` es fijo (ver [observación 1](#7-observaciones-de-diseño)).

---

## 2. Contenido, ubicación y preferencia del usuario

### 2.1 Contenido

| Dato | Qué es | Obligatorio |
|---|---|---|
| `usuario` | Usuario con sesión iniciada | Sí |
| `estacionTrabajo` | Descripción de la estación de trabajo seleccionada | Sí |
| `empresa` | Nombre de la empresa seleccionada | Sí |
| `display` | Dato adicional de la sesión (en Business, la URL alterna del display). Sin valor, no se dibuja | No |
| `empresaDesarrolladora` | Empresa desarrolladora, en la firma (en Business: `Desarrollo Moderno de Software S.A`) | Sí |
| `version` | Versión de la aplicación, ya con prefijo (ej. `v4.15.1`) | Sí |
| `modo` | `fija` o `auto` (ver [§2.3](#23-preferencia-del-usuario)) | No (por defecto `fija`) |
| `actividad` | `true` mientras hay peticiones en curso (ver [§1.9](#19-línea-de-actividad-opcional)) | **No** (por defecto `false`: sin línea) |
| Textos | Etiquetas, «Desarrollado por», pestaña y chincheta, ya traducidos | Sí |

Si un dato no tiene valor, su etiqueta se muestra igual y el valor queda vacío (salvo `display`, que entonces no se dibuja).

### 2.2 Ubicación

Es la **última fila del layout** de la pantalla: debajo del contenido y alineada con él, con el mismo margen lateral (en modo auto, además, flota sobre el contenido al pie de la ventana).

No va en: la pantalla de inicio de sesión (todavía no hay usuario, estación ni empresa), las pantallas públicas (kioscos, pantallas de TV, tickets) ni dentro de modales o paneles laterales.

### 2.3 Preferencia del usuario

El modo (`fija` / `auto`) es una **preferencia del usuario**, no una decisión de la pantalla:

| Aspecto | Valor |
|---|---|
| Quién decide | El usuario, con la chincheta de la barra y, si la aplicación tiene un panel de ajustes o preferencias, con un selector allí (dos opciones: «Fija» y «Auto-ocultar», cada una con una línea que explica qué hace) |
| Dónde se guarda | En el navegador (`localStorage`), clave **`barraEstadoModo`**, valores `fija` / `auto`. Cualquier otro valor, o la falta de almacenamiento, equivale a `fija` |
| Valor por defecto | `fija` |
| Quién la guarda | La **aplicación**, no el componente: la barra solo recibe `modo` y avisa con `modoChange` cuando el usuario pulsa la chincheta |

Guardarla es lógica de la aplicación (en Business, `BarraEstadoModoService` y un selector en el panel de ajustes); queda fuera del estándar.

---

## 3. Implementación 1 — Angular + Tailwind

Componente de presentación: recibe todo por `@Input`, avisa del cambio de modo por `@Output` y no depende de servicios de la aplicación. Es el componente de Business sin su lógica interna; la apariencia es idéntica a la de Business con el tema azul.

### 3.1 Requisitos

| Requisito | Versión / condición | Si no se cumple |
|---|---|---|
| Angular | ≥ 17 (componente standalone, `styleUrl` en singular, control de flujo `@if`) | En Angular 14–16 cambiar `styleUrl: '…'` por `styleUrls: ['…']` y `@if` por `*ngIf` |
| Tailwind CSS | **3.x** (probado con 3.4) con `darkMode: 'class'` | Con otra estrategia de modo oscuro o con Tailwind 4 no hay garantía de que se vea igual (no se probó). Usar la [Implementación 2](#4-implementación-2--angular--css-puro-sin-tailwind). |
| `content` de Tailwind | Debe incluir los `.html` de los componentes (ej. `"./src/**/*.{html,ts}"`) | Las clases no se generan y la barra queda **sin fondo** (texto blanco sobre blanco) |
| Preflight de Tailwind | Activo (por defecto) | Si está desactivado, cambian `box-sizing`, los márgenes del `<p>` y la lista. Usar la Implementación 2. |
| Font Awesome | 6.x, `fontawesome.css` + `solid.css` **importados antes** que Tailwind | Si se importa después, `.fa-solid { line-height: 1 }` pisa el `text-xs` del ícono y los íconos quedan más bajos. Ejemplo: `@import` al inicio de `styles.css`, antes de `@tailwind`. |
| Modo oscuro | Clase `dark` en `<html>` (o un ancestro) | Sin ella, la barra se ve siempre en modo claro |
| Fuente | La de la aplicación | La barra la hereda |

### 3.2 Archivos

```
barra-estado/
├── barra-estado.component.ts
├── barra-estado.component.html
└── barra-estado.component.css          ← animaciones del plegado y de la línea de actividad

version-badge/
├── version-badge.component.ts
├── version-badge.component.html
└── version-badge.component.css         ← vacío
```

### 3.3 `barra-estado.component.ts`

```ts
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, signal } from '@angular/core';
import { VersionBadgeComponent } from '../version-badge/version-badge.component';

export type ModoBarraEstado = 'fija' | 'auto';

/** Espera antes de plegar la barra al sacar el mouse: evita que parpadee al cruzar su borde. */
const RETARDO_CIERRE_MS = 350;

@Component({
    selector: 'app-barra-estado',
    templateUrl: './barra-estado.component.html',
    styleUrl: './barra-estado.component.css',
    standalone: true,
    imports: [VersionBadgeComponent]
})
export class BarraEstadoComponent implements OnDestroy {
  @Input() usuario: string = '';
  @Input() estacionTrabajo: string = '';
  @Input() empresa: string = '';

  /** Dato adicional (opcional). Sin valor, no se dibuja. */
  @Input() display: string = '';

  /** Empresa desarrolladora, en la firma. */
  @Input() empresaDesarrolladora: string = '';

  /** Versión de la aplicación, ya con prefijo (ej. v1.0.0). */
  @Input() version: string = '';

  /** `fija`: ocupa su fila del layout. `auto`: flota al pie y se pliega. La preferencia la guarda la aplicación. */
  @Input() modo: ModoBarraEstado = 'fija';
  @Output() modoChange = new EventEmitter<ModoBarraEstado>();

  /** OPCIONAL: `true` mientras haya peticiones en curso. Si la aplicación no lo conecta, no hay línea de actividad. */
  @Input() actividad: boolean = false;

  /** Textos ya traducidos al idioma activo. */
  @Input() etiquetaUsuario: string = 'Usuario';
  @Input() etiquetaEstacionTrabajo: string = 'Estacion trabajo';
  @Input() etiquetaEmpresa: string = 'Empresa';
  @Input() etiquetaDisplay: string = 'Display';
  @Input() textoDesarrolladoPor: string = 'Desarrollado por';
  @Input() etiquetaMostrar: string = 'Mostrar la barra de estado';
  @Input() etiquetaAutoOcultar: string = 'Auto-ocultar la barra de estado';
  @Input() etiquetaFijar: string = 'Fijar la barra de estado';

  /** En modo auto: `true` mientras la barra está desplegada. En modo fija no se usa. */
  readonly abierta = signal(false);
  private temporizadorCierre?: ReturnType<typeof setTimeout>;

  constructor(private host: ElementRef<HTMLElement>) {}

  get fija(): boolean {
    return this.modo === 'fija';
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizadorCierre);
  }

  abrir(): void {
    clearTimeout(this.temporizadorCierre);
    this.abierta.set(true);
  }

  programarCierre(): void {
    clearTimeout(this.temporizadorCierre);
    this.temporizadorCierre = setTimeout(() => this.abierta.set(false), RETARDO_CIERRE_MS);
  }

  cerrar(): void {
    clearTimeout(this.temporizadorCierre);
    this.abierta.set(false);
  }

  /** Con el teclado, la barra se pliega cuando el foco sale de ella (no mientras se mueve dentro). */
  alPerderFoco(evento: FocusEvent): void {
    const destino = evento.relatedTarget as Node | null;
    if (!destino || !this.host.nativeElement.contains(destino)) this.programarCierre();
  }

  /** En táctil no hay «mouse fuera»: un toque en cualquier otro lugar pliega la barra. */
  @HostListener('document:pointerdown', ['$event'])
  alTocarFuera(evento: PointerEvent): void {
    if (this.fija || !this.abierta()) return;
    if (!this.host.nativeElement.contains(evento.target as Node)) this.cerrar();
  }

  /**
   * La pestaña que asoma con la barra plegada. Con mouse solo abre (el hover ya la abrió, y un
   * clic no debe cerrarla bajo el cursor); en táctil alterna, porque ahí no hay «mouse fuera».
   */
  alTocarPestana(evento: MouseEvent): void {
    const tactil = (evento as PointerEvent).pointerType === 'touch';
    if (tactil && this.abierta()) this.cerrar();
    else this.abrir();
  }

  /** La chincheta pide el cambio de modo; si pasa a auto, la barra sigue abierta hasta que el mouse salga. */
  alternarModo(): void {
    const nuevo: ModoBarraEstado = this.fija ? 'auto' : 'fija';
    this.modoChange.emit(nuevo);
    if (nuevo === 'auto') this.abrir();
  }
}
```

### 3.4 `barra-estado.component.html`

```html
<footer
  [class]="fija ? 'relative px-4 pb-2 sm:px-8 sm:pb-3' : 'pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-2 sm:px-8'"
  (focusin)="abrir()"
  (focusout)="alPerderFoco($event)"
  (keydown.escape)="cerrar()"
>
  @if (!fija) {
    <!-- Zona sensible de 10 px en el borde: la franja plegada sola es muy difícil de acertar -->
    <div
      class="pointer-events-auto absolute inset-x-0 bottom-0 h-2.5"
      aria-hidden="true"
      (mouseenter)="abrir()"
      (mouseleave)="programarCierre()"
    ></div>
  }

  <!-- En auto, la pestaña y la barra se mueven juntas: plegada, asoman la pestaña y la franja -->
  <div [class]="fija ? '' : 'pointer-events-none barra-auto' + (abierta() ? '' : ' barra-auto--plegada')">
    @if (!fija) {
      <button
        type="button"
        class="bg-gradient-to-br from-[#1a365d] to-[#2c5282] dark:from-[#061b3c] dark:to-[#34495e] pointer-events-auto mx-auto flex h-[18px] w-14 items-center justify-center rounded-t-md text-white/85 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        [attr.aria-expanded]="abierta()"
        [attr.aria-label]="etiquetaMostrar"
        (click)="alTocarPestana($event)"
        (mouseenter)="abrir()"
        (mouseleave)="programarCierre()"
      >
        <i class="fa-solid fa-chevron-up text-[10px] transition-transform duration-200" [class.rotate-180]="abierta()" aria-hidden="true"></i>
      </button>
    }

    <div
      [class]="'bg-gradient-to-br from-[#1a365d] to-[#2c5282] dark:from-[#061b3c] dark:to-[#34495e] relative flex flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden rounded-md px-3 py-1.5 text-white select-none' + (fija ? '' : ' pointer-events-auto')"
      [attr.aria-busy]="actividad"
      (mouseenter)="abrir()"
      (mouseleave)="programarCierre()"
    >
      <!-- Línea de actividad (OPCIONAL): también se ve con la barra plegada, es lo que asoma de ella -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-[3px] overflow-hidden" aria-hidden="true">
        @if (actividad) {
          <span class="luz-actividad"></span>
        }
      </div>

      <ul class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm">
        <li class="flex min-w-0 items-center gap-1.5">
          <i class="fa-solid fa-user text-xs" aria-hidden="true"></i>
          <span class="truncate">
            <span class="sr-only md:not-sr-only">{{ etiquetaUsuario }}: </span>
            <strong>{{ usuario }}</strong>
          </span>
        </li>

        <li class="flex min-w-0 items-center gap-1.5 border-white/20 md:border-l md:pl-3">
          <i class="fa-solid fa-location-dot text-xs" aria-hidden="true"></i>
          <span class="truncate">
            <span class="sr-only md:not-sr-only">{{ etiquetaEstacionTrabajo }}: </span>
            <strong>{{ estacionTrabajo }}</strong>
          </span>
        </li>

        <li class="flex min-w-0 items-center gap-1.5 border-white/20 md:border-l md:pl-3">
          <i class="fa-solid fa-building text-xs" aria-hidden="true"></i>
          <span class="truncate">
            <span class="sr-only md:not-sr-only">{{ etiquetaEmpresa }}: </span>
            <strong>{{ empresa }}</strong>
          </span>
        </li>

        @if (display) {
          <li class="flex min-w-0 items-center gap-1.5 border-white/20 md:border-l md:pl-3">
            <i class="fa-solid fa-desktop text-xs" aria-hidden="true"></i>
            <span class="truncate">
              <span class="sr-only md:not-sr-only">{{ etiquetaDisplay }}: </span>
              <strong>{{ display }}</strong>
            </span>
          </li>
        }
      </ul>

      <div
        class="flex w-full items-center justify-between gap-3 text-[11px] text-white/75 sm:ml-auto sm:w-auto sm:justify-end sm:text-xs"
      >
        <p class="truncate">2024, {{ textoDesarrolladoPor }} {{ empresaDesarrolladora }}.</p>

        <app-version-badge [version]="version"></app-version-badge>

        <button
          type="button"
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/80 hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          [attr.aria-pressed]="fija"
          [attr.aria-label]="fija ? etiquetaAutoOcultar : etiquetaFijar"
          [title]="fija ? etiquetaAutoOcultar : etiquetaFijar"
          (click)="alternarModo()"
        >
          <i
            class="fa-solid fa-thumbtack text-xs"
            [class.rotate-45]="!fija"
            [class.opacity-60]="!fija"
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </div>
  </div>
</footer>
```

Los degradados van como clases de Tailwind: claro (`from-… to-…`) y oscuro (`dark:from-… dark:to-…`), en la barra y en la pestaña.

### 3.5 `barra-estado.component.css`

```css
/* Modo auto-ocultar: la pestaña (18 px) y la barra bajan juntas hasta dejar visibles 22 px: la
   pestaña más una franja de 4 px (la línea de actividad y un hilo del degradado). El 100% es el
   alto del conjunto; el +8 px del margen inferior (pb-2) del contenedor fijo ya está descontado. */
.barra-auto {
  transition: transform 200ms ease;
}

.barra-auto--plegada {
  transform: translateY(calc(100% - 14px));
}

/* Línea de actividad (opcional): una luz que recorre el borde superior mientras hay peticiones en curso */
.luz-actividad {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 30%;
  border-radius: 2px;
  background: rgb(255 255 255 / 0.85);
  animation: luz-actividad 1.1s linear infinite;
}

@keyframes luz-actividad {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(333%);
  }
}

/* Con «reducir movimiento»: sin deslizamiento, una línea fija y tenue */
@media (prefers-reduced-motion: reduce) {
  .barra-auto {
    transition: none;
  }

  .luz-actividad {
    animation: none;
    width: 100%;
    opacity: 0.6;
  }
}
```

### 3.6 `version-badge` (insignia de versión)

```ts
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-version-badge',
    templateUrl: './version-badge.component.html',
    styleUrl: './version-badge.component.css',
    standalone: true
})
export class VersionBadgeComponent {
  /** Versión de la aplicación, ya con prefijo (ej. v1.0.0). */
  @Input() version: string = '';
}
```

```html
<span
  class="inline-flex min-w-[3.5rem] items-center justify-center rounded bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white sm:text-xs"
>{{ version }}</span>
```

La insignia es solo para ir **dentro de la barra** (blanco translúcido sobre el degradado). En Business la insignia es un botón que copia la versión y muestra el detalle del API; esa función es propia de la aplicación y queda fuera del estándar.

### 3.7 Uso

```html
<app-barra-estado
  [usuario]="usuario"
  [estacionTrabajo]="estacionTrabajo"
  [empresa]="empresa"
  empresaDesarrolladora="Mi Empresa S.A"
  version="v1.0.0"
  [(modo)]="modoBarra"
  etiquetaUsuario="Usuario"
  etiquetaEstacionTrabajo="Estacion trabajo"
  etiquetaEmpresa="Empresa"
>
</app-barra-estado>
```

Con la línea de actividad (opcional) y el display:

```html
<app-barra-estado
  ...
  [display]="displayAlterno"
  [actividad]="hayPeticionesEnCurso"
></app-barra-estado>
```

```ts
import { BarraEstadoComponent } from './barra-estado/barra-estado.component';

@Component({
  // ...
  imports: [BarraEstadoComponent],
})
```

`modoBarra` es la preferencia del usuario que la aplicación lee y guarda (ver [§2.3](#23-preferencia-del-usuario)). Las etiquetas pueden omitirse si la aplicación está en español. Con traducciones, pasar el texto ya traducido (por ejemplo `[etiquetaUsuario]="'barra.usuario' | translate"`).

---

## 4. Implementación 2 — Angular + CSS puro (sin Tailwind)

Para proyectos sin Tailwind, con Tailwind 4 o con el preflight desactivado. **El resultado es idéntico** al de la Implementación 1: cada regla CSS es la que Tailwind 3.4 genera para la clase original (indicada en los comentarios del CSS). Cambian tres cosas:

| Cambio | Detalle |
|---|---|
| Clases | Las utilidades de Tailwind se sustituyen por clases `be__*` (barra de estado) y `vb` (versión) |
| Degradado | Las clases `from-… to-…` pasan a `background-image: linear-gradient(to bottom right, …)` en `.be__barra` y `.be__pestana`, con su variante oscura |
| Modo oscuro | `dark:` de Tailwind pasa a `:host-context(.dark)` (con la encapsulación de estilos de Angular). Sigue activándose con la clase `dark` en `<html>` |

### 4.1 `barra-estado.component.ts`

**Idéntico** al de la [§3.3](#33-barra-estadocomponentts).

### 4.2 `barra-estado.component.html`

```html
<footer
  [class]="fija ? 'be be--fija' : 'be be--auto'"
  (focusin)="abrir()"
  (focusout)="alPerderFoco($event)"
  (keydown.escape)="cerrar()"
>
  @if (!fija) {
    <!-- Zona sensible de 10 px en el borde inferior -->
    <div
      class="be__zona"
      aria-hidden="true"
      (mouseenter)="abrir()"
      (mouseleave)="programarCierre()"
    ></div>
  }

  <!-- En auto, la pestaña y la barra se mueven juntas -->
  <div [class]="fija ? '' : 'be__conjunto' + (abierta() ? '' : ' be__conjunto--plegado')">
    @if (!fija) {
      <button
        type="button"
        class="be__pestana"
        [attr.aria-expanded]="abierta()"
        [attr.aria-label]="etiquetaMostrar"
        (click)="alTocarPestana($event)"
        (mouseenter)="abrir()"
        (mouseleave)="programarCierre()"
      >
        <i class="fa-solid fa-chevron-up be__chevron" [class.be__chevron--abierto]="abierta()" aria-hidden="true"></i>
      </button>
    }

    <div
      class="be__barra"
      [attr.aria-busy]="actividad"
      (mouseenter)="abrir()"
      (mouseleave)="programarCierre()"
    >
      <!-- Línea de actividad (OPCIONAL) -->
      <div class="be__actividad" aria-hidden="true">
        @if (actividad) {
          <span class="be__luz"></span>
        }
      </div>

      <ul class="be__datos">
        <li class="be__dato">
          <i class="fa-solid fa-user be__icono" aria-hidden="true"></i>
          <span class="be__texto">
            <span class="be__etiqueta">{{ etiquetaUsuario }}: </span>
            <strong>{{ usuario }}</strong>
          </span>
        </li>

        <li class="be__dato be__dato--sep">
          <i class="fa-solid fa-location-dot be__icono" aria-hidden="true"></i>
          <span class="be__texto">
            <span class="be__etiqueta">{{ etiquetaEstacionTrabajo }}: </span>
            <strong>{{ estacionTrabajo }}</strong>
          </span>
        </li>

        <li class="be__dato be__dato--sep">
          <i class="fa-solid fa-building be__icono" aria-hidden="true"></i>
          <span class="be__texto">
            <span class="be__etiqueta">{{ etiquetaEmpresa }}: </span>
            <strong>{{ empresa }}</strong>
          </span>
        </li>

        @if (display) {
          <li class="be__dato be__dato--sep">
            <i class="fa-solid fa-desktop be__icono" aria-hidden="true"></i>
            <span class="be__texto">
              <span class="be__etiqueta">{{ etiquetaDisplay }}: </span>
              <strong>{{ display }}</strong>
            </span>
          </li>
        }
      </ul>

      <div class="be__derecha">
        <p class="be__firma">2024, {{ textoDesarrolladoPor }} {{ empresaDesarrolladora }}.</p>

        <app-version-badge [version]="version"></app-version-badge>

        <button
          type="button"
          class="be__chincheta"
          [attr.aria-pressed]="fija"
          [attr.aria-label]="fija ? etiquetaAutoOcultar : etiquetaFijar"
          [title]="fija ? etiquetaAutoOcultar : etiquetaFijar"
          (click)="alternarModo()"
        >
          <i class="fa-solid fa-thumbtack be__icono-chincheta" [class.be__icono-chincheta--suelta]="!fija" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </div>
</footer>
```

### 4.3 `barra-estado.component.css`

```css
/* ==========================================================================
   Equivalencia exacta de las utilidades de Tailwind CSS 3.4 que usa la versión
   original de la barra de estado. No agregar ni quitar propiedades: cualquier
   diferencia rompe la igualdad con las demás implementaciones del estándar.

   Requiere Font Awesome 6 (clases `fa-solid fa-user | fa-location-dot | fa-building |
   fa-desktop | fa-chevron-up | fa-thumbtack`). Hereda la fuente de la aplicación.
   Modo oscuro: se activa con la clase `dark` en un ancestro (normalmente <html>),
   igual que `darkMode: 'class'` de Tailwind. `:host-context(.dark)` es la forma de
   escribirlo con encapsulación de estilos de Angular; fuera de Angular usar `.dark`.
   ========================================================================== */

/* Regla base de Tailwind (preflight): *, ::before, ::after { box-sizing: border-box }, limitada a la barra */
.be,
.be *,
.be *::before,
.be *::after {
  box-sizing: border-box;
}

/* Modo fija: relative px-4 pb-2 sm:px-8 sm:pb-3  (+ línea de texto heredada de la página, Tailwind: html { line-height: 1.5 }) */
.be--fija {
  position: relative;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 0.5rem;
  line-height: 1.5;
}

/* Modo auto: pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-2 sm:px-8 */
.be--auto {
  pointer-events: none;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 0.5rem;
  line-height: 1.5;
}

/* Zona sensible: pointer-events-auto absolute inset-x-0 bottom-0 h-2.5 */
.be__zona {
  pointer-events: auto;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.625rem;
}

/* Conjunto pestaña + barra (solo auto): pointer-events-none + animación de plegado.
   La pestaña (18 px) y la barra bajan juntas hasta dejar visibles 22 px: la pestaña más una
   franja de 4 px. El 100% es el alto del conjunto; el +8 px del relleno inferior ya está descontado. */
.be__conjunto {
  pointer-events: none;
  transition: transform 200ms ease;
}

.be__conjunto--plegado {
  transform: translateY(calc(100% - 14px));
}

/* Pestaña: bg-gradient-to-br from-[#1a365d] to-[#2c5282] dark:from-[#061b3c] dark:to-[#34495e]
   pointer-events-auto mx-auto flex h-[18px] w-14 items-center justify-center rounded-t-md
   text-white/85 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white
   (+ regla base de Tailwind para <button>: sin fondo, borde ni relleno propios) */
.be__pestana {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 18px;
  margin-left: auto;
  margin-right: auto;
  padding: 0;
  border: 0 solid;
  border-top-left-radius: 0.375rem;
  border-top-right-radius: 0.375rem;
  background-image: linear-gradient(to bottom right, #1a365d, #2c5282);
  background-color: transparent;
  color: rgb(255 255 255 / 0.85);
  font: inherit;
  cursor: pointer;
  -webkit-appearance: button;
  appearance: button;
}

.be__pestana:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.be__pestana:hover {
  color: rgb(255 255 255);
}

.be__pestana:focus-visible {
  box-shadow: 0 0 0 2px rgb(255 255 255);
}

/* text-[10px] transition-transform duration-200  (rotate-180 con la barra abierta) */
.be__chevron {
  font-size: 10px;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.be__chevron--abierto {
  transform: rotate(180deg);
}

/* Barra con degradado azul (claro por defecto, oscuro con la clase `dark`):
   bg-gradient-to-br from-[#1a365d] to-[#2c5282] dark:from-[#061b3c] dark:to-[#34495e] relative flex flex-wrap
   items-center gap-x-4 gap-y-1 overflow-hidden rounded-md px-3 py-1.5 text-white select-none
   (+ pointer-events-auto en modo auto) */
.be__barra {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 1rem;
  row-gap: 0.25rem;
  overflow: hidden;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  background-image: linear-gradient(to bottom right, #1a365d, #2c5282);
  color: rgb(255 255 255);
  -webkit-user-select: none;
  user-select: none;
}

.be--auto .be__barra {
  pointer-events: auto;
}

/* Línea de actividad (OPCIONAL): pointer-events-none absolute inset-x-0 top-0 h-[3px] overflow-hidden */
.be__actividad {
  pointer-events: none;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  overflow: hidden;
}

.be__luz {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 30%;
  border-radius: 2px;
  background: rgb(255 255 255 / 0.85);
  animation: be-luz 1.1s linear infinite;
}

@keyframes be-luz {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(333%);
  }
}

/* Datos: flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm
   (+ regla base de Tailwind: ul { list-style: none; margin: 0; padding: 0 }) */
.be__datos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-width: 0;
  column-gap: 0.75rem;
  row-gap: 0.125rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.75rem;
  line-height: 1rem;
}

/* flex min-w-0 items-center gap-1.5 */
.be__dato {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 0.375rem;
}

/* border-white/20 (+ md:border-l md:pl-3, abajo) */
.be__dato--sep {
  border-color: rgb(255 255 255 / 0.2);
}

/* text-xs */
.be__icono {
  font-size: 0.75rem;
  line-height: 1rem;
}

/* truncate */
.be__texto {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* sr-only (por debajo de md; md:not-sr-only, abajo) */
.be__etiqueta {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Regla base de Tailwind: strong { font-weight: bolder } */
.be strong {
  font-weight: bolder;
}

/* Firma, versión y chincheta:
   flex w-full items-center justify-between gap-3 text-[11px] text-white/75 sm:ml-auto sm:w-auto sm:justify-end sm:text-xs */
.be__derecha {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.75rem;
  font-size: 11px;
  color: rgb(255 255 255 / 0.75);
}

/* truncate  (+ regla base de Tailwind: p { margin: 0 }) */
.be__firma {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Chincheta: flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/80 hover:bg-white/15
   hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white */
.be__chincheta {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 0 solid;
  border-radius: 0.25rem;
  background-color: transparent;
  color: rgb(255 255 255 / 0.8);
  font: inherit;
  cursor: pointer;
  -webkit-appearance: button;
  appearance: button;
}

.be__chincheta:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.be__chincheta:hover {
  background-color: rgb(255 255 255 / 0.15);
  color: rgb(255 255 255);
}

.be__chincheta:focus-visible {
  box-shadow: 0 0 0 2px rgb(255 255 255);
}

/* text-xs  (rotate-45 opacity-60 con la barra en modo auto) */
.be__icono-chincheta {
  font-size: 0.75rem;
  line-height: 1rem;
}

.be__icono-chincheta--suelta {
  transform: rotate(45deg);
  opacity: 0.6;
}

/* Modo oscuro */
:host-context(.dark) .be__barra {
  background-image: linear-gradient(to bottom right, #061b3c, #34495e);
}

:host-context(.dark) .be__pestana {
  background-image: linear-gradient(to bottom right, #061b3c, #34495e);
}

/* sm: ≥ 640px — sm:px-8 sm:pb-3, text-sm, sm:ml-auto sm:w-auto sm:justify-end sm:text-xs */
@media (min-width: 640px) {
  .be--fija,
  .be--auto {
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .be--fija {
    padding-bottom: 0.75rem;
  }

  .be__datos {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .be__derecha {
    justify-content: flex-end;
    width: auto;
    margin-left: auto;
    font-size: 0.75rem;
    line-height: 1rem;
  }
}

/* md: ≥ 768px — md:not-sr-only (etiquetas visibles), md:border-l md:pl-3 (separadores) */
@media (min-width: 768px) {
  .be__etiqueta {
    position: static;
    width: auto;
    height: auto;
    padding: 0;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }

  .be__dato--sep {
    border-left: 1px solid rgb(255 255 255 / 0.2);
    padding-left: 0.75rem;
  }
}

/* Con «reducir movimiento»: sin deslizamiento, una línea de actividad fija y tenue */
@media (prefers-reduced-motion: reduce) {
  .be__conjunto {
    transition: none;
  }

  .be__luz {
    animation: none;
    width: 100%;
    opacity: 0.6;
  }
}
```

### 4.4 Verificación de la equivalencia

Se montaron **dos versiones lado a lado** en un navegador (Chromium, sin ventana) con la misma fuente y el mismo Font Awesome: la Implementación 1 (con el CSS que genera Tailwind 3.4 a partir de la propia plantilla de esta guía) y la Implementación 2 (con el CSS de la [§4.3](#43-barra-estadocomponentcss)). Las plantillas y el CSS se **extrajeron de este documento** para la prueba, de modo que lo que se verificó es exactamente lo que aquí está escrito. Se compararon el **estilo calculado y la posición y tamaño de cada elemento** de la barra.

| Variable | Valores probados |
|---|---|
| Ancho de pantalla | 375, 480, 639, 640, 767, 768, 1023, 1024, 1279, 1280 y 1536 px (incluye los dos lados de cada punto de quiebre) |
| Estado | Fija, auto-ocultar plegada y auto-ocultar abierta |
| Modo de color | Claro y oscuro |
| Línea de actividad | Sin ella y con ella (animación detenida en el mismo fotograma) |
| Display | Sin dato y con dato |
| Textos | Cortos y muy largos (para probar los puntos suspensivos y el salto de fila) |

**Resultado:** en las **48 combinaciones** de estado, color, actividad, display y textos, a los **11 anchos**, los **16 368 elementos** comparados quedaron con el mismo estilo calculado y la misma posición y tamaño. Quedan fuera de la comparación, por no tener efecto visual: `tab-size`, `text-size-adjust`, el resaltado táctil, el nombre de la animación y el estilo y color de los bordes de ancho 0 (reseteo global de Tailwind).

**No se comprobó automáticamente:** los estados `:hover` y `:focus-visible` (sus reglas se verificaron leyendo el CSS), la lógica de apertura y cierre del componente con mouse, teclado y toque (ver la [§6](#6-checklist-de-qa)) ni la comparación contra el componente de Business. La verificación de la 1.0.0 sí se hizo contra Business; la de la 2.0.0 se hizo entre las dos implementaciones del estándar.

Dos diferencias aparecieron durante la verificación y ya están corregidas en el CSS de esta guía: los botones necesitan `background-color: transparent` y `appearance: button` (los pone el preflight de Tailwind), y el contorno transparente de `focus:outline-none` solo aplica en `:focus`, no en reposo. Además, Font Awesome debe cargarse **antes** que las utilidades (requisito de la [§3.1](#31-requisitos)). Si se usa CSS puro fuera de Angular, cargar este CSS **después** de Font Awesome, y cambiar `:host-context(.dark)` por `.dark`.

### 4.5 `version-badge`

`version-badge.component.ts` y `version-badge.component.css` (vacío) son **idénticos** a los de la [§3.6](#36-version-badge-insignia-de-versión) y los archivos de la Implementación 1, salvo el HTML y el CSS:

```html
<span class="vb">{{ version }}</span>
```

```css
/* inline-flex min-w-[3.5rem] items-center justify-center rounded bg-white/15 px-2 py-0.5 text-[11px]
   font-medium text-white sm:text-xs  (equivalencia exacta de Tailwind CSS 3.4) */
.vb {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background-color: rgb(255 255 255 / 0.15);
  color: rgb(255 255 255);
  font-size: 11px;
  font-weight: 500;
}

@media (min-width: 640px) {
  .vb {
    font-size: 0.75rem;
    line-height: 1rem;
  }
}
```

> En esta implementación, `version-badge.component.css` **sí lleva estos estilos** (en la Implementación 1 estaba vacío).

### 4.6 Tabla de equivalencias

| Clase Tailwind | CSS puro |
|---|---|
| `relative px-4 pb-2 sm:px-8 sm:pb-3` (modo fija) | `position: relative; padding-left/right: 1rem → 2rem; padding-bottom: 0.5rem → 0.75rem` |
| `pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-2 sm:px-8` (modo auto) | `pointer-events: none; position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; padding-left/right: 1rem → 2rem; padding-bottom: 0.5rem` |
| `pointer-events-auto absolute inset-x-0 bottom-0 h-2.5` | `pointer-events: auto; position: absolute; left: 0; right: 0; bottom: 0; height: 0.625rem` |
| `bg-gradient-to-br from-[#1a365d] to-[#2c5282]` | `background-image: linear-gradient(to bottom right, #1a365d, #2c5282)` |
| `dark:from-[#061b3c] dark:to-[#34495e]` | `background-image: linear-gradient(to bottom right, #061b3c, #34495e)` con `.dark` |
| `mx-auto flex h-[18px] w-14 items-center justify-center rounded-t-md` | `margin-left/right: auto; display: flex; height: 18px; width: 3.5rem; align-items: center; justify-content: center; border-top-left/right-radius: 0.375rem` |
| `text-white/85 hover:text-white` | `color: rgb(255 255 255 / 0.85)` · `:hover` `rgb(255 255 255)` |
| `focus:outline-none focus-visible:ring-2 focus-visible:ring-white` | `:focus` `outline: 2px solid transparent; outline-offset: 2px` · `:focus-visible` `box-shadow: 0 0 0 2px rgb(255 255 255)` |
| `text-[10px] transition-transform duration-200` · `rotate-180` | `font-size: 10px; transition-property: transform; …; duration: 200ms` · `transform: rotate(180deg)` |
| `relative flex flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden rounded-md px-3 py-1.5` | `position: relative; display: flex; flex-wrap: wrap; align-items: center; column-gap: 1rem; row-gap: 0.25rem; overflow: hidden; border-radius: 0.375rem; padding: 0.375rem 0.75rem` |
| `text-white select-none` | `color: rgb(255 255 255); user-select: none` |
| `pointer-events-none absolute inset-x-0 top-0 h-[3px] overflow-hidden` | `pointer-events: none; position: absolute; left: 0; right: 0; top: 0; height: 3px; overflow: hidden` |
| `flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm` | `display: flex; min-width: 0; flex-wrap: wrap; align-items: center; column-gap: 0.75rem; row-gap: 0.125rem; font-size: 0.75rem; line-height: 1rem` → `0.875rem / 1.25rem` |
| `flex min-w-0 items-center gap-1.5` | `display: flex; min-width: 0; align-items: center; gap: 0.375rem` |
| `border-white/20 md:border-l md:pl-3` | `border-color: rgb(255 255 255 / 0.2)` · desde 768 px `border-left: 1px solid; padding-left: 0.75rem` |
| `text-xs` (íconos) | `font-size: 0.75rem; line-height: 1rem` |
| `truncate` | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` |
| `sr-only md:not-sr-only` | Texto oculto visualmente (`position: absolute; width: 1px; height: 1px; clip: rect(0,0,0,0)…`) → desde 768 px `position: static; width: auto; height: auto; clip: auto…` |
| `flex w-full items-center justify-between gap-3 text-[11px] text-white/75` | `display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 0.75rem; font-size: 11px; color: rgb(255 255 255 / 0.75)` |
| `sm:ml-auto sm:w-auto sm:justify-end sm:text-xs` | desde 640 px `margin-left: auto; width: auto; justify-content: flex-end; font-size: 0.75rem; line-height: 1rem` |
| Chincheta: `flex h-6 w-6 shrink-0 items-center justify-center rounded` | `display: flex; height: 1.5rem; width: 1.5rem; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 0.25rem` |
| Chincheta: `text-white/80 hover:bg-white/15 hover:text-white` | `color: rgb(255 255 255 / 0.8)` · `:hover` `background-color: rgb(255 255 255 / 0.15); color: rgb(255 255 255)` |
| Ícono de chincheta: `rotate-45 opacity-60` | `transform: rotate(45deg); opacity: 0.6` |
| Insignia: `inline-flex min-w-[3.5rem] items-center justify-center rounded` | `display: inline-flex; min-width: 3.5rem; align-items: center; justify-content: center; border-radius: 0.25rem` |
| Insignia: `bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white sm:text-xs` | `background-color: rgb(255 255 255 / 0.15); padding: 0.125rem 0.5rem; font-size: 11px; font-weight: 500; color: rgb(255 255 255)` → desde 640 px `0.75rem / 1rem` |
| *(preflight)* `*, ::before, ::after` | `box-sizing: border-box` (limitado a `.be`) |
| *(preflight)* `p` · `ul` · `strong` · `button` | `margin: 0` · `list-style: none; margin: 0; padding: 0` · `font-weight: bolder` · `background-color: transparent; padding: 0; font: inherit; appearance: button` |

---

## 5. Reglas de uso

1. **Una sola barra por pantalla**, siempre como **última fila del layout**. No se repite dentro de componentes de una pantalla.
2. Los **datos salen de la sesión activa** (usuario, estación, empresa). No se escriben a mano ni se dejan datos de ejemplo.
3. El **color es siempre el degradado azul** (claro u oscuro según el modo). No se cambia por pantalla.
4. **No modificar** colores, tamaños, espacios ni la estructura en los proyectos. Si algo debe cambiar, se cambia en este estándar y en las dos implementaciones a la vez.
5. La barra es **informativa**: no muestra acciones de negocio. Sus únicos controles son la **chincheta** (cambia el modo) y la **pestaña** (abre la barra en modo auto-ocultar).
6. Las etiquetas y demás textos deben estar **traducidos** al idioma activo.
7. La **versión** debe actualizarse en cada publicación de la aplicación.
8. El **modo (`fija` / `auto`) lo decide el usuario**, nunca la pantalla, y se recuerda entre sesiones. Ninguna pantalla fuerza un modo.
9. El margen lateral de la barra es **el mismo del contenido**; la barra no lleva márgenes propios distintos a ese.
10. En modo auto-ocultar la barra tiene `z-index: 40`: debe quedar **por debajo de modales, paneles laterales y avisos**.
11. La **línea de actividad es opcional**. Si se conecta, que la fuente de actividad ignore las peticiones periódicas en segundo plano, y respetar los tiempos de la [§1.9](#19-línea-de-actividad-opcional).

---

## 6. Checklist de QA

- [ ] En modo **fija**, la barra está al fondo de la pantalla, debajo del contenido, sin taparlo, y mide **36 px** de alto en una fila (con datos cortos y desde 1024 px).
- [ ] No aparece una **segunda barra de desplazamiento** ni se corta contenido al pasar de fija a auto-ocultar y de vuelta (ver nota de la [§1.4](#14-contenedor-footer)).
- [ ] Se ven **usuario, estación de trabajo y empresa** de la sesión activa, con sus íconos; el display solo si tiene valor.
- [ ] Las etiquetas están en el idioma activo; desde 768 px se ven las etiquetas y los separadores, y por debajo solo ícono y valor.
- [ ] El degradado es **azul** en modo claro y en modo oscuro, y el texto es legible sobre ambos.
- [ ] Anchos 375, 640, 768 y 1280: la firma, la versión y la chincheta bajan a otra fila por debajo de 640 px y quedan a la derecha de la fila desde 640 px.
- [ ] Con textos muy largos no se rompe el diseño (puntos suspensivos o salto de fila).
- [ ] La **versión** mostrada es la de la aplicación publicada.
- [ ] La **chincheta** cambia entre fija y auto-ocultar, y su ícono gira 45° con opacidad reducida en modo auto. La preferencia **se recuerda** al recargar.
- [ ] En modo auto, la barra plegada deja visibles **22 px** (pestaña y franja) y la pestaña **se nota** sobre cualquier pantalla.
- [ ] En modo auto: se abre con el mouse sobre el borde inferior, con el teclado (Tab hasta la pestaña) y con un toque en la pestaña; se cierra con `Esc`, al sacar el mouse (350 ms) y al tocar fuera.
- [ ] En modo auto la barra queda **por debajo** de modales, paneles laterales y avisos, y no impide hacer clic en el contenido que tiene detrás.
- [ ] Con «reducir movimiento» activado no hay deslizamiento de la barra.
- [ ] Si se conectó la **línea de actividad**: aparece en peticiones de más de 150 ms, no parpadea con peticiones rápidas, se ve también con la barra plegada y con «reducir movimiento» es una línea fija tenue.
- [ ] Si **no** se conectó la línea de actividad, la barra se ve y funciona igual, sin errores.
- [ ] Se ve igual en todas las pantallas internas (mismo tamaño, color y posición).
- [ ] No aparece en login, en pantallas públicas ni en modales.

---

## 7. Observaciones de diseño

El estándar replica el diseño **tal cual**, incluidas estas particularidades. Si se decide corregir alguna, se corrige aquí y en las dos implementaciones, y se sube la versión del estándar.

| # | Observación | Efecto | Corrección sugerida (si se aprueba) |
|---|---|---|---|
| 1 | El año `2024` está escrito a mano | Se desactualiza | Calcularlo (`new Date().getFullYear()`) o recibirlo como dato |
| 2 | En modo auto-ocultar la barra abierta **flota sobre el contenido** (no lo empuja) | Tapa unos 40 px del final de la pantalla mientras está abierta (por ejemplo, la última fila de una tabla o los botones de un pie de formulario) | Es la contrapartida de no ocupar espacio. El usuario puede volver a «Fija» desde la propia barra |
| 3 | La firma y los textos del grupo derecho son blanco al 75 % con 11–12 px | Es el texto menos contrastado de la barra: **5,3:1** sobre el tramo más claro del degradado claro (#2C5282) y 6,1:1 sobre el del oscuro. Cumple 4,5:1, pero con poco margen en tamaño pequeño | Subir la opacidad a 85 % (6,3:1) si se detectan problemas de lectura |
| 4 | En pantallas de menos de 640 px la firma, la versión y la chincheta ocupan una **segunda fila** | La barra mide 56–60 px en vez de 36 px | Es intencional: el ancho no alcanza para todo en una fila |

---

## 8. Mantenimiento del estándar

### 8.1 Reglas

- **Versionado** [SemVer](https://semver.org/lang/es/): MAJOR = cambia el aspecto, MINOR = agrega opciones compatibles, PATCH = corrige sin cambiar el aspecto.
- Todo cambio se aplica a las **dos** implementaciones y a la [especificación](#1-especificación-visual) en el mismo cambio.
- Si cambia el color de la barra, se actualizan a la vez la [§1.11](#111-colores), las clases de Tailwind y el degradado del CSS puro (en la barra **y** en la pestaña).
- Cada equipo, al copiar la barra, anota en un comentario la versión del estándar usada (`// Estándar barra de estado v2.0.0`).

### 8.2 Migrar desde la 1.0.0

| Qué | Cambio |
|---|---|
| Estructura | Ya no hay un pie con copyright y versión debajo de la barra: la firma, la versión y la chincheta van **dentro de la misma barra**, a la derecha |
| `isMinimized` | **Se elimina**, junto con los márgenes `xl:mx-6` / `xl:mx-3` y la transición de márgenes. El margen lateral de la barra es el del contenido (16 / 32) |
| Nuevas entradas | `modo`, `display`, `actividad` (opcional), `etiquetaDisplay`, `textoDesarrolladoPor`, `etiquetaMostrar`, `etiquetaAutoOcultar`, `etiquetaFijar` |
| Nueva salida | `modoChange` |
| `NgClass` | Ya no se usa |
| «Desarrollado por» | Ya **se traduce** (antes era fijo). Se pasa en `textoDesarrolladoPor` |
| Nombre de la empresa en la firma | Ya es **texto**, no un enlace sin `href` |
| `backdrop-filter` del contenedor | Se elimina (no tenía efecto visible) |
| Insignia de versión | Pasa a blanco translúcido sobre el degradado, más pequeña; ya no tiene variante gris ni modo oscuro propio |
| Fuente del copyright | Ya no usa la fuente del sistema: hereda la de la aplicación |
| `barra-estado.component.css` (Impl. 1) | Deja de estar vacío: lleva las animaciones del plegado y de la línea de actividad |
| La aplicación | Debe **guardar la preferencia** del modo (clave `barraEstadoModo`) y, si tiene un panel de ajustes, ofrecer allí el selector ([§2.3](#23-preferencia-del-usuario)) |

### Historial

| Versión | Fecha | Cambios |
|---|---|---|
| 2.0.0 | 2026-11-20 | **Rediseño.** Barra de una sola fila (firma, versión y chincheta dentro de la barra; 36 px de alto en lugar de ≈ 136). Dos modos elegidos por el usuario: **fija** y **auto-ocultar** (flota al pie, con pestaña visible, zona sensible y apertura por mouse, teclado y toque). **Línea de actividad opcional** en el borde superior. Dato opcional `display`. Se elimina `isMinimized`. «Desarrollado por» pasa a traducirse. Textos nuevos en es, en, fr y de. Accesibilidad: `aria-expanded`, `aria-pressed`, `aria-busy`, `prefers-reduced-motion`. |
| 1.0.0 | 2026-10-16 | Primera versión. Diseño de la barra de estado del portal Business, con degradado azul: Angular + Tailwind y Angular + CSS puro (verificado contra Business). |
