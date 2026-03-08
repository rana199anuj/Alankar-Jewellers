/* ============================================================
   FRONTEND MAIN SCRIPT FOR ALANKAR JEWELLERS
   - Homepage UI rendering
   - Product fetch from backend
   - Hero slider + arrivals + featured + reviews
   - Search overlay + scrollTop + whatsapp
   - Admin panel upload system (productForm)
   ============================================================ */

const API_BASE = location.port === "3000"
  ? "http://localhost:5000/api"
  : "/api";

/* helper */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function fmtPrice(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

/* Fix for uploaded images: prepend API_BASE host if relative path */
function resolveImg(src) {
  if (!src) return "images/placeholder.png";
  if (src.startsWith("http") || src.startsWith("data:")) return src;
  if (src.startsWith("uploads/") || src.startsWith("/uploads/")) {
    const baseUrl = API_BASE.replace("/api", ""); // e.g., http://localhost:5000
    // ensure leading slash
    const path = src.startsWith("/") ? src : "/" + src;
    return baseUrl + path;
  }
  return src;
}

/* ============================================================
   PAGE INITIALIZE — runs for both Home and Admin
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ========================
       SEARCH OVERLAY
     ======================== */
  if ($("#searchToggle")) {
    $("#searchToggle").addEventListener("click", () => {
      $("#searchOverlay").style.display = "block";
      $("#globalSearch").focus();
    });
  }
  if ($("#closeSearch")) {
    $("#closeSearch").addEventListener("click", () => {
      $("#searchOverlay").style.display = "none";
    });
  }

  /* ============================================================
         FETCH HOMEPAGE CONTENT (Hero, Promos, Products)
     ============================================================ */
  (async function loadHome() {
    // 1. Fetch Content/Banners
    let banners = [];
    try {
      const res = await fetch(API_BASE + "/content");
      if (res.ok) banners = await res.json();
    } catch (err) { console.warn("Content fetch error", err); }

    const heroes = banners.filter(b => b.section === 'hero').sort((a, b) => a.order - b.order);
    const promo1 = banners.find(b => b.section === 'promo1');
    const promo2 = banners.find(b => b.section === 'promo2');

    // 2. Render Hero
    const heroSlidesEl = $("#heroSlides");
    if (heroSlidesEl) {
      // Fallback
      let slidesMarkup = "";

      if (heroes.length > 0) {
        slidesMarkup = heroes.map(h => `<div class="swiper-slide"><a href="${h.link || 'shop.html'}" class="hero-link" style="display:block"><img src="${resolveImg(h.imageUrl)}" alt="${h.title || 'hero'}"></a></div>`).join("");
      } else {
        const heroImgs = ["images/hero-1.jpg", "images/hero-2.jpg", "images/hero-3.jpg"];
        slidesMarkup = heroImgs.map((src) => `<div class="swiper-slide"><a href="shop.html" style="display:block"><img src="${src}" alt="hero"></a></div>`).join("");
      }

      heroSlidesEl.innerHTML = slidesMarkup;

      new Swiper(".hero-swiper", {
        loop: true,
        autoplay: { delay: 4500 },
        pagination: { el: ".hero-swiper .swiper-pagination", clickable: true },
        navigation: {
          nextEl: ".hero-swiper .swiper-button-next",
          prevEl: ".hero-swiper .swiper-button-prev",
        },
      });
    }

    // 3. Render Promos
    const promoGrid = $(".promo-grid");
    if (promoGrid && (promo1 || promo2)) {
      // If we have at least one dynamic promo, we replace static content
      // But we need to be careful if only one is set. For now, assume if user sets one, they manage both or we keep static for the missing one?
      // Let's replace specifically.

      const p1Html = promo1
        ? `<div class="promo"><a href="${promo1.link || 'shop.html'}" style="display:block;height:100%"><img src="${resolveImg(promo1.imageUrl)}"></a><a class="promo-label" href="${promo1.link || 'shop.html'}">${promo1.title || 'Shop Now'}</a></div>`
        : `<div class="promo"><a href="shop.html" style="display:block;height:100%"><img src="images/promo-ring.jpg"></a><a class="promo-label" href="shop.html">Shop Rings</a></div>`;

      const p2Html = promo2
        ? `<div class="promo"><a href="${promo2.link || 'shop.html'}" style="display:block;height:100%"><img src="${resolveImg(promo2.imageUrl)}"></a><a class="promo-label" href="${promo2.link || 'shop.html'}">${promo2.title || 'Shop Now'}</a></div>`
        : `<div class="promo"><a href="shop.html" style="display:block;height:100%"><img src="images/promo-pendant.jpg"></a><a class="promo-label" href="shop.html">Shop Pendants</a></div>`;

      promoGrid.innerHTML = p1Html + p2Html;
      // Re-init animation tags for new content
      if (window.observer) {
        promoGrid.querySelectorAll('.promo').forEach(el => {
          el.classList.add('reveal');
          window.observer.observe(el);
        });
      }
    }

    // 4. Products
    if ($("#arrivalsWrapper") || $("#featuredGrid")) {
      let products = [];
      try {
        const res = await fetch(API_BASE + "/products");
        if (res.ok) products = await res.json();
      } catch (err) { console.warn("Products fetch error", err); }

      if (!products || products.length === 0) products = demoProducts();

      renderArrivals(products.slice(0, 8));
      renderFeatured(products.slice(0, 12));

      new Swiper(".arrivals-swiper", {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: true,
        pagination: { el: ".arrivals-swiper .swiper-pagination", clickable: true },
        breakpoints: { 600: { slidesPerView: 2 }, 1000: { slidesPerView: 3 } },
      });
    }
  })();

  /* ============================================================
          REVIEWS SECTION
     ============================================================ */
  if ($("#reviewsWrapper")) {
    renderReviews([
      {
        name: "Shivam Kumar",
        text: "Variety and good wealth of jewelry available. Outstanding service. Must visit.",
        rating: 4,
      },
      {
        name: "Sunil Kashyap",
        text: "Amazing Service by Alankar. They really care about customers.",
        rating: 4,
      },
      {
        name: "Abhishek Jatav",
        text: "Beautiful jewellery. Very unique designs. Extremely happy with purchase.",
        rating: 5,
      },
    ]);

    new Swiper(".reviews-swiper", {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      pagination: { el: ".reviews-swiper .swiper-pagination", clickable: true },
      breakpoints: { 900: { slidesPerView: 3 } },
    });
  }

  /* ============================================================
            WHATSAPP FLOAT BUTTON
     ============================================================ */
  const wa = $("#whatsAppFloat");
  if (wa) {
    wa.href =
      "https://wa.me/9198XXXXXXXX?text=" +
      encodeURIComponent("Hello Alankar Jewellers, I want to enquire about a product.");
  }

  /* ============================================================
            SCROLL TOP BUTTON
     ============================================================ */
  const scrollTop = $("#scrollTop");
  if (scrollTop) {
    window.addEventListener("scroll", () => {
      scrollTop.style.display = window.scrollY > 300 ? "block" : "none";
    });
    scrollTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  /* ============================================================
            SEARCH BUTTON
     ============================================================ */
  if ($("#searchBtn")) {
    $("#searchBtn").addEventListener("click", () => {
      const q = $("#globalSearch").value.trim();
      if (!q) return alert("Enter a search term");
      localStorage.setItem("aj_search_q", q);
      location.href = "index.html#shop";
      $("#searchOverlay").style.display = "none";
    });
  }

  /* ============================================================
            CART COUNT
     ============================================================ */
  updateCartCount();

  /* ============================================================
            ADMIN PRODUCT FORM (Admin Page only)
     ============================================================ */
  if ($("#productForm")) {
    setupProductForm();   // ENABLES ADMIN IMAGE UPLOAD
  }

  /* ============================================================
            PRODUCT DETAIL PAGE
     ============================================================ */
  if ($("#productDetailWrap")) {
    loadProductDetail();
  }

  /* ============================================================
            CART PAGE
     ============================================================ */
  if ($("#cartWrap")) {
    loadCartPage();
  }

  /* ============================================================
            THEME & ANIMATIONS
     ============================================================ */
  initTheme();
  initAnimations();
});

/* ============================================================
         RENDER FUNCTIONS (Homepage)
   ============================================================ */
function renderArrivals(arr) {
  const wrapper = $("#arrivalsWrapper");
  if (!wrapper) return;

  wrapper.innerHTML = arr
    .map((p) => {
      const img = resolveImg(p.images?.length ? p.images[0] : null);
      return `
      <div class="swiper-slide">
        <a href="shop.html" class="card-link">
          <div class="product-card">
            <img src="${img}" alt="${escapeHtml(p.title)}" />
            <h4>${escapeHtml(p.title)}</h4>
            <div class="price">${fmtPrice(p.price)}</div>
          </div>
        </a>
      </div>`;
    })
    .join("");
}

function renderFeatured(list) {
  const el = $("#featuredGrid");
  if (!el) return;

  // Prioritize featured=true
  let featured = list.filter(p => p.featured);
  // If not enough featured, fill with others, or just show featured? 
  // User said "some image i m not check it for featured product but its show on in fix it". 
  // This implies non-checked products were showing. So we MUST show ONLY checked products if possible, or prioritize them.
  // If we have featured products, let's use them. If 0, fallback to slicing (or show empty?).
  // Let's assume we show ONLY featured products if any exist.
  if (featured.length > 0) {
    list = featured;
  } else {
    list = list.slice(0, 12); // Fallback
  }

  el.innerHTML = list
    .slice(0, 12) // Limit to 12
    .map((p) => {
      const img = resolveImg(p.images?.length ? p.images[0] : null);
      return `
      <div class="product-card">
        <a href="shop.html" class="card-link">
          <img src="${img}" alt="${escapeHtml(p.title)}"/>
          <h4>${escapeHtml(p.title)}</h4>
          <div class="price">${fmtPrice(p.price)}</div>
        </a>
      </div>`;
    })
    .join("");
}

function renderReviews(items) {
  const w = $("#reviewsWrapper");
  if (!w) return;

  w.innerHTML = items
    .map(
      (r) => `
        <div class="swiper-slide">
          <div class="review-card">
            <div class="review-quote">“${escapeHtml(r.text)}”</div>
            <div style="margin-top:14px;font-weight:700;color:var(--accent)">- ${escapeHtml(
        r.name
      )}</div>
          </div>
        </div>`
    )
    .join("");
}

/* CART COUNT */
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("aj_cart") || "[]");
  const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
  const el = $("#cartCount");
  if (el) el.textContent = total;
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* DEMO PRODUCTS IF API EMPTY */
function demoProducts() {
  return [
    { id: "p1", title: "Divine Photo Frame", price: 2700, images: ["images/prod-1.jpg"] },
    { id: "p2", title: "Laxmi Ji Frame", price: 3500, images: ["images/prod-2.jpg"] },
    { id: "p3", title: "Gold Makhanchor", price: 3600, images: ["images/prod-3.jpg"] },
  ];
}
/* ======= Shop page logic (append to app.js) ======= */

(function () {
  // only run on shop page
  if (!document.querySelector('.shop-layout')) return;

  // state
  let shopProducts = [];
  let currentPage = 1;
  const perPage = 12;

  const grid = document.getElementById('productsGrid');
  const resultsText = document.getElementById('resultsText');
  const pager = document.getElementById('pager');
  const sortSelect = document.getElementById('sortSelect');

  // initial fetch
  (async function load() {
    try {
      // Load products
      const res = await fetch(API_BASE + '/products');
      shopProducts = res.ok ? await res.json() : [];

      // Load categories
      const catRes = await fetch(API_BASE + '/categories');
      if (catRes.ok) {
        const cats = await catRes.json();
        renderCategoryFilter(cats);
      }

    } catch (err) {
      console.warn('Shop fetch failed', err);
      shopProducts = [];
    }
    if (!shopProducts || shopProducts.length === 0) shopProducts = demoProductsFull();
    renderGrid();
    setupSidebar();
  })();

  function renderCategoryFilter(cats) {
    const list = document.getElementById('categoryList');
    if (!list) return;
    list.innerHTML = `<li><a href="#" data-cat="" class="active">All Jewelry</a></li>` +
      cats.map(c => `<li><a href="#" data-cat="${c.name.toLowerCase()}">${c.name}</a></li>`).join('');

    // re-attach listeners
    setupSidebar();
  }

  // demo fallback (more items)
  function demoProductsFull() {
    const base = demoProducts();
    // repeat to create more for pagination demo
    const out = [];
    for (let i = 0; i < 6; i++) {
      base.forEach((b, idx) => {
        out.push({
          _id: b.id + '-' + i + '-' + idx,
          title: b.title + (i ? ' ' + (i + 1) : ''),
          price: b.price + i * 100,
          images: b.images
        });
      });
    }
    return out;
  }

  // render filtered + sorted + paginated
  function renderGrid(filters = {}) {
    let list = shopProducts.slice();

    // category filter
    if (filters.category) {
      list = list.filter(p => (p.category && p.category.name ? p.category.name.toLowerCase() : (p.category || '')).includes(filters.category));
    }

    // price filter
    if (filters.priceMin != null) list = list.filter(p => (p.price || 0) >= filters.priceMin);
    if (filters.priceMax != null) list = list.filter(p => (p.price || 0) <= filters.priceMax);

    // sort
    const sort = sortSelect?.value || 'default';
    if (sort === 'price-asc') list.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'price-desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === 'newest') list.reverse();

    // results count
    resultsText.textContent = `Showing ${Math.min(list.length, perPage)} of ${list.length} products`;

    // pagination
    const totalPages = Math.max(1, Math.ceil(list.length / perPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * perPage;
    const pageSlice = list.slice(start, start + perPage);

    grid.innerHTML = pageSlice.map(p => {
      const img = resolveImg((p.images && p.images.length) ? p.images[0] : null);
      return `<div class="product-card">
        <a href="product.html?id=${p._id || p.id}" class="card-link">
          <img src="${img}" alt="${escapeHtml(p.title)}" />
          <h4>${escapeHtml(p.title)}</h4>
          <div class="price">${fmtPrice(p.price || 0)}</div>
        </a>
      </div>`;
    }).join('');

    // render pager
    pager.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === currentPage ? 'active' : '';
      btn.addEventListener('click', () => { currentPage = i; renderGrid(filters); });
      pager.appendChild(btn);
    }
  }

  // sidebar interactions
  function setupSidebar() {
    // category clicks
    document.querySelectorAll('#categoryList a').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const cat = a.getAttribute('data-cat') || '';
        currentPage = 1;
        // empty cat = all
        renderGrid({ category: cat });
      });
    });

    // apply price
    document.getElementById('applyPrice').addEventListener('click', () => {
      const min = Number(document.getElementById('priceMin').value || 0);
      const max = Number(document.getElementById('priceMax').value || 99999999);
      document.getElementById('priceLabel').textContent = `Price: ₹${min.toLocaleString('en-IN')} — ₹${max.toLocaleString('en-IN')} `;
      currentPage = 1;
      renderGrid({ priceMin: min, priceMax: max });
    });

    // clear filters
    document.getElementById('clearFilters').addEventListener('click', () => {
      document.getElementById('priceMin').value = 0;
      document.getElementById('priceMax').value = 500000;
      document.getElementById('priceLabel').textContent = `Price: ₹0 — ₹500,000`;
      currentPage = 1;
      renderGrid({});
    });

    // sort
    sortSelect.addEventListener('change', () => { currentPage = 1; renderGrid({}); });
  }

})();


/* ============================================================
        PRODUCT DETAIL LOGIC
   ============================================================ */
async function loadProductDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const wrap = $("#productDetailWrap");

  if (!id) {
    wrap.innerHTML = "<p>Product not found.</p>";
    return;
  }

  try {
    const res = await fetch(API_BASE + "/products/" + id);
    if (!res.ok) throw new Error("Not found");
    const p = await res.json();

    const img = resolveImg(p.images && p.images.length ? p.images[0] : null);

    wrap.innerHTML = `
        < div class="product-split" >
        <div class="prod-img">
          <img src="${img}" alt="${escapeHtml(p.title)}" />
        </div>
        <div class="prod-info">
          <h1>${escapeHtml(p.title)}</h1>
          <div class="price-lg">${fmtPrice(p.price)}</div>
          <p class="desc">${escapeHtml(p.desc || p.short || "")}</p>
          
          <div class="actions">
            <button class="btn" id="addToCartBtn">Add to Cart</button>
          </div>
          <div id="addMsg" style="margin-top:10px;color:green;display:none">Added to cart!</div>
        </div>
      </div >
        `;

    $("#addToCartBtn").addEventListener("click", () => {
      addToCart(p);
      $("#addMsg").style.display = "block";
      setTimeout(() => ($("#addMsg").style.display = "none"), 2000);
    });

  } catch (err) {
    wrap.innerHTML = "<p>Error loading product or product not found.</p>";
    console.error(err);
  }
}

function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem("aj_cart") || "[]");
  const existing = cart.find((i) => i.id === (product._id || product.id));

  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({
      id: product._id || product.id,
      title: product.title,
      price: product.price,
      image: resolveImg(product.images?.[0] || ""),
      qty: 1,
    });
  }
  localStorage.setItem("aj_cart", JSON.stringify(cart));
  updateCartCount();
}

/* ============================================================
        CART PAGE LOGIC
   ============================================================ */
function loadCartPage() {
  const wrap = $("#cartWrap");
  const cart = JSON.parse(localStorage.getItem("aj_cart") || "[]");

  if (cart.length === 0) {
    wrap.innerHTML = "<p>Your cart is empty. <a href='index.html#shop'>Continue Shopping</a></p>";
    return;
  }

  renderCartItems(cart, wrap);
}

function renderCartItems(cart, wrap) {
  const total = cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);

  let html = `
    <div class="cart-grid">
      <div class="cart-items">
  `;

  cart.forEach((item, idx) => {
    html += `
      <div class="cart-item">
        <img src="${item.image || 'images/placeholder.png'}" width="60">
        <div class="info">
          <h4>${escapeHtml(item.title)}</h4>
          <div>${fmtPrice(item.price)} x ${item.qty}</div>
        </div>
        <div class="controls">
          <button onclick="changeQty(${idx}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${idx}, 1)">+</button>
          <button onclick="removeCartItem(${idx})" class="danger">x</button>
        </div>
      </div>
    `;
  });

  html += `
      </div>
      <div class="cart-summary">
        <h3>Total: ${fmtPrice(total)}</h3>
        <form id="checkoutForm">
          <h4>Checkout Details</h4>
          <input type="text" name="name" placeholder="Full Name" required />
          <input type="text" name="phone" placeholder="Phone Number" required />
          <textarea name="address" placeholder="Delivery Address" required></textarea>
          <button class="btn full">Place Order on WhatsApp</button>
        </form>
      </div>
    </div>
  `;

  wrap.innerHTML = html;

  // Expose helpers globally for inline onclick
  window.changeQty = (idx, delta) => {
    cart[idx].qty += delta;
    if (cart[idx].qty < 1) cart[idx].qty = 1;
    localStorage.setItem("aj_cart", JSON.stringify(cart));
    loadCartPage(); // re-render
    updateCartCount();
  };
  window.removeCartItem = (idx) => {
    cart.splice(idx, 1);
    localStorage.setItem("aj_cart", JSON.stringify(cart));
    loadCartPage();
    updateCartCount();
  };

  // Checkout Handler
  $("#checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    const fd = new FormData(e.target);
    const payload = {
      items: cart,
      total: total,
      customerName: fd.get("name"),
      phone: fd.get("phone"),
      address: fd.get("address"),
    };

    try {
      btn.innerText = "Processing...";
      btn.disabled = true;

      const res = await fetch(API_BASE + "/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        // Clear cart
        localStorage.removeItem("aj_cart");
        updateCartCount();

        // Redirect to WhatsApp
        if (data.whatsappLink) {
          location.href = data.whatsappLink;
        } else {
          alert("Order placed successfully!");
          location.href = "index.html";
        }
      } else {
        alert("Failed to place order. Please try again.");
        btn.disabled = false;
        btn.innerText = "Place Order on WhatsApp";
      }
    } catch (err) {
      console.error(err);
      alert("Error processing order.");
      btn.disabled = false;
    }
  });
}




/* ============================================================
        THEME & ANIMATION LOGIC
   ============================================================ */
function initTheme() {
  const saved = localStorage.getItem("aj_theme") || "light";
  if (saved === "dark") document.body.classList.add("dark-mode");

  // Inject Toggle
  const headerRight = $(".header-right");
  if (headerRight && !$("#themeToggle")) {
    const btn = document.createElement("button");
    btn.id = "themeToggle";
    btn.className = "theme-toggle";
    btn.innerHTML = `<i class="fa ${saved === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;

    // Insert before Cart
    headerRight.insertBefore(btn, headerRight.firstChild);

    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("aj_theme", isDark ? "dark" : "light");
      btn.innerHTML = `<i class="fa ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;
    });
  }
}

function initAnimations() {
  // Auto-tag elements for animation
  const targets = $$(".product-card, .promo, .section-title, .hero p, .hero h1, .review-card, .value-card, .contact-item");
  targets.forEach(el => el.classList.add("reveal"));

  const opts = { threshold: 0.1 };
  window.observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        window.observer.unobserve(entry.target);
      }
    });
  }, opts);

  document.querySelectorAll(".reveal").forEach(el => window.observer.observe(el));

  // Parallax Hero - REMOVED per user request
  /*
  window.addEventListener("scroll", () => {
    const heroImg = $(".hero .swiper-slide-active img");
    if (heroImg) {
      const sc = window.scrollY;
      heroImg.style.transform = `translateY(${sc * 0.3}px)`;
    }
  });
  */
}


/* ============================================================
        ADMIN PANEL CODE (NEW)
   ============================================================ */

/* AUTHORIZED FETCH */
async function adminFetch(url, opts = {}) {
  opts.headers = opts.headers || {};
  const token = localStorage.getItem("aj_token") || null;

  if (token) opts.headers["Authorization"] = "Bearer " + token;

  const res = await fetch(url, opts);

  if (res.status === 401) {
    alert("Session expired — please login again.");
    localStorage.removeItem("aj_token");
    location.href = "admin.html";
    throw new Error("Unauthorized");
  }
  return res;
}

/* SETUP PRODUCT FORM (IMAGE UPLOAD) */
function setupProductForm() {
  const form = $("#productForm");
  const imagesInput = $("#imagesInput");
  const preview = $("#imagesPreview");

  if (!form) return;

  /* IMAGE PREVIEW */
  imagesInput.addEventListener("change", (e) => {
    preview.innerHTML = "";
    const files = Array.from(e.target.files).slice(0, 6);

    files.forEach((file) => {
      const reader = new FileReader();
      const img = document.createElement("img");
      img.style.width = "90px";
      img.style.height = "90px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "6px";
      img.style.border = "1px solid #ddd";

      reader.onload = () => {
        img.src = reader.result;
        preview.appendChild(img);
      };

      reader.readAsDataURL(file);
    });
  });

  /* FORM SUBMIT — UPLOAD TO BACKEND */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    fd.set(
      "featured",
      form.querySelector('input[name="featured"]').checked ? "true" : "false"
    );

    try {
      const res = await adminFetch(API_BASE + "/products", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        alert("Error: " + (err.message || "Unknown"));
        return;
      }

      const product = await res.json();
      alert("Product created: " + product.title);

      form.reset();
      preview.innerHTML = "";

      if (typeof loadAdminData === "function") loadAdminData();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + err.message);
    }
  });
}
