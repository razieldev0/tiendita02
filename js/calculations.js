// calculations.js
function totalCompras(data, clienteId) {
    return data.compras.filter(c => c.clienteId === clienteId).reduce((s, c) => s + c.total, 0);
}

function totalAbonos(data, clienteId) {
    return data.abonos.filter(a => a.clienteId === clienteId).reduce((s, a) => s + a.monto, 0);
}

function saldo(data, clienteId) {
    return totalCompras(data, clienteId) - totalAbonos(data, clienteId);
}