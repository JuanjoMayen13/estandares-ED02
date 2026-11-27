# Estándar: Pantalla de inicio

Pantalla a la que se llega después de iniciar sesión: tres zonas (aplicativos a la izquierda, lo del día al centro y preferencias a la derecha), paneles laterales que se expanden, compactan u ocultan, accesos rápidos a las pantallas más usadas, buscador de pantallas, atajos de teclado y una versión propia para celular. Esta carpeta describe el diseño y el comportamiento, y trae los componentes para copiar, en Tailwind y en CSS puro, más una demo para tenerlo siempre de referencia.

| | |
|---|---|
| **Versión** | 1.0.0 — 2026-11-24 |
| **Estado** | Especificación, contratos, las dos implementaciones, las traducciones y la demo listos ([§9](#9-demo)). Pendiente: compilar el código en un proyecto de prueba y comparar Tailwind con CSS puro |
| **Origen** | Pantalla de inicio del portal *Business* (Angular 20 + Tailwind CSS 3.4), ruta `/inicio` |
| **Implementaciones** | 1) [Angular + Tailwind](angular-tailwind/) · 2) [Angular + CSS puro](angular-css-puro/) (sin Tailwind) |
| **Adopción** | Por niveles: se puede tomar solo una parte ([§1.2](#12-niveles-de-adopción)) |
| **Demo** | [Ver en línea](https://juanjomayen13.github.io/estandares-ED02/angular/pantalla-inicio/demo/index.html) · [`demo/index.html`](demo/index.html): HTML, CSS y JS, sin instalar nada ([§9](#9-demo)) |

**No hace falta adoptarlo completo.** El estándar está dividido en cuatro niveles. Cada uno dice de qué depende, y las piezas de un nivel funcionan sin las de los niveles siguientes. Un proyecto puede empezar por la distribución y los accesos rápidos y sumar lo demás cuando le convenga.

**Qué fija el estándar:** cómo se ve cada pieza (colores, medidas, tipografía, animaciones) y cómo se comporta (estados, reglas por tamaño de pantalla, teclado, lo que se recuerda entre visitas).

**Qué no incluye:** la lógica propia de cada aplicación. De dónde salen los aplicativos y sus pantallas, cómo se navega a una pantalla, cómo se guarda la sesión, qué opciones tiene el panel de preferencias y cómo se detectan los cambios sin guardar los resuelve cada proyecto con su propia estructura. Los componentes reciben todo eso por entradas y avisan por salidas; lo que le toca a cada proyecto está marcado con `PROYECTO` ([§4](#4-contrato-de-los-componentes)).

---

## Índice

1. [Vista general](#1-vista-general)
2. [Especificación visual](#2-especificación-visual)
3. [Comportamiento](#3-comportamiento)
4. [Contrato de los componentes](#4-contrato-de-los-componentes)
5. [Contenido de la carpeta](#5-contenido-de-la-carpeta)
6. [Implementación 1 — Angular + Tailwind](#6-implementación-1--angular--tailwind)
7. [Implementación 2 — Angular + CSS puro (sin Tailwind)](#7-implementación-2--angular--css-puro-sin-tailwind)
8. [Traducciones](#8-traducciones)
9. [Demo](#9-demo)
10. [Checklist de QA](#10-checklist-de-qa)
11. [Observaciones conocidas del original](#11-observaciones-conocidas-del-original)
12. [Mantenimiento del estándar](#12-mantenimiento-del-estándar)

---

## 1. Vista general

### 1.1 Las tres zonas

**Pantallas grandes (desde 1536 px):** los dos paneles expandidos.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ [▣] EMPRESA S.A.        [🔍 Buscar pantalla…               Ctrl K]   [⤡]   (JM juan ▾)    │ header
├───────────────┬─────────────────────────────────────────────────────────┬────────────────┤
│ Módulos   👁 «│ ┌─────────────────────────────────────────────────────┐ │ ⚙ Preferencias »👁│
│ [🔍 Filtrar  ]│ │ (☀) Buenos días, juan              Sesión restante  │ │ TEMA           │
│───────────────│ │     Martes, 24 de noviembre        ▓▓▓▓▓▓▓▓░░ 3 h 20 │ │ [ ][ ][ ]      │
│ [CC] Cuentas 4│ │ ─────────────────────────────────────────────────── │ │ COLOR          │
│ [IN] Inventa 9│ │ [🕐 08:02]  [📍 Caja 1]  [🏢 Empresa S.A.]            │ │ ● ● ● ● ●      │
│   │ + Procesos│ └─────────────────────────────────────────────────────┘ │ ────────────── │
│   │ · Precios │ ┌ ⚡ Accesos rápidos ─────────────────────────────────┐ │ GESTIÓN        │
│ [RP] Reportes │ │ FIJADOS                                             │ │ [Exp ] [Imp ]  │
│               │ │ [📌 Depósitos       ✕]  [📌 Recibos         ✕]       │ │ [URL ] [Estac] │
│               │ │ RECIENTES                               Borrar      │ │ IDIOMA         │
│               │ │ [🕘 Precios         📌]                              │ │ [Español    ▾] │
│               │ └─────────────────────────────────────────────────────┘ │                │
│               │ [⧉ Conexión ············]  [⌨ Atajos ···············]   │                │
└───────────────┴─────────────────────────────────────────────────────────┴────────────────┘
   288 px                         crece y se encoge                            352 / 384 px
```

**Laptop (1280–1535 px):** módulos expandido y preferencias como **barra compacta** de 64 px. Cada ícono de una barra compacta abre su contenido en un panel flotante junto a la barra.

```
┌─────────────┬──────────────────────────────────────────────────────────────┬──┐
│ Módulos  👁 «│  (bienvenida, accesos rápidos y widgets ocupan el espacio)   │» │
│ …           │                                                              │☾ │
│             │                                                              │🎨│ ← barra compacta
│             │                                                              │文│
│             │                                                              │⚙ │
│             │                                                              │👁│
└─────────────┴──────────────────────────────────────────────────────────────┴──┘
```

**Celular (menos de 768 px):** sin paneles laterales. La bienvenida va en una línea, los accesos rápidos son una tira que se desliza de lado y una barra inferior lleva a los paneles, que se abren como capa encima del contenido.

```
┌──────────────────────────────┐
│ [▣]                (JM ▾)    │
├──────────────────────────────┤
│ ¡Feliz viernes, juan!        │
│ 📍 Caja 1                     │
│ Sesión restante ▓▓▓▓▓░ 3 h 20 │
│ ┌ ⚡ Accesos rápidos ───────┐ │
│ │ [📌 Depósitos ✕][📌 Rec… →│ │
│ └───────────────────────────┘ │
│ [⧉ Conexión ················] │
├──────────────────────────────┤
│   ⌂      ⊞       🔍      ⚙   │
│ Inicio Módulos Buscar Prefer.│
└──────────────────────────────┘
```

| Pieza | Qué es |
|---|---|
| Header | Logo y nombre de la empresa, buscador de pantallas, botón de vista limpia, botones para volver a mostrar un panel oculto y el menú del usuario |
| Panel de módulos (izquierda) | Los aplicativos del usuario en acordeón, cada uno con su árbol de pantallas, y un filtro que busca en todas las pantallas |
| Centro | Lo del día: tarjeta de bienvenida, accesos rápidos y una cuadrícula de widgets. Es lo único que crece al compactar u ocultar un panel |
| Panel de preferencias (derecha) | Un contenedor con secciones (en *Business*: tema, color, gestión de preferencias e idioma). Las secciones las pone cada proyecto |
| Tarjeta de bienvenida | Saludo con ícono del momento del día y la fecha, tiempo de sesión restante y etiquetas con la hora de inicio, la estación y la empresa |
| Accesos rápidos | Pantallas fijadas por el usuario (hasta 8) y abiertas hace poco (hasta 5), como tarjetas |
| Widgets | Tarjetas de información con la misma anatomía (encabezado y 4 filas), en una cuadrícula que se adapta al ancho del centro |
| Buscador | Ventana (Ctrl+K) que busca en todas las pantallas por nombre y ubicación |
| Barra inferior (celular) | Inicio, Módulos, Buscar y Preferencias, donde llega el pulgar |
| Avisos flotantes | «Deshacer» al quitar un fijado y el aviso de sesión por vencer |

### 1.2 Niveles de adopción

| Nivel | Incluye | Depende de | ¿Obligatorio para el siguiente? |
|---|---|---|---|
| **1. Base** | Distribución en tres zonas con los paneles **siempre expandidos**, header, tarjeta de bienvenida (saludo por hora del día, fecha, etiquetas), tiempo de sesión, accesos rápidos (fijar, quitar, borrar recientes), tarjeta de widget y cuadrícula | Tokens de color ([§2.1](#21-colores)) | Sí |
| **2. Paneles adaptables** | Tres estados por panel (expandido, compacto, oculto), paneles flotantes de la barra compacta, reglas por tamaño de pantalla, capas en tablet y celular, barra inferior en celular, tira horizontal de accesos | Nivel 1 | No |
| **3. Productividad** | Buscador (Ctrl+K), atajos de teclado y widget de atajos, vista limpia, «Deshacer» al quitar un fijado (con Ctrl+Z), deslizamiento de las tarjetas entre Fijados y Recientes | Nivel 1. Ctrl+B y la vista limpia necesitan el nivel 2 | No |
| **4. Detalles** (opcional) | Saludo según el contexto (regreso el mismo día, lunes, viernes), ambientación por temporada, aviso de sesión por vencer (con la versión «cambios sin guardar»), color de avatar por usuario | Nivel 1 | — |

Un proyecto que adopte un nivel debe cumplir **todas** sus reglas (visuales y de comportamiento). Dentro del nivel 4 cada pieza es independiente: se puede tomar, por ejemplo, solo el aviso de sesión.

---

## 2. Especificación visual

Valores reales del original (CSS generado por Tailwind 3.4 + el CSS propio de los componentes). Las clases entre comillas invertidas son las del original. Las medidas se dan en px con su equivalente de Tailwind cuando ayuda a ubicarlas.

### 2.1 Colores

**Tokens.** Toda la pantalla usa tokens semánticos: superficies, textos, bordes, marca y estados. Cambian solos entre claro y oscuro con la clase `dark` en `<html>`. Las superficies oscuras forman una escalera de cuatro niveles sólidos, cada uno más claro que el anterior: `page` → `surface` → `surface-raised` → `surface-overlay`.

| Token | Claro | Oscuro | Uso en el inicio |
|---|---|---|---|
| `page` | `#f9fafb` | `#0f1319` | Fondo de la pantalla |
| `surface` | `#ffffff` | `#171d26` | Header, paneles, tarjetas del centro, barra inferior |
| `surface-alt` | `#ffffff` | `#1f2835` | Botón del buscador y campo de filtro |
| `surface-raised` | `#f3f4f6` | `#1f2835` | Cajas dentro de una tarjeta: tarjetas de acceso, etiquetas, íconos de aplicativo, mosaicos; hover de filas |
| `surface-overlay` | `#ffffff` | `#283345` | Lo que flota: paneles flotantes, buscador, menú del usuario, «Deshacer» |
| `border` | `#d1d5db` | `#313f54` | Borde por defecto (`border`, botón secundario) |
| `border-subtle` | `#e5e7eb` | `#283345` | Bordes de tarjetas y paneles, divisores |
| `border-strong` | `#868e9c` | `#5d7194` | Controles: buscador del header, filtro, caja punteada de accesos vacíos |
| `text-primary` | `#111827` | `#f3f4f6` | Títulos y nombres |
| `text-secondary` | `#374151` | `#d1d5db` | Texto de cuerpo, íconos de filas |
| `text-muted` | `#6b7280` | `#9ca3af` | Etiquetas, subtítulos de sección, placeholders |
| `brand` / `brand-hover` / `brand-active` | `#2563eb` / `#1d4ed8` / `#1e40af` | `#60a5fa` / `#3b82f6` / `#2563eb` | Acentos, elemento activo, enlaces de acción |
| `on-brand` | `#ffffff` | `#0f1319` | Texto sobre `brand` (iniciales del aplicativo abierto) |
| `focus` | `#3b82f6` | `#60a5fa` | Anillo de foco |
| `info-soft` / `-line` / `-strong` | `#eff6ff` / `#bfdbfe` / `#1d4ed8` | `#1c2a41` / `#24406f` / `#93c5fd` | Mosaico «Exportar» |
| `success-soft` / `-line` / `-strong` | `#f0fdf4` / `#bbf7d0` / `#15803d` | `#18332d` / `#1b583a` / `#86efac` | Mosaico «Importar», estado «Conectado» |
| `warning-soft` / `-line` / `-strong` | `#fffbeb` / `#fde68a` / `#b45309` | `#342e22` / `#654a1d` / `#fcd34d` | Ícono de empresa, mosaico de estación, aviso de sesión |
| `danger-soft` / `-line` / `-strong` | `#fef2f2` / `#fecaca` / `#b91c1c` | `#33222a` / `#632b31` / `#fca5a5` | «Cerrar sesión», «Sin conexión», aviso con cambios sin guardar |

Los estados también traen la rampa completa de Tailwind para rellenos sólidos: `success` = green, `danger` = red, `warning` = amber, `info` = blue (por ejemplo `bg-success-600` = `#16a34a`).

Una superficie con opacidad (`brand` al 10 %, `brand` al 20 %) solo se usa para resaltar un elemento activo sobre una superficie sólida, nunca como fondo de un panel.

**Colores fijos** (no cambian con los tokens, a propósito):

| Uso | Claro | Oscuro |
|---|---|---|
| Ícono del saludo, mañana (`fa-sun`) | fondo `#fef3c7`, ícono `#f59e0b` | fondo `#78350f` al 40 %, ícono `#fcd34d` |
| Ícono del saludo, tarde (`fa-cloud-sun`) | fondo `#ffedd5`, ícono `#f97316` | fondo `#7c2d12` al 40 %, ícono `#fdba74` |
| Ícono del saludo, noche (`fa-moon`) | fondo `#e0e7ff`, ícono `#6366f1` | fondo `#312e81` al 40 %, ícono `#a5b4fc` |
| Avatar del usuario | Uno de ocho tonos 700, elegido por el nombre ([§3.11](#311-menú-del-usuario)): `#0369a1`, `#047857`, `#6d28d9`, `#be123c`, `#0f766e`, `#4338ca`, `#a21caf`, `#b45309`; iniciales `#ffffff` | Igual |
| Mosaico «URL del servidor» | fondo `#ede9fe`, ícono `#6d28d9` | fondo `#4c1d95` al 50 %, ícono `#c4b5fd` |
| Punto de conexión | `#16a34a` conectado · `#dc2626` sin conexión | Igual |
| Barra del tiempo de sesión | `#4ade80` / `#fbbf24` / `#f87171` al 70 % (bien / aviso / crítico) | `#16a34a` / `#d97706` / `#dc2626` al 70 % |
| Fondo detrás de las capas y del buscador | negro al 40 % | negro al 60 % |
| Ambientación por temporada | Ver [§2.14](#214-ambientación-por-temporada) | |

### 2.2 Tipografía e íconos

- Fuente **Roboto** (Google Fonts), tamaño base 16 px, interlineado 1.5.
- Íconos **Font Awesome 6** (sólidos, y `fa-regular` donde se indica): `fa-bars`, `fa-magnifying-glass`, `fa-down-left-and-up-right-to-center`, `fa-up-right-and-down-left-from-center`, `fa-sliders`, `fa-angles-left`, `fa-angles-right`, `fa-eye-slash`, `fa-xmark`, `fa-chevron-right`, `fa-chevron-down`, `fa-inbox`, `fa-rotate-right`, `fa-bolt`, `fa-thumbtack`, `fa-clock-rotate-left`, `fa-arrow-turn-down`, `fa-regular fa-file-lines`, `fa-regular fa-clock`, `fa-location-dot`, `fa-building`, `fa-building-user`, `fa-server`, `fa-keyboard`, `fa-house`, `fa-sitemap`, `fa-sun`, `fa-cloud-sun`, `fa-moon`, `fa-clock`, `fa-triangle-exclamation`, `fa-wand-magic-sparkles`, `fa-check`, `fa-arrow-right-from-bracket`, `fa-spinner`.

| Texto | Tamaño / interlineado | Peso |
|---|---|---|
| Saludo (tarjeta completa) | 18/28 px | 600 |
| Saludo (una línea) | 16/24 px | 600 |
| Títulos de panel, de sección y de widget; nombres de pantalla y aplicativo | 14/20 px | 600 (títulos) · 500 (nombres) |
| Cuerpo, filas, opciones de menú, etiquetas | 14/20 px | 400 |
| Fecha bajo el saludo | 14/20 px | 400 |
| Subtítulos de grupo («FIJADOS», «TEMA») | 12/16 px, mayúsculas, espaciado 0.025em | 500 (accesos) · 600 (preferencias) |
| Ubicación de una pantalla, nombre del aplicativo en una tarjeta, textos secundarios | 12/16 px | 400 |
| Iniciales de aplicativo y del avatar | 12/16 px | 600 |
| Teclas (`<kbd>`), etiqueta «Próximamente», barra inferior | 11 px | 400 (teclas) · 500 |
| Servidor en el widget de conexión | 12/16 px, monoespaciada | 400 |

Los números que cambian (contadores, versiones, tiempo) usan cifras tabulares (`tabular-nums`) para no moverse.

### 2.3 Distribución y puntos de quiebre

- La pantalla ocupa exactamente el alto de la ventana (`100dvh`, con `100vh` de respaldo) en columna: header fijo arriba y, debajo, una fila con panel izquierdo, centro y panel derecho. **Solo el centro y el interior de los paneles hacen scroll**, no la página.
- Centro: relleno de 16 px, y desde 640 px de 32 px por los cuatro lados. Por debajo de 640 px, en celular, el relleno inferior es de 96 px para no quedar bajo la barra inferior (entre 640 y 767 px queda en 32 px: ver la observación 7 de [§11](#11-observaciones-conocidas-del-original)). Sus bloques van separados 24 px y ocupan todo el ancho, sin ancho máximo.
- Cuadrícula de widgets: `repeat(auto-fill, minmax(272px, 1fr))`, separación 16 px. Las columnas dependen del ancho real del centro, que cambia con los paneles, no del ancho de la ventana.

| Tamaño | Ancho | Módulos | Preferencias | Además |
|---|---|---|---|---|
| `grande` | ≥ 1536 px | Expandido (288 px) | Expandido (384 px) | — |
| `laptop` | 1280–1535 px | Expandido | Compacto (64 px) | Preferencias expandido mide 352 px |
| `chica` | 1024–1279 px | Expandido | Compacto | Solo **un** panel expandido a la vez |
| `tablet` | 768–1023 px | Compacto | Compacto | Expandir abre una capa encima del contenido |
| `movil` | < 768 px | — | — | Barra inferior; bienvenida en una línea; sin widget de atajos |

Las columnas «Módulos» y «Preferencias» son el estado **por defecto**: el usuario lo cambia y se recuerda por tamaño ([§3.1](#31-paneles-laterales)). Otros cortes que usa la pantalla:

| Desde | Cambio |
|---|---|
| 640 px (`sm`) | Relleno del centro de 32 px; accesos rápidos en cuadrícula en lugar de tira; tarjeta de bienvenida con 20 px de relleno |
| 768 px (`md`) | Nombre de la empresa y del usuario en el header; tecla «Ctrl K» en el botón del buscador |
| 1536 px (`2xl`) | Panel de preferencias expandido de 384 px (352 px por debajo) |

### 2.4 Header

| Pieza | Medidas |
|---|---|
| Barra | Fondo `surface`, línea inferior `border-subtle`. Relleno 10 × 16 px (24 px a los lados desde 640 px); separación 8 px (12 px desde 640 px) |
| Logo de la empresa | 40 × 40 px, radio 8 px, `object-fit: contain`. Sin logo (o si no carga): `fa-building` `text-muted` sobre `surface-raised` |
| Nombre de la empresa | Desde 768 px, si hay. 14 px, 600, `text-primary`, ancho máx. 256 px, cortado con «…» |
| Botón del buscador | Centrado en el espacio libre, ancho completo hasta 448 px. Radio 6 px, borde `border-strong` (hover `brand`), fondo `surface-alt`, relleno 8 × 12 px, 14 px `text-muted`: lupa de 12 px, «Buscar pantalla…» y, desde 768 px, la tecla «Ctrl K» (11 px, borde `border-subtle`, relleno 2 × 6 px, `text-secondary`). No aparece en celular |
| Botones de ícono | 40 × 40 px, redondos, ícono de 16 px (`btn-icon`: `text-muted`; hover `text-secondary` sobre `surface-raised`, `surface-overlay` en oscuro). Vista limpia activa: fondo `brand` al 10 % y ícono `brand` |
| Mostrar módulos (`fa-bars`) | Primero a la izquierda, solo si el panel de módulos está oculto (no en celular) |
| Mostrar preferencias (`fa-sliders`) | Antes del menú del usuario, solo si el panel de preferencias está oculto (no en celular) |
| Menú del usuario | Último a la derecha ([§2.11](#211-menú-del-usuario)) |
| Debajo del header (opcional) | Espacio para un aviso del proyecto (en *Business*: el banner de conexión perdida), con margen de 12 px arriba y 16/24 px a los lados |

### 2.5 Panel de módulos

**Expandido** (288 px, `w-72`):

| Pieza | Medidas |
|---|---|
| Panel | Fondo `surface`, línea derecha `border-subtle`, alto completo |
| Encabezado | Relleno 16 px arriba, 16 px a los lados, 8 px abajo. «Módulos» 14 px 600; a la derecha, botones de 32 × 32 px: ocultar (`fa-eye-slash`) y compactar (`fa-angles-left`), ícono de 14 px |
| Filtro | Relleno 0 × 16 px, 12 px abajo. Campo de ancho completo, radio 6 px, borde `border-strong`, fondo `surface-alt`, relleno 6 px arriba y abajo y 32 px a los lados, 14 px `text-primary`, placeholder `text-muted`. Lupa de 12 px a 12 px del borde izquierdo. Con texto, botón «×» de 24 × 24 px a 6 px del borde derecho. Foco: anillo de 2 px `focus`. Deshabilitado mientras cargan los aplicativos |
| Lista | Línea superior `border-subtle`, relleno 8 px, scroll propio. 2 px entre filas |
| Fila de aplicativo | Radio 8 px, relleno 8 px, separación 12 px: insignia de 32 × 32 px (radio 6 px, iniciales 12 px 600, `surface-raised` / `text-secondary`), nombre 14 px 500 cortado, cantidad de pantallas 12 px `text-muted` y chevron de 10 px. Hover: `surface-raised` |
| Aplicativo abierto | Fila con fondo `brand` al 10 % y texto `brand`; insignia `brand` con iniciales `on-brand`; chevron girado 90° |
| Árbol del aplicativo | Debajo de su fila, con 24 px de sangría, 2 px arriba, 4 px abajo, línea izquierda `border-subtle` y 4 px de relleno. Grupos con «+»/«−» y contador de hijos; pantallas con un punto; pantallas sin acceso deshabilitadas al 60 % con «Esta pantalla no está disponible» |
| Resultados del filtro | Reemplazan al acordeón. Fila con radio 8 px, relleno 8 × 12 px: nombre 14 px `text-primary` y ubicación 12 px `text-muted`, cada uno en una línea. Hover `surface-raised`. Sin resultados: «No hay pantallas que coincidan», 14 px `text-muted`, centrado, 32 px arriba y abajo |
| Cargando | Seis siluetas con la forma de las filas: cuadro de 32 px (radio 6 px) y barra de 12 px de alto, de ancho variable (55 % + (n × 17 mod 35) %), en `surface-raised`, latiendo (`animate-pulse`). Sin latido con «reducir movimiento» |
| Sin aplicativos | Centrado, 32 px arriba y abajo: círculo de 48 px `surface-raised` con `fa-inbox` de 18 px, «No hay aplicaciones disponibles» (14 px 500 `text-secondary`) y «Contacte al administrador del sistema» (12 px `text-muted`) |
| Error al cargar | Centrado: texto 14 px `text-secondary` y botón secundario «Reintentar» (14 px, relleno 6 × 12 px, `fa-rotate-right` de 12 px) |

**Compacto** (64 px, `w-16`):

| Pieza | Medidas |
|---|---|
| Arriba | Relleno 12 px arriba y abajo, línea inferior `border-subtle`; botón expandir (`fa-angles-right`) de 36 × 36 px |
| Íconos | Scroll propio, relleno 12 px arriba y abajo, 6 px entre íconos. Cada aplicativo: cuadro de 40 × 40 px, radio 8 px, iniciales 12 px 600, `surface-raised` / `text-secondary`; hover: `brand` al 10 % y texto `brand`. Con su panel flotante abierto: `brand` con texto `on-brand` |
| Abajo | Relleno 12 px arriba y abajo, línea superior `border-subtle`; botón ocultar (`fa-eye-slash`) de 36 × 36 px |
| Panel flotante | 288 px de ancho, posición fija junto al ícono ([§3.2](#32-paneles-flotantes)). Radio 8 px, borde `border-subtle`, fondo `surface-overlay`, sombra `shadow-lg`. Encabezado: relleno 10 × 12 px, nombre del aplicativo 14 px 600 y botón cerrar de 28 × 28 px; línea inferior `border-subtle`. Cuerpo: relleno 8 px, scroll propio, con el árbol del aplicativo |
| Cargando | Seis siluetas de 40 × 40 px, radio 8 px, latiendo |

**Capa** (tablet y celular): el panel expandido, de 320 px (máx. 85 % del ancho), pegado a la izquierda, con sombra `shadow-xl` y un botón cerrar de 32 × 32 px en lugar de ocultar y compactar.

### 2.6 Panel de preferencias

**Expandido** (352 px; 384 px desde 1536 px):

| Pieza | Medidas |
|---|---|
| Panel | Fondo `surface`, línea izquierda `border-subtle`, alto completo |
| Encabezado | Relleno 16 px arriba, 20 px a los lados, 12 px abajo. Ícono `fa-sliders` `brand` y «Preferencias» 14 px 600 (8 px entre ellos); a la derecha, compactar (`fa-angles-right`) y ocultar (`fa-eye-slash`), de 32 × 32 px |
| Cuerpo | Línea superior `border-subtle`; relleno 20 px arriba y a los lados, 24 px abajo; scroll propio; 24 px entre secciones |
| Título de sección | 12 px 600, mayúsculas, espaciado 0.025em, `text-muted`, 12 px de margen inferior |
| Secciones | Las pone cada proyecto ([§4.2](#42-componentes)). Una sección puede llevar una línea superior `border-subtle` con 24 px arriba para separar grupos |

**Tema de la interfaz** (`<app-selector-modo-tema>`; la primera sección en *Business*): tres tarjetas en una cuadrícula de 3 columnas con 12 px de separación, una por modo: Claro (`fa-sun`), Oscuro (`fa-moon`) y Automático, el del sistema (`fa-circle-half-stroke`). Cada tarjeta tiene radio 12 px, borde `border-subtle`, fondo `surface` (hover `surface-raised`) y relleno 8 px. Adentro, una **miniatura** de 60 px de alto (radio 8 px, borde negro al 10 %) que dibuja la interfaz en ese modo con colores fijos, que no cambian con el tema actual:

| Miniatura | Fondo | Barra superior (10 px) | Dos líneas (6 px de alto, 55 % y 35 % de ancho, a 20 y 32 px del borde) | Acento (16 × 16 px abajo a la derecha, radio 4 px) |
|---|---|---|---|---|
| Claro | `#ffffff` | `#1a365d` | `#d1d5db` | `#2563eb` |
| Oscuro | `#1f2937` | `#061b3c` | `#4b5563` | `#60a5fa` |
| Automático | `#ffffff`, con la mitad inferior derecha `#1f2937` partida en diagonal | `#1a365d` | `#9ca3af` | `#2563eb` |

Debajo, a 8 px, el ícono (12 px) y el nombre del modo (14 px, `text-secondary`), centrados con 6 px entre ellos. La tarjeta elegida lleva borde y anillo de 1 px `brand`, y su nombre en 500 `brand`. Es un grupo de radios: Tab entra a la opción elegida y las flechas pasan a la vecina y la eligen. En la barra compacta esta sección no tiene ícono: ahí el tema es la acción directa claro ⇄ oscuro.

**Mosaicos** (patrón para acciones de configuración; en *Business*, «Gestión de preferencias»): cuadrícula de 2 columnas con 8 px de separación. Cada mosaico mide 80 px de alto, radio 8 px, borde `border-subtle` (hover `brand`), fondo `surface-raised`, `text-secondary`; adentro, en columna con 6 px de separación, un círculo de 36 px con el ícono (14 px) en los colores del trío de su estado, que crece a 1.1 al pasar el mouse, y el texto de 12 px 500.

**Compacto** (64 px): igual que el de módulos (expandir arriba con `fa-angles-left`, ocultar abajo). En el medio, un ícono de 40 × 40 px por sección (menos las que son solo del panel expandido, como el tema), en el mismo estilo que los aplicativos (`surface-raised` / `text-secondary`; hover `brand` al 10 %; abierto `brand` / `on-brand`). El primero puede ser una **acción directa** que no abre panel (en *Business*: alternar claro/oscuro con `fa-moon`/`fa-sun`). Panel flotante de 304 px a la **izquierda** de la barra, con relleno de 16 px y el contenido de esa sección.

**Capa** (tablet y celular): el panel expandido de 352 px (máx. 90 % del ancho), pegado a la derecha, con sombra `shadow-xl` y botón cerrar.

### 2.7 Tarjeta de bienvenida

**Completa** (desde 768 px y fuera de la vista limpia):

| Pieza | Medidas |
|---|---|
| Tarjeta | Radio 8 px, borde `border-subtle`, fondo `surface`, relleno 16 px (20 px desde 640 px). `position: relative; overflow: hidden` (para la franja y la decoración de temporada) |
| Fila principal | Saludo a la izquierda (crece, base de 256 px) y tiempo de sesión a la derecha (ancho completo en celular; 288 px desde 640 px). Pasa a otra línea si no cabe: 32 px de separación horizontal y 16 px vertical |
| Saludo | Círculo de 48 px con el ícono de 20 px; a 16 px, el saludo (18 px 600, `text-primary`, una línea) y debajo la fecha (14 px `text-muted`, «Martes, 24 de noviembre», en el idioma activo) |
| Etiquetas | Debajo, con línea superior `border-subtle`, 16 px arriba y 16 px de relleno; 8 px entre etiquetas. Cada una: radio 8 px, borde `border-subtle`, fondo `surface-raised`, relleno 6 × 12 px, 14 px `text-secondary`, ícono a 8 px. Hora de inicio de sesión (`fa-regular fa-clock`, `text-secondary`), estación (`fa-location-dot`, `brand`) y empresa (`fa-building`, `warning-strong`). Se muestran solo las que tienen dato; sin ninguna, no hay línea |

**En una línea** (celular y vista limpia): sin tarjeta. Saludo de 16 px 600; a su lado la estación (14 px `text-secondary` con `fa-location-dot` de 12 px `brand`), y a la derecha (224 px desde 640 px) el tiempo de sesión. Con temporada, el saludo lleva antes un círculo de 24 px con el ícono de 12 px (el año, en 2 cifras de 11 px).

**Tiempo de sesión restante:**

| Pieza | Medidas |
|---|---|
| Texto | Fila de 12 px: «Sesión restante» (`text-muted`) y el tiempo (500, `text-secondary`; `danger-strong` en crítico o vencida), 6 px sobre la barra. Formato: `3 h 20 min`, `45 min`, `8 min 12 s`, `40 s`, «Sesión vencida» |
| Barra | 6 px de alto, redonda, fondo `surface-raised`; el relleno se vacía de derecha a izquierda (ancho = % restante) con los colores de [§2.1](#21-colores). Sin barra si no se sabe cuánto duraba la sesión |
| Tooltip | «Vence a las 14:35» |

### 2.8 Accesos rápidos

| Pieza | Medidas |
|---|---|
| Sección | Radio 8 px, borde `border-subtle`, fondo `surface`, relleno 16 px. Encabezado: `fa-bolt` de 14 px `brand` y «Accesos rápidos» 14 px 600, 12 px de margen inferior |
| Grupos | «FIJADOS» y «RECIENTES» (12 px 500, mayúsculas, `text-muted`, 8 px de margen inferior), 16 px entre grupos. «Borrar» a la derecha de Recientes: 12 px `text-muted` (hover `text-secondary`), relleno 2 × 6 px |
| Lista | Cuadrícula `repeat(auto-fill, minmax(224px, 1fr))`, 8 px de separación |
| Tarjeta | Radio 8 px, borde `border-subtle`, fondo `surface-raised`. Hover: sube 2 px, borde `brand` y sombra `shadow-sm`; al hacer clic vuelve a su lugar |
| Botón principal | Ocupa la tarjeta salvo la acción. Relleno 10 px arriba y abajo, 12 px a la izquierda, 8 px a la derecha; separación 12 px. Cuadro de 36 × 36 px (radio 6 px, fondo `surface`) con el ícono de 14 px: `fa-thumbtack` `brand` (fijado) o `fa-clock-rotate-left` `text-secondary` (reciente). Nombre de la pantalla (14 px 500 `text-primary`) y del aplicativo (12 px `text-secondary`), cada uno en una línea. Tooltip con la ruta completa («Aplicativo › Grupo › Pantalla») |
| Tecla del fijado | En los fijados 1 a 8, a la derecha: «Alt+1»… (11 px, radio 4 px, borde `border-subtle`, fondo `surface`, relleno 2 × 6 px). Invisible hasta pasar el mouse por la tarjeta o llegar con el teclado |
| Acción | Botón de 32 × 32 px a 6 px del borde derecho, radio 6 px, ícono de 12 px. Fijado: `fa-xmark` `brand` («Quitar de fijados»). Reciente: `fa-thumbtack` girado 45° `text-secondary` («Fijar esta pantalla»). Hover: fondo `surface` e ícono `brand`. Con 8 fijados, el de los recientes queda deshabilitado al 40 % con «Ya tienes 8 fijados; quita uno para fijar otro» |
| Cargando | Cuatro siluetas de 60 px de alto, radio 8 px, `surface-raised`, latiendo |
| Vacía | Caja con borde punteado `border-strong`, radio 8 px, relleno 16 px: `fa-thumbtack` de 18 px `text-muted` y «Aquí aparecerán las pantallas que abras. Fija las que más usas para tenerlas siempre a mano.» (14 px `text-secondary`) |
| Celular (< 640 px) | Cada grupo es una **tira horizontal**: tarjetas de 240 px (máx. 80 %) que se deslizan de lado y se detienen al inicio de cada una (`scroll-snap`), sin barra de scroll visible; asoma la siguiente. Sin la tecla del fijado |

### 2.9 Widgets

Todos los widgets usan la misma tarjeta, para que los de una misma fila midan lo mismo sin forzar alturas:

| Pieza | Medidas |
|---|---|
| Tarjeta | Radio 8 px, borde `border-subtle`, fondo `surface`, relleno 16 px arriba y a los lados, 8 px abajo. Alto completo de su celda |
| Encabezado | 32 px de alto, una línea: cuadro de 32 × 32 px (radio 8 px, `surface-raised`) con el ícono de 14 px `brand`; título 14 px 600 cortado; a la derecha, una acción opcional (botón fantasma de 28 px de alto, relleno 0 × 8 px, 12 px) |
| Cuerpo | 8 px bajo el encabezado. **Cuatro filas** de 36 px con divisor `border-subtle` entre ellas: etiqueta a la izquierda (14 px `text-muted`) y valor a la derecha (14 px `text-primary`), 12 px de separación |
| Cargando | En lugar del cuerpo, un `fa-spinner` girando, `text-muted`, centrado en un alto mínimo de 144 px |
| Próximamente | Para un widget sin datos todavía: ícono `text-secondary`, etiqueta «Próximamente» en el encabezado (11 px 500 `text-muted`, borde `border-subtle`, redonda, relleno 2 × 8 px) y valores «—» |

Widgets del original (ejemplos de uso; los datos son de cada proyecto):

- **Conexión** (`fa-server`, acción «Cambiar»): Estado (punto de 8 px + «Conectado» en `success-strong` o «Sin conexión» en `danger-strong`, 500), Servidor (host sin protocolo, monoespaciado 12 px, la URL completa en el tooltip), Versión web y Versión del API (cifras tabulares, «—» si no hay dato).
- **Atajos** (`fa-keyboard`): una fila por atajo con sus teclas en `<kbd>` (11 px, radio 4 px, borde `border-subtle`, fondo `surface-raised`, relleno 2 × 6 px, 4 px entre teclas). No se muestra en celular ni en vista limpia.

### 2.10 Buscador de pantallas

| Pieza | Medidas |
|---|---|
| Fondo | Fijo, a pantalla completa, `z-index: 50`; negro al 40 % (60 % en oscuro). La ventana arriba al centro, a 12 % del alto, con 16 px de margen |
| Ventana | Ancho máx. 576 px, alto máx. 70 % de la pantalla. Radio 12 px, borde `border-subtle`, fondo `surface-overlay`, sombra `shadow-2xl` |
| Campo | Fila de 48 px con línea inferior `border-subtle` y relleno 0 × 16 px: lupa de 14 px `text-muted`, campo sin borde de 14 px y la tecla «Esc» a la derecha |
| Resultados | Relleno 8 px, scroll propio. Sin texto: subtítulo «ACCESOS RÁPIDOS» (12 px 500, mayúsculas, `text-secondary`, relleno 8 px arriba, 4 px abajo, 12 px a los lados) y los fijados y recientes |
| Opción | Radio 8 px, relleno 8 × 12 px, separación 12 px: `fa-regular fa-file-lines` de 14 px, nombre (14 px `text-primary`) y ubicación (12 px `text-secondary`). **Activa:** fondo `brand` al 10 %, ícono y nombre `brand` (500) y una flecha `fa-arrow-turn-down` girada 90° de 12 px a la derecha |
| Sin resultados | 14 px `text-secondary`, centrado, 32 px arriba y abajo: «No hay pantallas que coincidan». Sin texto y sin accesos rápidos: «Escribe para buscar entre N pantallas.» |
| Pie | Línea superior `border-subtle`, relleno 8 × 16 px, 12 px `text-secondary`: «↑ ↓ Moverse», «Enter Abrir», «Esc Cerrar», con las teclas en `<kbd>` de 11 px |

### 2.11 Menú del usuario

| Pieza | Medidas |
|---|---|
| Botón | Redondo, borde `border-subtle`, relleno 4 px (8 px a la derecha; 12 px desde 640 px), hover `surface-raised`. Avatar de 32 px con las iniciales (12 px 600, blanco sobre el color del usuario), nombre (desde 768 px; 14 px 500 `text-primary`, ancho máx. 160 px) y chevron de 10 px `text-muted` que gira 180° con el menú abierto |
| Menú | 288 px de ancho, 8 px debajo del botón, alineado a la derecha. Radio 8 px, borde `border-subtle`, fondo `surface-overlay`, sombra `shadow-lg`, `z-index: 40` |
| Quién y dónde | Relleno 12 × 16 px, línea inferior `border-subtle`: usuario (14 px 600 `text-primary`) y, si hay, empresa (`fa-building`) y estación (`fa-location-dot`) en 12 px `text-secondary` |
| Opciones | Relleno 4 px arriba y abajo. Cada una: relleno 8 × 16 px, 14 px `text-primary`, ícono de 16 px de ancho `text-secondary` a 12 px del texto; hover y foco `surface-raised` |
| Opción con casilla | Ambientación de temporada ([§3.10](#310-ambientación-por-temporada)): ✓ de 12 px `brand` a la derecha cuando está activa (el espacio se reserva aunque no esté) |
| Cerrar sesión | Separada con línea superior `border-subtle`. `danger-strong`; hover y foco `danger-soft` |

### 2.12 Celular: barra inferior y capas

| Pieza | Medidas |
|---|---|
| Barra inferior | Fija abajo, `z-index: 30`, fondo `surface`, línea superior `border-subtle`, más el área segura del dispositivo. Cuatro botones iguales de 64 px de alto: ícono de 18 px sobre el texto (11 px 500), 4 px entre ellos. Activo `brand`; los demás `text-secondary` (hover `text-primary`); foco de teclado con fondo `surface-raised` |
| Botones | Inicio (`fa-house`), Módulos (`fa-sitemap`), Buscar (`fa-magnifying-glass`), Preferencias (`fa-sliders`). Inicio está activo si no hay capa abierta; Módulos y Preferencias, mientras su capa está abierta |
| Capa | Fija, a pantalla completa (en celular, hasta encima de la barra inferior), `z-index: 40`. Fondo negro al 40 % (60 % en oscuro) que cierra al tocarlo, y el panel pegado a su lado ([§2.5](#25-panel-de-módulos), [§2.6](#26-panel-de-preferencias)) |

### 2.13 Avisos flotantes

| Pieza | Medidas |
|---|---|
| «Deshacer» | Fijo, abajo al centro: 24 px del borde inferior (80 px en celular), `z-index: 50`, ancho máx. el de la pantalla menos 32 px. Radio 8 px, borde `border-subtle`, fondo `surface-overlay`, sombra `shadow-lg`, relleno 8 px arriba y abajo, 16 px a la izquierda y 8 px a la derecha, 14 px `text-primary`. Texto «Quitaste «Depósitos» de fijados» (cortado), botón «Deshacer» (500, `brand`, relleno 4 × 8 px, radio 4 px, hover `brand` al 10 %) y cerrar de 28 × 28 px |
| Aviso de sesión | Fijo abajo a la derecha: 16 px del borde derecho y 24 px del inferior (80 px en celular), `z-index: 50`, ancho máx. 384 px. Radio 8 px, borde 1 px, sombra `shadow-lg`, relleno 12 px (8 px a la derecha), 14 px. Ícono a la izquierda, título (600) y mensaje (2 px abajo), y cerrar de 28 × 28 px (hover: el color de la línea al 60 %). **Neutro:** trío `warning` con `fa-clock`. **Con cambios sin guardar:** trío `danger` con `fa-triangle-exclamation` |

### 2.14 Ambientación por temporada

En una fecha especial solo cambia la **tarjeta de bienvenida**: el saludo, el círculo del ícono, una franja de 4 px en el borde superior y, en algunas fechas, una animación encima. Nada más de la pantalla cambia.

| Temporada | Fechas | Círculo del saludo (claro / oscuro) | Franja | Animación |
|---|---|---|---|---|
| Navidad | 1 dic → 6 ene | `fa-tree`: fondo `#d1fae5` e ícono `#047857` / fondo `#064e3b` al 50 % e ícono `#6ee7b7` | Degradado `#059669 → #ef4444 → #059669` | Nieve continua |
| Año Nuevo | 31 dic → 2 ene | El año que empieza (13 px 700, cifras tabulares): fondo `#fef3c7`, texto `#b45309` / `#78350f` al 50 %, `#fcd34d` | `#fbbf24 → #d946ef → #0ea5e9` | Fuegos artificiales, una vez por sesión |
| Mes patrio (solo Guatemala) | 1 → 15 sep | Bandera de Guatemala (32 px de ancho, 8:5) sobre `surface-raised` | Tres bandas iguales: `#4997D0`, `#ffffff`, `#4997D0` | — |
| Semana Santa | Domingo de Ramos → Domingo de Resurrección (calculado cada año) | `fa-umbrella-beach`: `#cffafe` / `#0e7490`; `#164e63` al 50 % / `#67e8f9` | `#0ea5e9 → #67e8f9 → #fcd34d` | — |

| Animación | Cómo |
|---|---|
| Nieve | 16 copos redondos de 3 a 7 px (`#bae6fd`; blanco al 80 % en oscuro). Cada copo va en un «carril» del alto de la tarjeta que se traslada un 100 % de su propio alto en 7 a 12 s, lineal e infinito, con un vaivén de 8 px a la mitad; aparece en el primer 10 % y se apaga en el último. Retraso inicial negativo, para que al entrar ya estén repartidos. **Solo `transform` y `opacity`** |
| Confeti (disponible, sin temporada asignada) | 18 rectángulos de 5–8 × 8–13 px en `#fbbf24`, `#d946ef`, `#0ea5e9`, `#10b981`, que caen en 2.4–3.8 s girando 180–540°. Una vez por sesión |
| Fuegos artificiales | Cuatro estallidos SVG (6 rayos largos y 6 cortos con una bola en la punta) en la mitad derecha de la tarjeta, en `#fbbf24`, `#d946ef`, `#0ea5e9`, `#f59e0b`, escalonados cada ~0.4 s. Cada uno pasa de escala 0.2 a 1.15 en 1.4 s (`cubic-bezier(0.2, 0.7, 0.3, 1)`) y se desvanece |

La decoración no recibe clics (`pointer-events: none`), queda recortada dentro de la tarjeta y no se muestra con «reducir movimiento».

### 2.15 Animaciones

| Qué | Cómo |
|---|---|
| Ancho de los paneles (expandir/compactar) | `transition: width 200ms ease-out` en el mismo contenedor de los dos estados; el contenido no se asoma mientras crece (`overflow: hidden`) |
| Chevrons (acordeón, menú) | Giro con `transition-transform` (150 ms) |
| Tarjetas de acceso | Suben 2 px en hover: `transition: transform 150ms ease-out` (solo `transform`) |
| Fijar, quitar o deshacer | Las tarjetas se deslizan de su lugar viejo al nuevo con View Transitions (`view-transition-name` único por tarjeta) |
| Íconos de los mosaicos | Escala 1.1 en hover (`transition-transform`) |
| Siluetas de carga | `animate-pulse` |
| Barra del tiempo de sesión | `transition: width 1000ms linear` |
| Ambientación | [§2.14](#214-ambientación-por-temporada) |
| Movimiento reducido | Con `prefers-reduced-motion: reduce` no hay transición de ancho, ni elevación, ni deslizamiento entre listas, ni latido, ni decoración de temporada |

**No se usa `transition-colors`** en las piezas del inicio: los cambios de color por hover o por tema son inmediatos. Animar el color de cada elemento por separado hacía que la pantalla cambiara a destiempo.

### 2.16 Accesibilidad

- Los paneles son `<aside>` con su nombre («Módulos», «Preferencias»); la barra inferior es un `<nav>` («Navegación»).
- Botones de solo ícono con `aria-label` traducido; los que abren algo, con `aria-expanded`. La vista limpia, con `aria-pressed`.
- Acordeón de aplicativos con `aria-expanded`; árbol con `aria-current="page"` en la pantalla actual, `aria-expanded` en grupos y `aria-disabled` en pantallas sin acceso.
- Buscador: ventana `role="dialog"` modal; campo `role="combobox"` con `aria-activedescendant` apuntando a la opción activa de la lista (`role="listbox"` / `option`, `aria-selected`).
- Menú del usuario: `role="menu"`, `menuitem` y `menuitemcheckbox` con `aria-checked`.
- Las etiquetas de la bienvenida y los datos del menú llevan su nombre para lectores de pantalla («Estación: Caja 1»).
- Tarjeta de acceso fijada con `aria-keyshortcuts="Alt+N"`; «Deshacer» con `aria-keyshortcuts="Control+Z"`.
- Tiempo de sesión como `role="progressbar"` con su valor; avisos flotantes con `role="status"`.
- Siluetas de carga ocultas a lectores (`aria-hidden`) con un «Cargando…» `role="status"`; decoraciones e íconos `aria-hidden`.
- Anillo de foco de 2 px `focus` en todos los controles, solo al navegar con teclado (`focus-visible`).

---

## 3. Comportamiento

### 3.1 Paneles laterales

1. **Tres estados.** Cada panel está *expandido* (completo), *compacto* (barra de íconos de 64 px) u *oculto* (no se dibuja; se vuelve a mostrar desde el header).
2. **Por tamaño de pantalla.** El estado de cada panel se recuerda **por separado en cada tamaño** (`grande`, `laptop`, `chica`): lo que el usuario elige en un monitor grande no se impone en la laptop. Si nunca eligió, rige el estado por defecto de [§2.3](#23-distribución-y-puntos-de-quiebre).
3. **`chica` (1024–1279 px):** solo un panel expandido a la vez. Expandir uno compacta el otro.
4. **`tablet` (768–1023 px):** los paneles son siempre barras compactas (u ocultos). «Expandir» no empuja el contenido: abre el panel como **capa** encima. Mostrar un panel oculto vuelve a poner su barra y abre la capa.
5. **`movil` (< 768 px):** no hay paneles laterales. Módulos y Preferencias se abren como capa desde la barra inferior; tocar el mismo botón otra vez la cierra.
6. **Capas:** se cierran con el fondo oscuro, con la «×» del panel, con `Esc`, al abrir una pantalla, al abrir el buscador o al ir a «Inicio» de la barra inferior. Si la ventana crece hasta que los paneles caben al lado, la capa abierta se cierra sola.
7. **Botones de los paneles:** en el expandido, compactar y ocultar; en el compacto, expandir (arriba) y ocultar (abajo). En el header, un botón por cada panel oculto.
8. **Cambiar un panel apaga la vista limpia** ([§3.7](#37-vista-limpia)) fijando lo que se veía, para que el otro panel no se reexpanda de golpe.

### 3.2 Paneles flotantes

1. En una barra compacta, cada ícono abre su contenido en un panel flotante **junto a la barra**: a la derecha de la barra de módulos y a la izquierda de la de preferencias. Tocar el mismo ícono lo cierra; tocar otro lo cambia.
2. **Posición:** arriba, alineado con el ícono, pero sin bajar de modo que queden menos de 320 px hasta el borde inferior; a 8 px de la barra; nunca a menos de 12 px de los bordes de la ventana. El alto máximo es lo que queda hasta 12 px del borde inferior, con scroll propio.
3. Se cierra con un clic fuera del panel, con `Esc`, al cambiar el tamaño de la ventana y, en el de módulos, al hacer scroll en la barra o al elegir una pantalla.

### 3.3 Panel de módulos

1. **Acordeón:** un solo aplicativo desplegado a la vez; tocar el desplegado lo cierra. El aplicativo desplegado **se recuerda** entre visitas y es el mismo en el panel lateral y en la capa.
2. **Árbol:** tocar un grupo lo expande o lo contrae (no navega); tocar una pantalla la abre. Las pantallas a las que el usuario no tiene acceso se ven deshabilitadas. Respeta el orden y los nombres que entrega la fuente de datos; no hay límite de profundidad.
3. **Cantidad:** cada aplicativo muestra cuántas pantallas puede abrir el usuario en él (sin contar grupos). Si no tiene ninguna, no se muestra número.
4. **Filtro:** mientras tiene texto, el acordeón se reemplaza por la lista de pantallas de **todos** los aplicativos que coinciden (hasta 50), con su ubicación. Coincide si **todas las palabras** escritas aparecen en el nombre o la ubicación, en cualquier orden, sin distinguir mayúsculas ni tildes («deposito caja» encuentra «Depósitos de caja»). `Esc` en el filtro lo limpia sin cerrar nada más.
5. **Estados de carga:** mientras llegan los aplicativos, siluetas (6) y filtro deshabilitado; si la carga falla, mensaje con «Reintentar»; sin aplicativos, aviso de contactar al administrador.
6. El panel **no navega por su cuenta**: avisa qué pantalla se eligió y la pantalla de inicio decide ([§4](#4-contrato-de-los-componentes)).

### 3.4 Buscador de pantallas

1. Se abre con el botón del header, con «Buscar» de la barra inferior o con **Ctrl+K** (⌘K en Mac). Al abrirse: texto vacío, primera opción activa y foco en el campo.
2. **Sin texto** sugiere los accesos rápidos (fijados y luego recientes).
3. **Con texto** busca igual que el filtro de módulos (todas las palabras, sin tildes) y muestra hasta 50, primero las pantallas cuyo **nombre empieza** por lo escrito («dep» → «Depósitos» antes que «Reporte de depósitos»).
4. **Teclado:** ↑/↓ mueven la opción activa en círculo y la mantienen a la vista; Enter abre la activa; `Esc` cierra. Pasar el mouse por una opción la activa.
5. Elegir una pantalla cierra el buscador y la abre.

### 3.5 Accesos rápidos

1. **Fijados:** los elige el usuario, hasta **8**, en el orden en que los fijó. No se reemplazan solos.
2. **Recientes:** las últimas **5** pantallas abiertas, la más reciente primero. Se registran solo cuando el usuario **llegó** a la pantalla (si la navegación se cancela, no cuenta). Una pantalla que ya está en recientes sube al primer lugar.
3. Una pantalla fijada **no se repite** en recientes.
4. **Solo se muestra lo que sigue existiendo:** lo guardado se compara con las pantallas que el usuario puede abrir hoy (los permisos pueden haber cambiado); lo demás no se muestra, pero un fijado oculto así **sigue contando** para el máximo de 8.
5. **Fijar** desde un reciente lo pasa a Fijados al final; con 8 fijados, el botón queda deshabilitado con el aviso del máximo. **Quitar** un fijado lo saca de Fijados; si está entre las últimas abiertas, vuelve a aparecer en Recientes.
6. **Deshacer** (nivel 3): al quitar un fijado aparece «Deshacer» durante **6 s**. Deshacer devuelve los fijados exactamente como estaban (el quitado vuelve a su posición). **Ctrl+Z** hace lo mismo mientras el aviso está visible, salvo que el foco esté en un campo de texto. Quitar otro fijado reemplaza el aviso y reinicia los 6 s.
7. **Deslizamiento** (nivel 3): al fijar, quitar o deshacer, las tarjetas se deslizan a su nuevo lugar en lugar de saltar.
8. **Borrar recientes** vacía la lista de recientes del usuario (los fijados no se tocan).
9. Mientras se resuelven contra la lista de pantallas, se ven 4 siluetas del mismo tamaño que las tarjetas, para que nada salte.

### 3.6 Atajos de teclado

| Atajo | Acción | Nivel |
|---|---|---|
| Ctrl+K (⌘K) | Abre el buscador | 3 |
| Ctrl+B (⌘B) | Panel de módulos: expandido ⇄ compacto (si estaba oculto, lo expande). En tablet y celular abre o cierra la capa. No actúa con el buscador abierto | 3 (requiere 2) |
| Ctrl+Shift+L | Vista limpia, activar o desactivar | 3 (requiere 2) |
| Alt+1 … Alt+8 | Abre el fijado de esa posición. No actúa con el buscador abierto. Se lee la tecla física (`code`), porque con Alt algunas distribuciones cambian el carácter | 3 |
| Ctrl+Z | Deshace «quitar fijado» mientras se ofrece | 3 |
| Esc | Con el buscador abierto, cierra solo el buscador. Si no, cierra a la vez el panel flotante, el menú del usuario y la capa que estén abiertos. En el filtro de módulos, solo limpia el filtro | 1 a 3 |

Con un modal del proyecto encima (por ejemplo, la confirmación de cierre de sesión), ningún atajo abre nada debajo.

### 3.7 Vista limpia

1. Muestra **compacto** todo panel que esté expandido, sin cambiar lo guardado: al apagarla, cada panel vuelve a como estaba.
2. Mientras está activa: bienvenida en una línea y sin el widget de atajos (lo que no es información del momento).
3. Se activa con el botón del header (que queda resaltado) o con Ctrl+Shift+L, y se recuerda entre visitas.
4. En celular no hay botón: allí la pantalla ya es mínima.

### 3.8 Bienvenida y saludo

1. **Prioridad del saludo:** (1) la temporada, si hoy hay una y está activa; (2) el saludo según el contexto (nivel 4); (3) el saludo por hora del día.
2. **Hora del día** (hora del equipo): mañana de 5:00 a 11:59, tarde de 12:00 a 18:59, noche el resto. Con la pantalla abierta, el saludo por hora y la fecha se actualizan al cambiar de minuto. (En *Business*, el saludo en una línea se decide al entrar; el estándar lo actualiza igual que el de la tarjeta.)
3. **Según el contexto** (nivel 4), decidido **una vez al entrar**: si el usuario ya entró hoy, «¡Qué bueno verte de nuevo!»; si no, el lunes «¡Buen inicio de semana!» y el viernes «¡Feliz viernes!»; los demás días, el de la hora. Usa el ícono y los colores del momento del día. Se guarda el día de la última visita por usuario.
4. La fecha se escribe en el idioma activo con la primera letra en mayúscula («Martes, 24 de noviembre»).
5. Las etiquetas (hora de inicio de sesión, estación, empresa) y el tiempo de sesión solo aparecen si hay dato.

### 3.9 Tiempo y aviso de sesión

**Tiempo restante** (nivel 1, si el proyecto conoce el vencimiento):

1. Se calcula con la hora de vencimiento y, para la barra, con la duración total (inicio → vencimiento). Sin vencimiento no se muestra nada; sin inicio, se muestra el tiempo sin barra.
2. Nivel: **bien** con más de 50 % restante, **aviso** de 50 % a 20 %, **crítico** con menos de 20 % y **vencida** en 0.
3. Se actualiza cada 15 s y, en los últimos 10 minutos, cada segundo. Al volver a la pestaña se recalcula de inmediato.

**Aviso de sesión por vencer** (nivel 4):

1. Aparece **10 minutos antes** del vencimiento y se revisa cada 15 s (y al volver a la pestaña).
2. **Neutro:** «Tu sesión está por vencer. Vence a las 14:35. Después tendrás que iniciar sesión de nuevo.»
3. **Con cambios sin guardar:** solo si la pantalla en la que está el usuario declara trabajo pendiente: «Tienes cambios sin guardar. Tu sesión vence a las 14:35. Si no los guardas antes, se perderán.» Es la única versión que habla de guardar.
4. No guarda nada ni extiende la sesión: solo avisa a tiempo.
5. Se puede cerrar. Cerrado, **esa versión** no vuelve para ese vencimiento durante la sesión del navegador; si después aparecen cambios sin guardar, sí sale la versión con cambios.
6. Va en la pantalla de inicio y, si el proyecto quiere, en el resto de sus pantallas (en *Business*, en el contenedor común de los aplicativos).

### 3.10 Ambientación por temporada

1. La temporada se decide con la **fecha del equipo**; los rangos incluyen ambos extremos y pueden cruzar el año (Navidad: diciembre o hasta el 6 de enero).
2. Si dos coinciden, gana la de mayor prioridad: el 31 de diciembre, Año Nuevo sobre Navidad.
3. Una temporada con país solo aplica allí (mes patrio: Guatemala). El país lo da el proyecto; si no lo tiene, *Business* lo deduce de la zona horaria del navegador (`America/Guatemala` → `GT`).
4. Semana Santa se calcula cada año: del Domingo de Ramos al Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, sin internet ni tablas).
5. Cada minuto se revisa si cambió el día: con la pantalla abierta de un día para otro, la ambientación cambia sola. El año que se muestra en Año Nuevo es el que empieza.
6. El usuario la puede **apagar** desde el menú del usuario (la opción no está a la vista a propósito: es de poco uso). Viene encendida y se recuerda por usuario.
7. **Para probar:** se puede forzar una temporada (o ninguna) sin esperar la fecha; forzada, se muestra aunque el usuario la haya apagado. En *Business*: `#/inicio?temporada=navidad` (`anioNuevo`, `semanaSanta`, `mesPatrio`, `ninguna`).
8. La nieve cae mientras se está en el inicio y se detiene al salir; el navegador la pausa con la pestaña en segundo plano. Los fuegos salen una sola vez por sesión del navegador, la primera vez que se entra al inicio.

### 3.11 Menú del usuario

1. Al abrirse, el foco va a la primera opción. ↑/↓ recorren las opciones en círculo; Inicio/Fin van a la primera/última.
2. Elegir una opción la ejecuta y cierra el menú. La opción con casilla (ambientación) se marca o desmarca **sin cerrar**.
3. Se cierra con `Esc` (el foco vuelve al botón) o con un clic fuera.
4. **Avatar:** iniciales del usuario (dos letras: la inicial de cada una de las dos primeras partes del nombre, separadas por espacio, punto, guion o guion bajo; si es una sola parte, sus dos primeras letras). El color sale del nombre en minúsculas: `hash = (hash × 31 + código) | 0` por cada carácter, y el color es el de la posición `|hash| mod 8` de la lista de [§2.1](#21-colores). Siempre el mismo para la misma persona.
5. **Iniciales de un aplicativo** (insignias del panel de módulos): la primera letra de las dos primeras palabras, sin contar «de, del, la, las, el, los, y, e, o, a, en, para, por, con» («Cuentas de Cobro» → «CC»); con una sola palabra, sus dos primeras letras.

### 3.12 Lo que se recuerda

Todo se guarda **en el equipo, por usuario** (nombre de usuario en minúsculas y sin espacios al inicio ni al final), y debe **sobrevivir al cierre de sesión**: si el proyecto limpia el almacenamiento al salir o al entrar, tiene que conservar las claves de `localStorage` que **empiezan por `inicio`**, igual que conserva la URL de su API:

```ts
const conservar = Object.keys(localStorage)
  .filter((clave) => clave.startsWith('inicio'))
  .map((clave) => [clave, localStorage.getItem(clave)!] as const);
localStorage.clear();
conservar.forEach(([clave, valor]) => localStorage.setItem(clave, valor));
```

| Clave | Dónde | Valor |
|---|---|---|
| `inicioPaneles:<usuario>` | `localStorage` | `{ "porTamano": { "<tamaño>": { "modulos": "…", "preferencias": "…" } }, "limpio": false }`. Valores inválidos se descartan al leer |
| `inicioPaneles:app:<usuario>` | `localStorage` | Id del aplicativo desplegado en el acordeón |
| `inicioPaneles:visita:<usuario>` | `localStorage` | Último día de visita, `AAAA-MM-DD` (saludo según el contexto) |
| `inicioTemporada:<usuario>` | `localStorage` | `1` encendida · `0` apagada |
| `inicioFijados:<usuario>` · `inicioRecientes:<usuario>` | `localStorage` | `[{ "aplicativoId": 12, "pantallaId": 342 }, …]`, con la implementación por defecto (`AccesosService`). Un proyecto puede guardarlos en su API con el mismo servicio reemplazado. (En *Business*: `fijados:` y `recientes:`, con ids y nombres) |
| `inicioTemporadaVista:<id>` | `sessionStorage` | Fuegos o confeti ya mostrados en esta sesión |
| `avisoSesionCerrado` | `sessionStorage` | `<vencimiento>\|<neutro o cambios>` del aviso cerrado |

Si el almacenamiento está bloqueado, nada falla: lo elegido dura mientras la pantalla esté abierta.

---

## 4. Contrato de los componentes

Los componentes del estándar **no conocen** los servicios de ninguna aplicación: reciben los datos por entradas y avisan por salidas. La pantalla de inicio de cada proyecto es la que los conecta con su propia lógica, en los puntos marcados con `PROYECTO`.

> Las dos implementaciones ([§6](#6-implementación-1--angular--tailwind) y [§7](#7-implementación-2--angular--css-puro-sin-tailwind)) parten del código de *Business*, pero desacoplado según este contrato: el aspecto y el comportamiento son los del original; lo que en *Business* sale de sus servicios aquí entra por una entrada.

### 4.1 Datos

```ts
/** Un aplicativo (módulo) del usuario. */
export interface Aplicativo {
  id: number;
  nombre: string;
}

/** Un nodo del árbol de un aplicativo: un grupo (con hijos) o una pantalla (sin hijos). */
export interface NodoPantalla {
  id: number;
  nombre: string;
  hijos: NodoPantalla[];
}

/** Una pantalla que el usuario puede abrir, con su ubicación para listarla y buscarla. */
export interface Pantalla {
  aplicativo: Aplicativo;
  nodo: NodoPantalla;
  nombre: string;
  /** «Aplicativo › Grupo › Subgrupo», sin la pantalla. */
  ubicacion: string;
  /** Nombre y ubicación sin tildes y en minúsculas. Lo llena `aplanarPantallas`. */
  textoBusqueda: string;
}

/** Un fijado o reciente que sigue existiendo. `clave` es única por pantalla (lista y animación). */
export interface AccesoRapido extends Pantalla {
  clave: string;
}

export type EstadoPanel = 'expandido' | 'compacto' | 'oculto';
export type EstadoCarga = 'cargando' | 'listo' | 'error';
```

Los tipos están en [`utilidades/modelos.ts`](angular-tailwind/utilidades/modelos.ts). El estándar trae también las utilidades que no dependen del proyecto: armar la lista de `Pantalla` desde los árboles (`aplanarPantallas`), la búsqueda sin tildes (`normalizarBusqueda`, `coincideBusqueda`), las iniciales y el color del avatar (`inicialesDe`, `inicialesUsuario`, `colorUsuario`), la posición de los paneles flotantes (`posicionFlotante`) y un ejemplo para armar el árbol desde una lista plana con padre (`construirArbol`).

### 4.2 Componentes

| Componente | Entradas | Salidas | Nivel |
|---|---|---|---|
| `<app-panel-modulos>` | `estado: EstadoPanel` · `variante: 'lateral' \| 'capa'` · `aplicativos: Aplicativo[]` · `arboles: Record<number, NodoPantalla[]>` · `pantallas: Pantalla[]` · `carga: EstadoCarga` · `puedeAbrir: (nodo) => boolean` · `aplicativoAbierto: number \| null` | `abrir: Pantalla` · `cambiarEstado: EstadoPanel` · `alternarAplicativo: number` · `reintentar` · `cerrar` | 1 (estados: 2) |
| `<app-arbol-pantallas>` (lo usa el panel de módulos) | `nodos: NodoPantalla[]` · `idActual: number \| null` · `expandirHasta: number[]` · `puedeAbrir` | `seleccionado: NodoPantalla` | 1 |
| `<app-panel-preferencias>` | `estado` · `variante` · `secciones: SeccionPreferencias[]` · `accionRapida: AccionRapida \| null` | `cambiarEstado` · `cerrar` · `accionRapidaElegida` | 1 (estados: 2) |
| `<app-selector-modo-tema>` (sección de preferencias) | `modo: ModoTema` | `cambiar: ModoTema` | 1 |
| `<app-saludo-inicio>` | `usuario: string` · `saludoContexto: string \| null` (clave de traducción) · `temporada: Temporada \| null` · `anio: number` · `variante: 'tarjeta' \| 'linea'` | — | 1 (contexto y temporada: 4) |
| `<app-tiempo-sesion>` | `vence: number \| null` (ms) · `inicio: number \| null` (ms) | — | 1 |
| `<app-accesos-rapidos>` | `fijados: AccesoRapido[]` · `recientes: AccesoRapido[]` · `totalFijados: number` · `maximoFijados = 8` · `cargado: boolean` · `horizontal: boolean` | `abrir` · `fijar` · `quitarFijado` · `borrarRecientes` | 1 |
| `<app-widget-card>` | `titulo` (clave) · `icono` · `estado: 'listo' \| 'cargando' \| 'proximamente'`. Contenido: la acción con el atributo `accion` y el cuerpo con las filas de [§6.3](#63-filas-de-un-widget) | — | 1 |
| `<app-widget-conexion>` (ejemplo) | `conectado: boolean` · `url: string` · `versionWeb` · `versionApi` | `cambiar` | — |
| `<app-widget-atajos>` | — | — | 3 |
| `<app-menu-usuario>` | `usuario` · `empresa` · `estacion` · `acciones: AccionMenu[]` · `ambientacion: boolean \| null` (`null` oculta la opción) | `accion: string` (id) · `cambiarAmbientacion: boolean` · `cerrarSesion` | 1 (ambientación: 4) |
| `<app-buscador-pantallas>` | `abierto` (de dos vías) · `pantallas: Pantalla[]` · `sugeridas: Pantalla[]` | `abrir: Pantalla` | 3 |
| `<app-aviso-sesion>` | `vence: number \| null` · `hayCambios: () => boolean` | — | 4 |
| `<app-decoracion-temporada>` · `<app-bandera-guatemala>` | `tipo` · `temporada` (id) | — | 4 |

```ts
/** Una sección del panel de preferencias: título, ícono de la barra compacta y su contenido. */
export interface SeccionPreferencias {
  id: string;
  icono: string;        // p. ej. 'fa-solid fa-palette'
  etiqueta: string;     // clave de traducción
  plantilla: TemplateRef<unknown>;
  /** Línea divisoria encima de la sección en el panel expandido. */
  separada?: boolean;
  /** Solo en el panel expandido: sin ícono en la barra compacta (p. ej. el tema). */
  soloExpandido?: boolean;
}

/** Modo de la interfaz que elige el usuario: `automatico` sigue al del sistema. */
export type ModoTema = 'claro' | 'oscuro' | 'automatico';

/** Acción directa de la barra compacta de preferencias (no abre panel flotante). */
export interface AccionRapida {
  icono: string;
  etiqueta: string;
}

/** Una opción del menú del usuario (entre «quién y dónde» y «Cerrar sesión»). */
export interface AccionMenu {
  id: string;
  icono: string;
  etiqueta: string;
}
```

Ejemplo de acción rápida para alternar el tema, como en *Business* (las dos claves están en las traducciones):

```ts
protected readonly accionRapida = computed<AccionRapida>(() =>
  this.esOscuro()
    ? { icono: 'fa-solid fa-sun', etiqueta: 'inicio.cambiarModoClaro' }
    : { icono: 'fa-solid fa-moon', etiqueta: 'inicio.cambiarModoOscuro' },
);
```

**Servicios del estándar** (no dependen del proyecto; solo necesitan saber quién es el usuario):

| Servicio | Qué hace | Para iniciarlo |
|---|---|---|
| `EstadoPanelesService` | Estado de cada panel por tamaño, vista limpia, aplicativo abierto en el acordeón, tamaño actual de la ventana | `inicializar(destroyRef, usuario)` al entrar al inicio |
| `TemporadaService` | Temporada de hoy, encendida/apagada, año que empieza, revisión del cambio de día | `inicializar(destroyRef, usuario, { forzar?, pais? })` |
| `AccesosService` | Fijados (hasta 8) y recientes (hasta 5) por usuario en `localStorage`; resuelve lo guardado contra las pantallas de hoy. Es la implementación por defecto: se puede reemplazar por una que guarde en el API, con los mismos métodos | No necesita: cada método recibe el usuario |

### 4.3 Lo que resuelve cada proyecto (`PROYECTO`)

La pantalla de inicio base ([`inicio/inicio.component.ts`](angular-tailwind/inicio/inicio.component.ts)) une los componentes y deja estos puntos marcados con `PROYECTO` para que cada aplicación los complete con su propia estructura:

| Punto | Qué debe entregar o hacer |
|---|---|
| Aplicativos y pantallas | `Aplicativo[]` y el árbol `NodoPantalla[]` de cada uno, con su estado de carga y un `reintentar`. Si su fuente es una lista plana con padre, el estándar trae `construirArbol` como ejemplo |
| Qué se puede abrir | `puedeAbrir(nodo)`: si el usuario tiene una pantalla para ese nodo. Las que no, se ven deshabilitadas |
| Abrir una pantalla | `navegar(pantalla)`: navegar a ella y devolver `true` solo si se llegó (la pantalla base registra entonces el reciente). Si no se puede, avisar con el sistema de mensajes del proyecto |
| Fijados y recientes | Nada, si sirve `AccesosService` (guarda en el equipo). Si se quieren en el API, reemplazar ese servicio |
| Datos del usuario | Usuario, empresa, estación, logo de la empresa y hora de inicio de sesión (ya formateada) |
| Sesión | Hora de vencimiento (y de inicio, para la barra). Si no la conoce, el tiempo y el aviso de sesión no se muestran |
| Cambios sin guardar | `hayCambios()` para el aviso de sesión (opcional; sin él, siempre sale la versión neutra) |
| Modales del proyecto | `hayModalAbierto()`: mientras devuelva `true`, los atajos no actúan |
| Menú del usuario | `accionesMenu` y `alElegirAccion(id)` (en *Business*: cambiar estación y empresa, configurar servidor), y `cerrarSesion()` con su confirmación |
| Preferencias | `secciones` con sus plantillas (en *Business*: tema, color, gestión de preferencias e idioma) y `accionRapida`, si la hay. La base trae dos de ejemplo: el tema y una de configuración con mosaicos |
| Tema | `modoTema` y `esOscuro` con el estado del servicio de tema del proyecto, y `cambiarModoTema(modo)` para aplicarlo. La acción rápida (claro ⇄ oscuro) ya está armada con ellos |
| Widgets | Los que tenga datos reales, con `<app-widget-card>` ([§2.9](#29-widgets)) |
| Debajo del header | Un aviso propio, si lo hay (en *Business*: conexión perdida) |
| Almacenamiento | Conservar las claves de [§3.12](#312-lo-que-se-recuerda) cuando limpia el almacenamiento al iniciar o cerrar sesión |
| País (temporadas) | Código ISO del país de la empresa, si lo tiene |

---

## 5. Contenido de la carpeta

```
├── README.md                              ← este documento
├── angular-tailwind/                      ← implementación 1
│   ├── inicio/                            ← pantalla base (lógica del proyecto marcada con PROYECTO)
│   │   ├── inicio.component.ts
│   │   └── inicio.component.html
│   ├── componentes/                       ← un componente por carpeta (.ts + .html)
│   │   ├── panel-modulos/  arbol-pantallas/  panel-preferencias/
│   │   ├── selector-modo-tema/ (+ .css)
│   │   ├── accesos-rapidos/  buscador-pantallas/  menu-usuario/
│   │   ├── saludo-inicio/  tiempo-sesion/  aviso-sesion/
│   │   ├── widget-card/  widget-atajos/  widget-conexion/
│   │   └── decoracion-temporada/ (+ .css)  bandera-guatemala/
│   ├── servicios/
│   │   ├── estado-paneles.service.ts      ← tres estados, tamaños, vista limpia, acordeón
│   │   ├── accesos.service.ts             ← fijados y recientes (implementación por defecto)
│   │   ├── temporada.service.ts           ← temporada de hoy
│   │   └── temporadas.ts                  ← calendario de temporadas
│   ├── utilidades/
│   │   ├── modelos.ts                     ← tipos de §4.1
│   │   ├── busqueda.ts                    ← normalizar, coincidir y aplanar pantallas
│   │   ├── iniciales.ts                   ← iniciales y color del avatar
│   │   ├── posicion-flotante.ts           ← posición de los paneles flotantes
│   │   └── arbol.ts                       ← ejemplo: árbol desde una lista plana con padre
│   └── tokens/
│       ├── tailwind.config.colores.js     ← colores para theme.extend
│       └── styles.tokens.css              ← variables de color y botones btn-icon/secondary/ghost
├── angular-css-puro/                      ← implementación 2
│   ├── estilos/pantalla-inicio.css        ← toda la pantalla en una hoja global (clases pi-*)
│   ├── inicio/ · componentes/             ← mismos .ts que la implementación 1; .html propios
│   └── servicios/ · utilidades/           ← idénticos a la implementación 1
├── traducciones/                          ← es.json · en.json · de.json · fr.json
└── demo/
    ├── index.html                         ← abrir este: barra de la demo + la pantalla en un marco
    ├── pantalla.html · pantalla.js        ← la pantalla (con la hoja de la implementación 2)
    ├── datos.js · textos.js               ← datos de ejemplo y textos (copia de traducciones/)
    ├── decoracion.css                     ← decoración de temporada (copia del componente)
    └── demo.css · demo.js                 ← solo la barra de la demo
```

Los `.ts`, los servicios, las utilidades y el CSS de la decoración de temporada y de las miniaturas del selector de tema son **idénticos** en las dos implementaciones: solo cambian las plantillas `.html` y los estilos. Si se corrige algo en un `.ts`, se copia a las dos.

---

## 6. Implementación 1 — Angular + Tailwind

### 6.1 Requisitos

| Requisito | Versión de referencia | Para qué |
|---|---|---|
| Angular | 19 o superior (probado en 20.3) | Componentes *standalone*, señales (`input`, `output`, `model`, `viewChild`), bloques `@if`/`@for`/`@switch` y escritura de señales dentro de `effect` |
| `@angular/router` | — | `ActivatedRoute` para `?temporada=` (se puede quitar si no se usa) |
| Tailwind CSS | 3.4 con `darkMode: 'class'` | Clases de las plantillas |
| Tokens de color y botones | [`angular-tailwind/tokens/`](angular-tailwind/tokens/) | Superficies, textos, bordes, marca, estados y `btn-icon`/`btn-secondary`/`btn-ghost` |
| `@ngx-translate/core` | 16 | Pipe `translate` ([§8](#8-traducciones)) |
| Font Awesome Free | 6.7 (`solid` y `regular`) | Íconos |
| Roboto | Google Fonts | Tipografía |

### 6.2 Pasos

1. Copiar al proyecto las carpetas de [`angular-tailwind/`](angular-tailwind/): `inicio/`, `componentes/`, `servicios/` y `utilidades/` (conservando su estructura, porque se importan entre sí con rutas relativas).
2. Agregar los colores de [`tokens/tailwind.config.colores.js`](angular-tailwind/tokens/tailwind.config.colores.js) en `theme.extend` de `tailwind.config.js`, y [`tokens/styles.tokens.css`](angular-tailwind/tokens/styles.tokens.css) al `styles.css` global (después de las directivas `@tailwind`). Si el proyecto ya tiene los tokens del [estándar del login](../diseno-login/README.md), basta con agregar los botones. Incluir las carpetas copiadas en `content` de `tailwind.config.js`.
3. Agregar el bloque `inicio` de [`traducciones/`](traducciones/) a los JSON de ngx-translate del proyecto.
4. Registrar la ruta de la pantalla de inicio con `InicioComponent`.
5. Completar en `inicio.component.ts` (y su `.html`) los puntos `PROYECTO` de [§4.3](#43-lo-que-resuelve-cada-proyecto-proyecto).
6. Conservar las claves `inicio*` de `localStorage` cuando el proyecto limpie el almacenamiento ([§3.12](#312-lo-que-se-recuerda)).
7. Para adoptar solo algunos niveles ([§1.2](#12-niveles-de-adopción)): quitar de `inicio.component.html` las piezas de los niveles que no se usan y sus `imports` del `.ts`. Por ejemplo, sin el nivel 4: quitar `<app-aviso-sesion>` y `<app-decoracion-temporada>`, pasar `[ambientacion]="null"` al menú, y `[temporada]="null"` y `[saludoContexto]="null"` al saludo.

### 6.3 Filas de un widget

Un widget nuevo usa `<app-widget-card>` con **cuatro filas** de dato:

```html
<app-widget-card titulo="miProyecto.ventasHoy" icono="fa-solid fa-cash-register">
  <button accion type="button" class="btn-ghost h-7 shrink-0 px-2 text-xs">Ver</button>
  <dl class="divide-y divide-subtle">
    <div class="flex h-9 items-center justify-between gap-3 text-sm">
      <dt class="text-muted">Etiqueta</dt>
      <dd class="tabular-nums text-primary">Valor</dd>
    </div>
    <!-- … 4 filas en total -->
  </dl>
</app-widget-card>
```

En CSS puro, las mismas filas son `<dl class="pi-widget-filas">`, `<div class="pi-widget-fila">`, `<dt class="pi-widget-etiqueta">`, `<dd class="pi-widget-valor">` y la acción `class="pi-boton-fantasma"`.

---

## 7. Implementación 2 — Angular + CSS puro (sin Tailwind)

### 7.1 Qué cambia

- **Los `.ts` no cambian.** Servicios, utilidades, componentes y la pantalla base son los mismos de la implementación 1.
- **Las plantillas** usan clases propias con el prefijo `pi-` en lugar de las de Tailwind. Los estados que en Tailwind se armaban con `[class]="… ? 'x' : 'y'"` son modificadores: `pi-panel--compacto`, `pi-icono-barra--activo`, `pi-app-fila--abierta`, `pi-opcion--activa`, `pi-tarjeta--tira`, `pi-aviso--cambios`, etc.
- **Todo el CSS está en una sola hoja global**, [`estilos/pantalla-inicio.css`](angular-css-puro/estilos/pantalla-inicio.css): los tokens como variables `--pi-*` en `:root` y `.dark`, una base mínima equivalente al *preflight* de Tailwind (solo dentro de `.pi-inicio` y con `:where()`, para no tocar el resto de la aplicación) y las clases de cada pieza. La demo usa esta misma hoja.
- Los colores que dependen de datos (círculo del saludo, franja de temporada, avatar, confeti y fuegos) van en variables o estilos en línea desde los `.ts`, así que son iguales en las dos implementaciones.

### 7.2 Pasos

1. Copiar las carpetas de [`angular-css-puro/`](angular-css-puro/) igual que en [§6.2](#62-pasos), paso 1.
2. Agregar `estilos/pantalla-inicio.css` a `"styles"` en `angular.json` (o importarla desde el `styles.css` global). No hace falta Tailwind.
3. Seguir los pasos 3 a 7 de [§6.2](#62-pasos).
4. Si un componente se usa fuera de la pantalla de inicio (por ejemplo, el aviso de sesión en el resto de la aplicación), envolverlo en un elemento con la clase `pi-inicio` para que reciba la base de estilos.

### 7.3 Tabla de equivalencias (principales)

| Clase Tailwind (implementación 1) | CSS puro |
|---|---|
| `bg-surface`, `text-primary`, `border-subtle`, `bg-brand/10`… | `rgb(var(--pi-surface))`, `rgb(var(--pi-text-primary))`, `rgb(var(--pi-border-subtle))`, `rgb(var(--pi-brand) / 0.1)`… |
| `dark:` + token | Nada: la variable cambia sola en `.dark` |
| `dark:bg-…` con color fijo (punto del árbol, barra del tiempo) | `.dark .pi-… { … }` |
| `focus:outline-none focus-visible:ring-2 focus-visible:ring-focus` | `.pi-foco` (`outline: 2px solid transparent` y `box-shadow: 0 0 0 2px` el color de foco) |
| `btn-icon` · `btn-secondary` · `btn-ghost` | `.pi-boton-icono` · `.pi-boton-secundario` · `.pi-boton-fantasma` |
| `btn-icon h-10 w-10 p-0` · `h-9 w-9` · `h-8 w-8 p-0` · `h-7 w-7 p-0` | `.pi-boton-icono--40` · `--36` · `--32` · `--28` |
| `text-xs` / `text-sm` / `text-base` / `text-lg` / `text-xl` | `0.75rem/1rem` · `0.875rem/1.25rem` · `1rem/1.5rem` · `1.125rem/1.75rem` · `1.25rem/1.75rem` |
| `rounded` / `-md` / `-lg` / `-xl` / `-full` | `0.25rem` / `0.375rem` / `0.5rem` / `0.75rem` / `9999px` |
| `shadow-sm` / `-lg` / `-xl` / `-2xl` | `var(--pi-sombra-sm)` / `-lg` / `-xl` / `-2xl` (mismos valores de Tailwind) |
| `truncate` | `.pi-truncar` (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`) |
| `sr-only` | `.pi-sr-only` |
| `animate-pulse` | `.pi-pulso` (`opacity` a 0.5 a la mitad, 2 s) |
| `transition-[width] duration-200 ease-out` | `transition: width 200ms ease-out` |
| `transition-transform` (chevrons, mosaicos) | `transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1)` |
| `motion-reduce:…` | `@media (prefers-reduced-motion: reduce) { … }` |
| `grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]` | `grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr))` |
| `group-hover:opacity-100 group-focus-within:opacity-100` (tecla Alt+N) | `.pi-tarjeta:hover .pi-tecla-atajo, .pi-tarjeta:focus-within .pi-tecla-atajo { opacity: 1 }` |
| `empty:hidden` (tiempo de sesión) | `.pi-tiempo-tarjeta:empty { display: none }` |
| `sm:` / `md:` / `2xl:` | `@media (min-width: 640px)` / `768px` / `1536px` |
| `h-dvh` | `height: 100vh; height: 100dvh` |

---

## 8. Traducciones

[`traducciones/`](traducciones/) trae [`es.json`](traducciones/es.json), [`en.json`](traducciones/en.json), [`de.json`](traducciones/de.json) y [`fr.json`](traducciones/fr.json), con la misma estructura que los JSON de ngx-translate. **Todas las claves están en un solo bloque, `inicio`** (85 claves), para combinarlas con las del proyecto sin depender de otros bloques.

- Son los textos de *Business*. Las que allí están en otros bloques (`common`, `dashboard`, `shared`, `labelsLogin`) se juntaron en `inicio` con nombres propios (por ejemplo `common.cerrar` → `inicio.cerrar`, `dashboard.fijados` → `inicio.fijados`).
- `inicio.configuracion` es nueva: es el título de la sección de ejemplo de preferencias.
- `inicio.temaInterfaz` es el título de la sección del tema y `inicio.modoTema` el nombre accesible del grupo de tarjetas («Apariencia»).
- `inicio.cambiarModoClaro` e `inicio.cambiarModoOscuro` no las usan las plantillas: son para la acción rápida de tema ([§4.2](#42-componentes)).
- Los nombres de aplicativos y pantallas **no** se traducen: vienen de la fuente de datos de cada proyecto.

---

## 9. Demo

[`demo/index.html`](demo/index.html) muestra la pantalla completa sin Angular ni instalar nada. Se ve en línea en <https://juanjomayen13.github.io/estandares-ED02/angular/pantalla-inicio/demo/index.html> (GitHub Pages, se actualiza solo con cada cambio en `main`) o se abre con doble clic (necesita internet para la fuente Roboto y los íconos de Font Awesome). Los datos son de ejemplo ([`demo/datos.js`](demo/datos.js)).

- **La pantalla** está en [`demo/pantalla.html`](demo/pantalla.html) y usa **la misma hoja de la implementación 2** ([`angular-css-puro/estilos/pantalla-inicio.css`](angular-css-puro/estilos/pantalla-inicio.css)), con las mismas clases y estructura que sus plantillas. La lógica ([`demo/pantalla.js`](demo/pantalla.js)) es una copia en JavaScript de los servicios y utilidades del estándar.
- **La barra de arriba** es solo de la demo (no es parte del diseño):
  - Tamaño: Ventana, Grande (1600 × 900), Laptop (1366 × 768), Chica (1100 × 760), Tablet (820 × 1180) y Celular (390 × 844). La pantalla va dentro de un marco de ese ancho, así que aplica las reglas de ese tamaño; si no cabe, se ve a escala. A la derecha se indica qué regla está aplicando.
  - Tema claro u oscuro, idioma (es, en, de, fr), temporada (según la fecha, ninguna o una forzada) y aviso de sesión (simula una sesión que vence en 8 minutos, en sus dos versiones).
  - «Reiniciar» borra lo que la demo recordó en el navegador (paneles, fijados, recientes, última visita).
- `demo/textos.js` es copia de [`traducciones/`](traducciones/) y `demo/decoracion.css` es el CSS de la decoración de temporada con `:host` cambiado por `.pi-decoracion`. Si cambian los originales, se regeneran igual.

**Qué se puede probar:** todo el comportamiento de [§3](#3-comportamiento): los tres estados de los paneles con sus reglas por tamaño, los paneles flotantes, las capas y la barra inferior, el acordeón con su árbol y el filtro, el buscador (Ctrl+K, flechas, Enter, Esc), los atajos (Ctrl+B, Ctrl+Shift+L, Alt+1…8, Ctrl+Z), la vista limpia, fijar y quitar con «Deshacer», el menú del usuario con teclado, la ambientación y el cierre del aviso de sesión. Lo que en la aplicación resuelve cada proyecto (abrir una pantalla, configurar el servidor, cerrar sesión) muestra un aviso de la demo arriba al centro; al «abrir» una pantalla, la demo simula que se llegó y la pasa a Recientes.

Particularidades de la demo:

- Elegir una temporada desde la barra vuelve a mostrar su animación de una vez por sesión (fuegos de Año Nuevo), para poder verla las veces que haga falta.
- Si el foco está en la barra de la demo, sus atajos (Ctrl+K, Ctrl+B, Ctrl+Shift+L, Alt+1…8, Ctrl+Z) se reenvían a la pantalla en lugar de ir al navegador.

---

## 10. Checklist de QA

**Nivel 1**

- [ ] Header, paneles y centro ocupan el alto de la ventana; solo el centro y el interior de los paneles hacen scroll.
- [ ] Colores en claro y oscuro iguales a [§2.1](#21-colores); ningún panel con fondo translúcido.
- [ ] Acordeón: un aplicativo a la vez, recordado al volver; grupos que se expanden sin navegar.
- [ ] Filtro: encuentra por cualquier palabra, sin tildes; `Esc` lo limpia.
- [ ] Siluetas mientras carga, «Reintentar» si falla, aviso si no hay aplicativos.
- [ ] Saludo por hora del día con su ícono y colores; fecha en el idioma activo.
- [ ] Tiempo de sesión: colores por nivel, cada segundo en los últimos 10 minutos; sin vencimiento, no aparece.
- [ ] Fijados hasta 8 (el 9.º deshabilitado con su aviso), recientes hasta 5, sin repetidos entre las dos listas.
- [ ] Widgets de una misma fila con la misma altura; la cuadrícula cambia de columnas al compactar un panel.

**Nivel 2**

- [ ] Estado por defecto correcto en 1600, 1366, 1100, 900 y 400 px de ancho.
- [ ] Lo elegido en un tamaño no cambia otro tamaño; se recuerda al volver.
- [ ] En 1100 px, expandir un panel compacta el otro.
- [ ] En tablet, «expandir» abre una capa; en celular, la barra inferior abre y cierra las capas.
- [ ] Paneles flotantes junto al ícono, sin salirse de la ventana; se cierran con clic fuera, `Esc` y al redimensionar.
- [ ] Animación de ancho de 200 ms sin que el contenido se asome; sin animación con «reducir movimiento».
- [ ] Celular: accesos rápidos como tira deslizable con la siguiente tarjeta asomando.

**Nivel 3**

- [ ] Ctrl+K, Ctrl+B, Ctrl+Shift+L y Alt+1…8 hacen lo de [§3.6](#36-atajos-de-teclado); ninguno actúa con un modal encima.
- [ ] Buscador: sugiere accesos sin texto; primero lo que empieza por lo escrito; flechas en círculo; Enter abre.
- [ ] Vista limpia: compacta los paneles, bienvenida en una línea, sin widget de atajos; al apagarla todo vuelve.
- [ ] Quitar un fijado: «Deshacer» 6 s y Ctrl+Z (no mientras se escribe en un campo); el fijado vuelve a su lugar.
- [ ] Las tarjetas se deslizan entre Fijados y Recientes (si el navegador lo soporta).

**Nivel 4**

- [ ] Saludo según el contexto: «de nuevo» al volver el mismo día; lunes y viernes.
- [ ] Temporadas forzadas (`navidad`, `anioNuevo`, `semanaSanta`, `mesPatrio`, `ninguna`): saludo, círculo, franja y animación correctos; apagarla en el menú funciona y se recuerda.
- [ ] Nieve continua sin afectar el rendimiento; fuegos solo la primera vez en la sesión; nada con «reducir movimiento».
- [ ] Aviso de sesión 10 minutos antes; versión con cambios solo si hay trabajo pendiente; cerrado no vuelve para ese vencimiento.

**General**

- [ ] Todos los textos en el idioma activo, incluidos `title` y `aria-label`.
- [ ] Todo se opera con teclado, con anillo de foco visible.
- [ ] Lo recordado sobrevive a cerrar e iniciar sesión.

---

## 11. Observaciones conocidas del original

El estándar replica el original **tal cual**, incluidas estas particularidades. Si se corrige alguna, se corrige aquí y en las dos implementaciones, y se sube la versión.

| # | Observación | Efecto | Corrección sugerida (si se aprueba) |
|---|---|---|---|
| 1 | Los botones de ícono y el fantasma (`btn-icon`, `btn-ghost`) heredan `transition-colors` de la clase base de botones del portal | Su fondo de hover se anima (150 ms) mientras el resto de la pantalla cambia de color al instante | Quitar `transition-colors` de la clase base |
| 2 | «Deshacer» (abajo al centro) y el aviso de sesión (abajo a la derecha) usan la misma distancia al borde inferior | En celular, si coinciden, se enciman | Apilarlos (el segundo encima del primero) |
| 3 | Varios botones y las etiquetas de la bienvenida usan el `title` nativo como ayuda | El tooltip del navegador no sigue el diseño ni el tema | Usar el componente de tooltip del proyecto |
| 4 | El botón del buscador muestra «Ctrl K» también en Mac | En Mac funciona con ⌘K, pero la tecla dice Ctrl | Mostrar «⌘ K» cuando el sistema es Mac |
| 5 | El mosaico «URL del servidor» usa violeta fijo (`violet-*`) | No sigue los tokens; se conservó el color del dashboard anterior | Definir un token o usar el trío `info` |
| 6 | El estado «Próximamente» de la tarjeta de widget no lo usa ningún widget hoy | — | Mantenerlo para widgets nuevos sin datos todavía |
| 7 | El centro lleva `pb-24` en celular, pero `sm:p-8` (desde 640 px) lo pisa | Entre 640 y 767 px de ancho el relleno inferior queda en 32 px y la barra inferior (64 px) tapa el final del contenido | Usar `sm:pb-24` en celular, o el relleno inferior solo cuando hay barra |
| 8 | El texto en inglés de «sin pantallas» (`inicio.sinPantallas`) dice «No diplays available» | Error de tipeo visible | «No screens available» |
| 9 | El relleno inferior con el área segura (`max(16px, env(safe-area-inset-bottom))`) solo aplica por debajo de 640 px fuera de celular, lo que no ocurre | Sin efecto | Quitarlo o moverlo a la barra inferior |
| 10 | Al fijar o quitar dos accesos seguidos, el navegador cancela la transición anterior y rechaza su promesa `ready`, que nadie atiende | Error «Uncaught (in promise) AbortError: Transition was skipped» en la consola (no afecta a la pantalla) | Atender la promesa: `transicion.ready.catch(() => {})`. **Ya aplicado** en el código del estándar |
| 11 | En el selector de tema, el nombre «Automático» no cabe en el ancho de su tarjeta en celular (91 px) ni, en francés y alemán, en el panel de 352 px | El texto se sale de su caja y queda pegado al borde de la tarjeta (sin cortarse ni salirse del borde) | Reducir el texto a 12 px o permitir que pase a dos líneas |

---

## 12. Mantenimiento del estándar

- **Versionado** [SemVer](https://semver.org/lang/es/): MAJOR = cambia el aspecto o el contrato de un componente, MINOR = agrega opciones compatibles, PATCH = corrige sin cambiar el aspecto ni el contrato.
- Todo cambio se aplica a las **dos** implementaciones, a la [especificación](#2-especificación-visual) y a la [demo](#9-demo) en el mismo cambio.
- Cada equipo, al copiar una pieza, anota en un comentario la versión del estándar usada (`<!-- Estándar pantalla de inicio v1.0.0 -->`).

### Historial

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0.0 | 2026-11-24 | Especificación visual, comportamiento, niveles de adopción y contrato de los componentes, tomados de la pantalla de inicio del portal Business. |
| 1.0.0 | 2026-11-25 | Implementaciones Angular + Tailwind y Angular + CSS puro (componentes separados de los servicios de Business según §4), tokens y traducciones en cuatro idiomas. Demo en preparación. |
| 1.0.0 | 2026-11-27 | Demo terminada. Publicado en el repositorio de estándares, en `angular/pantalla-inicio/`. |
| 1.0.0 | 2026-11-27 | Sección «Tema de la interfaz» igual a la de *Business*: componente `<app-selector-modo-tema>` (tarjetas Claro, Oscuro y Automático con miniatura), `ModoTema`, `soloExpandido` en las secciones y la acción rápida claro ⇄ oscuro en la pantalla base. |
