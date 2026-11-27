// Estándar pantalla de inicio v1.0.0 — tipos de datos que reciben los componentes (README §4.1)
import { TemplateRef } from '@angular/core';

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

/**
 * - `expandido`: el panel completo.
 * - `compacto`: barra de íconos de 64 px; cada ícono abre su contenido en un panel flotante.
 * - `oculto`: sin panel; se vuelve a mostrar desde el header.
 */
export type EstadoPanel = 'expandido' | 'compacto' | 'oculto';

export type EstadoCarga = 'cargando' | 'listo' | 'error';

/** Modo de la interfaz que elige el usuario: `automatico` sigue al del sistema. */
export type ModoTema = 'claro' | 'oscuro' | 'automatico';

/** Una sección del panel de preferencias: título, ícono de la barra compacta y su contenido. */
export interface SeccionPreferencias {
  id: string;
  /** Clases del ícono, p. ej. 'fa-solid fa-palette'. */
  icono: string;
  /** Clave de traducción del título. */
  etiqueta: string;
  plantilla: TemplateRef<unknown>;
  /** Línea divisoria encima de la sección en el panel expandido. */
  separada?: boolean;
  /**
   * Solo en el panel expandido: no tiene ícono en la barra compacta (p. ej. el tema, que ahí es
   * la acción rápida claro ⇄ oscuro).
   */
  soloExpandido?: boolean;
}

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
