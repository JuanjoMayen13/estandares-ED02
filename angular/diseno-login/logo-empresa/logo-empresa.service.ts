import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, firstValueFrom, map, timeout } from 'rxjs';
import { LoginService } from './login.service';
import { SharedService } from './shared.service';

/** Logo guardado en el navegador: la URL de origen (para saber si cambió) y la imagen como data URI. */
interface LogoGuardado {
  url: string;
  data: string;
}

// Tamaño máximo (caracteres del data URI) que se guarda en localStorage, para no llenar el espacio que usa la sesión
const TAMANO_MAXIMO_GUARDADO = 500_000;
// Tiempo máximo de la descarga del logo
const TIEMPO_MAXIMO_DESCARGA_MS = 20_000;

/**
 * Logo de la empresa seleccionada para la pantalla de login (Guía técnica "Logo de la empresa en la pantalla
 * de login", sección 10 – Angular). Es la única fuente del logo: el login lo lee de `logo$`.
 *
 * - Proceso 1 (al crearse): carga el logo guardado en el navegador, sin red ni token. Así el login lo muestra
 *   antes de iniciar sesión.
 * - Proceso 2 (al elegir o cambiar de empresa): compara la URL del logo de la empresa con la guardada y solo
 *   descarga cuando es distinta. Si la empresa no tiene logo, lo limpia.
 *
 * Solo lee la empresa de `LoginService`; no cambia la sesión ni otras claves del storage. La clave del logo se
 * conserva al limpiar el storage (`SessionService.limpiarDatos` y `LoginComponent.eliminarTodosLosDatos`), por eso
 * cerrar sesión no lo borra.
 */
@Injectable({ providedIn: 'root' })
export class LogoEmpresaService {
  /** Clave en localStorage (propia de esta app, por si otras comparten el mismo dominio). */
  static readonly STORAGE_KEY = 'business_empresa_logo';

  private readonly loginService = inject(LoginService);
  private readonly sharedService = inject(SharedService);
  // Sin interceptores: la imagen es pública, no lleva token y un error suyo no debe abrir el modal de sesión ni de error
  private readonly http = new HttpClient(inject(HttpBackend));

  private readonly logoSubject = new BehaviorSubject<string | null>(this.leerGuardado()?.data ?? null);
  /** Logo como data URI listo para `<img [src]>`; `null` si no hay logo. */
  readonly logo$ = this.logoSubject.asObservable();

  // Evita descargar dos veces el mismo logo si la empresa se emite seguido
  private sincronizandoUrl: string | null = null;

  constructor() {
    // Proceso 2: cada vez que cambia la empresa seleccionada (login, autoselección o modal de configuración)
    this.loginService.empresa$
      .pipe(
        map((empresa) => (empresa ? (this.loginService.getUrlImagenEmpresaConcatenada() ?? '') : null)),
        distinctUntilChanged(),
      )
      .subscribe((url) => {
        // Sin empresa (antes de iniciar sesión) no se toca el logo guardado
        if (url !== null) void this.sincronizar(url);
      });
  }

  private async sincronizar(url: string): Promise<void> {
    // La empresa no tiene logo asignado: no dejar el de otra empresa
    if (!url) {
      this.limpiar();
      return;
    }
    if (!this.sharedService.isValidImageUrl(url) || this.sincronizandoUrl === url) return;

    // Misma URL que la guardada: se usa el logo local, sin red
    const guardado = this.leerGuardado();
    if (guardado?.url === url) {
      this.logoSubject.next(guardado.data);
      return;
    }

    // URL distinta: descargar. Si falla se conserva el logo anterior
    this.sincronizandoUrl = url;
    try {
      const data = await this.descargarComoDataUri(url);
      this.guardar({ url, data });
      this.logoSubject.next(data);
    } catch (error) {
      console.warn('[LogoEmpresaService] No se pudo descargar el logo de la empresa:', url, error);
    } finally {
      this.sincronizandoUrl = null;
    }
  }

  /**
   * Descarga el logo y lo devuelve como data URI. Es lo único que depende de cómo se obtiene la imagen.
   *
   * Hoy se usa la URL pública de la imagen (la misma que usan el dashboard y los PDFs). La guía propone el
   * endpoint `v2/Picture/base64`, que aún no existe en el API de GD02. Cuando exista, solo cambia este método:
   * POST `${ApiUrlStore.value}GD02/Apis/api/v2/Picture/base64` con body `{ url }` y el encabezado
   * `Authorization: Bearer ${loginService.getToken()}` puesto a mano (con este mismo `http` sin interceptores,
   * para que un 401 no abra el modal de sesión); la respuesta trae en `data` el Base64 sin prefijo, que se
   * arma como `data:${mime};base64,${data}` con el MIME según la extensión del archivo.
   */
  private async descargarComoDataUri(url: string): Promise<string> {
    const blob = await firstValueFrom(
      this.http.get(url, { responseType: 'blob' }).pipe(timeout(TIEMPO_MAXIMO_DESCARGA_MS)),
    );
    // Evita guardar como logo una página de error u otro contenido
    if (!blob.type.startsWith('image/')) {
      throw new Error(`La respuesta no es una imagen (${blob.type || 'sin tipo'})`);
    }
    return this.blobADataUri(blob);
  }

  private blobADataUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private limpiar(): void {
    try {
      localStorage.removeItem(LogoEmpresaService.STORAGE_KEY);
    } catch {}
    this.logoSubject.next(null);
  }

  private leerGuardado(): LogoGuardado | null {
    try {
      const crudo = localStorage.getItem(LogoEmpresaService.STORAGE_KEY);
      if (!crudo) return null;
      const logo = JSON.parse(crudo) as LogoGuardado;
      return logo?.url && logo?.data ? logo : null;
    } catch {
      return null;
    }
  }

  // Un logo muy pesado no se guarda (se muestra solo mientras la app esté abierta) para no llenar el localStorage
  private guardar(logo: LogoGuardado): void {
    if (logo.data.length > TAMANO_MAXIMO_GUARDADO) {
      console.warn('[LogoEmpresaService] El logo es muy pesado para guardarlo en el navegador; solo se mostrará en esta sesión.');
      return;
    }
    try {
      localStorage.setItem(LogoEmpresaService.STORAGE_KEY, JSON.stringify(logo));
    } catch (error) {
      console.warn('[LogoEmpresaService] No se pudo guardar el logo (¿cuota llena?)', error);
    }
  }
}
