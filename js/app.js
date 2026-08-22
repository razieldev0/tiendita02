// app.js
const nombreTienda = "Abarrotes Chávez";

document.addEventListener("DOMContentLoaded", () => {
  // Estado global de la aplicación
  let data = cargarDatos();
  let searchTerm = "";
  let sortAsc = false;
  let clienteSeleccionadoMenu = null;
  let clientePendienteEliminar = null;

  // Referencias a elementos del DOM
  const modalDetalle = document.getElementById("modal-detalle");
  const modalCliente = document.getElementById("modal-cliente");
  const modalConfirmar = document.getElementById("modal-confirmar");
  const menuContextual = document.getElementById("client-actions-menu");

  // ---------- Utilidades de UI ----------
  function mostrarToast(mensaje, tipo = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = mensaje;
    toast.className = "toast visible";
    if (tipo === "error") toast.classList.add("error");
    setTimeout(() => {
      toast.classList.remove("visible");
    }, 2500);
  }

  // Exponer globalmente las funciones que se usan en onclick inline
  window.mostrarToast = mostrarToast;

  function cambiarPanel(panelId) {
    document
      .querySelectorAll(".panel")
      .forEach((p) => p.classList.remove("active"));
    const panel = document.getElementById("panel-" + panelId);
    if (panel) panel.classList.add("active");

    document
      .querySelectorAll(".nav-item")
      .forEach((n) => n.classList.remove("active"));
    const nav = document.querySelector(`.nav-item[data-panel="${panelId}"]`);
    if (nav) nav.classList.add("active");

    if (panelId === "inicio") actualizarDashboard(data);
    document
      .querySelector(".main-content")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cerrarMenuCliente() {
    menuContextual.classList.remove("visible");
    clienteSeleccionadoMenu = null;
  }

  // ---------- Funciones de negocio ----------
  function guardarCompra() {
    const clienteId = document.getElementById("select-cliente-compra").value;
    const fecha = document.getElementById("fecha-compra").value;
    const items = [];
    document
      .querySelectorAll("#productos-container .producto-linea")
      .forEach((linea) => {
        const prod = linea.querySelector(".input-producto").value.trim();
        const precio =
          parseFloat(linea.querySelector(".input-precio").value) || 0;
        if (prod && precio > 0) items.push({ producto: prod, precio });
      });
    if (!clienteId || !fecha || items.length === 0) {
      mostrarToast("Complete los campos correctamente.", "error");
      return;
    }
    data.compras.push({
      id: generarId(),
      clienteId,
      fecha,
      items,
      total: items.reduce((s, i) => s + i.precio, 0),
    });
    guardarDatos(data);
    actualizarListaClientes(data, searchTerm, sortAsc);
    actualizarDashboard(data);
    actualizarSelects(data);
    document.getElementById("fecha-compra").value = obtenerFechaLocal();
    document.getElementById("select-cliente-compra").value = "";
    renderizarProductos();
    mostrarToast("Compra registrada exitosamente.");
  }

  function guardarAbono() {
    const clienteId = document.getElementById("select-cliente-abono").value;
    const fecha = document.getElementById("fecha-abono").value;
    const monto = parseFloat(document.getElementById("monto-abono").value);
    if (!clienteId || !fecha || !monto || monto <= 0) {
      mostrarToast("Complete los campos correctamente.", "error");
      return;
    }
    data.abonos.push({ id: generarId(), clienteId, fecha, monto });
    guardarDatos(data);
    actualizarListaClientes(data, searchTerm, sortAsc);
    actualizarDashboard(data);
    actualizarSelects(data);
    document.getElementById("fecha-abono").value = obtenerFechaLocal();
    document.getElementById("monto-abono").value = "";
    document.getElementById("select-cliente-abono").value = "";
    mostrarToast("Abono registrado exitosamente.");
  }

  function abrirConfirmacionEliminar(id) {
    const cliente = data.clientes.find((c) => c.id === id);
    if (!cliente) return;
    clientePendienteEliminar = id;
    document.getElementById("confirmar-texto").textContent =
      `¿Seguro que deseas eliminar a ${cliente.nombre}?`;
    modalConfirmar.style.display = "flex";
  }

  function eliminarClienteDefinitivo(id) {
    data.clientes = data.clientes.filter((c) => c.id !== id);
    data.compras = data.compras.filter((c) => c.clienteId !== id);
    data.abonos = data.abonos.filter((a) => a.clienteId !== id);
    guardarDatos(data);
    actualizarListaClientes(data, searchTerm, sortAsc);
    actualizarSelects(data);
    actualizarDashboard(data);
    modalDetalle.style.display = "none";
    modalConfirmar.style.display = "none";
    mostrarToast("Cliente eliminado.");
  }

  function editarCliente(id) {
    const cliente = data.clientes.find((c) => c.id === id);
    if (!cliente) return;
    document.getElementById("modal-cliente-titulo").innerHTML =
      '<i class="fa-solid fa-user-pen"></i> Editar cliente';
    const input = document.getElementById("input-nombre-cliente");
    input.value = cliente.nombre;
    input.dataset.editingId = id;
    modalCliente.style.display = "flex";
    setTimeout(() => input.focus(), 80);
  }

  function abrirMenuCliente(event, id) {
    clienteSeleccionadoMenu = id;
    const rect = event.currentTarget.getBoundingClientRect();
    menuContextual.classList.add("visible");

    const menuWidth = 190;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );
    const top = Math.min(
      rect.bottom + 6,
      window.innerHeight - menuContextual.offsetHeight - 8,
    );

    menuContextual.style.left = left + "px";
    menuContextual.style.top = Math.max(8, top) + "px";
  }

  function cerrarDetalleYRegistrar(panel, clienteId) {
    modalDetalle.style.display = "none";
    cambiarPanel(panel);
    const selectId =
      panel === "nuevo-abono"
        ? "select-cliente-abono"
        : "select-cliente-compra";
    document.getElementById(selectId).value = clienteId;
  }

  // Exponer globalmente las funciones necesarias
  window.abrirMenuCliente = abrirMenuCliente;
  window.cerrarDetalleYRegistrar = cerrarDetalleYRegistrar;
  window.mostrarDetalleCliente = function (id) {
    mostrarDetalle(data, id);
  };

  // ---------- Inicialización ----------
  function init() {
    actualizarListaClientes(data, searchTerm, sortAsc);
    actualizarSelects(data);
    actualizarDashboard(data);
    cambiarPanel("inicio");
    document.getElementById("fecha-compra").value = obtenerFechaLocal();
    document.getElementById("fecha-abono").value = obtenerFechaLocal();
    renderizarProductos();

    // Navegación
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => cambiarPanel(btn.dataset.panel));
    });

    // Buscador
    document.getElementById("buscar-cliente").addEventListener("input", (e) => {
      searchTerm = e.target.value;
      actualizarListaClientes(data, searchTerm, sortAsc);
    });

    // Ordenamiento
    document.getElementById("btn-ordenar").addEventListener("click", () => {
      sortAsc = !sortAsc;
      document.getElementById("btn-ordenar").innerHTML = sortAsc
        ? '<i class="fa-solid fa-arrow-down-wide-short"></i>'
        : '<i class="fa-solid fa-arrow-up-wide-short"></i>';
      actualizarListaClientes(data, searchTerm, sortAsc);
    });

    // Modal nuevo cliente
    document.getElementById("fab-add-client").addEventListener("click", () => {
      document.getElementById("modal-cliente-titulo").innerHTML =
        '<i class="fa-solid fa-user-plus"></i> Nuevo cliente';
      const input = document.getElementById("input-nombre-cliente");
      input.value = "";
      delete input.dataset.editingId;
      modalCliente.style.display = "flex";
      setTimeout(() => input.focus(), 80);
    });

    document
      .getElementById("cancelar-cliente")
      .addEventListener("click", () => {
        modalCliente.style.display = "none";
      });

    document
      .getElementById("input-nombre-cliente")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          document.getElementById("btn-guardar-cliente").click();
      });

    document
      .getElementById("btn-guardar-cliente")
      .addEventListener("click", () => {
        const input = document.getElementById("input-nombre-cliente");
        const nombre = input.value.trim();
        if (!nombre) {
          mostrarToast("Ingrese un nombre.", "error");
          input.focus();
          return;
        }
        const editingId = input.dataset.editingId;
        if (editingId) {
          const cliente = data.clientes.find((c) => c.id === editingId);
          if (cliente) cliente.nombre = nombre;
          mostrarToast("Cliente actualizado.");
        } else {
          data.clientes.push({ id: generarId(), nombre });
          mostrarToast("Cliente agregado exitosamente.");
        }
        guardarDatos(data);
        actualizarListaClientes(data, searchTerm, sortAsc);
        actualizarSelects(data);
        actualizarDashboard(data);
        input.value = "";
        delete input.dataset.editingId;
        modalCliente.style.display = "none";
      });

    // Menú contextual
    document.querySelectorAll("#client-actions-menu button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = clienteSeleccionadoMenu;
        const action = btn.dataset.action;
        cerrarMenuCliente();
        if (!id) return;
        if (action === "detalle") mostrarDetalle(data, id);
        if (action === "editar") editarCliente(id);
        if (action === "eliminar") abrirConfirmacionEliminar(id);
        if (action === "compra") {
          cambiarPanel("nueva-compra");
          document.getElementById("select-cliente-compra").value = id;
        }
        if (action === "abono") {
          cambiarPanel("nuevo-abono");
          document.getElementById("select-cliente-abono").value = id;
        }
      });
    });

    // Confirmación de eliminación
    document
      .getElementById("cancelar-confirmacion")
      .addEventListener("click", () => {
        clientePendienteEliminar = null;
        modalConfirmar.style.display = "none";
      });

    document
      .getElementById("confirmar-eliminacion")
      .addEventListener("click", () => {
        if (clientePendienteEliminar)
          eliminarClienteDefinitivo(clientePendienteEliminar);
        clientePendienteEliminar = null;
      });

    // Cerrar modales
    document.getElementById("cerrar-modal").addEventListener("click", () => {
      modalDetalle.style.display = "none";
    });

    window.addEventListener("click", (e) => {
      if (!menuContextual.contains(e.target) && !e.target.closest(".btn-more"))
        cerrarMenuCliente();
      if (e.target === modalDetalle) modalDetalle.style.display = "none";
      if (e.target === modalCliente) modalCliente.style.display = "none";
      if (e.target === modalConfirmar) modalConfirmar.style.display = "none";
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        modalDetalle.style.display = "none";
        modalCliente.style.display = "none";
        modalConfirmar.style.display = "none";
        cerrarMenuCliente();
      }
    });

    // Acciones rápidas del dashboard
    document.querySelectorAll("[data-quick-panel]").forEach((btn) => {
      btn.addEventListener("click", () => cambiarPanel(btn.dataset.quickPanel));
    });

    // Productos
    document
      .getElementById("btn-agregar-producto")
      .addEventListener("click", agregarLineaProducto);
    document
      .getElementById("btn-guardar-compra")
      .addEventListener("click", guardarCompra);
    document
      .getElementById("btn-guardar-abono")
      .addEventListener("click", guardarAbono);
  }

  init();
});
