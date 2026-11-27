// Estándar pantalla de inicio v1.0.0 — demo: dibuja la pantalla con las clases de la implementación 2
// (CSS puro) y la misma estructura que sus plantillas. La lógica es una copia en JavaScript de los
// servicios y utilidades del estándar (servicios/*.ts, utilidades/*.ts), con datos de ejemplo.
(function () {
  'use strict';

  const D = window.DATOS;
  const TEXTOS = window.TEXTOS;

  /** Textos propios de la demo: las secciones de ejemplo del panel de preferencias. */
  const TEXTOS_DEMO = {
    es: { idioma: 'Idioma' },
    en: { idioma: 'Language' },
    de: { idioma: 'Sprache' },
    fr: { idioma: 'Langue' },
  };
  const IDIOMAS = [
    { codigo: 'es', nombre: 'Español' },
    { codigo: 'en', nombre: 'English' },
    { codigo: 'de', nombre: 'Deutsch' },
    { codigo: 'fr', nombre: 'Français' },
  ];

  // ======================================================================
  // Utilidades (copia de utilidades/*.ts)
  // ======================================================================
  const esc = (texto) =>
    String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const almacen = {
    leer(clave, area) {
      try { return (area || localStorage).getItem(clave); } catch { return null; }
    },
    guardar(clave, valor, area) {
      try { (area || localStorage).setItem(clave, valor); } catch { /* bloqueado */ }
    },
    quitar(clave) {
      try { localStorage.removeItem(clave); } catch { /* bloqueado */ }
    },
  };

  function normalizarBusqueda(texto) {
    return (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function coincideBusqueda(textoNormalizado, busqueda) {
    return normalizarBusqueda(busqueda).split(/\s+/).filter(Boolean).every((p) => textoNormalizado.includes(p));
  }

  const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'a', 'en', 'para', 'por', 'con']);
  const COLORES_AVATAR = ['#0369a1', '#047857', '#6d28d9', '#be123c', '#0f766e', '#4338ca', '#a21caf', '#b45309'];

  function inicialesDe(texto) {
    const palabras = (texto || '?').split(/\s+/).filter((p) => p && !PALABRAS_VACIAS.has(p.toLowerCase()));
    const letras = palabras.length > 1 ? palabras[0][0] + palabras[1][0] : (palabras[0] ?? '?').slice(0, 2);
    return letras.toUpperCase();
  }

  function inicialesUsuario(usuario) {
    const partes = (usuario || '').trim().split(/[\s._-]+/).filter(Boolean);
    const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : (partes[0] ?? '?').slice(0, 2);
    return letras.toUpperCase();
  }

  function colorUsuario(usuario) {
    const nombre = (usuario || '').trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) hash = (hash * 31 + nombre.charCodeAt(i)) | 0;
    return COLORES_AVATAR[Math.abs(hash) % COLORES_AVATAR.length];
  }

  /** Posición de un panel flotante junto al ícono que lo abrió (utilidades/posicion-flotante.ts). */
  function posicionFlotante(icono, lado, ancho) {
    const altoVentana = window.innerHeight;
    const top = Math.max(12, Math.min(icono.top, altoVentana - 320));
    const left =
      lado === 'derecha'
        ? Math.min(icono.right + 8, window.innerWidth - ancho - 12)
        : Math.max(12, icono.left - ancho - 8);
    return { top, left, maxAlto: altoVentana - top - 12 };
  }

  // ======================================================================
  // Textos
  // ======================================================================
  const estado = {
    idioma: almacen.leer('demoInicio:idioma') || 'es',
    oscuro: document.documentElement.classList.contains('dark'),
    /** Modo elegido: claro, oscuro o automatico (el del sistema). */
    modoTema: 'automatico',
  };

  function t(clave, valores) {
    const tabla = TEXTOS[estado.idioma] || TEXTOS.es;
    let texto = tabla[clave.replace(/^inicio\./, '')] ?? clave;
    for (const [k, v] of Object.entries(valores || {})) texto = texto.split(`{{${k}}}`).join(v);
    return texto;
  }
  const td = (clave) => (TEXTOS_DEMO[estado.idioma] || TEXTOS_DEMO.es)[clave];

  // ======================================================================
  // Datos: aplicativos, pantallas y accesos (lo que en Angular hace la pantalla base + AccesosService)
  // ======================================================================
  const USUARIO = D.usuario.trim().toLowerCase();
  const puedeAbrir = (nodo) => !nodo.sinAcceso;

  /** Todas las pantallas que el usuario puede abrir (utilidades/busqueda.ts → aplanarPantallas). */
  const PANTALLAS = (function () {
    const salida = [];
    const recorrer = (aplicativo, nodos, camino) => {
      for (const nodo of nodos) {
        if (nodo.hijos.length > 0) recorrer(aplicativo, nodo.hijos, [...camino, nodo.nombre]);
        else if (puedeAbrir(nodo)) {
          const ubicacion = camino.join(' › ');
          salida.push({ aplicativo, nodo, nombre: nodo.nombre, ubicacion, textoBusqueda: normalizarBusqueda(`${nodo.nombre} ${ubicacion}`) });
        }
      }
    };
    for (const aplicativo of D.aplicativos) recorrer(aplicativo, D.arboles[aplicativo.id] || [], [aplicativo.nombre]);
    return salida;
  })();

  const PREFIJO_FIJADOS = 'inicioFijados:';
  const PREFIJO_RECIENTES = 'inicioRecientes:';
  const MAXIMO_FIJADOS = 8;
  const MAXIMO_RECIENTES = 5;

  /** Lista guardada; la primera vez, la de ejemplo de datos.js. */
  function leerAccesos(prefijo, ejemplo) {
    const texto = almacen.leer(prefijo + USUARIO);
    if (texto === null) {
      almacen.guardar(prefijo + USUARIO, JSON.stringify(ejemplo));
      return ejemplo.slice();
    }
    try {
      const lista = JSON.parse(texto);
      return Array.isArray(lista) ? lista : [];
    } catch {
      return [];
    }
  }

  function resolverAccesos(lista) {
    return lista.flatMap((g) => {
      const p = PANTALLAS.find((x) => x.aplicativo.id === g.aplicativoId && x.nodo.id === g.pantallaId);
      return p ? [{ ...p, clave: `${g.aplicativoId}-${g.pantallaId}` }] : [];
    });
  }

  function accesos() {
    const guardados = leerAccesos(PREFIJO_FIJADOS, D.fijados);
    const recientes = resolverAccesos(leerAccesos(PREFIJO_RECIENTES, D.recientes)).filter(
      (r) => !guardados.some((f) => f.aplicativoId === r.aplicativo.id && f.pantallaId === r.nodo.id),
    );
    return { total: guardados.length, fijados: resolverAccesos(guardados), recientes };
  }

  // ======================================================================
  // Paneles (copia de servicios/estado-paneles.service.ts)
  // ======================================================================
  const TAMANOS = [
    { tamano: 'grande', desde: 1536 },
    { tamano: 'laptop', desde: 1280 },
    { tamano: 'chica', desde: 1024 },
    { tamano: 'tablet', desde: 768 },
    { tamano: 'movil', desde: 0 },
  ];
  const POR_DEFECTO = {
    grande: { modulos: 'expandido', preferencias: 'expandido' },
    laptop: { modulos: 'expandido', preferencias: 'compacto' },
    chica: { modulos: 'expandido', preferencias: 'compacto' },
    tablet: { modulos: 'compacto', preferencias: 'compacto' },
    movil: { modulos: 'oculto', preferencias: 'oculto' },
  };
  const CLAVE_PANELES = 'inicioPaneles:' + USUARIO;
  const CLAVE_APLICATIVO = 'inicioPaneles:app:' + USUARIO;

  function leerPaneles() {
    try {
      const datos = JSON.parse(almacen.leer(CLAVE_PANELES) || 'null');
      return datos && typeof datos === 'object' ? { porTamano: datos.porTamano || {}, limpio: datos.limpio === true } : { porTamano: {}, limpio: false };
    } catch {
      return { porTamano: {}, limpio: false };
    }
  }

  Object.assign(estado, {
    paneles: leerPaneles(),
    aplicativoAbierto: Number(almacen.leer(CLAVE_APLICATIVO)) || null,
    capa: null,
    /** Lo que maneja la Fase 5 (interacciones); la Fase 4 los dibuja en su estado inicial. */
    filtro: '',
    flotanteModulos: null,
    flotantePreferencias: null,
    menuAbierto: false,
    buscador: { abierto: false, texto: '', activo: 0 },
    deshacer: null,
    temporadaForzada: undefined,
    ambientacion: almacen.leer('inicioTemporada:' + USUARIO) !== '0',
    /** Aviso de sesión simulado desde el panel de la demo: 'ninguno' | 'neutro' | 'cambios'. */
    aviso: 'ninguno',
    venceSesion: D.venceSesion,
  });

  const tamano = () => TAMANOS.find((x) => window.innerWidth >= x.desde).tamano;
  const conPaneles = () => ['grande', 'laptop', 'chica'].includes(tamano());

  function efectivo(panel) {
    const tam = tamano();
    const elegido = estado.paneles.porTamano[tam]?.[panel] ?? POR_DEFECTO[tam][panel];
    if (tam === 'movil') return 'oculto';
    if (tam === 'tablet') return elegido === 'oculto' ? 'oculto' : 'compacto';
    if (estado.paneles.limpio && elegido === 'expandido') return 'compacto';
    return elegido;
  }

  // ======================================================================
  // Temporadas (copia de servicios/temporadas.ts y temporada.service.ts)
  // ======================================================================
  function domingoDePascua(anio) {
    const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return new Date(anio, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
  }
  const mesDia = (f) => `${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
  function semanaSanta(anio) {
    const pascua = domingoDePascua(anio);
    const ramos = new Date(pascua);
    ramos.setDate(pascua.getDate() - 7);
    return { desde: mesDia(ramos), hasta: mesDia(pascua) };
  }

  const TEMPORADAS = [
    {
      id: 'navidad', desde: '12-01', hasta: '01-06', prioridad: 1, saludo: 'temporadaNavidad', icono: 'fa-solid fa-tree',
      colores: { fondo: '#d1fae5', color: '#047857', fondoOscuro: 'rgb(6 78 59 / 0.5)', colorOscuro: '#6ee7b7' },
      franja: 'linear-gradient(to right, #059669, #ef4444, #059669)', decoracion: 'copos',
    },
    {
      id: 'anioNuevo', desde: '12-31', hasta: '01-02', prioridad: 2, saludo: 'temporadaAnioNuevo', icono: 'fa-solid fa-champagne-glasses', emblema: 'anio',
      colores: { fondo: '#fef3c7', color: '#b45309', fondoOscuro: 'rgb(120 53 15 / 0.5)', colorOscuro: '#fcd34d' },
      franja: 'linear-gradient(to right, #fbbf24, #d946ef, #0ea5e9)', decoracion: 'fuegos',
    },
    {
      id: 'mesPatrio', desde: '09-01', hasta: '09-15', paises: ['GT'], prioridad: 1, saludo: 'temporadaMesPatrio', icono: 'fa-solid fa-flag', emblema: 'banderaGT',
      colores: null, franja: 'linear-gradient(to right, #4997D0 33.33%, #ffffff 33.33% 66.66%, #4997D0 66.66%)',
    },
    {
      id: 'semanaSanta', rango: semanaSanta, prioridad: 1, saludo: 'temporadaSemanaSanta', icono: 'fa-solid fa-umbrella-beach',
      colores: { fondo: '#cffafe', color: '#0e7490', fondoOscuro: 'rgb(22 78 99 / 0.5)', colorOscuro: '#67e8f9' },
      franja: 'linear-gradient(to right, #0ea5e9, #67e8f9, #fcd34d)',
    },
  ];
  const PAIS_POR_ZONA = { 'America/Guatemala': 'GT', 'America/El_Salvador': 'SV', 'America/Tegucigalpa': 'HN', 'America/Managua': 'NI', 'America/Costa_Rica': 'CR', 'America/Panama': 'PA', 'America/Mexico_City': 'MX' };

  function temporada() {
    if (estado.temporadaForzada !== undefined) return TEMPORADAS.find((x) => x.id === estado.temporadaForzada) || null;
    if (!estado.ambientacion) return null;
    const dia = mesDia(new Date());
    let pais = null;
    try { pais = PAIS_POR_ZONA[Intl.DateTimeFormat().resolvedOptions().timeZone] || null; } catch { /* sin zona */ }
    const anio = new Date().getFullYear();
    const enRango = (d, desde, hasta) => (desde <= hasta ? d >= desde && d <= hasta : d >= desde || d <= hasta);
    return TEMPORADAS.filter((x) => {
      const r = x.rango ? x.rango(anio) : { desde: x.desde, hasta: x.hasta };
      return enRango(dia, r.desde, r.hasta) && (!x.paises || (pais && x.paises.includes(pais)));
    }).sort((a, b) => b.prioridad - a.prioridad)[0] || null;
  }

  const anioQueEmpieza = () => (mesDia(new Date()) >= '07-01' ? new Date().getFullYear() + 1 : new Date().getFullYear());

  // ======================================================================
  // Saludo (inicio.component.ts → decidirSaludo y saludo-inicio.component.ts)
  // ======================================================================
  estado.saludoContexto = (function decidirSaludo() {
    const ahora = new Date();
    const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
    const clave = 'inicioPaneles:visita:' + USUARIO;
    const anterior = almacen.leer(clave);
    almacen.guardar(clave, hoy);
    if (anterior === hoy) return 'saludoRegreso';
    if (ahora.getDay() === 1) return 'saludoLunes';
    if (ahora.getDay() === 5) return 'saludoViernes';
    return null;
  })();

  const PERIODOS = {
    manana: { clave: 'buenosDias', icono: 'fa-solid fa-sun', colores: { fondo: '#fef3c7', color: '#f59e0b', fondoOscuro: 'rgb(120 53 15 / 0.4)', colorOscuro: '#fcd34d' } },
    tarde: { clave: 'buenasTardes', icono: 'fa-solid fa-cloud-sun', colores: { fondo: '#ffedd5', color: '#f97316', fondoOscuro: 'rgb(124 45 18 / 0.4)', colorOscuro: '#fdba74' } },
    noche: { clave: 'buenasNoches', icono: 'fa-solid fa-moon', colores: { fondo: '#e0e7ff', color: '#6366f1', fondoOscuro: 'rgb(49 46 129 / 0.4)', colorOscuro: '#a5b4fc' } },
  };
  function periodo() {
    const hora = new Date().getHours();
    return PERIODOS[hora >= 5 && hora < 12 ? 'manana' : hora >= 12 && hora < 19 ? 'tarde' : 'noche'];
  }
  function fecha() {
    const texto = new Date().toLocaleDateString(estado.idioma, { weekday: 'long', day: 'numeric', month: 'long' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  // ======================================================================
  // HTML de cada pieza (misma estructura y clases que angular-css-puro/**/*.html)
  // ======================================================================
  const BANDERA_GT = (ancho) => `<span style="display: inline-block; width: ${ancho}px" aria-hidden="true">
      <svg viewBox="0 0 24 15" style="display: block; width: 100%; height: auto" focusable="false">
        <rect width="24" height="15" rx="1.6" fill="#4997D0" /><rect x="8" width="8" height="15" fill="#ffffff" />
        <rect x="0.25" y="0.25" width="23.5" height="14.5" rx="1.45" fill="none" stroke="rgb(0 0 0 / 0.15)" stroke-width="0.5" />
      </svg></span>`;

  function boton(icono, clases, atributos) {
    return `<button type="button" class="${clases}" ${atributos}><i class="${icono}" aria-hidden="true"></i></button>`;
  }

  // ----- Header -----
  function htmlHeader(movil) {
    const limpio = estado.paneles.limpio;
    const logo = D.logoEmpresa
      ? `<img src="${esc(D.logoEmpresa)}" alt="${esc(D.empresa)}" class="pi-logo" draggable="false" />`
      : `<span class="pi-logo pi-logo--generico" aria-hidden="true"><i class="fa-solid fa-building"></i></span>`;
    return `<header class="pi-header"><div class="pi-header-fila">
      ${!movil && efectivo('modulos') === 'oculto' ? boton('fa-solid fa-bars pi-icono-16', 'pi-boton-icono pi-boton-icono--40', `data-accion="mostrar-panel" data-panel="modulos" aria-label="${esc(t('mostrarModulos'))}" title="${esc(t('mostrarModulos'))} (Ctrl+B)"`) : ''}
      <div class="pi-empresa">${logo}${D.empresa ? `<span class="pi-empresa-nombre">${esc(D.empresa)}</span>` : ''}</div>
      <div class="pi-header-centro">
        ${movil ? '' : `<button type="button" class="pi-boton-buscar pi-foco" data-accion="abrir-buscador">
          <i class="fa-solid fa-magnifying-glass pi-icono-12" aria-hidden="true"></i>
          <span class="pi-boton-buscar-texto">${esc(t('buscarPantalla'))}</span><kbd class="pi-tecla">Ctrl K</kbd></button>`}
      </div>
      ${movil ? '' : `
        <button type="button" class="pi-boton-icono pi-boton-icono--40${limpio ? ' pi-boton-icono--activo' : ''}" data-accion="vista-limpia"
          aria-pressed="${limpio}" aria-label="${esc(t('vistaLimpia'))}" title="${esc(t(limpio ? 'salirVistaLimpia' : 'vistaLimpia'))}">
          <i class="pi-icono-16 fa-solid ${limpio ? 'fa-up-right-and-down-left-from-center' : 'fa-down-left-and-up-right-to-center'}" aria-hidden="true"></i>
        </button>
        ${efectivo('preferencias') === 'oculto' ? boton('fa-solid fa-sliders pi-icono-16', 'pi-boton-icono pi-boton-icono--40', `data-accion="mostrar-panel" data-panel="preferencias" aria-label="${esc(t('mostrarPreferencias'))}" title="${esc(t('mostrarPreferencias'))}"`) : ''}`}
      ${htmlMenuUsuario()}
    </div></header>`;
  }

  // ----- Menú del usuario -----
  function htmlMenuUsuario() {
    const abierto = estado.menuAbierto;
    return `<div data-host="menu" style="position: relative; display: block">
      <button type="button" class="pi-menu-disparador pi-foco" data-accion="menu" aria-haspopup="menu" aria-expanded="${abierto}" aria-label="${esc(t('menuUsuario'))}">
        <span class="pi-avatar" style="background-color: ${colorUsuario(D.usuario)}" aria-hidden="true">${esc(inicialesUsuario(D.usuario))}</span>
        <span class="pi-menu-nombre">${esc(D.usuario)}</span>
        <i class="fa-solid fa-chevron-down pi-menu-chevron${abierto ? ' pi-menu-chevron--abierto' : ''}" aria-hidden="true"></i>
      </button>
      ${abierto ? `<div class="pi-menu" data-menu role="menu" aria-label="${esc(t('menuUsuario'))}">
        <div class="pi-menu-quien">
          <p class="pi-menu-usuario">${esc(D.usuario)}</p>
          ${D.empresa ? `<p class="pi-menu-dato"><i class="fa-solid fa-building" aria-hidden="true"></i><span class="pi-sr-only">${esc(t('empresa'))}:</span><span class="pi-truncar">${esc(D.empresa)}</span></p>` : ''}
          ${D.estacion ? `<p class="pi-menu-dato pi-menu-dato--segundo"><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span class="pi-sr-only">${esc(t('estacion'))}:</span><span class="pi-truncar">${esc(D.estacion)}</span></p>` : ''}
        </div>
        <div class="pi-menu-grupo">
          <button type="button" role="menuitem" class="pi-menu-item" data-accion="accion-menu" data-id="servidor">
            <i class="pi-menu-item-icono fa-solid fa-server" aria-hidden="true"></i>${esc(t('configurarServidor'))}</button>
          <button type="button" role="menuitemcheckbox" class="pi-menu-item" data-accion="ambientacion" aria-checked="${estado.ambientacion}" title="${esc(t('ambientacionTemporadaDesc'))}">
            <i class="fa-solid fa-wand-magic-sparkles pi-menu-item-icono" aria-hidden="true"></i>
            <span class="pi-menu-item-texto">${esc(t('ambientacionTemporada'))}</span>
            <i class="fa-solid fa-check pi-menu-check${estado.ambientacion ? '' : ' pi-menu-check--oculto'}" aria-hidden="true"></i>
          </button>
        </div>
        <div class="pi-menu-grupo pi-menu-grupo--separado">
          <button type="button" role="menuitem" class="pi-menu-item pi-menu-item--peligro" data-accion="cerrar-sesion">
            <i class="fa-solid fa-arrow-right-from-bracket pi-menu-item-icono" aria-hidden="true"></i>${esc(t('cerrarSesion'))}</button>
        </div>
      </div>` : ''}
    </div>`;
  }

  // ----- Árbol de pantallas -----
  function htmlArbol(nodos, aplicativoId, clave) {
    const expandidos = expandidosDe(clave);
    return `<ul class="pi-arbol">${nodos.map((nodo) => {
      const grupo = nodo.hijos.length > 0;
      const abierto = grupo && expandidos.has(nodo.id);
      const deshabilitado = !grupo && !puedeAbrir(nodo);
      return `<li>
        <button type="button" class="pi-arbol-fila pi-foco${deshabilitado ? ' pi-arbol-fila--deshabilitada' : ''}" data-accion="nodo" data-arbol="${clave}" data-app="${aplicativoId}" data-id="${nodo.id}"
          ${grupo ? `aria-expanded="${abierto}"` : ''} ${deshabilitado ? 'aria-disabled="true"' : ''}
          title="${esc(deshabilitado ? t('sinPantallaDisponible') : nodo.nombre)}">
          <span class="pi-arbol-icono" aria-hidden="true">${grupo ? `<i class="fa-solid ${abierto ? 'fa-minus' : 'fa-plus'}"></i>` : '<span class="pi-arbol-punto"></span>'}</span>
          <span class="pi-arbol-nombre">${esc(nodo.nombre)}</span>
          ${grupo ? `<span class="pi-arbol-contador">${nodo.hijos.length}</span>` : ''}
        </button>
        ${abierto ? `<div class="pi-arbol-hijos">${htmlArbol(nodo.hijos, aplicativoId, clave)}</div>` : ''}
      </li>`;
    }).join('')}</ul>`;
  }

  /** Grupos expandidos de cada árbol (en Angular viven en cada `app-arbol-pantallas`). */
  const expandidos = {};
  const expandidosDe = (clave) => (expandidos[clave] = expandidos[clave] || new Set());

  // ----- Panel de módulos -----
  function htmlPanelModulos(estadoPanel, variante) {
    const compacto = variante === 'lateral' && estadoPanel === 'compacto';
    const clases = `pi-panel pi-panel--modulos${compacto ? ' pi-panel--compacto' : ''}${!compacto && variante === 'capa' ? ' pi-panel--capa' : ''}`;
    const cantidad = {};
    for (const p of PANTALLAS) cantidad[p.aplicativo.id] = (cantidad[p.aplicativo.id] || 0) + 1;

    if (compacto) {
      const f = estado.flotanteModulos;
      const app = f && D.aplicativos.find((a) => a.id === f.aplicativoId);
      return `<aside class="${clases}" aria-label="${esc(t('modulos'))}">
        <div class="pi-barra-extremo pi-barra-extremo--arriba">
          ${boton('fa-solid fa-angles-right pi-icono-14', 'pi-boton-icono pi-boton-icono--36', `data-accion="panel" data-panel="modulos" data-estado="expandido" aria-label="${esc(t('expandirPanel'))}" title="${esc(t('expandirPanel'))} (Ctrl+B)"`)}
        </div>
        <nav class="pi-barra-iconos" data-scroll="barra-modulos">
          ${D.aplicativos.map((a) => `<button type="button" class="pi-icono-barra pi-icono-barra--texto pi-foco${app && app.id === a.id ? ' pi-icono-barra--activo' : ''}"
            data-accion="flotante-modulos" data-id="${a.id}" aria-label="${esc(a.nombre)}" aria-expanded="${!!app && app.id === a.id}" title="${esc(a.nombre)}">${esc(inicialesDe(a.nombre))}</button>`).join('')}
        </nav>
        <div class="pi-barra-extremo pi-barra-extremo--abajo">
          ${boton('fa-solid fa-eye-slash pi-icono-14', 'pi-boton-icono pi-boton-icono--36', `data-accion="panel" data-panel="modulos" data-estado="oculto" aria-label="${esc(t('ocultarPanel'))}" title="${esc(t('ocultarPanel'))}"`)}
        </div>
        ${app ? `<div class="pi-flotante" style="top: ${f.top}px; left: ${f.left}px; max-height: ${f.maxAlto}px" role="dialog" aria-label="${esc(app.nombre)}">
          <div class="pi-flotante-encabezado">
            <span class="pi-flotante-titulo">${esc(app.nombre)}</span>
            ${boton('fa-solid fa-xmark pi-icono-14', 'pi-boton-icono pi-boton-icono--28', `data-accion="cerrar-flotante" aria-label="${esc(t('cerrar'))}"`)}
          </div>
          <div class="pi-flotante-cuerpo">${(D.arboles[app.id] || []).length ? htmlArbol(D.arboles[app.id], app.id, 'flotante-' + app.id) : `<p class="pi-flotante-vacio">${esc(t('sinPantallas'))}</p>`}</div>
        </div>` : ''}
      </aside>`;
    }

    const filtro = estado.filtro.trim();
    let lista;
    if (filtro) {
      const resultados = PANTALLAS.filter((p) => coincideBusqueda(p.textoBusqueda, filtro)).slice(0, 50);
      lista = resultados.length === 0
        ? `<p class="pi-sin-resultados">${esc(t('sinCoincidencias'))}</p>`
        : `<ul class="pi-lista">${resultados.map((p) => `<li><button type="button" class="pi-resultado pi-foco" data-accion="abrir" data-app="${p.aplicativo.id}" data-id="${p.nodo.id}">
            <span class="pi-resultado-nombre">${esc(p.nombre)}</span><span class="pi-resultado-ubicacion">${esc(p.ubicacion)}</span></button></li>`).join('')}</ul>`;
    } else {
      lista = `<ul class="pi-lista">${D.aplicativos.map((a) => {
        const abierta = estado.aplicativoAbierto === a.id;
        const arbol = D.arboles[a.id] || [];
        return `<li>
          <button type="button" class="pi-app-fila pi-foco${abierta ? ' pi-app-fila--abierta' : ''}" data-accion="alternar-app" data-id="${a.id}" aria-expanded="${abierta}">
            <span class="pi-app-insignia${abierta ? ' pi-app-insignia--abierta' : ''}" aria-hidden="true">${esc(inicialesDe(a.nombre))}</span>
            <span class="pi-app-nombre">${esc(a.nombre)}</span>
            ${cantidad[a.id] ? `<span class="pi-app-cantidad">${cantidad[a.id]}</span>` : ''}
            <i class="fa-solid fa-chevron-right pi-app-chevron${abierta ? ' pi-app-chevron--abierto' : ''}" aria-hidden="true"></i>
          </button>
          ${abierta ? `<div class="pi-app-hijos">${arbol.length ? htmlArbol(arbol, a.id, 'acordeon-' + variante + '-' + a.id) : `<p class="pi-app-sin-pantallas">${esc(t('sinPantallas'))}</p>`}</div>` : ''}
        </li>`;
      }).join('')}</ul>`;
    }

    return `<aside class="${clases}" aria-label="${esc(t('modulos'))}">
      <div class="pi-panel-encabezado">
        <h2 class="pi-panel-titulo">${esc(t('modulos'))}</h2>
        <div class="pi-panel-botones">
          ${variante === 'capa'
            ? boton('fa-solid fa-xmark pi-icono-14', 'pi-boton-icono pi-boton-icono--32', `data-accion="cerrar-capa" aria-label="${esc(t('cerrarPanel'))}"`)
            : boton('fa-solid fa-eye-slash pi-icono-14', 'pi-boton-icono pi-boton-icono--32', `data-accion="panel" data-panel="modulos" data-estado="oculto" aria-label="${esc(t('ocultarPanel'))}" title="${esc(t('ocultarPanel'))}"`) +
              boton('fa-solid fa-angles-left pi-icono-14', 'pi-boton-icono pi-boton-icono--32', `data-accion="panel" data-panel="modulos" data-estado="compacto" aria-label="${esc(t('compactarPanel'))}" title="${esc(t('compactarPanel'))} (Ctrl+B)"`)}
        </div>
      </div>
      <div class="pi-filtro">
        <label class="pi-filtro-campo">
          <span class="pi-sr-only">${esc(t('filtrarPantallas'))}</span>
          <i class="fa-solid fa-magnifying-glass pi-filtro-lupa" aria-hidden="true"></i>
          <input type="text" class="pi-filtro-input" data-accion="filtro" data-foco="filtro-${variante}" placeholder="${esc(t('filtrarPantallas'))}" value="${esc(estado.filtro)}" />
          ${estado.filtro ? `<button type="button" class="pi-filtro-limpiar pi-foco" data-accion="limpiar-filtro" aria-label="${esc(t('limpiar'))}"><i class="fa-solid fa-xmark pi-icono-12" aria-hidden="true"></i></button>` : ''}
        </label>
      </div>
      <nav class="pi-lista-panel" data-scroll="lista-modulos-${variante}">${lista}</nav>
    </aside>`;
  }

  // ----- Panel de preferencias (con secciones de ejemplo) -----
  function seccionesPreferencias() {
    const mosaico = (accion, valor, icono, variante, texto, elegido) =>
      `<button type="button" class="pi-mosaico pi-foco${elegido ? ' demo-elegido' : ''}" data-accion="${accion}" data-valor="${valor}">
        <span class="pi-mosaico-icono pi-mosaico-icono--${variante}" aria-hidden="true">${icono}</span>
        <span class="pi-mosaico-texto">${esc(texto)}</span></button>`;
    return [
      {
        id: 'tema', icono: 'fa-solid fa-circle-half-stroke', etiqueta: t('temaInterfaz'), soloExpandido: true,
        contenido: htmlSelectorModoTema(),
      },
      {
        id: 'idioma', icono: 'fa-solid fa-language', etiqueta: td('idioma'),
        contenido: `<div class="pi-mosaicos">${IDIOMAS.map((i) => mosaico('idioma', i.codigo, `<span class="demo-codigo">${i.codigo.toUpperCase()}</span>`, 'info', i.nombre, estado.idioma === i.codigo)).join('')}</div>`,
      },
      {
        id: 'configuracion', icono: 'fa-solid fa-gears', etiqueta: t('configuracion'), separada: true,
        contenido: `<div class="pi-mosaicos">${mosaico('accion-menu', 'servidor', '<i class="fa-solid fa-server pi-icono-14"></i>', 'info', t('configurarServidor'), false)}</div>`,
      },
    ];
  }

  /** Copia de <app-selector-modo-tema>: tres tarjetas con una miniatura de la interfaz en cada modo. */
  function htmlSelectorModoTema() {
    const opciones = [
      { valor: 'claro', etiqueta: t('modoClaro'), icono: 'fa-solid fa-sun' },
      { valor: 'oscuro', etiqueta: t('modoOscuro'), icono: 'fa-solid fa-moon' },
      { valor: 'automatico', etiqueta: t('modoAutomatico'), icono: 'fa-solid fa-circle-half-stroke' },
    ];
    return `<div class="pi-modos" role="radiogroup" aria-label="${esc(t('modoTema'))}">${opciones.map((o) => {
      const elegido = o.valor === estado.modoTema;
      return `<button type="button" role="radio" class="pi-modo pi-foco${elegido ? ' pi-modo--elegido' : ''}" data-accion="modo-tema" data-valor="${o.valor}" data-foco="modo-${o.valor}"
        aria-checked="${elegido}" tabindex="${elegido ? 0 : -1}">
        <div class="vista vista--${o.valor}" aria-hidden="true">${o.valor === 'automatico' ? '<div class="vista__mitad-oscura"></div>' : ''}
          <div class="vista__barra"></div><div class="vista__linea vista__linea--larga"></div><div class="vista__linea vista__linea--corta"></div><div class="vista__acento"></div>
        </div>
        <span class="pi-modo-etiqueta"><i class="${o.icono} pi-icono-12" aria-hidden="true"></i>${esc(o.etiqueta)}</span>
      </button>`;
    }).join('')}</div>`;
  }

  function htmlPanelPreferencias(estadoPanel, variante) {
    const compacto = variante === 'lateral' && estadoPanel === 'compacto';
    const clases = `pi-panel pi-panel--preferencias${compacto ? ' pi-panel--compacto' : ''}${!compacto && variante === 'capa' ? ' pi-panel--capa' : ''}`;
    const secciones = seccionesPreferencias();

    if (compacto) {
      const f = estado.flotantePreferencias;
      const abierta = f && secciones.find((s) => s.id === f.seccionId);
      const accion = estado.oscuro ? { icono: 'fa-solid fa-sun', etiqueta: t('cambiarModoClaro') } : { icono: 'fa-solid fa-moon', etiqueta: t('cambiarModoOscuro') };
      return `<aside class="${clases}" aria-label="${esc(t('preferencias'))}">
        <div class="pi-barra-extremo pi-barra-extremo--arriba">
          ${boton('fa-solid fa-angles-left pi-icono-14', 'pi-boton-icono pi-boton-icono--36', `data-accion="panel" data-panel="preferencias" data-estado="expandido" aria-label="${esc(t('expandirPreferencias'))}" title="${esc(t('expandirPreferencias'))}"`)}
        </div>
        <div class="pi-barra-iconos">
          <button type="button" class="pi-icono-barra pi-foco" data-accion="tema" data-valor="${estado.oscuro ? 'claro' : 'oscuro'}" aria-label="${esc(accion.etiqueta)}" title="${esc(accion.etiqueta)}"><i class="${accion.icono}" aria-hidden="true"></i></button>
          ${secciones.filter((s) => !s.soloExpandido).map((s) => `<button type="button" class="pi-icono-barra pi-foco${abierta && abierta.id === s.id ? ' pi-icono-barra--activo' : ''}" data-accion="flotante-preferencias" data-id="${s.id}"
            aria-label="${esc(s.etiqueta)}" aria-expanded="${!!abierta && abierta.id === s.id}" title="${esc(s.etiqueta)}"><i class="${s.icono}" aria-hidden="true"></i></button>`).join('')}
        </div>
        <div class="pi-barra-extremo pi-barra-extremo--abajo">
          ${boton('fa-solid fa-eye-slash pi-icono-14', 'pi-boton-icono pi-boton-icono--36', `data-accion="panel" data-panel="preferencias" data-estado="oculto" aria-label="${esc(t('ocultarPanel'))}" title="${esc(t('ocultarPanel'))}"`)}
        </div>
        ${abierta ? `<div class="pi-flotante pi-flotante--preferencias" style="top: ${f.top}px; left: ${f.left}px; max-height: ${f.maxAlto}px" role="dialog" aria-label="${esc(abierta.etiqueta)}">
          <div class="pi-flotante-cuerpo pi-flotante-cuerpo--amplio">
            <span class="pi-seccion-titulo pi-seccion-titulo--flotante">${esc(abierta.etiqueta)}</span>${abierta.contenido}
          </div></div>` : ''}
      </aside>`;
    }

    return `<aside class="${clases}" aria-label="${esc(t('preferencias'))}">
      <div class="pi-panel-encabezado pi-panel-encabezado--preferencias">
        <h2 class="pi-panel-titulo"><i class="fa-solid fa-sliders" aria-hidden="true"></i>${esc(t('preferencias'))}</h2>
        <div class="pi-panel-botones">
          ${variante === 'capa'
            ? boton('fa-solid fa-xmark pi-icono-14', 'pi-boton-icono pi-boton-icono--32', `data-accion="cerrar-capa" aria-label="${esc(t('cerrar'))}"`)
            : boton('fa-solid fa-angles-right pi-icono-14', 'pi-boton-icono pi-boton-icono--32', `data-accion="panel" data-panel="preferencias" data-estado="compacto" aria-label="${esc(t('compactarPreferencias'))}" title="${esc(t('compactarPreferencias'))}"`) +
              boton('fa-solid fa-eye-slash pi-icono-14', 'pi-boton-icono pi-boton-icono--32', `data-accion="panel" data-panel="preferencias" data-estado="oculto" aria-label="${esc(t('ocultarPanel'))}" title="${esc(t('ocultarPanel'))}"`)}
        </div>
      </div>
      <div class="pi-preferencias-cuerpo" data-scroll="preferencias-${variante}">
        ${secciones.map((s) => `<div class="${s.separada ? 'pi-seccion--separada' : ''}"><span class="pi-seccion-titulo">${esc(s.etiqueta)}</span>${s.contenido}</div>`).join('')}
      </div>
    </aside>`;
  }

  // ----- Saludo -----
  function htmlCirculo(temp, chico) {
    const colores = temp ? temp.colores : periodo().colores;
    const estilo = colores
      ? `style="--pi-fondo: ${colores.fondo}; --pi-color: ${colores.color}; --pi-fondo-oscuro: ${colores.fondoOscuro}; --pi-color-oscuro: ${colores.colorOscuro}"`
      : '';
    let contenido;
    if (!temp) contenido = `<i class="${periodo().icono}"></i>`;
    else if (temp.emblema === 'banderaGT') contenido = BANDERA_GT(chico ? 16 : 32);
    else if (temp.emblema === 'anio') contenido = `<span class="pi-anio${chico ? ' pi-anio--chico' : ''}">${chico ? anioQueEmpieza() % 100 : anioQueEmpieza()}</span>`;
    else contenido = `<i class="${temp.icono}"></i>`;
    return `<span class="pi-circulo ${chico ? 'pi-circulo--chico' : 'pi-circulo--grande'}${colores ? '' : ' pi-circulo--neutro'}" ${estilo} aria-hidden="true">${contenido}</span>`;
  }

  function textoSaludo(temp) {
    if (temp) return esc(t(temp.saludo, { usuario: D.usuario }));
    if (estado.saludoContexto) return esc(t(estado.saludoContexto, { usuario: D.usuario }));
    return `${esc(t(periodo().clave))}, ${esc(D.usuario)}`;
  }

  // ----- Tiempo de sesión -----
  function htmlTiempo() {
    const vence = estado.venceSesion;
    if (vence === null) return '';
    const restante = Math.max(0, vence - Date.now());
    const total = vence > D.inicioSesion ? vence - D.inicioSesion : null;
    const porcentaje = total ? Math.min(100, (restante / total) * 100) : null;
    const nivel = restante === 0 ? 'vencida' : porcentaje === null || porcentaje > 50 ? 'ok' : porcentaje > 20 ? 'aviso' : 'critico';
    const s = Math.ceil(restante / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    const texto = h > 0 ? `${h} h ${m} min` : m >= 10 ? `${m} min` : m > 0 ? `${m} min ${r} s` : `${r} s`;
    const hora = new Date(vence).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const critico = nivel === 'critico' || nivel === 'vencida';
    return `<div title="${esc(t('sesionVenceA', { hora }))}">
      <div class="pi-tiempo-fila">
        <span class="pi-tiempo-etiqueta">${esc(t('sesionRestante'))}</span>
        <span class="pi-tiempo-valor${critico ? ' pi-tiempo-valor--critico' : ''}">${nivel === 'vencida' ? esc(t('sesionVencida')) : texto}</span>
      </div>
      ${porcentaje === null ? '' : `<div class="pi-tiempo-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(porcentaje)}" aria-label="${esc(t('sesionRestante'))}">
        <div class="pi-tiempo-relleno pi-tiempo-relleno--${critico ? 'critico' : nivel}" style="width: ${porcentaje}%"></div></div>`}
    </div>`;
  }

  // ----- Decoración de temporada -----
  /**
   * Las partículas se crean una vez por temporada y el retraso se calcula desde ese momento: al
   * redibujar la pantalla, cada copo sigue donde iba en lugar de volver a empezar.
   */
  let decoracion = null;
  function htmlDecoracion(temp) {
    if (!temp || !temp.decoracion) return '';
    if (!decoracion || decoracion.id !== temp.id) {
      const inicio = Date.now();
      if (temp.decoracion === 'copos') {
        decoracion = { id: temp.id, inicio, particulas: Array.from({ length: 16 }, () => {
          const duracion = 7000 + Math.random() * 5000;
          return { izquierda: Math.random() * 96, retraso: Math.random() * duracion, duracion, tamano: 3 + Math.random() * 4 };
        }) };
      } else {
        // Fuegos (y confeti) una sola vez por sesión del navegador
        const clave = 'inicioTemporadaVista:' + temp.id;
        const visto = almacen.leer(clave, sessionStorage);
        almacen.guardar(clave, '1', sessionStorage);
        decoracion = { id: temp.id, inicio, visto: !!visto };
      }
    }
    const transcurrido = Date.now() - decoracion.inicio;
    let contenido = '';
    if (temp.decoracion === 'copos') {
      contenido = decoracion.particulas.map((p) => `<span class="carril" style="left: ${p.izquierda}%; animation-duration: ${p.duracion}ms; animation-delay: ${-(p.retraso + transcurrido)}ms">
        <span class="copo" style="width: ${p.tamano}px; height: ${p.tamano}px"></span></span>`).join('');
    } else if (temp.decoracion === 'fuegos' && !decoracion.visto && transcurrido < 3000) {
      const estallidos = [
        { izquierda: 72, arriba: 40, tamano: 110, retraso: 0, color: '#fbbf24' },
        { izquierda: 88, arriba: 65, tamano: 80, retraso: 450, color: '#d946ef' },
        { izquierda: 58, arriba: 70, tamano: 90, retraso: 900, color: '#0ea5e9' },
        { izquierda: 82, arriba: 22, tamano: 70, retraso: 1300, color: '#f59e0b' },
      ];
      const rayos = (angulos, y1, y2, cy, r) => angulos.map((a) => `<g transform="rotate(${a})"><line x1="0" y1="${y1}" x2="0" y2="${y2}" /><circle cx="0" cy="${cy}" r="${r}" /></g>`).join('');
      contenido = estallidos.map((e) => `<svg class="estallido" viewBox="-50 -50 100 100" style="color: ${e.color}; left: ${e.izquierda}%; top: ${e.arriba}%; width: ${e.tamano}px; height: ${e.tamano}px; animation-delay: ${e.retraso - transcurrido}ms">
        ${rayos([0, 60, 120, 180, 240, 300], -12, -38, -45, 2.6)}${rayos([30, 90, 150, 210, 270, 330], -10, -26, -32, 2)}</svg>`).join('');
    }
    return contenido ? `<div class="pi-decoracion" aria-hidden="true">${contenido}</div>` : '';
  }

  // ----- Centro -----
  function htmlCentro(movil) {
    const temp = temporada();
    const limpio = estado.paneles.limpio;
    const { total, fijados, recientes } = accesos();

    const bienvenida = limpio || movil
      ? `<div class="pi-bienvenida-linea">
          <div style="display: block"><h1 class="pi-saludo-linea">${temp ? htmlCirculo(temp, true) : ''}${textoSaludo(temp)}</h1></div>
          ${D.estacion ? `<span class="pi-estacion-linea"><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span class="pi-sr-only">${esc(t('estacion'))}:</span>${esc(D.estacion)}</span>` : ''}
          <div class="pi-tiempo-linea" data-tiempo>${htmlTiempo()}</div>
        </div>`
      : `<section class="pi-bienvenida">
          ${temp ? `<div class="pi-franja" style="background: ${temp.franja}" aria-hidden="true"></div>${htmlDecoracion(temp)}` : ''}
          <div class="pi-bienvenida-fila">
            <div class="pi-saludo-caja" style="display: block">
              <div class="pi-saludo">${htmlCirculo(temp, false)}
                <div class="pi-saludo-textos"><h2 class="pi-saludo-titulo">${textoSaludo(temp)}</h2><p class="pi-saludo-fecha">${esc(fecha())}</p></div>
              </div>
            </div>
            <div class="pi-tiempo-tarjeta" data-tiempo>${htmlTiempo()}</div>
          </div>
          <ul class="pi-etiquetas">
            ${etiqueta('fa-regular fa-clock', '', t('horaInicioSesion'), new Date(D.inicioSesion).toLocaleString(estado.idioma, { dateStyle: 'short', timeStyle: 'short' }))}
            ${D.estacion ? etiqueta('fa-solid fa-location-dot', 'pi-etiqueta-icono--marca', t('estacion'), D.estacion) : ''}
            ${D.empresa ? etiqueta('fa-solid fa-building', 'pi-etiqueta-icono--empresa', t('empresa'), D.empresa) : ''}
          </ul>
        </section>`;

    return `<main class="pi-centro ${movil ? 'pi-centro--movil' : 'pi-centro--escritorio'}" data-scroll="centro" data-centro>
      <div class="pi-centro-contenido">
        ${bienvenida}
        <div style="display: block">${htmlAccesos(fijados, recientes, total, movil)}</div>
        <div class="pi-widgets">
          ${htmlWidgetConexion()}
          ${!limpio && !movil ? htmlWidgetAtajos() : ''}
        </div>
      </div>
    </main>`;
  }

  function etiqueta(icono, claseIcono, nombre, valor) {
    return `<li class="pi-etiqueta" title="${esc(nombre)}: ${esc(valor)}">
      <i class="${icono} ${claseIcono}" aria-hidden="true"></i><span class="pi-sr-only">${esc(nombre)}:</span><span class="pi-truncar">${esc(valor)}</span></li>`;
  }

  // ----- Accesos rápidos -----
  function htmlAccesos(fijados, recientes, total, horizontal) {
    const tarjeta = (item, esFijado, indice) => `<div class="pi-tarjeta${horizontal ? ' pi-tarjeta--tira' : ''}" style="view-transition-name: acceso-${item.clave}">
      <button type="button" class="pi-tarjeta-abrir pi-foco" data-accion="abrir" data-app="${item.aplicativo.id}" data-id="${item.nodo.id}"
        title="${esc(item.ubicacion + ' › ' + item.nombre)}" ${esFijado && indice < 8 ? `aria-keyshortcuts="Alt+${indice + 1}"` : ''}>
        <span class="pi-tarjeta-icono${esFijado ? ' pi-tarjeta-icono--fijado' : ''}" aria-hidden="true"><i class="${esFijado ? 'fa-solid fa-thumbtack' : 'fa-solid fa-clock-rotate-left'}"></i></span>
        <span class="pi-tarjeta-textos"><span class="pi-tarjeta-nombre">${esc(item.nombre)}</span><span class="pi-tarjeta-app">${esc(item.aplicativo.nombre)}</span></span>
        ${esFijado && indice < 8 && !horizontal ? `<kbd class="pi-tecla-atajo" aria-hidden="true">Alt+${indice + 1}</kbd>` : ''}
      </button>
      <button type="button" class="pi-tarjeta-accion pi-foco${esFijado ? ' pi-tarjeta-accion--fijado' : ''}" data-accion="${esFijado ? 'quitar-fijado' : 'fijar'}" data-app="${item.aplicativo.id}" data-id="${item.nodo.id}"
        ${!esFijado && total >= MAXIMO_FIJADOS ? 'disabled' : ''} aria-label="${esc(t(esFijado ? 'quitarFijado' : 'fijar'))}"
        title="${esc(esFijado ? t('quitarFijado') : total >= MAXIMO_FIJADOS ? t('maximoFijados', { max: MAXIMO_FIJADOS }) : t('fijar'))}">
        <i class="${esFijado ? 'fa-solid fa-xmark' : 'fa-solid fa-thumbtack pi-girado'}" aria-hidden="true"></i>
      </button>
    </div>`;
    const lista = (items, esFijado) => `<div class="pi-accesos-lista${horizontal ? ' pi-accesos-lista--tira' : ''}">${items.map((x, i) => tarjeta(x, esFijado, esFijado ? i : -1)).join('')}</div>`;

    let cuerpo;
    if (fijados.length === 0 && recientes.length === 0) {
      cuerpo = `<div class="pi-accesos-vacio"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i><p>${esc(t('accesosVacio'))}</p></div>`;
    } else {
      cuerpo = `<div class="pi-accesos-grupos">
        ${fijados.length ? `<div><h3 class="pi-grupo-titulo pi-grupo-titulo--solo">${esc(t('fijados'))}</h3>${lista(fijados, true)}</div>` : ''}
        ${recientes.length ? `<div><div class="pi-grupo-encabezado"><h3 class="pi-grupo-titulo">${esc(t('recientes'))}</h3>
            <button type="button" class="pi-borrar pi-foco" data-accion="borrar-recientes">${esc(t('borrarRecientes'))}</button></div>${lista(recientes, false)}</div>` : ''}
      </div>`;
    }
    return `<section class="pi-seccion-tarjeta">
      <header class="pi-accesos-encabezado"><i class="fa-solid fa-bolt" aria-hidden="true"></i><h2 class="pi-accesos-titulo">${esc(t('accesosRapidos'))}</h2></header>
      ${cuerpo}
    </section>`;
  }

  // ----- Widgets -----
  function htmlWidget(titulo, icono, accion, filas) {
    return `<div style="display: block"><section class="pi-widget">
      <header class="pi-widget-encabezado">
        <span class="pi-widget-icono" aria-hidden="true"><i class="pi-icono-14 ${icono}"></i></span>
        <h3 class="pi-widget-titulo">${esc(titulo)}</h3>${accion}
      </header>
      <div class="pi-widget-cuerpo"><dl class="pi-widget-filas">${filas}</dl></div>
    </section></div>`;
  }

  function htmlWidgetConexion() {
    const c = D.conexion;
    const servidor = (c.url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    return htmlWidget(t('conexion'), 'fa-solid fa-server',
      `<button type="button" class="pi-boton-fantasma" data-accion="accion-menu" data-id="servidor">${esc(t('cambiar'))}</button>`,
      `<div class="pi-widget-fila"><dt class="pi-widget-etiqueta">${esc(t('estado'))}</dt>
        <dd class="pi-conexion-estado${c.conectado ? '' : ' pi-conexion-estado--error'}"><span class="pi-punto${c.conectado ? '' : ' pi-punto--error'}" aria-hidden="true"></span>${esc(t(c.conectado ? 'conectado' : 'sinConexion'))}</dd></div>
      <div class="pi-widget-fila"><dt class="pi-widget-etiqueta pi-widget-etiqueta--fija">${esc(t('servidor'))}</dt><dd class="pi-servidor" title="${esc(c.url)}">${esc(servidor || '—')}</dd></div>
      <div class="pi-widget-fila"><dt class="pi-widget-etiqueta">${esc(t('versionWeb'))}</dt><dd class="pi-widget-valor">${esc(c.versionWeb || '—')}</dd></div>
      <div class="pi-widget-fila"><dt class="pi-widget-etiqueta">${esc(t('versionApi'))}</dt><dd class="pi-widget-valor">${esc(c.versionApi || '—')}</dd></div>`);
  }

  function htmlWidgetAtajos() {
    const atajos = [
      { texto: 'buscarPantalla', teclas: ['Ctrl', 'K'] },
      { texto: 'atajoModulos', teclas: ['Ctrl', 'B'] },
      { texto: 'vistaLimpia', teclas: ['Ctrl', 'Shift', 'L'] },
      { texto: 'atajoFijados', teclas: ['Alt', '1…8'] },
    ];
    return htmlWidget(t('atajos'), 'fa-solid fa-keyboard', '', atajos.map((a) => `<div class="pi-widget-fila">
      <dt class="pi-atajo-texto">${esc(t(a.texto))}</dt>
      <dd class="pi-teclas">${a.teclas.map((k) => `<kbd class="pi-tecla pi-tecla--elevada">${k}</kbd>`).join('')}</dd></div>`).join(''));
  }

  // ----- Celular: barra inferior y capas -----
  function htmlBarraInferior() {
    const items = [
      { id: 'inicio', icono: 'fa-solid fa-house', etiqueta: 'inicio' },
      { id: 'modulos', icono: 'fa-solid fa-sitemap', etiqueta: 'modulos' },
      { id: 'buscar', icono: 'fa-solid fa-magnifying-glass', etiqueta: 'buscar' },
      { id: 'preferencias', icono: 'fa-solid fa-sliders', etiqueta: 'preferencias' },
    ];
    return `<nav class="pi-barra-inferior" aria-label="${esc(t('navegacion'))}">${items.map((i) => {
      const activo = (i.id === 'inicio' && !estado.capa) || estado.capa === i.id;
      return `<button type="button" class="pi-barra-boton${activo ? ' pi-barra-boton--activo' : ''}" data-accion="barra" data-id="${i.id}" ${activo ? 'aria-current="page"' : ''}>
        <i class="pi-icono-18 ${i.icono}" aria-hidden="true"></i>${esc(t(i.etiqueta))}</button>`;
    }).join('')}</nav>`;
  }

  function htmlCapa(movil) {
    if (estado.capa === 'modulos') {
      return `<div class="pi-capa${movil ? ' pi-capa--movil' : ''}"><div class="pi-velo" data-accion="cerrar-capa" aria-hidden="true"></div>
        <div class="pi-capa-panel" style="display: block">${htmlPanelModulos('expandido', 'capa')}</div></div>`;
    }
    if (estado.capa === 'preferencias') {
      return `<div class="pi-capa pi-capa--derecha${movil ? ' pi-capa--movil' : ''}"><div class="pi-velo" data-accion="cerrar-capa" aria-hidden="true"></div>
        <div class="pi-capa-panel pi-capa-panel--preferencias" style="display: block">${htmlPanelPreferencias('expandido', 'capa')}</div></div>`;
    }
    return '';
  }

  // ----- Avisos flotantes -----
  function htmlAvisoSesion(movil) {
    const vence = estado.venceSesion;
    const tipo = estado.aviso === 'cambios' ? 'cambios' : 'neutro';
    const restante = vence - Date.now();
    const cerrado = almacen.leer('avisoSesionCerrado', sessionStorage) === `${vence}|${tipo}`;
    const visible = estado.aviso !== 'ninguno' && restante > 0 && restante <= 10 * 60_000 && !cerrado;
    const hora = new Date(vence).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `<div class="pi-posicion-aviso${movil ? ' pi-posicion-aviso--movil' : ''}">${visible ? `<div class="pi-aviso${tipo === 'cambios' ? ' pi-aviso--cambios' : ''}" role="status">
      <i class="pi-aviso-icono ${tipo === 'cambios' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-clock'}" aria-hidden="true"></i>
      <div class="pi-aviso-textos">
        <p class="pi-aviso-titulo">${esc(t(tipo === 'cambios' ? 'avisoSesionCambiosTitulo' : 'avisoSesionTitulo'))}</p>
        <p class="pi-aviso-mensaje">${esc(t(tipo === 'cambios' ? 'avisoSesionCambiosMsg' : 'avisoSesionMsg', { hora }))}</p>
      </div>
      <button type="button" class="pi-aviso-cerrar pi-foco" data-accion="cerrar-aviso" aria-label="${esc(t('cerrar'))}"><i class="fa-solid fa-xmark pi-icono-12" aria-hidden="true"></i></button>
    </div>` : ''}</div>`;
  }

  // ----- Buscador (Ctrl+K) -----
  function resultadosBuscador() {
    const texto = estado.buscador.texto.trim();
    if (!texto) {
      const a = accesos();
      return [...a.fijados, ...a.recientes];
    }
    const inicio = normalizarBusqueda(texto);
    return PANTALLAS.filter((p) => coincideBusqueda(p.textoBusqueda, texto))
      // Primero las que empiezan por lo escrito
      .sort((a, b) => Number(normalizarBusqueda(b.nombre).startsWith(inicio)) - Number(normalizarBusqueda(a.nombre).startsWith(inicio)))
      .slice(0, 50);
  }

  function htmlBuscador() {
    const b = estado.buscador;
    if (!b.abierto) return '';
    const resultados = resultadosBuscador();
    const texto = b.texto.trim();
    if (b.activo >= resultados.length) b.activo = 0;
    return `<div class="pi-buscador-capa">
      <div class="pi-velo" data-accion="cerrar-buscador" aria-hidden="true"></div>
      <div class="pi-buscador" role="dialog" aria-modal="true" aria-label="${esc(t('buscarPantalla'))}">
        <div class="pi-buscador-campo">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="text" role="combobox" aria-autocomplete="list" aria-controls="buscador-resultados" aria-expanded="${resultados.length > 0}"
            ${resultados.length ? `aria-activedescendant="buscador-opcion-${b.activo}"` : ''} class="pi-buscador-input"
            data-accion="buscador-texto" data-foco="buscador" placeholder="${esc(t('buscarPantalla'))}" value="${esc(b.texto)}" />
          <kbd class="pi-tecla">Esc</kbd>
        </div>
        <div id="buscador-resultados" role="listbox" class="pi-buscador-lista">
          ${!texto && resultados.length ? `<p class="pi-buscador-subtitulo">${esc(t('accesosRapidos'))}</p>` : ''}
          ${resultados.map((p, i) => `<button type="button" role="option" id="buscador-opcion-${i}" aria-selected="${i === b.activo}"
              class="pi-opcion${i === b.activo ? ' pi-opcion--activa' : ''}" data-accion="abrir" data-indice="${i}" data-app="${p.aplicativo.id}" data-id="${p.nodo.id}">
              <i class="fa-regular fa-file-lines pi-opcion-icono" aria-hidden="true"></i>
              <span class="pi-opcion-textos"><span class="pi-opcion-nombre">${esc(p.nombre)}</span><span class="pi-opcion-ubicacion">${esc(p.ubicacion)}</span></span>
              ${i === b.activo ? '<i class="fa-solid fa-arrow-turn-down pi-opcion-flecha" aria-hidden="true"></i>' : ''}
            </button>`).join('')}
          ${resultados.length === 0 ? `<p class="pi-buscador-vacio">${esc(texto ? t('sinCoincidencias') : t('buscadorAyuda', { total: PANTALLAS.length }))}</p>` : ''}
        </div>
        <div class="pi-buscador-pie">
          <span><kbd class="pi-tecla pi-tecla--estrecha">↑</kbd><kbd class="pi-tecla pi-tecla--estrecha">↓</kbd>${esc(t('teclaMover'))}</span>
          <span><kbd class="pi-tecla pi-tecla--estrecha">Enter</kbd>${esc(t('teclaAbrir'))}</span>
          <span><kbd class="pi-tecla pi-tecla--estrecha">Esc</kbd>${esc(t('cerrar'))}</span>
        </div>
      </div>
    </div>`;
  }

  // ----- «Deshacer» -----
  function htmlDeshacer(movil) {
    const d = estado.deshacer;
    if (!d) return '';
    return `<div class="pi-deshacer${movil ? ' pi-deshacer--movil' : ''}" role="status">
      <span class="pi-deshacer-texto">${esc(t('fijadoQuitado', { nombre: d.nombre }))}</span>
      <button type="button" class="pi-deshacer-boton pi-foco" data-accion="deshacer" aria-keyshortcuts="Control+Z">${esc(t('deshacer'))}</button>
      <button type="button" class="pi-boton-icono pi-boton-icono--28" data-accion="cerrar-deshacer" aria-label="${esc(t('cerrar'))}"><i class="fa-solid fa-xmark pi-icono-12" aria-hidden="true"></i></button>
    </div>`;
  }

  // ======================================================================
  // Dibujo
  // ======================================================================
  const app = document.getElementById('app');

  /** Dibuja la pantalla completa conservando el scroll de cada zona y el foco. */
  function dibujar() {
    const movil = tamano() === 'movil';
    const scrolls = {};
    app.querySelectorAll('[data-scroll]').forEach((el) => (scrolls[el.dataset.scroll] = el.scrollTop));
    const activo = document.activeElement;
    const foco = activo && activo.dataset ? activo.dataset.foco : null;
    const seleccion = foco ? [activo.selectionStart, activo.selectionEnd] : null;

    const modulos = efectivo('modulos');
    const preferencias = efectivo('preferencias');
    app.innerHTML = `<div class="pi-inicio">
      <div class="pi-pantalla">
        ${htmlHeader(movil)}
        <div class="pi-cuerpo">
          ${modulos !== 'oculto' ? `<div class="pi-panel-lateral" data-host="modulos" style="display: block; height: 100%">${htmlPanelModulos(modulos, 'lateral')}</div>` : ''}
          ${htmlCentro(movil)}
          ${preferencias !== 'oculto' ? `<div class="pi-panel-lateral" data-host="preferencias" style="display: block; height: 100%">${htmlPanelPreferencias(preferencias, 'lateral')}</div>` : ''}
        </div>
        ${movil ? htmlBarraInferior() : ''}
      </div>
      ${htmlCapa(movil)}
      ${htmlBuscador()}
      ${htmlAvisoSesion(movil)}
      ${htmlDeshacer(movil)}
    </div>`;

    app.querySelectorAll('[data-scroll]').forEach((el) => {
      if (scrolls[el.dataset.scroll]) el.scrollTop = scrolls[el.dataset.scroll];
    });
    if (foco) {
      const el = app.querySelector(`[data-foco="${foco}"]`);
      if (el) {
        el.focus();
        if (seleccion && el.setSelectionRange) el.setSelectionRange(seleccion[0], seleccion[1]);
      }
    }
    document.documentElement.lang = estado.idioma;
  }

  /** Solo el tiempo de sesión (cada 15 s, y cada segundo en los últimos 10 minutos). */
  function actualizarTiempo() {
    app.querySelectorAll('[data-tiempo]').forEach((el) => (el.innerHTML = htmlTiempo()));
    const restante = estado.venceSesion - Date.now();
    setTimeout(actualizarTiempo, restante > 0 && restante <= 10 * 60_000 ? 1000 : 15_000);
  }

  // ======================================================================
  // Mensajes del panel de la demo (index.html)
  // ======================================================================
  const SISTEMA_OSCURO = window.matchMedia('(prefers-color-scheme: dark)');

  /** Lo que en un proyecto hace su servicio de tema: claro, oscuro o el del sistema. */
  function aplicarModo(modo) {
    estado.modoTema = modo;
    estado.oscuro = modo === 'oscuro' || (modo === 'automatico' && SISTEMA_OSCURO.matches);
    document.documentElement.classList.toggle('dark', estado.oscuro);
    document.documentElement.classList.toggle('light', !estado.oscuro);
  }

  // En automático, sigue al sistema si cambia
  SISTEMA_OSCURO.addEventListener('change', () => {
    if (estado.modoTema !== 'automatico') return;
    aplicarModo('automatico');
    dibujar();
    avisarEstado();
  });

  const MENSAJES = {
    tema: (valor) => aplicarModo(valor),
    idioma: (valor) => {
      estado.idioma = TEXTOS[valor] ? valor : 'es';
      almacen.guardar('demoInicio:idioma', estado.idioma);
    },
    temporada: (valor) => {
      estado.temporadaForzada = valor === 'auto' ? undefined : valor === 'ninguna' ? null : valor;
      // Elegida desde el panel de la demo, la animación de una vez por sesión (fuegos) se vuelve a ver
      if (valor !== 'auto' && valor !== 'ninguna') {
        try { sessionStorage.removeItem('inicioTemporadaVista:' + valor); } catch { /* bloqueado */ }
      }
      decoracion = null;
    },
    /** Atajo de teclado que el panel de la demo reenvía cuando el foco está fuera del marco. */
    tecla: (valor) => {
      window.focus();
      document.dispatchEvent(new KeyboardEvent('keydown', { ...valor, bubbles: true, cancelable: true }));
    },
    aviso: (valor) => {
      estado.aviso = valor;
      // El aviso sale 10 minutos antes del vencimiento: se simula una sesión que vence en 8 minutos
      estado.venceSesion = valor === 'ninguno' ? D.venceSesion : Date.now() + 8 * 60_000;
      try { sessionStorage.removeItem('avisoSesionCerrado'); } catch { /* bloqueado */ }
    },
    reiniciar: () => {
      try {
        Object.keys(localStorage).filter((k) => k.startsWith('inicio')).forEach((k) => localStorage.removeItem(k));
        Object.keys(sessionStorage).filter((k) => k.startsWith('inicio') || k === 'avisoSesionCerrado').forEach((k) => sessionStorage.removeItem(k));
      } catch { /* bloqueado */ }
      location.reload();
    },
  };

  window.addEventListener('message', (evento) => {
    const { tipo, valor } = evento.data || {};
    if (tipo === 'medir') {
      // El panel de la demo cambió el ancho del marco: se aplica la regla de tamaño sin esperar
      // a `resize`/`matchMedia` (que el navegador puede demorar si la página está en segundo plano)
      alCambiarAncho();
      avisarEstado();
      return;
    }
    if (!MENSAJES[tipo]) return;
    MENSAJES[tipo](valor);
    if (tipo !== 'tecla') dibujar();
    avisarEstado();
  });

  /** Le cuenta al panel de la demo cómo quedó (tamaño efectivo, tema e idioma). */
  function avisarEstado() {
    if (window.parent !== window) {
      window.parent.postMessage({ tipo: 'estado', tamano: tamano(), oscuro: estado.oscuro, idioma: estado.idioma }, '*');
    }
  }

  // ======================================================================
  // Interacciones (lo que en Angular hacen los componentes y la pantalla base)
  // ======================================================================

  /** Aviso de la demo (no es parte del diseño): explica lo que en la aplicación haría el proyecto. */
  let temporizadorNota;
  function nota(texto) {
    let el = document.getElementById('demo-nota');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-nota';
      el.className = 'demo-nota';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML = `<strong>Demo</strong> ${esc(texto)}`;
    el.hidden = false;
    clearTimeout(temporizadorNota);
    temporizadorNota = setTimeout(() => (el.hidden = true), 4000);
  }

  /** Enfoca un elemento cuando ya está dibujado. */
  const enfocar = (selector) => {
    const el = app.querySelector(selector);
    if (el) el.focus();
  };

  // ----- Paneles (EstadoPanelesService y la pantalla base) -----
  function guardarPaneles() {
    almacen.guardar(CLAVE_PANELES, JSON.stringify(estado.paneles));
  }

  /** EstadoPanelesService.cambiar: en «chica» solo un panel expandido; apaga la vista limpia. */
  function cambiarPanel(panel, nuevo) {
    const tam = tamano();
    const estados = { modulos: efectivo('modulos'), preferencias: efectivo('preferencias') };
    estados[panel] = nuevo;
    if (tam === 'chica' && nuevo === 'expandido') {
      const otro = panel === 'modulos' ? 'preferencias' : 'modulos';
      if (estados[otro] === 'expandido') estados[otro] = 'compacto';
    }
    estado.paneles = { porTamano: { ...estado.paneles.porTamano, [tam]: estados }, limpio: false };
    guardarPaneles();
  }

  /** Botones de un panel: con paneles al lado se guarda el estado; en tablet, «expandir» abre la capa. */
  function pedirPanel(panel, nuevo) {
    cerrarFlotantes();
    if (nuevo === 'expandido' && !conPaneles()) estado.capa = panel;
    else cambiarPanel(panel, nuevo);
  }

  /** Botones del header para un panel oculto. */
  function mostrarPanel(panel) {
    if (conPaneles()) {
      cambiarPanel(panel, 'expandido');
      return;
    }
    if (tamano() === 'tablet') cambiarPanel(panel, 'compacto');
    estado.capa = panel;
  }

  function alternarLimpio() {
    estado.paneles = { ...estado.paneles, limpio: !estado.paneles.limpio };
    guardarPaneles();
    cerrarFlotantes();
  }

  function cerrarFlotantes() {
    estado.flotanteModulos = null;
    estado.flotantePreferencias = null;
  }

  function buscarNodo(nodos, id) {
    for (const nodo of nodos) {
      if (nodo.id === id) return nodo;
      const hijo = buscarNodo(nodo.hijos, id);
      if (hijo) return hijo;
    }
    return null;
  }

  // ----- Navegación -----
  const pantallaDe = (el) => PANTALLAS.find((p) => p.aplicativo.id === Number(el.dataset.app) && p.nodo.id === Number(el.dataset.id));
  const guardarLista = (prefijo, lista) => almacen.guardar(prefijo + USUARIO, JSON.stringify(lista));
  const esLaMisma = (g, p) => g.aplicativoId === p.aplicativo.id && g.pantallaId === p.nodo.id;

  /** En la aplicación se navega (PROYECTO). La demo simula que se llegó: la pantalla pasa a Recientes. */
  function abrirPantalla(p) {
    if (!p) return;
    estado.capa = null;
    estado.buscador.abierto = false;
    estado.menuAbierto = false;
    cerrarFlotantes();
    conTransicion(() => {
      const recientes = leerAccesos(PREFIJO_RECIENTES, D.recientes).filter((r) => !esLaMisma(r, p));
      guardarLista(PREFIJO_RECIENTES, [{ aplicativoId: p.aplicativo.id, pantallaId: p.nodo.id }, ...recientes].slice(0, MAXIMO_RECIENTES));
    });
    nota(`Aquí la aplicación abriría «${p.nombre}» (${p.ubicacion}). En la demo, la pantalla pasa a Recientes.`);
  }

  // ----- Accesos rápidos -----
  /**
   * Cambio de accesos con View Transitions: cada tarjeta se desliza a su nuevo lugar. Los datos se
   * guardan en el momento y solo el dibujo espera a la transición: así, varios clics seguidos antes
   * de que la pantalla se redibuje parten siempre de lo último guardado.
   */
  function conTransicion(cambio) {
    cambio();
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reducir) {
      dibujar();
      return;
    }
    const transicion = document.startViewTransition(() => dibujar());
    // Dos cambios seguidos: el navegador cancela la transición anterior (no es un error)
    transicion.ready.catch(() => {});
  }

  let temporizadorDeshacer;
  function fijar(p) {
    conTransicion(() => {
      const fijados = leerAccesos(PREFIJO_FIJADOS, D.fijados);
      if (fijados.length < MAXIMO_FIJADOS && !fijados.some((f) => esLaMisma(f, p))) {
        guardarLista(PREFIJO_FIJADOS, [...fijados, { aplicativoId: p.aplicativo.id, pantallaId: p.nodo.id }]);
      }
    });
  }

  function quitarFijado(p) {
    const antes = leerAccesos(PREFIJO_FIJADOS, D.fijados);
    // Ya no estaba fijado (p. ej. un segundo clic antes de redibujar): no se pisa el «Deshacer»
    if (!p || !antes.some((f) => esLaMisma(f, p))) return;
    clearTimeout(temporizadorDeshacer);
    estado.deshacer = { nombre: p.nombre, fijados: antes };
    temporizadorDeshacer = setTimeout(() => {
      estado.deshacer = null;
      dibujar();
    }, 6000);
    conTransicion(() => guardarLista(PREFIJO_FIJADOS, antes.filter((f) => !esLaMisma(f, p))));
  }

  function deshacerQuitarFijado() {
    const pendiente = estado.deshacer;
    if (!pendiente) return;
    clearTimeout(temporizadorDeshacer);
    estado.deshacer = null;
    conTransicion(() => guardarLista(PREFIJO_FIJADOS, pendiente.fijados.slice(0, MAXIMO_FIJADOS)));
  }

  // ----- Buscador -----
  function abrirBuscador() {
    estado.capa = null;
    estado.menuAbierto = false;
    cerrarFlotantes();
    estado.buscador = { abierto: true, texto: '', activo: 0 };
    dibujar();
    enfocar('[data-foco="buscador"]');
  }

  function cerrarBuscador() {
    estado.buscador.abierto = false;
    dibujar();
  }

  /** Mueve la opción activa sin redibujar (redibujar entre el clic y el «click» perdería el clic). */
  function marcarActiva(indice, desplazar) {
    estado.buscador.activo = indice;
    const opciones = [...app.querySelectorAll('.pi-opcion')];
    opciones.forEach((op, i) => {
      const activa = i === indice;
      op.classList.toggle('pi-opcion--activa', activa);
      op.setAttribute('aria-selected', String(activa));
      const flecha = op.querySelector('.pi-opcion-flecha');
      if (activa && !flecha) op.insertAdjacentHTML('beforeend', '<i class="fa-solid fa-arrow-turn-down pi-opcion-flecha" aria-hidden="true"></i>');
      if (!activa && flecha) flecha.remove();
    });
    const campo = app.querySelector('[data-foco="buscador"]');
    if (campo && opciones[indice]) campo.setAttribute('aria-activedescendant', opciones[indice].id);
    if (desplazar && opciones[indice]) opciones[indice].scrollIntoView({ block: 'nearest' });
  }

  // ----- Menú del usuario -----
  function cerrarMenu(devolverFoco) {
    estado.menuAbierto = false;
    dibujar();
    if (devolverFoco) enfocar('.pi-menu-disparador');
  }

  // ----- Clics -----
  app.addEventListener('click', (evento) => {
    const objetivo = evento.target;
    // Clic fuera de un panel flotante o del menú: se cierran (HostListener('document:click') en Angular)
    let cerro = false;
    if (estado.flotanteModulos && !objetivo.closest('[data-host="modulos"]')) { estado.flotanteModulos = null; cerro = true; }
    if (estado.flotantePreferencias && !objetivo.closest('[data-host="preferencias"]')) { estado.flotantePreferencias = null; cerro = true; }
    if (estado.menuAbierto && !objetivo.closest('[data-host="menu"]')) { estado.menuAbierto = false; cerro = true; }

    const el = objetivo.closest('[data-accion]');
    if (!el || el.disabled || el.tagName === 'INPUT') {
      if (cerro) dibujar();
      return;
    }
    const accion = el.dataset.accion;
    const id = el.dataset.id;

    switch (accion) {
      case 'mostrar-panel':
        mostrarPanel(el.dataset.panel);
        break;
      case 'vista-limpia':
        alternarLimpio();
        break;
      case 'panel':
        pedirPanel(el.dataset.panel, el.dataset.estado);
        break;
      case 'cerrar-capa':
        estado.capa = null;
        break;
      case 'abrir-buscador':
        abrirBuscador();
        return;
      case 'cerrar-buscador':
        cerrarBuscador();
        return;
      case 'menu':
        if (estado.menuAbierto) {
          cerrarMenu(true);
        } else {
          estado.menuAbierto = true;
          dibujar();
          enfocar('[data-menu] [role^="menuitem"]');
        }
        return;
      case 'accion-menu':
        estado.menuAbierto = false;
        estado.capa = null;
        cerrarFlotantes();
        nota('Aquí la aplicación abriría la configuración del servidor (lo resuelve cada proyecto: PROYECTO).');
        break;
      case 'ambientacion':
        // Se marca o desmarca sin cerrar el menú
        estado.ambientacion = !estado.ambientacion;
        almacen.guardar('inicioTemporada:' + USUARIO, estado.ambientacion ? '1' : '0');
        decoracion = null;
        dibujar();
        enfocar('[data-accion="ambientacion"]');
        return;
      case 'cerrar-sesion':
        estado.menuAbierto = false;
        nota('Aquí la aplicación pediría confirmar y cerraría la sesión (PROYECTO).');
        break;
      case 'flotante-modulos': {
        const n = Number(id);
        if (estado.flotanteModulos && estado.flotanteModulos.aplicativoId === n) {
          estado.flotanteModulos = null;
        } else {
          delete expandidos['flotante-' + n];
          estado.flotanteModulos = { aplicativoId: n, ...posicionFlotante(el.getBoundingClientRect(), 'derecha', 288) };
        }
        estado.flotantePreferencias = null;
        break;
      }
      case 'flotante-preferencias':
        if (estado.flotantePreferencias && estado.flotantePreferencias.seccionId === id) {
          estado.flotantePreferencias = null;
        } else {
          estado.flotantePreferencias = { seccionId: id, ...posicionFlotante(el.getBoundingClientRect(), 'izquierda', 304) };
        }
        estado.flotanteModulos = null;
        break;
      case 'cerrar-flotante':
        cerrarFlotantes();
        break;
      case 'alternar-app': {
        const n = Number(id);
        const nuevo = estado.aplicativoAbierto === n ? null : n;
        // Al cerrar un aplicativo, su árbol vuelve a empezar contraído (como al destruirse en Angular)
        if (estado.aplicativoAbierto) {
          delete expandidos['acordeon-lateral-' + estado.aplicativoAbierto];
          delete expandidos['acordeon-capa-' + estado.aplicativoAbierto];
        }
        estado.aplicativoAbierto = nuevo;
        if (nuevo === null) almacen.quitar(CLAVE_APLICATIVO);
        else almacen.guardar(CLAVE_APLICATIVO, String(nuevo));
        break;
      }
      case 'nodo': {
        const nodo = buscarNodo(D.arboles[Number(el.dataset.app)] || [], Number(id));
        if (!nodo) return;
        if (nodo.hijos.length > 0) {
          const grupos = expandidosDe(el.dataset.arbol);
          if (!grupos.delete(nodo.id)) grupos.add(nodo.id);
        } else if (puedeAbrir(nodo)) {
          abrirPantalla(PANTALLAS.find((p) => p.aplicativo.id === Number(el.dataset.app) && p.nodo.id === nodo.id));
          return;
        } else {
          return;
        }
        break;
      }
      case 'abrir':
        abrirPantalla(pantallaDe(el));
        return;
      case 'limpiar-filtro':
        estado.filtro = '';
        dibujar();
        enfocar('.pi-filtro-input');
        return;
      case 'tema':
      case 'modo-tema':
        aplicarModo(el.dataset.valor);
        avisarEstado();
        break;
      case 'idioma':
        estado.idioma = el.dataset.valor;
        almacen.guardar('demoInicio:idioma', estado.idioma);
        avisarEstado();
        break;
      case 'fijar':
        fijar(pantallaDe(el));
        return;
      case 'quitar-fijado':
        quitarFijado(pantallaDe(el));
        return;
      case 'deshacer':
        deshacerQuitarFijado();
        return;
      case 'cerrar-deshacer':
        clearTimeout(temporizadorDeshacer);
        estado.deshacer = null;
        break;
      case 'borrar-recientes':
        guardarLista(PREFIJO_RECIENTES, []);
        break;
      case 'barra':
        if (id === 'inicio') {
          estado.capa = null;
          dibujar();
          const centro = app.querySelector('.pi-centro');
          if (centro) centro.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        if (id === 'buscar') {
          abrirBuscador();
          return;
        }
        estado.capa = estado.capa === id ? null : id;
        break;
      case 'cerrar-aviso':
        almacen.guardar('avisoSesionCerrado', `${estado.venceSesion}|${estado.aviso === 'cambios' ? 'cambios' : 'neutro'}`, sessionStorage);
        break;
      default:
        return;
    }
    dibujar();
  });

  // ----- Escritura: filtro de módulos y buscador -----
  app.addEventListener('input', (evento) => {
    const el = evento.target;
    if (el.dataset.accion === 'filtro') {
      estado.filtro = el.value;
      dibujar();
    } else if (el.dataset.accion === 'buscador-texto') {
      estado.buscador.texto = el.value;
      estado.buscador.activo = 0;
      dibujar();
    }
  });

  // Pasar el mouse por una opción del buscador la activa
  app.addEventListener('mousemove', (evento) => {
    const opcion = evento.target.closest && evento.target.closest('.pi-opcion');
    if (opcion && Number(opcion.dataset.indice) !== estado.buscador.activo) marcarActiva(Number(opcion.dataset.indice), false);
  });

  // Scroll en la barra compacta de módulos: se cierra su panel flotante
  app.addEventListener('scroll', (evento) => {
    if (estado.flotanteModulos && evento.target.classList && evento.target.classList.contains('pi-barra-iconos')) {
      estado.flotanteModulos = null;
      dibujar();
    }
  }, true);

  // ----- Teclado -----
  document.addEventListener('keydown', (evento) => {
    const objetivo = evento.target;
    const datos = objetivo && objetivo.dataset ? objetivo.dataset : {};

    // Buscador: flechas en círculo, Enter abre, Esc cierra
    if (estado.buscador.abierto && datos.accion === 'buscador-texto') {
      const total = app.querySelectorAll('.pi-opcion').length;
      if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
        evento.preventDefault();
        if (total) marcarActiva((estado.buscador.activo + (evento.key === 'ArrowDown' ? 1 : total - 1)) % total, true);
        return;
      }
      if (evento.key === 'Enter') {
        evento.preventDefault();
        const opcion = app.querySelectorAll('.pi-opcion')[estado.buscador.activo];
        if (opcion) abrirPantalla(pantallaDe(opcion));
        return;
      }
      if (evento.key === 'Escape') {
        evento.preventDefault();
        cerrarBuscador();
        return;
      }
    }

    // Selector del modo de la interfaz: las flechas pasan a la opción vecina y la eligen
    if (datos.accion === 'modo-tema') {
      const salto = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[evento.key];
      if (salto) {
        evento.preventDefault();
        const modos = ['claro', 'oscuro', 'automatico'];
        const siguiente = modos[(modos.indexOf(estado.modoTema) + salto + modos.length) % modos.length];
        aplicarModo(siguiente);
        dibujar();
        avisarEstado();
        enfocar(`[data-foco="modo-${siguiente}"]`);
        return;
      }
    }

    // Filtro de módulos: Esc solo lo limpia
    if (datos.accion === 'filtro' && evento.key === 'Escape') {
      estado.filtro = '';
      dibujar();
      return;
    }

    // Menú del usuario: flechas en círculo, Inicio/Fin
    if (estado.menuAbierto && objetivo.closest && objetivo.closest('[data-menu]')) {
      const items = [...app.querySelectorAll('[data-menu] [role^="menuitem"]')];
      const actual = items.indexOf(document.activeElement);
      const destino = { ArrowDown: (actual + 1) % items.length, ArrowUp: (actual - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[evento.key];
      if (destino !== undefined) {
        evento.preventDefault();
        items[destino].focus();
        return;
      }
    }

    if (evento.key === 'Escape') {
      if (estado.buscador.abierto) {
        cerrarBuscador();
        return;
      }
      if (estado.menuAbierto) {
        estado.menuAbierto = false;
        cerrarFlotantes();
        estado.capa = null;
        dibujar();
        enfocar('.pi-menu-disparador');
        return;
      }
      if (estado.flotanteModulos || estado.flotantePreferencias || estado.capa) {
        cerrarFlotantes();
        estado.capa = null;
        dibujar();
      }
      return;
    }

    const ctrl = evento.ctrlKey || evento.metaKey;
    const tecla = (evento.key || '').toLowerCase();
    const escribiendo = objetivo && objetivo.closest && objetivo.closest('input, textarea, [contenteditable="true"]');

    if (ctrl && !evento.altKey && !evento.shiftKey && tecla === 'z' && estado.deshacer && !escribiendo) {
      evento.preventDefault();
      deshacerQuitarFijado();
    } else if (ctrl && !evento.altKey && !evento.shiftKey && tecla === 'k') {
      evento.preventDefault();
      abrirBuscador();
    } else if (ctrl && !evento.altKey && !evento.shiftKey && tecla === 'b' && !estado.buscador.abierto) {
      evento.preventDefault();
      if (conPaneles()) cambiarPanel('modulos', efectivo('modulos') === 'expandido' ? 'compacto' : 'expandido');
      else estado.capa = estado.capa === 'modulos' ? null : 'modulos';
      cerrarFlotantes();
      dibujar();
    } else if (ctrl && evento.shiftKey && !evento.altKey && tecla === 'l') {
      evento.preventDefault();
      alternarLimpio();
      dibujar();
    } else if (evento.altKey && !ctrl && !evento.shiftKey && /^Digit[1-8]$/.test(evento.code || '') && !estado.buscador.abierto) {
      // `code` y no `key`: con Alt, algunas distribuciones de teclado cambian el carácter
      const fijado = accesos().fijados[Number(evento.code.slice(5)) - 1];
      if (fijado) {
        evento.preventDefault();
        abrirPantalla(fijado);
      }
    }
  });

  // Al cambiar el ancho: los flotantes se cierran (se ubicaron para el ancho anterior) y, si cambia
  // la regla de tamaño, se redibuja con la nueva. Como EstadoPanelesService, se escucha cada corte
  // con matchMedia (más fiable que `resize` solo) y, además, `resize` para los flotantes.
  let tamanoActual = tamano();
  function alCambiarAncho() {
    const flotantes = estado.flotanteModulos || estado.flotantePreferencias;
    cerrarFlotantes();
    if (tamano() !== tamanoActual || flotantes) {
      tamanoActual = tamano();
      if (conPaneles()) estado.capa = null;
      dibujar();
      avisarEstado();
    }
  }
  TAMANOS.filter((x) => x.desde > 0).forEach((x) => window.matchMedia(`(min-width: ${x.desde}px)`).addEventListener('change', alCambiarAncho));
  window.addEventListener('resize', alCambiarAncho);

  // Tema inicial: automático (el del sistema), o el que pida el panel de la demo (?tema=oscuro)
  const parametros = new URLSearchParams(location.search);
  aplicarModo(['claro', 'oscuro', 'automatico'].includes(parametros.get('tema')) ? parametros.get('tema') : 'automatico');
  if (parametros.get('temporada')) MENSAJES.temporada(parametros.get('temporada'));

  dibujar();
  actualizarTiempo();
  avisarEstado();

})();
