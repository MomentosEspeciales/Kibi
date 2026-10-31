// Envía el aviso del día a los móviles suscritos. Lo ejecuta GitHub Actions.
// Variables: CODIGO_FAMILIAR, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, PUSH_SUBSCRIPTIONS (lista JSON),
// MODO = auto | hoy | manana, FORZAR = 1 para enviar aunque no sea la hora.
// Opcionales: VAPID_SUBJECT (mailto: o URL de contacto), AVISOS_PRIVADOS = 1 para mostrar solo iniciales.
// Con --clave solo escribe qué aviso tocaría ahora (p. ej. «2026-11-04-manana») en GITHUB_OUTPUT,
// para que el workflow no envíe dos veces el mismo aviso aunque el cron se retrase o se repita.
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Logica = require("../logica.js");
const { descifrar } = require("../cripto.js");
const webpush = require("web-push");

const env = process.env;
const ahora = new Date();
const partes = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(ahora).map(p => [p.type, p.value]));
const hoyMadrid = `${partes.year}-${partes.month}-${partes.day}`;
const horaMadrid = Number(partes.hour);

let modo = env.MODO || "auto";
const esPrueba = modo === "prueba";
if (esPrueba) modo = "manana";
if (modo === "auto") {
  // El cron de GitHub puede llegar tarde: se acepta hasta una hora de retraso (7–8 h y 19–20 h).
  // El workflow guarda qué avisos ya se enviaron, así que no se repiten.
  if (horaMadrid === 7 || horaMadrid === 8) modo = "hoy";
  else if (horaMadrid === 19 || horaMadrid === 20) modo = "manana";
  else modo = null;
}
const fechaAviso = modo && (modo === "hoy" ? hoyMadrid : Logica.iso(Logica.addDays(Logica.parse(hoyMadrid), 1)));
if (process.argv.includes("--clave")) {
  const clave = modo ? `${fechaAviso}-${modo}` : "ninguna";
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `clave=${clave}\n`);
  console.log(`Aviso que toca: ${clave}`);
  process.exit(0);
}
if (!modo) { console.log(`Son las ${horaMadrid}h en Madrid: no toca enviar.`); process.exit(0); }

const D = await descifrar(JSON.parse(readFileSync("datos.cifrados.json", "utf8")), env.CODIGO_FAMILIAR);
const fecha = fechaAviso;
const aviso = Logica.resumenAviso(D, fecha, modo === "hoy" ? "hoy" : "manana", { privado: env.AVISOS_PRIVADOS === "1" });
if (!aviso && env.FORZAR !== "1") { console.log(`Nada especial el ${fecha}: no se envía aviso.`); process.exit(0); }
const mensaje = esPrueba
  ? { titulo: "¡Avisos activados! 🩷🩵", cuerpo: "A partir de ahora recibirás lo de cada día a las 7:00 y lo de mañana a las 19:00." + (aviso ? "\n\n" + aviso.titulo + ":\n" + aviso.cuerpo : "") }
  : aviso || { titulo: "Prueba", cuerpo: "Los avisos funcionan en este móvil." };

// Móviles: los del secreto PUSH_SUBSCRIPTIONS y los guardados cifrados en suscripciones.cifradas.json.
let subs = JSON.parse(env.PUSH_SUBSCRIPTIONS || "[]");
if (existsSync("suscripciones.cifradas.json")) {
  subs = subs.concat(await descifrar(JSON.parse(readFileSync("suscripciones.cifradas.json", "utf8")), env.CODIGO_FAMILIAR));
}
subs = subs.filter((s, i, a) => s && s.endpoint && a.findIndex(x => x.endpoint === s.endpoint) === i);
if (!subs.length) { console.log("No hay móviles suscritos todavía."); process.exit(0); }
// Contacto para el servicio de push: un mailto: o la URL de la app (por defecto).
webpush.setVapidDetails(env.VAPID_SUBJECT || "https://momentosespeciales.github.io/Kibi/", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

let ok = 0;
for (const s of subs) {
  try {
    await webpush.sendNotification(s, JSON.stringify({ title: esPrueba ? "KiBi" : "KiBi · " + mensaje.titulo, body: esPrueba ? mensaje.titulo + "\n" + mensaje.cuerpo : mensaje.cuerpo, tag: "kibi-" + fecha, url: "./" }), { TTL: 6 * 3600, urgency: "normal" });
    ok++;
  } catch (e) {
    console.error(`Fallo al enviar a un móvil (${e.statusCode || "?"}): ${e.statusCode === 404 || e.statusCode === 410 ? "esta suscripción ya no existe, quítala de PUSH_SUBSCRIPTIONS" : e.body || e.message}`);
  }
}
console.log(`Aviso «${mensaje.titulo}» enviado a ${ok} de ${subs.length} móviles.`);
if (!ok) process.exit(1);
