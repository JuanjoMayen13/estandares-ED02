# Estándar: Footer (barra de estado móvil)

Barra fija al pie de las pantallas internas de la aplicación móvil. Muestra, sobre un color plano semitransparente, el **copyright y la versión** de la aplicación a la izquierda y **quién está trabajando** —usuario y estación de trabajo— a la derecha.

| | |
|---|---|
| **Versión** | 1.0.0 — 2026-10-16 |
| **Origen** | Widget `Footer` de la aplicación móvil *Business* (Flutter, paquete `business`) |
| **Implementaciones** | 1) Flutter (`BottomAppBar`) |

> **Nombre.** En el equipo se le llama «barra de estado» por equivalencia con el componente web, pero en la aplicación móvil el widget se llama `Footer` y se monta como `bottomNavigationBar`. Este documento usa **Footer** para el widget y «barra de estado» cuando se habla del concepto compartido con la web.

> **Alcance.** Describe **el diseño y el contrato del widget**: cómo se ve, cuánto mide, de dónde saca cada dato y cómo se usa. No incluye la lógica de los temas de color ni la de la sesión; esas viven en sus propios servicios y quedan fuera del estándar.

---

## Índice

1. [Especificación visual](#1-especificación-visual)
2. [Contenido y ubicación](#2-contenido-y-ubicación)
3. [Implementación — Flutter](#3-implementación--flutter)
4. [Diferencias con la barra de estado web](#4-diferencias-con-la-barra-de-estado-web)
5. [Reglas de uso](#5-reglas-de-uso)
6. [Checklist de QA](#6-checklist-de-qa)
7. [Mantenimiento del estándar](#7-mantenimiento-del-estándar)

---

## 1. Especificación visual

Valores reales del widget. Es la **fuente de verdad**: cualquier reimplementación debe reproducirlos.

### 1.1 Anatomía

```
┌─ BottomAppBar · alto 77 · color del tema al 90 % ──────────────────────────┐
│                                                     ┌──────────┐           │
│                                                     │   r33    │ ← usuario │
│  By DMOSOFT, S.A.                                   ├──────────┤           │
│  ┌───────────────────┐                              │ CAJA 01  │ ← estación│
│  │ Versión: v4.11.19 │                              └──────────┘ │    👤   │
│  └───────────────────┘                                      separador      │
└────────────────────────────────────────────────────────────────────────────┘
   ↑ bloque izquierdo, pegado abajo        ↑ bloque derecho, centrado vertical
```

No hay puntos de quiebre: el mismo diseño en todos los anchos. Los textos largos se recortan con puntos suspensivos.

### 1.2 Contenedor

| Propiedad | Valor |
|---|---|
| Widget | `BottomAppBar` |
| Alto | `77` (fijo) |
| Color | Color de footer del tema activo, con **opacidad 0.9** (`withOpacity(0.9)`) |
| Relleno interno | `3` horizontal · `3` vertical |
| Disposición | `Row`: bloque izquierdo, `Spacer`, bloque derecho, separador, ícono |

### 1.3 Bloque izquierdo (copyright y versión)

`Column` con `mainAxisSize: min`, alineada a la izquierda, con un `Spacer` arriba que empuja el contenido **al fondo** de la barra.

| Elemento | Propiedad | Valor |
|---|---|---|
| Copyright | Texto | `By DMOSOFT, S.A.` (fijo, no se traduce) |
| Copyright | Color / tamaño | `Colors.white70` / `10` |
| Separación | — | `SizedBox(height: 2)` |
| Insignia de versión | Texto | `Versión: v{UtilitiesService.version}` |
| Insignia de versión | Color / tamaño | `Colors.white` / `12` |
| Insignia de versión | Fondo | `Colors.white` al 10 % |
| Insignia de versión | Relleno / radio | `8` horizontal, `2` vertical / `8` |

### 1.4 Bloque derecho (usuario y estación de trabajo)

`Column` con `mainAxisSize: min`, alineada a la derecha y centrada en vertical. Las dos insignias comparten estilo con la de versión.

| Elemento | Propiedad | Valor |
|---|---|---|
| Insignia | Fondo / relleno / radio | `Colors.white` al 10 % / `8` h, `2` v / `8` |
| Insignia | Color / tamaño de texto | `Colors.white` / `12` |
| Insignia | Overflow | `TextOverflow.ellipsis` (una línea) |
| Usuario | Visibilidad | Solo si `usuario` no está vacío |
| Estación | Visibilidad | Solo si hay estación seleccionada |
| Divisor entre ambas | Valor | `Divider(height: 5, thickness: 5, color: Colors.white70)` — aparece solo junto con la estación |

### 1.5 Separador e ícono

| Elemento | Propiedad | Valor |
|---|---|---|
| Separador vertical | Tamaño / color | `1` × `40` / `Colors.white38` |
| Separador vertical | Margen | `5` horizontal |
| Ícono | Valor | `Icons.person`, `Colors.white` |
| Ícono | Acción | **Ninguna.** Es decorativo: el Footer es informativo (ver [regla 4](#5-reglas-de-uso)) |

### 1.6 Colores

El color **no es un degradado**: es un color plano con opacidad `0.9`. En la aplicación móvil depende del **tema visual activo** (índice `0`–`4`) y del modo claro u oscuro.

| Índice | Claro | Oscuro |
|---|---|---|
| 0 (por defecto) | `#004964` | `#002735` |
| 1 | `#273D15` | `#1C2C0F` |
| 2 | `#1E3A5F` | `#102338` |
| 3 | `#4D2000` | `#331500` |
| 4 | `transparent` | `transparent` |

**La configuración de temas no forma parte del estándar.** En la aplicación móvil el índice lo elige el usuario, lo guarda en `SharedPreferences` y lo resuelve un servicio propio (`AppStyleNotifier.getFooterColor(bool esClaro)`, que se cambia con `cambiarEstilo(int)`). Un proyecto que adopte el Footer **no tiene por qué contar con ese servicio**, así que el [código a compartir](#33-código-a-compartir) trae el **color por defecto —el del índice 0— de forma estática**, en dos constantes. Conectarlo a la configuración de temas propia, si la hay, es reemplazar esas dos constantes y nada más.

Lo mismo aplica al modo claro u oscuro y a la estación de trabajo: el primero sale de la **configuración de temas** y la segunda de la **configuración de la sesión activa**. Ninguno de los dos servicios es parte del estándar; el widget los recibe ya resueltos.

> Con el índice 4 la barra queda **transparente** y el contenido se dibuja sobre el fondo de la pantalla. Es un tema válido, no un error.

### 1.7 Tipografía

Hereda la fuente del tema de la aplicación. Solo se fijan tamaños (`10` y `12`) y colores; no se declara familia ni peso en ningún texto.

---

## 2. Contenido y ubicación

### 2.1 De dónde sale cada dato

| Dato | Origen | Cómo llega |
|---|---|---|
| Usuario | Configuración de la **sesión activa** | Lo pasa la pantalla que monta el Footer |
| Estación de trabajo | Configuración de la **sesión activa** | En la aplicación móvil lo lee el propio widget del Provider (`EstacionTrabajoNotifier`); en el código a compartir llega por parámetro |
| Versión | `UtilitiesService.version` | Constante estática del paquete `core` |
| Copyright | Literal en el código | Fijo |
| Color y modo claro/oscuro | Configuración de **temas** | En la aplicación móvil, `AppStyleNotifier` + `ThemeNotifier`; en el código a compartir, el color por defecto en constantes (ver [§1.6](#16-colores)) |

Si un dato no tiene valor, su insignia **no se muestra**.

### 2.2 Ubicación

Va como **`bottomNavigationBar` del `Scaffold`** de cada pantalla interna.

No va en: la pantalla de inicio de sesión, pantallas públicas, ni dentro de diálogos u hojas inferiores.


---

## 3. Implementación — Flutter

### 3.1 Requisitos

| Requisito | Versión / condición | Si no se cumple |
|---|---|---|
| Flutter / Material 3 | `BottomAppBar` con parámetro `height` | En versiones viejas sin `height`, envolver en `SizedBox(height: 77)` |
| Nada más | El [código a compartir](#33-código-a-compartir) solo usa `flutter/material.dart` | — |

El widget del estándar **no depende de ningún servicio del proyecto**: recibe por parámetro el usuario, la estación, la versión y el modo claro/oscuro. De dónde salen esos datos es decisión de cada proyecto —la sesión activa y la configuración de temas— y queda fuera del estándar.

Para referencia, así los resuelve hoy la aplicación móvil:

| Dato | Servicio en la aplicación móvil |
|---|---|
| Modo claro/oscuro | `ThemeNotifier` (paquete `core`) |
| Color del footer | `AppStyleNotifier.getFooterColor(bool)` (paquete `core`) |
| Estación de trabajo | `EstacionTrabajoNotifier` (paquete `business`) |
| Versión | `UtilitiesService.version` (paquete `core`) |

Esos cuatro se leen con `provider` (`^6.1.2`). El código a compartir **no necesita `provider`**.

`font_awesome_flutter ^10.8.0` está disponible en el proyecto, pero el Footer **no** lo usa: su único ícono es `Icons.person`, de Material.

### 3.2 Archivo

```
business/lib/shared/widgets/layout/footer.dart      ← 153 líneas, clase Footer
```

### 3.3 Código a compartir

Widget completo y autocontenido: solo `flutter/material.dart`, sin providers ni servicios. Recibe por parámetro **los cuatro datos que dibuja** y nada más, así que cada proyecto lo conecta a su propia sesión y a su propia configuración de temas sin tocar el widget.

```dart
import 'package:flutter/material.dart';

/// Color por defecto del Footer: el del índice 0 del tema de la aplicación
/// móvil, en sus variantes clara y oscura.
///
/// Va **estático a propósito**. En la aplicación móvil el color lo resuelve la
/// configuración de temas (el usuario elige entre cinco estilos), pero ese
/// servicio no forma parte del estándar y un proyecto que adopte el Footer no
/// tiene por qué tenerlo. Para engancharlo a una configuración de temas
/// propia, basta reemplazar estas dos constantes.
const Color kFooterColorClaro = Color(0xFF004964);
const Color kFooterColorOscuro = Color(0xFF002735);

class Footer extends StatelessWidget {
  /// Usuario con sesión iniciada. Sale de la **configuración de la sesión
  /// activa** del proyecto. Vacío = no se dibuja su insignia.
  final String usuario;

  /// Descripción de la estación de trabajo seleccionada. También sale de la
  /// **configuración de la sesión activa**. Nula o vacía = no se dibuja ni la
  /// insignia ni el divisor.
  final String? estacionTrabajo;

  /// Versión de la aplicación, sin prefijo (ej. `4.11.19`). En la aplicación
  /// móvil sale de `UtilitiesService.version`.
  final String version;

  /// Modo claro u oscuro. Sale de la **configuración de temas** del proyecto.
  final bool esClaro;

  const Footer({
    super.key,
    required this.usuario,
    required this.estacionTrabajo,
    required this.version,
    this.esClaro = true,
  });

  /// Insignia: fondo blanco al 10 %, radio 8, relleno 8/2, texto blanco de 12
  /// recortado con puntos suspensivos. Las tres insignias son iguales.
  Widget _insignia(String texto) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          texto,
          style: const TextStyle(color: Colors.white, fontSize: 12),
          overflow: TextOverflow.ellipsis,
        ),
      );

  @override
  Widget build(BuildContext context) {
    final bool hayEstacion =
        estacionTrabajo != null && estacionTrabajo!.isNotEmpty;

    return BottomAppBar(
      height: 77,
      color: (esClaro ? kFooterColorClaro : kFooterColorOscuro)
          .withOpacity(0.9),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 3.0, vertical: 3),
        child: Row(
          children: [
            // Copyright y versión, pegados al fondo
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),
                const Text(
                  'By DMOSOFT, S.A.',
                  style: TextStyle(color: Colors.white70, fontSize: 10),
                ),
                const SizedBox(height: 2),
                _insignia('Versión: v$version'),
              ],
            ),
            const Spacer(),

            // Usuario y estación de trabajo, de la sesión activa
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (usuario.isNotEmpty) _insignia(usuario),
                if (hayEstacion) ...[
                  const Divider(
                      height: 5, thickness: 5, color: Colors.white70),
                  _insignia(estacionTrabajo!),
                ],
              ],
            ),

            // Separador vertical e ícono
            Container(
              width: 1,
              height: 40,
              color: Colors.white38,
              margin: const EdgeInsets.symmetric(horizontal: 5),
            ),
            const Icon(Icons.person, color: Colors.white),
          ],
        ),
      ),
    );
  }
}
```

### 3.4 Uso

Los datos los resuelve la pantalla y el widget solo los dibuja.

```dart
Scaffold(
  // ...
  bottomNavigationBar: Footer(
    // De la configuración de la sesión activa
    usuario: sesion.userName,
    estacionTrabajo: sesion.estacionTrabajo?.nombre,
    // De la configuración de temas
    esClaro: temaClaro,
    // Versión de la aplicación
    version: UtilitiesService.version,
  ),
  floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
)
```

---

## 4. Diferencias con la barra de estado web

Los dos componentes muestran lo mismo conceptualmente, pero **no son equivalentes visuales**. Si algún día se quieren alinear, esta es la distancia real:

| Aspecto | Web (`app-barra-estado`) | Móvil (`Footer`) |
|---|---|---|
| Fondo | Degradado azul `to bottom right` | Color plano del tema, al 90 % |
| Color | Siempre azul | Cinco temas, claro y oscuro, uno transparente |
| Copyright | `2024, Desarrollado por {empresa}.` | `By DMOSOFT, S.A.` |
| Orden | Datos arriba, copyright y versión abajo | Copyright y versión a la izquierda, datos a la derecha |
| Puntos de quiebre | 4 (`sm`, `md`, `xl`) | Ninguno |
| Alto | Según contenido | Fijo, `77` |

---

## 5. Reglas de uso

1. **Un solo Footer por pantalla**, siempre como `bottomNavigationBar` del `Scaffold`. No se repite dentro de los componentes de la pantalla.
2. El **usuario y la estación salen de la sesión activa** y se pasan por parámetro. No se escriben a mano ni se dejan datos de ejemplo.
3. **No modificar**  tamaños, espacios ni la estructura en los módulos. Si algo debe cambiar, se cambia en este estándar y en el widget a la vez.
4. El Footer es **informativo**: no lleva acciones. El ícono de persona no navega.
5. La **versión** se actualiza en `UtilitiesService.version` en cada publicación.
6. El **color lo decide el tema activo**, no la pantalla. Ninguna pantalla pasa un color.
7. Si la pantalla tiene FAB, usar `FloatingActionButtonLocation.centerDocked`, como el resto de los layouts.

---

## 6. Checklist de QA

- [ ] El Footer está **al fondo**, con alto `77`, sin tapar el contenido ni quedar flotando.
- [ ] Se ven **copyright y versión** a la izquierda, pegados al borde inferior.
- [ ] La **versión mostrada es la publicada** (coincide con `UtilitiesService.version`).
- [ ] Se ven **usuario y estación de trabajo** de la sesión activa, cada uno en su insignia.
- [ ] Sin estación seleccionada, **no aparece ni la insignia ni el divisor**.
- [ ] Con usuario vacío, no aparece la insignia de usuario y el resto no se descuadra.
- [ ] Con textos largos (usuario o estación) se recorta con puntos suspensivos y no se rompe la fila.
- [ ] Al **cambiar el tema visual** (los cinco índices) el color del Footer cambia, y con el índice transparente el contenido sigue legible.
- [ ] Al **cambiar entre modo claro y oscuro** el color cambia y el texto blanco sigue legible.
- [ ] Se ve igual en las 20 pantallas que lo usan (mismo alto, color y posición).
- [ ] Con el teclado abierto no deja un hueco ni se superpone al contenido.
- [ ] No aparece en login, pantallas públicas ni diálogos.

---


## 7. Mantenimiento del estándar

- **Versionado** [SemVer](https://semver.org/lang/es/): MAJOR = cambia el aspecto, MINOR = agrega opciones compatibles, PATCH = corrige sin cambiar el aspecto.
- Todo cambio se aplica al widget y a la [especificación](#1-especificación-visual) en el mismo commit.
- Si cambian los colores de footer de `AppStyleNotifier`, se actualiza la tabla de la [§1.6](#16-colores).
- Cada equipo, al copiar el Footer, anota en un comentario la versión del estándar usada (`// Estandar footer v1.0.0`).

### Historial

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0.0 | 2026-10-16 | Primera versión. Diseño del Footer de la aplicación móvil Business, con el código a compartir y la comparación contra la barra de estado web. |
