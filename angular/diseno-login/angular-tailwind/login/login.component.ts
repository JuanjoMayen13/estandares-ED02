// Estándar diseño del login v1.0.0
// Componente base: la parte visual es igual al login del portal Business. Lo marcado con "PROYECTO" es la lógica
// de cada aplicación (inicio de sesión, empresas, estaciones, sesión): se reemplaza por la propia.
import { animate, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { VisualBackgroundComponent } from '../visual-background/visual-background.component';
import { BolaArrastrableDirective } from './bola-arrastrable.directive';
// PROYECTO: componentes propios de cada aplicación (ajustar las rutas). Ver README, "Componentes compartidos".
import { ApiConfigComponent } from '../api-config/api-config.component';
import { VersionBadgeComponent } from '../shared/version-badge/version-badge.component';
import { MessagesComponent } from '../shared/messages/messages.component';
import { SpinnerCargaComponent } from '../shared/spinner-carga/spinner-carga.component';

export const loginAnimations = [
  // Animación para el despliegue del menú de idiomas (barra superior).
  // El menú aparece completo de una vez: sin entrada escalonada por idioma, que parecía una carga
  trigger('idiomaDialAnimation', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(-6px) scale(0.97)' }),
      animate(
        '150ms cubic-bezier(0.35, 0, 0.25, 1)',
        style({ opacity: 1, transform: 'translateY(0) scale(1)' }),
      ),
    ]),
    transition(':leave', [
      animate(
        '120ms cubic-bezier(0.35, 0, 0.25, 1)',
        style({ opacity: 0, transform: 'translateY(-6px) scale(0.97)' }),
      ),
    ]),
  ]),
];

// Idiomas disponibles en el selector del login (nombre en su propio idioma, no se traduce)
const IDIOMAS_LOGIN = [
  { codigo: 'es', nombre: 'Español', bandera: 'assets/images/es.png' },
  { codigo: 'en', nombre: 'English', bandera: 'assets/images/us.png' },
  { codigo: 'fr', nombre: 'Français', bandera: 'assets/images/fr.png' },
  { codigo: 'de', nombre: 'Deutsch', bandera: 'assets/images/de.png' },
];

/** Datos mínimos que la plantilla lee de una empresa y de una estación. */
export interface EmpresaLogin {
  empresa: number;
  empresa_Nombre: string;
}

export interface EstacionLogin {
  estacion_Trabajo: number;
  descripcion: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  animations: loginAnimations,
  standalone: true,
  imports: [NgIf, ApiConfigComponent, VisualBackgroundComponent, FormsModule, NgClass, VersionBadgeComponent, NgFor, MessagesComponent, TranslatePipe, SpinnerCargaComponent, BolaArrastrableDirective, AsyncPipe],
})
export class LoginComponent {
  //=== BARRA SUPERIOR: IDIOMA Y TEMA ===//
  isIdiomaDialOpen = false;
  readonly idiomas = IDIOMAS_LOGIN;
  esModoOscuro = document.documentElement.classList.contains('dark');

  //=== FORMULARIO ===//
  usuario = '';
  pass = '';
  guardarDatosSesion = false;
  // Claves de traducción del error de cada campo y del mensaje general
  errores: { usuario?: string; pass?: string; general?: string } = {};
  cargando = false;

  //=== PIE: SERVIDOR DE LA API Y FIRMA ===//
  // PROYECTO: URL de la API configurada y si ya se validó (punto verde) o no (ámbar)
  urlApi = '';
  esValido = false;
  mostrarModalApi = false;
  readonly nombreEmpresa = 'Desarrollo Moderno de Software S.A';

  // Logo de la última empresa elegida en este navegador (null = se muestra el escudo).
  // Con el logo de la empresa: inject(LogoEmpresaService).logo$ (ver logo-empresa.service.ts)
  readonly logoEmpresa$: Observable<string | null> = of(null);

  //=== MODAL DE EMPRESA Y ESTACIÓN ===//
  mostrarModalEmpresaEstacion = false;
  cargandoEmpresas = false;
  cargandoEstaciones = false;
  empresa: EmpresaLogin[] = [];
  estacionTrabajo: EstacionLogin[] = [];
  seleccionados: { empresas?: EmpresaLogin; estaciones?: EstacionLogin } = {};
  // true cuando ya respondió la consulta de estaciones de la empresa seleccionada
  private estacionesConsultadas = false;

  //=== NOTIFICACIÓN (app-messages) ===//
  isVisibleAlerta = false;
  mensajeAlerta = '';

  //=== REFERENCIAS A INPUTS ===//
  //?Se utilizan para acceder directamente a los elementos del DOM asociados a los campos de usuario y contraseña,
  //?permitiendo, cambiar el foco entre ellos al usar las teclas de flecha o manipular su valor.
  @ViewChild('usuarioInput') usuarioInput!: ElementRef<HTMLInputElement>;
  @ViewChild('passInput') passInput!: ElementRef<HTMLInputElement>;

  constructor(private translate: TranslateService) {
    // Precarga las banderas del menú de idiomas: así ya están listas la primera vez que se abre
    this.idiomas.forEach((idioma) => (new Image().src = idioma.bandera));
  }

  //EVENTOS DE TECLADO PARA NAVEGAR ENTRE INPUTS
  onKeyDown(event: KeyboardEvent, inputType: 'usuario' | 'pass') {
    if (event.key === 'ArrowDown') {
      event.preventDefault(); // Previene el comportamiento por defecto de la tecla
      if (inputType === 'usuario') {
        this.passInput.nativeElement.focus(); //Enfoca el siguiente input
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (inputType === 'pass') {
        this.usuarioInput.nativeElement.focus();
      }
    }
  }

  // PROYECTO: en el portal guarda el usuario y limpia los datos de una sesión anterior
  onUsuarioChange(): void {}

  //VALIDACIÓN DE CAMPOS Y LOGIN DIRECTO
  verificarCampos(): void {
    this.errores = {};
    if (!this.usuario) this.errores.usuario = 'labelsLogin.errorUsuarioLogin';
    if (!this.pass) this.errores.pass = 'labelsLogin.errorContraseñaLogin';
    if (!this.errores.usuario && !this.errores.pass) this.iniciarSesion();
  }

  // PROYECTO: inicio de sesión. Mientras responde, `cargando = true` (el botón muestra "Cargando...").
  // Si falla: `errores.general = '<clave de traducción>'`. Si entra: consultar las empresas del usuario.
  private iniciarSesion(): void {}

  onGuardarDatosSesionChange(event: Event): void {
    this.guardarDatosSesion = (event.target as HTMLInputElement).checked;
  }

  //IDIOMA SELECCIONADO EN LA BARRA SUPERIOR (español si no está en la lista)
  get idiomaActual() {
    const codigo = this.translate.currentLang || 'es';
    return this.idiomas.find((idioma) => idioma.codigo === codigo) ?? this.idiomas[0];
  }

  toggleIdiomaDial() {
    this.isIdiomaDialOpen = !this.isIdiomaDialOpen;
  }

  // En el portal lo hace TraduccionService, que además guarda el idioma elegido
  onCambioIdioma(idioma: string) {
    this.translate.use(idioma);
    this.isIdiomaDialOpen = false;
  }

  // En el portal lo hace DarkModeService, que además guarda la preferencia: alterna la clase `dark` de <html>
  toggleModoOscuroElementLogin() {
    this.esModoOscuro = !this.esModoOscuro;
    document.documentElement.classList.toggle('dark', this.esModoOscuro);
  }

  //SERVIDOR DE LA API MOSTRADO EN EL PIE DE LA TARJETA (solo host y puerto)
  get hostServidor(): string {
    if (!this.urlApi) return '';
    try {
      return new URL(this.urlApi).host;
    } catch {
      return this.urlApi;
    }
  }

  // Abre el modal de configuración de la URL de la API (componente propio de cada proyecto)
  alternarSeccionURL() {
    this.mostrarModalApi = !this.mostrarModalApi;
  }

  // PROYECTO: al cerrar el modal de la URL, leer la URL ya guardada
  onConfiguracionTerminada(): void {
    this.mostrarModalApi = false;
  }

  //*SELECCIÓN DE EMPRESA: CARGA SUS ESTACIONES
  seleccionarEmpresa(empresa: EmpresaLogin): void {
    if (this.seleccionados.empresas === empresa) return;
    this.seleccionados.empresas = empresa;
    // La estación elegida pertenecía a la empresa anterior
    delete this.seleccionados.estaciones;
    this.estacionTrabajo = [];
    this.estacionesConsultadas = false;
    // PROYECTO: consultar las estaciones de la empresa con `cargandoEstaciones = true`; al responder,
    // llenar `estacionTrabajo`, poner `estacionesConsultadas = true` y, si hay una sola, seleccionarla.
  }

  //*SELECCIÓN DE ITEM GENÉRICO
  seleccionarItem(section: 'empresas' | 'estaciones', item: any) {
    this.seleccionados[section] = item;
  }

  //AVISO DE EMPRESA SIN ESTACIONES (solo cuando ya respondió la consulta)
  get empresaSinEstaciones(): boolean {
    return (
      this.estacionesConsultadas &&
      !this.cargandoEstaciones &&
      this.estacionTrabajo.length === 0
    );
  }

  //*VALIDA SELECCIONES DE EMPRESA Y ESTACIÓN
  validarSeleccion(): boolean {
    return !!this.seleccionados.empresas && !!this.seleccionados.estaciones;
  }

  // PROYECTO: guardar la sesión (empresa, estación, token) y entrar a la aplicación
  guardarCambios(): void {
    if (!this.validarSeleccion()) return;
  }
}
