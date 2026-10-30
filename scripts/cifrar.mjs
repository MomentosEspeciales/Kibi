// Uso: CODIGO_FAMILIAR=... node scripts/cifrar.mjs
// Lee datos/eventos.json (no se sube a GitHub) y escribe datos.cifrados.json (sí se sube).
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const { cifrar } = createRequire(import.meta.url)("../cripto.js");
const codigo = process.env.CODIGO_FAMILIAR;
if (!codigo) { console.error("Falta CODIGO_FAMILIAR"); process.exit(1); }
const datos = JSON.parse(readFileSync("datos/eventos.json", "utf8"));
writeFileSync("datos.cifrados.json", JSON.stringify(await cifrar(datos, codigo)) + "\n");
console.log("datos.cifrados.json actualizado (" + datos.eventos.length + " eventos, " + datos.tareas.length + " tareas)");
