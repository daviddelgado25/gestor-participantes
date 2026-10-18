// Código de interfaz: eventos y DOM. La lógica de datos está en validacion.js.

const participantes = [
  {
    id: 483721,
    nombre: "Ana García",
    edad: 17,
    tipo: "estudiante",
    modalidad: "presencial",
    experiencia: 4,
    fechaInscripcion: "2026-10-08T08:30:00.000Z"
  },
  {
    id: 582104,
    nombre: "Carlos Ruiz",
    edad: 31,
    tipo: "profesional",
    modalidad: "online",
    experiencia: 8.5,
    fechaInscripcion: "2026-10-09T11:15:00.000Z"
  },
  {
    id: 761235,
    nombre: "Lucía Martín",
    edad: 22,
    tipo: "invitado",
    modalidad: "presencial",
    experiencia: 2.5,
    fechaInscripcion: "2026-10-10T16:45:00.000Z"
  }
];

const formulario = document.getElementById("form-alta");
const resumenErrores = document.getElementById("resumen-errores");
const mensajeAlta = document.getElementById("mensaje-alta");
const lista = document.getElementById("lista");
const mensajeLista = document.getElementById("mensaje-lista");
const estadisticas = document.getElementById("estadisticas");
const resultadoMenor = document.getElementById("resultado-menor");
const jsonTexto = document.getElementById("json-texto");
const mensajeJson = document.getElementById("mensaje-json");
const panelEvento = document.getElementById("panel");
const estadoAyuda = document.getElementById("estado-ayuda");
const campoTema = document.getElementById("tema");
const campoTamano = document.getElementById("tamano");
const estadoPreferencias = document.getElementById("estado-preferencias");

let ventanaAyuda = null;
const origenEsperado = location.origin;

// ---------- Utilidades de interfaz ----------

function mostrarEstado(elemento, texto, esError) {
  elemento.textContent = texto;
  elemento.classList.remove("error", "exito");

  if (texto !== "") {
    elemento.classList.add(esError ? "error" : "exito");
  }
}

function mostrarFecha(fecha) {
  const fechaObjeto = new Date(fecha);

  if (Number.isNaN(fechaObjeto.getTime())) {
    return "Fecha no válida";
  }

  return fechaObjeto.toLocaleString("es-ES");
}

function crearLinea(texto) {
  const linea = document.createElement("p");
  linea.textContent = texto;
  return linea;
}

// ---------- Tarjetas y listado ----------

function crearTarjeta(participante) {
  const tarjeta = document.createElement("article");
  const esMenor = participante.edad < 18;

  tarjeta.classList.add("tarjeta", participante.modalidad);
  tarjeta.classList.toggle("menor", esMenor);
  tarjeta.classList.toggle("mayor", !esMenor);
  tarjeta.setAttribute("data-id", String(participante.id));
  tarjeta.setAttribute("data-modalidad", participante.modalidad);

  const nombre = document.createElement("h3");
  nombre.textContent = participante.nombre;

  const clasificacionEdad = esMenor ? "Menor de edad" : "Mayor de edad";
  const clasificacionExperiencia = clasificarExperiencia(participante.experiencia);

  const borrar = document.createElement("button");
  borrar.type = "button";
  borrar.textContent = "Borrar";
  borrar.setAttribute("aria-label", "Borrar a " + participante.nombre);

  borrar.addEventListener("click", function () {
    const seguro = confirm("¿Quieres borrar a " + participante.nombre + "?");

    if (!seguro) {
      return;
    }

    const posicion = participantes.findIndex(function (item) {
      return item.id === participante.id;
    });

    if (posicion === -1) {
      return;
    }

    participantes.splice(posicion, 1);
    tarjeta.remove();
    actualizarMensajeLista();
    actualizarEstadisticas();
    enviarResumenPanel();
    mostrarEstado(mensajeAlta, "Participante borrado.", false);
  });

  tarjeta.append(
    nombre,
    crearLinea("ID: " + participante.id),
    crearLinea("Edad: " + participante.edad + " (" + clasificacionEdad + ")"),
    crearLinea("Tipo: " + participante.tipo),
    crearLinea("Modalidad: " + participante.modalidad),
    crearLinea("Experiencia: " + participante.experiencia + " (" + clasificacionExperiencia + ")"),
    crearLinea("Inscripción: " + mostrarFecha(participante.fechaInscripcion)),
    borrar
  );

  return tarjeta;
}

function actualizarMensajeLista() {
  const mostradas = document.querySelectorAll("#lista .tarjeta").length;

  if (participantes.length === 0) {
    mensajeLista.textContent = "No hay participantes.";
  } else if (mostradas === 0) {
    mensajeLista.textContent = "No hay coincidencias con la búsqueda o el filtro.";
  } else {
    mensajeLista.textContent =
      mostradas + " de " + participantes.length + " participante(s) mostrado(s).";
  }
}

function actualizarLista() {
  lista.textContent = "";

  const texto = document.getElementById("busqueda").value.trim().toLowerCase();
  const modalidad = document.getElementById("filtro-modalidad").value;

  for (const participante of participantes) {
    const coincideNombre =
      texto === "" || participante.nombre.toLowerCase().includes(texto);
    const coincideModalidad =
      modalidad === "todas" || participante.modalidad === modalidad;

    if (!(coincideNombre && coincideModalidad)) {
      continue;
    }

    lista.append(crearTarjeta(participante));
  }

  actualizarMensajeLista();
}

// ---------- Estadísticas ----------

function actualizarEstadisticas() {
  const datos = calcularEstadisticas(participantes);
  estadisticas.textContent = "";

  const elementos = [
    ["Total", datos.total],
    ["Menores de edad", datos.menores],
    ["Mayores de edad", datos.mayores],
    ["Edad media", datos.mediaEdad === null ? "Sin datos" : datos.mediaEdad.toFixed(2)],
    ["Edad mínima", datos.edadMinima === null ? "Sin datos" : datos.edadMinima],
    ["Edad máxima", datos.edadMaxima === null ? "Sin datos" : datos.edadMaxima],
    ["Presencial", datos.presencial],
    ["Online", datos.online],
    ["Estudiantes", datos.estudiantes],
    ["Profesionales", datos.profesionales],
    ["Invitados", datos.invitados],
    [
      "Experiencia media presencial",
      datos.mediaExperienciaPresencial === null
        ? "Sin datos"
        : datos.mediaExperienciaPresencial.toFixed(2)
    ]
  ];

  for (const item of elementos) {
    const bloque = document.createElement("div");

    const titulo = document.createElement("dt");
    titulo.textContent = item[0];

    const valor = document.createElement("dd");
    valor.textContent = String(item[1]);

    bloque.append(titulo, valor);
    estadisticas.append(bloque);
  }
}

document.getElementById("btn-primer-menor").addEventListener("click", function () {
  const datos = calcularEstadisticas(participantes);

  if (datos.primerMenor === null) {
    mostrarEstado(resultadoMenor, "No hay ningún menor de edad.", true);
  } else {
    mostrarEstado(resultadoMenor, "Primer menor de edad: " + datos.primerMenor, false);
  }
});

// ---------- Panel (iframe) ----------

function enviarResumenPanel() {
  if (!panelEvento.contentWindow) {
    return;
  }

  const datos = calcularEstadisticas(participantes);
  let ultimo = null;

  for (const participante of participantes) {
    if (
      ultimo === null ||
      new Date(participante.fechaInscripcion) > new Date(ultimo.fechaInscripcion)
    ) {
      ultimo = participante;
    }
  }

  const resumen = {
    tipo: "resumen",
    total: datos.total,
    presencial: datos.presencial,
    online: datos.online,
    ultimoNombre: ultimo === null ? "" : ultimo.nombre,
    ultimaFecha: ultimo === null ? "" : ultimo.fechaInscripcion
  };

  panelEvento.contentWindow.postMessage(resumen, origenEsperado);
}

window.addEventListener("message", function (evento) {
  if (evento.origin !== origenEsperado) {
    return;
  }

  if (evento.source !== panelEvento.contentWindow) {
    return;
  }

  const datos = evento.data;

  if (datos === null || typeof datos !== "object") {
    return;
  }

  if (datos.tipo !== "preparado") {
    return;
  }

  enviarResumenPanel();
});

function actualizarTodo() {
  actualizarLista();
  actualizarEstadisticas();
  enviarResumenPanel();
}

// ---------- Alta ----------

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();
  mostrarEstado(resumenErrores, "", false);
  mostrarEstado(mensajeAlta, "", false);

  const datos = {
    nombre: document.getElementById("nombre").value,
    edad: document.getElementById("edad").value,
    tipo: document.getElementById("tipo").value,
    modalidad: document.getElementById("modalidad").value,
    experiencia: document.getElementById("experiencia").value
  };

  const resultado = validarParticipante(datos);

  if (!resultado.valido) {
    // Se conservan los valores escritos: no se hace reset().
    mostrarEstado(resumenErrores, resultado.errores.join(" "), true);
    return;
  }

  const id = generarId(participantes);

  if (id === null) {
    mostrarEstado(resumenErrores, "No se pudo generar un identificador.", true);
    return;
  }

  participantes.push({
    id: id,
    nombre: resultado.participante.nombre,
    edad: resultado.participante.edad,
    tipo: resultado.participante.tipo,
    modalidad: resultado.participante.modalidad,
    experiencia: resultado.participante.experiencia,
    fechaInscripcion: new Date().toISOString()
  });

  formulario.reset();
  actualizarTodo();
  mostrarEstado(mensajeAlta, "Participante añadido.", false);
});

document.getElementById("busqueda").addEventListener("input", actualizarLista);
document.getElementById("filtro-modalidad").addEventListener("change", actualizarLista);

// ---------- JSON ----------

document.getElementById("btn-exportar").addEventListener("click", function () {
  jsonTexto.value = JSON.stringify(participantes, null, 2);
  mostrarEstado(mensajeJson, "JSON exportado.", false);
});

document.getElementById("btn-importar").addEventListener("click", function () {
  let datos;

  // El try/catch solo envuelve JSON.parse, que es lo que puede fallar por sintaxis.
  try {
    datos = JSON.parse(jsonTexto.value);
  } catch (error) {
    mostrarEstado(mensajeJson, "El JSON no está bien formado. Revisa comas, comillas y llaves.", true);
    return;
  }

  const comprobacion = validarColeccion(datos);

  if (!comprobacion.valido) {
    // La colección anterior no se toca.
    mostrarEstado(mensajeJson, comprobacion.error, true);
    return;
  }

  participantes.splice(0, participantes.length);

  for (const participante of datos) {
    participantes.push({
      id: participante.id,
      nombre: participante.nombre.trim(),
      edad: participante.edad,
      tipo: participante.tipo,
      modalidad: participante.modalidad,
      experiencia: participante.experiencia,
      fechaInscripcion: participante.fechaInscripcion
    });
  }

  actualizarTodo();
  mostrarEstado(mensajeJson, "Importación correcta: " + participantes.length + " participante(s).", false);
});

document.getElementById("btn-vaciar").addEventListener("click", function () {
  participantes.splice(0, participantes.length);
  jsonTexto.value = "[]";
  actualizarTodo();
  mostrarEstado(mensajeJson, "Lista vaciada.", false);
});

// ---------- Preferencias (cookies) ----------

function aplicarPreferencias() {
  document.body.classList.toggle("oscuro", campoTema.value === "oscuro");
  document.body.classList.toggle("grande", campoTamano.value === "grande");
}

const temaGuardado = leerCookie("dwec_tema");
const tamanoGuardado = leerCookie("dwec_tamano");

campoTema.value = temaGuardado === "oscuro" ? "oscuro" : "claro";
campoTamano.value = tamanoGuardado === "grande" ? "grande" : "normal";
aplicarPreferencias();

document.getElementById("form-preferencias").addEventListener("submit", function (evento) {
  evento.preventDefault();

  // Lista cerrada: cualquier otro valor se sustituye por el predeterminado.
  campoTema.value = campoTema.value === "oscuro" ? "oscuro" : "claro";
  campoTamano.value = campoTamano.value === "grande" ? "grande" : "normal";
  aplicarPreferencias();

  guardarCookie("dwec_tema", campoTema.value, 30);
  guardarCookie("dwec_tamano", campoTamano.value, 30);

  const guardadas =
    leerCookie("dwec_tema") === campoTema.value &&
    leerCookie("dwec_tamano") === campoTamano.value;

  mostrarEstado(
    estadoPreferencias,
    guardadas
      ? "Preferencias aplicadas y guardadas."
      : "Preferencias aplicadas, pero no se ha podido confirmar su guardado.",
    !guardadas
  );
});

document.getElementById("btn-restablecer").addEventListener("click", function () {
  borrarCookie("dwec_tema");
  borrarCookie("dwec_tamano");

  campoTema.value = "claro";
  campoTamano.value = "normal";
  aplicarPreferencias();

  const borradas =
    leerCookie("dwec_tema") === null &&
    leerCookie("dwec_tamano") === null;

  mostrarEstado(
    estadoPreferencias,
    borradas
      ? "Preferencias restablecidas y cookies eliminadas."
      : "Aspecto restablecido, pero las cookies no se han podido eliminar.",
    !borradas
  );
});

// ---------- Ayuda (window.open) ----------

document.getElementById("btn-abrir-ayuda").addEventListener("click", function () {
  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.focus();
    mostrarEstado(estadoAyuda, "La ayuda ya estaba abierta.", false);
    return;
  }

  ventanaAyuda = window.open("ayuda.html", "ayudaEvento");

  if (ventanaAyuda === null) {
    mostrarEstado(estadoAyuda, "El navegador ha bloqueado la ventana de ayuda.", true);
  } else {
    mostrarEstado(estadoAyuda, "Se ha abierto la ayuda.", false);
  }
});

document.getElementById("btn-cerrar-ayuda").addEventListener("click", function () {
  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.close();
    mostrarEstado(estadoAyuda, "Ayuda cerrada.", false);
  } else {
    mostrarEstado(estadoAyuda, "No hay ninguna ayuda abierta.", false);
  }
});

// ---------- Arranque ----------

actualizarLista();
actualizarEstadisticas();
// El listener de "message" ya está instalado: ahora se carga el panel,
// que avisará con "preparado" cuando pueda recibir.
panelEvento.src = "panel.html";