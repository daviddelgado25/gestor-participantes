// Script de la página de ayuda: muestra información descriptiva del navegador.

// Lista donde se insertarán los datos (puede no existir si el HTML cambia).
const listaDatos = document.getElementById("datos-navegador");

if (listaDatos !== null) {
  // Información solo descriptiva: no se usa para validar ni decidir nada.
  const datos = [
    ["Idioma del navegador", navigator.language],
    ["Origen de la página", location.origin],
    ["Pantalla", screen.width + " x " + screen.height + " píxeles"]
  ];

  // Cada par genera un <dt> (etiqueta) y un <dd> (valor) con textContent.
  for (const [etiqueta, valor] of datos) {
    const termino = document.createElement("dt");
    termino.textContent = etiqueta;

    const descripcion = document.createElement("dd");
    descripcion.textContent = valor;

    listaDatos.append(termino, descripcion);
  }
}
