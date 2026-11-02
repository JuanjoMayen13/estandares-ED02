# Sesión única — Scripts de base de datos

Guía de los cuatro scripts que instalan la sesión única en SQL Server: qué crea cada uno, en qué orden se ejecutan, qué especifica cada procedimiento y **cuál de ellos tiene que ver con SignalR**.

| | |
|---|---|
| **Versión** | 1.0.0 — 2026-10-30 |
| **Scripts** | `SCRIPTS/Sesion_Unica/` (no están en este repositorio) |
| **Diseño completo** | `Implementacion_Sesion_Unica.md` (sección 6; no está en este repositorio) |
| **Lado del API** | [backend/api/sesion-unica.md](../api/sesion-unica.md) |
| **Lado de Flutter** | [flutter/sesion-unica.md](../../flutter/sesion-unica.md) |
| **Lado de Angular** | [angular/sesion-unica.md](../../angular/sesion-unica.md) |
| **Base de referencia** | `test_cuenta_corriente_20250828` |

---

## El nombre de la tabla

El nombre es **`dbo.SesionUsuario`**, en singular: una fila es una sesión. Es el que usan los cuatro scripts, el que está desplegado en `test_cuenta_corriente_20250828` y el único que aparece en esta documentación.

| Objeto | Nombre |
|---|---|
| Tabla | `dbo.SesionUsuario` |
| Llave primaria | `PK_SesionUsuario` |
| Índice único filtrado | `UX_SesionUsuario_UserName_Activa` |
| Índice de historial | `IX_SesionUsuario_UserName_FechaInicio` |

---

## Orden de ejecución

Se ejecutan en orden y en **cada base de datos donde se use el login**. Son idempotentes: la tabla y los índices se crean solo si no existen, y los procedimientos usan `CREATE OR ALTER`.

| # | Archivo | Qué crea | Depende de |
|---|---|---|---|
| 1 | `1) SesionUsuario_20261026.sql` | Tabla `SesionUsuario` + 2 índices + `GRANT` | — |
| 2 | `2) paIniciarSesionUsuario_20261026.sql` | `paIniciarSesionUsuario` | 1 |
| 3 | `3) paValidarSesionUsuario_20261026.sql` | `paValidarSesionUsuario` | 1 |
| 4 | `4) paCerrarSesionUsuario_20261026.sql` | `paCerrarSesionUsuario` | 1 |

### Lo que hay que cambiar en cada archivo

**`USE [test_cuenta_corriente_20250828]`** → la base que corresponda.

### Una dependencia que no se crea acá

Los tres procedimientos registran sus errores en **`dbo.tbl_Error`** (columnas `Descripcion`, `Error_No`, `Fecha_Hora`, `Usuario`). Esa tabla ya existe en las bases del sistema; si se instala en una base nueva que no la tenga, el `INSERT` del `CATCH` falla, pero está envuelto en su propio `TRY/CATCH` vacío a propósito: **no se pierde el error original**, solo su registro.

---

## 1. Tabla `SesionUsuario`

Una fila por cada inicio de sesión. Es el registro de accesos y, al mismo tiempo, la fuente de verdad de qué sesión está vigente.

```sql
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SesionUsuario')
BEGIN
    CREATE TABLE dbo.SesionUsuario (
         SesionID      UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_SesionUsuario PRIMARY KEY  -- jti del token JWT
        ,UserName      VARCHAR(30)      NOT NULL  -- usuario que inicio sesion
        ,Plataforma    VARCHAR(11)      NOT NULL DEFAULT 'DESCONOCIDA'  -- WEB / MOVIL / DESCONOCIDA
        ,IP            VARCHAR(45)      NULL  -- IP de la conexion, la toma el API (IPv4 o IPv6)
        ,FechaInicio   DATETIME2        NOT NULL DEFAULT SYSDATETIME()  -- hora local del servidor
        ,FechaExpira   DATETIME2        NOT NULL  -- vencimiento del token, en UTC (lo envia el API)
        ,Activa        BIT              NOT NULL DEFAULT 1  -- 1 = sesion vigente
        ,FechaCierre   DATETIME2        NULL  -- hora local del servidor en que se cerro
        ,MotivoCierre  VARCHAR(20)      NULL  -- NUEVO_LOGIN / LOGOUT / EXPIRADA
    );
END
GO
```

### Especificación de las columnas

| Columna | Tipo | Nulo | Quién la escribe | Notas |
|---|---|---|---|---|
| `SesionID` | `uniqueidentifier` | No (PK) | El API, en el login | **Es el `jti` del token JWT.** No es un identificador aparte: el token y la fila son lo mismo visto de dos lados. Eso es lo que permite validar cualquier petición con solo leer su token. |
| `UserName` | `varchar(30)` | No | El API | El usuario que inició sesión. Es la columna sobre la que se aplica la regla de una sola sesión. |
| `Plataforma` | `varchar(11)` | No | El API, desde `pPlataforma` | Solo `WEB`, `MOVIL` o `DESCONOCIDA`. El procedimiento fuerza cualquier otro valor a `DESCONOCIDA`. Define el texto que ve el usuario que fue expulsado. |
| `IP` | `varchar(45)` | Sí | El API | `HttpContext.Connection.RemoteIpAddress`. 45 caracteres porque una IPv6 con mapeo IPv4 llega a ese largo. Es solo para auditoría; no se valida contra nada. |
| `FechaInicio` | `datetime2` | No | `DEFAULT SYSDATETIME()` | **Hora local del servidor.** |
| `FechaExpira` | `datetime2` | No | El API, desde `token.ValidTo` | **UTC.** Es la única columna de fecha en UTC, y por eso `paValidarSesionUsuario` la compara con `SYSUTCDATETIME()` y no con `SYSDATETIME()`. Mezclar las dos es el error más fácil de cometer acá. |
| `Activa` | `bit` | No | `DEFAULT 1` | `1` = vigente. Nunca se borra una fila al cerrarla: se apaga este bit. |
| `FechaCierre` | `datetime2` | Sí | Los procedimientos de cierre | Hora local. `NULL` mientras la sesión esté activa. |
| `MotivoCierre` | `varchar(20)` | Sí | Los procedimientos de cierre | `NUEVO_LOGIN` (la cerró otro login), `LOGOUT` (el usuario la cerró), `EXPIRADA` (reservado: hoy nadie lo escribe, ver *Mantenimiento*). |

### Los índices son la regla, no una optimización

```sql
-- Regla principal: un usuario nunca tiene dos sesiones activas,
-- aunque lleguen dos logins al mismo tiempo.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_SesionUsuario_UserName_Activa')
    CREATE UNIQUE INDEX UX_SesionUsuario_UserName_Activa
        ON dbo.SesionUsuario (UserName) WHERE Activa = 1;
GO

-- Historial de accesos por usuario.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SesionUsuario_UserName_FechaInicio')
    CREATE INDEX IX_SesionUsuario_UserName_FechaInicio
        ON dbo.SesionUsuario (UserName, FechaInicio DESC);
GO
```

`UX_SesionUsuario_UserName_Activa` es un **índice único filtrado** (`WHERE Activa = 1`), y ahí está lo interesante: es lo que convierte «un usuario, una sesión» en una regla que la base **no puede** violar.

Sin él, dos logins simultáneos del mismo usuario podrían, en el peor orden posible, dejar dos filas activas y la sesión única se rompería en silencio. Con él, el segundo `INSERT` revienta con error 2601 y el procedimiento devuelve el error en lugar de dejar la base inconsistente. El `UPDLOCK, HOLDLOCK` del procedimiento hace que ese choque sea rarísimo; el índice es la garantía de que si pasa, se nota.

Y por ser filtrado no estorba: solo indexa las filas activas, que son como máximo una por usuario, no el historial completo.

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[SesionUsuario] TO [usuario];
GO
```

---

## 2. `paIniciarSesionUsuario`

**Regla S-01.** Lo llama el API después de un login correcto. En **una sola transacción** cierra la sesión anterior del usuario y registra la nueva.

```sql
CREATE OR ALTER PROCEDURE dbo.paIniciarSesionUsuario
(
     @SesionID     UNIQUEIDENTIFIER
    ,@UserName     VARCHAR(30)
    ,@Plataforma   VARCHAR(11)   = 'DESCONOCIDA'
    ,@IP           VARCHAR(45)   = NULL
    ,@FechaExpira  DATETIME2               -- vencimiento del token, en UTC
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY

        IF @SesionID IS NULL
            THROW 53001, 'paIniciarSesionUsuario: Debe enviar SesionID.', 1;
        IF @UserName IS NULL OR LTRIM(RTRIM(@UserName)) = ''
            THROW 53002, 'paIniciarSesionUsuario: Debe enviar UserName.', 1;
        IF @FechaExpira IS NULL
            THROW 53003, 'paIniciarSesionUsuario: Debe enviar FechaExpira.', 1;

        -- Un cliente viejo no envia plataforma: se registra como DESCONOCIDA.
        IF @Plataforma IS NULL OR @Plataforma NOT IN ('WEB', 'MOVIL')
            SET @Plataforma = 'DESCONOCIDA';

        DECLARE @Anterior TABLE (SesionID UNIQUEIDENTIFIER, Plataforma VARCHAR(11));

        BEGIN TRANSACTION;

        -- Cierra la sesion activa anterior y la guarda para avisarle.
        UPDATE dbo.SesionUsuario WITH (UPDLOCK, HOLDLOCK)
        SET Activa = 0, FechaCierre = SYSDATETIME(), MotivoCierre = 'NUEVO_LOGIN'
        OUTPUT deleted.SesionID, deleted.Plataforma INTO @Anterior
        WHERE UserName = @UserName AND Activa = 1;

        INSERT INTO dbo.SesionUsuario (SesionID, UserName, Plataforma, IP, FechaExpira)
        VALUES (@SesionID, @UserName, @Plataforma, @IP, @FechaExpira);

        COMMIT TRANSACTION;

        SELECT SesionID AS SesionAnteriorID, Plataforma AS PlataformaAnterior FROM @Anterior;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

        DECLARE @ErrNum INT            = ERROR_NUMBER();
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();

        -- Las validaciones (53001-53003) no se registran: son respuestas esperadas.
        IF @ErrNum NOT BETWEEN 53001 AND 53003
        BEGIN
            BEGIN TRY
                INSERT INTO dbo.tbl_Error (Descripcion, Error_No, Fecha_Hora, Usuario)
                VALUES ('paIniciarSesionUsuario (error SQL ' + CAST(@ErrNum AS VARCHAR(10)) + '): ' + @ErrMsg,
                        1, GETDATE(), @UserName);
            END TRY
            BEGIN CATCH
            END CATCH
        END;

        THROW;
    END CATCH
END
GO
GRANT EXEC ON [dbo].[paIniciarSesionUsuario] TO [usuario];
GO
```

### Parámetros

| Parámetro | Tipo | Obligatorio | Qué recibe |
|---|---|---|---|
| `@SesionID` | `uniqueidentifier` | **Sí** | El `jti` que el API acaba de generar para el token. |
| `@UserName` | `varchar(30)` | **Sí** | El usuario que inició sesión. No acepta vacío ni solo espacios. |
| `@Plataforma` | `varchar(11)` | No (`DESCONOCIDA`) | `WEB` o `MOVIL`. Cualquier otro valor, incluido `NULL`, se normaliza a `DESCONOCIDA`. |
| `@IP` | `varchar(45)` | No (`NULL`) | La IP de la conexión. Solo auditoría. |
| `@FechaExpira` | `datetime2` | **Sí** | Vencimiento del token, **en UTC**. |

### Qué devuelve

Un conjunto de resultados con **cero o una fila**:

| Columna | Tipo | Significado |
|---|---|---|
| `SesionAnteriorID` | `uniqueidentifier` | La sesión que se acaba de cerrar. |
| `PlataformaAnterior` | `varchar(11)` | Desde dónde estaba abierta. |

**Cero filas significa que el usuario no tenía ninguna sesión abierta.** No es un error: es el caso normal del primer login del día. El API lo usa como la señal de «no hay a quién avisarle».

### Tres decisiones que vale la pena entender

**`OUTPUT deleted.*` en lugar de un `SELECT` previo.** Se podría leer la sesión anterior, cerrarla y después devolver lo leído, pero serían dos operaciones y entre ellas cabe otro login. La cláusula `OUTPUT` devuelve exactamente las filas que *este* `UPDATE` cambió, así que lo que sale es, con certeza, la sesión que este login cerró y no otra.

**`UPDLOCK, HOLDLOCK`.** Toma el candado de escritura desde la lectura y lo mantiene hasta el `COMMIT`. Dos logins simultáneos del mismo usuario se serializan acá en lugar de pelearse en el `INSERT`.

**`SET XACT_ABORT ON`.** Si algo falla dentro de la transacción, se aborta completa. Sin esto, un error no fatal podría dejar la sesión anterior cerrada y la nueva sin insertar: el usuario quedaría sin ninguna sesión activa y con un token recién emitido que nunca va a validar.

### Errores

| Número | Mensaje | ¿Se registra en `tbl_Error`? |
|---|---|---|
| 53001 | Debe enviar SesionID | No — es una validación esperada |
| 53002 | Debe enviar UserName | No |
| 53003 | Debe enviar FechaExpira | No |
| 2601 | Violación del índice único filtrado | Sí |
| Otros | Error de SQL Server | Sí |

Los 53001–53003 no se registran a propósito: son errores de programación del llamador, se arreglan en el API y llenar `tbl_Error` con ellos solo ensucia el log. Todo lo demás sí se registra, y después se vuelve a lanzar con `THROW` para que el API lo reciba.

---

## 3. `paValidarSesionUsuario`

**Regla S-02.** Lo llama el API en **cada petición autenticada**, con una caché de 30 segundos delante. Responde una sola cosa: ¿esta sesión sigue sirviendo?

```sql
CREATE OR ALTER PROCEDURE dbo.paValidarSesionUsuario
(
    @SesionID UNIQUEIDENTIFIER
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY

        SELECT CAST(CASE WHEN EXISTS (
                    SELECT 1 FROM dbo.SesionUsuario
                    WHERE SesionID = @SesionID
                      AND Activa = 1
                      AND FechaExpira > SYSUTCDATETIME()
                ) THEN 1 ELSE 0 END AS BIT) AS Activa;

    END TRY
    BEGIN CATCH
        DECLARE @ErrNum INT            = ERROR_NUMBER();
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();

        BEGIN TRY
            INSERT INTO dbo.tbl_Error (Descripcion, Error_No, Fecha_Hora, Usuario)
            VALUES ('paValidarSesionUsuario (error SQL ' + CAST(@ErrNum AS VARCHAR(10)) + '): ' + @ErrMsg,
                    1, GETDATE(), NULL);   -- sin @UserName en este procedimiento
        END TRY
        BEGIN CATCH
        END CATCH;

        THROW;
    END CATCH
END
GO
GRANT EXEC ON [dbo].[paValidarSesionUsuario] TO [usuario];
GO
```

### Especificación

| | |
|---|---|
| **Entrada** | `@SesionID uniqueidentifier` — el `jti` del token de la petición |
| **Salida** | Una fila, una columna: `Activa bit` |
| **`Activa = 1`** | La fila existe, tiene `Activa = 1` y `FechaExpira` es futura |
| **`Activa = 0`** | Cualquier otro caso: no existe, fue cerrada, o el token venció |

Siempre devuelve exactamente una fila. **Nunca devuelve cero filas**, y eso es a propósito: `EXISTS` dentro de un `CASE` da un valor, no un conjunto. Así el API no tiene que distinguir «no encontré la sesión» de «la sesión no sirve» — para él son lo mismo y se tratan igual.

### Las tres condiciones

`SesionID = @SesionID` — el token corresponde a una sesión que se registró.

`Activa = 1` — nadie la cerró. Es la condición que hace que un nuevo login expulse al dispositivo anterior.

`FechaExpira > SYSUTCDATETIME()` — **comparación en UTC**, porque esa columna se guarda en UTC. Es redundante con la validación de vencimiento que ya hace el JWT, y está a propósito: si alguna vez se tocara la configuración del token, la base sigue cortando por su cuenta.

> **Ojo con el husillo horario.** Si alguien cambiara `SYSUTCDATETIME()` por `SYSDATETIME()`, en Guatemala (UTC−6) las sesiones se considerarían vencidas **seis horas antes** de lo que corresponde. El síntoma sería usuarios expulsados a media jornada sin que nadie haya iniciado sesión en otra parte, y es muy difícil de diagnosticar.

### Por qué no registra el usuario en `tbl_Error`

El `INSERT` del `CATCH` manda `NULL` en la columna `Usuario`, porque este procedimiento solo recibe el `SesionID` y no sabe de quién es. Para rastrear un error desde `tbl_Error` hay que buscar ese `SesionID` en la tabla de sesiones.

---

## 4. `paCerrarSesionUsuario`

**Regla S-03.** Lo llama el API en el logout.

```sql
CREATE OR ALTER PROCEDURE dbo.paCerrarSesionUsuario
(
     @SesionID UNIQUEIDENTIFIER
    ,@Motivo   VARCHAR(20) = 'LOGOUT'
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY

        IF @SesionID IS NULL
            THROW 53004, 'paCerrarSesionUsuario: Debe enviar SesionID.', 1;

        UPDATE dbo.SesionUsuario
        SET Activa = 0, FechaCierre = SYSDATETIME(), MotivoCierre = ISNULL(@Motivo, 'LOGOUT')
        WHERE SesionID = @SesionID AND Activa = 1;

    END TRY
    BEGIN CATCH
        DECLARE @ErrNum INT            = ERROR_NUMBER();
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();

        -- La validacion (53004) no se registra: es una respuesta esperada.
        IF @ErrNum <> 53004
        BEGIN
            BEGIN TRY
                INSERT INTO dbo.tbl_Error (Descripcion, Error_No, Fecha_Hora, Usuario)
                VALUES ('paCerrarSesionUsuario (error SQL ' + CAST(@ErrNum AS VARCHAR(10)) + '): ' + @ErrMsg,
                        1, GETDATE(), NULL);
            END TRY
            BEGIN CATCH
            END CATCH
        END;

        THROW;
    END CATCH
END
GO
GRANT EXEC ON [dbo].[paCerrarSesionUsuario] TO [usuario];
GO
```

### Especificación

| | |
|---|---|
| **Entrada** | `@SesionID uniqueidentifier` (obligatorio), `@Motivo varchar(20)` (opcional, `LOGOUT`) |
| **Salida** | Ninguna. No devuelve conjunto de resultados |
| **Error** | 53004 si `@SesionID` es nulo. No se registra en `tbl_Error` |

**Es idempotente.** El `AND Activa = 1` del `WHERE` hace que cerrar una sesión ya cerrada afecte cero filas y no haga nada. Importa porque sucede todo el tiempo: el usuario pulsa «Cerrar sesión» en un dispositivo cuya sesión ya había sido cerrada por otro login. No es un error y no debe verse como tal.

`@Motivo` existe para poder registrar `EXPIRADA` desde un proceso de limpieza, pero hoy **nadie lo usa**: el API siempre llama sin ese parámetro, así que todas las filas cerradas por logout quedan con `LOGOUT`.

---

## SignalR y los procedimientos — esto **no** es polling

Esta es la parte que más se malinterpreta, así que conviene ser explícito.

### Ningún procedimiento habla con SignalR

Hay que empezar por ahí: **ninguno de los tres procedimientos conoce, llama ni notifica a SignalR.** No hay `Service Broker`, no hay `SqlDependency`, no hay trigger, no hay un `xp_` que llame al API. SQL Server no abre conexiones hacia el hub, y no podría.

La relación es de una sola dirección y pasa por el API:

```
  Login nuevo
      │
      ▼
  paIniciarSesionUsuario  ──► devuelve 0 o 1 fila (SesionAnteriorID)
      │                              │
      │                              ▼
      │                       El API lee esa fila y, solo si existe,
      │                       empuja "SesionCerrada" por el hub
      │                              │
      ▼                              ▼
  Token entregado          Dispositivo anterior (conexión ya abierta)
```

### Cuál procedimiento tiene que ver con el hub

| Procedimiento | ¿Relacionado con SignalR? | Cuándo se ejecuta | Quién lo dispara |
|---|---|---|---|
| **`paIniciarSesionUsuario`** | **Sí, es el único.** Su `SELECT` final es lo que hace que el API mande el aviso | Una vez por login | Una acción del usuario: iniciar sesión |
| `paValidarSesionUsuario` | No. Es el camino de garantía, independiente del hub | Una vez por petición autenticada, con caché de 30 s | Una petición que el usuario ya estaba haciendo |
| `paCerrarSesionUsuario` | No. No hace falta avisar: el dispositivo que cierra ya lo sabe | Una vez por logout | Una acción del usuario: cerrar sesión |

El punto exacto de contacto es esta línea de `paIniciarSesionUsuario`:

```sql
SELECT SesionID AS SesionAnteriorID, Plataforma AS PlataformaAnterior FROM @Anterior;
```

El procedimiento no «avisa» nada. Solo informa **a quién habría que avisarle**, y el API decide. Si el `SELECT` trae cero filas, el API no manda ningún mensaje porque no hay sesión anterior que cerrar. Esa es toda la conexión entre SQL y SignalR.

### Por qué no es polling

**Polling** sería que cada cliente le preguntara al servidor «¿mi sesión sigue viva?» cada *N* segundos. Eso no ocurre en ningún punto de este diseño:

| | Polling | Lo que hace la sesión única |
|---|---|---|
| ¿Quién habla primero? | El cliente, en bucle | El servidor, **una sola vez**, cuando algo pasó |
| ¿Hay temporizador? | Sí, en cada cliente | **No.** No hay `setInterval`, ni `Timer`, ni job |
| ¿Cuántas consultas con la app abierta y quieta? | Una por intervalo, por usuario | **Cero** |
| ¿Cuánto tarda el usuario en enterarse? | Hasta un intervalo completo | Inmediato: el aviso llega por la conexión abierta |

El aviso viaja por un **WebSocket que ya está abierto** desde que el cliente se conectó al hub. El cliente no invoca ningún método del hub: solo escucha. Está esperando, no preguntando.

### «Pero `paValidarSesionUsuario` corre todo el tiempo» — tampoco es polling

Es la objeción razonable, y la respuesta es que corre **a consecuencia de peticiones que ya iban a ocurrir**, no de un reloj:

- Se ejecuta en `OnTokenValidated`, dentro de una petición HTTP que el usuario ya estaba haciendo. Si el usuario deja la app abierta sin tocar nada, **no se ejecuta ni una vez**.
- Lleva una caché en memoria de **30 segundos** por sesión, así que una pantalla que dispara seis peticiones seguidas paga **una** consulta, no seis.
- La consulta es un `EXISTS` sobre la llave primaria. Es una búsqueda de índice que devuelve un `bit`.

Un número para dimensionarlo: con 50 usuarios y un polling cada 10 segundos serían **300 consultas por minuto de forma permanente**, incluso de madrugada con la app abierta y nadie usándola. Acá, con esos mismos 50 usuarios trabajando normal, son **a lo sumo 2 consultas por minuto y por usuario** (el tope que impone la caché de 30 s), y **cero** cuando nadie está tocando la app.

### Y si el hub no conecta, no pasa nada grave

Es la parte que cierra el diseño: el hub es **comodidad**, no seguridad. Si el dispositivo está sin red, en segundo plano o el WebSocket se cayó, el aviso se pierde — pero su token ya quedó con `Activa = 0` en la tabla, así que **la siguiente petición que haga se rechaza con 401**. Nunca queda dentro.

Por eso `paValidarSesionUsuario` existe aunque haya SignalR, y por eso SignalR existe aunque haya validación por petición. Uno da inmediatez, el otro da la garantía.

---

## Mantenimiento

Las filas cerradas se acumulan: son el historial de accesos. La propuesta es conservar **90 días** y limpiar con un Job semanal.

```sql
DELETE FROM dbo.SesionUsuario
WHERE Activa = 0 AND FechaCierre < DATEADD(DAY, -90, SYSDATETIME());
GO
```

El `Activa = 0` no es decorativo: sin él se borrarían sesiones vigentes y se expulsaría a usuarios conectados.

**Lo que hoy no se limpia:** las sesiones que simplemente vencieron se quedan con `Activa = 1` y `FechaExpira` en el pasado para siempre. No causan ningún daño — `paValidarSesionUsuario` las rechaza por la comparación de fecha, y el índice único filtrado no se molesta porque sigue habiendo una sola activa por usuario — pero ensucian cualquier consulta de «quién está conectado». Si eso llega a importar, este es el paso que falta:

```sql
UPDATE dbo.SesionUsuario
SET Activa = 0, FechaCierre = SYSDATETIME(), MotivoCierre = 'EXPIRADA'
WHERE Activa = 1 AND FechaExpira <= SYSUTCDATETIME();
GO
```

Es para lo que está reservado el motivo `EXPIRADA`. Hay que ejecutarlo **antes** del `DELETE` de los 90 días, o las filas nunca llegan a tener `FechaCierre` y el `DELETE` no las alcanza.

---

## Verificación después de instalar

```sql
-- 1. Que estén los cuatro objetos.
SELECT 'tabla' AS tipo, name FROM sys.tables     WHERE name LIKE 'Sesion%Usuario'
UNION ALL
SELECT 'proc',          name FROM sys.procedures WHERE name LIKE 'pa%Sesion%Usuario';

-- 2. Que el índice único esté filtrado. has_filter tiene que ser 1:
--    sin el filtro, un usuario no podría volver a iniciar sesión nunca.
SELECT name, is_unique, has_filter, filter_definition
FROM sys.indexes
WHERE object_id = OBJECT_ID('dbo.SesionUsuario') AND name IS NOT NULL;

-- 3. Quién está conectado ahora.
SELECT UserName, Plataforma, IP, FechaInicio, FechaExpira
FROM dbo.SesionUsuario
WHERE Activa = 1 AND FechaExpira > SYSUTCDATETIME()
ORDER BY FechaInicio DESC;

-- 4. La prueba de que la regla se cumple: tiene que devolver cero filas.
SELECT UserName, COUNT(*) AS Activas
FROM dbo.SesionUsuario
WHERE Activa = 1
GROUP BY UserName
HAVING COUNT(*) > 1;

-- 5. Historial de un usuario, para ver los cierres por NUEVO_LOGIN.
SELECT TOP 20 Plataforma, FechaInicio, FechaCierre, MotivoCierre, IP
FROM dbo.SesionUsuario
WHERE UserName = 'USUARIO_A_REVISAR'
ORDER BY FechaInicio DESC;

-- 6. Errores registrados por los procedimientos.
SELECT Fecha_Hora, Usuario, Descripcion
FROM dbo.tbl_Error
WHERE Descripcion LIKE 'pa%SesionUsuario%'
ORDER BY Fecha_Hora DESC;
```

---

## Resumen de los errores propios

| Número | Procedimiento | Causa | ¿En `tbl_Error`? |
|---|---|---|---|
| 53001 | `paIniciarSesionUsuario` | `@SesionID` nulo | No |
| 53002 | `paIniciarSesionUsuario` | `@UserName` nulo o vacío | No |
| 53003 | `paIniciarSesionUsuario` | `@FechaExpira` nulo | No |
| 53004 | `paCerrarSesionUsuario` | `@SesionID` nulo | No |

Los cuatro son errores de programación del llamador, no situaciones de negocio. Si aparecen en producción, el error está en el API y no en la base.

---

## Historial

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0.0 | 2026-10-30 | Documento inicial, con la sección de SignalR. |
