# Estándares de desarrollo

Estándares compartidos del equipo ED02 para las aplicaciones de los distintos equipos de desarrollo. Hay tres grupos:

- **Interfaz (UI):** describen **cómo se ve y cómo se comporta** un elemento de la interfaz, e incluyen el código de referencia para reproducirlo igual en todas las aplicaciones.
- **Integración con el API:** describen **cómo debe comportarse** una aplicación ante un contrato del API (endpoints, eventos, errores), con una implementación sugerida que cada proyecto adapta.
- **Backend:** describen **cómo se construye** una pieza de servidor (base de datos SQL Server y API), con plantillas listas para copiar.

Hay una carpeta por tecnología. Cada estándar vive en su propio archivo y se versiona por separado.

## Estándares disponibles

### Interfaz

| Estándar | Angular | Flutter | Versión |
|---|---|---|---|
| Componente de carga (engranajes de pantalla completa) | [angular/componente-carga.md](angular/componente-carga.md) | [flutter/componente-carga.md](flutter/componente-carga.md) | 1.0.0 |
| Barra de estado (usuario, estación, empresa, copyright y versión) | [angular/barra-estado.md](angular/barra-estado.md) | [flutter/barra-estado.md](flutter/barra-estado.md) | 1.0.0 |

### Integración con el API

| Estándar | Angular | Flutter | Versión |
|---|---|---|---|
| Sesión única (una sola sesión activa por usuario entre web y móvil) | [angular/sesion-unica.md](angular/sesion-unica.md) | — | 1.0.0 |

### Backend

| Estándar | Capa | Archivo | Versión |
|---|---|---|---|
| Procesos en segundo plano (cola + Job de SQL Server Agent) | SQL + API | [backend/procesos-segundo-plano.md](backend/procesos-segundo-plano.md) | 1.0.0 |

## Estructura del repositorio

```
├── angular/     Estándares de interfaz e integración para aplicaciones web (Angular, con Tailwind o CSS puro)
├── flutter/     Estándares de interfaz e integración para aplicaciones móviles (Flutter)
└── backend/     Estándares de servidor que tocan SQL y API a la vez
    ├── sql/     Estándares solo de base de datos (SQL Server)
    └── api/     Estándares solo del API
```

Las carpetas `backend/sql/` y `backend/api/` se crean cuando llegue su primer estándar. Para decidir dónde va uno de backend:

- Si solo toca la base de datos (procedimientos, tablas, Jobs, permisos), va en `backend/sql/`.
- Si solo toca el API (controladores, servicios, modelos, endpoints), va en `backend/api/`.
- Si para aplicarlo hay que tocar las dos capas a la vez, va en la raíz de `backend/`.

Cuando un estándar se apoya en otro, lo enlaza en lugar de repetir su contenido.

## Cómo usar un estándar

1. Abre el archivo del estándar que necesitas, en la carpeta de tu tecnología.
2. Lee la especificación (en interfaz: colores, medidas y comportamiento; en backend: piezas, nomenclatura y flujo) y las **reglas de uso**.
3. Copia el código de referencia o las plantillas a tu proyecto. Los estándares de Angular traen dos versiones con el mismo resultado visual: con Tailwind y con CSS puro. Elige la que corresponda a tu proyecto.
4. Anota en un comentario la versión del estándar que copiaste (por ejemplo `// Estándar componente de carga v1.0.0` o `-- Estandar procesos segundo plano v1.0.0`) para saber cuándo actualizar.
5. Recorre el **checklist** del estándar antes de entregar.

## Reglas generales

- **No modificar** en cada proyecto lo que el estándar fija (en interfaz: colores, tamaños, tiempos y estructura; en backend: nombres, estructura de tablas, estados y forma de los endpoints). Si algo debe cambiar, se cambia aquí y se publica una nueva versión.
- Un cambio en un estándar se aplica a **todas sus implementaciones a la vez** y se registra en su historial.
- Los estándares de interfaz describen **solo el diseño**: no incluyen lógica propia de ninguna aplicación (sesión, temas de color, navegación).
- Los estándares de backend describen **un patrón general**: los casos reales aparecen solo como ejemplo, y su detalle se documenta aparte.

## Versionado

Cada estándar usa [SemVer](https://semver.org/lang/es/):

- **MAJOR**: cambia el aspecto (interfaz) o el contrato (backend: tablas, parámetros, estados o endpoints).
- **MINOR**: agrega opciones compatibles.
- **PATCH**: corrige sin cambiar el aspecto ni el contrato.

El historial de cambios está al final de cada archivo.

## Cómo proponer un cambio

1. Abre un issue o una solicitud de cambio describiendo qué debe cambiar y por qué.
2. Actualiza, en el mismo cambio, la especificación y todas las implementaciones del estándar.
3. Sube la versión y agrega una línea al historial.

## Atribuciones

Los íconos de los estándares provienen de [Font Awesome Free](https://fontawesome.com/license/free) (íconos bajo licencia CC BY 4.0).
