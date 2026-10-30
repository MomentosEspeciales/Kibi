// Personal annotations: validation and projection onto the existing family agenda.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./logica.js"));
  else root.Agenda = factory(root.Logica);
})(typeof self !== "undefined" ? self : this, function (L) {
  const TIPOS = ["cumple", "tarea", "extra", "evento"];
  const fechaValida = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && L.iso(L.parse(s)) === s;
  function validarLista(lista, ninos) {
    if (!Array.isArray(lista) || lista.length > 500) throw Error("La copia debe contener como máximo 500 anotaciones.");
    const ids = new Set();
    return lista.map(e => {
      if (!e || typeof e !== "object" || !TIPOS.includes(e.tipo)) throw Error("Hay una anotación de tipo desconocido.");
      if (typeof e.id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(e.id) || ids.has(e.id)) throw Error("La copia contiene identificadores incorrectos o repetidos.");
      ids.add(e.id);
      const texto = (k, max = 2000) => {
        if (e[k] != null && typeof e[k] !== "string") throw Error("Uno de los textos no es válido.");
        const s = (e[k] || "").trim();
        if (s.length > max) throw Error("Uno de los textos es demasiado largo.");
        return s;
      };
      const titulo = texto("titulo", 160);
      if (!titulo) throw Error("Escribe un nombre o título.");
      if (!Array.isArray(e.ninos) || !e.ninos.length || e.ninos.some(id => !ninos.includes(id))) throw Error("Selecciona al menos un peque de esta familia.");
      const fecha = e.fecha || "", hasta = e.hasta || "", hora = e.hora || "";
      if ((e.tipo !== "tarea" || fecha) && !fechaValida(fecha)) throw Error("Revisa la fecha.");
      if (hasta && (!fechaValida(hasta) || hasta < fecha)) throw Error("El final no puede ser anterior al inicio.");
      if (hora && (typeof hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora))) throw Error("Revisa la hora.");
      const dias = Array.isArray(e.dias) ? [...new Set(e.dias)] : [];
      if (e.tipo === "extra" && (!dias.length || dias.some(d => !Number.isInteger(d) || d < 0 || d > 6))) throw Error("Elige los días de la extraescolar.");
      return { id: e.id, tipo: e.tipo, titulo, ninos: [...new Set(e.ninos)], fecha, hasta: e.tipo === "extra" ? hasta : "", hora: e.tipo === "tarea" ? "" : hora, lugar: texto("lugar", 240), detalle: texto("detalle"), llevar: texto("llevar", 500), dias: e.tipo === "extra" ? dias : [], anual: e.tipo === "cumple" && e.anual === true, soloConCole: e.tipo === "extra" && e.soloConCole === true };
    });
  }
  function aplicar(base, entradas) {
    const D = { ...base, semanal: [...base.semanal], eventos: [...base.eventos], tareas: [...base.tareas] };
    for (const e of entradas) {
      const detalle = [e.lugar && "Lugar: " + e.lugar, e.detalle].filter(Boolean).join(" · ");
      const comun = { titulo: e.tipo === "cumple" ? "Cumpleaños · " + e.titulo : e.titulo, detalle, llevar: e.llevar, hora: e.hora };
      if (e.tipo === "tarea") D.tareas.push({ ...comun, ninos: e.ninos, limite: e.fecha, _personalId: e.id });
      else if (e.tipo === "extra") {
        for (const nino of e.ninos) for (const dia of e.dias) D.semanal.push({ ...comun, nino, dia, desde: e.fecha, hasta: e.hasta, soloConCole: e.soloConCole });
      } else D.eventos.push({ ...comun, ninos: e.ninos, fecha: e.fecha, anual: e.anual });
    }
    return D;
  }
  return { validarLista, aplicar, fechaValida };
});
