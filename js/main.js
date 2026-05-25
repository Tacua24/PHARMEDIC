/* ==========================================
   PHARMEDIC — Control de sesión y roles
   ========================================== */

const ROLES = {
  admin: {
    label:  'Administrador',
    color:  '#0D7A57',
    home:   'dashboard.html',
    access: null,           // null = acceso a todo
  },
  cajero: {
    label:  'Cajero',
    color:  '#2563EB',
    home:   'ventas.html',
    // Cajero recibe llamadas y decide si es local o delivery, puede asignar repartidor
    access: ['dashboard.html', 'ventas.html', 'clientes.html', 'cierre-caja.html', 'delivery.html'],
  },
  inventario: {
    label:  'Bodeguero',
    color:  '#D97706',
    home:   'inventario.html',
    access: ['dashboard.html', 'inventario.html', 'proveedores.html'],
  },
  repartidor: {
    label:  'Repartidor',
    color:  '#EA580C',
    home:   'repartidor.html',
    // App propia del repartidor — no usa el panel admin
    access: ['repartidor.html'],
  },
  regencia: {
    label:  'Regencia',
    color:  '#7C3AED',
    home:   'recetas.html',
    // Regencia ve recetas e inventario para decidir qué productos son controlados
    access: ['dashboard.html', 'recetas.html', 'inventario.html', 'reportes.html'],
  },
  proveedor: {
    label:  'Proveedor',
    color:  '#059669',
    home:   'proveedores.html',
    access: ['proveedores.html'],
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const page   = window.location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html') return;   // login no necesita lógica de rol

  const role    = sessionStorage.getItem('ph_role')    || 'admin';
  const nombre  = sessionStorage.getItem('ph_nombre')  || 'Administrador';
  const sucursal = sessionStorage.getItem('ph_sucursal') || 'Zona 16';
  const config  = ROLES[role] || ROLES.admin;

  // ── 1. Control de acceso: redirige si la página no está permitida ──
  if (config.access !== null && !config.access.includes(page)) {
    window.location.href = config.home;
    return;
  }

  // ── 2. Marcar ítem activo en la barra lateral ──
  document.querySelectorAll('.nav-item[href]').forEach(el => {
    if (el.getAttribute('href') === page) el.classList.add('active');
  });

  // ── 3. Ocultar ítems de nav no permitidos ──
  if (config.access !== null) {
    document.querySelectorAll('.nav-item[href]').forEach(el => {
      if (!config.access.includes(el.getAttribute('href'))) {
        el.style.display = 'none';
      }
    });

    // Ocultar secciones de sidebar que queden vacías
    document.querySelectorAll('.sidebar-section').forEach(section => {
      const visible = section.querySelectorAll('.nav-item[href]');
      const allHidden = [...visible].every(el => el.style.display === 'none');
      if (allHidden) section.style.display = 'none';
    });
  }

  // ── 4. Actualizar info de usuario en sidebar y topbar ──
  const initials = nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.querySelectorAll('.user-avatar, .topbar-avatar').forEach(el => {
    el.textContent = initials;
    el.style.background = config.color;
  });

  const nameEl = document.querySelector('.user-info-sidebar .name');
  const roleEl = document.querySelector('.user-info-sidebar .role');
  if (nameEl) nameEl.textContent = nombre;
  if (roleEl) roleEl.textContent = config.label + ' · ' + sucursal;

  // ── 5. Regencia: modo solo lectura ──
  if (role === 'regencia') {
    const content = document.querySelector('.content');
    if (content) {
      const banner = document.createElement('div');
      banner.className = 'alert alert-info';
      banner.style.marginBottom = '20px';
      banner.innerHTML =
        '<i class="fas fa-eye"></i>' +
        '<span>Modo <strong>solo lectura</strong> — Regencia puede consultar registros pero no modificarlos ni afectar otros roles.</span>';
      content.insertBefore(banner, content.firstChild);

      // Ocultar botones de acción (excepto los del topbar y filtros)
      document.querySelectorAll('.page-actions .btn-primary, .page-actions .btn-danger').forEach(btn => {
        btn.style.display = 'none';
      });
    }
  }

  // ── 6. Proveedor: ocultar sucursal selector ──
  if (role === 'proveedor') {
    document.querySelectorAll('.sucursal-select').forEach(el => el.style.display = 'none');
  }
});
