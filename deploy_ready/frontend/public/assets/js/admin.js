const API_URL = location.port === "3000"
    ? "http://localhost:5000/api"
    : "/api";

// Elements
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");
const productTableBody = document.getElementById("productTableBody");
const productModal = document.getElementById("productModal");
const productForm = document.getElementById("productForm");
const addProductBtn = document.getElementById("addProductBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const prodImages = document.getElementById("prodImages");
const imagePreview = document.getElementById("imagePreview");

// State
let token = localStorage.getItem("aj_token");
let categories = [];
let currentTab = 'products';

// Views
const views = {
    products: document.getElementById('productsView'),
    categories: document.getElementById('categoriesView'),
    banners: document.getElementById('bannersView')
};

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    if (token) {
        initDashboard();
    } else {
        showLogin();
    }
});

/* ================= AUTH ================= */
function showLogin() {
    loginSection.style.display = "flex";
    dashboardSection.style.display = "none";
}

function initDashboard() {
    loginSection.style.display = "none";
    dashboardSection.style.display = "flex";
    loadCategories();
    loadProducts();
    // Default Tab
    switchTab('products');
}

window.switchTab = (tab) => {
    currentTab = tab;
    // Hide all
    Object.values(views).forEach(el => el.style.display = 'none');
    // Reset navs
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));

    // Show active
    if (views[tab]) views[tab].style.display = 'block';
    const nav = document.getElementById(`nav-${tab}`);
    if (nav) nav.classList.add('active');

    if (tab === 'categories') loadCategoriesTable();
    if (tab === 'banners') loadBanners();
};

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Login failed");

        token = data.token;
        localStorage.setItem("aj_token", token);
        initDashboard();
    } catch (err) {
        alert(err.message);
    }
});

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("aj_token");
    location.reload();
});

/* ================= DATA ================= */
async function authorizedFetch(url, options = {}) {
    options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
    const res = await fetch(url, options);
    if (res.status === 401) {
        localStorage.removeItem("aj_token");
        location.reload();
    }
    return res;
}

async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        categories = await res.json();
        const select = document.getElementById("prodCategory");
        select.innerHTML = '<option value="">Select Category</option>' + categories.map(c =>
            `<option value="${c._id}">${c.name}</option>`
        ).join("");
    } catch (err) { console.error(err); }
}

async function loadCategoriesTable() {
    const tbody = document.getElementById("categoryTableBody");
    if (!tbody) return;
    tbody.innerHTML = categories.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="editCategory('${c._id}')"><i class="fa fa-edit"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteCategory('${c._id}')"><i class="fa fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function loadProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const products = await res.json();
        renderTable(products);
    } catch (err) { console.error(err); }
}

function renderTable(products) {
    productTableBody.innerHTML = products.map(p => {
        const img = p.images?.[0] || 'assets/img/placeholder.png'; // Fallback
        return `
        <tr>
            <td><img src="${img}" onerror="this.src='https://via.placeholder.com/50'"></td>
            <td>${p.title}</td>
            <td>₹${p.price.toLocaleString()}</td>
            <td>${p.stock}</td>
            <td>${p.category?.name || '-'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editProduct('${p._id}')"><i class="fa fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p._id}')"><i class="fa fa-trash"></i></button>
            </td>
        </tr>
        `;
    }).join("");
}

// Global scope for onclick
window.editProduct = async (id) => {
    try {
        const res = await fetch(`${API_URL}/products/${id}`);
        const product = await res.json();
        openModal(product);
    } catch (err) { alert("Error loading product"); }
};

window.deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
        const res = await authorizedFetch(`${API_URL}/products/${id}`, { method: "DELETE" });
        if (res.ok) loadProducts();
        else alert("Failed to delete");
    } catch (err) { alert("Error deleting"); }
};

window.deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
        const res = await authorizedFetch(`${API_URL}/categories/${id}`, { method: "DELETE" });
        if (res.ok) {
            await loadCategories(); // reload list
            loadCategoriesTable(); // reload table
        } else alert("Failed to delete");
    } catch (err) { alert("Error deleting"); }
};

window.editCategory = (id) => {
    const cat = categories.find(c => c._id === id);
    if (cat) openCatModal(cat);
};

/* ================= MODAL & FORM ================= */
addProductBtn.addEventListener("click", () => openModal());
closeModalBtn.addEventListener("click", () => productModal.classList.remove("open"));

function openModal(product = null) {
    const isEdit = !!product;
    document.getElementById("modalTitle").textContent = isEdit ? "Edit Product" : "Add New Product";
    document.getElementById("prodId").value = product ? product._id : "";
    document.getElementById("prodTitle").value = product ? product.title : "";
    document.getElementById("prodPrice").value = product ? product.price : "";
    document.getElementById("prodStock").value = product ? product.stock : 1;
    document.getElementById("prodDesc").value = product ? product.desc : "";
    document.getElementById("prodCategory").value = product?.category?._id || product?.category || "";
    document.getElementById("prodFeatured").checked = product ? product.featured : false;

    // Clear images preview
    imagePreview.innerHTML = "";
    document.getElementById("prodImages").value = ""; // Reset file input

    productModal.classList.add("open");
}

// Image preview
prodImages.addEventListener("change", (e) => {
    imagePreview.innerHTML = "";
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.createElement("img");
            img.src = ev.target.result;
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(productForm);
    const id = fd.get("id");

    // Handle checkbox
    fd.set("featured", document.getElementById("prodFeatured").checked);

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

    try {
        const res = await authorizedFetch(url, {
            method: method,
            body: fd // Multer handles FormData automatically
        }); // Note: Content-Type header not needed for FormData

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Save failed");
        }

        productModal.classList.remove("open");
        loadProducts();
    } catch (err) {
        alert(err.message);
    }
});

/* ================= CATEGORY MODAL ================= */
const catModal = document.getElementById("catModal");
const catForm = document.getElementById("catForm");
if (document.getElementById("addCatBtn")) {
    document.getElementById("addCatBtn").addEventListener("click", () => openCatModal());
}

window.openCatModal = (cat = null) => {
    const isEdit = !!cat;
    document.getElementById("catModalTitle").textContent = isEdit ? "Edit Category" : "Add Category";
    document.getElementById("catId").value = cat ? cat._id : "";
    document.getElementById("catName").value = cat ? cat.name : "";
    catModal.classList.add("open");
};

if (catForm) {
    catForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("catId").value;
        const name = document.getElementById("catName").value;
        const isEdit = !!id;

        const url = isEdit ? `${API_URL}/categories/${id}` : `${API_URL}/categories`;
        const method = isEdit ? "PUT" : "POST";

        try {
            // Auto-generate slug from name
            const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

            const res = await authorizedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug })
            });
            if (res.ok) {
                catModal.classList.remove("open");
                await loadCategories(); // refresh global list
                loadCategoriesTable();
            } else {
                alert("Failed to save category");
            }
        } catch (err) { console.error(err); alert("Error saving category"); }
    });
}

/* ================= BANNERS LOGIC ================= */
async function loadBanners() {
    try {
        const res = await fetch(`${API_URL}/content`);
        const banners = await res.json();
        renderBanners(banners);
    } catch (err) { console.error(err); }
}

function renderBanners(banners) {
    const heroList = document.getElementById("heroList");
    const promoList = document.getElementById("promoList");

    // Filter
    const heroes = banners.filter(b => b.section === 'hero');
    const promos = banners.filter(b => b.section === 'promo' || b.section.startsWith('promo'));

    if (heroList) {
        heroList.innerHTML = heroes.map(b => `
            <div class="banner-card" style="box-shadow:0 2px 5px rgba(0,0,0,0.1); border-radius:8px; overflow:hidden; position:relative;">
                <img src="${resolveImg(b.imageUrl)}" style="width:100%; height:100px; object-fit:cover;">
                <div style="padding:10px;">
                    <div style="font-size:12px; opacity:0.7;">Link: ${b.link || '-'}</div>
                </div>
                <button onclick="deleteBanner('${b._id}')" style="position:absolute; top:5px; right:5px; background:red; color:fff; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer;">&times;</button>
            </div>
        `).join('');
    }

    if (promoList) {
        promoList.innerHTML = promos.map(b => `
             <div class="banner-card" style="box-shadow:0 2px 5px rgba(0,0,0,0.1); border-radius:8px; overflow:hidden; position:relative;">
                <img src="${resolveImg(b.imageUrl)}" style="width:100%; height:120px; object-fit:cover;">
                <div style="padding:10px;">
                    <div style="font-weight:bold;">${b.title || (b.section === 'promo1' ? 'Left Banner' : 'Right Banner')}</div>
                </div>
                <button onclick="deleteBanner('${b._id}')" style="position:absolute; top:5px; right:5px; background:red; color:fff; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer;">&times;</button>
            </div>
        `).join('');
    }
}

window.openBannerModal = (type) => {
    const modal = document.getElementById("bannerModal");
    const sectionSelect = document.getElementById("bannerSection");

    modal.classList.add("open");
    sectionSelect.value = type;

    // Toggle promo dropdown if 'promo'
    togglePromoGroup();
};

window.deleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return;
    try {
        const res = await authorizedFetch(`${API_URL}/content/${id}`, { method: 'DELETE' });
        if (res.ok) loadBanners();
        else alert("Failed to delete");
    } catch (err) { console.error(err); }
};

// Form handling
const bannerForm = document.getElementById("bannerForm");
const bannerSection = document.getElementById("bannerSection");
const promoType = document.getElementById("promoType");
const promoTypeGroup = document.getElementById("promoTypeGroup");

if (bannerSection) {
    bannerSection.addEventListener("change", togglePromoGroup);
}

function togglePromoGroup() {
    if (!promoTypeGroup) return;
    if (bannerSection.value === 'promo') {
        promoTypeGroup.style.display = 'block';
    } else {
        promoTypeGroup.style.display = 'none';
    }
}

if (bannerForm) {
    bannerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(bannerForm);

        // If promo, override 'section' with specific promo type (promo1/promo2)
        if (fd.get("section") === 'promo') {
            fd.set("section", document.getElementById("promoType").value);
        }

        try {
            const res = await authorizedFetch(`${API_URL}/content`, {
                method: "POST",
                body: fd
            });
            if (res.ok) {
                document.getElementById("bannerModal").classList.remove("open");
                bannerForm.reset();
                loadBanners();
            } else {
                alert("Upload failed");
            }
        } catch (err) { console.error(err); alert("Error uploading"); }
    });
}

// Utility reused
function resolveImg(src) {
    if (!src) return "assets/img/placeholder.png";
    if (src.startsWith("http") || src.startsWith("data:")) return src;
    if (src.startsWith("uploads/") || src.startsWith("/uploads/")) {
        // We assume admin.js is running on same origin usually, but for dev:
        const baseUrl = API_URL.replace("/api", "");
        const path = src.startsWith("/") ? src : "/" + src;
        return baseUrl + path;
    }
    return src;
}
