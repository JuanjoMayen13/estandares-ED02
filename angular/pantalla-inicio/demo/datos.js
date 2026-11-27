// Estándar pantalla de inicio v1.0.0 — datos de ejemplo de la demo. No son datos reales.
// En una aplicación, esto es lo que entrega cada proyecto en los puntos PROYECTO (README §4.3).
(function () {
  // Ayuda para escribir el árbol: g(id, nombre, hijos) es un grupo; p(id, nombre) es una pantalla.
  const g = (id, nombre, hijos) => ({ id, nombre, hijos });
  const p = (id, nombre, sinAcceso) => ({ id, nombre, hijos: [], sinAcceso: !!sinAcceso });

  const aplicativos = [
    { id: 1, nombre: 'Cuentas por Cobrar' },
    { id: 2, nombre: 'Inventario' },
    { id: 3, nombre: 'Contabilidad' },
    { id: 4, nombre: 'Reportes' },
    { id: 5, nombre: 'Recursos Humanos' },
    { id: 6, nombre: 'Gestión de Turnos' },
  ];

  const arboles = {
    1: [
      g(101, 'Procesos', [p(111, 'Recibos de caja'), p(112, 'Notas de crédito'), p(113, 'Anulación de recibos')]),
      g(102, 'Consultas', [p(114, 'Estado de cuenta'), p(115, 'Antigüedad de saldos')]),
      p(116, 'Clientes'),
    ],
    2: [
      g(201, 'Movimientos', [
        p(211, 'Traslados entre bodegas'),
        p(212, 'Ajustes de inventario'),
        g(203, 'Cierres', [p(213, 'Cierre de inventario'), p(214, 'Historial de cierres')]),
      ]),
      g(202, 'Consultas', [p(215, 'Existencias por bodega'), p(216, 'Kárdex de producto')]),
      p(217, 'Catálogo de productos'),
      p(218, 'Reclasificación de familias', true),
    ],
    3: [
      g(301, 'Procesos', [p(311, 'Partidas de diario'), p(312, 'Cierre contable')]),
      g(302, 'Mantenimientos', [p(313, 'Nomenclatura contable'), p(314, 'Centros de costo')]),
    ],
    4: [
      g(401, 'Ventas', [p(411, 'Ventas del mes'), p(412, 'Ventas por vendedor')]),
      g(402, 'Inventario', [p(413, 'Rotación de inventario'), p(414, 'Conciliación de inventario')]),
      p(415, 'Depósitos bancarios'),
    ],
    5: [p(511, 'Empleados'), p(512, 'Planilla'), p(513, 'Vacaciones')],
    6: [g(601, 'Configuración', [p(611, 'Servicios'), p(612, 'Ventanillas')]), p(613, 'Tablero de colas')],
  };

  const ahora = Date.now();

  window.DATOS = {
    usuario: 'juan.perez',
    empresa: 'Distribuidora Central, S.A.',
    estacion: 'Caja 1 – Zona 10',
    /** Sin logo: el header muestra el ícono genérico. Para probarlo, poner una URL de imagen. */
    logoEmpresa: null,
    /** La sesión empezó hace 4 h 40 min y vence en 3 h 20 min. */
    inicioSesion: ahora - (4 * 60 + 40) * 60_000,
    venceSesion: ahora + (3 * 60 + 20) * 60_000,
    aplicativos,
    arboles,
    /** Accesos guardados de ejemplo (si la demo no tiene otros guardados en este navegador). */
    fijados: [
      { aplicativoId: 1, pantallaId: 111 },
      { aplicativoId: 2, pantallaId: 215 },
      { aplicativoId: 3, pantallaId: 311 },
    ],
    recientes: [
      { aplicativoId: 4, pantallaId: 411 },
      { aplicativoId: 2, pantallaId: 211 },
      { aplicativoId: 1, pantallaId: 114 },
      { aplicativoId: 2, pantallaId: 215 },
    ],
    conexion: {
      conectado: true,
      url: 'https://api.ejemplo.com/erp/',
      versionWeb: '4.18.0',
      versionApi: '2.9.1',
    },
  };
})();
