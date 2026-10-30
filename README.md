# KiBi 🩷🩵

La agenda de Daniel (1ºB Primaria) y Laia Luna (I3B Infantil) en el móvil: qué tienen hoy, mañana y durante la semana, qué hay que llevar y qué tareas quedan pendientes. Se instala en la pantalla de inicio y manda avisos:

- a las **7:00** con lo de hoy
- a las **19:00** con lo de mañana

Solo se envía aviso los días en que hay algo especial (festivo, actividad, algo que llevar, una fecha límite).

## Privacidad

La app es pública en GitHub Pages, pero los datos de los niños están **cifrados** en `datos.cifrados.json`. Sin el código familiar no se pueden leer. Cada móvil pide el código la primera vez.

## Instalar en el móvil

- **iPhone**: abre la app en Safari → botón Compartir → «Añadir a pantalla de inicio». Abre KiBi desde el icono (los avisos solo funcionan así).
- **Android**: abre la app en Chrome → menú → «Instalar app».

Después, en la app, pulsa **Activar avisos** y copia el código del móvil que aparece. Para añadirlo a la lista de envío:

```bash
CODIGO_FAMILIAR=... node scripts/suscribir.mjs "Móvil de Gabi" '<código del móvil>'
git add suscripciones.cifradas.json && git commit -m "Añadir móvil" && git push
```

La lista se guarda cifrada en `suscripciones.cifradas.json`. Al subirla, GitHub envía un aviso de prueba a todos los móviles.

## Secretos del repositorio

| Secreto | Qué es |
| --- | --- |
| `CODIGO_FAMILIAR` | El código que descifra los datos |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Claves para firmar los avisos push |
| `PUSH_SUBSCRIPTIONS` | Opcional: más móviles en formato JSON (normalmente `[]`) |

## Actualizar los datos

```bash
npm install
CODIGO_FAMILIAR=... npm run descifrar   # crea datos/eventos.json (no se sube)
# editar datos/eventos.json
CODIGO_FAMILIAR=... npm run cifrar      # actualiza datos.cifrados.json
npm test                                # comprobaciones rápidas
```

Al hacer push a `main`, la app se publica sola. Para probar un aviso: pestaña Actions → «Avisos diarios» → «Run workflow».

### Formato de `datos/eventos.json`

- `sinCole`: días sin clase, con `fecha` o con `desde`/`hasta`.
- `semanal`: lo que se repite cada semana. `dia` va de 0 (domingo) a 6 (sábado). `soloConCole: true` hace que no salga en festivos.
- `eventos`: cosas puntuales, con `fecha`, `fechas` (lista) o `desde`/`hasta`, y `ninos` (`daniel`, `laia`). `llevar` es opcional.
- `tareas`: cosas que hacer, con `limite` opcional.

Fechas en formato `AAAA-MM-DD`.

## Añadir información desde el móvil

Pulsa **＋ Añadir a la agenda** para crear un cumpleaños (con repetición anual opcional), tarea (con o sin fecha límite), extraescolar (días de la semana, inicio, final opcional y opción de solo días con cole) o evento puntual. Se puede elegir uno o varios peques e indicar hora, lugar, notas y qué llevar.

Las anotaciones se guardan **cifradas con el código familiar en el navegador de ese móvil**, separadas de la agenda original del repositorio. No se suben automáticamente ni forman parte de los avisos push de GitHub Actions. Borrar los datos del navegador elimina esta copia local.

En **Mis anotaciones** se pueden editar y eliminar entradas, exportar una copia `.kibi` cifrada e importarla en otro móvil con el mismo código familiar. La importación muestra cuántas entradas añade o actualiza y solicita confirmación antes de sustituir versiones del mismo identificador; conserva las demás. No transporta los estados de tareas hechas ni elimina en otros móviles lo que se haya eliminado en el primero. Guarda copias antes de cambiar de código familiar: el nuevo código no descifra las anotaciones creadas con el anterior.

La sincronización automática requiere un backend autenticado, todavía no configurado. El pegado inteligente de mensajes y la extracción de fotos/documentos tampoco forman parte de esta versión.

Pruebas con datos sintéticos (sin necesitar los datos privados del cole):

```bash
npm run test:agenda
```
