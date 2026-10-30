// Añade un móvil a la lista de avisos.
// Uso: CODIGO_FAMILIAR=... node scripts/suscribir.mjs "Nombre del móvil" '<código que muestra la app>'
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
const { cifrar, descifrar } = createRequire(import.meta.url)("../cripto.js");
const codigo = process.env.CODIGO_FAMILIAR;
const [nombre, json] = process.argv.slice(2);
if (!codigo || !nombre || !json) { console.error("Uso: CODIGO_FAMILIAR=... node scripts/suscribir.mjs \"Nombre\" '<código del móvil>'"); process.exit(1); }
const sub = JSON.parse(json);
if (!sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) { console.error("Ese código no parece de KiBi: falta endpoint o keys."); process.exit(1); }
const archivo = "suscripciones.cifradas.json";
const lista = existsSync(archivo) ? await descifrar(JSON.parse(readFileSync(archivo, "utf8")), codigo) : [];
const resto = lista.filter(s => s.endpoint !== sub.endpoint && s.nombre !== nombre);
resto.push({ nombre, endpoint: sub.endpoint, keys: sub.keys });
writeFileSync(archivo, JSON.stringify(await cifrar(resto, codigo)) + "\n");
console.log(`${nombre} añadido. Móviles en la lista: ${resto.map(s => s.nombre).join(", ")}`);
