// Revisa los datos de la agenda antes de publicarlos.
//   node scripts/validar.mjs [archivo.json]                 (por defecto datos/eventos.json)
//   CODIGO_FAMILIAR=... node scripts/validar.mjs --cifrado  (revisa datos.cifrados.json)
// Sale con error si hay errores. Las dudas solo se muestran (en GitHub Actions, como avisos).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { validarDatos } = require("./validacion.cjs");
const { descifrar } = require("../cripto.js");

const arg = process.argv[2] || "datos/eventos.json";
let D;
if (arg === "--cifrado") {
  if (!process.env.CODIGO_FAMILIAR) { console.error("Falta CODIGO_FAMILIAR para descifrar datos.cifrados.json"); process.exit(1); }
  D = await descifrar(JSON.parse(readFileSync("datos.cifrados.json", "utf8")), process.env.CODIGO_FAMILIAR);
} else D = JSON.parse(readFileSync(arg, "utf8"));

const { errores, dudas } = validarDatos(D);
const enActions = !!process.env.GITHUB_ACTIONS;
// En Actions no se escriben títulos ni fechas concretas en el registro: el repositorio puede ser público.
const mostrar = s => enActions ? s.replace(/«[^»]*»/g, "«…»").replace(/\(.*\)/, "") : s;
for (const d of dudas) console.log(enActions ? `::warning title=Dato por confirmar::${mostrar(d)}` : `⚠️  ${d}`);
for (const e of errores) console.log(enActions ? `::error title=Dato incorrecto::${mostrar(e)}` : `✗ ${e}`);
console.log(`${errores.length} errores, ${dudas.length} dudas.`);
if (errores.length) process.exit(1);
