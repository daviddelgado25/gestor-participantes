const origenPrincipal = location.origin;

function fechaValida(texto) {
  return !Number.isNaN(new Date(texto).getTime());
}

function mostrarResumen(datos) {
  const resumen = document.getElementById("contenido-panel");

  if (resumen === null) {
    return;
  }

  resumen.textContent = "";

  if (datos.total === 0) {
    const vacio = document.createElement("p");
    vacio.textContent = "Sin inscripciones";
    resumen.append(vacio);
    return;
  }

  const total = document.createElement("p");
  total.textContent = "Total de inscritos: " + datos.total;

  const presencial = document.createElement("p");
  presencial.textContent = "Presenciales: " + datos.presencial;

  const online = document.createElement("p");
  online.textContent = "Online: " + datos.online;

  const ultimo = document.createElement("p");
  ultimo.textContent =
    "Última inscripción: " +
    datos.ultimoNombre +
    " - " +
    new Date(datos.ultimaFecha).toLocaleString("es-ES");

  resumen.append(total, presencial, online, ultimo);
}

window.addEventListener("message", function (evento) {
  if (evento.origin !== origenPrincipal) {
    return;
  }

  if (evento.source !== window.parent) {
    return;
  }

  const datos = evento.data;

  if (datos === null || typeof datos !== "object") {
    return;
  }

  if (
    datos.tipo !== "resumen" ||
    !Number.isInteger(datos.total) ||
    !Number.isInteger(datos.presencial) ||
    !Number.isInteger(datos.online) ||
    typeof datos.ultimoNombre !== "string" ||
    typeof datos.ultimaFecha !== "string"
  ) {
    return;
  }

  if (
    datos.total < 0 ||
    datos.presencial < 0 ||
    datos.online < 0 ||
    datos.presencial + datos.online !== datos.total
  ) {
    return;
  }

  // Con inscritos debe haber un nombre y una fecha válidos.
  if (
    datos.total > 0 &&
    (datos.ultimoNombre === "" || !fechaValida(datos.ultimaFecha))
  ) {
    return;
  }

  mostrarResumen(datos);
});

// El aviso se envía después de instalar el receptor.
window.parent.postMessage({ tipo: "preparado" }, origenPrincipal);