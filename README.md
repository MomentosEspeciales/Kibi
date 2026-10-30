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

Después, en la app, pulsa **Activar avisos** y envía el código del móvil que aparece. Ese código se añade al secreto `PUSH_SUBSCRIPTIONS` del repositorio (una lista JSON con un elemento por móvil).

## Secretos del repositorio

| Secreto | Qué es |
| --- | --- |
| `CODIGO_FAMILIAR` | El código que descifra los datos |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Claves para firmar los avisos push |
| `PUSH_SUBSCRIPTIONS` | Lista JSON con la suscripción de cada móvil |

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
