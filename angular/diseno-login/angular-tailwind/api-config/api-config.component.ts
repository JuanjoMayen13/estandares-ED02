// Estándar diseño del login v1.1.0 — modal de configuración de la URL de la API (opcional)
// Componente base: la parte visual es igual al modal del portal Business. Lo marcado con "PROYECTO" es la lógica
// de cada aplicación (validar la URL contra su API y guardarla): se reemplaza por la propia.
import { Component, EventEmitter, Output } from '@angular/core';
import { DatePipe, NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

/** Datos que muestra la pantalla de "Conexión establecida" (los devuelve el API al validar la URL). */
export interface DatosValidacionApi {
  message: string;
  version: string;
  releaseDate: string;
}

@Component({
  selector: 'app-api-config',
  templateUrl: './api-config.component.html',
  styleUrl: './api-config.component.css',
  standalone: true,
  imports: [TranslatePipe, NgIf, FormsModule, NgClass, DatePipe],
})
export class ApiConfigComponent {
  // Se emite al confirmar la URL: el login cierra el modal (onConfiguracionTerminada)
  @Output() modalCerrado = new EventEmitter<void>();

  // PROYECTO: URL actual de la API (la que ya estaba guardada)
  urlApi = '';
  isVerificando = false;
  esError = false;
  esValido = false;
  // Clave de traducción del resultado de la validación (labelsLogin.URLVacia, URLInvalidaFormato, URLInvalida…)
  mensajeErrorUrl = '';
  mostrarMensajeUrlVerificacion = false;
  // "Presionar para validar y actualizar": se muestra en cuanto el usuario cambia la URL
  mostrarMensajeUrlConfirmacion = false;
  mostrarDetallesExito = false;
  datosValidacion: DatosValidacionApi | null = null;
  fechaConfiguracion = '';

  // PROYECTO: validar la URL contra el API. Mientras responde, `isVerificando = true`.
  // - Si es válida: guardar `datosValidacion` (message, version, releaseDate), poner `fechaConfiguracion`
  //   (fecha y hora actuales) y `mostrarDetallesExito = true`. Validar NO aplica la URL todavía.
  // - Si no: `esError = true`, `mensajeErrorUrl = '<clave de traducción>'` y `mostrarMensajeUrlVerificacion = true`.
  procesarUrl(): void {}

  seleccionarTexto(event: FocusEvent): void {
    const inputElement = event.target as HTMLInputElement;
    inputElement.select(); // Selecciona todo el texto en el input
  }

  onUrlChange(nuevaUrl: string): void {
    this.mostrarMensajeUrlConfirmacion = true;
  }

  // PROYECTO: aplicar (guardar) la URL ya validada; desde aquí las peticiones van al servidor nuevo
  finalizarConfiguracion(): void {
    this.cerrarModal();
  }

  cerrarModal(): void {
    this.mostrarDetallesExito = false; // Reset para la próxima vez
    this.modalCerrado.emit();
  }
}
