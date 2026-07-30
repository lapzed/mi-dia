# Mi día

Aplicación web para técnicos de campo. Se abre desde el celular, muestra los
servicios del día y permite cerrarlos en sitio.

- Entra con usuario y clave; cada quien ve únicamente sus servicios.
- Muestra hora, sitio, dirección, contacto y las notas de la programación.
- Abre la ubicación en el mapa y marca al contacto.
- Cierra el servicio con comentario, evidencia fotográfica y el formato de
  reporte escaneado. Sin esos dos archivos el cierre no procede.
- Si no hay señal, el cierre se guarda en el teléfono y sube solo al recuperar
  la conexión.

Instalable desde el navegador (Agregar a pantalla de inicio).

## Acceso

Los datos viven en una base con permisos por usuario: sin una cuenta válida la
aplicación no muestra nada. La llave que aparece en el código es la llave
publicable, pensada para ir en el cliente; por sí sola no da acceso a ningún
dato.

Las cuentas las administra el área técnica.

## Archivos

| | |
|---|---|
| `index.html` | la aplicación completa |
| `manifest.json` | datos para instalarla |
| `sw.js` | caché para que abra sin señal |
| `icon-*.png` | icono |
