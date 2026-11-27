// Estándar pantalla de inicio v1.0.0 — ejemplo de widget con datos del proyecto (README §2.9)
import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { WidgetCardComponent } from '../widget-card/widget-card.component';

/**
 * A qué servidor está conectado el usuario, si responde y qué versiones corren. Es un ejemplo de
 * widget: los datos los pone cada proyecto (PROYECTO) por entradas.
 */
@Component({
  selector: 'app-widget-conexion',
  standalone: true,
  templateUrl: './widget-conexion.component.html',
  imports: [TranslatePipe, WidgetCardComponent],
  host: { style: 'display: block' },
})
export class WidgetConexionComponent {
  readonly conectado = input(true);
  /** URL completa del servidor (va en el tooltip). */
  readonly url = input('');
  readonly versionWeb = input<string | null>(null);
  readonly versionApi = input<string | null>(null);

  readonly cambiar = output<void>();

  /** Sin protocolo ni la barra final: «192.168.0.10:8080» se lee mejor que «http://…/». */
  protected readonly servidor = computed(() => (this.url() || '').replace(/^https?:\/\//, '').replace(/\/$/, ''));
}
