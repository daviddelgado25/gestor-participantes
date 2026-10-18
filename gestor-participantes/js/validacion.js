// Lógica de datos: estas funciones NO leen ni modifican el DOM.
// Reciben parámetros y devuelven resultados.

function clasificarExperiencia(experiencia) {
  if (experiencia < 4) {
    return "Inicial";
  } else if (experiencia < 7) {
    return "Intermedia";
  } else {
    return "Avanzada";
  }
}

function validarParticipante(datos) {
  const errores = [];

  const nombre = String(datos.nombre ?? "").trim();
  const edadTexto = String(datos.edad ?? "").trim();
  const tipo = String(datos.tipo ?? "");
  const modalidad = String(datos.modalidad ?? "");
  const experienciaTexto = String(datos.experiencia ?? "").trim();

  // Se convierte después de comprobar la cadena vacía (Number("") da 0).
  const edad = Number(edadTexto);
  const experiencia = Number(experienciaTexto);

  if (nombre.length < 2 || nombre.length > 60) {
    errores.push("El nombre tiene que tener entre 2 y 60 caracteres.");
  }

  if (
    edadTexto === "" ||
    !Number.isFinite(edad) ||
    !Number.isInteger(edad) ||
    edad < 0 ||
    edad > 120
  ) {
    errores.push("La edad debe ser un entero entre 0 y 120.");
  }

  if (tipo !== "estudiante" && tipo !== "profesional" && tipo !== "invitado") {
    errores.push("El tipo debe ser estudiante, profesional o invitado.");
  }

  if (modalidad !== "presencial" && modalidad !== "online") {
    errores.push("La modalidad debe ser presencial u online.");
  }

  if (
    experienciaTexto === "" ||
    !Number.isFinite(experiencia) ||
    experiencia < 0 ||
    experiencia > 10
  ) {
    errores.push("La experiencia debe ser un número entre 0 y 10.");
  }

  if (errores.length > 0) {
    return { valido: false, errores: errores };
  }

  return {
    valido: true,
    errores: [],
    participante: {
      nombre: nombre,
      edad: edad,
      tipo: tipo,
      modalidad: modalidad,
      experiencia: experiencia
    }
  };
}

function generarId(participantes) {
  let intentos = 0;

  while (intentos < 100) {
    const id = Math.floor(Math.random() * 900000) + 100000;
    let repetido = false;

    for (const participante of participantes) {
      if (participante.id === id) {
        repetido = true;
        break;
      }
    }

    if (!repetido) {
      return id;
    }

    intentos++;
  }

  return null;
}

function calcularEstadisticas(participantes) {
  let menores = 0;
  let mayores = 0;
  let sumaEdades = 0;
  let edadMinima = null;
  let edadMaxima = null;
  let presencial = 0;
  let online = 0;
  let estudiantes = 0;
  let profesionales = 0;
  let invitados = 0;

  // Recorrido principal: contadores y acumuladores.
  for (const participante of participantes) {
    sumaEdades += participante.edad;

    if (participante.edad < 18) {
      menores++;
    } else {
      mayores++;
    }

    if (edadMinima === null || participante.edad < edadMinima) {
      edadMinima = participante.edad;
    }

    if (edadMaxima === null || participante.edad > edadMaxima) {
      edadMaxima = participante.edad;
    }

    if (participante.modalidad === "presencial") {
      presencial++;
    } else {
      online++;
    }

    switch (participante.tipo) {
      case "estudiante":
        estudiantes++;
        break;
      case "profesional":
        profesionales++;
        break;
      case "invitado":
        invitados++;
        break;
      default:
        break;
    }
  }

  // Experiencia presencial: continue para omitir la modalidad online.
  let sumaExperienciaPresencial = 0;
  let cantidadPresencial = 0;

  for (const participante of participantes) {
    if (participante.modalidad === "online") {
      continue;
    }

    sumaExperienciaPresencial += participante.experiencia;
    cantidadPresencial++;
  }

  // Primer menor en el orden de la colección: break al encontrarlo.
  let primerMenor = null;

  for (const participante of participantes) {
    if (participante.edad < 18) {
      primerMenor = participante.nombre;
      break;
    }
  }

  let mediaEdad = null;
  let mediaExperienciaPresencial = null;

  if (participantes.length > 0) {
    mediaEdad = sumaEdades / participantes.length;
  }

  if (cantidadPresencial > 0) {
    mediaExperienciaPresencial = sumaExperienciaPresencial / cantidadPresencial;
  }

  return {
    total: participantes.length,
    menores: menores,
    mayores: mayores,
    mediaEdad: mediaEdad,
    edadMinima: edadMinima,
    edadMaxima: edadMaxima,
    presencial: presencial,
    online: online,
    estudiantes: estudiantes,
    profesionales: profesionales,
    invitados: invitados,
    mediaExperienciaPresencial: mediaExperienciaPresencial,
    primerMenor: primerMenor
  };
}

// Fecha ISO como la que genera toISOString (con o sin milisegundos).
function esFechaIsoValida(texto) {
  if (typeof texto !== "string") {
    return false;
  }

  const formato = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

  if (!formato.test(texto)) {
    return false;
  }

  const fecha = new Date(texto);

  if (Number.isNaN(fecha.getTime())) {
    return false;
  }

  // Detecta fechas que el navegador "corrige", como 2026-02-31.
  return fecha.toISOString().slice(0, 10) === texto.slice(0, 10);
}

// Valida una colección importada completa. No modifica nada.
function validarColeccion(datos) {
  if (!Array.isArray(datos)) {
    return { valido: false, error: "El JSON debe ser un array de participantes." };
  }

  const ids = [];

  for (let i = 0; i < datos.length; i++) {
    const participante = datos[i];
    const posicion = "Elemento " + (i + 1) + ": ";

    if (
      participante === null ||
      typeof participante !== "object" ||
      Array.isArray(participante)
    ) {
      return { valido: false, error: posicion + "debe ser un objeto." };
    }

    if (
      typeof participante.nombre !== "string" ||
      typeof participante.edad !== "number" ||
      typeof participante.tipo !== "string" ||
      typeof participante.modalidad !== "string" ||
      typeof participante.experiencia !== "number"
    ) {
      return { valido: false, error: posicion + "faltan campos o tienen un tipo incorrecto." };
    }

    const resultado = validarParticipante(participante);

    if (!resultado.valido) {
      return { valido: false, error: posicion + resultado.errores.join(" ") };
    }

    if (
      !Number.isInteger(participante.id) ||
      participante.id < 100000 ||
      participante.id > 999999
    ) {
      return { valido: false, error: posicion + "el id debe ser un entero entre 100000 y 999999." };
    }

    if (ids.includes(participante.id)) {
      return { valido: false, error: posicion + "el id está repetido." };
    }

    if (!esFechaIsoValida(participante.fechaInscripcion)) {
      return { valido: false, error: posicion + "la fecha de inscripción no es una fecha ISO válida." };
    }

    ids.push(participante.id);
  }

  return { valido: true, error: "" };
}