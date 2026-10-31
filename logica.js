// Qué tiene cada niño un día concreto. Lo usan la app (navegador) y el envío de avisos (Node).
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Logica = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  // Colores disponibles para los peques. Si un niño no trae `color`, se reparte por orden.
  const TONOS = ["azul", "rosa", "verde", "naranja", "lila"];
  function tono(D, id) {
    const i = D.ninos.findIndex(n => n.id === id);
    const n = D.ninos[i];
    return n && TONOS.includes(n.color) ? n.color : TONOS[Math.max(i, 0) % TONOS.length];
  }

  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const largo = d => DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()];
  const corto = s => { const d = parse(s); return d.getDate() + "/" + (d.getMonth() + 1); };

  function cubre(e, f) {
    if (e.fecha) return e.anual ? f >= e.fecha && f.slice(5) === e.fecha.slice(5) : e.fecha === f;
    if (e.fechas) return e.fechas.includes(f);
    if (e.desde) return f >= e.desde && f <= e.hasta;
    return false;
  }

  // Devuelve el motivo si ese día no hay cole, o null si hay clase.
  function sinCole(D, f) {
    const d = parse(f);
    if (d.getDay() === 0 || d.getDay() === 6) return "Fin de semana";
    if (f < D.curso.inicio || f > D.curso.fin) return "Fuera del curso escolar";
    const s = D.sinCole.find(x => cubre(x, f));
    return s ? s.motivo : null;
  }

  function horario(D, f) {
    const esp = D.horario.especiales.find(x => cubre(x, f));
    return esp ? esp.texto : D.horario.normal;
  }

  function itemsDe(D, nino, f) {
    const d = parse(f), libre = sinCole(D, f), out = [];
    for (const s of D.semanal) {
      if (s.nino !== nino || s.dia !== d.getDay()) continue;
      if (s.desde && f < s.desde) continue;
      if (s.hasta && f > s.hasta) continue;
      if (s.soloConCole && libre) continue;
      out.push({ hora: s.hora || "", titulo: s.titulo, detalle: s.detalle || "", llevar: s.llevar || "", duda: s.duda || "" });
    }
    for (const e of D.eventos) {
      if (!e.ninos.includes(nino) || !cubre(e, f)) continue;
      out.push({ hora: e.hora || "", titulo: e.titulo, detalle: e.detalle || "", llevar: e.llevar || "", duda: e.duda || "" });
    }
    return out.sort((a, b) => (a.hora || "99").localeCompare(b.hora || "99"));
  }

  function tareasQueVencen(D, f) {
    return D.tareas.filter(t => t.limite === f);
  }

  // Texto corto para una notificación. Devuelve null si ese día no hay nada que avisar.
  // Con { privado: true } solo muestra la inicial de cada peque (se ve en la pantalla de bloqueo).
  function resumenAviso(D, f, cuando, opciones) {
    const privado = !!(opciones && opciones.privado);
    const lineas = [];
    const libre = sinCole(D, f);
    if (libre && libre !== "Fin de semana" && libre !== "Fuera del curso escolar") lineas.push("Sin cole: " + libre);
    const esp = D.horario.especiales.find(x => cubre(x, f));
    if (!libre && esp) lineas.push(esp.texto);
    // Agrupa lo que comparten los dos niños en una sola línea.
    const grupos = new Map();
    for (const n of D.ninos) {
      for (const it of itemsDe(D, n.id, f)) {
        const k = it.titulo + "|" + it.hora;
        if (!grupos.has(k)) grupos.set(k, { it, nombres: [] });
        grupos.get(k).nombres.push(privado ? n.nombre.charAt(0).toUpperCase() + "." : n.nombre);
      }
    }
    for (const { it, nombres } of grupos.values()) {
      let l = nombres.join(" y ") + ": " + it.titulo + (it.hora ? " (" + it.hora + ")" : "");
      if (it.llevar) l += ". Llevar " + it.llevar.charAt(0).toLowerCase() + it.llevar.slice(1);
      lineas.push(l);
    }
    for (const t of tareasQueVencen(D, f)) lineas.push("Último día: " + t.titulo);
    if (!lineas.length) return null;
    const titulo = (cuando === "hoy" ? "Hoy, " : "Mañana, ") + largo(parse(f));
    return { titulo, cuerpo: lineas.join("\n") };
  }

  return { DIAS, MESES, TONOS, tono, iso, parse, addDays, largo, corto, cubre, sinCole, horario, itemsDe, tareasQueVencen, resumenAviso };
});
