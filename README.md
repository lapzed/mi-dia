# MD Control · Mi día

**Publicada en https://lapzed.github.io/mi-dia/**
(repositorio público `lapzed/mi-dia`, solo con los archivos de la app)

App de celular (PWA) para los técnicos de campo. Lee y escribe en la misma base
Supabase que las estaciones de Excel, así que lo que el técnico marca se ve al
instante en Supervisión y en el tablero.

Para actualizarla: se edita esta carpeta, se copian `index.html`,
`manifest.json`, `sw.js` e iconos al repo `mi-dia` y se hace push. GitHub la
republica sola en un par de minutos; los teléfonos la reciben al volver a
abrirla.

## Qué hace

- El técnico entra con **usuario y clave** (queda guardada la sesión en su
  teléfono).
- Ve sus servicios por día: hora, TKT, sitio, dependencia, dirección, contacto
  y las notas de programación/coordinación (baterías, equipo a laboratorio, etc.).
- **Cómo llegar** abre Google Maps con la coordenada del sitio (o la dirección).
- **Llamar** marca al contacto del sitio.
- **Atendido / Reprogramar** con comentario → escribe `STATUS`, `FECHA_ATENCION`
  y `OBS_COORD` en la tabla `servicios`, y deja registro en `log`.
- Los días con pendientes traen un punto ámbar en la barra superior.

## Evidencia obligatoria

Un TKT **no se cierra** sin las dos cosas:

1. **Evidencia fotográfica** del sitio y del equipo.
2. **Formato de reporte escaneado** (foto o PDF del formato firmado por el cliente).

Mientras falte cualquiera de las dos, el botón de cerrar queda deshabilitado y
la hoja avisa qué falta. Reprogramar no pide fotos, pero sí exige el motivo
escrito.

Los archivos van al bucket privado `evidencias` de Supabase, en
`<coord>/<tkt>/<fecha>_<tipo>_<n>.jpg`, y se registran en la tabla `evidencias`
(qué archivo pertenece a qué servicio). Las fotos del celular pesan 3-6 MB, así
que se reducen a 1400 px antes de subir. La app puede **subir y ver** evidencias
pero **no borrarlas**: la prueba del trabajo no se puede eliminar desde el
teléfono.

## Quién ve qué

Cada quien entra con su cuenta y la base aplica los permisos (ver
`../rls_por_usuario.sql`):

| | |
|---|---|
| sin cuenta | nada: 0 servicios, 0 sitios, no puede subir archivos |
| técnico | solo sus servicios; los cierra pero no los reasigna, no da de alta ni borra |
| estación | su coordinación (Gerencia y Subgerencia, las cinco) |

La llave que va en el código es la *publishable key*, pensada para vivir en el
cliente: por sí sola no da acceso a ningún dato.

## Nombres del catálogo

La base guarda el nombre del técnico de muchas formas (`Marcos flores`,
`MaRCOS FLORES HIDALGO`, `Cristian` por `Christian`, cuadrillas como
`MANUEL/ALEX`). La correspondencia con la persona real está resuelta en la tabla
`tecnico_alias`, que se arma con `../alias_tecnicos.py` y se puede corregir a
mano. En una cuadrilla el servicio les aparece a los dos.

El catálogo de personas sale de la hoja CATALOGOS de la estación de Gerencia
(columnas `TECNICOS` y `AUXILIARES`), que es la fuente de verdad, y se publica
en la tabla `catalogos`.

## Sin señal

Los almacenes y sótanos no tienen cobertura. Si falla la red al cerrar un
servicio, el cierre se guarda en el teléfono **con sus fotos** (IndexedDB), se
muestra un aviso ámbar y sube solo cuando vuelve el internet: al recuperar
conexión o al volver a abrir la app. El *service worker* además guarda la última
carga, así la app abre aunque no haya red.

## Probarla en la red local

Sirve para probar cambios antes de publicarlos:

1. Doble clic en `Abrir_app_en_red.bat` (deja la ventana abierta).
2. La primera vez, abrir el puerto en el firewall — PowerShell **como
   administrador**, una sola vez:

   ```
   New-NetFirewallRule -DisplayName "MD Control app 8800" -Direction Inbound -LocalPort 8800 -Protocol TCP -Action Allow -Profile Private
   ```

3. En el celular, misma WiFi, abrir `http://<IP-de-la-PC>:8800`.

Por `http` el navegador no ofrece instalarla ni activa el modo sin señal; eso
solo funciona en la liga publicada.

## Cuentas

Se dan de alta con `../crear_usuarios.py` (personal de campo) y
`../usuarios_estaciones.py` (las 9 estaciones). Las claves se imprimen en
pantalla y no se guardan en ningún archivo.

Pendiente: la app todavía no deja cambiar la contraseña desde el teléfono; hoy
se reemplaza volviendo a generarla desde el área.
