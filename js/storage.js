// storage.js
const STORAGE_KEY = "deudoresDark_v1";

// Variable global para el nombre de la tienda
window.NOMBRE_TIENDA = "Abarrotes Chávez";

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function obtenerFechaLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().split("T")[0];
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function cargarDatosIniciales() {
  const data = {
    clientes: [
      { id: "1", nombre: "María García" },
      { id: "2", nombre: "Juan Pérez" },
    ],
    compras: [
      {
        id: "c1",
        clienteId: "1",
        fecha: "2026-05-01",
        items: [
          { producto: "Arroz 1kg", precio: 28.5 },
          { producto: "Aceite", precio: 45.0 },
        ],
        total: 73.5,
      },
    ],
    abonos: [{ id: "a1", clienteId: "1", fecha: "2026-05-02", monto: 30.0 }],
  };
  guardarDatos(data);
  return data;
}

function cargarDatos() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (
        parsed &&
        Array.isArray(parsed.clientes) &&
        Array.isArray(parsed.compras) &&
        Array.isArray(parsed.abonos)
      ) {
        return parsed;
      }
    } catch (e) {
      // Si hay error, cargar iniciales
    }
  }
  return cargarDatosIniciales();
}

function guardarDatos(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
