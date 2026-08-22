// ui.js

function actualizarDashboard(data) {
  const totalCredito = data.compras.reduce((s, c) => s + c.total, 0);
  const totalRecuperado = data.abonos.reduce((s, a) => s + a.monto, 0);
  const pendiente = totalCredito - totalRecuperado;
  const clientesConDeuda = data.clientes.filter(
    (c) => saldo(data, c.id) > 0,
  ).length;
  const clientesAlDia = data.clientes.filter(
    (c) => saldo(data, c.id) <= 0,
  ).length;

  document.getElementById("dashboard-kpis").innerHTML = `
        <div class="kpi-card kpi-main">
            <div class="kpi-label"><i class="fa-solid fa-hourglass-half"></i> Por cobrar</div>
            <div class="kpi-value">$${pendiente.toFixed(2)}</div>
            <div class="kpi-meta">${clientesConDeuda} cliente${clientesConDeuda === 1 ? "" : "s"} con saldo pendiente</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label"><i class="fa-solid fa-cart-shopping"></i> Crédito</div>
            <div class="kpi-value">$${totalCredito.toFixed(2)}</div>
            <div class="kpi-meta">${data.compras.length} compra${data.compras.length === 1 ? "" : "s"}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label"><i class="fa-solid fa-circle-check"></i> Recuperado</div>
            <div class="kpi-value">$${totalRecuperado.toFixed(2)}</div>
            <div class="kpi-meta">${clientesAlDia} cliente${clientesAlDia === 1 ? "" : "s"} al día</div>
        </div>
    `;

  const movimientos = [
    ...data.compras.flatMap((c) =>
      c.items.map((item) => ({
        tipo: "compra",
        fecha: c.fecha,
        clienteId: c.clienteId,
        descripcion: item.producto,
        monto: item.precio,
      })),
    ),
    ...data.abonos.map((a) => ({
      tipo: "abono",
      fecha: a.fecha,
      clienteId: a.clienteId,
      descripcion: "Abono recibido",
      monto: a.monto,
    })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 6);

  const actividad = document.getElementById("actividad-reciente");

  if (!movimientos.length) {
    actividad.innerHTML = `
            <div class="empty-state" style="padding:25px 10px;">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <strong>Sin movimientos todavía</strong>
                <span>Las compras y abonos recientes aparecerán aquí.</span>
            </div>`;
    return;
  }

  actividad.innerHTML = movimientos
    .map((m) => {
      const cliente = data.clientes.find((c) => c.id === m.clienteId);
      const nombre = cliente ? escapeHtml(cliente.nombre) : "Cliente eliminado";
      return `
            <div class="activity-item">
                <div class="activity-icon ${m.tipo}">
                    <i class="fa-solid ${m.tipo === "compra" ? "fa-cart-plus" : "fa-hand-holding-dollar"}"></i>
                </div>
                <div class="activity-info">
                    <strong>${nombre}</strong>
                    <span>${escapeHtml(m.descripcion)} · ${escapeHtml(m.fecha)}</span>
                </div>
                <div class="activity-amount ${m.tipo}">
                    ${m.tipo === "abono" ? "-" : ""}$${m.monto.toFixed(2)}
                </div>
            </div>`;
    })
    .join("");
}

function actualizarListaClientes(data, searchTerm, sortAsc) {
  const container = document.getElementById("lista-clientes");
  let clientesFiltrados = data.clientes.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  clientesFiltrados.sort((a, b) => {
    const saldoA = saldo(data, a.id);
    const saldoB = saldo(data, b.id);
    return sortAsc ? saldoA - saldoB : saldoB - saldoA;
  });

  if (clientesFiltrados.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-user-group"></i>
                <strong>${searchTerm ? "No encontramos ese cliente" : "No hay clientes registrados"}</strong>
                <span>${searchTerm ? "Prueba con otro nombre." : "Agrega tu primer cliente con el botón +."}</span>
            </div>`;
    return;
  }

  container.innerHTML = clientesFiltrados
    .map((cliente) => {
      const saldoVal = saldo(data, cliente.id);
      const compras = totalCompras(data, cliente.id);
      const abonos = totalAbonos(data, cliente.id);
      const alDia = saldoVal <= 0;
      const deudaAlta = saldoVal > 500;
      const progress =
        compras > 0 ? Math.min((abonos / compras) * 100, 100) : 0;
      const badgeClass = alDia ? "verde" : deudaAlta ? "naranja" : "rojo";
      const cardClass = alDia
        ? "deuda-verde"
        : deudaAlta
          ? "deuda-naranja"
          : "deuda-roja";
      const barClass = alDia ? "" : deudaAlta ? "naranja" : "roja";
      const ultimaCompra = data.compras
        .filter((c) => c.clienteId === cliente.id)
        .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

      return `
            <div class="cliente-card ${cardClass}" data-id="${cliente.id}">
                <div class="cliente-main" onclick="mostrarDetalleCliente('${cliente.id}')">
                    <div class="cliente-info">
                        <div class="avatar">${escapeHtml(cliente.nombre.charAt(0).toUpperCase())}</div>
                        <div class="cliente-detalles">
                            <div class="cliente-topline">
                                <span class="nombre-cliente">${escapeHtml(cliente.nombre)}</span>
                            </div>
                            <div class="cliente-meta">
                                <span class="badge-deuda ${badgeClass}">
                                    ${alDia ? "Al día" : "Debe: $" + saldoVal.toFixed(2)}
                                </span>
                                ${ultimaCompra ? `<span class="cliente-meta-text">Última compra: ${escapeHtml(ultimaCompra.fecha)}</span>` : ""}
                            </div>
                            <div class="progreso-pago">
                                <div class="barra ${barClass}" style="width:${progress}%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="acciones-cliente">
                    <button class="btn-icono btn-more" type="button"
                        onclick="event.stopPropagation(); abrirMenuCliente(event, '${cliente.id}')"
                        title="Más acciones" aria-label="Más acciones">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                </div>
            </div>`;
    })
    .join("");
}

function actualizarSelects(data) {
  const opts = data.clientes
    .map((c) => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`)
    .join("");
  const selectCompra = document.getElementById("select-cliente-compra");
  const selectAbono = document.getElementById("select-cliente-abono");
  selectCompra.innerHTML =
    '<option value="" disabled selected></option>' + opts;
  selectAbono.innerHTML = '<option value="" disabled selected></option>' + opts;
}

function renderizarProductos() {
  const cont = document.getElementById("productos-container");
  cont.innerHTML = `
        <div class="producto-linea">
            <input type="text" placeholder="Producto" class="input-producto" aria-label="Producto">
            <input type="number" placeholder="0.00" step="0.01" class="input-precio" value="0" aria-label="Precio">
            <button class="btn-icono eliminar-producto" style="display:none;" aria-label="Eliminar producto"><i class="fa-solid fa-xmark"></i></button>
        </div>`;
  const linea = cont.querySelector(".producto-linea");
  linea.querySelector(".input-producto").addEventListener("input", calcTotal);
  linea.querySelector(".input-precio").addEventListener("input", calcTotal);
  actualizarBotonesEliminar();
  calcTotal();
}

function agregarLineaProducto() {
  const cont = document.getElementById("productos-container");
  const div = document.createElement("div");
  div.className = "producto-linea";
  div.innerHTML = `
        <input type="text" placeholder="Producto" class="input-producto" aria-label="Producto">
        <input type="number" placeholder="0.00" step="0.01" class="input-precio" value="0" aria-label="Precio">
        <button class="btn-icono eliminar-producto" aria-label="Eliminar producto"><i class="fa-solid fa-xmark"></i></button>`;
  cont.appendChild(div);
  div.querySelector(".input-producto").addEventListener("input", calcTotal);
  div.querySelector(".input-precio").addEventListener("input", calcTotal);
  div.querySelector(".eliminar-producto").addEventListener("click", () => {
    cont.removeChild(div);
    calcTotal();
    actualizarBotonesEliminar();
  });
  actualizarBotonesEliminar();
  calcTotal();
}

function actualizarBotonesEliminar() {
  const lineas = document.querySelectorAll(
    "#productos-container .producto-linea",
  );
  lineas.forEach((l) => {
    const btn = l.querySelector(".eliminar-producto");
    btn.style.display = lineas.length > 1 ? "flex" : "none";
  });
}

function calcTotal() {
  let total = 0;
  document
    .querySelectorAll("#productos-container .input-precio")
    .forEach((inp) => (total += parseFloat(inp.value) || 0));
  document.getElementById("total-compra").textContent = total.toFixed(2);
}

function mostrarDetalle(data, clienteId) {
  const cliente = data.clientes.find((c) => c.id === clienteId);
  if (!cliente) return;

  const compras = data.compras
    .filter((c) => c.clienteId === clienteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const abonos = data.abonos
    .filter((a) => a.clienteId === clienteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const totalC = totalCompras(data, clienteId);
  const totalA = totalAbonos(data, clienteId);
  const saldoVal = saldo(data, clienteId);
  const progress = totalC > 0 ? Math.min((totalA / totalC) * 100, 100) : 0;

  const movimientos = [
    ...compras.flatMap((c) =>
      c.items.map((item) => ({
        tipo: "compra",
        fecha: c.fecha,
        descripcion: item.producto,
        monto: item.precio,
      })),
    ),
    ...abonos.map((a) => ({
      tipo: "abono",
      fecha: a.fecha,
      descripcion: "Abono recibido",
      monto: a.monto,
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  document.getElementById("detalle-nombre").innerHTML =
    '<i class="fa-solid fa-user"></i> Cuenta';

  let movimientosHtml = movimientos.length
    ? movimientos
        .map(
          (m) => `
            <div class="detail-movement">
                <div class="movement-icon ${m.tipo}">
                    <i class="fa-solid ${m.tipo === "compra" ? "fa-cart-plus" : "fa-hand-holding-dollar"}"></i>
                </div>
                <div class="movement-info">
                    <strong>${escapeHtml(m.descripcion)}</strong>
                    <span>${escapeHtml(m.fecha)} · ${m.tipo === "compra" ? "Compra" : "Abono"}</span>
                </div>
                <div class="movement-amount ${m.tipo}">
                    ${m.tipo === "abono" ? "-" : ""}$${m.monto.toFixed(2)}
                </div>
            </div>`,
        )
        .join("")
    : `<div class="empty-state" style="padding:25px 5px;">
            <i class="fa-solid fa-receipt"></i>
            <strong>Sin movimientos</strong>
            <span>Aún no hay compras ni abonos.</span>
          </div>`;

  document.getElementById("detalle-contenido").innerHTML = `
        <div class="detail-hero">
            <div class="detail-profile">
                <div class="detail-avatar">${escapeHtml(cliente.nombre.charAt(0).toUpperCase())}</div>
                <div>
                    <h3>${escapeHtml(cliente.nombre)}</h3>
                    <span>${saldoVal <= 0 ? "Cuenta al día" : "Cuenta con saldo pendiente"}</span>
                </div>
            </div>
            <div class="detail-balance">
                <div>
                    <small>Saldo pendiente</small>
                    <strong style="color:${saldoVal > 0 ? "#fb7185" : "#34d399"}">$${saldoVal.toFixed(2)}</strong>
                </div>
                <span class="badge-deuda ${saldoVal <= 0 ? "verde" : saldoVal > 500 ? "naranja" : "rojo"}">
                    ${saldoVal <= 0 ? "Liquidado" : "Por cobrar"}
                </span>
            </div>
            <div class="detail-progress"><span style="width:${progress}%;"></span></div>
        </div>

        <div class="detail-kpis">
            <div class="detail-kpi"><small>Compras</small><strong>$${totalC.toFixed(2)}</strong></div>
            <div class="detail-kpi"><small>Abonos</small><strong>$${totalA.toFixed(2)}</strong></div>
            <div class="detail-kpi"><small>Pagado</small><strong>${progress.toFixed(0)}%</strong></div>
        </div>

        <div class="detail-actions">
            <button class="btn-secondary" onclick="cerrarDetalleYRegistrar('nuevo-abono','${clienteId}')">
                <i class="fa-solid fa-hand-holding-dollar"></i> Abonar
            </button>
            <button class="btn-secondary" onclick="cerrarDetalleYRegistrar('nueva-compra','${clienteId}')">
                <i class="fa-solid fa-cart-plus"></i> Comprar
            </button>
        </div>

        <div class="detail-section-title">Historial de movimientos</div>
        <div>${movimientosHtml}</div>
    `;

  document.getElementById("modal-detalle").style.display = "flex";

  const nombreTienda = window.NOMBRE_TIENDA || "Abarrotes Chávez";

  // Asignar evento al botón de imprimir
  document.getElementById("btn-imprimir-comprobante").onclick = () => {
    const ventana = window.open("", "_blank", "width=800,height=600");
    if (!ventana) {
      mostrarToast("Permite las ventanas emergentes para imprimir.", "error");
      return;
    }
    const contenido = generarComprobanteImprimible(nombreTienda, cliente, data);
    ventana.document.write(contenido);
    ventana.document.close();
  };
}

function generarComprobanteImprimible(nombreTienda, cliente, data) {
  const compras = data.compras
    .filter((c) => c.clienteId === cliente.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const abonos = data.abonos
    .filter((a) => a.clienteId === cliente.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const totalC = totalCompras(data, cliente.id);
  const totalA = totalAbonos(data, cliente.id);
  const saldoVal = saldo(data, cliente.id);

  let filasCompras = "";
  compras.forEach((compra) => {
    compra.items.forEach((item) => {
      filasCompras += `
                <tr>
                    <td>${escapeHtml(compra.fecha)}</td>
                    <td>${escapeHtml(item.producto)}</td>
                    <td style="text-align:right;">$${item.precio.toFixed(2)}</td>
                </tr>`;
    });
  });

  let filasAbonos = "";
  abonos.forEach((abono) => {
    filasAbonos += `
            <tr>
                <td>${escapeHtml(abono.fecha)}</td>
                <td style="text-align:right;">$${abono.monto.toFixed(2)}</td>
            </tr>`;
  });

  const estado =
    saldoVal <= 0 ? "✅ LIQUIDADO" : `Pendiente: $${saldoVal.toFixed(2)}`;

  return `
        <html>
        <head>
            <title>Comprobante de cuenta - ${escapeHtml(nombreTienda)}</title>
            <style>
                body { font-family: 'Courier New', monospace; margin: 30px; color: #000; }
                .header { text-align: center; margin-bottom: 25px; }
                .header h2 { margin: 0; font-size: 24px; }
                .header p { margin: 5px 0; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 13px; }
                th { background: #f0f0f0; }
                .totales { margin: 20px 0; font-size: 15px; }
                .totales p { margin: 4px 0; }
                .saldo { font-size: 18px; font-weight: bold; margin-top: 15px; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; }
                button { display: none; }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>${escapeHtml(nombreTienda)}</h2>
                <p>Comprobante de cuenta</p>
                <p>Cliente: ${escapeHtml(cliente.nombre)}</p>
                <p>Fecha: ${obtenerFechaLocal()}</p>
            </div>

            <h3>Compras</h3>
            ${
              compras.length
                ? `
                <table>
                    <thead>
                        <tr><th>Fecha</th><th>Producto</th><th style="text-align:right;">Precio</th></tr>
                    </thead>
                    <tbody>${filasCompras}</tbody>
                </table>
            `
                : "<p>Sin compras registradas</p>"
            }

            <h3>Abonos</h3>
            ${
              abonos.length
                ? `
                <table>
                    <thead>
                        <tr><th>Fecha</th><th style="text-align:right;">Monto</th></tr>
                    </thead>
                    <tbody>${filasAbonos}</tbody>
                </table>
            `
                : "<p>Sin abonos registrados</p>"
            }

            <div class="totales">
                <p><strong>Total compras:</strong> $${totalC.toFixed(2)}</p>
                <p><strong>Total abonos:</strong> $${totalA.toFixed(2)}</p>
            </div>

            <div class="saldo">
                Saldo: $${saldoVal.toFixed(2)} ${estado}
            </div>

            <div class="footer">
                Gracias por su preferencia
            </div>

            <script>
                window.onload = function() { window.print(); };
            <\/script>
        </body>
        </html>
    `;
}
