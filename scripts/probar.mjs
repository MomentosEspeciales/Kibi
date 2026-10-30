// Comprobaciones rápidas: cifrado de ida y vuelta, código incorrecto y algunos días conocidos.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const L = require("../logica.js");
const { cifrar, descifrar } = require("../cripto.js");

const D = JSON.parse(readFileSync("datos/eventos.json", "utf8"));
const paquete = await cifrar(D, "Prueba Codigo");
assert.deepEqual(await descifrar(paquete, "  prueba codigo "), D, "el código no distingue mayúsculas ni espacios");
await assert.rejects(descifrar(paquete, "otro"), "un código incorrecto no descifra");

assert.equal(L.sinCole(D, "2026-11-13"), "Festivo de libre disposición");
assert.equal(L.sinCole(D, "2026-11-12"), null);
assert.ok(L.itemsDe(D, "daniel", "2026-11-05").some(i => i.titulo === "Piscina extraescolar"), "jueves 5/11: piscina extraescolar");
assert.ok(L.itemsDe(D, "daniel", "2026-11-06").some(i => i.titulo === "Educación Física"), "viernes 6/11: EF");
assert.ok(!L.itemsDe(D, "daniel", "2026-12-25").some(i => i.titulo === "Educación Física"), "en Navidad no hay EF");
assert.ok(L.itemsDe(D, "daniel", "2027-03-05").some(i => i.titulo === "Piscina con el cole"), "5/3: piscina con el cole");
assert.equal(L.resumenAviso(D, "2026-11-10", "manana"), null, "martes normal: sin aviso");
for (const f of ["2026-11-04", "2026-11-05", "2026-11-13", "2026-11-30", "2027-03-05"]) {
  const a = L.resumenAviso(D, f, "manana");
  console.log("—", a.titulo + "\n " + a.cuerpo.replace(/\n/g, "\n "));
}
console.log("Todo bien.");
