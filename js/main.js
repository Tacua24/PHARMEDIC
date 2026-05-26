/* ==========================================
   PHARMEDIC — Control de sesión y roles
   ========================================== */

const ROLES = {
  admin: {
    label:  'Administrador',
    color:  '#3A4520',
    home:   'dashboard.html',
    access: null,           // null = acceso a todo
  },
  cajero: {
    label:  'Cajero',
    color:  '#2563EB',
    home:   'ventas.html',
    access: ['dashboard.html', 'ventas.html', 'clientes.html', 'cierre-caja.html', 'delivery.html'],
  },
  inventario: {
    label:  'Bodeguero',
    color:  '#CA8A04',
    home:   'inventario.html',
    access: ['dashboard.html', 'inventario.html', 'proveedores.html'],
  },
  repartidor: {
    label:  'Repartidor',
    color:  '#EA580C',
    home:   'repartidor.html',
    access: ['repartidor.html'],
  },
  regencia: {
    label:  'Regencia',
    color:  '#7C3AED',
    home:   'recetas.html',
    access: ['dashboard.html', 'recetas.html', 'inventario.html', 'reportes.html'],
  },
  proveedor: {
    label:  'Proveedor',
    color:  '#16A34A',
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

  // ── 1. Control de acceso ──
  if (config.access !== null && !config.access.includes(page)) {
    window.location.href = config.home;
    return;
  }

  // ── 2. Marcar ítem activo en tabnav (y nav-item legacy) ──
  document.querySelectorAll('.nav-item[href], .tabnav-item[href]').forEach(el => {
    if (el.getAttribute('href') === page) el.classList.add('active');
  });

  // ── 3. Ocultar ítems de navegación no permitidos ──
  if (config.access !== null) {
    document.querySelectorAll('.nav-item[href], .tabnav-item[href]').forEach(el => {
      if (!config.access.includes(el.getAttribute('href'))) {
        el.style.display = 'none';
      }
    });
  }

  // ── 4. Actualizar info de usuario (topbar avatar) ──
  const initials = nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.querySelectorAll('.user-avatar, .topbar-avatar').forEach(el => {
    el.textContent = initials;
    el.style.background = config.color;
  });

  // Update sucursal select if present
  document.querySelectorAll('.sucursal-pill select').forEach(sel => {
    // Optionally pre-select matching option
  });

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

      document.querySelectorAll('.page-actions .btn-primary, .page-actions .btn-danger').forEach(btn => {
        btn.style.display = 'none';
      });
    }
  }

  // ── 6. Proveedor: ocultar sucursal selector ──
  if (role === 'proveedor') {
    document.querySelectorAll('.sucursal-pill, .sucursal-select').forEach(el => el.style.display = 'none');
  }

  // ── 7. Tab switching (for pages with internal .tabs) ──
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    const tabs = tabGroup.querySelectorAll('.tab');
    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tabGroup.dispatchEvent(new CustomEvent('tabchange', { detail: { index: idx, label: tab.textContent.trim() } }));
      });
    });
  });
});

/* ── Modal global ── */
function showModal(title, bodyHtml, buttons = []) {
  const existing = document.getElementById('ph-modal');
  if (existing) existing.remove();

  const btnsHtml = buttons.map(b =>
    `<button class="btn ${b.style}" onclick="(${b.action.toString()})()">${b.label}</button>`
  ).join('');

  const m = document.createElement('div');
  m.id = 'ph-modal';
  m.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()"></div>
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close" onclick="closeModal()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-footer">${btnsHtml}</div>
    </div>`;
  document.body.appendChild(m);
  setTimeout(() => m.classList.add('visible'), 10);
}

function closeModal() {
  const m = document.getElementById('ph-modal');
  if (m) { m.classList.remove('visible'); setTimeout(() => m.remove(), 200); }
}

/* ── Toast notifications ── */
function showToast(msg, type = 'info') {
  const icons = { success:'circle-check', danger:'circle-exclamation', warning:'triangle-exclamation', info:'circle-info' };
  const t = document.createElement('div');
  t.className = `ph-toast ph-toast-${type}`;
  t.innerHTML = `<i class="fas fa-${icons[type]||'circle-info'}"></i><span>${msg}</span>`;
  let container = document.getElementById('ph-toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ph-toasts';
    document.body.appendChild(container);
  }
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}
