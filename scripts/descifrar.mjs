// Uso: CODIGO_FAMILIAR=... node scripts/descifrar.mjs
// Recupera datos/eventos.json a partir de datos.cifrados.json para poder editarlo.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const { descifrar } = createRequire(import.meta.url)("../cripto.js");
const codigo = process.env.CODIGO_FAMILIAR;
if (!codigo) { console.error("Falta CODIGO_FAMILIAR"); process.exit(1); }
const datos = await descifrar(JSON.parse(readFileSync("datos.cifrados.json", "utf8")), codigo);
mkdirSync("datos", { recursive: true });
writeFileSync("datos/eventos.json", JSON.stringify(datos, null, 2) + "\n");
console.log("datos/eventos.json listo para editar");
