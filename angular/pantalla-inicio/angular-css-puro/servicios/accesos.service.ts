// Estándar pantalla de inicio v1.0.0 — fijados y recientes (README §3.5)
import { Injectable } from '@angular/core';
import { AccesoRapido, Pantalla } from '../utilidades/modelos';

/** Lo que se guarda de un acceso: solo ids, para no quedarse con nombres viejos. */
export interface AccesoGuardado {
  aplicativoId: number;
  pantallaId: number;
}

/**
 * Pantallas de acceso rápido de cada usuario, en dos listas:
 * - **Recientes**: las últimas 5 abiertas, en orden de uso; se van reemplazando solas.
 * - **Fijados**: las que el usuario eligió conservar (hasta 8); no se reemplazan, solo se quitan.
 *
 * Implementación por defecto: guarda en este equipo (`localStorage`), por usuario. Un proyecto que
 * prefiera guardarlas en su API puede reemplazar este servicio con los mismos métodos.
 *
 * PROYECTO: si la aplicación limpia el almacenamiento al iniciar o cerrar sesión, debe conservar
 * las claves que empiezan por `PREFIJO_FIJADOS` y `PREFIJO_RECIENTES` (README §3.12).
 */
@Injectable({ providedIn: 'root' })
export class AccesosService {
  static readonly PREFIJO_FIJADOS = 'inicioFijados:';
  static readonly PREFIJO_RECIENTES = 'inicioRecientes:';
  static readonly MAXIMO_FIJADOS = 8;
  static readonly MAXIMO_RECIENTES = 5;

  leerFijados(usuario: string): AccesoGuardado[] {
    return this.leer(AccesosService.PREFIJO_FIJADOS, usuario);
  }

  leerRecientes(usuario: string): AccesoGuardado[] {
    return this.leer(AccesosService.PREFIJO_RECIENTES, usuario);
  }

  /** Registra una pantalla a la que el usuario **llegó**: pasa al primer lugar de recientes. */
  registrarReciente(usuario: string, pantalla: Pantalla): void {
    const nuevo = this.guardadoDe(pantalla);
    const resto = this.leerRecientes(usuario).filter((r) => !this.esLaMisma(r, nuevo));
    this.guardar(AccesosService.PREFIJO_RECIENTES, usuario, [nuevo, ...resto].slice(0, AccesosService.MAXIMO_RECIENTES));
  }

  /** Fija una pantalla al final. Devuelve `false` si ya estaba fijada o se llegó al máximo. */
  fijar(usuario: string, pantalla: Pantalla): boolean {
    const fijados = this.leerFijados(usuario);
    const nuevo = this.guardadoDe(pantalla);
    if (fijados.some((f) => this.esLaMisma(f, nuevo))) return false;
    if (fijados.length >= AccesosService.MAXIMO_FIJADOS) return false;
    this.guardar(AccesosService.PREFIJO_FIJADOS, usuario, [...fijados, nuevo]);
    return true;
  }

  desfijar(usuario: string, pantalla: Pantalla): void {
    const quitado = this.guardadoDe(pantalla);
    this.guardar(
      AccesosService.PREFIJO_FIJADOS,
      usuario,
      this.leerFijados(usuario).filter((f) => !this.esLaMisma(f, quitado)),
    );
  }

  /** Para «Deshacer»: deja los fijados exactamente como estaban. */
  reemplazarFijados(usuario: string, lista: AccesoGuardado[]): void {
    this.guardar(AccesosService.PREFIJO_FIJADOS, usuario, lista.slice(0, AccesosService.MAXIMO_FIJADOS));
  }

  borrarRecientes(usuario: string): void {
    this.guardar(AccesosService.PREFIJO_RECIENTES, usuario, []);
  }

  /**
   * Enlaza lo guardado con las pantallas que el usuario puede abrir hoy y descarta lo que ya no
   * existe (los permisos o el catálogo pueden haber cambiado).
   */
  resolver(lista: AccesoGuardado[], pantallas: Pantalla[]): AccesoRapido[] {
    return lista.flatMap((g) => {
      const pantalla = pantallas.find((p) => p.aplicativo.id === g.aplicativoId && p.nodo.id === g.pantallaId);
      return pantalla ? [{ ...pantalla, clave: `${g.aplicativoId}-${g.pantallaId}` }] : [];
    });
  }

  guardadoDe(pantalla: Pantalla): AccesoGuardado {
    return { aplicativoId: pantalla.aplicativo.id, pantallaId: pantalla.nodo.id };
  }

  esLaMisma(a: AccesoGuardado, b: AccesoGuardado): boolean {
    return a.aplicativoId === b.aplicativoId && a.pantallaId === b.pantallaId;
  }

  private leer(prefijo: string, usuario: string): AccesoGuardado[] {
    try {
      const lista = JSON.parse(localStorage.getItem(this.clave(prefijo, usuario)) ?? '[]');
      return Array.isArray(lista)
        ? lista.filter((g) => Number.isFinite(g?.aplicativoId) && Number.isFinite(g?.pantallaId))
        : [];
    } catch {
      return [];
    }
  }

  private guardar(prefijo: string, usuario: string, lista: AccesoGuardado[]): void {
    try {
      localStorage.setItem(this.clave(prefijo, usuario), JSON.stringify(lista));
    } catch {
      // Almacenamiento bloqueado: los accesos duran lo que dure la pantalla
    }
  }

  private clave(prefijo: string, usuario: string): string {
    return prefijo + (usuario || '').trim().toLowerCase();
  }
}
