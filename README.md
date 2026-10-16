# Estándares de interfaz

Estándares de diseño y componentes compartidos para las aplicaciones de los distintos equipos de desarrollo. Cada estándar describe **cómo se ve y cómo se comporta** un elemento de la interfaz, e incluye el código de referencia para reproducirlo igual en todas las aplicaciones.

Hay una carpeta por tecnología. Cada estándar vive en su propio archivo y se versiona por separado.

## Estándares disponibles

| Estándar | Angular | Flutter | Versión |
|---|---|---|---|
| Componente de carga (engranajes de pantalla completa) | [angular/componente-carga.md](angular/componente-carga.md) | [flutter/componente-carga.md](flutter/componente-carga.md) | 1.0.0 |
| Barra de estado (usuario, estación, empresa, copyright y versión) | [angular/barra-estado.md](angular/barra-estado.md) | [flutter/barra-estado.md](flutter/barra-estado.md) | 1.0.0 |

## Estructura del repositorio

```
├── angular/     Estándares para aplicaciones web (Angular, con Tailwind o CSS puro)
└── flutter/     Estándares para aplicaciones móviles (Flutter)
```

## Cómo usar un estándar

1. Abre el archivo del estándar que necesitas, en la carpeta de tu tecnología.
2. Lee la **especificación visual** (colores, medidas, comportamiento) y las **reglas de uso**.
3. Copia el código de referencia a tu proyecto. Los estándares de Angular traen dos versiones con el mismo resultado visual: con Tailwind y con CSS puro. Elige la que corresponda a tu proyecto.
4. Anota en un comentario la versión del estándar que copiaste (por ejemplo `// Estándar componente de carga v1.0.0`) para saber cuándo actualizar.
5. Recorre el **checklist de QA** del estándar antes de entregar.

## Reglas generales

- **No modificar** colores, tamaños, tiempos ni la estructura en cada proyecto. Si algo debe cambiar, se cambia aquí y se publica una nueva versión.
- Un cambio en un estándar se aplica a **todas sus implementaciones a la vez** y se registra en su historial.
- Cada estándar describe **solo el diseño**: no incluye lógica propia de ninguna aplicación (sesión, temas de color, navegación).

## Versionado

Cada estándar usa [SemVer](https://semver.org/lang/es/):

- **MAJOR**: cambia el aspecto.
- **MINOR**: agrega opciones compatibles.
- **PATCH**: corrige sin cambiar el aspecto.

El historial de cambios está al final de cada archivo.

## Cómo proponer un cambio

1. Abre un issue o una solicitud de cambio describiendo qué debe cambiar y por qué.
2. Actualiza, en el mismo cambio, la especificación y todas las implementaciones del estándar.
3. Sube la versión y agrega una línea al historial.

## Atribuciones

Los íconos de los estándares provienen de [Font Awesome Free](https://fontawesome.com/license/free) (íconos bajo licencia CC BY 4.0).
