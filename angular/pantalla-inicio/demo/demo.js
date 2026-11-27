// Panel de la demo (index.html). No es parte del estándar: simula tamaños de pantalla y le pide a
// pantalla.html (dentro del marco) que cambie tema, idioma, temporada y aviso de sesión.
(function () {
  'use strict';

  const iframe = document.getElementById('pantalla');
  const marco = document.getElementById('marco');
  const escenario = document.getElementById('escenario');
  const MARGEN = 16;

  const NOMBRES_TAMANO = { grande: 'Grande', laptop: 'Laptop', chica: 'Chica', tablet: 'Tablet', movil: 'Celular' };

  let ancho = 0; // 0 = ocupa todo el escenario
  let alto = 0;

  const enviar = (tipo, valor) => iframe.contentWindow && iframe.contentWindow.postMessage({ tipo, valor }, '*');

  /** Ubica y escala el marco: el tamaño elegido se achica para caber, sin cambiar su ancho real. */
  function ajustarMarco() {
    const disponibleAncho = escenario.clientWidth;
    const disponibleAlto = escenario.clientHeight;

    if (!ancho) {
      Object.assign(marco.style, { width: disponibleAncho + 'px', height: disponibleAlto + 'px', transform: 'none', left: '0px', top: '0px' });
      marco.classList.remove('demo-marco--dispositivo');
      return;
    }

    const espacioAncho = disponibleAncho - MARGEN * 2;
    const espacioAlto = disponibleAlto - MARGEN * 2;
    const escala = Math.min(1, espacioAncho / ancho, espacioAlto / alto);
    Object.assign(marco.style, {
      width: ancho + 'px',
      height: alto + 'px',
      transform: `scale(${escala})`,
      left: Math.max(MARGEN, (disponibleAncho - ancho * escala) / 2) + 'px',
      top: MARGEN + 'px',
    });
    marco.classList.add('demo-marco--dispositivo');
  }

  function marcar(contenedor, atributo, valor) {
    contenedor.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[atributo] === String(valor))));
  }

  // Tamaño
  const tamanos = document.getElementById('tamanos');
  tamanos.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    ancho = Number(b.dataset.ancho);
    alto = Number(b.dataset.alto || 0);
    marcar(tamanos, 'ancho', ancho);
    ajustarMarco();
    enviar('medir');
  });
  marcar(tamanos, 'ancho', 0);
  window.addEventListener('resize', () => {
    ajustarMarco();
    enviar('medir');
  });
  ajustarMarco();

  // Tema
  const temas = document.getElementById('temas');
  temas.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    enviar('tema', b.dataset.tema);
  });

  // Idioma, temporada y aviso de sesión
  const idioma = document.getElementById('idioma');
  const temporada = document.getElementById('temporada');
  const aviso = document.getElementById('aviso');
  idioma.addEventListener('change', () => enviar('idioma', idioma.value));
  temporada.addEventListener('change', () => enviar('temporada', temporada.value));
  aviso.addEventListener('change', () => enviar('aviso', aviso.value));

  // Reiniciar: borra lo que la pantalla recordó y vuelve a cargarla con las opciones elegidas
  document.getElementById('reiniciar').addEventListener('click', () => {
    temporada.value = 'auto';
    aviso.value = 'ninguno';
    enviar('reiniciar');
  });

  // Con el foco en esta barra (p. ej. después de usar una lista), los atajos de la pantalla irían al
  // navegador (Ctrl+K enfoca su barra de búsqueda): se reenvían a la pantalla
  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    const tecla = e.key.toLowerCase();
    const atajo =
      (ctrl && !e.altKey && !e.shiftKey && ['k', 'b', 'z'].includes(tecla)) ||
      (ctrl && e.shiftKey && !e.altKey && tecla === 'l') ||
      (e.altKey && !ctrl && !e.shiftKey && /^Digit[1-8]$/.test(e.code));
    if (!atajo) return;
    e.preventDefault();
    iframe.focus();
    enviar('tecla', { key: e.key, code: e.code, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey });
  });

  // La pantalla avisa cómo quedó: tamaño efectivo, tema e idioma
  window.addEventListener('message', (e) => {
    const datos = e.data || {};
    if (datos.tipo !== 'estado') return;
    document.getElementById('tamanoEfectivo').textContent = 'Regla: ' + (NOMBRES_TAMANO[datos.tamano] || datos.tamano);
    marcar(temas, 'tema', datos.oscuro ? 'oscuro' : 'claro');
    idioma.value = datos.idioma;
  });

  // Al cargar (o recargar) la pantalla, se le aplican las opciones del panel
  iframe.addEventListener('load', () => {
    if (temporada.value !== 'auto') enviar('temporada', temporada.value);
    if (aviso.value !== 'ninguno') enviar('aviso', aviso.value);
  });
})();
