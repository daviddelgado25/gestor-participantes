# **Gestor de participantes de un evento**

Práctica de la Unidad Didáctica 1 de **Desarrollo Web en Entorno Cliente (DWEC)**, curso 2026-2027. Aplicación que se ejecuta íntegramente en el navegador (HTML, CSS y JavaScript, sin frameworks ni servidor propio) para gestionar las inscripciones de un evento tecnológico.

* **Autor:** David Delgado Alonso

---

## **1\. Cómo ejecutar la aplicación**

La aplicación **no funciona abriendo el HTML como `file://`**: hay que servirla por HTTP.

1. Abre la carpeta del proyecto en Visual Studio Code.  
2. Instala la extensión **Live Server** (si no la tienes).  
3. Clic derecho sobre `index.html` → **Open with Live Server**.  
4. Se abrirá una dirección del tipo `http://127.0.0.1:5500/index.html`.

Alternativa sin extensiones (con Python instalado):

python \-m http.server 5500

y abrir `http://localhost:5500/index.html`.

**Importante:** usa siempre el mismo host y puerto durante las pruebas. `localhost` y `127.0.0.1` son orígenes distintos: si mezclas, `postMessage` rechazará los mensajes y las cookies parecerán «perdidas».

---

## **2\. Estructura del proyecto**

gestor-participantes/  
├── index.html          Página principal (preferencias, alta, estadísticas, listado, JSON, iframe, ayuda)  
├── panel.html          Panel del evento, incrustado en un iframe  
├── ayuda.html          Ayuda, abierta con window.open  
├── css/  
│   └── styles.css      Estilos, tema claro/oscuro (.oscuro) y tamaño de letra (.grande)  
├── js/  
│   ├── validacion.js   Lógica de datos sin DOM: validar, generar id, estadísticas, validar colección  
│   ├── cookies.js      leerCookie, guardarCookie, borrarCookie  
│   ├── app.js          Interfaz de la página principal: eventos, DOM, JSON, postMessage, ventana  
│   ├── panel.js        Receptor de mensajes y DOM propio del panel  
│   └── ayuda.js        Datos del navegador mostrados en la ayuda  
└── README.md

**Separación de responsabilidades**

* `validacion.js` **no lee ni modifica el DOM**: recibe datos por parámetros y devuelve resultados. Así se puede probar de forma aislada.  
* `app.js` es el único que conecta esos resultados con la interfaz.  
* Orden de carga en `index.html` (todos con `defer`): `validacion.js` → `cookies.js` → `app.js`. `app.js` usa funciones de los otros dos, por eso van antes.

---

## **3\. Funcionalidades: cómo están hechas**

### **3.1 Datos en memoria y participantes de ejemplo**

* **Archivo:** `js/app.js` (constante `participantes`).  
* Al arrancar se cargan 3 participantes de ejemplo con edades (17, 31, 22), tipos (estudiante, profesional, invitado) y modalidades distintas.  
* Los datos no se conservan al recargar; las preferencias sí (cookies).

### **3.2 Alta de participantes**

* **Archivos y funciones:** `app.js` (manejador `submit` de `#form-alta`), `validacion.js` (`validarParticipante`, `generarId`).  
* `preventDefault` evita el envío del formulario. El formulario tiene `novalidate`: toda la validación se hace en JavaScript.  
* `validarParticipante(datos)` recibe los textos del formulario y devuelve `{ valido, errores, participante }`:  
  * **Nombre:** `trim()` y longitud de 2 a 60\.  
  * **Edad:** se comprueba que no sea cadena vacía **antes** de `Number(...)`, y después `Number.isFinite`, `Number.isInteger` y rango 0–120. `"18abc"` da `NaN` y se rechaza; `0` es válido.  
  * **Tipo:** solo `estudiante`, `profesional` o `invitado` (comparación estricta).  
  * **Modalidad:** solo `presencial` u `online`.  
  * **Experiencia:** no vacía, finita, de 0 a 10; admite decimales.  
* Si hay errores: se muestran en el resumen `#resumen-errores`, **se conservan los valores escritos** (no se llama a `reset()`) y no se añade nada.  
* Si es correcto: `generarId` crea el id, se añade el participante con `new Date().toISOString()`, se hace `reset()` del formulario y se llama a `actualizarLista` y `actualizarEstadisticas` y `enviarResumenPanel`.  
* `generarId(participantes)`: `Math.floor(Math.random() * 900000) + 100000` (entero de 100000 a 999999\) dentro de un `while` con **máximo de 100 intentos** y comprobación de duplicados con `for...of` y `break`. Si no consigue un id devuelve `null` y la interfaz muestra un error; nunca bloquea la pestaña.

### **3.3 Clasificación**

* **Edad:** menor de edad si `edad < 18` (se usa un **ternario** en `crearTarjeta`).  
* **Experiencia:** `clasificarExperiencia` en `validacion.js` con `if / else if / else`: inicial (0 a \<4), intermedia (4 a \<7), avanzada (7 a 10).

### **3.4 Listado en tarjetas**

* **Archivo y función:** `app.js`, `crearTarjeta(participante)`.  
* Se construye con `createElement`, `textContent`, `append`, `classList` y `setAttribute`. **No se usa `innerHTML`** en ningún sitio.  
* Cada tarjeta muestra id, nombre, edad con su clasificación, tipo, modalidad, experiencia con su clasificación y fecha y hora en formato español (`toLocaleString("es-ES")`).  
* Estados representados con clases y atributos: `menor`/`mayor`, `presencial`/`online`, `data-id`, `data-modalidad`.  
* Como los nombres se asignan con `textContent`, un nombre como `<b>Ana</b>` se ve literalmente, sin negrita.

### **3.5 Bajas**

* **Archivo:** `app.js`, manejador del botón «Borrar» creado dentro de `crearTarjeta`.  
* `confirm(...)` antes de borrar. Si se cancela, `return` y no cambia nada.  
* Si se acepta: `findIndex` localiza el participante por id, `splice` lo elimina de la colección, `tarjeta.remove()` quita solo su tarjeta del DOM, y se actualizan mensaje del listado, estadísticas y panel. Las demás tarjetas no se tocan.

### **3.6 Búsqueda y filtro**

* **Archivo y función:** `app.js`, `actualizarLista`.  
* Búsqueda por nombre con `trim().toLowerCase()` y `includes` (sin distinguir mayúsculas), y filtro por modalidad. Se combinan: un participante solo se muestra si cumple ambas condiciones; si no, `continue`.  
* `actualizarMensajeLista` cuenta las tarjetas con `querySelectorAll("#lista .tarjeta")` e informa: «No hay participantes», «No hay coincidencias…» o «N de M participante(s) mostrado(s)».

### **3.7 Estadísticas**

* **Archivos y funciones:** `validacion.js` → `calcularEstadisticas`; `app.js` → `actualizarEstadisticas`.  
* Se calculan siempre sobre la **colección completa**, aunque el listado esté filtrado. Se recalculan tras cada alta, baja, importación o vaciado.  
* Se usan **bucles, contadores y acumuladores, sin `reduce`**:  
  * Recorrido principal: total, menores/mayores, suma de edades, mínima, máxima, contadores por modalidad y por tipo (este último con un **`switch`**).  
  * Recorrido de experiencia presencial: **`continue`** para omitir los `online`.  
  * Recorrido del primer menor: **`break`** en cuanto lo encuentra.  
* Si no hay datos, las medias y extremos valen `null` y la interfaz muestra «Sin datos» (nunca `NaN`, `Infinity` ni valores inventados). Las medias se muestran con `toFixed(2)`, pero los cálculos conservan números.  
* Botón «Buscar primer menor de edad»: muestra su nombre o «No hay ningún menor de edad».

### **3.8 Exportar e importar JSON**

* **Archivos y funciones:** `app.js` (botones `#btn-exportar`, `#btn-importar`, `#btn-vaciar`), `validacion.js` (`validarColeccion`, `esFechaIsoValida`).  
* **Exportar:** `JSON.stringify(participantes, null, 2)` en el área de texto.  
* **Importar:**  
  1. `JSON.parse` dentro de `try/catch`. Si falla, mensaje comprensible y no cambia nada.  
  2. `validarColeccion` comprueba: que sea un array; que cada elemento sea un objeto; **tipos** (`nombre`, `tipo`, `modalidad` string; `edad`, `experiencia` number); las **mismas reglas** que el formulario (reutiliza `validarParticipante`); id entero de 100000 a 999999 y **no repetido**; y fecha ISO válida (`esFechaIsoValida`, que además detecta fechas como 31 de febrero).  
  3. Si hay **cualquier** error se conserva íntegra la colección anterior (no hay importaciones parciales). El mensaje indica qué elemento falla.  
  4. Si todo es válido, se sustituye la colección, incluido el array vacío `[]`, y se actualizan tarjetas, estadísticas y panel.  
* «Vaciar lista» deja la colección en `[]` (útil para probar el estado vacío).

### **3.9 Panel del evento (iframe) con `postMessage`**

* **Archivos y funciones:** `index.html` (iframe con `title`), `app.js` (`enviarResumenPanel` y receptor `message`), `panel.html`, `panel.js` (receptor y `mostrarResumen`).  
* Protocolo de arranque (evita perder el primer mensaje):  
  * `app.js` instala su receptor de `message`.  
  * Después asigna `panelEvento.src = "panel.html"` (el iframe no lleva `src` en el HTML).  
  * `panel.js` instala su receptor y **después** envía `{ tipo: "preparado" }` a la principal.  
  * La principal responde con el resumen inicial, y lo reenvía en cada alta, baja, importación o vaciado.  
* Mensaje enviado: `{ tipo: "resumen", total, presencial, online, ultimoNombre, ultimaFecha }`.  
* **Seguridad:**  
  * `targetOrigin` concreto: `location.origin`. Nunca `"*"`.  
  * En ambos receptores se comprueba `event.origin`, `event.source` (`panelEvento.contentWindow` en la principal, `window.parent` en el panel) y la estructura, tipos y valores de `data` (`Number.isInteger`, `typeof`, no negativos, `presencial + online === total`, fecha válida si hay inscritos).  
  * Lo inválido se ignora con `return`, sin tocar la interfaz ni lanzar errores.  
* La principal **no accede al DOM del panel**: el panel construye y actualiza su propio DOM con `createElement`. Sin participantes muestra «Sin inscripciones».

### **3.10 Preferencias con cookies**

* **Archivos y funciones:** `cookies.js` (`leerCookie`, `guardarCookie`, `borrarCookie`), `app.js` (`aplicarPreferencias` y manejadores de `#form-preferencias` y `#btn-restablecer`).  
* Dos cookies independientes: `dwec_tema` (`claro`/`oscuro`) y `dwec_tamano` (`normal`/`grande`).  
* `guardarCookie(nombre, valor, dias)`: `encodeURIComponent` del valor, `Path=/`, `SameSite=Lax`, `Max-Age` en segundos (30 días \= 2 592 000\) y `Secure` solo si `location.protocol === "https:"`.  
* `leerCookie(nombre)`: divide `document.cookie` por `;`, busca `nombre=` al principio de cada parte y usa `decodeURIComponent` dentro de `try/catch` (devuelve `null` si no existe o está mal codificada).  
* `borrarCookie(nombre)`: reescribe con `Max-Age=0` y el mismo `Path` y `SameSite`.  
* Al cargar se leen y **se validan contra una lista cerrada**: cualquier valor desconocido o ausente da tema claro y tamaño normal.  
* «Guardar» aplica las preferencias (clases `oscuro` y `grande` en `body` con `classList.toggle`), guarda y **comprueba por lectura** si se guardó. Si las cookies están bloqueadas, la preferencia se aplica igualmente durante la visita y se avisa de que no se pudo confirmar.  
* «Restablecer» borra las dos cookies, aplica los valores predeterminados y verifica por lectura que han desaparecido.

### **3.11 Ayuda con `window.open`**

* **Archivos y funciones:** `app.js` (botones `#btn-abrir-ayuda` y `#btn-cerrar-ayuda`), `ayuda.html`, `ayuda.js`.  
* Se guarda la referencia en `ventanaAyuda`. Si sigue abierta (`!ventanaAyuda.closed`) se reutiliza con `focus()`; si no, se abre con `window.open("ayuda.html", "ayudaEvento")`.  
* Si el resultado es `null` se muestra un aviso de bloqueo. El botón «Cerrar ayuda» llama a `close()` solo si la ventana existe y no está cerrada.  
* `ayuda.html` explica el uso y `ayuda.js` muestra `navigator.language`, `location.origin` y `screen.width x screen.height`, construidos con `createElement`. Es información **solo descriptiva**: no se usa para validar ni para decisiones de seguridad.

---

## **4\. Casos de prueba reproducibles**

Antes de empezar: servir por HTTP, abrir DevTools (F12) y vigilar la pestaña **Console** (no debe haber errores en rojo).

### **4.1 Alta de participantes**

| \# | Pasos y datos | Resultado esperado |
| ----- | ----- | ----- |
| A1 | Nombre `Marta Gil`, edad `25`, tipo `profesional`, modalidad `online`, experiencia `7` → Inscribir | Mensaje «Participante añadido», aparece una tarjeta (mayor de edad, experiencia avanzada), formulario vacío, total 4 |
| A2 | Edad `0`, resto válido | Se admite; tarjeta «Menor de edad» |
| A3 | Experiencia `3.5` | Se admite; clasificación «Inicial» |
| A4 | Nombre vacío / `A` / solo espacios | Error de nombre; no se añade; se conservan los demás valores |
| A5 | Edad vacía | Error de edad (no se interpreta como 0\) |
| A6 | Edad `18abc` | Error de edad |
| A7 | Edad `-1`, `121`, `17.5` | Error de edad en los tres casos |
| A8 | Tipo o modalidad sin elegir | Error de tipo o modalidad |
| A9 | Experiencia `10.1`, `-1`, `abc` o vacía | Error de experiencia |
| A10 | Varios campos inválidos a la vez | Todos los errores en el resumen; nada se añade; los valores siguen en el formulario |
| A11 | Nombre `<b>Ana</b>` | La tarjeta muestra el texto literal, sin negrita |
| A12 | Con DevTools: Elements → cambia el `value` de una opción de modalidad a `hibrida` y envía | Error de modalidad (la validación no depende del HTML) |

### **4.2 Tarjetas, bajas, búsqueda y filtro**

| \# | Pasos | Resultado esperado |
| ----- | ----- | ----- |
| L1 | Cargar la página | 3 tarjetas con id, datos, clasificaciones y fecha en formato español (por ejemplo `8/10/2026, 10:30:00`) |
| L2 | Pulsar «Borrar» en una tarjeta y **cancelar** el diálogo | No cambia nada |
| L3 | Pulsar «Borrar» y **aceptar** | Desaparece solo esa tarjeta; total y estadísticas bajan; el panel se actualiza |
| L4 | Buscar `ana` y luego `ANA` | Mismo resultado: Ana García |
| L5 | Buscar `zzz` | Mensaje «No hay coincidencias…» |
| L6 | Filtro `online` \+ búsqueda `carlos` | Solo Carlos Ruiz |
| L7 | Filtro `presencial` \+ búsqueda `carlos` | Sin coincidencias |
| L8 | Con filtro activo, dar de alta un participante | Las estadísticas siguen contando la colección completa |
| L9 | Borrar todos (o «Vaciar lista») | Mensaje «No hay participantes.» |

### **4.3 Estadísticas**

Con los 3 participantes de ejemplo:

| Dato | Valor esperado |
| ----- | ----- |
| Total / menores / mayores | 3 / 1 / 2 |
| Edad media / mínima / máxima | 23.33 / 17 / 31 |
| Presencial / Online | 2 / 1 |
| Estudiantes / Profesionales / Invitados | 1 / 1 / 1 |
| Experiencia media presencial | 3.25 (media de 4 y 2.5) |
| Primer menor | Ana García |

| \# | Pasos | Resultado esperado |
| ----- | ----- | ----- |
| E1 | Pulsar «Buscar primer menor de edad» | `Primer menor de edad: Ana García` |
| E2 | Borrar a Ana y pulsar de nuevo | «No hay ningún menor de edad.» |
| E3 | Lista vacía | Medias, mínima y máxima en «Sin datos»; ni `NaN` ni `Infinity` |
| E4 | Solo participantes online | «Experiencia media presencial: Sin datos» |

### **4.4 JSON**

| \# | Pasos | Resultado esperado |
| ----- | ----- | ----- |
| J1 | Pulsar «Exportar» | El área muestra el array con los participantes actuales |
| J2 | Modificar un nombre en el área y pulsar «Importar» | Importación correcta; tarjetas, estadísticas y panel reflejan el cambio |
| J3 | Escribir `[]` e importar | Válido: lista vacía, estadísticas en «Sin datos», panel «Sin inscripciones» |
| J4 | Escribir `{"a":` e importar | «El JSON no está bien formado»; la colección anterior no cambia |
| J5 | Escribir `{}` | Error: debe ser un array; no cambia nada |
| J6 | Exportar y cambiar una edad a `"25"` (texto) | Error de tipos; no cambia nada |
| J7 | Exportar y cambiar una edad a `130` | Error de rango indicando el elemento |
| J8 | Exportar y duplicar un id | Error «id repetido» |
| J9 | Cambiar un id a `99` | Error de id |
| J10 | Cambiar una fecha a `2026` o `2026-02-31T00:00:00.000Z` | Error de fecha ISO |
| J11 | Colección con 2 elementos válidos y 1 inválido | No se importa ninguno (sin importación parcial) |

### **4.5 Panel e iframe (`postMessage`)**

| \# | Pasos | Resultado esperado |
| ----- | ----- | ----- |
| P1 | Cargar la página | El panel muestra total 3, presenciales 2, online 1 y última inscripción de Lucía Martín (10/10/2026) |
| P2 | Dar de alta a alguien | El panel se actualiza solo y la última inscripción es el nuevo |
| P3 | Importar `[]` | El panel muestra «Sin inscripciones» |
| P4 | En la consola, seleccionar el contexto del iframe (desplegable «top») y ejecutar `window.postMessage({tipo:"resumen",total:99,presencial:99,online:0,ultimoNombre:"X",ultimaFecha:"2026-10-10T10:00:00.000Z"}, location.origin)` | **Ignorado**: el `source` no es la ventana padre. El panel no cambia y no hay errores |
| P5 | Contexto top: `document.getElementById("panel").contentWindow.postMessage({tipo:"resumen",total:"x"}, location.origin)` | **Ignorado** por estructura inválida |
| P6 | Contexto top: `document.getElementById("panel").contentWindow.postMessage({tipo:"resumen",total:5,presencial:1,online:1,ultimoNombre:"X",ultimaFecha:"2026-10-10T10:00:00.000Z"}, location.origin)` | **Ignorado**: `presencial + online` no es `total` |
| P7 | Contexto top: `window.postMessage({tipo:"preparado"}, location.origin)` | **Ignorado** por la principal: el `source` no es el panel |
| P8 | Abrir la página con `localhost` y con `127.0.0.1` en pestañas distintas | Cada una funciona por separado; no se mezclan |

### **4.6 Cookies**

| \# | Pasos | Resultado esperado |
| ----- | ----- | ----- |
| C1 | Primera visita (sin cookies; Application → Cookies vacío) | Tema claro y tamaño normal |
| C2 | Elegir oscuro y grande → Guardar | Cambia el aspecto; «Preferencias aplicadas y guardadas»; en Application → Cookies aparecen `dwec_tema=oscuro` y `dwec_tamano=grande`, `Path=/`, `SameSite=Lax`, caducidad en unos 30 días |
| C3 | Recargar | Se recuperan oscuro y grande |
| C4 | Pulsar «Restablecer» | Vuelve a claro y normal; desaparecen **ambas** cookies |
| C5 | Con preferencias guardadas, editar `dwec_tema` a `rosa` en Application → Cookies y recargar | Se usa tema claro (valor inválido ignorado); el tamaño guardado se mantiene |
| C6 | Editar `dwec_tema` a `%E0%A4%A` (codificación rota) y recargar | `leerCookie` devuelve `null`; tema claro; sin errores |
| C7 | Bloquear las cookies del sitio, elegir oscuro y guardar | Se aplica el aspecto y el mensaje avisa de que no se pudo confirmar el guardado |

### **4.7 Ayuda**

| \# | Pasos | Resultado esperado |
| ----- | ----- | ----- |
| H1 | «Abrir ayuda» | Se abre `ayuda.html` con instrucciones, idioma, origen y tamaño de pantalla |
| H2 | «Abrir ayuda» con la ayuda ya abierta | No se crea otra: se enfoca la existente («La ayuda ya estaba abierta») |
| H3 | «Cerrar ayuda» | Se cierra; pulsar de nuevo → «No hay ninguna ayuda abierta» |
| H4 | Cerrar la ventana a mano y pulsar «Abrir ayuda» | Se vuelve a abrir (se comprueba `closed`) |
| H5 | Bloquear ventanas emergentes del sitio y pulsar «Abrir ayuda» | Aviso de bloqueo, sin errores |

---

## **5\. Relación de contenidos aplicados por sesión**

**Sesión 1: arquitectura web, navegador y JavaScript**

* Cliente-servidor: el servidor HTTP local solo entrega archivos estáticos; toda la lógica se ejecuta en el cliente.  
* HTML, CSS y JS en archivos separados; scripts externos con `defer`.  
* DevTools: Console, Elements, Sources (punto de interrupción) y Network.  
* Entrada del usuario no fiable: se valida en JavaScript aunque el HTML tenga restricciones.

**Sesión 2: primeros programas**

* `const` por defecto y `let` solo con reasignación; sin `var`.  
* Tipos primitivos, `typeof`, operadores aritméticos, relacionales y lógicos, plantillas y concatenación.  
* `console.log` y depuración básica.

**Sesión 3: tipos, ámbito, conversiones y decisiones**

* Conversión explícita con `Number` tras comprobar la cadena vacía. Igualdad estricta `===` y `!==`.  
* `if / else if / else` (`clasificarExperiencia`), ternario (`esMenor ? ...`, `mostrarEstado`) y `switch` (conteo por tipo en `calcularEstadisticas`).  
* `??` en `validarParticipante`. Truthy/falsy y ámbitos: ver apartado 6\.

**Sesión 4: bucles**

* `for` clásico (`leerCookie`, `validarColeccion`), `for...of` (estadísticas, listado, importación) y `while` con límite de intentos (`generarId`).  
* Contadores y acumuladores en `calcularEstadisticas`. `break` (primer menor, búsqueda de id repetido) y `continue` (experiencia presencial, filtro del listado).

**Sesión 5: objetos predefinidos y del navegador**

* `String`: `trim`, `toLowerCase`, `includes`, `slice`, `startsWith`. `Number`: `isFinite`, `isInteger`, `toFixed`. `Math`: `random` y `floor`. `Date`: `toISOString`, `toLocaleString`, comparación de fechas. `JSON`: `stringify` y `parse`.  
* `navigator.language`, `location.origin`/`protocol`, `screen.width`/`height`. `confirm` para las bajas.  
* `window`, `document` y DOM; `textContent` para mostrar datos del usuario.

**Sesión 6: DOM**

* `getElementById`, `querySelector`, `querySelectorAll` (recuento de tarjetas).  
* `createElement`, `append`, `remove`, `classList` (`add`, `toggle`, `remove`), `setAttribute`.  
* `addEventListener`, `preventDefault`. Sin `innerHTML`.

**Sesión 7: ventanas, contextos y cookies**

* `window.open`, `closed`, `close`, referencia reutilizada.  
* `iframe` con `title`; `postMessage` con `targetOrigin` concreto y comprobación de `origin`, `source` y `data`; aviso de «preparado».  
* Cookies: `document.cookie`, `Path`, `Max-Age`, `SameSite`, `Secure`, codificación y borrado con `Max-Age=0`.

---

## **6\. Conceptos explicados con ejemplos del proyecto**

### **6.1 Carga del script y arquitectura cliente-servidor**

El navegador (cliente) pide `index.html` por HTTP al servidor local, que solo responde con archivos. Al analizar el HTML encuentra `styles.css` y los tres scripts y los solicita también. Los scripts llevan **`defer`**: se descargan en paralelo, se ejecutan **después** de analizar todo el HTML (así existen los elementos que busca `getElementById`) y **mantienen el orden** del HTML (por eso `validacion.js` y `cookies.js` van antes que `app.js`). Un script clásico sin `defer` detendría el análisis del HTML, y con `async` no hay orden garantizado. En esta práctica no hay lógica de servidor: el servidor no valida nada, por lo que la validación en el cliente **no es una medida de seguridad**, solo mejora la experiencia (en una aplicación real el servidor debería volver a validar).

### **6.2 Ámbitos y hoisting**

* **Ámbito global del script:** `participantes`, `formulario`, `ventanaAyuda`, etc. (declaradas con `const`/`let` al inicio de `app.js`).  
* **Ámbito de función:** las variables dentro de `crearTarjeta` o `calcularEstadisticas` no existen fuera.  
* **Ámbito de bloque:** `let` y `const` en bucles y `if`. Ejemplo: en el manejador de importar, `let datos;` se declara **antes** del `try` para poder usarla después; si se declarase dentro del `try`, no existiría fuera.  
* **Hoisting:** las funciones declaradas con `function` se registran antes de ejecutar el ámbito. Por eso el manejador de borrado (definido dentro de `crearTarjeta`) puede llamar a `actualizarEstadisticas` y `enviarResumenPanel`, que están declaradas más abajo. En cambio, `const` y `let` tienen **zona temporal muerta**: acceder a una antes de su línea de declaración da `ReferenceError`. Por eso las constantes de elementos están al principio de `app.js`. No se usa `var`.

### **6.3 Truthy y falsy**

Son falsy `false`, `0`, `""`, `null`, `undefined` y `NaN`; todo lo demás es truthy (incluso `"0"`, `[]` y `{}`). En el proyecto se evita depender de ello cuando el valor `0` o la cadena vacía son significativos: **la edad 0 es válida pero falsy**, así que no se escribe `if (!edad)` y se compara de forma explícita (`edadTexto === ""`, `edad < 0`...). Además `Number("")` vale `0`, por eso se comprueba la cadena vacía antes de convertir. Sí se usa de forma segura con booleanos reales, como `if (!seguro)` con el resultado de `confirm`.

### **6.4 Diferencia entre `||` y `??`**

`||` devuelve el segundo operando cuando el primero es **falsy** (incluye `0`, `""`, `false`). `??` solo lo hace cuando es **`null` o `undefined`**. En `validarParticipante` se usa `String(datos.edad ?? "")`: si la edad llega como el número `0` (por ejemplo desde un JSON importado), `0 ?? ""` conserva el `0` y se valida como edad correcta; con `||` se convertiría en `""` y se rechazaría una edad válida.

### **6.5 Restricciones entre orígenes**

Un **origen** es esquema \+ host \+ puerto. La política de mismo origen impide que un documento lea el DOM de otro de distinto origen, y CORS regula peticiones de red, no el acceso entre documentos. En esta práctica la principal, el panel y la ayuda comparten origen (mismo host y puerto), por lo que `postMessage` usa `location.origin` como `targetOrigin` y ambos receptores rechazan cualquier mensaje con otro `origin`. `localhost` y `127.0.0.1` son orígenes distintos, y `file://` tiene particularidades de origen que lo hacen inadecuado. Las cookies no se aíslan por puerto, a diferencia del origen.

---

## **7\. Evidencias de depuración**

### **7.1 Punto de interrupción (Sources)**

Sugerencia: abre DevTools → Sources → `js/app.js` y coloca un punto de interrupción en la línea `const resultado = validarParticipante(datos);` del manejador de alta. Rellena el formulario con edad `18abc` y pulsa «Inscribir».

Explicación a escribir: en el panel Scope se ve que `datos.edad` es la cadena `"18abc"`; al avanzar con *Step into* se comprueba que `Number("18abc")` es `NaN` y que la función devuelve `valido: false` con el error de edad.

### **7.2 Petición en Network**

Sugerencia: pestaña Network, recarga con la caché desactivada y localiza `panel.html` (petición del iframe, `Type: document`). Pulsa «Abrir ayuda» y localiza `ayuda.html`.

Explicación a escribir: método `GET`, código `200`, `Content-Type: text/html`; se ve que el panel se solicita **después** de que `app.js` asigne el `src`, y que el servidor solo entrega archivos estáticos (no hay peticiones de datos: la lógica y los datos viven en el navegador).

---

## **8\. Uso de la inteligencia artificial**

* **Enlace al chat utilizado:** https\://claude.ai/share/960972e4-94a4-49d5-9f92-5b09fa688181

### **Análisis de decisiones con ayuda de la IA**

Por cada consulta relevante indica: qué problema concreto querías resolver, qué habías intentado, qué te propuso la IA y qué **aceptaste, cambiaste o descartaste y por qué**, y qué pruebas hiciste para comprobarlo.Cambios del código que conviene analizar aquí, porque se revisaron con ayuda externa: separación de la validación de la colección en `validacion.js`; los tres recorridos de `calcularEstadisticas`; el `try/catch` limitado a `JSON.parse`; la validación estricta de tipos y fecha ISO en la importación; la asignación tardía del `src` del iframe; y el uso de `??` frente a `||`.

