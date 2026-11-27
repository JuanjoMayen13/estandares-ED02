// Estándar pantalla de inicio v1.0.0 — widget de atajos de teclado (README §2.9), nivel 3
import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { WidgetCardComponent } from '../widget-card/widget-card.component';

/**
 * Los atajos de teclado de la pantalla de inicio: sin esto nadie los descubre. La pantalla de
 * inicio no lo muestra en celular (no hay teclado) ni en vista limpia.
 */
@Component({
  selector: 'app-widget-atajos',
  standalone: true,
  templateUrl: './widget-atajos.component.html',
  imports: [TranslatePipe, WidgetCardComponent],
  host: { style: 'display: block' },
})
export class WidgetAtajosComponent {
  protected readonly atajos = [
    { texto: 'inicio.buscarPantalla', teclas: ['Ctrl', 'K'] },
    { texto: 'inicio.atajoModulos', teclas: ['Ctrl', 'B'] },
    { texto: 'inicio.vistaLimpia', teclas: ['Ctrl', 'Shift', 'L'] },
    { texto: 'inicio.atajoFijados', teclas: ['Alt', '1…8'] },
  ];
}
