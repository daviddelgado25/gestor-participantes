const listaDatos = document.getElementById("datos-navegador");

if (listaDatos !== null) {
  // Información solo descriptiva: no se usa para validar ni decidir nada.
  const datos = [
    ["Idioma del navegador", navigator.language],
    ["Origen de la página", location.origin],
    ["Pantalla", screen.width + " x " + screen.height + " píxeles"]
  ];

  for (const [etiqueta, valor] of datos) {
    const termino = document.createElement("dt");
    termino.textContent = etiqueta;

    const descripcion = document.createElement("dd");
    descripcion.textContent = valor;

    listaDatos.append(termino, descripcion);
  }
}