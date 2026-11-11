# Estándar: Diseño del login

Pantalla de inicio de sesión de las aplicaciones web: fondo azul animado, tarjeta de vidrio con un panel de bienvenida y el formulario, barra de idioma y tema, y el modal para elegir empresa y estación de trabajo. Esta carpeta describe el diseño completo y trae los componentes listos para copiar, en Tailwind y en CSS puro, más una demo para tenerlo siempre de referencia.

| | |
|---|---|
| **Versión** | 1.0.0 — 2026-11-10 |
| **Origen** | Pantalla de login del portal *Business* (Angular 20 + Tailwind CSS 3.4) |
| **Implementaciones** | 1) [Angular + Tailwind](angular-tailwind/) (original) · 2) [Angular + CSS puro](angular-css-puro/) (sin Tailwind) |
| **Demo** | [`demo/index.html`](demo/index.html): HTML, CSS y JS, sin instalar nada ([§9](#9-demo)) |

Las dos implementaciones producen **exactamente el mismo resultado visual**. La 1 es copia literal del portal. La 2 reproduce, propiedad por propiedad, el CSS que Tailwind 3.4 genera para esas clases. Se comprobó midiendo posición, tamaño y estilos calculados de cada pieza en las dos, en modo claro y oscuro, a 1280×800, 1024×600 (modo compacto) y 375×812, y con el modal abierto: no hubo diferencias. La demo usa el mismo CSS de la implementación 2.

**Qué no incluye:** la lógica de inicio de sesión (llamadas al API, tokens, almacenamiento de la sesión) es de cada proyecto; el componente base la deja marcada con `PROYECTO` ([§5.3](#53-contrato-del-componente)). Tampoco incluye el modal de configuración de la URL de la API, que es otro componente. Si la aplicación usa la sesión única, esa lógica debe cumplir también el estándar [Sesión única](../sesion-unica.md) (login con `pPlataforma: 'WEB'` y sin `Authorization`).

---

## Índice

1. [Vista general](#1-vista-general)
2. [Especificación visual](#2-especificación-visual)
3. [Comportamiento](#3-comportamiento)
4. [Contenido de la carpeta](#4-contenido-de-la-carpeta)
5. [Implementación 1 — Angular + Tailwind (original)](#5-implementación-1--angular--tailwind-original)
6. [Implementación 2 — Angular + CSS puro (sin Tailwind)](#6-implementación-2--angular--css-puro-sin-tailwind)
7. [Componentes compartidos y logo de la empresa](#7-componentes-compartidos-y-logo-de-la-empresa)
8. [Traducciones](#8-traducciones)
9. [Demo](#9-demo)
10. [Checklist de QA](#10-checklist-de-qa)
11. [Observaciones conocidas del original](#11-observaciones-conocidas-del-original)
12. [Mantenimiento del estándar](#12-mantenimiento-del-estándar)

---

## 1. Vista general

**Pantallas grandes (desde 1024 px):** tarjeta de dos columnas.

```
┌────────────────────────────────────────────────────────────── [🇪🇸 ES ▾ | ☀] ┐
│                                                                              │
│        ┌──────────────────────────────┬──────────────────────────────┐       │
│        │        ·      ○              │  Iniciar Sesión              │       │
│        │     (   ( 🛡 )   )  ·        │  Ingresa tus credenciales…   │       │
│        │        ○       ·             │  Usuario                     │       │
│        │                              │  [👤 Usuario               ] │       │
│        │                              │  Contraseña                  │       │
│        │  Bienvenido de nuevo         │  [🔒 Contraseña            ] │       │
│        │  Ingresa con tu usuario…     │  Guardar sesión         (○ ) │       │
│        │                              │  [    Iniciar Sesión  →    ] │       │
│        │                              │  ─────────────────────────── │       │
│        │                              │  ● 🌐 servidor        v4.15.2│       │
│        └──────────────────────────────┴──────────────────────────────┘       │
│                  Powered by Desarrollo Moderno de Software S.A               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Celular y tablet (menos de 1024 px):** una columna. El panel de bienvenida se oculta y su ícono (escudo o logo) pasa arriba del título.

```
┌──────────── [🇪🇸 ES ▾ | ☀] ┐
│ ┌──────────────────────┐  │
│ │        [ 🛡 ]         │  │
│ │    Iniciar Sesión    │  │
│ │ Ingresa tus credenc… │  │
│ │ [👤 Usuario        ] │  │
│ │ [🔒 Contraseña     ] │  │
│ │ Guardar sesión  (○ ) │  │
│ │ [ Iniciar Sesión → ] │  │
│ │ ● 🌐 servidor  v4.15 │  │
│ └──────────────────────┘  │
│  Powered by Desarrollo …  │
└───────────────────────────┘
```

| Pieza | Qué es |
|---|---|
| Fondo | Degradado azul (el mismo de la pantalla de arranque) con tres manchas de color difuminadas que se mueven despacio y una rejilla de puntos |
| Barra superior | Arriba a la derecha: menú de idioma (bandera + código) y botón de modo claro/oscuro |
| Tarjeta | Vidrio oscuro translúcido con desenfoque; dos columnas desde 1024 px |
| Panel de bienvenida | Columna izquierda: ilustración de órbitas alrededor del escudo (o del logo de la empresa), título y texto de bienvenida |
| Órbitas | Tres anillos con una bola cada uno, que giran solas; el usuario puede arrastrar cada bola por su anillo |
| Formulario | Título, subtítulo, usuario, contraseña, switch «Guardar sesión» y botón «Iniciar Sesión» |
| Pie de la tarjeta | Servidor de la API (punto de estado + mundito + host; abre la configuración de la URL) e insignia de versión |
| Firma | «Powered by Desarrollo Moderno de Software S.A», debajo de la tarjeta, muy tenue |
| Modal de empresa y estación | Después de iniciar sesión, si hay que elegir: lista de empresas y lista de estaciones de la empresa elegida |

---

## 2. Especificación visual

Valores reales del original (CSS generado por Tailwind 3.4.19 + el CSS propio del componente). Las clases entre comillas invertidas son las del original.

### 2.1 Colores

| Uso | Valor | Origen |
|---|---|---|
| Fondo, claro | `linear-gradient(135deg, #3b4b9a, #172554)` + `radial-gradient(ellipse at 50% 35%, rgba(147,197,253,.16), transparent 60%)` | `visual-background.component.css` |
| Fondo, oscuro | `linear-gradient(135deg, #1e2759, #0a1029)` + `radial-gradient(ellipse at 50% 35%, rgba(99,102,241,.14), transparent 60%)` | ídem |
| Manchas del fondo | `#3b82f6` (560 px), `#6366f1` (480 px) al 50 % (32 % en oscuro); `#f59e0b` (300 px) al 16 % (10 % en oscuro); `blur(90px)` | ídem |
| Rejilla | Puntos `rgba(255,255,255,.13)` de 1 px cada 28 px, desvanecidos hacia los bordes | ídem |
| Tarjeta | `rgb(15 23 42 / .4)` claro · `rgb(2 6 23 / .5)` oscuro; borde `rgb(255 255 255 / .1)`; `blur(24px)` | `bg-slate-900/40` · `dark:bg-slate-950/50` |
| Panel de bienvenida, claro | `linear-gradient(155deg, rgba(59,130,246,.92), rgba(79,70,229,.88) 55%, rgba(30,27,75,.92))` + brillo `radial-gradient(circle at 20% 15%, rgba(255,255,255,.16), transparent 45%)` | `.panel-bienvenida` |
| Panel de bienvenida, oscuro | `linear-gradient(155deg, rgba(37,99,235,.75), rgba(67,56,202,.7) 55%, rgba(15,13,46,.9))` + brillo al 10 % | ídem |
| Títulos | `#ffffff` | `text-white` |
| Subtítulo y textos secundarios | `#cbd5e1` | `text-slate-300` |
| Etiquetas | `#e2e8f0` | `text-slate-200` |
| Íconos y placeholder de los campos | `#94a3b8`; con foco, el ícono pasa a `#93c5fd` | `text-slate-400` · `group-focus-within:text-blue-300` |
| Botón «Iniciar Sesión» | `linear-gradient(135deg, #3b82f6, #4f46e5)`; sombra `0 12px 28px -12px rgba(59,130,246,.8)` | `.boton-ingresar` |
| Errores de campo | Texto `#fca5a5`; borde `rgba(248,113,113,.7)`; fondo `rgba(239,68,68,.08)` | `text-red-300` · `.campo-error` |
| Bolas de la órbita | Blanca `#fff`, ámbar `#fbbf24`, azul `#93c5fd` | `.bola` |
| Punto del servidor | Verde `#34d399` (URL validada) · ámbar `#fbbf24` (sin validar) | `bg-emerald-400` · `bg-amber-400` |
| Mundito | `#60a5fa` (hover `#93c5fd`); oscuro `#93c5fd` (hover `#bfdbfe`) | `text-blue-400` … |
| Firma | `rgb(255 255 255 / .4)`, hover al 70 % | `text-white/40` |

El modal de empresa y estación usa los **tokens de color** del portal (superficie, borde, texto, marca), que cambian solos con el modo oscuro ([§2.9](#29-modal-de-empresa-y-estación)).

### 2.2 Tipografía e íconos

- Fuente **Roboto** (Google Fonts, pesos 400 y 700), tamaño base 16 px, interlineado 1.5.
- Íconos **Font Awesome 6** (sólidos): `fa-user`, `fa-lock`, `fa-shield-halved`, `fa-chevron-down`, `fa-check`, `fa-sun`, `fa-moon`, `fa-arrow-right`, `fa-spinner`, `fa-circle-notch`, `fa-circle-exclamation`, `fa-triangle-exclamation`, `fa-pen`, `fa-building-user`, `fa-building`, `fa-desktop`, `fa-arrow-left`, `fa-arrow-up`.
- El mundito del servidor es un SVG en línea (Heroicons *globe-europe-africa*, 20 px), incluido en la plantilla.

| Texto | Tamaño / interlineado | Peso |
|---|---|---|
| Título «Iniciar Sesión» | 24/32 px; desde 640 px, 30/36 px | 700 |
| Título de bienvenida | 30 px / 1.25 | 700 |
| Texto de bienvenida | 14 px / 1.625, ancho máx. 320 px | 400 |
| Subtítulo, etiquetas, mensajes | 14/20 px | 400 (etiquetas 500) |
| Campos | 16/24 px | 400 |
| Botón | 16/24 px | 600 |
| Código de idioma | 12/16 px, mayúsculas | 600 |
| Servidor | 12/16 px | 400 |
| Firma | 11 px, espaciado 0.025em | 400 |

### 2.3 Contenedor y barra superior

| Pieza | Medidas |
|---|---|
| Contenedor | Alto mínimo 100 vh, contenido centrado. Relleno: 72 px arriba, 16 px a los lados, 24 px abajo; desde 640 px, 32 px a los lados y abajo; desde 1024 px, 64 px arriba |
| Barra | `absolute`, 16 px del borde superior y derecho; píldora con relleno de 4 px, borde blanco al 10 %, fondo `rgb(15 23 42 / .4)`, `blur(12px)`, sombra `shadow-lg`. Va con el scroll para no tapar la tarjeta en pantallas bajas |
| Botón de idioma | 36 px de alto, relleno horizontal 12 px, bandera de 20×14 px (radio 2 px), código y flecha de 10 px que gira 180° al abrir (200 ms) |
| Menú de idiomas | 176 px de ancho, 8 px debajo del botón, alineado a la derecha; radio 16 px, fondo `rgb(15 23 42 / .9)`, `blur(24px)`, sombra `shadow-2xl`. Opciones de 14 px con bandera, nombre en su idioma y ✓ en la actual (fondo blanco al 10 %) |
| Botón de tema | 36×36 px, redondo; sol `#fcd34d` en claro, luna `#a5b4fc` en oscuro |
| Hover de la barra | Fondo blanco al 10 % |

### 2.4 Tarjeta

- Ancho máximo 448 px; desde 1024 px, 896 px en dos columnas iguales.
- Radio 24 px, borde blanco al 10 %, sombra `0 25px 50px -12px rgb(0 0 0 / .4)`, `backdrop-filter: blur(24px)`.
- Entrada: `login-enter` 0.6 s `cubic-bezier(0.22, 1, 0.36, 1)`, de opacidad 0, 16 px más abajo y escala 0.98 a su lugar.

### 2.5 Panel de bienvenida y órbitas

| Pieza | Medidas |
|---|---|
| Panel | Solo desde 1024 px. Relleno 40 px; columna con la ilustración arriba (centrada, ocupa el alto libre, 24 px de relleno vertical) y el texto abajo |
| Órbita | Cuadro de 240×240 px con tres anillos concéntricos de 1 px: exterior (blanco al 16 %), a 34 px (22 %) y a 68 px (30 %) |
| Bolas | Exterior: blanca de 10 px, una vuelta cada 22 s. Media: ámbar de 10 px, 15 s en sentido contrario. Interior: azul de 7 px, 10 s. Brillo `box-shadow` de su color; más grande al pasar el mouse y al arrastrar. Área de agarre 12 px más grande que la bola |
| Núcleo (escudo) | Círculo de 56 px (a 92 px del borde), borde blanco al 35 %, fondo blanco al 16 %, ícono de 25.6 px, resplandor `0 0 40px rgba(147,197,253,.55)` |
| Núcleo (logo) | Círculo de 84 px (a 78 px del borde), fondo blanco, relleno 14 px, logo con `object-fit: contain` |

### 2.6 Formulario

| Pieza | Medidas y estados |
|---|---|
| Columna | Relleno 20 px; desde 640 px, 40 px |
| Encabezado | Centrado; desde 1024 px, alineado a la izquierda. 32 px de margen inferior |
| Ícono del encabezado (menos de 1024 px) | Escudo: cuadro de 56 px, radio 16 px, degradado `#3b82f6 → #4f46e5`, ícono de 24 px. Logo: cuadro blanco de 64 px con 8 px de relleno. Sombra `rgb(30 58 138 / .4)`. 20 px de margen inferior |
| Separación | 20 px entre grupos; 8 px entre etiqueta, campo y mensaje |
| Campo | 48 px de alto, radio 12 px, borde 1 px, relleno 44 px a la izquierda (ícono a 16 px) y 16 px a la derecha, texto blanco de 16 px. Transición de todo 300 ms |
| Campo normal | Fondo blanco al 6 %, borde blanco al 12 % (22 % en hover). Con foco: fondo al 9 %, borde `#60a5fa` y anillo de 4 px `rgba(59,130,246,.22)` |
| Campo con error | Fondo `rgba(239,68,68,.08)`, borde `rgba(248,113,113,.7)`; con foco, borde `#f87171` y anillo `rgba(239,68,68,.2)`. Debajo: ícono `fa-circle-exclamation` + mensaje rojo claro |
| Switch «Guardar sesión» | Fila con 4 px arriba, texto a la izquierda. Pista de 44×24 px (blanco al 15 %; activa `#3b82f6`), bola blanca de 20 px que se desplaza 20 px en 300 ms. Foco de teclado: anillo de 4 px `rgb(96 165 250 / .3)` |
| Botón «Iniciar Sesión» | 48 px de alto, ancho completo, radio 12 px, texto 600, flecha que se mueve 4 px a la derecha en hover. Hover: brillo 1.08, sube 1 px, sombra `0 16px 32px -12px rgba(79,70,229,.9)` |
| Botón cargando | Deshabilitado (cursor de espera), ícono girando + «Cargando...» y un brillo diagonal que lo recorre cada 1.5 s |
| Cargando información | Centrado, 14 px, `fa-circle-notch` girando en `#93c5fd` |
| Error general | Caja con radio 12 px, borde `rgb(248 113 113 / .3)`, fondo `rgb(239 68 68 / .1)`, texto `#fecaca` y `fa-triangle-exclamation` |

### 2.7 Pie de la tarjeta y firma

| Pieza | Medidas |
|---|---|
| Pie | 32 px arriba, línea superior blanca al 10 % y 20 px de relleno; servidor a la izquierda y versión a la derecha |
| Botón del servidor | Relleno 6×10 px, radio 8 px, texto de 12 px. Contenido: punto de 8 px, mundito de 20 px, host recortado con «…» y lápiz de 10 px que aparece al pasar el mouse. Hover: fondo blanco al 10 % |
| Insignia de versión | Mínimo 72 px de ancho, radio 6 px, relleno 4×8 px, 14 px peso 500, fondo y texto con tokens (`surface-raised` / `secondary`), sombra `shadow-sm` |
| Firma | 20 px debajo de la tarjeta, centrada, no se puede seleccionar |

### 2.8 Modo compacto (pantallas de 740 px de alto o menos)

Para que el formulario quepa sin scroll en celulares horizontales y laptops bajas:

- Se oculta el ícono del encabezado.
- Formulario con 24 px de relleno arriba y abajo; encabezado con 20 px de margen; pie con 20 px arriba y 16 px de relleno.
- Panel de bienvenida con 32 px de relleno y la ilustración sin relleno vertical.
- Firma a 8 px de la tarjeta; contenedor con 16 px abajo.

### 2.9 Modal de empresa y estación

| Pieza | Medidas |
|---|---|
| Fondo | `fixed`, `rgb(2 6 23 / .6)`, `blur(4px)`, relleno 12 px (24 px desde 640 px), `z-index: 50` |
| Ventana | Ancho máx. 448 px; 672 px desde 640 px; 896 px desde 1024 px. Alto máximo el de la pantalla. Radio 16 px, borde 1 px, fondo `surface`, sombra `shadow-2xl`. Misma animación de entrada que la tarjeta |
| Cabecera (fija) | Ícono de 48 px (degradado azul, `fa-building-user`), título 16 px (20 px desde 640) peso 600 y subtítulo 12 px (14 px). Línea inferior `border-subtle` |
| Cuerpo (con scroll) | Una columna; dos desde 640 px. Relleno 20 px (32 px). Cada sección: ícono `text-brand`, título 14 px peso 600 y contador redondo |
| Opción | Radio 12 px, borde 1 px, relleno 12×16 px, 14 px. Normal: `surface-alt` y texto `secondary`; hover: borde `strong` y fondo `surface-raised`. Seleccionada: borde `brand`, fondo `brand` al 10 %, texto `primary` 500 y círculo relleno con ✓ |
| Listas | Con dos columnas y pantalla de 640 px de alto o más, cada lista tiene su scroll (224 px; 256 px desde 1024). En celular o pantallas bajas hace scroll el cuerpo completo |
| Sin empresa elegida | Caja punteada con flecha (izquierda en dos columnas, arriba en una) y «Seleccione una empresa primero» |
| Empresa sin estaciones | Aviso de advertencia (`warning-soft` / `warning-line` / `warning-strong`) |
| Pie (fijo) | Fondo `surface-alt`, línea superior `border-subtle`. Botón «Guardar cambios» (`btn-primary`) a lo ancho en celular y a la derecha desde 640 px; deshabilitado (opacidad 50 %) hasta elegir empresa y estación |

Tokens que usa el modal:

| Token | Claro | Oscuro |
|---|---|---|
| `surface` | `#ffffff` | `#171d26` |
| `surface-alt` | `#ffffff` | `#1f2835` |
| `surface-raised` | `#f3f4f6` | `#1f2835` |
| `border` | `#d1d5db` | `#313f54` |
| `border-subtle` | `#e5e7eb` | `#283345` |
| `border-strong` | `#868e9c` | `#5d7194` |
| `text-primary` | `#111827` | `#f3f4f6` |
| `text-secondary` | `#374151` | `#d1d5db` |
| `text-muted` | `#6b7280` | `#9ca3af` |
| `brand` / `brand-hover` / `brand-active` | `#2563eb` / `#1d4ed8` / `#1e40af` | `#60a5fa` / `#3b82f6` / `#2563eb` |
| `on-brand` (texto sobre `brand`) | `#ffffff` | `#0f1319` |
| `focus` (anillo) | `#3b82f6` | `#60a5fa` |
| `warning-soft` / `-line` / `-strong` | `#fffbeb` / `#fde68a` / `#b45309` | `#342e22` / `#654a1d` / `#fcd34d` |

### 2.10 Modo oscuro

El modo oscuro se activa con la clase `dark` en `<html>`. En el login cambian: el degradado y las manchas del fondo (más oscuros y tenues), la tarjeta (`slate-950` al 50 %), el panel de bienvenida, el color del mundito y los tokens del modal. El resto (textos blancos, campos, botón, bolas) es igual en los dos modos porque siempre está sobre fondo oscuro.

### 2.11 Animaciones

| Qué | Cómo |
|---|---|
| Entrada de la tarjeta y del modal | `login-enter`: 0.6 s, `cubic-bezier(0.22, 1, 0.36, 1)` |
| Manchas del fondo | `flotar`: se desplazan 60×40 px y crecen a 1.12 en 20 s (la ámbar en 26 s), ida y vuelta |
| Órbitas | `girar`: 22 s, 15 s (al revés) y 10 s, lineal e infinita |
| Menú de idiomas | Entra en 150 ms y sale en 120 ms (`translateY(-6px) scale(.97)` ↔ normal) |
| Botón cargando | Brillo diagonal `shine` cada 1.5 s |
| Movimiento reducido | Con `prefers-reduced-motion: reduce` se apagan la entrada, las órbitas, las manchas y la inercia de las bolas |

### 2.12 Puntos de quiebre

| Ancho | Cambios |
|---|---|
| Menos de 640 px | Una columna, relleno de 20 px, título de 24 px |
| Desde 640 px (`sm`) | Relleno de 40 px, título de 30 px; modal en dos columnas |
| Desde 1024 px (`lg`) | Tarjeta de 896 px en dos columnas con el panel de bienvenida; se oculta el ícono del encabezado |
| 740 px de alto o menos | Modo compacto ([§2.8](#28-modo-compacto-pantallas-de-740-px-de-alto-o-menos)) |

### 2.13 Accesibilidad

- Campos con `<label for>`, `autocomplete="username"` y `autocomplete="current-password"`.
- Botones de solo ícono con `title` y `aria-label` traducidos; el de idioma con `aria-expanded`; el menú con `role="menu"` y `menuitem`.
- Errores generales y avisos con `role="alert"`.
- Ilustraciones decorativas con `aria-hidden="true"` y logos con `alt=""`.
- Flechas ↑/↓ para pasar entre usuario y contraseña; Enter para iniciar sesión.
- Ver las limitaciones conocidas en [§11](#11-observaciones-conocidas-del-original).

---

## 3. Comportamiento

1. **Idioma:** el menú muestra los idiomas con su nombre en su propio idioma (no se traduce). Al elegir uno se aplica y se cierra el menú. Un clic fuera también lo cierra. Las banderas se precargan al abrir el login para que el menú aparezca completo de una vez.
2. **Tema:** el botón alterna claro y oscuro (en el portal lo guarda `DarkModeService`).
3. **Validación:** al pulsar «Iniciar Sesión» (o Enter) con usuario o contraseña vacíos se marca cada campo vacío en rojo con su mensaje. Si están completos se inicia sesión: el botón pasa a «Cargando...» y se deshabilita.
4. **Después de iniciar sesión** se consultan las empresas («Cargando información adicional…»):
   - Una empresa y una estación: se eligen solas y se entra directo, sin modal.
   - Una empresa con varias estaciones, o varias empresas: se abre el modal.
   - Al elegir una empresa se cargan sus estaciones (spinner); si tiene una sola, queda elegida; si no tiene, aparece el aviso.
   - «Guardar cambios» se habilita al tener empresa y estación.
5. **Servidor:** el pie muestra el host de la URL de la API configurada; el punto es verde si la URL se validó. Al hacer clic se abre la configuración de la URL.
6. **Bolas de la órbita:** cada bola se arrastra con el mouse o el dedo **sobre su propio anillo** (no se sale de él): mientras se arrastra, la órbita se detiene y gira hasta donde apunta el puntero. Al soltarla en movimiento sigue girando con ese impulso y frena poco a poco hasta su velocidad normal; si se suelta quieta, la órbita sigue desde ahí. Es solo decorativo.

| Constante (directiva) | Valor | Efecto |
|---|---|---|
| `VENTANA_VELOCIDAD_MS` | 100 | Milisegundos de movimiento con los que se calcula la velocidad al soltar |
| `FUERZA_LANZAMIENTO` | 0.65 | Fracción de la velocidad del mouse que conserva la bola |
| `VELOCIDAD_MAXIMA` | 1 | Tope de 1000 grados por segundo |
| `FRENADO_MS` | 900 | Qué tan rápido frena (más alto = gira más tiempo) |
| `VELOCIDAD_MINIMA` | 0.005 | Por debajo de esta diferencia con la velocidad normal termina la inercia |

7. **Logo de la empresa (opcional):** si el navegador tiene guardado el logo de la última empresa elegida, reemplaza al escudo en el núcleo de las órbitas y en el ícono del encabezado. Si no, se ve el escudo. Ver [§7.2](#72-logo-de-la-empresa-opcional).

---

## 4. Contenido de la carpeta

```
├── README.md                          ← este documento
├── demo/                              ← demo: abrir index.html
│   ├── index.html
│   ├── login.css                      ← CSS del login (implementación 2, sin :host)
│   ├── fondo.css                      ← fondo animado
│   ├── compartidos.css                ← insignia de versión y spinner
│   ├── demo.css                       ← solo del panel de la demo
│   ├── textos.js                      ← textos en los 4 idiomas
│   ├── demo.js                        ← comportamiento (idioma, tema, validación, modal, órbitas)
│   └── img/                           ← banderas
├── angular-tailwind/                  ← implementación 1
│   ├── login/
│   │   ├── login.component.html
│   │   ├── login.component.css
│   │   ├── login.component.ts         ← componente base (lógica del proyecto marcada con PROYECTO)
│   │   └── bola-arrastrable.directive.ts
│   ├── visual-background/             ← fondo animado (.ts, .html, .css)
│   ├── tokens/
│   │   ├── tailwind.config.colores.js ← colores para theme.extend
│   │   └── styles.tokens.css          ← variables de color y clase btn-primary
│   └── compartidos/                   ← plantillas de la insignia de versión y del spinner
├── angular-css-puro/                  ← implementación 2
│   ├── login/                         ← mismo .ts y directiva; .html y .css propios
│   ├── visual-background/             ← igual que en la implementación 1
│   └── compartidos/                   ← insignia de versión y spinner en CSS puro
├── logo-empresa/
│   └── logo-empresa.service.ts        ← opcional (§7.2)
├── traducciones/                      ← es.json · en.json · fr.json · de.json
└── assets/images/                     ← banderas: es.png · us.png · fr.png · de.png
```

---

## 5. Implementación 1 — Angular + Tailwind (original)

### 5.1 Requisitos

| Requisito | Versión de referencia | Para qué |
|---|---|---|
| Angular | 17 o superior (probado en 20.3) | Componentes *standalone* y bloques `@if` |
| `@angular/animations` + `provideAnimations()` | 20.3 | Animación del menú de idiomas (`[@idiomaDialAnimation]`) |
| Tailwind CSS | 3.4 con `darkMode: 'class'` | Clases de la plantilla |
| Tokens de color | [`angular-tailwind/tokens/`](angular-tailwind/tokens/) | Modal de empresa/estación e insignia de versión |
| `@ngx-translate/core` | 16 | Pipe `translate` ([§8](#8-traducciones)) |
| Font Awesome Free | 6.7 (`solid`) | Íconos |
| Roboto | Google Fonts 400 y 700 | Tipografía |
| `FormsModule` | — | `[(ngModel)]` de los campos |

Fuente en `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
```

### 5.2 Pasos

1. Copiar [`angular-tailwind/login/`](angular-tailwind/login/) y [`angular-tailwind/visual-background/`](angular-tailwind/visual-background/) al proyecto.
2. Agregar los colores de [`tokens/tailwind.config.colores.js`](angular-tailwind/tokens/tailwind.config.colores.js) dentro de `theme.extend` de `tailwind.config.js`, y las variables de [`tokens/styles.tokens.css`](angular-tailwind/tokens/styles.tokens.css) al `styles.css` global (después de las directivas `@tailwind`). Si el proyecto ya tiene tokens, basta con mapear los mismos nombres.
3. Copiar las banderas de [`assets/images/`](assets/images/) a `src/assets/images/`.
4. Agregar las claves de [`traducciones/`](traducciones/) a los JSON de ngx-translate del proyecto.
5. Ajustar en `login.component.ts` las rutas de los componentes propios (`app-api-config`, `app-version-badge`, `app-messages`, `app-spinner-carga`) y completar la lógica marcada con `PROYECTO`.
6. Opcional: el logo de la empresa ([§7.2](#72-logo-de-la-empresa-opcional)).

### 5.3 Contrato del componente

[`login.component.ts`](angular-tailwind/login/login.component.ts) es un componente base: la parte visual (animación del menú, idiomas, flechas ↑/↓, precarga de banderas, host del servidor, aviso de empresa sin estaciones) es igual al portal. Lo marcado con `PROYECTO` se reemplaza por la lógica de cada aplicación, respetando lo que la plantilla necesita:

| Miembro | Tipo | Uso en la plantilla |
|---|---|---|
| `isIdiomaDialOpen` | `boolean` | Abre/cierra el menú de idiomas |
| `idiomas`, `idiomaActual` | lista / objeto `{ codigo, nombre, bandera }` | Menú de idiomas |
| `toggleIdiomaDial()`, `onCambioIdioma(codigo)` | métodos | Menú de idiomas |
| `esModoOscuro`, `toggleModoOscuroElementLogin()` | *proyecto* | Botón de tema (alternar la clase `dark` de `<html>`) |
| `usuario`, `pass` | `string` | `[(ngModel)]` de los campos |
| `onUsuarioChange()`, `onKeyDown(e, campo)` | métodos | Cambios y flechas ↑/↓ |
| `errores` | `{ usuario?, pass?, general? }` | Estado de error de cada campo y mensaje general (clave de traducción) |
| `verificarCampos()` | *proyecto* | Valida y llama al inicio de sesión |
| `cargando` | `boolean` | Estado del botón |
| `guardarDatosSesion`, `onGuardarDatosSesionChange(e)` | `boolean` / método | Switch «Guardar sesión» |
| `cargandoEmpresas`, `cargandoEstaciones` | `boolean` | «Cargando información adicional» y spinners del modal |
| `urlApi`, `hostServidor`, `esValido`, `alternarSeccionURL()` | *proyecto* | Pie del servidor y apertura de la configuración de la URL |
| `nombreEmpresa` | `string` | Firma («Desarrollo Moderno de Software S.A») |
| `logoEmpresa$` | `Observable<string \| null>` | Logo en lugar del escudo (data URI o URL) |
| `mostrarModalApi`, `onConfiguracionTerminada()` | *proyecto* | Modal de configuración de la URL (otro componente) |
| `mostrarModalEmpresaEstacion` | `boolean` | Muestra el modal |
| `empresa`, `estacionTrabajo` | listas | Opciones del modal (`empresa_Nombre`, `descripcion`) |
| `seleccionados` | `{ empresas?, estaciones? }` | Opción seleccionada de cada lista |
| `seleccionarEmpresa(e)`, `seleccionarItem('estaciones', e)` | *proyecto* | Elegir empresa (carga sus estaciones) y estación |
| `empresaSinEstaciones` | `boolean` | Aviso de empresa sin estaciones |
| `validarSeleccion()`, `guardarCambios()` | *proyecto* | Habilitar y ejecutar «Guardar cambios» |
| `isVisibleAlerta`, `mensajeAlerta` | *proyecto* | Notificación `<app-messages>` |

---

## 6. Implementación 2 — Angular + CSS puro (sin Tailwind)

### 6.1 Qué cambia

Solo la plantilla y el CSS del componente. Son **iguales** a la implementación 1: `login.component.ts`, la directiva, el fondo (ya es CSS puro), el servicio del logo, las traducciones y las imágenes.

- Las clases de Tailwind se reemplazan por clases con el prefijo `lg-`. Las clases propias del original (`campo`, `boton-ingresar`, `panel-bienvenida`, `orbita`, `bola`, `login-*`…) conservan su nombre.
- Los tokens de color van en el mismo CSS como variables `--lg-*` en `:host` (y `:host-context(.dark)` para el modo oscuro), así que no hace falta tocar `styles.css`.
- Incluye una base mínima equivalente al *preflight* de Tailwind (bordes, márgenes, botones, imágenes) con selectores de elemento simples. No anteponer `:host` a esa base: con encapsulación emulada subiría la especificidad y pisaría las clases del componente.
- Las clases de estado que en Tailwind se armaban con `[ngClass]` ahora son modificadores: `lg-opcion--activa`, `lg-switch-pista--activa`, `lg-servidor-punto--valido`, `lg-chevron--abierto`, etc.

### 6.2 Pasos

1. Copiar [`angular-css-puro/login/`](angular-css-puro/login/) y [`angular-css-puro/visual-background/`](angular-css-puro/visual-background/) al proyecto. No hace falta Tailwind ni tokens globales.
2. Copiar las banderas y las traducciones, y completar la lógica del componente igual que en la implementación 1 ([§5.2](#52-pasos), pasos 3 a 6).
3. Si el proyecto no tiene la insignia de versión o el spinner de sección, usar las réplicas de [`angular-css-puro/compartidos/`](angular-css-puro/compartidos/) ([§7.1](#71-componentes-compartidos)).

### 6.3 Tabla de equivalencias (principales)

| Clase Tailwind (original) | CSS puro |
|---|---|
| `bg-slate-900/40` | `background-color: rgb(15 23 42 / 0.4)` |
| `dark:bg-slate-950/50` | `:host-context(.dark) … { background-color: rgb(2 6 23 / 0.5) }` |
| `border border-white/10` | `border: 1px solid rgb(255 255 255 / 0.1)` |
| `backdrop-blur-sm` / `-md` / `-xl` | `backdrop-filter: blur(4px)` / `blur(12px)` / `blur(24px)` (+ `-webkit-`) |
| `shadow-lg` | `box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |
| `shadow-lg shadow-blue-900/40` | `box-shadow: 0 10px 15px -3px rgb(30 58 138 / 0.4), 0 4px 6px -4px rgb(30 58 138 / 0.4)` |
| `shadow-2xl` / `shadow-2xl shadow-black/40` | `box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)` / `… / 0.4)` |
| `shadow-md` / `shadow-sm` | `0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1)` / `0 1px 2px 0 rgb(0 0 0 / .05)` |
| `rounded-full` / `-3xl` / `-2xl` / `-xl` / `-lg` / `-md` / `-sm` | `9999px` / `1.5rem` / `1rem` / `0.75rem` / `0.5rem` / `0.375rem` / `0.125rem` |
| `text-xs` / `text-sm` / `text-base` / `text-lg` / `text-xl` / `text-2xl` / `text-3xl` | `0.75rem/1rem` · `0.875rem/1.25rem` · `1rem/1.5rem` · `1.125rem/1.75rem` · `1.25rem/1.75rem` · `1.5rem/2rem` · `1.875rem/2.25rem` |
| `leading-tight` / `leading-relaxed` | `line-height: 1.25` / `1.625` |
| `font-medium` / `-semibold` / `-bold` | `font-weight: 500` / `600` / `700` |
| `text-slate-200` / `-300` / `-400` | `rgb(226 232 240)` / `rgb(203 213 225)` / `rgb(148 163 184)` |
| `text-blue-300` / `-400` · `text-red-300` · `text-indigo-300` · `text-amber-300` | `rgb(147 197 253)` / `rgb(96 165 250)` · `rgb(252 165 165)` · `rgb(165 180 252)` · `rgb(252 211 77)` |
| `bg-gradient-to-br from-blue-500 to-indigo-600` | `background-image: linear-gradient(to bottom right, #3b82f6, #4f46e5)` |
| `focus:ring-4` (con `--tw-ring-color`) | `:focus { box-shadow: 0 0 0 4px var(--lg-anillo-campo) }` |
| `focus-visible:ring-2 focus-visible:ring-blue-300/60` | `:focus-visible { box-shadow: 0 0 0 2px rgb(147 197 253 / 0.6) }` |
| `focus:outline-none` | `outline: 2px solid transparent; outline-offset: 2px` |
| `transition-all duration-300` | `transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 300ms` |
| `duration-300` (sola) | `transition-duration: 300ms` (ver [§11](#11-observaciones-conocidas-del-original), punto 3) |
| `space-y-5` / `space-y-2` | `> * + * { margin-top: 1.25rem }` / `0.5rem` |
| `sr-only` | `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0` |
| `truncate` | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` |
| `group-focus-within:text-blue-300` | `.lg-campo-envoltura:focus-within .lg-campo-icono { color: rgb(147 197 253) }` |
| `group-hover:translate-x-1` | `.boton-ingresar:hover .lg-flecha { transform: translateX(0.25rem) }` |
| `peer-focus-visible:ring-4 peer-focus-visible:ring-blue-400/30` | `.lg-switch-input:focus-visible ~ .lg-switch-pista { box-shadow: 0 0 0 4px rgb(96 165 250 / 0.3) }` |
| `sm:` / `lg:` | `@media (min-width: 640px)` / `@media (min-width: 1024px)` |
| `bg-surface`, `text-primary`, `border-subtle`, `bg-brand/10`… | `rgb(var(--lg-surface))`, `rgb(var(--lg-text-primary))`, `rgb(var(--lg-border-subtle))`, `rgb(var(--lg-brand) / 0.1)`… |
| `btn-primary` | `.lg-boton-guardar` ([`login.component.css`](angular-css-puro/login/login.component.css)) |

---

## 7. Componentes compartidos y logo de la empresa

### 7.1 Componentes compartidos

La plantilla usa cuatro componentes del portal; cada proyecto usa los suyos o una réplica:

| Componente | Qué es | En esta carpeta |
|---|---|---|
| `<app-version-badge>` | Botón con la versión de la aplicación; un clic la copia al portapapeles | Plantilla del portal en [`angular-tailwind/compartidos/`](angular-tailwind/compartidos/); réplica en CSS puro en [`angular-css-puro/compartidos/`](angular-css-puro/compartidos/) |
| `<app-spinner-carga>` | Spinner de sección (`@Input() mensaje = 'common.cargandoPuntos'`) | Ídem |
| `<app-messages>` | Notificaciones del portal (alerta) | No incluido |
| `<app-api-config>` | Modal de configuración de la URL de la API | No incluido |

### 7.2 Logo de la empresa (opcional)

Implementa la *Guía técnica: Logo de la empresa en la pantalla de login* (sección Angular; no está en este repositorio): el logo se descarga una sola vez al elegir la empresa, se guarda en el navegador y solo se vuelve a descargar si la empresa cambia de logo. Sin este servicio, `logoEmpresa$` puede ser `of(null)` y el login muestra siempre el escudo.

Depende de dos métodos del portal que cada proyecto adapta:

- `LoginService.empresa$` y `getUrlImagenEmpresaConcatenada()`: la empresa elegida y la URL de su logo.
- `SharedService.isValidImageUrl(url)`: valida que la URL termine en una extensión de imagen.

Código: [`logo-empresa/logo-empresa.service.ts`](logo-empresa/logo-empresa.service.ts).

Para usarlo:

1. En `login.component.ts`, cambiar `of(null)` por `inject(LogoEmpresaService).logo$` en `logoEmpresa$`.
2. Crear el servicio al arrancar la app: `private readonly logoEmpresa = inject(LogoEmpresaService);` en `AppComponent`.
3. **Conservar la clave** `LogoEmpresaService.STORAGE_KEY` en toda limpieza del almacenamiento (cerrar sesión, carga del login), igual que se conserva la URL de la API:

```ts
const logoEmpresa = localStorage.getItem(LogoEmpresaService.STORAGE_KEY);
localStorage.clear();
sessionStorage.clear();
if (logoEmpresa) {
  localStorage.setItem(LogoEmpresaService.STORAGE_KEY, logoEmpresa);
}
```

4. El servidor de las imágenes debe permitir que el navegador lea la imagen: mismo dominio que la web o encabezado `Access-Control-Allow-Origin`. Si no, la descarga falla en silencio y se ve el escudo.

---

## 8. Traducciones

Las claves que usa el login, en los cuatro idiomas del portal, están en [`traducciones/`](traducciones/): [`es.json`](traducciones/es.json), [`en.json`](traducciones/en.json), [`fr.json`](traducciones/fr.json) y [`de.json`](traducciones/de.json). Tienen la misma estructura que los JSON de ngx-translate (`labelsLogin`, `common`, `shared`), así que se combinan con los del proyecto.

`labelsLogin.ErrorConexionAPI`, `ErrorAutenticacion`, `sinEmpresasAsignadas` y `errorServidorLogin` son los mensajes generales que el flujo pone en `errores.general`.

---

## 9. Demo

[`demo/index.html`](demo/index.html) muestra cómo se ve y se comporta el login hoy, sin Angular ni instalar nada. Usa el CSS de la implementación 2 y una copia en JavaScript de la lógica de las bolas; los datos son de ejemplo.

**Cómo verla:** abrir `demo/index.html` en el navegador (doble clic) o publicar la carpeta `demo/` con GitHub Pages. Necesita internet para la fuente Roboto y los íconos de Font Awesome.

- Usuario y contraseña con cualquier texto: simula el inicio de sesión, la carga y el modal de empresa y estación (la tercera empresa no tiene estaciones).
- Idioma, modo oscuro y el arrastre de las bolas funcionan como en el portal.
- El panel **Demo** (abajo a la izquierda, no es parte del diseño) muestra el logo de la empresa, cambia el estado del servidor y fuerza el error de autenticación.

`demo/login.css`, `fondo.css` y `compartidos.css` son los CSS de la implementación 2 con `:host` cambiado por el contenedor `.lg-host` de la página (y `:host-context(.dark)` por `.dark .lg-host`). Si cambia el CSS de la implementación 2, se regeneran igual.

---

## 10. Checklist de QA

- [ ] Fondo azul con manchas que se mueven y rejilla de puntos; **sin** franjas blancas al abrir.
- [ ] En 1280×800: tarjeta de 896 px en dos columnas, con el panel de bienvenida a la izquierda.
- [ ] Debajo de 1024 px: una columna, sin panel de bienvenida y con el ícono sobre el título.
- [ ] En 1024×600 y 360×640: el formulario cabe sin scroll (modo compacto).
- [ ] La barra de idioma no tapa la tarjeta en ningún tamaño (va con el scroll).
- [ ] El menú de idiomas aparece completo de una vez, con las banderas cargadas, y se cierra al elegir o al hacer clic fuera.
- [ ] Modo oscuro: cambian el fondo, la tarjeta, el panel y el modal; los textos se leen bien.
- [ ] Campos vacíos: borde y fondo rojos con su mensaje; al escribir vuelve el estado normal en el siguiente intento.
- [ ] Botón cargando: deshabilitado, «Cargando...» y el brillo diagonal.
- [ ] Las tres bolas se arrastran sobre su anillo; al soltarlas con impulso siguen girando y frenan.
- [ ] Con `prefers-reduced-motion`, no hay animaciones de entrada, órbitas ni manchas.
- [ ] Modal: cabecera y pie fijos; un solo scroll en celular; «Guardar cambios» deshabilitado hasta elegir empresa y estación; aviso de empresa sin estaciones.
- [ ] Textos en el idioma activo (incluidos `title` y `aria-label`).
- [ ] Con logo guardado: el logo reemplaza al escudo sin deformarse; sin logo, el escudo.

---

## 11. Observaciones conocidas del original

El estándar replica el original **tal cual**, incluidas estas particularidades (la implementación 2 también las reproduce). Si se corrige alguna, se corrige aquí y en las dos implementaciones, y se sube la versión.

| # | Observación | Efecto | Corrección sugerida (si se aprueba) |
|---|---|---|---|
| 1 | Los campos tienen `(keydown.enter)="verificarCampos()"` y además el botón es `type="submit"` con `(click)="verificarCampos()"` | Con Enter en un campo, el navegador también envía el formulario y `verificarCampos()` se ejecuta **dos veces**: con usuario y contraseña escritos salen dos peticiones de inicio de sesión | Quitar el `(keydown.enter)` de los campos (o el `(click)` del botón y usar `(ngSubmit)` en el `<form>`) |
| 2 | La sombra de `.boton-ingresar` pisa el `focus-visible:ring-4` de Tailwind | El botón «Iniciar Sesión» no muestra anillo de foco al llegar con Tab | Agregar el anillo en el CSS del componente: `.boton-ingresar:focus-visible { box-shadow: 0 0 0 4px rgb(96 165 250 / 0.4), 0 12px 28px -12px rgba(59, 130, 246, 0.8) }` |
| 3 | Algunos elementos tienen `duration-300` sin `transition-*` (ícono del campo, pista del switch, mundito, firma) y otros perdieron su `transition-colors` (botones de la barra, opciones del menú y del modal) | Los primeros animan sus cambios con la curva `ease` del navegador; los segundos cambian de color sin transición | Usar `transition-colors duration-300` (o ninguna) de forma pareja |
| 4 | Roboto se carga solo en 400 y 700 | `font-medium` (500) y `font-semibold` (600) se dibujan con el peso disponible más cercano | Cargar también 500 y 600, o usar solo 400/700 |
| 5 | El ✓ de la opción seleccionada del modal es `text-white` sobre `bg-brand` | En oscuro el azul de marca es claro y el contraste baja a ~2,5:1 | Usar `text-on-brand` |
| 6 | La firma es `text-white/40` | Contraste bajo, a propósito (debe ser discreta) | — |
| 7 | En modo compacto se oculta el ícono del encabezado | En celulares de 740 px de alto o menos no se ve el logo de la empresa | Mostrarlo más pequeño en lugar de ocultarlo |
| 8 | El menú de idiomas usa `@angular/animations` | Ese paquete está marcado como obsoleto desde Angular 20.2 | Pasar la entrada/salida a `animate.enter` / `animate.leave` o a CSS |
| 9 | El texto del spinner de sección usa `text-gray-600 dark:text-white` | No sigue los tokens de color | Usar `text-muted` |

---

## 12. Mantenimiento del estándar

- **Versionado** [SemVer](https://semver.org/lang/es/): MAJOR = cambia el aspecto, MINOR = agrega opciones compatibles, PATCH = corrige sin cambiar el aspecto.
- Todo cambio se aplica a las **dos** implementaciones, a la [especificación](#2-especificación-visual) y al [demo](#9-demo) en el mismo cambio.
- El trazo SVG del mundito (`d="…"`) no se edita a mano; es copia exacta del original.
- Cada equipo, al copiar el diseño, anota en un comentario la versión del estándar usada (`<!-- Estándar diseño del login v1.0.0 -->`).

### Historial

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0.0 | 2026-11-10 | Primera versión. Réplica exacta del login del portal Business: Angular + Tailwind, Angular + CSS puro y demo HTML. |
