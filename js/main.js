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

  // ── 7. Notification dropdown ──
  initNotifDropdown();

  // ── 8. Tab switching (for pages with internal .tabs) ──
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
function showModal(title, bodyHtml, buttons = [], maxWidth = '520px') {
  const existing = document.getElementById('ph-modal');
  if (existing) existing.remove();

  const m = document.createElement('div');
  m.id = 'ph-modal';
  m.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box" style="max-width:${maxWidth}">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-footer"></div>
    </div>`;

  const footer = m.querySelector('.modal-footer');
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = `btn ${b.style}`;
    btn.innerHTML = b.label;
    btn.addEventListener('click', b.action);
    footer.appendChild(btn);
  });

  m.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  m.querySelector('.modal-close').addEventListener('click', closeModal);

  document.body.appendChild(m);
  setTimeout(() => m.classList.add('visible'), 10);
}

function closeModal() {
  const m = document.getElementById('ph-modal');
  if (m) { m.classList.remove('visible'); setTimeout(() => m.remove(), 200); }
}

/* ── Notification dropdown ── */
const PH_NOTIFS = [
  { type:'warning', icon:'triangle-exclamation', title:'Oferta vence en 2 días', sub:'NOVAGEN S.A. — Tramadol / Clonazepam', unread:true },
  { type:'danger',  icon:'box-open',             title:'Stock crítico: 3 productos sin existencia', sub:'Zona 2 — Inventario requiere atención', unread:true },
  { type:'info',    icon:'tags',                 title:'Nueva oferta de FARMEX Guatemala', sub:'Antihipertensivos con 20% de descuento', unread:true },
  { type:'success', icon:'truck',                title:'Delivery entregado — Pedido #1042', sub:'Diego M. confirmó entrega — Zona 16', unread:false },
  { type:'warning', icon:'boxes-stacked',        title:'8 productos bajo mínimo en Inventario', sub:'Revisar niveles y solicitar reposición', unread:false },
];

function initNotifDropdown() {
  const actualBtn = document.querySelector('.icon-btn');
  if (!actualBtn) return;

  const wrap = document.createElement('div');
  wrap.className = 'icon-btn-wrap';
  actualBtn.parentElement.insertBefore(wrap, actualBtn);
  wrap.appendChild(actualBtn);

  const dropdown = document.createElement('div');
  dropdown.className = 'notif-dropdown';

  const unreadCount = PH_NOTIFS.filter(n => n.unread).length;
  dropdown.innerHTML = `
    <div class="notif-dropdown-header">
      <span>Notificaciones <span class="badge badge-danger" style="font-size:10px;padding:1px 6px;">${unreadCount}</span></span>
      <a onclick="markAllRead(event)">Marcar todo como leído</a>
    </div>
    ${PH_NOTIFS.map(n => `
      <div class="notif-item${n.unread ? ' unread' : ''}">
        <div class="notif-icon ${n.type}"><i class="fas fa-${n.icon}"></i></div>
        <div class="notif-text"><strong>${n.title}</strong><span>${n.sub}</span></div>
        ${n.unread ? '<div class="notif-dot"></div>' : ''}
      </div>`).join('')}
    <div class="notif-dropdown-footer"><i class="fas fa-list" style="margin-right:5px;"></i>Ver todas las notificaciones</div>`;

  wrap.appendChild(dropdown);

  actualBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => dropdown.classList.remove('open'));
  dropdown.addEventListener('click', e => e.stopPropagation());
}

function markAllRead(e) {
  e.preventDefault();
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  document.querySelectorAll('.notif-dot').forEach(el => el.remove());
  const badge = document.querySelector('.notif-dropdown-header .badge-danger');
  if (badge) badge.textContent = '0';
  const notifBadge = document.querySelector('.notif-badge');
  if (notifBadge) notifBadge.style.display = 'none';
  showToast('Todas las notificaciones marcadas como leídas', 'success');
}

/* ── Ofertas: Ver Detalle ── */
function verDetalleOferta(id) {
  const ofertas = {
    1: {
      proveedor: 'DISTRIBUIDORA MEDIC S.A.',
      tipo: 'Oferta por volumen · Antibióticos',
      vigencia: '31 de mayo 2026',
      diasCredito: 30,
      entrega: '2 días hábiles',
      contacto: 'Ana Morales — amorales@distmedic.com.gt',
      telefono: '(502) 2345-6789',
      condiciones: 'Pedido mínimo por producto. Pago a 30 días. Flete incluido para pedidos mayores a Q 1,500.',
      productos: [
        { nombre:'Amoxicilina 500mg', regular:'Q 2.65', oferta:'Q 2.12', desc:'-20%', min:'200 und.', stock:'500 und.' },
        { nombre:'Azitromicina 500mg', regular:'Q 4.80', oferta:'Q 3.84', desc:'-20%', min:'100 und.', stock:'280 und.' },
        { nombre:'Ciprofloxacino 500mg', regular:'Q 3.20', oferta:'Q 2.72', desc:'-15%', min:'150 und.', stock:'340 und.' },
      ]
    },
    2: {
      proveedor: 'FARMEX Guatemala',
      tipo: 'Oferta por temporada · Antidiabéticos',
      vigencia: '28 de mayo 2026',
      diasCredito: 15,
      entrega: '3 días hábiles',
      contacto: 'Roberto Fuentes — rfuentes@farmex.gt',
      telefono: '(502) 2456-7890',
      condiciones: 'Pedido mínimo por línea. Pago a 15 días. Descuento adicional del 2% por pago de contado.',
      productos: [
        { nombre:'Metformina 850mg', regular:'Q 1.40', oferta:'Q 1.05', desc:'-25%', min:'300 und.', stock:'600 und.' },
        { nombre:'Glibenclamida 5mg', regular:'Q 0.90', oferta:'Q 0.72', desc:'-20%', min:'200 und.', stock:'400 und.' },
        { nombre:'Insulina NPH 100UI', regular:'Q 48.00', oferta:'Q 38.40', desc:'-20%', min:'50 und.', stock:'90 und.' },
      ]
    },
    3: {
      proveedor: 'NOVAGEN S.A.',
      tipo: 'Liquidación de stock · Controlados',
      vigencia: '27 de mayo 2026',
      diasCredito: 0,
      entrega: '1 día hábil',
      contacto: 'Julio Herrera — jherrera@novagen.gt',
      telefono: '(502) 2567-8901',
      condiciones: 'Pago de contado obligatorio. Documentación especial requerida para medicamentos controlados. Stock limitado.',
      productos: [
        { nombre:'Tramadol 50mg', regular:'Q 3.60', oferta:'Q 2.52', desc:'-30%', min:'100 und.', stock:'150 und.' },
        { nombre:'Clonazepam 2mg', regular:'Q 2.10', oferta:'Q 1.68', desc:'-20%', min:'80 und.', stock:'120 und.' },
      ]
    },
    4: {
      proveedor: 'FARMEX Guatemala',
      tipo: 'Oferta especial · Antihipertensivos',
      vigencia: '15 de junio 2026',
      diasCredito: 15,
      entrega: '3 días hábiles',
      contacto: 'Roberto Fuentes — rfuentes@farmex.gt',
      telefono: '(502) 2456-7890',
      condiciones: 'Pedido mínimo por producto. Aplica para pedidos antes del 10 de junio. Flete incluido.',
      productos: [
        { nombre:'Losartán 50mg', regular:'Q 2.20', oferta:'Q 1.76', desc:'-20%', min:'200 und.', stock:'450 und.' },
        { nombre:'Enalapril 10mg', regular:'Q 1.80', oferta:'Q 1.44', desc:'-20%', min:'150 und.', stock:'300 und.' },
        { nombre:'Amlodipino 5mg', regular:'Q 1.50', oferta:'Q 1.20', desc:'-20%', min:'100 und.', stock:'250 und.' },
      ]
    }
  };

  const o = ofertas[id];
  if (!o) return;

  const rows = o.productos.map(p => `
    <tr>
      <td class="fw-600">${p.nombre}</td>
      <td class="text-muted">${p.regular}</td>
      <td class="fw-600 text-primary">${p.oferta}</td>
      <td><span class="badge badge-success">${p.desc}</span></td>
      <td>${p.min}</td>
      <td class="fw-600">${p.stock}</td>
    </tr>`).join('');

  showModal(`Detalle de oferta — ${o.proveedor}`, `
    <div style="margin-bottom:16px;">
      <div class="text-muted" style="font-size:12px;margin-bottom:8px;">${o.tipo}</div>
      <div class="grid-2" style="gap:10px;margin-bottom:14px;">
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:10px 14px;">
          <div class="text-xs text-muted">Vigencia</div>
          <div class="fw-600"><i class="fas fa-calendar" style="margin-right:5px;color:var(--warning);"></i>${o.vigencia}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:10px 14px;">
          <div class="text-xs text-muted">Crédito / Entrega</div>
          <div class="fw-600">${o.diasCredito > 0 ? o.diasCredito + ' días crédito' : 'Contado'} · ${o.entrega}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:10px 14px;">
          <div class="text-xs text-muted">Contacto</div>
          <div class="fw-600" style="font-size:12px;">${o.contacto}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:10px 14px;">
          <div class="text-xs text-muted">Teléfono</div>
          <div class="fw-600">${o.telefono}</div>
        </div>
      </div>
      <div style="background:var(--warning-bg);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px;border-left:3px solid var(--warning);">
        <div class="text-xs text-muted" style="margin-bottom:3px;">Condiciones</div>
        <div style="font-size:12.5px;">${o.condiciones}</div>
      </div>
    </div>
    <div class="table-wrap" style="margin:0;">
      <table>
        <thead><tr><th>Producto</th><th>Regular</th><th>Oferta</th><th>Desc.</th><th>Mín.</th><th>Stock disp.</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`, [
    { label:'Cerrar', style:'btn-secondary', action: () => closeModal() }
  ], '680px');
}

/* ── Ofertas: Solicitar Oferta ── */
function solicitarOferta() {
  showModal('Solicitar nueva oferta', `
    <p class="text-muted" style="font-size:12.5px;margin-bottom:18px;">
      Completa el formulario y el proveedor seleccionado recibirá tu solicitud de cotización. El proceso es:
      <strong>Solicitud → Cotización del proveedor → Revisión → Aceptar oferta → Orden de compra.</strong>
    </p>
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Proveedor</label>
        <select class="ph-input" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;">
          <option value="">— Seleccionar proveedor —</option>
          <option>DISTRIBUIDORA MEDIC S.A.</option>
          <option>FARMEX Guatemala</option>
          <option>NOVAGEN S.A.</option>
          <option>LABORATORIOS UNITED</option>
        </select>
      </div>
      <div>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Categoría de productos</label>
        <select class="ph-input" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;">
          <option value="">— Seleccionar categoría —</option>
          <option>Antibióticos</option>
          <option>Antidiabéticos</option>
          <option>Antihipertensivos</option>
          <option>Analgésicos</option>
          <option>Controlados</option>
          <option>Vitaminas y suplementos</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Cantidad estimada (unidades)</label>
          <input type="number" placeholder="Ej. 500" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Fecha límite de entrega</label>
          <input type="date" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;" />
        </div>
      </div>
      <div>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Observaciones</label>
        <textarea rows="3" placeholder="Condiciones especiales, productos específicos, etc." style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;resize:vertical;"></textarea>
      </div>
      <div style="background:var(--info-bg);border-radius:var(--radius-sm);padding:10px 14px;border-left:3px solid var(--info);font-size:12px;color:var(--info-text);">
        <i class="fas fa-circle-info" style="margin-right:6px;"></i>
        El proveedor tiene <strong>48 horas</strong> para responder. Recibirás una notificación cuando llegue la cotización.
      </div>
    </div>`, [
    { label:'Cancelar', style:'btn-secondary', action: () => closeModal() },
    { label:'Enviar solicitud', style:'btn-primary', action: () => { closeModal(); showToast('Solicitud enviada al proveedor', 'success'); } }
  ]);
}

/* ── Sucursales: Nueva sucursal ── */
function nuevaSucursal() {
  showModal('Agregar nueva sucursal', `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Nombre de la sucursal</label>
          <input type="text" placeholder="Ej. Zona 7" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Tipo</label>
          <select style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;">
            <option>Sucursal</option>
            <option>Sede Central</option>
            <option>Punto de venta</option>
          </select>
        </div>
      </div>
      <div>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Dirección completa</label>
        <input type="text" placeholder="Ej. 12 Av. 5-30, Zona 7, Guatemala" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Teléfono</label>
          <input type="tel" placeholder="(502) 2000-0000" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Encargado / Regente</label>
          <input type="text" placeholder="Nombre completo" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;" />
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Horario de apertura</label>
          <input type="time" value="08:00" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Horario de cierre</label>
          <input type="time" value="20:00" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;" />
        </div>
      </div>
      <div>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px;">Número de empleados iniciales</label>
        <input type="number" placeholder="Ej. 5" min="1" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;" />
      </div>
    </div>`, [
    { label:'Cancelar', style:'btn-secondary', action: () => closeModal() },
    { label:'Crear sucursal', style:'btn-primary', action: () => { closeModal(); showToast('Sucursal creada correctamente', 'success'); } }
  ]);
}

/* ── Sucursales: Comparar ── */
function compararSucursales() {
  showModal('Comparativa de sucursales', `
    <div class="table-wrap" style="margin:0;">
      <table>
        <thead>
          <tr>
            <th>Indicador</th>
            <th style="text-align:center;">Zona 16<br><span style="font-weight:400;font-size:10px;">Sede Central</span></th>
            <th style="text-align:center;">Zona 11</th>
            <th style="text-align:center;">Zona 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="fw-600">Ventas hoy</td>
            <td style="text-align:center;" class="fw-600 text-primary">Q 4,210</td>
            <td style="text-align:center;" class="fw-600">Q 2,860</td>
            <td style="text-align:center;" class="fw-600">Q 1,360</td>
          </tr>
          <tr>
            <td class="fw-600">Transacciones</td>
            <td style="text-align:center;">142</td>
            <td style="text-align:center;">98</td>
            <td style="text-align:center;">58</td>
          </tr>
          <tr>
            <td class="fw-600">Ticket promedio</td>
            <td style="text-align:center;" class="fw-600 text-primary">Q 29.65</td>
            <td style="text-align:center;">Q 29.18</td>
            <td style="text-align:center;">Q 23.45</td>
          </tr>
          <tr>
            <td class="fw-600">Personal activo</td>
            <td style="text-align:center;">6</td>
            <td style="text-align:center;">5</td>
            <td style="text-align:center;">4</td>
          </tr>
          <tr>
            <td class="fw-600">Alertas inventario</td>
            <td style="text-align:center;"><span class="badge badge-warning">5 productos</span></td>
            <td style="text-align:center;"><span class="badge badge-success">Sin alertas</span></td>
            <td style="text-align:center;"><span class="badge badge-danger">3 sin stock</span></td>
          </tr>
          <tr>
            <td class="fw-600">Repartidor</td>
            <td style="text-align:center;"><span class="badge badge-info">En camino</span></td>
            <td style="text-align:center;"><span class="badge badge-success">Disponible</span></td>
            <td style="text-align:center;"><span class="badge badge-warning">En camino</span></td>
          </tr>
          <tr style="background:var(--primary-light);">
            <td class="fw-600">% del total ventas</td>
            <td style="text-align:center;" class="fw-600 text-primary">49.8%</td>
            <td style="text-align:center;" class="fw-600">33.8%</td>
            <td style="text-align:center;" class="fw-600">16.1%</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="margin-top:14px;background:var(--bg);border-radius:var(--radius-sm);padding:10px 14px;font-size:12px;color:var(--text-muted);">
      <i class="fas fa-circle-info" style="margin-right:5px;"></i>Datos correspondientes al día de hoy, 26 mayo 2026.
    </div>`, [
    { label:'Cerrar', style:'btn-secondary', action: () => closeModal() }
  ], '640px');
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
