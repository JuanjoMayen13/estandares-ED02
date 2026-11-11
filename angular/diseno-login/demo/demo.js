(function () {
  'use strict';

  // ─── Datos del demo ───
  var BANDERAS = { es: 'img/es.png', us: 'img/us.png', fr: 'img/fr.png', de: 'img/de.png' };
  var TEXTOS = window.TEXTOS_LOGIN;
  var IDIOMAS = [
    { codigo: 'es', nombre: 'Español', bandera: BANDERAS.es },
    { codigo: 'en', nombre: 'English', bandera: BANDERAS.us },
    { codigo: 'fr', nombre: 'Français', bandera: BANDERAS.fr },
    { codigo: 'de', nombre: 'Deutsch', bandera: BANDERAS.de }
  ];
  // Logo de ejemplo (en el portal es el logo real de la empresa, guardado en el navegador)
  var LOGO_EJEMPLO = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">' +
      '<rect x="4" y="4" width="112" height="72" rx="14" fill="#1e40af"/>' +
      '<circle cx="34" cy="40" r="16" fill="#fbbf24"/>' +
      '<text x="58" y="47" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#fff">LOGO</text>' +
    '</svg>'
  );
  var EMPRESAS = [
    { nombre: 'Distribuidora Central, S.A.', estaciones: ['Caja 1', 'Caja 2', 'Bodega principal'] },
    { nombre: 'Comercial del Norte', estaciones: ['Mostrador'] },
    { nombre: 'Empresa sin estaciones', estaciones: [] }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var estado = {
    idioma: 'es',
    oscuro: false,
    cargando: false,
    empresa: null,
    estacion: null
  };

  // ─── Traducciones ───
  function texto(clave) {
    var partes = clave.split('.');
    var valor = TEXTOS[estado.idioma];
    for (var i = 0; i < partes.length && valor; i++) valor = valor[partes[i]];
    return valor || clave;
  }

  function aplicarTextos() {
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = texto(el.getAttribute('data-t')); });
    document.querySelectorAll('[data-t-placeholder]').forEach(function (el) { el.placeholder = texto(el.getAttribute('data-t-placeholder')); });
    document.querySelectorAll('[data-t-titulo]').forEach(function (el) {
      el.title = texto(el.getAttribute('data-t-titulo'));
      el.setAttribute('aria-label', el.title);
    });
    var tituloTema = texto(estado.oscuro ? 'shared.modoClaro' : 'shared.modoOscuro');
    $('botonTema').title = tituloTema;
    $('botonTema').setAttribute('aria-label', tituloTema);
    document.documentElement.lang = estado.idioma;
    pintarBoton();
  }

  // ─── Menú de idiomas ───
  function pintarIdioma() {
    var actual = IDIOMAS.filter(function (i) { return i.codigo === estado.idioma; })[0];
    $('banderaActual').src = actual.bandera;
    $('codigoActual').textContent = actual.codigo;
    $('menuIdiomas').innerHTML = IDIOMAS.map(function (i) {
      var activa = i.codigo === estado.idioma;
      return '<button type="button" role="menuitem" class="lg-opcion-idioma' + (activa ? ' lg-opcion-idioma--activa' : '') + '" data-codigo="' + i.codigo + '">' +
        '<img src="' + i.bandera + '" class="lg-bandera" alt="" />' +
        '<span class="lg-nombre-idioma">' + i.nombre + '</span>' +
        (activa ? '<i class="fa-solid fa-check lg-check-idioma"></i>' : '') +
        '</button>';
    }).join('');
  }

  function menuIdiomas(abrir) {
    $('menuIdiomas').hidden = !abrir;
    $('cerrarMenu').hidden = !abrir;
    $('botonIdioma').setAttribute('aria-expanded', String(abrir));
    $('chevronIdioma').classList.toggle('lg-chevron--abierto', abrir);
  }

  $('botonIdioma').addEventListener('click', function () { menuIdiomas($('menuIdiomas').hidden); });
  $('cerrarMenu').addEventListener('click', function () { menuIdiomas(false); });
  $('menuIdiomas').addEventListener('click', function (e) {
    var boton = e.target.closest('[data-codigo]');
    if (!boton) return;
    estado.idioma = boton.getAttribute('data-codigo');
    pintarIdioma();
    aplicarTextos();
    menuIdiomas(false);
  });

  // ─── Modo oscuro ───
  $('botonTema').addEventListener('click', function () {
    estado.oscuro = !estado.oscuro;
    document.documentElement.classList.toggle('dark', estado.oscuro);
    $('iconoTema').className = 'fa-solid ' + (estado.oscuro ? 'fa-moon lg-icono-luna' : 'fa-sun lg-icono-sol');
    aplicarTextos();
  });

  // ─── Formulario ───
  var usuario = $('usuario');
  var password = $('password');

  function pintarBoton() {
    var boton = $('botonIngresar');
    boton.disabled = estado.cargando;
    boton.classList.toggle('loading', estado.cargando);
    boton.innerHTML = estado.cargando
      ? '<i class="fa-solid fa-spinner fa-spin shine-text"></i><span class="shine-text">' + texto('labelsLogin.cargandoLogin') + '...</span>'
      : '<span>' + texto('labelsLogin.iniciarSesion') + '</span><i class="fa-solid fa-arrow-right lg-flecha"></i>';
  }

  function marcarError(input, mensaje, conError) {
    input.classList.toggle('campo-error', conError);
    input.classList.toggle('campo-normal', !conError);
    mensaje.hidden = !conError;
  }

  function verificarCampos() {
    if (estado.cargando) return;
    var faltaUsuario = !usuario.value;
    var faltaPass = !password.value;
    marcarError(usuario, $('errorUsuario'), faltaUsuario);
    marcarError(password, $('errorPassword'), faltaPass);
    $('errorGeneral').hidden = !$('demoErrorGeneral').checked;
    if (faltaUsuario || faltaPass || $('demoErrorGeneral').checked) return;

    // Simula la petición de inicio de sesión y luego la carga de empresas
    estado.cargando = true;
    pintarBoton();
    setTimeout(function () {
      estado.cargando = false;
      pintarBoton();
      $('cargandoInfo').hidden = false;
      setTimeout(function () {
        $('cargandoInfo').hidden = true;
        abrirModal();
      }, 800);
    }, 1400);
  }

  $('formulario').addEventListener('submit', function (e) {
    e.preventDefault();
    verificarCampos();
  });

  // Flecha abajo / arriba: pasa entre usuario y contraseña
  usuario.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); password.focus(); }
  });
  password.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') { e.preventDefault(); usuario.focus(); }
  });

  $('guardarSesion').addEventListener('change', function (e) {
    $('switchPista').classList.toggle('lg-switch-pista--activa', e.target.checked);
    $('switchBola').classList.toggle('lg-switch-bola--activa', e.target.checked);
  });

  // ─── Logo de la empresa y servidor ───
  function pintarLogo() {
    var conLogo = $('demoLogo').checked;
    var nucleo = $('nucleo');
    nucleo.classList.toggle('con-logo', conLogo);
    nucleo.innerHTML = conLogo ? '<img src="' + LOGO_EJEMPLO + '" alt="" />' : '<i class="fa-solid fa-shield-halved"></i>';
    var icono = $('iconoEncabezado');
    icono.className = 'login-icono ' + (conLogo ? 'login-icono--logo' : 'login-icono--escudo');
    icono.innerHTML = conLogo ? '<img src="' + LOGO_EJEMPLO + '" alt="" />' : '<i class="fa-solid fa-shield-halved"></i>';
  }

  $('demoLogo').addEventListener('change', pintarLogo);
  $('demoServidor').addEventListener('change', function (e) {
    $('puntoServidor').classList.toggle('lg-servidor-punto--valido', e.target.checked);
  });
  $('demoErrorGeneral').addEventListener('change', function (e) {
    if (!e.target.checked) $('errorGeneral').hidden = true;
  });
  $('botonServidor').addEventListener('click', function () {
    avisar('En el portal aquí se abre la configuración de la URL de la API.');
  });

  // ─── Modal de empresa y estación ───
  function abrirModal() {
    estado.empresa = null;
    estado.estacion = null;
    pintarModal();
    $('modal').hidden = false;
  }

  function opcion(nombre, activa, indice, tipo) {
    return '<li><button type="button" class="lg-opcion' + (activa ? ' lg-opcion--activa' : '') + '" data-' + tipo + '="' + indice + '">' +
      '<span class="lg-opcion-check">' + (activa ? '<i class="fa-solid fa-check"></i>' : '') + '</span>' +
      '<span class="lg-opcion-nombre">' + nombre + '</span></button></li>';
  }

  function pintarModal(cargandoEstaciones) {
    $('contadorEmpresas').textContent = EMPRESAS.length;
    $('listaEmpresas').innerHTML = EMPRESAS.map(function (e, i) { return opcion(e.nombre, estado.empresa === i, i, 'empresa'); }).join('');

    var empresa = estado.empresa === null ? null : EMPRESAS[estado.empresa];
    var estaciones = empresa && !cargandoEstaciones ? empresa.estaciones : [];
    $('cargandoEstaciones').hidden = !cargandoEstaciones;
    $('avisoSinEmpresa').hidden = !!empresa || cargandoEstaciones;
    $('avisoSinEstaciones').hidden = !empresa || cargandoEstaciones || empresa.estaciones.length > 0;
    $('contadorEstaciones').hidden = !empresa || cargandoEstaciones;
    $('contadorEstaciones').textContent = estaciones.length;
    $('listaEstaciones').hidden = !!cargandoEstaciones;
    $('listaEstaciones').innerHTML = estaciones.map(function (nombre, i) { return opcion(nombre, estado.estacion === i, i, 'estacion'); }).join('');
    $('botonGuardar').disabled = estado.empresa === null || estado.estacion === null;
  }

  $('listaEmpresas').addEventListener('click', function (e) {
    var boton = e.target.closest('[data-empresa]');
    if (!boton) return;
    var indice = Number(boton.getAttribute('data-empresa'));
    if (indice === estado.empresa) return;
    estado.empresa = indice;
    estado.estacion = null;
    // Simula la consulta de las estaciones de la empresa elegida
    pintarModal(true);
    setTimeout(function () {
      var estaciones = EMPRESAS[indice].estaciones;
      if (estaciones.length === 1) estado.estacion = 0;
      pintarModal(false);
    }, 700);
  });

  $('listaEstaciones').addEventListener('click', function (e) {
    var boton = e.target.closest('[data-estacion]');
    if (!boton) return;
    estado.estacion = Number(boton.getAttribute('data-estacion'));
    pintarModal(false);
  });

  $('botonGuardar').addEventListener('click', function () {
    $('modal').hidden = true;
    avisar('En el portal aquí se guarda la sesión y se entra al dashboard.');
  });

  $('demoModal').addEventListener('click', abrirModal);

  // ─── Panel y avisos del demo ───
  var temporizadorAviso;
  function avisar(mensaje) {
    var aviso = $('avisoDemo');
    aviso.textContent = mensaje;
    aviso.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(function () { aviso.hidden = true; }, 3000);
  }

  $('plegarPanel').addEventListener('click', function () { $('panelDemo').classList.toggle('plegado'); });

  // ─── Bolas de la órbita: misma lógica que BolaArrastrableDirective ───
  var VENTANA_VELOCIDAD_MS = 100;
  var FUERZA_LANZAMIENTO = 0.65;
  var VELOCIDAD_MAXIMA = 1;
  var FRENADO_MS = 900;
  var VELOCIDAD_MINIMA = 0.005;

  function normalizar(grados) { return ((grados % 360) + 360) % 360; }
  function diferenciaAngular(actual, previo) { return ((((actual - previo) % 360) + 540) % 360) - 180; }

  function hacerArrastrable(bola) {
    var orbita = bola.parentElement;
    var arrastrando = false;
    var giro = 0;
    var anguloPrevio = 0;
    var muestras = [];
    var cuadroInercia = 0;

    function animacion() { return orbita.getAnimations()[0]; }

    function anguloDelPuntero(e) {
      var caja = (orbita.parentElement || orbita).getBoundingClientRect();
      return (Math.atan2(e.clientY - (caja.top + caja.height / 2), e.clientX - (caja.left + caja.width / 2)) * 180) / Math.PI;
    }

    function leerGiro() {
      var t = getComputedStyle(orbita).transform;
      var m = t && t !== 'none' ? new DOMMatrix(t) : new DOMMatrix();
      return normalizar((Math.atan2(m.b, m.a) * 180) / Math.PI);
    }

    function aplicarGiro(grados) {
      var g = normalizar(grados);
      var anim = animacion();
      var tiempos = anim && anim.effect ? anim.effect.getComputedTiming() : null;
      var duracion = tiempos ? Number(tiempos.duration) : 0;
      if (anim && duracion > 0) {
        var avance = tiempos.direction === 'reverse' ? 1 - g / 360 : g / 360;
        anim.currentTime = avance * duracion;
      } else {
        orbita.style.transform = 'rotate(' + g + 'deg)';
      }
    }

    function velocidadNormal() {
      var anim = animacion();
      var tiempos = anim && anim.effect ? anim.effect.getComputedTiming() : null;
      var duracion = tiempos ? Number(tiempos.duration) : 0;
      if (!(duracion > 0)) return 0;
      return (tiempos.direction === 'reverse' ? -360 : 360) / duracion;
    }

    function velocidadAlSoltar() {
      var ahora = performance.now();
      var recientes = muestras.filter(function (m) { return ahora - m.tiempo <= VENTANA_VELOCIDAD_MS; });
      if (recientes.length < 2) return 0;
      var primera = recientes[0];
      var ultima = recientes[recientes.length - 1];
      var tiempo = ultima.tiempo - primera.tiempo;
      if (tiempo <= 0) return 0;
      var v = ((ultima.giro - primera.giro) / tiempo) * FUERZA_LANZAMIENTO;
      return Math.max(-VELOCIDAD_MAXIMA, Math.min(VELOCIDAD_MAXIMA, v));
    }

    function iniciarInercia(velocidadInicial) {
      var anim = animacion();
      var normal = velocidadNormal();
      var sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!anim || sinMovimiento || Math.abs(velocidadInicial - normal) < VELOCIDAD_MINIMA) {
        if (anim) anim.play();
        return;
      }
      var velocidad = velocidadInicial;
      var anterior = performance.now();
      function paso(ahora) {
        var transcurrido = Math.min(ahora - anterior, 50);
        anterior = ahora;
        velocidad = normal + (velocidad - normal) * Math.exp(-transcurrido / FRENADO_MS);
        giro += velocidad * transcurrido;
        aplicarGiro(giro);
        if (Math.abs(velocidad - normal) < VELOCIDAD_MINIMA) {
          anim.play();
          return;
        }
        cuadroInercia = requestAnimationFrame(paso);
      }
      cuadroInercia = requestAnimationFrame(paso);
    }

    bola.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      cancelAnimationFrame(cuadroInercia);
      bola.setPointerCapture(e.pointerId);
      arrastrando = true;
      var anim = animacion();
      if (anim) anim.pause();
      giro = leerGiro();
      anguloPrevio = anguloDelPuntero(e);
      muestras = [{ tiempo: performance.now(), giro: giro }];
      bola.classList.add('arrastrando');
    });

    bola.addEventListener('pointermove', function (e) {
      if (!arrastrando) return;
      var angulo = anguloDelPuntero(e);
      giro += diferenciaAngular(angulo, anguloPrevio);
      anguloPrevio = angulo;
      aplicarGiro(giro);
      var ahora = performance.now();
      muestras.push({ tiempo: ahora, giro: giro });
      muestras = muestras.filter(function (m) { return ahora - m.tiempo <= VENTANA_VELOCIDAD_MS; });
    });

    function soltar(e) {
      if (!arrastrando) return;
      arrastrando = false;
      if (bola.hasPointerCapture(e.pointerId)) bola.releasePointerCapture(e.pointerId);
      bola.classList.remove('arrastrando');
      iniciarInercia(velocidadAlSoltar());
    }

    bola.addEventListener('pointerup', soltar);
    bola.addEventListener('pointercancel', soltar);
  }

  document.querySelectorAll('.bola').forEach(hacerArrastrable);

  // ─── Inicio ───
  pintarIdioma();
  aplicarTextos();
  pintarLogo();
})();
