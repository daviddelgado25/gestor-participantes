// Script del panel del evento (se ejecuta dentro del iframe).
// Recibe resúmenes de la página principal y construye su PROPIO DOM.

// Origen de la página que nos incrusta: el mismo host y puerto que este documento.
const origenPrincipal = location.origin;

// ---------- Utilidades ----------

// Comprueba que un texto representa una fecha que el navegador puede interpretar.
function fechaValida(texto) {
  return !Number.isNaN(new Date(texto).getTime());
}

// Pinta el resumen recibido. Todo se asigna con textContent (nunca como HTML).
function mostrarResumen(datos) {
  const resumen = document.getElementById("contenido-panel");

  // Si el contenedor no existe no se hace nada (selección sin coincidencias).
  if (resumen === null) {
    return;
  }

  // Se vacía el contenido anterior antes de pintar el nuevo.
  resumen.textContent = "";

  // Sin inscritos solo se muestra "Sin inscripciones".
  if (datos.total === 0) {
    const vacio = document.createElement("p");
    vacio.textContent = "Sin inscripciones";
    resumen.append(vacio);
    return;
  }

  // Un párrafo por cada dato del resumen.
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

// ---------- Recepción de mensajes ----------

// Todo mensaje se considera no fiable hasta superar todas las comprobaciones.
window.addEventListener("message", function (evento) {
  // 1) Origen: solo el de la página principal.
  if (evento.origin !== origenPrincipal) {
    return;
  }

  // 2) Ventana emisora: solo la ventana que contiene este iframe.
  if (evento.source !== window.parent) {
    return;
  }

  // 3) Los datos deben ser un objeto.
  const datos = evento.data;

  if (datos === null || typeof datos !== "object") {
    return;
  }

  // 4) Tipo de mensaje y tipos de cada propiedad.
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

  // 5) Valores coherentes: no negativos y presencial + online debe ser el total.
  if (
    datos.total < 0 ||
    datos.presencial < 0 ||
    datos.online < 0 ||
    datos.presencial + datos.online !== datos.total
  ) {
    return;
  }

  // 6) Con inscritos debe haber un nombre y una fecha válidos.
  if (
    datos.total > 0 &&
    (datos.ultimoNombre === "" || !fechaValida(datos.ultimaFecha))
  ) {
    return;
  }

  // Mensaje válido: el panel actualiza su propio DOM.
  mostrarResumen(datos);
});

// ---------- Aviso de que está preparado ----------

// Se envía DESPUÉS de instalar el receptor, así la principal no manda nada antes de tiempo.
window.parent.postMessage({ tipo: "preparado" }, origenPrincipal);
