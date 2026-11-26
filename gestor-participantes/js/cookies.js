// Funciones reutilizables para las cookies de preferencias.
// Usan nombres fijos controlados por nuestro código, Path=/ y valores codificados.

// ---------- Lectura ----------

// Devuelve el valor de la cookie "nombre" o null si no existe o está mal codificada.
function leerCookie(nombre) {
  // Se busca "nombre=" completo al principio de cada parte, no solo una subcadena,
  // para no confundir "tema" con "otro_tema".
  const prefijo = nombre + "=";

  // document.cookie devuelve todas las cookies visibles separadas por ";".
  const partes = document.cookie.split(";");

  for (let i = 0; i < partes.length; i++) {
    // Se quitan los espacios iniciales que deja el separador "; ".
    const parte = partes[i].trim();

    if (parte.startsWith(prefijo)) {
      // decodeURIComponent puede lanzar una excepción si la codificación está rota;
      // en ese caso se devuelve null en lugar de romper el programa.
      try {
        return decodeURIComponent(parte.slice(prefijo.length));
      } catch (error) {
        return null;
      }
    }
  }

  // No se ha encontrado la cookie.
  return null;
}

// ---------- Escritura ----------

// Guarda una cookie durante "dias" días. Cada asignación a document.cookie
// escribe UNA sola cookie; no sustituye a las demás.
function guardarCookie(nombre, valor, dias) {
  // Max-Age se expresa en segundos (30 días = 2592000 s).
  const segundos = Math.floor(dias * 24 * 60 * 60);

  // Path=/ la hace válida en todo el sitio; SameSite=Lax regula su envío entre sitios.
  let atributos = "; Path=/; Max-Age=" + segundos + "; SameSite=Lax";

  // Secure solo con HTTPS (en el servidor local HTTP se omitiría y no se guardaría).
  if (location.protocol === "https:") {
    atributos += "; Secure";
  }

  // encodeURIComponent codifica espacios, tildes y ";" del valor (no es cifrado).
  document.cookie = nombre + "=" + encodeURIComponent(valor) + atributos;
}

// ---------- Borrado ----------

// Elimina una cookie reescribiéndola con Max-Age=0 y el MISMO ámbito con el que se creó.
function borrarCookie(nombre) {
  let atributos = "; Path=/; Max-Age=0; SameSite=Lax";

  if (location.protocol === "https:") {
    atributos += "; Secure";
  }

  document.cookie = nombre + "=" + atributos;
}
