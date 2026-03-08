/* ============================================================
   ALANKAR JEWELLERS — Admin JS v5.0
   Includes: Dashboard, Products, Categories, Banners, Orders
   ============================================================ */

const API_URL = location.port === '3000' ? 'http://localhost:5000/api' : '/api';

// ---- State ----
let token = localStorage.getItem('aj_token');
let categories = [];
let allProducts = [];
let allOrders = [];
let currentTab = 'dashboard';

// ---- DOM Refs ----
const loginSection    = document.getElementById('loginSection');
const dashboardSection= document.getElementById('dashboardSection');
const loginForm       = document.getElementById('loginForm');
const logoutBtn       = document.getElementById('logoutBtn');
const productTableBody= document.getElementById('productTableBody');
const productModal    = document.getElementById('productModal');
const productForm     = document.getElementById('productForm');
const addProductBtn   = document.getElementById('addProductBtn');
const closeModalBtn   = document.getElementById('closeModalBtn');
const prodImages      = document.getElementById('prodImages');
const imagePreview    = document.getElementById('imagePreview');

const views = {
  dashboard : document.getElementById('dashboardView'),
  products  : document.getElementById('productsView'),
  categories: document.getElementById('categoriesView'),
  banners   : document.getElementById('bannersView'),
  orders    : document.getElementById('ordersView'),
};

/* ===== INIT ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    initDashboard();
  } else {
    showLogin();
  }
  // Clock
  updateClock();
  setInterval(updateClock, 1000);
  // Sidebar toggle (mobile)
  const stBtn = document.getElementById('sidebarToggle');
  if (stBtn) stBtn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
});

function updateClock() {
  const el = document.getElementById('headerTime');
  if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}

/* ===== AUTH ===================================================== */
function showLogin() {
  loginSection.style.display = 'flex';
  dashboardSection.style.display = 'none';
}

function initDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'flex';
  loadCategories().then(() => {
    loadDashboard();
    switchTab('dashboard');
  });
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Signing In...';
  btn.disabled = true;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    token = data.token;
    localStorage.setItem('aj_token', token);
    initDashboard();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
    btn.innerHTML = '<span>Sign In</span><i class="fa fa-arrow-right"></i>';
    btn.disabled = false;
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('aj_token');
  location.reload();
});

/* ===== AUTHORIZED FETCH ========================================== */
async function authorizedFetch(url, options = {}) {
  options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
  const res = await fetch(url, options);
  if (res.status === 401) { localStorage.removeItem('aj_token'); location.reload(); }
  return res;
}

/* ===== TAB SWITCHING ============================================== */
window.switchTab = (tab) => {
  currentTab = tab;
  Object.values(views).forEach(v => v && v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
  if (views[tab]) views[tab].classList.add('active');
  const navEl = document.getElementById(`nav-${tab}`);
  if (navEl) navEl.classList.add('active');
  const titles = { dashboard:'Dashboard', products:'Product Management', categories:'Category Management', banners:'Banner Management', orders:'Order Management' };
  const pt = document.getElementById('pageTitle');
  if (pt) pt.textContent = titles[tab] || tab;

  if (tab === 'products') loadProducts();
  if (tab === 'categories') loadCategoriesTable();
  if (tab === 'banners') loadBanners();
  if (tab === 'orders') loadOrders();
};

/* ===== DASHBOARD ================================================== */
async function loadDashboard() {
  try {
    const [pRes, cRes, bRes, oRes] = await Promise.allSettled([
      fetch(`${API_URL}/products`),
      fetch(`${API_URL}/categories`),
      fetch(`${API_URL}/content`),
      authorizedFetch(`${API_URL}/orders`),
    ]);

    const products  = pRes.status==='fulfilled' && pRes.value.ok  ? await pRes.value.json()  : [];
    const cats      = cRes.status==='fulfilled' && cRes.value.ok  ? await cRes.value.json()  : [];
    const banners   = bRes.status==='fulfilled' && bRes.value.ok  ? await bRes.value.json()  : [];
    const orders    = oRes.status==='fulfilled' && oRes.value.ok  ? await oRes.value.json()  : [];

    allProducts = products;
    allOrders   = orders;

    setText('statProducts',   products.length);
    setText('statCategories', cats.length);
    setText('statOrders',     orders.length);
    setText('statBanners',    banners.length);

    // Badge
    const pendingCount = orders.filter(o => o.status === 'pending' || !o.status).length;
    const badge = document.getElementById('ordersBadge');
    if (badge && pendingCount > 0) { badge.textContent = pendingCount; badge.style.display = 'inline-flex'; }

    // Recent products table
    const tbody = document.getElementById('dashRecentProducts');
    if (tbody) {
      const recent = products.slice(0, 5);
      tbody.innerHTML = recent.length ? recent.map(p => `
        <tr>
          <td><img src="${resolveImg(p.images?.[0])}" onerror="this.src='https://placehold.co/48?text=?'" alt="${p.title}"></td>
          <td>${p.title}</td>
          <td>₹${Number(p.price).toLocaleString('en-IN')}</td>
          <td>${p.stock ?? '—'}</td>
          <td>${p.category?.name || '—'}</td>
        </tr>`).join('') : '<tr><td colspan="5" class="empty-cell">No products yet.</td></tr>';
    }
  } catch (err) { console.error('Dashboard load error:', err); }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ===== CATEGORIES ================================================= */
async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    categories = await res.json();
    const select = document.getElementById('prodCategory');
    if (select) {
      select.innerHTML = '<option value="">— Select Category —</option>' +
        categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
    }
  } catch (err) { console.error(err); }
}

async function loadCategoriesTable() {
  const tbody = document.getElementById('categoryTableBody');
  if (!tbody) return;
  await loadCategories();
  tbody.innerHTML = categories.length ? categories.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${c.name}</strong></td>
      <td><code style="background:var(--bg);padding:2px 8px;border-radius:4px;font-size:12px;">${c.slug || '—'}</code></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn-primary btn-sm" onclick="editCategory('${c._id}')"><i class="fa fa-edit"></i> Edit</button>
          <button class="btn-primary btn-danger btn-sm" onclick="deleteCategory('${c._id}')"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('') : '<tr><td colspan="4" class="empty-cell">No categories yet. Add one!</td></tr>';
}

/* ===== PRODUCTS =================================================== */
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    allProducts = await res.json();
    renderProductTable(allProducts);
    const countEl = document.getElementById('productsCount');
    if (countEl) countEl.textContent = `${allProducts.length} products`;
  } catch (err) { if (productTableBody) productTableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">Failed to load products.</td></tr>'; }
}

function renderProductTable(products) {
  if (!productTableBody) return;
  productTableBody.innerHTML = products.length ? products.map(p => {
    const img = resolveImg(p.images?.[0]);
    return `<tr>
      <td><img src="${img}" onerror="this.src='https://placehold.co/48?text=?'" alt="${p.title}"></td>
      <td><strong>${p.title}</strong></td>
      <td>₹${Number(p.price).toLocaleString('en-IN')}</td>
      <td>${p.stock ?? '—'}</td>
      <td>${p.category?.name || '—'}</td>
      <td><span class="featured-pill ${p.featured ? 'featured-yes' : 'featured-no'}">${p.featured ? '★ Yes' : 'No'}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn-primary btn-sm" onclick="editProduct('${p._id}')"><i class="fa fa-edit"></i></button>
          <button class="btn-primary btn-danger btn-sm" onclick="deleteProduct('${p._id}')"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="7" class="empty-cell">No products found.</td></tr>';
}

// Product search
const productSearch = document.getElementById('productSearch');
if (productSearch) {
  productSearch.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => p.title.toLowerCase().includes(q) || (p.category?.name || '').toLowerCase().includes(q));
    renderProductTable(filtered);
  });
}

window.editProduct = async (id) => {
  try {
    const res = await fetch(`${API_URL}/products/${id}`);
    const product = await res.json();
    openModal(product);
  } catch { alert('Error loading product'); }
};

window.deleteProduct = async (id) => {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    const res = await authorizedFetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    if (res.ok) loadProducts();
    else alert('Failed to delete product.');
  } catch { alert('Error deleting product.'); }
};

/* ===== PRODUCT MODAL ============================================== */
addProductBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', () => productModal.classList.remove('open'));
productModal.addEventListener('click', (e) => { if (e.target === productModal) productModal.classList.remove('open'); });

function openModal(product = null) {
  const isEdit = !!product;
  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Product' : 'Add New Product';
  document.getElementById('prodId').value    = product?._id || '';
  document.getElementById('prodTitle').value = product?.title || '';
  document.getElementById('prodPrice').value = product?.price || '';
  document.getElementById('prodStock').value = product?.stock ?? 1;
  document.getElementById('prodDesc').value  = product?.desc || '';
  document.getElementById('prodCategory').value = product?.category?._id || product?.category || '';
  document.getElementById('prodFeatured').checked = !!product?.featured;
  imagePreview.innerHTML = '';
  document.getElementById('prodImages').value = '';
  productModal.classList.add('open');
}

prodImages.addEventListener('change', (e) => {
  imagePreview.innerHTML = '';
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(productForm);
  const id = fd.get('id');
  fd.set('featured', document.getElementById('prodFeatured').checked);
  const method = id ? 'PUT' : 'POST';
  const url    = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
  const btn    = productForm.querySelector('[type="submit"]');
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;
  try {
    const res = await authorizedFetch(url, { method, body: fd });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Save failed'); }
    productModal.classList.remove('open');
    loadProducts();
    loadDashboard();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.innerHTML = '<i class="fa fa-save"></i> Save Product';
    btn.disabled = false;
  }
});

/* ===== CATEGORY MODAL ============================================= */
const catModal = document.getElementById('catModal');
const catForm  = document.getElementById('catForm');

if (document.getElementById('addCatBtn')) {
  document.getElementById('addCatBtn').addEventListener('click', () => openCatModal());
}

window.openCatModal = (cat = null) => {
  const isEdit = !!cat;
  document.getElementById('catModalTitle').textContent = isEdit ? 'Edit Category' : 'Add Category';
  document.getElementById('catId').value  = cat?._id || '';
  document.getElementById('catName').value= cat?.name || '';
  catModal.classList.add('open');
};

window.editCategory = (id) => {
  const cat = categories.find(c => c._id === id);
  if (cat) openCatModal(cat);
};

window.deleteCategory = async (id) => {
  if (!confirm('Delete this category?')) return;
  try {
    const res = await authorizedFetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
    if (res.ok) { await loadCategories(); loadCategoriesTable(); loadDashboard(); }
    else alert('Failed to delete category.');
  } catch { alert('Error deleting category.'); }
};

if (catForm) {
  catForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id   = document.getElementById('catId').value;
    const name = document.getElementById('catName').value.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const url    = id ? `${API_URL}/categories/${id}` : `${API_URL}/categories`;
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await authorizedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      if (res.ok) { catModal.classList.remove('open'); await loadCategories(); loadCategoriesTable(); loadDashboard(); }
      else alert('Failed to save category.');
    } catch { alert('Error saving category.'); }
  });
}

/* ===== BANNERS ==================================================== */
async function loadBanners() {
  try {
    const res = await fetch(`${API_URL}/content`);
    const banners = await res.json();
    renderBanners(banners);
  } catch { console.error('Error loading banners'); }
}

function renderBanners(banners) {
  const heroList  = document.getElementById('heroList');
  const promoList = document.getElementById('promoList');
  const heroes = banners.filter(b => b.section === 'hero');
  const promos = banners.filter(b => b.section !== 'hero');

  const makeCard = (b) => `
    <div class="banner-thumb">
      <img src="${resolveImg(b.imageUrl)}" alt="Banner" onerror="this.src='https://placehold.co/160x110?text=Banner'">
      <div class="banner-info">${b.section}${b.link ? ` · ${b.link}` : ''}</div>
      <button class="banner-del" onclick="deleteBanner('${b._id}')" title="Delete"><i class="fa fa-trash"></i></button>
    </div>`;

  if (heroList)  heroList.innerHTML  = heroes.length  ? heroes.map(makeCard).join('')  : '<div style="padding:20px;color:var(--text-light);font-size:13px;">No hero slides yet.</div>';
  if (promoList) promoList.innerHTML = promos.length  ? promos.map(makeCard).join('')  : '<div style="padding:20px;color:var(--text-light);font-size:13px;">No promo banners yet.</div>';
}

window.openBannerModal = (type) => {
  const modal = document.getElementById('bannerModal');
  const sectionSel = document.getElementById('bannerSection');
  modal.classList.add('open');
  sectionSel.value = type;
  togglePromoGroup();
};

window.deleteBanner = async (id) => {
  if (!confirm('Delete this banner?')) return;
  try {
    const res = await authorizedFetch(`${API_URL}/content/${id}`, { method: 'DELETE' });
    if (res.ok) loadBanners();
    else alert('Failed to delete banner.');
  } catch { alert('Error deleting.'); }
};

const bannerSection   = document.getElementById('bannerSection');
const promoTypeGroup  = document.getElementById('promoTypeGroup');
if (bannerSection) bannerSection.addEventListener('change', togglePromoGroup);

function togglePromoGroup() {
  if (!promoTypeGroup) return;
  promoTypeGroup.style.display = bannerSection?.value === 'promo' ? 'block' : 'none';
}

const bannerForm = document.getElementById('bannerForm');
if (bannerForm) {
  bannerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(bannerForm);
    if (fd.get('section') === 'promo') fd.set('section', document.getElementById('promoType').value);
    const btn = bannerForm.querySelector('[type="submit"]');
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Uploading...';
    btn.disabled = true;
    try {
      const res = await authorizedFetch(`${API_URL}/content`, { method: 'POST', body: fd });
      if (res.ok) { document.getElementById('bannerModal').classList.remove('open'); bannerForm.reset(); loadBanners(); loadDashboard(); }
      else alert('Upload failed.');
    } catch { alert('Error uploading.'); }
    finally { btn.innerHTML = '<i class="fa fa-upload"></i> Upload Banner'; btn.disabled = false; }
  });
}

/* ===== ORDERS ===================================================== */
async function loadOrders() {
  const tbody = document.getElementById('orderTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="empty-cell"><i class="fa fa-spinner fa-spin"></i> Loading orders...</td></tr>';
  try {
    const res = await authorizedFetch(`${API_URL}/orders`);
    if (!res.ok) throw new Error('Failed to load');
    allOrders = await res.json();
    renderOrderTable(allOrders);
  } catch {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">No orders found or unable to load orders.</td></tr>';
  }
}

function renderOrderTable(orders) {
  const tbody = document.getElementById('orderTableBody');
  if (!tbody) return;
  tbody.innerHTML = orders.length ? orders.map(o => {
    const dStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—';
    const status = o.status || 'pending';
    const items = o.items?.length || o.products?.length || '—';
    const total = o.totalAmount || o.total || 0;
    return `<tr>
      <td><strong>#${o._id.toString().slice(-6).toUpperCase()}</strong></td>
      <td>${o.customerName || o.name || '—'}<br><small style="color:var(--text-light);">${o.phone || o.email || ''}</small></td>
      <td>${items} item${items !== 1 ? 's' : ''}</td>
      <td><strong>₹${Number(total).toLocaleString('en-IN')}</strong></td>
      <td>${dStr}</td>
      <td><span class="status-badge status-${status}">${status.charAt(0).toUpperCase()+status.slice(1)}</span></td>
      <td>
        <div style="display:flex;gap:6px;align-items:center;">
          <select class="status-select" onchange="updateOrderStatus('${o._id}', this.value)">
            <option value="pending"   ${status==='pending'   ?'selected':''}>Pending</option>
            <option value="confirmed" ${status==='confirmed' ?'selected':''}>Confirmed</option>
            <option value="shipped"   ${status==='shipped'   ?'selected':''}>Shipped</option>
            <option value="delivered" ${status==='delivered' ?'selected':''}>Delivered</option>
            <option value="cancelled" ${status==='cancelled' ?'selected':''}>Cancelled</option>
          </select>
          <button class="btn-primary btn-sm" onclick="viewOrder('${o._id}')"><i class="fa fa-eye"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="7" class="empty-cell">No orders yet.</td></tr>';
}

window.updateOrderStatus = async (id, status) => {
  try {
    const res = await authorizedFetch(`${API_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed');
    // Reload quietly
    loadOrders();
  } catch { alert('Failed to update order status.'); }
};

window.viewOrder = (id) => {
  const order = allOrders.find(o => o._id === id);
  if (!order) return;
  const modal  = document.getElementById('orderModal');
  const detail = document.getElementById('orderDetail');
  const items  = order.items || order.products || [];
  detail.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
      <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);margin-bottom:4px;">Customer</div><strong>${order.customerName||order.name||'—'}</strong></div>
      <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);margin-bottom:4px;">Phone</div><strong>${order.phone||'—'}</strong></div>
      <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);margin-bottom:4px;">Email</div>${order.email||'—'}</div>
      <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);margin-bottom:4px;">Status</div><span class="status-badge status-${order.status||'pending'}">${(order.status||'pending').toUpperCase()}</span></div>
      <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);margin-bottom:4px;">Order Date</div>${order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '—'}</div>
      <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);margin-bottom:4px;">Total</div><strong style="color:var(--gold);font-size:18px;">₹${Number(order.totalAmount||order.total||0).toLocaleString('en-IN')}</strong></div>
    </div>
    ${order.address ? `<div style="margin-bottom:16px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);margin-bottom:4px;">Delivery Address</div>${order.address}</div>` : ''}
    ${items.length ? `<div><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);margin-bottom:10px;">Items</div>
    ${items.map(item => `<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border);">
      <img src="${resolveImg(item.product?.images?.[0]||item.image)}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;" onerror="this.src='https://placehold.co/48?text=?'">
      <div style="flex:1;"><div style="font-weight:600;">${item.product?.title||item.title||'Product'}</div><div style="font-size:13px;color:var(--text-light);">Qty: ${item.qty||item.quantity||1} × ₹${Number(item.price||0).toLocaleString('en-IN')}</div></div>
    </div>`).join('')}</div>` : ''}`;
  modal.classList.add('open');
};

// Order status filter
const orderStatusFilter = document.getElementById('orderStatusFilter');
if (orderStatusFilter) {
  orderStatusFilter.addEventListener('change', () => {
    const val = orderStatusFilter.value;
    const filtered = val ? allOrders.filter(o => (o.status||'pending') === val) : allOrders;
    renderOrderTable(filtered);
  });
}

/* ===== UTILS ====================================================== */
function resolveImg(src) {
  if (!src) return 'https://placehold.co/48?text=?';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  const baseUrl = API_URL.replace('/api', '');
  const p = src.startsWith('/') ? src : '/' + src;
  return baseUrl + p;
}
