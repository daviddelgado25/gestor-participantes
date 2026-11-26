// Código de interfaz: eventos y DOM. La lógica de datos está en validacion.js
// y las cookies en cookies.js (ambos se cargan antes, por el orden de los defer).

// ---------- Datos en memoria ----------

// Colección de participantes. Al arrancar se cargan tres de ejemplo
// con edades, tipos y modalidades diferentes. No se conserva al recargar.
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

// ---------- Referencias a elementos del DOM ----------

// Se guardan una sola vez. El script lleva defer, así que el DOM ya existe.
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

// querySelector devuelve null si no encuentra nada, por eso más abajo se comprueba antes de usarlo.
const formularioPreferencias = document.querySelector("#form-preferencias");

// Nombres de los campos del formulario de alta (coinciden con sus id en el HTML).
const camposAlta = ["nombre", "edad", "tipo", "modalidad", "experiencia"];

// Referencia a la ventana de ayuda (null mientras no se haya abierto).
let ventanaAyuda = null;

// Origen que se espera en los mensajes: el mismo host y puerto que esta página.
const origenEsperado = location.origin;

// ---------- Utilidades de interfaz ----------

// Muestra un mensaje en un elemento y le pone la clase de error o de éxito.
// Con texto vacío limpia el mensaje y quita ambas clases.
function mostrarEstado(elemento, texto, esError) {
  elemento.textContent = texto;
  elemento.classList.remove("error", "exito");

  if (texto !== "") {
    // Ternario: la clase depende de si es un error o no.
    elemento.classList.add(esError ? "error" : "exito");
  }
}

// Convierte una fecha ISO a formato español. Si no es válida lo indica sin lanzar errores.
function mostrarFecha(fecha) {
  const fechaObjeto = new Date(fecha);

  if (Number.isNaN(fechaObjeto.getTime())) {
    return "Fecha no válida";
  }

  return fechaObjeto.toLocaleString("es-ES");
}

// Crea un párrafo con un texto. Se usa textContent: el texto nunca se interpreta como HTML.
function crearLinea(texto) {
  const linea = document.createElement("p");
  linea.textContent = texto;
  return linea;
}

// Muestra un error junto a cada campo. "campos" es un objeto { nombreCampo: mensaje }.
// Con un objeto vacío limpia todos los errores. Enfoca el primer campo inválido.
function mostrarErroresCampos(campos) {
  let primerInvalido = null;

  for (const nombreCampo of camposAlta) {
    const entrada = document.getElementById(nombreCampo);
    const aviso = document.getElementById("error-" + nombreCampo);
    const mensaje = campos[nombreCampo] ?? "";

    // El texto del error va en el <span> que hay junto al campo.
    if (aviso !== null) {
      aviso.textContent = mensaje;
    }

    // Si el campo no existe se pasa al siguiente.
    if (entrada === null) {
      continue;
    }

    // La clase pinta el borde rojo; aria-invalid lo comunica a los lectores de pantalla.
    entrada.classList.toggle("campo-invalido", mensaje !== "");

    if (mensaje !== "") {
      entrada.setAttribute("aria-invalid", "true");

      if (primerInvalido === null) {
        primerInvalido = entrada;
      }
    } else {
      entrada.removeAttribute("aria-invalid");
    }
  }

  // El foco va al primer error para que el usuario sepa por dónde empezar a corregir.
  if (primerInvalido !== null) {
    primerInvalido.focus();
  }
}

// ---------- Tarjetas y listado ----------

// Construye la tarjeta de un participante con createElement, textContent y append.
// No se usa innerHTML en ningún momento.
function crearTarjeta(participante) {
  const tarjeta = document.createElement("article");
  const esMenor = participante.edad < 18;

  // Las clases y atributos representan el estado: menor/mayor y presencial/online.
  tarjeta.classList.add("tarjeta", participante.modalidad);
  tarjeta.classList.toggle("menor", esMenor);
  tarjeta.classList.toggle("mayor", !esMenor);
  tarjeta.setAttribute("data-id", String(participante.id));
  tarjeta.setAttribute("data-modalidad", participante.modalidad);

  // Título con el nombre (asignado como texto: "<b>Ana</b>" se ve literal).
  const nombre = document.createElement("h3");
  nombre.textContent = participante.nombre;

  // Clasificaciones: la de edad con ternario y la de experiencia con la función de validacion.js.
  const clasificacionEdad = esMenor ? "Menor de edad" : "Mayor de edad";
  const clasificacionExperiencia = clasificarExperiencia(participante.experiencia);

  // Botón de borrar, con una etiqueta accesible que indica a quién borra.
  const borrar = document.createElement("button");
  borrar.type = "button";
  borrar.textContent = "Borrar";
  borrar.setAttribute("aria-label", "Borrar a " + participante.nombre);

  // Cada tarjeta crea su propio manejador, que "recuerda" a su participante y su tarjeta.
  borrar.addEventListener("click", function () {
    // confirm devuelve true si se acepta y false si se cancela.
    const seguro = confirm("¿Quieres borrar a " + participante.nombre + "?");

    // Cancelar deja la aplicación exactamente como estaba.
    if (!seguro) {
      return;
    }

    // Se localiza al participante por id (la posición puede haber cambiado con filtros o altas).
    const posicion = participantes.findIndex(function (item) {
      return item.id === participante.id;
    });

    if (posicion === -1) {
      return;
    }

    // Se elimina el dato de la colección y SOLO su tarjeta del DOM.
    participantes.splice(posicion, 1);
    tarjeta.remove();

    // Se refrescan mensaje del listado, estadísticas y panel.
    actualizarMensajeLista();
    actualizarEstadisticas();
    enviarResumenPanel();
    mostrarEstado(mensajeAlta, "Participante borrado.", false);
  });

  // Se añaden todos los datos a la tarjeta en un único append.
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

// Actualiza el mensaje bajo los filtros: sin participantes, sin coincidencias o recuento.
function actualizarMensajeLista() {
  // querySelectorAll devuelve una colección vacía (no null) cuando no hay tarjetas.
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

// Reconstruye el listado aplicando a la vez la búsqueda por nombre y el filtro de modalidad.
function actualizarLista() {
  // Se vacía el contenedor antes de volver a pintar.
  lista.textContent = "";

  // Texto de búsqueda normalizado: sin espacios en los extremos y en minúsculas.
  const texto = document.getElementById("busqueda").value.trim().toLowerCase();
  const modalidad = document.getElementById("filtro-modalidad").value;

  for (const participante of participantes) {
    // Un campo de búsqueda vacío coincide con todos; si no, se compara sin distinguir mayúsculas.
    const coincideNombre =
      texto === "" || participante.nombre.toLowerCase().includes(texto);
    const coincideModalidad =
      modalidad === "todas" || participante.modalidad === modalidad;

    // Si no cumple ambas condiciones, continue salta a la siguiente vuelta.
    if (!(coincideNombre && coincideModalidad)) {
      continue;
    }

    lista.append(crearTarjeta(participante));
  }

  actualizarMensajeLista();
}

// ---------- Estadísticas ----------

// Pinta las estadísticas de la colección COMPLETA (aunque el listado esté filtrado).
function actualizarEstadisticas() {
  const datos = calcularEstadisticas(participantes);
  estadisticas.textContent = "";

  // Un resultado anterior de "primer menor" podría estar desfasado: se limpia.
  mostrarEstado(resultadoMenor, "", false);

  // Pares [título, valor]. Las medias llevan dos decimales y "Sin datos" si valen null.
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

  // Cada par se convierte en un bloque con <dt> (título) y <dd> (valor).
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

// Botón "Buscar primer menor de edad": usa el resultado calculado con break en validacion.js.
document.getElementById("btn-primer-menor").addEventListener("click", function () {
  const datos = calcularEstadisticas(participantes);

  if (datos.primerMenor === null) {
    mostrarEstado(resultadoMenor, "No hay ningún menor de edad.", true);
  } else {
    mostrarEstado(resultadoMenor, "Primer menor de edad: " + datos.primerMenor, false);
  }
});

// ---------- Panel (iframe) y postMessage ----------

// Calcula el resumen y se lo envía al panel. La página principal NO toca el DOM del panel:
// solo le manda datos y él decide cómo pintarlos.
function enviarResumenPanel() {
  // Si el iframe aún no tiene ventana, no hay a quién enviar.
  if (!panelEvento.contentWindow) {
    return;
  }

  const datos = calcularEstadisticas(participantes);

  // Se busca el participante con la fecha de inscripción más reciente.
  let ultimo = null;

  for (const participante of participantes) {
    if (
      ultimo === null ||
      new Date(participante.fechaInscripcion) > new Date(ultimo.fechaInscripcion)
    ) {
      ultimo = participante;
    }
  }

  // Mensaje con una estructura fija que el panel validará al recibirlo.
  const resumen = {
    tipo: "resumen",
    total: datos.total,
    presencial: datos.presencial,
    online: datos.online,
    ultimoNombre: ultimo === null ? "" : ultimo.nombre,
    ultimaFecha: ultimo === null ? "" : ultimo.fechaInscripcion
  };

  // targetOrigin concreto (nunca "*"): solo lo recibirá una página de nuestro origen.
  panelEvento.contentWindow.postMessage(resumen, origenEsperado);
}

// Receptor de mensajes: solo acepta el aviso "preparado" del panel.
window.addEventListener("message", function (evento) {
  // 1) Origen: debe ser el nuestro.
  if (evento.origin !== origenEsperado) {
    return;
  }

  // 2) Ventana emisora: debe ser exactamente la del iframe del panel.
  if (evento.source !== panelEvento.contentWindow) {
    return;
  }

  // 3) Estructura y valores de los datos.
  const datos = evento.data;

  if (datos === null || typeof datos !== "object") {
    return;
  }

  if (datos.tipo !== "preparado") {
    return;
  }

  // El panel ya puede recibir: se le envía el resumen inicial.
  enviarResumenPanel();
});

// Refresca todo lo que depende de la colección (listado, estadísticas y panel).
function actualizarTodo() {
  actualizarLista();
  actualizarEstadisticas();
  enviarResumenPanel();
}

// ---------- Alta de participantes ----------

formulario.addEventListener("submit", function (evento) {
  // Se evita el envío normal del formulario: lo gestiona JavaScript.
  evento.preventDefault();

  // Se limpian los mensajes y errores de la vez anterior.
  mostrarEstado(resumenErrores, "", false);
  mostrarEstado(mensajeAlta, "", false);
  mostrarErroresCampos({});

  // Se leen los valores tal cual (todos son texto) y se pasan a validar.
  const datos = {
    nombre: document.getElementById("nombre").value,
    edad: document.getElementById("edad").value,
    tipo: document.getElementById("tipo").value,
    modalidad: document.getElementById("modalidad").value,
    experiencia: document.getElementById("experiencia").value
  };

  const resultado = validarParticipante(datos);

  // Con errores: se muestran junto a cada campo y en el resumen, y no se añade nada.
  if (!resultado.valido) {
    // Se conservan los valores escritos: no se hace reset().
    mostrarErroresCampos(resultado.campos);
    mostrarEstado(resumenErrores, resultado.errores.join(" "), true);
    return;
  }

  // Id único; si no se consigue (muy improbable) se avisa y no se añade.
  const id = generarId(participantes);

  if (id === null) {
    mostrarEstado(resumenErrores, "No se pudo generar un identificador.", true);
    return;
  }

  // Alta correcta: se guarda el participante con la fecha actual en formato ISO.
  participantes.push({
    id: id,
    nombre: resultado.participante.nombre,
    edad: resultado.participante.edad,
    tipo: resultado.participante.tipo,
    modalidad: resultado.participante.modalidad,
    experiencia: resultado.participante.experiencia,
    fechaInscripcion: new Date().toISOString()
  });

  // Se limpia el formulario y se actualizan listado, estadísticas y panel.
  formulario.reset();
  actualizarTodo();
  mostrarEstado(mensajeAlta, "Participante añadido.", false);
});

// ---------- Búsqueda y filtro ----------

// Cada pulsación en la búsqueda y cada cambio del filtro vuelven a pintar el listado.
document.getElementById("busqueda").addEventListener("input", actualizarLista);
document.getElementById("filtro-modalidad").addEventListener("change", actualizarLista);

// ---------- JSON: exportar, importar y vaciar ----------

// Exportar: convierte la colección completa a texto JSON con sangría de 2 espacios.
document.getElementById("btn-exportar").addEventListener("click", function () {
  jsonTexto.value = JSON.stringify(participantes, null, 2);
  mostrarEstado(mensajeJson, "JSON exportado.", false);
});

// Importar: primero se comprueba la sintaxis, después el contenido; solo si todo es válido se sustituye.
document.getElementById("btn-importar").addEventListener("click", function () {
  // "datos" se declara fuera del try para poder usarla después (ámbito de bloque).
  let datos;

  // El try/catch solo envuelve JSON.parse, que es lo que puede fallar por sintaxis.
  try {
    datos = JSON.parse(jsonTexto.value);
  } catch (error) {
    mostrarEstado(mensajeJson, "El JSON no está bien formado. Revisa comas, comillas y llaves.", true);
    return;
  }

  // Validación completa de la colección (tipos, rangos, ids, fechas).
  const comprobacion = validarColeccion(datos);

  if (!comprobacion.valido) {
    // La colección anterior no se toca: no hay importaciones parciales.
    mostrarEstado(mensajeJson, comprobacion.error, true);
    return;
  }

  // Todo es válido: se vacía la colección actual (conservando la misma constante)...
  participantes.splice(0, participantes.length);

  // ...y se copian solo los campos previstos, con el nombre sin espacios en los extremos.
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

  // Se actualizan tarjetas, estadísticas y panel (también con un array vacío).
  actualizarTodo();
  mostrarEstado(mensajeJson, "Importación correcta: " + participantes.length + " participante(s).", false);
});

// Vaciar: deja la colección en [] (útil para probar el estado "sin participantes").
document.getElementById("btn-vaciar").addEventListener("click", function () {
  participantes.splice(0, participantes.length);
  jsonTexto.value = "[]";
  actualizarTodo();
  mostrarEstado(mensajeJson, "Lista vaciada.", false);
});

// ---------- Preferencias (cookies) ----------

// Aplica las preferencias elegidas en los selectores. toggle con segundo argumento
// añade o quita la clase según el booleano, así repetir la llamada da siempre el mismo estado.
function aplicarPreferencias() {
  document.body.classList.toggle("oscuro", campoTema.value === "oscuro");
  document.body.classList.toggle("grande", campoTamano.value === "grande");
}

// Al cargar la página se leen las cookies. Los valores se tratan como NO fiables:
// solo se aceptan los de la lista cerrada y cualquier otro cae en el valor predeterminado.
const temaGuardado = leerCookie("dwec_tema");
const tamanoGuardado = leerCookie("dwec_tamano");

campoTema.value = temaGuardado === "oscuro" ? "oscuro" : "claro";
campoTamano.value = tamanoGuardado === "grande" ? "grande" : "normal";
aplicarPreferencias();

// Solo se instala el manejador si el formulario existe (querySelector podría devolver null).
if (formularioPreferencias !== null) {
  // Guardar: aplica el aspecto, guarda las dos cookies y comprueba por lectura si se guardaron.
  formularioPreferencias.addEventListener("submit", function (evento) {
    evento.preventDefault();

    // Lista cerrada: cualquier otro valor se sustituye por el predeterminado.
    campoTema.value = campoTema.value === "oscuro" ? "oscuro" : "claro";
    campoTamano.value = campoTamano.value === "grande" ? "grande" : "normal";

    // El aspecto se aplica siempre, aunque las cookies estén bloqueadas.
    aplicarPreferencias();

    // Dos cookies independientes durante 30 días.
    guardarCookie("dwec_tema", campoTema.value, 30);
    guardarCookie("dwec_tamano", campoTamano.value, 30);

    // Comprobación por lectura: ¿se ha podido recuperar lo que se acaba de guardar?
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
}

// Restablecer: borra ambas cookies, vuelve a los valores predeterminados y lo comprueba por lectura.
document.getElementById("btn-restablecer").addEventListener("click", function () {
  borrarCookie("dwec_tema");
  borrarCookie("dwec_tamano");

  campoTema.value = "claro";
  campoTamano.value = "normal";
  aplicarPreferencias();

  // Si las cookies siguen existiendo, leerCookie no devolverá null.
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

// Abrir ayuda: reutiliza la ventana si sigue abierta; si no, la abre y avisa si se bloquea.
document.getElementById("btn-abrir-ayuda").addEventListener("click", function () {
  // Se comprueba closed porque el usuario pudo cerrarla a mano.
  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.focus();
    mostrarEstado(estadoAyuda, "La ayuda ya estaba abierta.", false);
    return;
  }

  // El nombre "ayudaEvento" permite reutilizar la misma ventana.
  ventanaAyuda = window.open("ayuda.html", "ayudaEvento");

  // null indica que el navegador ha bloqueado la apertura.
  if (ventanaAyuda === null) {
    mostrarEstado(estadoAyuda, "El navegador ha bloqueado la ventana de ayuda.", true);
  } else {
    mostrarEstado(estadoAyuda, "Se ha abierto la ayuda.", false);
  }
});

// Cerrar ayuda: solo si existe y no está ya cerrada.
document.getElementById("btn-cerrar-ayuda").addEventListener("click", function () {
  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.close();
    mostrarEstado(estadoAyuda, "Ayuda cerrada.", false);
  } else {
    mostrarEstado(estadoAyuda, "No hay ninguna ayuda abierta.", false);
  }
});

// ---------- Arranque ----------

// Primer pintado del listado y de las estadísticas.
actualizarLista();
actualizarEstadisticas();

// El receptor de "message" ya está instalado: ahora se carga el panel (el iframe no tiene
// src en el HTML), que avisará con "preparado" cuando pueda recibir el resumen.
panelEvento.src = "panel.html";
