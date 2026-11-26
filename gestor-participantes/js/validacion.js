// Lógica de datos: estas funciones NO leen ni modifican el DOM.
// Reciben parámetros y devuelven resultados, así se pueden probar de forma aislada.

// ---------- Clasificación de la experiencia ----------

// Recibe un número (0 a 10) y devuelve su nivel como texto.
// Se usa if / else if / else porque hay tres tramos ordenados:
// si llega al segundo "else if" ya se sabe que la experiencia es >= 4.
function clasificarExperiencia(experiencia) {
  if (experiencia < 4) {
    return "Inicial";
  } else if (experiencia < 7) {
    return "Intermedia";
  } else {
    return "Avanzada";
  }
}

// ---------- Validación de un participante ----------

// Recibe los datos "en bruto" (textos de un formulario o valores de un JSON)
// y devuelve { valido, errores, campos, participante }.
// - errores: lista de mensajes (para el resumen)
// - campos: un mensaje por campo (para mostrarlo junto a cada campo)
// - participante: datos ya convertidos y normalizados (solo si es válido)
function validarParticipante(datos) {
  const errores = [];
  const campos = {};

  // Se convierte todo a texto de forma segura. "??" solo sustituye null o undefined,
  // así que un 0 numérico (edad 0 válida) NO se pierde, cosa que sí pasaría con "||".
  const nombre = String(datos.nombre ?? "").trim();
  const edadTexto = String(datos.edad ?? "").trim();
  const tipo = String(datos.tipo ?? "");
  const modalidad = String(datos.modalidad ?? "");
  const experienciaTexto = String(datos.experiencia ?? "").trim();

  // Number("") devuelve 0, por eso más abajo se comprueba primero la cadena vacía.
  // Number("18abc") devuelve NaN, así que entradas como esa se rechazan.
  const edad = Number(edadTexto);
  const experiencia = Number(experienciaTexto);

  // Nombre: entre 2 y 60 caracteres ya sin espacios en los extremos.
  if (nombre.length < 2 || nombre.length > 60) {
    const mensaje = "El nombre tiene que tener entre 2 y 60 caracteres.";
    errores.push(mensaje);
    campos.nombre = mensaje;
  }

  // Edad: no vacía, numérica, finita, entera y entre 0 y 120 (el 0 es válido).
  if (
    edadTexto === "" ||
    !Number.isFinite(edad) ||
    !Number.isInteger(edad) ||
    edad < 0 ||
    edad > 120
  ) {
    const mensaje = "La edad debe ser un entero entre 0 y 120.";
    errores.push(mensaje);
    campos.edad = mensaje;
  }

  // Tipo: lista cerrada de valores, comparados con igualdad estricta.
  if (tipo !== "estudiante" && tipo !== "profesional" && tipo !== "invitado") {
    const mensaje = "El tipo debe ser estudiante, profesional o invitado.";
    errores.push(mensaje);
    campos.tipo = mensaje;
  }

  // Modalidad: lista cerrada de valores.
  if (modalidad !== "presencial" && modalidad !== "online") {
    const mensaje = "La modalidad debe ser presencial u online.";
    errores.push(mensaje);
    campos.modalidad = mensaje;
  }

  // Experiencia: no vacía, numérica, finita y entre 0 y 10 (admite decimales).
  if (
    experienciaTexto === "" ||
    !Number.isFinite(experiencia) ||
    experiencia < 0 ||
    experiencia > 10
  ) {
    const mensaje = "La experiencia debe ser un número entre 0 y 10.";
    errores.push(mensaje);
    campos.experiencia = mensaje;
  }

  // Si hay algún error no se devuelve ningún participante.
  if (errores.length > 0) {
    return { valido: false, errores: errores, campos: campos };
  }

  // Todo correcto: se devuelven los datos ya convertidos a su tipo final.
  return {
    valido: true,
    errores: [],
    campos: {},
    participante: {
      nombre: nombre,
      edad: edad,
      tipo: tipo,
      modalidad: modalidad,
      experiencia: experiencia
    }
  };
}

// ---------- Generación de identificadores ----------

// Devuelve un id entero de 100000 a 999999 que no exista ya en la colección.
// Si tras 100 intentos no lo consigue devuelve null: así nunca bloquea la pestaña.
function generarId(participantes) {
  let intentos = 0;

  // while con límite de intentos: no sabemos cuántas vueltas harán falta.
  while (intentos < 100) {
    // Math.random() da un decimal en [0, 1); esta fórmula lo convierte en un entero del rango pedido.
    const id = Math.floor(Math.random() * 900000) + 100000;
    let repetido = false;

    // Se busca el id en la colección y se sale con break en cuanto aparece.
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

// ---------- Estadísticas ----------

// Calcula todas las estadísticas de la colección COMPLETA con bucles, contadores
// y acumuladores (sin reduce). Si no hay datos, medias y extremos valen null.
function calcularEstadisticas(participantes) {
  // Contadores y acumuladores: se inicializan antes de los bucles.
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

  // Recorrido principal: una sola pasada para casi todo.
  for (const participante of participantes) {
    // Acumulador de edades para la media.
    sumaEdades += participante.edad;

    // Contadores de menores y mayores de edad.
    if (participante.edad < 18) {
      menores++;
    } else {
      mayores++;
    }

    // Mínimo y máximo: el primer valor se toma como punto de partida (null = aún sin valor).
    if (edadMinima === null || participante.edad < edadMinima) {
      edadMinima = participante.edad;
    }

    if (edadMaxima === null || participante.edad > edadMaxima) {
      edadMaxima = participante.edad;
    }

    // Contador por modalidad.
    if (participante.modalidad === "presencial") {
      presencial++;
    } else {
      online++;
    }

    // Contador por tipo: switch porque se compara una misma expresión con varios valores.
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

  // Segundo recorrido: experiencia media de los presenciales.
  // continue salta las vueltas de los participantes online.
  let sumaExperienciaPresencial = 0;
  let cantidadPresencial = 0;

  for (const participante of participantes) {
    if (participante.modalidad === "online") {
      continue;
    }

    sumaExperienciaPresencial += participante.experiencia;
    cantidadPresencial++;
  }

  // Tercer recorrido: primer menor según el orden de la colección.
  // break termina el bucle en cuanto lo encuentra.
  let primerMenor = null;

  for (const participante of participantes) {
    if (participante.edad < 18) {
      primerMenor = participante.nombre;
      break;
    }
  }

  // Las medias solo se calculan si hay datos: así se evita dividir entre 0 (NaN).
  let mediaEdad = null;
  let mediaExperienciaPresencial = null;

  if (participantes.length > 0) {
    mediaEdad = sumaEdades / participantes.length;
  }

  if (cantidadPresencial > 0) {
    mediaExperienciaPresencial = sumaExperienciaPresencial / cantidadPresencial;
  }

  // Se devuelven números (o null); el formato con dos decimales lo aplica la interfaz.
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

// ---------- Validación de la importación JSON ----------

// Comprueba que el texto es una fecha ISO como la que genera toISOString
// (con o sin milisegundos) y que es una fecha real del calendario.
function esFechaIsoValida(texto) {
  // Debe ser una cadena.
  if (typeof texto !== "string") {
    return false;
  }

  // Formato: AAAA-MM-DDTHH:MM:SS(.mmm)Z
  const formato = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

  if (!formato.test(texto)) {
    return false;
  }

  // Si el navegador no la puede interpretar, el tiempo es NaN.
  const fecha = new Date(texto);

  if (Number.isNaN(fecha.getTime())) {
    return false;
  }

  // Detecta fechas que el navegador "corrige", como 2026-02-31 (pasaría a marzo).
  return fecha.toISOString().slice(0, 10) === texto.slice(0, 10);
}

// Valida una colección importada completa. NO modifica nada: solo devuelve
// { valido, error }. Al primer fallo se detiene, así no hay importaciones parciales.
function validarColeccion(datos) {
  // Lo importado debe ser un array.
  if (!Array.isArray(datos)) {
    return { valido: false, error: "El JSON debe ser un array de participantes." };
  }

  // Ids ya vistos, para detectar repetidos.
  const ids = [];

  for (let i = 0; i < datos.length; i++) {
    const participante = datos[i];
    const posicion = "Elemento " + (i + 1) + ": ";

    // Cada elemento debe ser un objeto (no null, no array).
    if (
      participante === null ||
      typeof participante !== "object" ||
      Array.isArray(participante)
    ) {
      return { valido: false, error: posicion + "debe ser un objeto." };
    }

    // Tipos previstos de cada campo (un número como "25" entre comillas se rechaza).
    if (
      typeof participante.nombre !== "string" ||
      typeof participante.edad !== "number" ||
      typeof participante.tipo !== "string" ||
      typeof participante.modalidad !== "string" ||
      typeof participante.experiencia !== "number"
    ) {
      return { valido: false, error: posicion + "faltan campos o tienen un tipo incorrecto." };
    }

    // Mismas reglas y rangos que el formulario: se reutiliza validarParticipante.
    const resultado = validarParticipante(participante);

    if (!resultado.valido) {
      return { valido: false, error: posicion + resultado.errores.join(" ") };
    }

    // Identificador: entero entre 100000 y 999999.
    if (
      !Number.isInteger(participante.id) ||
      participante.id < 100000 ||
      participante.id > 999999
    ) {
      return { valido: false, error: posicion + "el id debe ser un entero entre 100000 y 999999." };
    }

    // Identificador no repetido.
    if (ids.includes(participante.id)) {
      return { valido: false, error: posicion + "el id está repetido." };
    }

    // Fecha de inscripción en formato ISO válido.
    if (!esFechaIsoValida(participante.fechaInscripcion)) {
      return { valido: false, error: posicion + "la fecha de inscripción no es una fecha ISO válida." };
    }

    ids.push(participante.id);
  }

  // Todos los elementos han superado todas las comprobaciones.
  return { valido: true, error: "" };
}
