# Sesión única — Implementación en Flutter (código)

El código completo de la sesión única en la app móvil: los tres archivos del servicio, los seis puntos donde se engancha, el diálogo que ve el usuario y sus traducciones.

| | |
|---|---|
| **Versión** | 1.0.0 — 2026-10-30 |
| **Repositorio** | `GD02_APPMOVIL` |
| **Decisiones y trampas** | `Sesion_Unica_Flutter.md` — las notas de la implementación (no está en este repositorio) |
| **Contrato del API** | [backend/api/sesion-unica.md](../backend/api/sesion-unica.md) |
| **Scripts** | [backend/sql/sesion-unica.md](../backend/sql/sesion-unica.md) |
| **Diseño completo** | `Implementacion_Sesion_Unica.md` (no está en este repositorio) |
| **Lado de Angular** | [angular/sesion-unica.md](../angular/sesion-unica.md) |

> Este documento es el **código**; el otro de Flutter son las **decisiones**. Si solo se va a leer uno para portar la idea a otra plataforma, es este.

---

## La decisión que define todo lo demás

La app hace sus peticiones con las funciones de nivel superior de `package:http` (`http.get`, `http.post`, …) repartidas en **49 archivos**, más tres clientes de `Dio` para subir archivos. Detectar el 401 de sesión cerrada tocando cada uno de esos 49 archivos era inviable y, peor, frágil: el que se agregara mañana se olvidaría.

La solución fue instalar **un cliente HTTP compartido en la zona de ejecución**, con `http.runWithClient`. A partir de ahí toda petición de `package:http` pasa por él sin que ningún servicio lo sepa. `Dio` queda fuera de esa zona, así que lleva su propio interceptor.

Eso explica por qué el servicio es un *singleton* y navega con una `GlobalKey<NavigatorState>`: la detección ocurre **dentro del cliente HTTP**, muy lejos del árbol de widgets, donde no hay `BuildContext` ni `Provider` a mano.

---

## Dependencia

```yaml
# business/core/pubspec.yaml
dependencies:
  signalr_netcore: ^1.4.4
```

---

## Archivos

### Nuevos — `business/core/lib/services/sesion_unica/`

| Archivo | Qué hace |
|---|---|
| `sesion_hub.dart` | La conexión SignalR. Aísla el paquete en un solo archivo |
| `sesion_unica_service.dart` | El cerebro: decide, limpia y navega |
| `sesion_clientes_http.dart` | Los dos enganches de red (`http` y `Dio`) |

### Nuevo — diálogo

| Archivo | Qué hace |
|---|---|
| `business/lib/shared/widgets/ui/dialogo_sesion_cerrada.dart` | El aviso que ve el usuario |

### Modificados

| Archivo | Qué cambió |
|---|---|
| `business/lib/main.dart` | `runWithClient`, `navigatorKey`, ciclo de vida, ruta `/login` |
| `business/core/lib/services/login_service.dart` | Manda `pPlataforma` |
| `business/lib/auth/login.dart` | Conecta el hub y muestra el aviso |
| `business/lib/widgets/splash_screen.dart` | Conecta el hub con la sesión guardada |
| `business/lib/shared/widgets/ui/mensajes.dart` | Red de respaldo del embudo de errores |
| `excel_uploader.dart`, `migrarSql.dart`, `trasladoDatos.dart` | `crearDioConSesion()` |
| `business/lib/i18n/{es,en,de,fr}/sesion.i18n.json` | Los textos del diálogo |

---

## 1. `sesion_hub.dart`

Envuelve `signalr_netcore` para que el resto de la app no sepa que por debajo hay SignalR. No decide nada: cuando llega el aviso llama a `alCerrarse`.

```dart
// Conexión al hub de sesión del API (SignalR).
//
// Aísla el paquete `signalr_netcore` en un solo archivo: el resto de la app
// habla con `SesionUnicaService` y no sabe que por debajo hay SignalR.
//
// El hub vive en `{baseUrl}/GD02/Apis/api/hub/sesion`, exige token y, al
// conectarse, el API une la conexión al grupo de su propia sesión. El cliente
// no invoca ningún método: solo escucha el evento `SesionCerrada`.

import 'package:signalr_netcore/signalr_client.dart';

/// Nombre del evento que envía el API cuando la sesión se cerró desde otro
/// dispositivo.
const String _eventoSesionCerrada = 'SesionCerrada';

/// Lo que trae el evento `SesionCerrada`:
/// `{ motivo: 'NUEVO_LOGIN', plataformaNueva: 'WEB' }`.
class AvisoSesionCerrada {
  const AvisoSesionCerrada({required this.motivo, this.plataformaNueva});

  /// Por qué se cerró la sesión. Hoy el API solo manda `NUEVO_LOGIN`.
  final String motivo;

  /// Dónde se inició la sesión que cerró a esta: `WEB`, `MOVIL`, o `null` si
  /// el cliente que inició sesión no reportó su plataforma. Define el texto
  /// que se le muestra al usuario.
  final String? plataformaNueva;

  /// Lee los argumentos con los que SignalR entrega el evento.
  ///
  /// Si el API cambiara la forma del mensaje, el aviso igual se procesa: lo
  /// que falte queda en `DESCONOCIDO` y `null`, y el usuario ve el texto
  /// genérico en lugar de ninguno.
  factory AvisoSesionCerrada.desdeArgumentos(List<Object?>? argumentos) {
    final primero =
        (argumentos == null || argumentos.isEmpty) ? null : argumentos.first;
    if (primero is! Map) {
      return const AvisoSesionCerrada(motivo: 'DESCONOCIDO');
    }

    final motivo = primero['motivo'];
    final plataforma = primero['plataformaNueva'];

    return AvisoSesionCerrada(
      motivo: motivo is String ? motivo : 'DESCONOCIDO',
      plataformaNueva: plataforma is String ? plataforma : null,
    );
  }

  @override
  String toString() =>
      'motivo: $motivo, plataformaNueva: ${plataformaNueva ?? 'no reportada'}';
}

/// Envuelve la conexión de SignalR al hub de sesión.
///
/// No decide nada: cuando llega el aviso llama a [alCerrarse] y quien lo
/// construyó se encarga de sacar al usuario.
class SesionHub {
  SesionHub(
      {required this.url,
      required this.obtenerToken,
      required this.alCerrarse});

  /// URL completa del hub.
  final String url;

  /// Devuelve el token vigente. Se consulta en cada conexión y reconexión, así
  /// que después de un login nuevo ya entrega el token nuevo.
  final Future<String> Function() obtenerToken;

  /// Se llama cuando el API avisa que esta sesión se cerró.
  final void Function(AvisoSesionCerrada aviso) alCerrarse;

  HubConnection? _conexion;

  /// `true` solo si la conexión está realmente en pie.
  ///
  /// Mira el estado que reporta SignalR y no la simple existencia del objeto:
  /// cuando la reconexión automática se da por vencida, el objeto sigue ahí
  /// pero ya no escucha nada, y entonces hay que volver a conectar.
  bool get conectado =>
      _conexion != null &&
      (_conexion!.state == HubConnectionState.Connected ||
          _conexion!.state == HubConnectionState.Connecting ||
          _conexion!.state == HubConnectionState.Reconnecting);

  /// Levanta la conexión. Si falla no lanza: la seguridad no depende del hub,
  /// porque la siguiente petición al API devuelve 401 `SESION_INVALIDADA`.
  ///
  /// Devuelve `true` solo si el hub quedó conectado.
  Future<bool> conectar() async {
    if (_conexion != null) return true;

    final conexion = HubConnectionBuilder()
        .withUrl(
          url,
          options: HttpConnectionOptions(
            // El token viaja en la query string `access_token`, que es lo que
            // el API lee en `OnMessageReceived`.
            accessTokenFactory: obtenerToken,
            // El valor por omisión del paquete son 2 segundos, muy poco para
            // una red móvil: la negociación fallaría por tiempo con frecuencia.
            requestTimeout: 15000,
          ),
        )
        .withAutomaticReconnect()
        .build();

    conexion.on(_eventoSesionCerrada, (List<Object?>? argumentos) {
      alCerrarse(AvisoSesionCerrada.desdeArgumentos(argumentos));
    });

    _conexion = conexion;

    try {
      await conexion.start();
      return true;
    } catch (error) {
      // Sin hub se pierde el aviso inmediato, no la protección.
      print('SesionHub: no se pudo conectar a $url. Detalle: $error');
      _conexion = null;
      try {
        await conexion.stop();
      } catch (_) {}
      return false;
    }
  }

  /// Cierra la conexión. Nunca lanza.
  Future<void> desconectar() async {
    final conexion = _conexion;
    if (conexion == null) return;
    _conexion = null;
    try {
      conexion.off(_eventoSesionCerrada);
      await conexion.stop();
    } catch (error) {
      print('SesionHub: error al desconectar. Detalle: $error');
    }
  }
}
```

### Tres detalles que costaron

**`requestTimeout: 15000`.** El valor por omisión del paquete son **2 segundos**, que en una red móvil no alcanza para la negociación inicial. Con el valor por omisión, el hub fallaba seguido en el teléfono y funcionaba siempre en el emulador — el peor tipo de error.

**`conectado` mira el estado, no el objeto.** Cuando `withAutomaticReconnect()` se da por vencido, el objeto `HubConnection` sigue existiendo pero ya no escucha nada. Si `conectado` solo preguntara `_conexion != null`, la app creería estar escuchando y nunca reintentaría.

**`conectar()` nunca lanza.** Devuelve `false` y registra el detalle. Un fallo del hub **no es un error que mostrarle al usuario**: la protección no depende de él.

---

## 2. `sesion_unica_service.dart`

El punto único de decisión.

```dart
// Sesión única: un usuario, una sesión.
//
// Cuando el usuario inicia sesión en otro dispositivo (el portal web u otro
// teléfono), el API cierra esta sesión. Este servicio se encarga de enterarse y
// de sacar al usuario al login con un aviso claro.
//
// Hay dos caminos y los dos terminan aquí:
//
//   1. Aviso inmediato por SignalR (`SesionCerrada`), si la app está abierta y
//      con red. Es comodidad.
//   2. Un 401 con `errorCode = SESION_INVALIDADA` en cualquier petición. Es la
//      garantía: aunque el aviso no llegue, el token viejo ya no sirve.

import 'dart:convert';

import 'package:core/services/login_service.dart';
import 'package:core/services/sesion_unica/sesion_hub.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// Qué se le tiene que explicar al usuario cuando llegue al login.
///
/// El servicio guarda **el caso**, no el texto ya resuelto. Así el diálogo lo
/// traduce con `context.t` en el momento de mostrarlo: sale en el idioma
/// que el usuario tenga puesto, y no hace falta leer el catálogo desde aquí,
/// que es código sin `BuildContext`.
enum AvisoSesion {
  /// Se inició sesión con el mismo usuario en otra app móvil.
  movil,

  /// Se inició sesión con el mismo usuario en el portal web.
  web,

  /// No se sabe desde dónde: el aviso no traía la plataforma, o el caso llegó
  /// por el 401, que no la reporta.
  otroDispositivo,
}

/// Punto único donde se maneja la sesión única.
///
/// Es un *singleton* a propósito: la detección del 401 ocurre dentro del
/// cliente HTTP, muy lejos del árbol de widgets, donde no hay `context` ni
/// `Provider` a mano.
class SesionUnicaService {
  SesionUnicaService._();

  /// Instancia única.
  static final SesionUnicaService instancia = SesionUnicaService._();

  /// Plataforma que se reporta al API en el login (regla C-01).
  static const String plataforma = 'MOVIL';

  /// Código con el que el API marca un 401 por sesión cerrada (regla V-05).
  static const String codigoSesionInvalidada = 'SESION_INVALIDADA';

  /// Ruta de la pantalla de login, registrada en `main.dart`.
  static const String rutaLogin = '/login';

  /// Traduce la plataforma que reporta el API al caso que se le explica al
  /// usuario. Los textos viven en el catálogo (`sesionCerrada*`) y los resuelve
  /// el diálogo; aquí solo se decide cuál toca.
  ///
  /// Cualquier valor que no sea `WEB` ni `MOVIL` —`null`, `DESCONOCIDA`, o uno
  /// nuevo que agregue el API más adelante— cae en el caso genérico, así que el
  /// usuario nunca se queda sin explicación.
  static AvisoSesion avisoPara(String? plataformaNueva) {
    switch (plataformaNueva?.trim().toUpperCase()) {
      case 'MOVIL':
        return AvisoSesion.movil;
      case 'WEB':
        return AvisoSesion.web;
      default:
        return AvisoSesion.otroDispositivo;
    }
  }

  /// Llave del navegador raíz, para poder navegar sin `context`.
  /// La asigna `main.dart` al construir el `MaterialApp`.
  GlobalKey<NavigatorState>? navigatorKey;

  final LoginService _loginService = LoginService();

  SesionHub? _hub;
  String? _baseUrl;
  String? _token;

  /// Evita repetir el aviso cuando varias peticiones fallan a la vez (C-08).
  bool _cerrando = false;

  /// Lo que la pantalla de login debe explicarle al usuario al abrirse.
  AvisoSesion? _avisoPendiente;

  /// `true` si hay una conexión al hub levantada.
  bool get hubConectado => _hub?.conectado ?? false;

  /// `true` desde el momento en que la sesión empezó a cerrarse.
  ///
  /// Lo consultan las pantallas que estaban navegando cuando llegó el aviso,
  /// para no empujar una pantalla nueva encima del login.
  bool get cerrando => _cerrando;

  // ───────────────────────── Pantalla de login ─────────────────────────

  /// Devuelve el aviso pendiente y lo borra, para que se muestre **una sola
  /// vez** aunque la pantalla de login se reconstruya (C-08).
  AvisoSesion? tomarAvisoPendiente() {
    final aviso = _avisoPendiente;
    _avisoPendiente = null;
    return aviso;
  }

  // ─────────────────────────── Conexión al hub ──────────────────────────

  /// Conecta al hub de sesión. Se llama después de un login correcto y al
  /// arrancar la app si ya había una sesión guardada (regla C-02).
  Future<void> conectar(
      {required String baseUrl, required String token}) async {
    if (token.isEmpty) return;

    // Ya está conectado con este mismo token: no hay nada que hacer.
    if (hubConectado && _token == token) return;

    // Si quedó una conexión de la sesión anterior, se cierra antes de seguir.
    // Importa: esa conexión escucha por la sesión vieja, y el aviso de que la
    // sesión vieja se cerró —que lo dispara este mismo login— terminaría
    // sacando al usuario que acaba de entrar.
    final anterior = _hub;
    if (anterior != null) {
      _hub = null;
      await anterior.desconectar();
    }

    _baseUrl = baseUrl;
    _token = token;
    // Sesión nueva: se vuelve a permitir el aviso.
    _cerrando = false;

    final hub = SesionHub(
      url: urlApi(baseUrl, 'hub/sesion'),
      obtenerToken: () async => _token ?? '',
      alCerrarse: (aviso) {
        print('SesionUnicaService: el API cerró esta sesión ($aviso).');
        sesionInvalidada(avisoPara(aviso.plataformaNueva));
      },
    );
    _hub = hub;

    if (!await hub.conectar()) {
      // No quedó conectado: se descarta para poder reintentar más adelante.
      _hub = null;
    }
  }

  /// Reconecta el hub al volver del segundo plano (regla C-07).
  ///
  /// Si la sesión ya no es vigente, el hub no logra conectarse y la primera
  /// petición al API devuelve el 401 que maneja [revisarRespuesta].
  Future<void> reconectar() async {
    if (_cerrando || hubConectado) return;

    final baseUrl = _baseUrl;
    final token = _token;
    if (baseUrl == null || token == null || token.isEmpty) return;

    // `conectar` se encarga de desechar la conexión muerta antes de abrir otra.
    await conectar(baseUrl: baseUrl, token: token);
  }

  // ──────────────────────── Detección del 401 ───────────────────────────

  /// Revisa una respuesta del API y, si es un 401 por sesión cerrada, saca al
  /// usuario (regla C-04).
  ///
  /// La llama el cliente HTTP compartido, así que cubre todas las peticiones
  /// sin tocar cada servicio. No espera a nada: devuelve de inmediato para que
  /// la petición original siga su curso normal.
  void revisarRespuesta({required int statusCode, required String cuerpo}) {
    if (statusCode != 401) return;
    manejarErrorDeSesion(cuerpo);
  }

  /// Revisa el texto de un error y, si es el 401 por sesión cerrada, saca al
  /// usuario. Devuelve `true` cuando lo era, para que quien llama no muestre
  /// además su propio diálogo de error.
  ///
  /// Es la red de respaldo del embudo de errores de la app. Hace falta porque
  /// Flutter no garantiza que todos sus *callbacks* corran en la zona donde se
  /// instaló el cliente HTTP compartido: una petición que se escape de la zona
  /// no pasa por [revisarRespuesta], pero su error sí llega aquí.
  bool manejarErrorDeSesion(String cuerpo) {
    if (!esSesionInvalidada(cuerpo)) return false;
    // El 401 no dice desde dónde se inició la sesión nueva, así que toca el
    // caso genérico. Tampoco se usa el `message` que trae la respuesta: su
    // redacción es otra, y el usuario debe leer siempre el mismo aviso venga
    // del hub o de una petición.
    sesionInvalidada(AvisoSesion.otroDispositivo);
    return true;
  }

  /// `true` si el texto es una respuesta del API con
  /// `errorCode = SESION_INVALIDADA`.
  ///
  /// Recibe el cuerpo tal como llegó o un `Exception.toString()`, porque los
  /// servicios de la app lanzan el cuerpo completo dentro de la excepción.
  static bool esSesionInvalidada(String cuerpo) {
    if (!cuerpo.contains(codigoSesionInvalidada)) return false;
    final mapa = _comoMapa(cuerpo);
    return mapa != null && mapa['errorCode'] == codigoSesionInvalidada;
  }

  /// Interpreta el texto como JSON. Tolera el prefijo que agrega
  /// `Exception.toString()` (`Exception: {...}`).
  static Map<String, dynamic>? _comoMapa(String cuerpo) {
    final inicio = cuerpo.indexOf('{');
    if (inicio < 0) return null;
    try {
      final decodificado = json.decode(cuerpo.substring(inicio));
      return decodificado is Map<String, dynamic> ? decodificado : null;
    } catch (_) {
      return null;
    }
  }

  // ───────────────────────── Cierre de la sesión ────────────────────────

  /// La sesión se cerró desde otro dispositivo: limpia lo local, regresa al
  /// login y deja el aviso listo para mostrarse (reglas C-03 y C-04).
  ///
  /// Solo actúa la primera vez: las llamadas que lleguen después mientras se
  /// está cerrando se ignoran, para no mostrar el aviso varias veces (C-08).
  Future<void> sesionInvalidada(AvisoSesion aviso) async {
    if (_cerrando) return;
    _cerrando = true;

    _avisoPendiente = aviso;
    await _limpiar();
    _irAlLogin();
  }

  /// Botón «Cerrar sesión»: avisa al API y después borra la sesión local
  /// (regla C-06).
  ///
  /// Si la llamada al API falla —sin red, sesión ya cerrada— la sesión local se
  /// cierra de todos modos: dejar al usuario dentro sería peor.
  Future<void> cerrarSesion() async {
    _cerrando = true;
    await _avisarCierreAlApi();
    await _limpiar();
  }

  /// `POST api/Sesion/cerrar`, sin cuerpo: el API toma la sesión del token.
  Future<void> _avisarCierreAlApi() async {
    final baseUrl = _baseUrl ?? await _baseUrlGuardada();
    final token = _token ?? await _tokenGuardado();
    if (baseUrl == null || token == null || token.isEmpty) return;

    try {
      final respuesta = await http.post(
        Uri.parse(urlApi(baseUrl, 'Sesion/cerrar')),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );
      print('SesionUnicaService: cierre de sesión ${respuesta.statusCode}.');
    } catch (error) {
      print('SesionUnicaService: no se pudo avisar el cierre. Detalle: $error');
    }
  }

  /// Borra el token, los datos de la sesión y la conexión al hub.
  Future<void> _limpiar() async {
    _token = null;
    final hub = _hub;
    _hub = null;
    await hub?.desconectar();
    await _loginService.clearUserSession();
  }

  /// Regresa a la pantalla de login quitando todo lo que haya encima.
  void _irAlLogin() {
    final navegador = navigatorKey?.currentState;
    if (navegador == null) {
      print('SesionUnicaService: no hay navegador para volver al login.');
      return;
    }
    navegador.pushNamedAndRemoveUntil(rutaLogin, (_) => false);
  }

  // ──────────────────────────── Utilidades ──────────────────────────────

  /// Arma la URL de un recurso del API de GD02.
  ///
  /// Normaliza la diagonal final porque en la app la URL base se guarda con y
  /// sin ella según el servicio que la escribió.
  static String urlApi(String baseUrl, String recurso) {
    final base = baseUrl.replaceAll(RegExp(r'/+$'), '');
    return '$base/GD02/Apis/api/$recurso';
  }

  Future<String?> _baseUrlGuardada() async {
    final sesion = await _loginService.getUserSession();
    final url = sesion['urlBase'];
    return (url is String && url.isNotEmpty) ? url : null;
  }

  Future<String?> _tokenGuardado() async {
    final sesion = await _loginService.getUserSession();
    final token = sesion['token'];
    return (token is String && token.isNotEmpty) ? token : null;
  }
}
```

### Lo que hay que entender de este archivo

**Guarda el caso, no el texto.** `_avisoPendiente` es un `enum`, no un `String`. Este archivo no tiene `BuildContext`, así que no puede leer el catálogo de traducciones; si guardara el texto ya resuelto, saldría en el idioma que estuviera activo cuando llegó el aviso y no en el que el usuario tenga puesto cuando lo lee. El diálogo lo traduce al mostrarlo.

**`_cerrando` evita el diálogo repetido.** Cuando la sesión se cierra, suele haber varias peticiones en vuelo y **todas** reciben el 401. Sin esa bandera, el usuario vería el aviso cinco veces apiladas. La primera llamada gana y las demás salen por el `if (_cerrando) return;`.

**`tomarAvisoPendiente()` consume el aviso.** Lo devuelve y lo borra. Es lo que garantiza que se vea una sola vez aunque la pantalla de login se reconstruya — por un cambio de tema, de idioma o un giro del teléfono.

**Desconectar el hub viejo antes de conectar el nuevo es obligatorio.** Es la trampa más fina de todo esto: al iniciar sesión de nuevo en el mismo teléfono, la conexión vieja sigue escuchando **por la sesión vieja**, y el aviso de que la sesión vieja se cerró — que lo dispara este mismo login — terminaría sacando al usuario que acaba de entrar. Por eso `conectar()` cierra la anterior primero.

**El `message` del 401 se ignora a propósito.** La respuesta trae un texto, pero no se usa: el usuario tiene que leer siempre el mismo aviso venga del hub o de una petición, y el del hub es más específico porque sabe la plataforma.

---

## 3. `sesion_clientes_http.dart`

Los dos enganches que revisan **todas** las respuestas sin tocar los 49 archivos que hacen peticiones.

```dart
// Enganches de red para la sesión única.
//
// La app hace sus peticiones con las funciones de nivel superior de
// `package:http` (`http.get`, `http.post`, …) repartidas en decenas de
// servicios, y con tres clientes de `Dio` para subir archivos. Aquí viven los
// dos enganches que revisan **todas** esas respuestas sin tocar cada servicio:
//
//   * [SesionHttpClient], que se instala una sola vez en `main.dart` con
//     `runWithClient`. A partir de ahí toda petición de `package:http` pasa por
//     él, incluso las de los servicios que no lo conocen.
//   * [SesionDioInterceptor], que se agrega a cada cliente de `Dio`, porque
//     `Dio` no usa `package:http` y queda fuera de `runWithClient`.
//
// Los dos hacen lo mismo: si la respuesta es un 401 con
// `errorCode = SESION_INVALIDADA`, le avisan a `SesionUnicaService` y dejan
// pasar la respuesta intacta, para que el servicio que la pidió siga con su
// manejo de errores normal (regla C-04).

import 'dart:convert';

import 'package:core/services/sesion_unica/sesion_unica_service.dart';
import 'package:dio/dio.dart';
import 'package:http/http.dart' as http;

/// Cliente de `package:http` que vigila los 401 por sesión cerrada.
///
/// Envuelve un cliente real y no lo cierra nunca: vive mientras viva la app,
/// porque las funciones de nivel superior de `http` cierran el cliente después
/// de cada petición y aquí se comparte uno solo.
class SesionHttpClient extends http.BaseClient {
  SesionHttpClient(this._interno);

  /// Cliente real. Se construye **fuera** de `runWithClient` para no volver a
  /// entrar en esta misma envoltura.
  final http.Client _interno;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest peticion) async {
    final respuesta = await _interno.send(peticion);

    // El caso normal no paga nada: solo se inspecciona el cuerpo de los 401,
    // que además son respuestas muy pequeñas.
    if (respuesta.statusCode != 401) return respuesta;

    final bytes = await respuesta.stream.toBytes();

    SesionUnicaService.instancia.revisarRespuesta(
      statusCode: 401,
      cuerpo: utf8.decode(bytes, allowMalformed: true),
    );

    // El cuerpo ya se consumió, así que se devuelve uno equivalente.
    return http.StreamedResponse(
      Stream.value(bytes),
      respuesta.statusCode,
      contentLength: bytes.length,
      request: respuesta.request,
      headers: respuesta.headers,
      isRedirect: respuesta.isRedirect,
      persistentConnection: respuesta.persistentConnection,
      reasonPhrase: respuesta.reasonPhrase,
    );
  }

  /// No cierra el cliente interno: lo comparten todas las peticiones de la app.
  @override
  void close() {}
}

/// Interceptor de `Dio` que vigila los 401 por sesión cerrada.
///
/// Se usa con [crearDioConSesion] o agregándolo a un cliente existente:
///
/// ```dart
/// final dio = Dio()..interceptors.add(SesionDioInterceptor());
/// ```
class SesionDioInterceptor extends Interceptor {
  @override
  void onResponse(Response respuesta, ResponseInterceptorHandler manejador) {
    _revisar(respuesta);
    manejador.next(respuesta);
  }

  @override
  void onError(DioException error, ErrorInterceptorHandler manejador) {
    _revisar(error.response);
    manejador.next(error);
  }

  void _revisar(Response? respuesta) {
    if (respuesta == null || respuesta.statusCode != 401) return;
    SesionUnicaService.instancia.revisarRespuesta(
      statusCode: 401,
      cuerpo: _comoTexto(respuesta.data),
    );
  }

  /// `Dio` entrega el cuerpo ya decodificado cuando es JSON, así que se vuelve
  /// a serializar para revisarlo con la misma lógica que el resto.
  static String _comoTexto(Object? datos) {
    if (datos == null) return '';
    if (datos is String) return datos;
    try {
      return json.encode(datos);
    } catch (_) {
      return datos.toString();
    }
  }
}

/// Crea un cliente de `Dio` que ya vigila la sesión única.
Dio crearDioConSesion() => Dio()..interceptors.add(SesionDioInterceptor());
```

### Los tres puntos finos

**El cuerpo se reconstruye.** Un `StreamedResponse` se puede leer **una sola vez**. Al leerlo para inspeccionarlo, el servicio que pidió la petición se quedaría sin cuerpo. Por eso se vuelve a armar uno equivalente con los mismos bytes y los mismos encabezados.

**`close()` está vacío a propósito.** Las funciones de nivel superior de `http` cierran el cliente después de cada petición. Si este reenviara el cierre al cliente interno, la primera petición dejaría inservible el cliente compartido de toda la app.

**No se corta la respuesta.** El 401 se deja pasar intacto para que el servicio que lo pidió siga con su manejo de errores normal. Es lo que evita tener que revisar qué hace cada uno de los 49 archivos.

---

## 4. Los seis enganches

### `main.dart` — el cliente compartido

```dart
// Llave del navegador raíz. La necesita el servicio de sesión única para poder
// regresar al login desde donde no hay BuildContext a mano: la detección del 401
// por sesión cerrada ocurre dentro del cliente HTTP.
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

// Instala el cliente HTTP compartido en la zona de ejecución: a partir de aquí
// todas las peticiones de package:http —las de core, las de business y las de
// los features— pasan por SesionHttpClient, que avisa cuando el API responde
// 401 SESION_INVALIDADA (regla C-04 de la sesión única). Es lo que evita tener
// que tocar uno por uno los 49 archivos que hacen peticiones.
void main() {
  // El cliente real se construye antes de entrar en la zona, y uno solo para
  // toda la app: las funciones de package:http cierran el cliente después de
  // cada petición, y SesionHttpClient ignora ese cierre a propósito.
  final clienteReal = http.Client();
  http.runWithClient(_iniciarApp, () => SesionHttpClient(clienteReal));
}

// Arranca la aplicación. Era el cuerpo de main y se separó para que envolverlo
// con runWithClient no reindentara todo el árbol de proveedores.
void _iniciarApp() {
  // ... el cuerpo original de main ...
}
```

### `main.dart` — la llave y el ciclo de vida

```dart
@override
void initState() {
  super.initState();
  // Observa el ciclo de vida para reconectar el hub de sesión al volver del
  // segundo plano (regla C-07).
  WidgetsBinding.instance.addObserver(this);
  // Entrega la llave del navegador al servicio de sesión única, que la usa
  // para regresar al login cuando la sesión se cierra desde otro dispositivo.
  SesionUnicaService.instancia.navigatorKey = navigatorKey;
  _solicitarPermisosUbicacion();
  _checkSession();
}

@override
void dispose() {
  // Deja de observar el ciclo de vida antes de liberar el estado.
  WidgetsBinding.instance.removeObserver(this);
  super.dispose();
}

@override
void didChangeAppLifecycleState(AppLifecycleState estado) {
  super.didChangeAppLifecycleState(estado);
  // Al volver del segundo plano la conexión al hub pudo haberse caído. Si la
  // sesión ya no es vigente, el hub no logra conectarse y la primera petición
  // al API devuelve el 401 que saca al usuario (regla C-07).
  if (estado == AppLifecycleState.resumed) {
    SesionUnicaService.instancia.reconectar();
  }
}
```

### `main.dart` — el login como ruta con nombre

```dart
navigatorKey: navigatorKey,
// ...
routes: {
  // Pantalla de login como ruta con nombre. La usa el servicio de sesión
  // única para volver al login cuando la sesión se cierra desde otro
  // dispositivo, sin pasar otra vez por el splash y su animación.
  SesionUnicaService.rutaLogin: (context) => Stack(
    children: [
      if (_isBackgroundSet)
        BackgroundImage(imagePath: _backgroundImagePath),
      LoginScreen(
        imagePath: _backgroundImagePath,
        isBackgroundSet: _isBackgroundSet,
      ),
    ],
  ),
  // ...
}
```

Hizo falta una ruta nueva porque la ruta inicial de la app construye el **splash**, con su animación y su verificación de sesión guardada. Volver ahí después de una expulsión mandaría al usuario por un camino que ya no aplica.

### `login_service.dart` — reportar la plataforma

```dart
// Regla C-01 de la sesion unica: el API registra desde donde se
// inicio la sesion. Sin este campo la registra como DESCONOCIDA.
"pPlataforma": SesionUnicaService.plataforma,   // 'MOVIL'
```

### `login.dart` — conectar y avisar

```dart
// Regla C-02 de la sesión única: ya con el login completo, se escucha al
// API para enterarse al instante si este usuario inicia sesión en otro
// dispositivo. Si el hub no conecta, la protección sigue en pie: la
// siguiente petición recibiría el 401 SESION_INVALIDADA.
await SesionUnicaService.instancia.conectar(
  baseUrl: urlNotifier.url,
  token: token,
);
```

```dart
// En initState:
WidgetsBinding.instance.addPostFrameCallback((_) async {
  // Si el usuario llegó aquí porque su sesión se cerró desde otro
  // dispositivo, se le explica por qué. El mensaje se consume al leerlo,
  // así que aparece una sola vez aunque hayan fallado varias peticiones
  // a la vez (reglas C-03 y C-08 de la sesión única).
  await _avisarSesionCerrada();
  // ... el resto de la inicialización ...
});

// Muestra, si lo hay, el aviso de que la sesión se cerró desde otro
// dispositivo.
Future<void> _avisarSesionCerrada() async {
  final aviso = SesionUnicaService.instancia.tomarAvisoPendiente();
  if (aviso == null || !mounted) return;

  await mostrarDialogoSesionCerrada(context: context, aviso: aviso);
}
```

El aviso se muestra en un `addPostFrameCallback` y **antes** del resto de la inicialización, para que el usuario lea por qué está ahí antes de que la pantalla empiece a cargar la URL y verificar la versión.

### `splash_screen.dart` — reconectar con la sesión guardada

```dart
// Regla C-02 de la sesión única: al arrancar con una sesión guardada hay
// que volver a escuchar el hub, porque la conexión no sobrevive al cierre
// de la app. Si la sesión ya no es vigente, el hub no conecta y la primera
// petición del Layout recibe el 401 que saca al usuario.
await SesionUnicaService.instancia.conectar(
  baseUrl: sessionData['urlBase'] ?? '',
  token: sessionData['token'] ?? '',
);

if (!mounted || SesionUnicaService.instancia.cerrando) return;

// Redirige al layout principal
Navigator.of(context).pushReplacement(...);
```

El `if (... cerrando) return;` es necesario: si la sesión guardada ya no era vigente, el servicio ya navegó al login, y seguir con el `pushReplacement` pondría la pantalla principal **encima** del login.

### `mensajes.dart` — la red de respaldo

```dart
// Si el error es el 401 por sesión cerrada desde otro dispositivo no se
// muestra nada aquí: el servicio de sesión única regresa al login con su
// propio aviso, y un diálogo de error encima solo confundiría (reglas C-04
// y C-08). Esta llamada es además la red de respaldo del enganche del
// cliente HTTP, por si la petición corrió fuera de la zona de runWithClient.
if (SesionUnicaService.instancia.manejarErrorDeSesion(respuestaError)) {
  return;
}
```

Flutter no garantiza que todos sus *callbacks* corran en la zona donde se instaló el cliente compartido. Una petición que se escape de la zona no pasa por el enganche, pero su error sí llega al embudo de errores de la app. Esta línea lo cubre.

### El botón «Cerrar sesión»

```dart
await SesionUnicaService.instancia.cerrarSesion();
```

---

## 5. El diálogo

Es el punto donde todo esto se vuelve visible para el usuario, y por eso no se reutilizó el diálogo de errores de la app.

```dart
// Aviso de que la sesión se cerró porque se inició sesión en otro dispositivo.
//
// Es un diálogo propio y no el genérico de `mensajes.dart` por tres razones:
//
//   * esto no es un error, es una regla de seguridad funcionando, y no debe
//     verse con el triángulo rojo de los errores;
//   * el usuario no puede seguir usando la app, así que el botón tiene que
//     llevarlo a lo único que puede hacer: volver a iniciar sesión;
//   * conviene explicarle **por qué** pasó, porque es un comportamiento nuevo
//     y el reflejo natural es pensar que la app falló.

import 'package:core/common/ThemeNotifier.dart';
import 'package:core/common/notifiers/app_style_notifier.dart';
import 'package:business/i18n/translations.g.dart';
import 'package:core/services/sesion_unica/sesion_unica_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// Muestra el aviso y espera a que el usuario lo acepte.
///
/// No se puede cerrar tocando fuera: el usuario quedó fuera de la aplicación y
/// tiene que leer por qué. El botón de retroceso sí lo cierra, para no dejarlo
/// atrapado si algo saliera mal.
Future<void> mostrarDialogoSesionCerrada({
  required BuildContext context,
  required AvisoSesion aviso,
}) {
  return showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (_) => DialogoSesionCerrada(aviso: aviso),
  );
}

class DialogoSesionCerrada extends StatelessWidget {
  const DialogoSesionCerrada({super.key, required this.aviso});

  /// Desde dónde se inició la sesión que cerró a esta. Lo decide
  /// `SesionUnicaService.avisoPara`; el texto se resuelve aquí, con el idioma
  /// que el usuario tenga puesto en el momento de verlo.
  final AvisoSesion aviso;

  /// El texto del catálogo que corresponde a cada caso. Son los mismos tres
  /// que muestra el portal web.
  String _mensaje(Translations textos) {
    switch (aviso) {
      case AvisoSesion.movil:
        return textos.sesion.movil;
      case AvisoSesion.web:
        return textos.sesion.web;
      case AvisoSesion.otroDispositivo:
        return textos.sesion.otroDispositivo;
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeNotifier = Provider.of<ThemeNotifier>(context);
    final colorNotifier = Provider.of<AppStyleNotifier>(context);
    final textos = context.t;
    final esClaro = themeNotifier.temaClaro;
    final isDark = !esClaro;

    // Misma paleta que el resto de los diálogos propios de la app.
    final bgColor = isDark ? const Color(0xFF1F2937) : Colors.white;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF111827);
    final secondaryTextColor = isDark
        ? Colors.white70
        : const Color(0xFF4B5563);
    final cardBgColor = isDark
        ? Colors.white.withValues(alpha: 0.05)
        : const Color(0xFFF3F4F6);
    final cardBorderColor = isDark ? Colors.white10 : const Color(0xFFE5E7EB);
    final notaTextColor = isDark ? Colors.white54 : const Color(0xFF6B7280);

    // Ámbar y no rojo: la sesión se cerró como estaba previsto, no falló nada.
    const acento = Color(0xFFD97706);
    final botonColor = colorNotifier.getBtnColor(esClaro);

    return Dialog(
      backgroundColor: bgColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 10,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: ConstrainedBox(
        // Sin el límite, en tableta el diálogo se estira y el texto queda en
        // una sola línea larga, incómoda de leer.
        constraints: const BoxConstraints(maxWidth: 400),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Ícono: dos dispositivos y un candado, que es exactamente lo
                // que acaba de pasar.
                Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: acento.withValues(alpha: isDark ? 0.18 : 0.12),
                  ),
                  child: const Icon(
                    Icons.phonelink_lock_outlined,
                    color: acento,
                    size: 34,
                  ),
                ),
                const SizedBox(height: 20),

                Text(
                  textos.sesion.titulo,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: primaryTextColor,
                  ),
                ),
                const SizedBox(height: 12),

                Text(
                  _mensaje(textos),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    height: 1.45,
                    color: secondaryTextColor,
                  ),
                ),
                const SizedBox(height: 20),

                // El porqué. Es lo que evita que el usuario crea que la app
                // falló y lo reporte como un error.
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: cardBgColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: cardBorderColor),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.info_outline_rounded,
                        size: 18,
                        color: notaTextColor,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          textos.sesion.nota,
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.4,
                            color: notaTextColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(
                      Icons.login_rounded,
                      size: 20,
                      color: Colors.white,
                    ),
                    label: Text(
                      textos.sesion.iniciarSesion,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: botonColor,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

### Las decisiones visuales, y por qué importan

**Ámbar (`#D97706`), no rojo.** La sesión se cerró **como estaba previsto**. Con el triángulo rojo de los errores, el usuario reporta un fallo que no existe, y alguien pierde media hora revisando.

**Un ícono que cuenta lo que pasó.** `Icons.phonelink_lock_outlined` son dos dispositivos y un candado, que es literalmente la situación.

**Tres bloques de texto, no uno.** El título dice *qué* pasó, el mensaje dice *desde dónde*, y la nota en la tarjeta gris dice *por qué es así*. Esa tercera parte es la que más sirve: es un comportamiento nuevo, y sin ella el reflejo natural es pensar que la app se rompió.

**Un solo botón, y lleva a lo único posible.** El usuario no puede seguir usando la app; ofrecerle «Cancelar» sería mentirle.

**`barrierDismissible: false`.** No se puede cerrar tocando fuera: hay que leerlo. El botón de retroceso **sí** lo cierra, para no dejar al usuario atrapado si algo saliera mal.

**`maxWidth: 400`.** Sin el límite, en tableta el diálogo se estira y el texto queda en una sola línea larga, incómoda de leer.

> **Nota para la app:** no hay `darkTheme`; el tema es uno solo y claro, y el modo oscuro se maneja a mano con `ThemeNotifier.temaClaro`. Por eso el diálogo declara **todos** sus colores explícitamente en lugar de tomarlos de `Theme.of(context)`, que siempre devolvería los claros.

---

## 6. Las traducciones

Seis llaves en el *namespace* `sesion`, en los cuatro idiomas. El catálogo es **slang**, un archivo por módulo; el español es el idioma base y los que falten caen a él.

```yaml
# business/slang.yaml (extracto)
base_locale: es
fallback_strategy: base_locale
input_directory: lib/i18n
input_file_pattern: .i18n.json
namespaces: true
translate_var: t
```

Después de tocar cualquier `.i18n.json`:

```bash
cd business && dart run slang
```

### Las llaves

| Llave | Dónde se usa |
|---|---|
| `titulo` | Encabezado del diálogo |
| `movil` | Mensaje cuando `plataformaNueva = MOVIL` |
| `web` | Mensaje cuando `plataformaNueva = WEB` |
| `otroDispositivo` | Mensaje genérico: sin plataforma, o el caso llegó por el 401 |
| `nota` | La explicación de la regla, en la tarjeta gris |
| `iniciarSesion` | El botón |

### `lib/i18n/es/sesion.i18n.json`

```json
{
  "iniciarSesion": "Iniciar sesión",
  "movil": "Tu sesión se cerró porque se inició sesión con tu usuario en la app móvil. Inicia sesión nuevamente para continuar.",
  "nota": "Tu usuario solo puede tener una sesión abierta a la vez, ya sea en la aplicación móvil o en el portal web.",
  "otroDispositivo": "Tu sesión se cerró porque se inició sesión con tu usuario en otro dispositivo. Inicia sesión nuevamente para continuar.",
  "titulo": "Tu sesión se cerró",
  "web": "Tu sesión se cerró porque se inició sesión con tu usuario en otro navegador o equipo. Inicia sesión nuevamente para continuar."
}
```

### `lib/i18n/en/sesion.i18n.json`

```json
{
  "iniciarSesion": "Sign in",
  "movil": "Your session was closed because your user signed in on the mobile app. Please sign in again to continue.",
  "nota": "Your user can only have one open session at a time, either on the mobile app or on the web portal.",
  "otroDispositivo": "Your session was closed because your user signed in on another device. Please sign in again to continue.",
  "titulo": "Your session was closed",
  "web": "Your session was closed because your user signed in on another browser or computer. Please sign in again to continue."
}
```

### `lib/i18n/de/sesion.i18n.json`

```json
{
  "iniciarSesion": "Anmelden",
  "movil": "Ihre Sitzung wurde beendet, weil sich Ihr Benutzer in der mobilen App angemeldet hat. Bitte melden Sie sich erneut an, um fortzufahren.",
  "nota": "Ihr Benutzer kann jeweils nur eine Sitzung geöffnet haben, entweder in der mobilen App oder im Webportal.",
  "otroDispositivo": "Ihre Sitzung wurde beendet, weil sich Ihr Benutzer auf einem anderen Gerät angemeldet hat. Bitte melden Sie sich erneut an, um fortzufahren.",
  "titulo": "Ihre Sitzung wurde beendet",
  "web": "Ihre Sitzung wurde beendet, weil sich Ihr Benutzer in einem anderen Browser oder auf einem anderen Computer angemeldet hat. Bitte melden Sie sich erneut an, um fortzufahren."
}
```

### `lib/i18n/fr/sesion.i18n.json`

```json
{
  "iniciarSesion": "Se connecter",
  "movil": "Votre session a été fermée car votre utilisateur s'est connecté sur l'application mobile. Veuillez vous reconnecter pour continuer.",
  "nota": "Votre utilisateur ne peut avoir qu'une seule session ouverte à la fois, sur l'application mobile ou sur le portail web.",
  "otroDispositivo": "Votre session a été fermée car votre utilisateur s'est connecté sur un autre appareil. Veuillez vous reconnecter pour continuer.",
  "titulo": "Votre session a été fermée",
  "web": "Votre session a été fermée car votre utilisateur s'est connecté sur un autre navigateur ou ordinateur. Veuillez vous reconnecter pour continuer."
}
```

### La redacción, que no es casual

Los tres mensajes dicen **desde dónde** se inició la otra sesión y terminan con **qué hacer**. Nunca dicen «error» ni «no autorizado»: el usuario no hizo nada mal.

«Tu usuario» y no «el usuario»: quien lee es la persona que fue expulsada, y la que probablemente inició la otra sesión.

La nota explica la regla **sin hablar de tokens, sesiones activas ni dispositivos registrados**. El usuario no necesita el modelo mental, necesita saber que es así a propósito.

---

## Casos a probar

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| 1 | Entrar en el móvil, después entrar con el mismo usuario en el portal web | El móvil vuelve al login **al instante**, con el mensaje de `web` |
| 2 | Lo mismo, pero con el móvil sin red | Al recuperar la red, la primera petición saca al usuario con el mensaje genérico |
| 3 | Lo mismo, pero con la app cerrada | Al abrirla, el splash no logra conectar el hub y la primera petición la saca |
| 4 | Entrar en dos teléfonos | El primero sale con el mensaje de `movil` |
| 5 | Entrar y volver a entrar en el **mismo** teléfono | **No** debe salir ningún aviso. Es la trampa del hub viejo |
| 6 | Estar en una pantalla con varias peticiones a la vez y ser expulsado | El diálogo aparece **una sola vez** |
| 7 | Pulsar «Cerrar sesión» | Vuelve al login **sin** diálogo: el usuario ya sabe por qué |
| 8 | Pulsar «Cerrar sesión» sin red | Vuelve al login igual |
| 9 | Dejar la app en segundo plano un rato y volver | El hub reconecta; el aviso sigue llegando |
| 10 | Cambiar el idioma y después ser expulsado | El diálogo sale en el idioma nuevo |
| 11 | Ser expulsado en modo oscuro | Colores oscuros, ámbar legible |
| 12 | Subir un Excel con la sesión ya cerrada | El interceptor de `Dio` saca al usuario |

---

## Lo que esto no cubre

**Un token que vence por su cuenta** no pasa por acá: lo maneja el flujo de expiración que ya existía (`t.comun.tuSesionHaExpiradoFavor`).

**Si el hub nunca conecta** — por un proxy que bloquee WebSockets, por ejemplo — la sesión única sigue funcionando. El usuario se entera al hacer su siguiente acción en lugar de al instante.

**El aviso no dice el nombre del dispositivo** ni la IP. El API manda la plataforma y nada más, a propósito: mostrar una IP a un usuario final no le aporta nada.

---

## Historial

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0.0 | 2026-10-30 | Documento inicial, con el código completo, el diálogo y las traducciones de los cuatro idiomas. |
