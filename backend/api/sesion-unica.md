# Sesión única — Implementación en el API

Cómo queda la sesión única del lado de `ApiBusiness`: qué archivos la componen, el código de cada uno y el contrato que ven los clientes.

| | |
|---|---|
| **Versión** | 1.0.0 — 2026-10-30 |
| **Diseño completo** | `Implementacion_Sesion_Unica.md` (secciones 7 y 8; no está en este repositorio) |
| **Scripts de base de datos** | [backend/sql/sesion-unica.md](../sql/sesion-unica.md) |
| **Lado de Flutter** | [flutter/sesion-unica.md](../../flutter/sesion-unica.md) |
| **Lado de Angular** | [angular/sesion-unica.md](../../angular/sesion-unica.md) |
| **Colección de Postman** | `POSTMAN/ApiBusiness_Sesion_Unica.postman_collection.json` (no está en este repositorio) |

---

## La idea en tres frases

El `jti` del token JWT **es** el identificador de la sesión. Eso es todo el truco: no hay un identificador de sesión aparte que haya que sincronizar, porque el token y la fila de la base son la misma cosa vista de dos lados.

Con eso, cada petición autenticada puede comprobar su propia vigencia leyendo el token que ya trae, y el API puede cerrar una sesión a distancia apagando un bit en una tabla.

Lo demás es que el usuario se entere rápido, y de eso se encarga SignalR.

---

## Archivos

### Nuevos

| Archivo | Qué hace |
|---|---|
| `Servicios/SesionUsuarioService.cs` | Los tres procedimientos + la caché de validación |
| `Models/Response/Autenticacion/SesionAnteriorM.cs` | `SesionAnteriorM` y `SesionVigenteM` |
| `Hubs/SesionHub.cs` | El hub que recibe el aviso de cierre |
| `Controllers/Shared/SesionController.cs` | `POST api/Sesion/cerrar` |

### Modificados

| Archivo | Qué cambió |
|---|---|
| `Controllers/Shared/PaBscUser2Ctrl.cs` | El login registra la sesión y manda el aviso. `pPlataforma` en la petición |
| `Program.cs` | `JwtBearerEvents` (validación y 401 propio), `AddSignalR`, `AddMemoryCache`, el servicio y `MapHub` |

---

## 1. `SesionUsuarioService`

Envuelve los tres procedimientos. Es la única clase que toca la tabla de sesiones.

```csharp
using ApiBusiness.Model.Shared;
using ApiBusiness.Models.Response.Autenticacion;
using ApiBusiness.Utilidades;
using Microsoft.Extensions.Caching.Memory;
using System.Data;
using System.Data.SqlClient;

namespace ApiBusiness.Servicios
{
    // Sesion unica por usuario (docs/autenticacion/Implementacion_Sesion_Unica.md).
    // Se registra por inyeccion (no con new) porque necesita el IMemoryCache compartido:
    // la validacion de cada peticion se guarda 30 segundos, y al cerrar una sesion se borra
    // del cache para que el rechazo sea inmediato. El cache es local al proceso, asi que
    // esto vale mientras el API corra en un solo servidor.
    public class SesionUsuarioService(IConfiguration configuration, IMemoryCache cache) : StoredProcedureExecutor(configuration)
    {
        private static readonly TimeSpan DuracionCache = TimeSpan.FromSeconds(30);

        private static string ClaveCache(Guid sesionId) => $"SesionUsuario_{sesionId}";

        /* =============================================================================
           1. paIniciarSesionUsuario
           Registra la sesion nueva y cierra la anterior. Devuelve la sesion cerrada.
           ============================================================================= */
        public async Task<ApiResponseModel<List<SesionAnteriorM>>> paIniciarSesionUsuario(
            Guid sesionId, string userName, string? plataforma, string? ip, DateTime fechaExpiraUtc)
        {
            string storeProcedure = "paIniciarSesionUsuario";

            var parameters = new SqlParameter[]
            {
                new("@SesionID", SqlDbType.UniqueIdentifier) { Value = sesionId },
                new("@UserName", SqlDbType.VarChar, 30) { Value = userName },
                new("@Plataforma", SqlDbType.VarChar, 11) { Value = (object?)plataforma ?? DBNull.Value },
                new("@IP", SqlDbType.VarChar, 45) { Value = (object?)ip ?? DBNull.Value },
                new("@FechaExpira", SqlDbType.DateTime2) { Value = fechaExpiraUtc },
            };

            var response = await ExecuteStoredProcedureAsync(storeProcedure, SesionAnteriorM.MapToModel, parameters);

            // La sesion anterior queda rechazada desde ya, sin esperar a que venza su cache.
            if (response.Status)
                foreach (SesionAnteriorM anterior in response.Data ?? [])
                    cache.Remove(ClaveCache(anterior.SesionAnteriorID));

            return response;
        }

        /* =============================================================================
           2. paValidarSesionUsuario
           Se llama en cada peticion autenticada (JwtBearer OnTokenValidated).
           ============================================================================= */
        public async Task<bool> EsSesionVigenteAsync(Guid sesionId)
        {
            if (cache.TryGetValue(ClaveCache(sesionId), out bool vigente))
                return vigente;

            string storeProcedure = "paValidarSesionUsuario";

            var parameters = new SqlParameter[]
            {
                new("@SesionID", SqlDbType.UniqueIdentifier) { Value = sesionId },
            };

            var response = await ExecuteStoredProcedureAsync(storeProcedure, SesionVigenteM.MapToModel, parameters);

            // Si la consulta falla se rechaza la peticion, pero no se guarda en cache:
            // un error pasajero de la base no debe dejar al usuario fuera 30 segundos.
            if (!response.Status)
                return false;

            vigente = response.Data?.FirstOrDefault()?.Activa == true;
            cache.Set(ClaveCache(sesionId), vigente, DuracionCache);
            return vigente;
        }

        /* =============================================================================
           3. paCerrarSesionUsuario
           Logout. Si la sesion ya estaba cerrada no hace nada.
           ============================================================================= */
        public async Task<ApiResponseModel<string>> paCerrarSesionUsuario(Guid sesionId)
        {
            string storeProcedure = "paCerrarSesionUsuario";

            var parameters = new SqlParameter[]
            {
                new("@SesionID", SqlDbType.UniqueIdentifier) { Value = sesionId },
            };

            var response = await ExecuteStoredProcedureNonQueryAsync(storeProcedure, parameters);

            if (response.Status)
                cache.Remove(ClaveCache(sesionId));

            return response;
        }
    }
}
```

### La caché es la pieza con más criterio

Sin caché, **cada** petición autenticada sería un viaje a la base. Con 30 segundos, una pantalla que dispara seis peticiones paga una consulta.

Pero una caché de 30 segundos significaría, en principio, que una sesión cerrada sigue siendo aceptada hasta 30 segundos. Por eso las dos invalidaciones explícitas:

```csharp
// En paIniciarSesionUsuario: borra la entrada de la sesión que se acaba de cerrar.
foreach (SesionAnteriorM anterior in response.Data ?? [])
    cache.Remove(ClaveCache(anterior.SesionAnteriorID));

// En paCerrarSesionUsuario: borra la entrada de la que el usuario acaba de cerrar.
cache.Remove(ClaveCache(sesionId));
```

Con eso, **el rechazo es inmediato**: en el mismo instante en que se cierra una sesión, su entrada de caché desaparece y la siguiente petición vuelve a consultar la base, que ya dice `Activa = 0`. Los 30 segundos solo ahorran consultas de sesiones que están bien.

Queda una ventana real, y es honesto nombrarla: si la sesión caduca por **vencimiento del token** —no por un cierre— la caché puede seguir diciendo «vigente» hasta 30 segundos. No importa, porque el propio JWT ya rechaza el token vencido antes de llegar a este código.

### El error de base de datos se trata distinto que el rechazo

```csharp
if (!response.Status)
    return false;
```

Si la consulta falla, la petición se rechaza (`false`) **pero no se guarda nada en caché**. Es deliberado: un error pasajero de la base rechazaría la petición, y si además se cacheara, dejaría al usuario fuera durante 30 segundos por un problema que durό un instante. Sin cachear, el siguiente intento vuelve a consultar.

### Por qué se registra por inyección

Todos los demás servicios del API se instancian con `new ...Service(configuration)`. Este no:

```csharp
builder.Services.AddScoped<SesionUsuarioService>();
```

Es por la caché. `IMemoryCache` tiene que ser **el mismo objeto** para todas las peticiones: si cada `new` creara su propia caché, no habría nada compartido que invalidar y el `cache.Remove` del login no afectaría a la validación de las otras peticiones.

> **Límite conocido:** `IMemoryCache` es local al proceso. Si el API se desplegara en más de un servidor o en varios *worker processes* de IIS, cada instancia tendría su caché y el `cache.Remove` solo afectaría a la suya: el cierre podría tardar hasta 30 segundos en los otros procesos. Para eso habría que mover la caché a Redis, o bajar `DuracionCache` a cero.

---

## 2. Los modelos de respuesta

```csharp
using ApiBusiness.Utilidades;
using System.Data.SqlClient;

namespace ApiBusiness.Models.Response.Autenticacion
{
    // =========================================================================
    // paIniciarSesionUsuario
    // Sesion activa que se cerro por el nuevo login. Cero filas = no habia.
    // =========================================================================
    public class SesionAnteriorM
    {
        public Guid SesionAnteriorID { get; set; }
        public string? PlataformaAnterior { get; set; }

        public static SesionAnteriorM MapToModel(SqlDataReader reader)
        {
            return new SesionAnteriorM()
            {
                SesionAnteriorID = reader.GetValueOrDefault<Guid>("SesionAnteriorID"),
                PlataformaAnterior = reader.GetValueOrDefault<string>("PlataformaAnterior")
            };
        }
    }

    // =========================================================================
    // paValidarSesionUsuario
    // =========================================================================
    public class SesionVigenteM
    {
        public bool Activa { get; set; }

        public static SesionVigenteM MapToModel(SqlDataReader reader)
        {
            return new SesionVigenteM()
            {
                Activa = reader.GetValueOrDefault<bool>("Activa")
            };
        }
    }
}
```

Siguen el patrón del API: modelo con sufijo `M` y un `MapToModel(SqlDataReader)` estático que consume `StoredProcedureExecutor`.

**`SesionAnteriorM` con una lista vacía es el caso normal.** El procedimiento devuelve cero filas cuando el usuario no tenía sesión abierta, así que `response.Data` vacío no es un error: es «no hay a quién avisarle».

---

## 3. El login — `POST api/PaBscUser2Ctrl`

Es donde nace la sesión. El cambio clave está en la primera línea del bloque: el `jti` ya no es un `Guid` desechable.

```csharp
if (Resultado.Continuar)
{
    // El jti es tambien el SesionID de la sesion unica
    Guid sesionId = Guid.NewGuid();

    // Crear los claims para el token JWT
    Claim[] claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, _configuration["Jwt:Subject"]),
        new Claim(JwtRegisteredClaimNames.Jti, sesionId.ToString()),
        new Claim(JwtRegisteredClaimNames.Iat,
        new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
        new Claim("UserName", request.pUserName)
    };

    // ... construcción del token ...
    string tokenString = new JwtSecurityTokenHandler().WriteToken(token);

    // Sesion unica: registra esta sesion y cierra la anterior del usuario.
    // Sin sesion registrada no se entrega el token: seria rechazado en la primera peticion.
    var sesion = await _sesiones.paIniciarSesionUsuario(
        sesionId,
        request.pUserName,
        request.pPlataforma,
        HttpContext.Connection.RemoteIpAddress?.ToString(),
        token.ValidTo);

    if (!sesion.Status)
    {
        return StatusCode(500, sesion);
    }

    // Aviso inmediato al dispositivo de la sesion cerrada
    foreach (var anterior in sesion.Data ?? [])
    {
        await _hubSesion.Clients.Group($"Sesion_{anterior.SesionAnteriorID}")
            .SendAsync("SesionCerrada", new { motivo = "NUEVO_LOGIN", plataformaNueva = request.pPlataforma });
    }

    // Devolver el token y los resultados
    return Ok(new { ... });
}
```

Las dependencias nuevas del controlador:

```csharp
private readonly IConfiguration _configuration;
private readonly SesionUsuarioService _sesiones;
private readonly IHubContext<SesionHub> _hubSesion;

public PaBscUser2Ctrl(IConfiguration configuration, SesionUsuarioService sesiones, IHubContext<SesionHub> hubSesion)
{
    _configuration = configuration;
    _sesiones = sesiones;
    _hubSesion = hubSesion;
}
```

Y la petición, con un campo más:

```csharp
public class LoginRequest
{
    public int pOpcion { get; set; } = 1;
    public string pUserName { get; set; } = string.Empty;
    public string pPass { get; set; } = string.Empty;
    public string? pPlataforma { get; set; } // WEB / MOVIL; opcional para no romper clientes viejos
}
```

### El orden importa, y por una razón concreta

El token se **firma antes** de registrar la sesión, porque `paIniciarSesionUsuario` necesita `token.ValidTo` como `@FechaExpira`. Pero se **entrega después**, y solo si el registro salió bien:

```csharp
if (!sesion.Status)
{
    return StatusCode(500, sesion);
}
```

Si se entregara el token sin haber registrado la sesión, el usuario recibiría credenciales que fallan en su primera petición: `OnTokenValidated` buscaría su `jti` en la tabla, no lo encontraría y devolvería 401. Un login «exitoso» que no deja usar nada es peor que un login que falla con un 500 claro.

### `pPlataforma` es opcional a propósito

Es `string?` y sin valor por omisión en C#, porque un cliente viejo que no lo mande tiene que seguir funcionando. Cuando no llega, el procedimiento lo registra como `DESCONOCIDA`, y el usuario expulsado ve el mensaje genérico («en otro dispositivo») en lugar de uno específico. Se pierde el detalle del mensaje, no la protección.

### El aviso se manda a un grupo de una sola conexión

```csharp
await _hubSesion.Clients.Group($"Sesion_{anterior.SesionAnteriorID}")
    .SendAsync("SesionCerrada", new { motivo = "NUEVO_LOGIN", plataformaNueva = request.pPlataforma });
```

El grupo es **por sesión**, no por usuario. Es lo que evita el problema obvio: si el grupo fuera `Usuario_{userName}`, el aviso llegaría también al dispositivo que acaba de iniciar sesión, y ese se cerraría a sí mismo. Con grupos por sesión, el dispositivo nuevo no se entera ni tiene que filtrar nada.

El `foreach` recorre una lista que tiene cero o un elemento. Está como `foreach` y no como `if` porque es lo que devuelve el procedimiento, y así no hay que asumir nada sobre la cantidad.

---

## 4. La validación de cada petición — `Program.cs`

Es el corazón de la garantía, y vive en los eventos del `JwtBearer`.

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.SaveToken = true;
        options.RequireHttpsMetadata = true;
        options.TokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
            ClockSkew = TimeSpan.Zero
        };

        // Sesion unica (docs/autenticacion/Implementacion_Sesion_Unica.md, secciones 7.2 y 8).
        options.Events = new JwtBearerEvents
        {
            // SignalR desde el navegador no puede mandar encabezados: el token llega en la query string.
            OnMessageReceived = context =>
            {
                string? accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken) && context.HttpContext.Request.Path.StartsWithSegments("/api/hub/sesion"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            },

            // La firma y el vencimiento ya son validos: falta confirmar que la sesion sea la vigente.
            OnTokenValidated = async context =>
            {
                var sesiones = context.HttpContext.RequestServices.GetRequiredService<SesionUsuarioService>();
                string? jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

                if (!Guid.TryParse(jti, out Guid sesionId) || !await sesiones.EsSesionVigenteAsync(sesionId))
                {
                    context.HttpContext.Items["SesionInvalidada"] = true;
                    context.Fail("SESION_INVALIDADA");
                }
            },

            // 401 con codigo propio, para que Angular y Flutter lo distingan de un token vencido.
            OnChallenge = async context =>
            {
                if (context.HttpContext.Items.ContainsKey("SesionInvalidada"))
                {
                    context.HandleResponse();
                    ApiResponseModel<List<object>> response = new(new List<object>(), configuration)
                    {
                        Status = false,
                        Message = "Tu sesión se cerró porque se inició sesión en otro dispositivo.",
                        ErrorCode = "SESION_INVALIDADA"
                    };
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsJsonAsync(response);
                }
            }
        };
    });
builder.Services.AddSignalR();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<SesionUsuarioService>();
```

Y el registro del hub:

```csharp
app.MapHub<ApiBusiness.Hubs.ColasHub>("api/hub/colas");
app.MapHub<ApiBusiness.Hubs.SesionHub>("api/hub/sesion");
```

### Lo que hace cada evento

| Evento | Para qué está |
|---|---|
| `OnMessageReceived` | Leer el token de la *query string* en las peticiones al hub |
| `OnTokenValidated` | Después de validar firma y vencimiento, confirmar que la sesión siga vigente |
| `OnChallenge` | Devolver el 401 con `errorCode = SESION_INVALIDADA` |

### `OnMessageReceived`: por qué el token viaja en la URL

La API de WebSocket de los navegadores **no permite poner encabezados**. Un cliente web no puede mandar `Authorization: Bearer ...` al abrir la conexión, y por eso SignalR manda el token como `?access_token=...`.

La condición importa:

```csharp
if (!string.IsNullOrEmpty(accessToken) && context.HttpContext.Request.Path.StartsWithSegments("/api/hub/sesion"))
```

El token solo se acepta por la URL **en la ruta del hub de sesión**. En el resto del API sigue siendo obligatorio el encabezado. Sin esa restricción, cualquier endpoint aceptaría el token por *query string*, y eso es malo: las URLs quedan en los logs de IIS, en el historial del navegador y en el encabezado `Referer`.

### `OnTokenValidated`: dos condiciones, un mismo rechazo

```csharp
if (!Guid.TryParse(jti, out Guid sesionId) || !await sesiones.EsSesionVigenteAsync(sesionId))
```

La primera rechaza un token sin `jti` o con un `jti` que no es un `Guid`: son los tokens emitidos **antes** de que existiera la sesión única. Quedan inválidos, que es lo correcto — no hay forma de saber a qué sesión pertenecen.

La segunda es la consulta a la base, con su caché.

### `context.Fail` + `HttpContext.Items`: el puente entre dos eventos

`context.Fail("SESION_INVALIDADA")` marca la autenticación como fallida, pero **ese texto no llega a la respuesta**. Por eso hace falta la bandera:

```csharp
context.HttpContext.Items["SesionInvalidada"] = true;
```

`HttpContext.Items` vive durante una sola petición. `OnChallenge` la lee para saber si este 401 es por sesión cerrada o por cualquier otra razón (token vencido, firma inválida, sin encabezado). Sin la bandera, todos los 401 saldrían iguales y los clientes no podrían distinguir «tu sesión se cerró en otro dispositivo» de «volvé a iniciar sesión porque venció el token» — que son dos mensajes muy distintos para el usuario.

El `if` de `OnChallenge` también es importante: cuando la bandera **no** está, no se hace nada y el 401 sale con el formato de siempre. Así este cambio no alteró el comportamiento de ningún otro error de autenticación.

---

## 5. El hub — `api/hub/sesion`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.IdentityModel.Tokens.Jwt;

namespace ApiBusiness.Hubs
{
    // Aviso inmediato de sesion cerrada por un nuevo login (evento "SesionCerrada").
    // A diferencia de ColasHub requiere token: al conectarse, la conexion se une al grupo
    // de su propia sesion (Sesion_{jti}), asi solo recibe el aviso el dispositivo que se cierra.
    [Authorize]
    public class SesionHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            string? jti = Context.User?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            if (jti != null)
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Sesion_{jti}");

            await base.OnConnectedAsync();
        }
    }
}
```

Son veintidós líneas y no tiene **ningún método invocable**. Eso es a propósito: el cliente no le pregunta nada al hub, solo se suscribe y espera. El hub se limita a meter cada conexión en el grupo de su propia sesión.

### Las diferencias con `ColasHub`, que es el otro hub del API

| | `ColasHub` | `SesionHub` |
|---|---|---|
| Autenticación | `[AllowAnonymous]` — lo usa la pantalla pública de TV | **`[Authorize]`** |
| Grupos | Por empresa y servicio | **Por sesión** (`Sesion_{jti}`) |
| Quién se une | El cliente invoca un método | **El hub lo hace solo**, leyendo el token |
| Métodos invocables | Varios | **Ninguno** |

Que el cliente no pueda elegir su grupo es lo que hace esto seguro: el grupo sale del `jti` del token, así que **nadie puede suscribirse a la sesión de otro**. Si el cliente pudiera pedir «únanme al grupo `Sesion_X`», podría escuchar los avisos de cualquiera.

### El `if (jti != null)` que parece de más

Si el token no trae `jti`, la conexión se acepta pero no se une a ningún grupo: nunca va a recibir un aviso. En la práctica es un caso imposible, porque `OnTokenValidated` ya rechazó ese token antes de llegar acá. Está por si el orden de los eventos cambiara en una actualización de ASP.NET, y porque la alternativa — lanzar una excepción dentro de `OnConnectedAsync` — tiraría la conexión de una forma que el cliente reporta como un error de red confuso.

### El evento

```csharp
await _hubSesion.Clients.Group($"Sesion_{sesionAnteriorId}")
    .SendAsync("SesionCerrada", new { motivo = "NUEVO_LOGIN", plataformaNueva = plataforma });
```

| | |
|---|---|
| **Nombre** | `SesionCerrada` |
| **Argumento** | `{ motivo: string, plataformaNueva: string \| null }` |
| **`motivo`** | Hoy siempre `NUEVO_LOGIN` |
| **`plataformaNueva`** | `WEB`, `MOVIL`, o `null` si el cliente que inició sesión no reportó plataforma |
| **Quién lo recibe** | Solo el dispositivo cuya sesión se cerró |

---

## 6. Cerrar sesión — `POST api/Sesion/cerrar`

```csharp
using ApiBusiness.Model.Shared;
using ApiBusiness.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace ApiBusiness.Controllers.Shared
{
    // Cierre de sesion (sesion unica). Los clientes lo llaman al pulsar "Cerrar sesion",
    // antes de borrar el token local.
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SesionController(IConfiguration configuration, SesionUsuarioService sesiones) : ControllerBase
    {
        [HttpPost("cerrar")]
        public async Task<IActionResult> Cerrar()
        {
            string? jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

            if (!Guid.TryParse(jti, out Guid sesionId))
            {
                return BadRequest(new ApiResponseModel<string>("", configuration)
                {
                    Status = false,
                    Message = "El token no contiene un identificador de sesion valido.",
                    ErrorCode = "2"
                });
            }

            var response = await sesiones.paCerrarSesionUsuario(sesionId);
            if (response.Status) return Ok(response);
            return BadRequest(response);
        }
    }
}
```

**No recibe cuerpo ni parámetros.** La sesión a cerrar sale del token de la propia petición, y eso no es solo comodidad: así un usuario **no puede cerrar la sesión de otro**, porque lo único que puede mandar es su propio token.

---

## Contrato para los clientes

### Login

```http
POST api/PaBscUser2Ctrl
Content-Type: application/json

{
  "pOpcion": 1,
  "pUserName": "usuario",
  "pPass": "clave",
  "pPlataforma": "WEB"
}
```

`pPlataforma`: `WEB` en Angular, `MOVIL` en Flutter. Es opcional; sin él la sesión se registra como `DESCONOCIDA` y el usuario expulsado ve el mensaje genérico. La respuesta **no cambió**: sigue devolviendo el token y los mismos datos.

### Sesión invalidada — en cualquier endpoint

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "status": false,
  "message": "Tu sesión se cerró porque se inició sesión en otro dispositivo.",
  "errorCode": "SESION_INVALIDADA",
  "data": []
}
```

**Lo que hay que mirar es `errorCode`, no `message`.** El texto puede cambiar o traducirse; el código es el contrato.

Un 401 **sin** ese `errorCode` es otra cosa (token vencido, firma inválida, falta el encabezado) y se maneja como siempre.

### Cerrar sesión

```http
POST api/Sesion/cerrar
Authorization: Bearer {token}
```

Sin cuerpo. Se llama **antes** de borrar el token local, porque el API necesita ese token para saber qué sesión cerrar. Si falla, el cliente debe cerrar la sesión local de todos modos: dejar al usuario dentro es peor.

### Hub

```
{baseUrl}/api/hub/sesion?access_token={token}
```

| | |
|---|---|
| Autenticación | Obligatoria, por `access_token` en la *query string* |
| Métodos a invocar | Ninguno |
| Evento a escuchar | `SesionCerrada` con `{ motivo, plataformaNueva }` |
| Si no conecta | No es grave: la protección sigue en el 401 |

---

## Los dos mecanismos, y por qué hacen falta los dos

| | SignalR (`SesionCerrada`) | 401 `SESION_INVALIDADA` |
|---|---|---|
| **Qué aporta** | Inmediatez | **La garantía** |
| Cuándo actúa | Al instante, si hay conexión | En la siguiente petición |
| Si no hay red | Se pierde el aviso | Sigue funcionando |
| Si la app está cerrada | No llega | Llega al volver a abrirla |
| Sabe desde dónde | Sí (`plataformaNueva`) | No |

La frase corta: **SignalR es comodidad, el 401 es seguridad.** Si el hub nunca conectara, la sesión única seguiría funcionando — el usuario simplemente se enteraría al hacer su siguiente acción en lugar de al instante.

Por eso el cliente **no debe** tratar un fallo del hub como un error que haya que mostrarle al usuario.

---

## Puntos a revisar antes de producción

| Tema | Situación | Qué hacer |
|---|---|---|
| **Caché en memoria** | `IMemoryCache` es local al proceso | Solo vale con el API en un solo servidor y un solo *worker process* |
| **CORS** | `AllowCredentials` con cualquier origen | Ya era así antes; SignalR lo necesita, pero conviene revisarlo |
| **Sesiones vencidas** | Se quedan con `Activa = 1` para siempre | No hace daño; afecta las consultas de «quién está conectado» |
| **Limpieza del historial** | No hay Job | El `DELETE` de 90 días está propuesto, sin programar |

---

## Historial

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0.0 | 2026-10-30 | Documento inicial, con el código tal como está implementado. |
