---
name: Proyecto PHARMEDIC
description: Interfaz web estática para sistema de farmacia UMG — módulos y estado actual
type: project
---

Sistema de gestión de farmacia multi-sucursal para clase de Análisis de Sistemas (UMG). Es una SPA estática HTML/CSS/JS sin backend.

**Sucursales**: Zona 16 (central), Zona 11, Zona 2

**Módulos actuales**:
- `dashboard.html` — KPIs generales
- `ventas.html` — POS con carrito, presentaciones (pastilla/blíster/caja), delivery, facturación NIT/CF
- `inventario.html` — CRUD productos, alertas stock, lotes; **tabs: Productos, Lotes, Alertas, Movimientos, Transferencias, Regencia**
- `clientes.html` — CRUD clientes, condiciones médicas, **historial de compras y sugerencias por condición**
- `recetas.html` — gestión de recetas
- `delivery.html` — tracking de repartidores
- `proveedores.html` — CRUD proveedores, **tabs: Proveedores, Comparativa, Órdenes de compra, Historial**; control de pagos, cuentas por pagar
- `reportes.html` — gráficas y exportación (DERCAS 5 del usuario)
- `ofertas.html` — gestión de promociones
- `cierre-caja.html` — **arqueo de denominaciones (Q200→Q0.25), apertura de caja con fondo inicial, cierre definitivo**
- `sucursales.html` — estado de sucursales y personal

**Funcionalidades nuevas añadidas (may 2026)**:
1. Transferencia entre sucursales: tab en inventario.html con flujo solicitar → aprobar → en tránsito → completado
2. Ventana de caja mejorada: apertura con fondo inicial, arqueo de denominaciones con detección de diferencias
3. Venta por blíster/caja/pastilla: selector de cantidad muestra total de pastillas y costo por unidad
4. Control de inventario para regencia: tab Regencia con medicamentos controlados, límites MSPAS, libro de despacho
5. Sugerencias de medicamentos por historial: verCliente() muestra últimas compras + sugerencias basadas en condición médica
6. Control sobre límites legales: columna "Dispensados/mes vs Límite/mes" en tab Regencia, con estado visual
7. Control de proveedores profundo: órdenes de compra con tracking, cuentas por pagar, estado de pago, recepción de pedidos

**Why:** Proyecto universitario semestre 7 — usuario lidera DERCAS 5 (Reportes) pero colabora en todos los módulos.
**How to apply:** Mantener estilo visual consistente (CSS vars en style.css). Toda la lógica es JS inline + datos quemados (hardcoded). No hay backend ni base de datos.
