# Estándar: Barra de estado

Barra fija al pie de las pantallas internas de la aplicación. Muestra, sobre un degradado azul, **quién está trabajando** (usuario, estación de trabajo y empresa) y, debajo, el **copyright y la versión** de la aplicación.

| | |
|---|---|
| **Versión** | 1.0.0 — 2026-10-16 |
| **Origen** | Componente `app-barra-estado` del portal *Business* (Angular 20 + Tailwind CSS 3.4) |
| **Implementaciones** | 1) Angular + Tailwind · 2) Angular + CSS puro |

> **Alcance.** Este documento describe **solo el diseño** de la barra: cómo se ve, cuánto mide, qué colores usa y cómo se comporta al cambiar el ancho de la pantalla. No incluye la lógica interna de Business (servicios de sesión, andamio de pantallas ni temas de color); esa lógica queda fuera del estándar.

Las dos implementaciones producen **exactamente el mismo resultado visual**, y ambas se verificaron automáticamente contra el componente de Business (ver [§4.4](#44-verificación-de-la-equivalencia)).

---

## Índice

1. [Especificación visual](#1-especificación-visual)
2. [Contenido y ubicación](#2-contenido-y-ubicación)
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

```
┌─ footer ───────────────────────────────────────────────────────────────────┐   ← padding vertical 16
│  ┌─ barra con degradado azul ───────────────────────────────────────────┐  │
│  │ 👤 Usuario: jmayen   📍 Estacion trabajo: CAJA 01   🏢 Empresa: ILGUA │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  2024, Desarrollado por Desarrollo Moderno de Software S.A.      [v4.15.1] │   ← pie
└─────────────────────────────────────────────────────────────────────────────┘
```

En pantallas angostas (< 640 px) los datos se alinean a la derecha y se parten en varias filas; el copyright y la versión se centran y, si no caben en una fila, la versión baja a la siguiente.

### 1.2 Puntos de quiebre

| Nombre | Desde | Qué cambia |
|---|---|---|
| (base) | 0 px | Relleno de la barra 12, espacio entre datos 4, cada dato con 4 de margen inferior, texto 12/16, datos alineados a la **derecha** y ocupando todo el ancho |
| `sm` | 640 px | Relleno de la barra 16, espacio entre datos 8, sin margen inferior, texto 14/20, datos alineados a la **izquierda** (ancho automático) |
| `md` | 768 px | Pie con copyright a la izquierda y versión a la derecha (antes, centrados); copyright 14 px con interlineado 1.5 |
| `xl` | 1280 px | Márgenes laterales de la barra y del pie según la barra lateral de la aplicación (si la tiene): **24** con la barra lateral expandida, **12** con la minimizada |

### 1.3 Contenedor (`footer`)

| Propiedad | Valor |
|---|---|
| Relleno | 16 arriba y 16 abajo (`py-4`) |
| Interlineado heredado | 1.5 |
| `backdrop-filter` | `blur(4px)` (sin efecto visible: el contenedor no tiene fondo propio) |

### 1.4 Barra con degradado

| Propiedad | Valor |
|---|---|
| Fondo | Degradado azul `to bottom right` (ver [§1.8](#18-colores)) |
| Color de texto | `#FFFFFF` |
| Relleno | 12 (base) · 16 (`sm`) |
| Margen superior | 8 |
| Margen horizontal | 0 (base) · 24 / 12 (`xl`, barra lateral expandida / minimizada) |
| Radio de borde | 6 |
| Selección de texto | Desactivada (`user-select: none`) |
| Disposición | Fila, con salto de línea, `justify-content: space-between`, centrada en vertical |
| Transición | `all 300ms cubic-bezier(0.4, 0, 0.2, 1)` (anima el cambio de márgenes al expandir/minimizar la barra lateral) |

**Cómo se reparte el degradado.** `to bottom right` de CSS no es una diagonal simple: el navegador ajusta el ángulo para que las otras dos esquinas (arriba-derecha y abajo-izquierda) caigan justo en el **50 %** del degradado. La esquina arriba-izquierda lleva el **primer** color y la abajo-derecha el **último**. Cualquier reimplementación (móvil nativo, PDF…) debe respetar esa regla; en una barra ancha, un degradado "de esquina a esquina" ingenuo se ve distinto.

### 1.5 Datos (usuario, estación, empresa)

Los tres datos van dentro de un **grupo** y tienen la misma estructura: ícono + `Etiqueta: **valor**`.

| Elemento | Propiedad | Valor |
|---|---|---|
| Grupo | Disposición | Fila con salto de línea; `justify-content: flex-end`; ancho 100 % (base) · automático (`sm`) |
| Grupo | Espacio entre datos (filas y columnas) | 4 (base) · 8 (`sm`) |
| Dato | Disposición | Fila, centrada en vertical, no se encoge |
| Dato | Margen inferior | 4 (base) · 0 (`sm`) |
| Ícono | Margen derecho | 4 |
| Ícono / texto | Tamaño de fuente / interlineado | 12 / 16 (base) · 14 / 20 (`sm`) |
| Texto | Overflow | Una línea, `overflow: hidden`, `text-overflow: ellipsis`, `max-width: 100%` |
| Valor | Peso de fuente | Negrita (`bolder`) |

Íconos (Font Awesome 6 Free, estilo *solid*):

| Dato | Clase |
|---|---|
| Usuario | `fa-user` |
| Estación de trabajo | `fa-location-dot` |
| Empresa | `fa-building` |

### 1.6 Pie (copyright y versión)

| Elemento | Propiedad | Valor |
|---|---|---|
| Pie | Disposición | Fila con salto de línea, centrada en vertical; `justify-content: center` (base) · `space-between` (`md`) |
| Pie | Espacio entre elementos | 12 |
| Pie | Relleno horizontal | 16 (base) · 24 / 12 (`xl`, barra lateral expandida / minimizada) |
| Pie | Margen superior | 16 |
| Copyright | Texto | `2024, Desarrollado por {empresa desarrolladora}.` |
| Copyright | Fuente | **Fuente del sistema** (`ui-sans-serif, system-ui, sans-serif, …`), no la de la aplicación |
| Copyright | Tamaño / interlineado | 12 px / 1.25 (base) · 14 px / 1.5 (`md`) |
| Copyright | Peso y color | 400 · `#374151` (claro) / `#9CA3AF` (oscuro) |
| Copyright | Overflow | Una línea con puntos suspensivos |
| Enlace (nombre de la empresa) | Color | Hereda el del texto; al pasar el mouse `#111827` (claro) / `#E5E7EB` (oscuro), con transición de color de 150 ms. No tiene `href`. |
| Insignia de versión | Fondo / texto | `#E5E7EB` / `#374151` (claro) · `#374151` / `#D1D5DB` (oscuro) |
| Insignia de versión | Relleno / radio | 4 vertical, 8 horizontal / 6 |
| Insignia de versión | Texto | 14 / 20, peso 500 |
| Insignia de versión | Sombra | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` |

### 1.7 Tipografía

La barra superior **hereda la fuente de la aplicación** (en Business, Roboto 16 px con interlineado 1.5). Solo el copyright usa la fuente del sistema (ver [observación 3](#7-observaciones-de-diseño)).

### 1.8 Colores

El degradado de la barra es **siempre azul**, con una variante para el modo oscuro. Los demás colores (texto, copyright, insignia) también tienen variante oscura; están en las tablas anteriores.

| Modo | Degradado (arriba-izquierda → abajo-derecha) | Clases Tailwind |
|---|---|---|
| Claro (por defecto) | `#1A365D` → `#2C5282` | `from-[#1a365d] to-[#2c5282]` |
| Oscuro | `#061B3C` → `#34495E` | `dark:from-[#061b3c] dark:to-[#34495e]` |

> **Nota — los temas de color son aparte.** En Business el usuario puede cambiar el tema visual de toda la aplicación y por eso, allí, el degradado de la barra puede ser de otro color (lo resuelve un servicio propio, `TemaVisualService`). **Esa lógica no forma parte de este estándar y no hace falta implementarla**: la barra del estándar usa siempre el degradado azul de la tabla.

### 1.9 Textos

Las etiquetas (`Usuario`, `Estacion trabajo`, `Empresa`) se pasan **ya traducidas** al idioma activo. Valores de referencia:

| Idioma | Usuario | Estación de trabajo | Empresa |
|---|---|---|---|
| es | Usuario | Estacion trabajo | Empresa |
| en | User | Workstation | Company |
| fr | Utilisateur | Poste de travail | Entreprise |
| de | Benutzer | Arbeitsstation | Unternehmen |

El texto `2024, Desarrollado por` es fijo y **no** se traduce.

---

## 2. Contenido y ubicación

### 2.1 Contenido

| Dato | Qué es |
|---|---|
| `usuario` | Usuario con sesión iniciada |
| `estacionTrabajo` | Descripción de la estación de trabajo seleccionada |
| `empresa` | Nombre de la empresa seleccionada |
| `empresaDesarrolladora` | Empresa desarrolladora, en el copyright (en Business: `Desarrollo Moderno de Software S.A`) |
| `version` | Versión de la aplicación, ya con prefijo (ej. `v4.15.1`) |
| `isMinimized` | Solo si la aplicación tiene barra lateral colapsable: `true` cuando está minimizada (cambia los márgenes desde 1280 px) |
| Etiquetas | Textos de las tres etiquetas, ya traducidos |

Si un dato no tiene valor, su etiqueta se muestra igual y el valor queda vacío.

### 2.2 Ubicación

Es la **última fila del layout** de la pantalla: debajo del contenido y alineada con él (si la aplicación tiene barra lateral, la barra queda a la derecha de esta, no debajo).

No va en: la pantalla de inicio de sesión (todavía no hay usuario, estación ni empresa), las pantallas públicas (kioscos, pantallas de TV, tickets) ni dentro de modales o paneles laterales.

---

## 3. Implementación 1 — Angular + Tailwind

Componente de presentación: recibe todo por `@Input` y no depende de servicios de la aplicación. Es el componente de Business sin su lógica interna; la apariencia es idéntica a la de Business con el tema azul.

### 3.1 Requisitos

| Requisito | Versión / condición | Si no se cumple |
|---|---|---|
| Angular | ≥ 17 (componente standalone, `styleUrl` en singular) | En Angular 14–16 cambiar `styleUrl: '…'` por `styleUrls: ['…']` |
| Tailwind CSS | **3.x** (probado con 3.4) con `darkMode: 'class'` | Con otra estrategia de modo oscuro o con Tailwind 4 no hay garantía de que se vea igual (no se probó). Usar la [Implementación 2](#4-implementación-2--angular--css-puro-sin-tailwind). |
| `content` de Tailwind | Debe incluir los `.html` de los componentes (ej. `"./src/**/*.{html,ts}"`) | Las clases no se generan y la barra queda **sin fondo** (texto blanco sobre blanco) |
| Preflight de Tailwind | Activo (por defecto) | Si está desactivado, cambian `box-sizing`, los márgenes del `<p>` y la lista. Usar la Implementación 2. |
| Font Awesome | 6.x, `fontawesome.css` + `solid.css` **importados antes** que Tailwind | Si se importa después, `.fa-solid { line-height: 1 }` pisa el `text-xs` del ícono y los íconos quedan más bajos. Ejemplo: `@import` al inicio de `styles.css`, antes de `@tailwind`. |
| Modo oscuro | Clase `dark` en `<html>` (o un ancestro) | Sin ella, la barra se ve siempre en modo claro |
| Fuente | La de la aplicación | La barra superior la hereda |

### 3.2 Archivos

```
barra-estado/
├── barra-estado.component.ts
├── barra-estado.component.html
└── barra-estado.component.css          ← vacío

version-badge/
├── version-badge.component.ts
├── version-badge.component.html
└── version-badge.component.css         ← vacío
```

### 3.3 `barra-estado.component.ts`

```ts
import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { VersionBadgeComponent } from '../version-badge/version-badge.component';

@Component({
    selector: 'app-barra-estado',
    templateUrl: './barra-estado.component.html',
    styleUrl: './barra-estado.component.css',
    standalone: true,
    imports: [NgClass, VersionBadgeComponent]
})
export class BarraEstadoComponent {
  @Input() usuario: string = '';
  @Input() estacionTrabajo: string = '';
  @Input() empresa: string = '';

  /** Empresa desarrolladora, en el copyright. */
  @Input() empresaDesarrolladora: string = '';

  /** Versión de la aplicación, ya con prefijo (ej. v1.0.0). */
  @Input() version: string = '';

  /** Solo si la aplicación tiene barra lateral colapsable: afecta los márgenes desde 1280 px. */
  @Input() isMinimized: boolean = false;

  /** Textos ya traducidos al idioma activo. */
  @Input() etiquetaUsuario: string = 'Usuario';
  @Input() etiquetaEstacionTrabajo: string = 'Estacion trabajo';
  @Input() etiquetaEmpresa: string = 'Empresa';
}
```

### 3.4 `barra-estado.component.html`

```html
<footer class="py-4 backdrop-blur-sm">
  <!-- Barra de estado: degradado azul (claro / oscuro) y márgenes según la barra lateral -->
  <div 
    [ngClass]="{
      'xl:mx-6': !isMinimized,
      'xl:mx-3': isMinimized
    }"
    class="bg-gradient-to-br from-[#1a365d] to-[#2c5282] dark:from-[#061b3c] dark:to-[#34495e] text-white p-3 sm:p-4 mt-2 rounded-md select-none flex flex-wrap justify-between items-center transition-all duration-300"
  >
    <div class="flex gap-1 sm:gap-2 flex-wrap justify-end w-full sm:w-auto">
      <div class="flex items-center flex-shrink-0 mb-1 sm:mb-0">
        <i class="fa-solid fa-user mr-1 text-xs sm:text-sm"></i>
        <span class="text-xs sm:text-sm truncate max-w-full overflow-hidden">
          {{ etiquetaUsuario }}: 
          <strong class="truncate">{{ usuario }}</strong>
        </span>
      </div>

      <div class="flex items-center flex-shrink-0 mb-1 sm:mb-0">
        <i class="fa-solid fa-location-dot mr-1 text-xs sm:text-sm"></i>
        <span class="text-xs sm:text-sm truncate max-w-full overflow-hidden">
          {{ etiquetaEstacionTrabajo }}: 
          <strong class="truncate">{{ estacionTrabajo }}</strong>
        </span>
      </div>

      <div class="flex items-center flex-shrink-0 mb-1 sm:mb-0">
        <i class="fa-solid fa-building mr-1 text-xs sm:text-sm"></i>
        <span class="text-xs sm:text-sm truncate max-w-full overflow-hidden">
          {{ etiquetaEmpresa }}: 
          <strong class="truncate">{{ empresa }}</strong>
        </span>
      </div>
    </div>
  </div>

  <!-- Pie: copyright y versión -->
  <div 
    [ngClass]="{
      'xl:px-6': !isMinimized,
      'xl:px-3': isMinimized
    }"
    class="flex w-full flex-wrap items-center justify-center gap-3 px-4 md:justify-between mt-4 transition-all duration-300"
  >
    <p 
      class="block antialiased font-sans text-xs md:text-sm leading-tight md:leading-normal font-normal text-gray-700 dark:text-gray-400 truncate"
    >
      2024, Desarrollado por 
      <a 
        target="_blank" 
        class="transition-colors hover:text-gray-900 dark:hover:text-gray-200"
      >{{ empresaDesarrolladora }}.</a>
    </p>

    <ul class="flex items-center gap-2 md:gap-4">
      <li>
        <app-version-badge [version]="version"></app-version-badge>
      </li>
    </ul>
  </div>
</footer>
```

Los degradados van como clases de Tailwind: claro (`from-… to-…`) y oscuro (`dark:from-… dark:to-…`). Los márgenes `xl:` dependen de `isMinimized`.

### 3.5 `barra-estado.component.css`

El archivo está **vacío** (todos los estilos son utilidades de Tailwind).

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
  class="inline-flex items-center px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md shadow-sm"
>
   {{ version }}
</span>
```

### 3.7 Uso

```html
<app-barra-estado
  [usuario]="usuario"
  [estacionTrabajo]="estacionTrabajo"
  [empresa]="empresa"
  empresaDesarrolladora="Mi Empresa S.A"
  version="v1.0.0"
  [isMinimized]="barraLateralMinimizada"
  etiquetaUsuario="Usuario"
  etiquetaEstacionTrabajo="Estacion trabajo"
  etiquetaEmpresa="Empresa"
>
</app-barra-estado>
```

```ts
import { BarraEstadoComponent } from './barra-estado/barra-estado.component';

@Component({
  // ...
  imports: [BarraEstadoComponent],
})
```

Las etiquetas pueden omitirse si la aplicación está en español. Con traducciones, pasar el texto ya traducido (por ejemplo `[etiquetaUsuario]="'barra.usuario' | translate"`).

---

## 4. Implementación 2 — Angular + CSS puro (sin Tailwind)

Para proyectos sin Tailwind, con Tailwind 4 o con el preflight desactivado. **El resultado es idéntico** al de la Implementación 1: cada regla CSS es la que Tailwind 3.4 genera para la clase original (indicada en los comentarios del CSS). Cambian tres cosas:

| Cambio | Detalle |
|---|---|
| Clases | Las utilidades de Tailwind se sustituyen por clases `be__*` (barra de estado) y `vb` (versión) |
| Degradado | Las clases `from-… to-…` pasan a `background-image: linear-gradient(to bottom right, …)` en `.be__barra`, con su variante oscura |
| Modo oscuro | `dark:` de Tailwind pasa a `:host-context(.dark)` (con la encapsulación de estilos de Angular). Sigue activándose con la clase `dark` en `<html>` |

### 4.1 `barra-estado.component.ts`

**Idéntico** al de la [§3.3](#33-barra-estadocomponentts).

### 4.2 `barra-estado.component.html`

```html
<footer class="be" [ngClass]="{ 'be--minimizada': isMinimized }">
  <!-- Barra de Estado -->
  <div class="be__barra">
    <div class="be__grupo">
      <div class="be__item">
        <i class="fa-solid fa-user be__icono"></i>
        <span class="be__texto">
          {{ etiquetaUsuario }}:
          <strong class="be__valor">{{ usuario }}</strong>
        </span>
      </div>

      <div class="be__item">
        <i class="fa-solid fa-location-dot be__icono"></i>
        <span class="be__texto">
          {{ etiquetaEstacionTrabajo }}:
          <strong class="be__valor">{{ estacionTrabajo }}</strong>
        </span>
      </div>

      <div class="be__item">
        <i class="fa-solid fa-building be__icono"></i>
        <span class="be__texto">
          {{ etiquetaEmpresa }}:
          <strong class="be__valor">{{ empresa }}</strong>
        </span>
      </div>
    </div>
  </div>

  <!-- Copyright -->
  <div class="be__pie">
    <p class="be__copy">
      2024, Desarrollado por
      <a
        target="_blank"
        class="be__enlace"
      >{{ empresaDesarrolladora }}.</a>
    </p>

    <ul class="be__lista">
      <li>
        <app-version-badge [version]="version"></app-version-badge>
      </li>
    </ul>
  </div>
</footer>
```

### 4.3 `barra-estado.component.css`

```css
/* ==========================================================================
   Equivalencia exacta de las utilidades de Tailwind CSS 3.4 que usa la versión
   original de la barra de estado. No agregar ni quitar propiedades: cualquier
   diferencia rompe la igualdad con las demás implementaciones del estándar.

   Requiere Font Awesome 6 (clases `fa-solid fa-user | fa-location-dot | fa-building`).
   Hereda la fuente de la aplicación (en Business, Roboto).
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

/* footer: py-4 backdrop-blur-sm  (+ línea de texto heredada de la página, Tailwind: html { line-height: 1.5 }) */
.be {
  padding-top: 1rem;
  padding-bottom: 1rem;
  line-height: 1.5;
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}

/* Barra con degradado azul (claro por defecto, oscuro con la clase `dark`):
   bg-gradient-to-br from-[#1a365d] to-[#2c5282] dark:from-[#061b3c] dark:to-[#34495e] text-white p-3 sm:p-4 mt-2 rounded-md select-none
   flex flex-wrap justify-between items-center transition-all duration-300
   + xl:mx-6 (barra lateral expandida) / xl:mx-3 (barra lateral minimizada) */
.be__barra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  background-image: linear-gradient(to bottom right, #1a365d, #2c5282);
  color: rgb(255 255 255);
  -webkit-user-select: none;
  user-select: none;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* flex gap-1 sm:gap-2 flex-wrap justify-end w-full sm:w-auto */
.be__grupo {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.25rem;
  width: 100%;
}

/* flex items-center flex-shrink-0 mb-1 sm:mb-0 */
.be__item {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  margin-bottom: 0.25rem;
}

/* mr-1 text-xs sm:text-sm */
.be__icono {
  margin-right: 0.25rem;
  font-size: 0.75rem;
  line-height: 1rem;
}

/* text-xs sm:text-sm truncate max-w-full overflow-hidden */
.be__texto {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  line-height: 1rem;
}

/* truncate  (+ regla base de Tailwind: strong { font-weight: bolder }) */
.be__valor {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: bolder;
}

/* Copyright: flex w-full flex-wrap items-center justify-center gap-3 px-4 md:justify-between mt-4
   transition-all duration-300 + xl:px-6 / xl:px-3 */
.be__pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  margin-top: 1rem;
  padding-left: 1rem;
  padding-right: 1rem;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* block antialiased font-sans text-xs md:text-sm leading-tight md:leading-normal font-normal
   text-gray-700 dark:text-gray-400 truncate */
.be__copy {
  display: block;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.25;
  color: rgb(55 65 81);
}

/* transition-colors hover:text-gray-900 dark:hover:text-gray-200
   (+ regla base de Tailwind: a { color: inherit; text-decoration: inherit }) */
.be__enlace {
  color: inherit;
  text-decoration: inherit;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.be__enlace:hover {
  color: rgb(17 24 39);
}

/* flex items-center gap-2 md:gap-4  (+ regla base de Tailwind: ul { list-style: none; margin: 0; padding: 0 }) */
.be__lista {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Modo oscuro */
:host-context(.dark) .be__barra {
  background-image: linear-gradient(to bottom right, #061b3c, #34495e);
}

:host-context(.dark) .be__copy {
  color: rgb(156 163 175);
}

:host-context(.dark) .be__enlace:hover {
  color: rgb(229 231 235);
}

/* sm: ≥ 640px  — p-4, gap-2, w-auto, mb-0, text-sm */
@media (min-width: 640px) {
  .be__barra {
    padding: 1rem;
  }

  .be__grupo {
    gap: 0.5rem;
    width: auto;
  }

  .be__item {
    margin-bottom: 0px;
  }

  .be__icono,
  .be__texto {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
}

/* md: ≥ 768px — justify-between, gap-4, text-sm, leading-normal */
@media (min-width: 768px) {
  .be__pie {
    justify-content: space-between;
  }

  .be__lista {
    gap: 1rem;
  }

  .be__copy {
    font-size: 0.875rem;
    line-height: 1.5;
  }
}

/* xl: ≥ 1280px — márgenes de la barra y del pie según la barra lateral */
@media (min-width: 1280px) {
  .be__barra {
    margin-left: 1.5rem;
    margin-right: 1.5rem;
  }

  .be__pie {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .be--minimizada .be__barra {
    margin-left: 0.75rem;
    margin-right: 0.75rem;
  }

  .be--minimizada .be__pie {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}
```

### 4.4 Verificación de la equivalencia

Se montaron **tres versiones lado a lado** en un navegador (Chromium) con la misma fuente y el mismo Font Awesome: el componente de Business con el tema azul, la Implementación 1 y la Implementación 2. Se compararon el **estilo calculado y la posición y tamaño de cada elemento** de la barra, en dos pares: *Business ↔ Implementación 1* y *Implementación 1 ↔ Implementación 2*.

| Variable | Valores probados |
|---|---|
| Ancho de pantalla | 375, 480, 639, 640, 767, 768, 1023, 1024, 1279, 1280 y 1536 px (incluye los dos lados de cada punto de quiebre) |
| Modo | Claro y oscuro |
| Barra lateral | Expandida y minimizada |
| Textos | Cortos y muy largos (para probar los puntos suspensivos y el salto de línea) |

**Resultado:** en las **88 configuraciones**, en ambos pares, los **1 936 elementos** comparados quedaron con el mismo estilo calculado y la misma posición y tamaño (cerca de 900 mil propiedades por par). Quedan fuera de la comparación, por no tener efecto visual: `tab-size`, `text-size-adjust`, el resaltado táctil, y el estilo y color de los bordes de ancho 0 (reseteo global de Tailwind).

No se comprobó automáticamente el estado `:hover` del enlace; sus dos colores se verificaron leyendo las reglas.

Dos diferencias aparecieron durante la verificación y ya están corregidas: faltaba `box-sizing: border-box` en todos los elementos de la barra, y Font Awesome debe cargarse **antes** que las utilidades (requisito de la [§3.1](#31-requisitos)). Si se usa CSS puro fuera de Angular, cargar este CSS **después** de Font Awesome, y cambiar `:host-context(.dark)` por `.dark`.

### 4.5 `version-badge`

`version-badge.component.ts` y `version-badge.component.css` (vacío) son **idénticos** a los de la [§3.6](#36-version-badge-insignia-de-versión) y los archivos de la Implementación 1, salvo el HTML y el CSS:

```html
<span class="vb">
   {{ version }}
</span>
```

```css
/* inline-flex items-center px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300
   bg-gray-200 dark:bg-gray-700 rounded-md shadow-sm  (equivalencia exacta de Tailwind CSS 3.4) */
.vb {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background-color: rgb(229 231 235);
  color: rgb(55 65 81);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

/* Modo oscuro (clase `dark` en un ancestro; fuera de Angular usar `.dark .vb`) */
:host-context(.dark) .vb {
  background-color: rgb(55 65 81);
  color: rgb(209 213 219);
}
```

> En esta implementación, `version-badge.component.css` **sí lleva estos estilos** (en la Implementación 1 estaba vacío).

### 4.6 Tabla de equivalencias

| Clase Tailwind | CSS puro |
|---|---|
| `py-4` (footer) | `padding-top/bottom: 1rem` |
| `backdrop-blur-sm` | `backdrop-filter: blur(4px)` |
| `bg-gradient-to-br from-[#1a365d] to-[#2c5282]` | `background-image: linear-gradient(to bottom right, #1a365d, #2c5282)` |
| `dark:from-[#061b3c] dark:to-[#34495e]` | `background-image: linear-gradient(to bottom right, #061b3c, #34495e)` con `.dark` |
| `text-white` | `color: rgb(255 255 255)` |
| `p-3` · `sm:p-4` | `padding: 0.75rem` · `1rem` |
| `mt-2` · `mt-4` | `margin-top: 0.5rem` · `1rem` |
| `rounded-md` | `border-radius: 0.375rem` |
| `select-none` | `user-select: none` |
| `flex flex-wrap justify-between items-center` | `display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center` |
| `transition-all duration-300` | `transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 300ms` |
| `xl:mx-6` / `xl:mx-3` | `margin-left/right: 1.5rem` / `0.75rem` (con `.be--minimizada`) |
| `gap-1 sm:gap-2` · `justify-end` · `w-full sm:w-auto` | `gap: 0.25rem` → `0.5rem` · `justify-content: flex-end` · `width: 100%` → `auto` |
| `flex-shrink-0 mb-1 sm:mb-0` | `flex-shrink: 0; margin-bottom: 0.25rem` → `0` |
| `mr-1 text-xs sm:text-sm` | `margin-right: 0.25rem; font-size: 0.75rem; line-height: 1rem` → `0.875rem / 1.25rem` |
| `truncate max-w-full overflow-hidden` | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%` |
| `flex w-full flex-wrap items-center justify-center gap-3 px-4 md:justify-between` | `display: flex; width: 100%; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.75rem; padding-left/right: 1rem` → `space-between` |
| `xl:px-6` / `xl:px-3` | `padding-left/right: 1.5rem` / `0.75rem` (con `.be--minimizada`) |
| `block antialiased font-sans font-normal` | `display: block; -webkit-font-smoothing: antialiased; font-family: ui-sans-serif, …; font-weight: 400` |
| `text-xs md:text-sm leading-tight md:leading-normal` | `font-size: 0.75rem; line-height: 1.25` → `0.875rem; 1.5` |
| `text-gray-700 dark:text-gray-400` | `color: rgb(55 65 81)` · oscuro `rgb(156 163 175)` |
| `transition-colors hover:text-gray-900 dark:hover:text-gray-200` | `transition-property: color, background-color, …; duration: 150ms` · `:hover` `rgb(17 24 39)` · oscuro `rgb(229 231 235)` |
| `flex items-center gap-2 md:gap-4` | `display: flex; align-items: center; gap: 0.5rem` → `1rem` |
| Insignia: `inline-flex items-center px-2 py-1 text-sm font-medium rounded-md shadow-sm` | `display: inline-flex; align-items: center; padding: 0.25rem 0.5rem; font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| Insignia: `text-gray-700 bg-gray-200` · `dark:text-gray-300 dark:bg-gray-700` | `color: rgb(55 65 81); background-color: rgb(229 231 235)` · oscuro `rgb(209 213 219)` / `rgb(55 65 81)` |
| *(preflight)* `*, ::before, ::after` | `box-sizing: border-box` (limitado a `.be`) |
| *(preflight)* `p` · `a` · `ul` · `strong` | `margin: 0` · `color: inherit; text-decoration: inherit` · `list-style: none; margin: 0; padding: 0` · `font-weight: bolder` |

---

## 5. Reglas de uso

1. **Una sola barra por pantalla**, siempre como **última fila del layout**. No se repite dentro de componentes de una pantalla.
2. Los **datos salen de la sesión activa** (usuario, estación, empresa). No se escriben a mano ni se dejan datos de ejemplo.
3. El **color es siempre el degradado azul** (claro u oscuro según el modo). No se cambia por pantalla.
4. **No modificar** colores, tamaños, espacios ni la estructura en los proyectos. Si algo debe cambiar, se cambia en este estándar y en las dos implementaciones a la vez.
5. La barra es **informativa**: no lleva botones, enlaces ni acciones.
6. Las etiquetas deben estar **traducidas** al idioma activo.
7. La **versión** debe actualizarse en cada publicación de la aplicación.
8. En aplicaciones con barra lateral colapsable, pasar `isMinimized` y mover el contenedor de la barra junto con el contenido (margen izquierdo con transición de 300 ms).

---

## 6. Checklist de QA

- [ ] La barra está **al fondo de la pantalla**, debajo del contenido, sin taparlo ni quedar flotando sobre él.
- [ ] Se ven **usuario, estación de trabajo y empresa** de la sesión activa, con sus íconos.
- [ ] Las etiquetas están en el idioma activo y `2024, Desarrollado por …` sigue fijo.
- [ ] El degradado es **azul** en modo claro y en modo oscuro, y el texto es legible sobre ambos.
- [ ] Con la barra lateral **expandida y minimizada** (ancho ≥ 1280) los márgenes laterales cambian con transición, sin saltos.
- [ ] Anchos 375, 640, 768 y 1280: los datos se alinean y se parten en filas como en la [§1.2](#12-puntos-de-quiebre).
- [ ] Con textos muy largos no se rompe el diseño (puntos suspensivos o salto de fila).
- [ ] La **versión** mostrada es la de la aplicación publicada.
- [ ] Se ve igual en todas las pantallas internas (mismo tamaño, color y posición).
- [ ] No aparece en login, en pantallas públicas ni en modales.

---

## 7. Observaciones de diseño

El estándar replica el diseño **tal cual**, incluidas estas particularidades. Si se decide corregir alguna, se corrige aquí y en las dos implementaciones, y se sube la versión del estándar.

| # | Observación | Efecto | Corrección sugerida (si se aprueba) |
|---|---|---|---|
| 1 | El año `2024` está escrito a mano | Se desactualiza | Calcularlo (`new Date().getFullYear()`) o recibirlo como dato |
| 2 | El nombre de la empresa es un `<a target="_blank">` **sin `href`** | No navega, no recibe foco con el teclado, pero cambia de color al pasar el mouse | Ponerle `href` real o convertirlo en `<span>` |
| 3 | El copyright usa `font-sans` (fuente del sistema) y la barra superior hereda la de la aplicación (Roboto) | Dos fuentes distintas en la misma barra | Quitar `font-sans` para que herede |
| 4 | `backdrop-blur-sm` en un contenedor sin fondo propio | Sin efecto visible | Quitarlo |
| 5 | En pantallas de menos de 640 px los datos se alinean a la derecha y desde 640 px a la izquierda (`justify-end` + `w-full sm:w-auto`) | Puede parecer inconsistente | Fijar una sola alineación |

---

## 8. Mantenimiento del estándar

- **Versionado** [SemVer](https://semver.org/lang/es/): MAJOR = cambia el aspecto, MINOR = agrega opciones compatibles, PATCH = corrige sin cambiar el aspecto.
- Todo cambio se aplica a las **dos** implementaciones y a la [especificación](#1-especificación-visual) en el mismo cambio.
- Si cambia el color de la barra, se actualizan a la vez la [§1.8](#18-colores), las clases de Tailwind y el degradado del CSS puro.
- Cada equipo, al copiar la barra, anota en un comentario la versión del estándar usada (`// Estándar barra de estado v1.0.0`).

### Historial

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0.0 | 2026-10-16 | Primera versión. Diseño de la barra de estado del portal Business, con degradado azul: Angular + Tailwind y Angular + CSS puro (verificado contra Business). |
