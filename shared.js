/* PrettyPick shared helpers — v13
   Notification system completely removed.
   All other helpers preserved. */

const CART_KEY = 'ss_cart_v1';
const WISHLIST_KEY = 'ss_wishlist_v1';
const APPLIED_COUPON_KEY = 'ss_applied_coupon_v1';

window.__PP_CACHE = window.__PP_CACHE || { products: [], categories: [], subcategories: [], ready: false };

/* ---------- escape ---------- */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- storage ---------- */
const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } };
const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateGlobalBadges(true);
  window.dispatchEvent(new Event('cartUpdated'));
};
const getWishlist = () => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; } catch { return []; } };
const saveWishlist = (w) => {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(w));
  updateGlobalBadges(true);
  window.dispatchEvent(new Event('wishlistUpdated'));
};

const getAppliedCoupon = () => { try { return JSON.parse(localStorage.getItem(APPLIED_COUPON_KEY)) || null; } catch { return null; } };
const saveAppliedCoupon = (coupon) => {
  if (coupon) {
    localStorage.setItem(APPLIED_COUPON_KEY, JSON.stringify(coupon));
  } else {
    localStorage.removeItem(APPLIED_COUPON_KEY);
  }
};

/* ---------- badges ---------- */
function updateGlobalBadges(animate) {
  const cartCount = getCart().reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const wishCount = getWishlist().length;
  document.querySelectorAll('.badge-cart').forEach(el => {
    const prev = el.textContent;
    if (prev !== String(cartCount) && animate) {
      el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
    }
    el.textContent = cartCount;
    if (cartCount === 0) el.setAttribute('data-zero', 'true'); else el.removeAttribute('data-zero');
  });
  document.querySelectorAll('.badge-wishlist').forEach(el => {
    const prev = el.textContent;
    if (prev !== String(wishCount) && animate) {
      el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
    }
    el.textContent = wishCount;
    if (wishCount === 0) el.setAttribute('data-zero', 'true'); else el.removeAttribute('data-zero');
  });
}

/* ---------- toast (premium) ---------- */
let __ppToastContainer = null;
function __ensureToastContainer() {
  if (__ppToastContainer && document.body.contains(__ppToastContainer)) return __ppToastContainer;
  __ppToastContainer = document.createElement('div');
  __ppToastContainer.id = 'pp-toast-container';
  __ppToastContainer.className = 'pp-toast-container';
  __ppToastContainer.setAttribute('aria-live', 'polite');
  __ppToastContainer.setAttribute('aria-atomic', 'false');
  document.body.appendChild(__ppToastContainer);
  return __ppToastContainer;
}
function showToast(message, type = 'info', options = {}) {
  const duration = typeof options.duration === 'number' ? options.duration : 3000;
  const dismissible = options.dismissible !== false;
  const container = __ensureToastContainer();

  const el = document.createElement('div');
  el.className = `pp-toast pp-toast-${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  el.innerHTML = `
    <span class="pp-toast-icon">${icons[type] || icons.info}</span>
    <span class="pp-toast-msg">${escapeHtml(message)}</span>
    ${dismissible ? '<button class="pp-toast-close" aria-label="Dismiss notification" type="button">×</button>' : ''}
  `;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));

  let timer = null;
  const dismiss = () => {
    if (!el.parentNode) return;
    el.classList.remove('visible');
    el.classList.add('leaving');
    setTimeout(() => { if (el.parentNode) el.remove(); }, 260);
  };
  if (duration > 0) timer = setTimeout(dismiss, duration);

  if (dismissible) {
    el.querySelector('.pp-toast-close')?.addEventListener('click', () => {
      clearTimeout(timer);
      dismiss();
    });
  }
  return { dismiss };
}
function showGlobalToast(msg) { showToast(msg, 'info'); }

/* ---------- money (INR) ---------- */
const formatPrice = (n) => {
  const num = Number(n) || 0;
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
};

/* ---------- image URL ---------- */
function normaliseImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim(); if (!t) return '';
  if (/^https?:\/\//i.test(t) || t.startsWith('data:') || t.startsWith('/')) return t;
  return '';
}
function isProbablyImageUrl(url) {
  const u = normaliseImageUrl(url); if (!u) return false;
  return /\.(jpe?g|png|webp|gif|avif|svg)(\?|#|$)/i.test(u) || u.startsWith('data:') || /imgbb|firebasestorage|googleusercontent|cloudinary/i.test(u);
}

/* ---------- image deduplication ---------- */
function getUniqueProductImages(product) {
  if (!product) return [];
  const primary = normaliseImageUrl(product.image);
  const extrasRaw = Array.isArray(product.images) ? product.images : [];
  const extras = extrasRaw.map(normaliseImageUrl).filter(Boolean);

  const seen = new Set();
  const out = [];
  if (primary) { seen.add(primary); out.push(primary); }
  for (const url of extras) {
    if (!seen.has(url)) { seen.add(url); out.push(url); }
  }
  return out;
}

/* ---------- review helpers ---------- */
function averageRating(reviews) {
  if (!Array.isArray(reviews) || !reviews.length) return 0;
  const valid = reviews.filter(r => Number(r.rating) >= 1 && Number(r.rating) <= 5);
  if (!valid.length) return 0;
  const sum = valid.reduce((s, r) => s + Number(r.rating), 0);
  return sum / valid.length;
}
function renderStars(rating) {
  const r = Math.round(Number(rating) || 0);
  let out = '';
  for (let i = 1; i <= 5; i++) {
    out += `<svg width="14" height="14" viewBox="0 0 24 24" fill="${i <= r ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6" aria-hidden="true" style="color:var(--gold);display:inline-block;vertical-align:middle"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  return out;
}

/* ---------- product cache ---------- */
function getProductById(id) {
  if (!id) return null;
  return window.__PP_CACHE.products.find(p => p.id === id) || null;
}

function normalizeProduct(doc) {
  const d = doc.data ? doc.data() : doc;
  const id = doc.id || d.id;
  const image = normaliseImageUrl(d.image) || '';
  const rawImages = Array.isArray(d.images) ? d.images : [];
  const uniqueImages = getUniqueProductImages({ image, images: rawImages });
  return {
    id, name: d.name || 'Untitled', description: d.description || '',
    price: Number(d.price) || 0, oldPrice: d.oldPrice != null ? Number(d.oldPrice) : null,
    image, images: uniqueImages,
    categoryId: d.categoryId || '', categoryName: d.categoryName || '',
    subcategoryId: d.subcategoryId || '', subcategoryName: d.subcategoryName || '',
    stock: Number(d.stock) || 0, active: d.active !== false,
    featured: d.featured === true,
    shippingCharge: d.shippingCharge != null ? Number(d.shippingCharge) : null,
    freeShipping: d.freeShipping === true
  };
}

/* ---------- product card ---------- */
function createProductCard(product) {
  const p = product.image !== undefined ? product : normalizeProduct(product);
  const isWished = getWishlist().includes(p.id);
  const discount = (p.oldPrice && p.oldPrice > p.price)
    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
  const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="480"><rect width="400" height="480" fill="%23F7F1E6"/><text x="200" y="250" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%237A746A">No image</text></svg>';
  const imgSrc = isProbablyImageUrl(p.image) ? p.image : fallback;
  const imgAlt = p.name ? `${p.name} — PrettyPick` : 'PrettyPick product image';
  const productUrl = `product.html?id=${encodeURIComponent(p.id)}`;
  const isOut = p.stock <= 0;

  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-img-wrapper" data-nav="${productUrl}">
      <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(imgAlt)}" class="product-img" loading="lazy" decoding="async" width="400" height="472"
           onerror="this.onerror=null;this.src='${fallback}';">
      ${discount > 0 ? `<span class="badge-discount">-${discount}%</span>` : ''}
      ${isOut ? `<span class="badge-outofstock">Out of Stock</span>` : ''}
      <button class="wishlist-btn ${isWished ? 'active' : ''}" data-id="${escapeHtml(p.id)}" aria-label="${isWished ? 'Remove from wishlist' : 'Add to wishlist'}" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isWished ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
      <button class="cart-btn" data-id="${escapeHtml(p.id)}" aria-label="Add to cart" type="button" ${isOut ? 'disabled' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      </button>
    </div>
    <div class="product-info">
      <span class="product-category">${escapeHtml(p.categoryName || 'Accessory')}</span>
      <h3 class="product-name" data-nav="${productUrl}">${escapeHtml(p.name)}</h3>
      <div class="product-price-row">
        <span class="product-price">${formatPrice(p.price)}</span>
        ${p.oldPrice ? `<span class="product-original-price">${formatPrice(p.oldPrice)}</span>` : ''}
      </div>
      <button class="inquire-btn" data-id="${escapeHtml(p.id)}" data-nav="${productUrl}" ${isOut ? 'disabled' : ''} type="button" aria-label="View ${escapeHtml(p.name)} details">
        <span>${isOut ? 'Out of Stock' : 'Inquire Now'}</span>
        ${!isOut ? `<svg class="arrow" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>` : ''}
      </button>
    </div>`;
  return card;
}

/* ---------- coupon helpers ---------- */
function calculateCouponDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.discountType === 'percentage') {
    let discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    return Math.round(discount * 100) / 100;
  } else {
    return Math.min(coupon.discountValue, subtotal);
  }
}

function isCouponExpired(coupon) {
  if (!coupon) return true;
  const now = new Date();
  if (coupon.expiryDate) {
    const expiry = coupon.expiryDate.toDate ? coupon.expiryDate.toDate() : new Date(coupon.expiryDate);
    if (now > expiry) return true;
  }
  if (coupon.startDate) {
    const start = coupon.startDate.toDate ? coupon.startDate.toDate() : new Date(coupon.startDate);
    if (now < start) return true;
  }
  return false;
}

function validateCoupon(coupon, subtotal, userUsageCount = 0) {
  if (!coupon) return { valid: false, error: 'Invalid coupon code.' };
  if (coupon.active === false) return { valid: false, error: 'This coupon is no longer active.' };
  if (isCouponExpired(coupon)) return { valid: false, error: 'This coupon has expired.' };
  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return { valid: false, error: `Minimum order value of ${formatPrice(coupon.minOrderValue)} required.` };
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: 'This coupon has reached its usage limit.' };
  }
  const perUserLimit = coupon.perUserLimit || 1;
  if (userUsageCount >= perUserLimit) {
    return { valid: false, error: 'You have already used this coupon.' };
  }
  return { valid: true, error: null };
}

/* ---------- shipping helpers ---------- */
function calculateShipping(items, globalShipping = 0, freeShippingThreshold = 0) {
  let totalShipping = 0;
  let subtotal = 0;

  for (const item of items) {
    const prod = getProductById(item.id);
    if (!prod) continue;
    subtotal += prod.price * item.qty;

    if (prod.freeShipping) {
      continue;
    }

    if (prod.shippingCharge != null && prod.shippingCharge >= 0) {
      totalShipping += prod.shippingCharge * item.qty;
    } else {
      totalShipping += globalShipping * item.qty;
    }
  }

  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
    totalShipping = 0;
  }

  return { shipping: totalShipping, subtotal };
}

/* ---------- global event delegation ---------- */
if (!window.__PP_EVENTS_BOUND) {
  window.__PP_EVENTS_BOUND = true;

  document.addEventListener('click', (e) => {
    const wishBtn = e.target.closest('.wishlist-btn');
    if (wishBtn) {
      e.preventDefault(); e.stopPropagation();
      const id = wishBtn.dataset.id;
      let list = getWishlist();
      if (list.includes(id)) {
        list = list.filter(x => x !== id);
        wishBtn.classList.remove('active');
        wishBtn.querySelector('svg')?.setAttribute('fill', 'none');
        wishBtn.setAttribute('aria-label', 'Add to wishlist');
        showToast('Removed from wishlist', 'info');
      } else {
        list.push(id);
        wishBtn.classList.add('active');
        wishBtn.querySelector('svg')?.setAttribute('fill', 'currentColor');
        wishBtn.setAttribute('aria-label', 'Remove from wishlist');
        showToast('Added to wishlist', 'success');
      }
      saveWishlist(list);
      return;
    }

    const cartBtn = e.target.closest('.cart-btn');
    if (cartBtn && !cartBtn.disabled) {
      e.preventDefault(); e.stopPropagation();
      const id = cartBtn.dataset.id;
      const prod = getProductById(id);
      if (!prod) { showToast('Product not available', 'error'); return; }
      if (prod.stock <= 0) { showToast('Out of stock', 'warning'); return; }
      const cart = getCart();
      const existing = cart.find(i => i.id === id);
      if (existing) {
        if (existing.qty >= prod.stock) { showToast('Stock limit reached', 'warning'); return; }
        existing.qty++;
      } else cart.push({ id, qty: 1 });
      saveCart(cart);
      showToast('Added to cart', 'success');
      return;
    }

    const inquireBtn = e.target.closest('.inquire-btn');
    if (inquireBtn) {
      e.preventDefault(); e.stopPropagation();
      if (inquireBtn.disabled) return;
      const id = inquireBtn.dataset.id;
      if (id) window.location.href = `product.html?id=${encodeURIComponent(id)}`;
      return;
    }

    const navEl = e.target.closest('[data-nav]');
    if (navEl && !e.target.closest('button')) {
      window.location.href = navEl.dataset.nav;
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY || e.key === WISHLIST_KEY) updateGlobalBadges(true);
  });
}

/* ---------- welcome splash ---------- */
function showWelcomeSplash() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (sessionStorage.getItem('pp_welcome_seen') === '1') return;
  sessionStorage.setItem('pp_welcome_seen', '1');

  const wrap = document.createElement('div');
  wrap.className = 'pp-welcome';
  wrap.innerHTML = `
    <img class="wl-logo" src="logo.png" alt="PrettyPick">
    <div class="wl-line"></div>
    <div class="wl-text">Welcome to PrettyPick</div>
  `;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('visible'));
  setTimeout(() => {
    wrap.classList.add('fade-out');
    setTimeout(() => wrap.remove(), 500);
  }, 1500);
}

/* ---------- helpers for categories ---------- */
function groupSubcategories(categories, subcategories) {
  const map = new Map();
  (categories || []).forEach(c => map.set(c.id, []));
  (subcategories || []).forEach(s => {
    if (!s.categoryId) return;
    if (!map.has(s.categoryId)) map.set(s.categoryId, []);
    map.get(s.categoryId).push(s);
  });
  map.forEach(arr => arr.sort((a, b) => (a.order || 0) - (b.order || 0)));
  return map;
}

function sortCategories(cats) {
  return (cats || []).filter(c => c.active !== false)
    .slice()
    .sort((a, b) => {
      const ao = Number(a.order) || 0;
      const bo = Number(b.order) || 0;
      if (ao !== bo) return ao - bo;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
}

/* ---------- header / drawer ---------- */
function initHeader() {
  const root = document.getElementById('pp-nav-root');
  if (!root) return;
  const currentPath = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isHome = currentPath === 'index.html' || currentPath === '';

  root.innerHTML = `
    <div class="nav-left">
      <button class="icon-btn hamburger" id="pp-hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="pp-drawer">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
      </button>
      <a href="index.html" aria-label="PrettyPick home"><img src="logo.png" alt="PrettyPick Logo" id="brand-logo"></a>
      <nav class="desktop-nav" aria-label="Primary">
        <a href="index.html" ${isHome ? 'aria-current="page"' : ''}>Home</a>
        <div class="dropdown" data-dropdown="categories">
          <button type="button" aria-haspopup="true" aria-expanded="false" id="pp-cat-toggle">
            Categories
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="dropdown-menu" role="menu" id="pp-cat-menu" aria-labelledby="pp-cat-toggle"></div>
        </div>
        <a href="wishlist.html">Wishlist</a>
        <a href="cart.html">Cart</a>
      </nav>
    </div>
    <div class="nav-right">
      <a href="wishlist.html" class="icon-btn badge-container" aria-label="Wishlist">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="badge badge-wishlist" data-zero="true">0</span>
      </a>
      <a href="cart.html" class="icon-btn badge-container" aria-label="Cart">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <span class="badge badge-cart" data-zero="true">0</span>
      </a>
      <a href="account.html" class="icon-btn" id="pp-account-icon" aria-label="Account">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </a>
      <a href="admin.html" id="pp-admin-link" class="btn btn-outline btn-sm hidden" aria-label="Admin Dashboard">Admin</a>
    </div>
  `;

  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (!document.getElementById('pp-drawer')) {
    const backdrop = document.createElement('div');
    backdrop.className = 'pp-backdrop'; backdrop.id = 'pp-backdrop';
    document.body.appendChild(backdrop);

    const drawer = document.createElement('aside');
    drawer.className = 'pp-drawer'; drawer.id = 'pp-drawer';
    drawer.setAttribute('aria-label', 'Main menu');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
      <div class="drawer-header">
        <a href="index.html" aria-label="PrettyPick home">
          <img src="logo.png" alt="PrettyPick Logo" class="drawer-logo">
        </a>
        <button class="icon-btn" id="pp-drawer-close" aria-label="Close menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <a href="index.html">Home</a>
      <div class="drawer-section">Categories</div>
      <div class="drawer-sub" id="pp-drawer-cats"></div>
      <div class="drawer-section">Shop</div>
      <a href="wishlist.html">Wishlist</a>
      <a href="cart.html">Cart</a>
      <a href="account.html">My Account</a>
      <a href="account.html#tab-orders">My Orders</a>
      <a href="admin.html" id="pp-drawer-admin" class="hidden">Admin Dashboard</a>
      <div class="drawer-section">Info</div>
      <a href="privacy.html">Privacy Policy</a>
      <a href="terms.html">Terms</a>
      <a href="refund.html">Refund Policy</a>
    `;
    document.body.appendChild(drawer);

    const openDrawer = () => {
      drawer.classList.add('open'); backdrop.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      document.getElementById('pp-hamburger').setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      setTimeout(() => document.getElementById('pp-drawer-close').focus(), 60);
    };
    const closeDrawer = () => {
      drawer.classList.remove('open'); backdrop.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      document.getElementById('pp-hamburger').setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    document.getElementById('pp-hamburger').addEventListener('click', openDrawer);
    document.getElementById('pp-drawer-close').addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });
  }

  const catToggle = document.getElementById('pp-cat-toggle');
  const catDropdown = document.querySelector('.desktop-nav .dropdown');
  if (catToggle && catDropdown) {
    catToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = catDropdown.classList.toggle('open');
      catToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.desktop-nav .dropdown')) {
        catDropdown.classList.remove('open');
        catToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        catDropdown.classList.remove('open');
        catToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

function populateNavCategories(categories, subcategories) {
  const menu = document.getElementById('pp-cat-menu');
  const drawerCats = document.getElementById('pp-drawer-cats');
  if (!menu || !drawerCats) return;

  const list = sortCategories(categories);
  const subMap = groupSubcategories(categories, subcategories);

  if (!list.length) {
    menu.innerHTML = '<a href="index.html#categories" role="menuitem">All Categories</a>';
    drawerCats.innerHTML = '<a href="index.html#categories">All Categories</a>';
    return;
  }

  menu.innerHTML = list.map(c => {
    const subs = (subMap.get(c.id) || []).filter(s => s.active !== false);
    if (!subs.length) {
      return `<a href="index.html?category=${encodeURIComponent(c.id)}#trending" role="menuitem">${escapeHtml(c.name)}</a>`;
    }
    return `
      <div class="nav-cat" data-cat-id="${escapeHtml(c.id)}">
        <button type="button" class="nav-cat-toggle" aria-expanded="false">
          <span>${escapeHtml(c.name)}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="nav-cat-sub" role="group">
          <a href="index.html?category=${encodeURIComponent(c.id)}#trending">All ${escapeHtml(c.name)}</a>
          ${subs.map(s => `<a href="index.html?category=${encodeURIComponent(c.id)}&sub=${encodeURIComponent(s.id)}#trending">${escapeHtml(s.name)}</a>`).join('')}
        </div>
      </div>`;
  }).join('');

  drawerCats.innerHTML = list.map(c => {
    const subs = (subMap.get(c.id) || []).filter(s => s.active !== false);
    if (!subs.length) {
      return `<a href="index.html?category=${encodeURIComponent(c.id)}#trending">${escapeHtml(c.name)}</a>`;
    }
    return `
      <div class="drawer-cat" data-cat-id="${escapeHtml(c.id)}">
        <button type="button" class="drawer-cat-toggle" aria-expanded="false">
          <span>${escapeHtml(c.name)}</span>
          <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
                <div class="drawer-cat-sub" role="group">
          <a href="index.html?category=${encodeURIComponent(c.id)}#trending">All ${escapeHtml(c.name)}</a>
          ${subs.map(s => `<a href="index.html?category=${encodeURIComponent(c.id)}&sub=${encodeURIComponent(s.id)}#trending">${escapeHtml(s.name)}</a>`).join('')}
        </div>
      </div>`;
  }).join('');

  menu.querySelectorAll('.nav-cat-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = btn.closest('.nav-cat');
      const wasOpen = parent.classList.contains('open');
      menu.querySelectorAll('.nav-cat').forEach(c => {
        c.classList.remove('open');
        c.querySelector('.nav-cat-toggle')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        parent.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  drawerCats.querySelectorAll('.drawer-cat-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = btn.closest('.drawer-cat');
      const wasOpen = parent.classList.contains('open');
      drawerCats.querySelectorAll('.drawer-cat').forEach(c => {
        c.classList.remove('open');
        c.querySelector('.drawer-cat-toggle')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        parent.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ---------- footer ---------- */
function initFooter(categories, subcategories) {
  const root = document.getElementById('pp-footer-root');
  if (!root) return;

  const list = sortCategories(categories);
  const subMap = groupSubcategories(categories, subcategories);

  const categoryGroupsHtml = list.map(c => {
    const subs = (subMap.get(c.id) || []).filter(s => s.active !== false);
    if (!subs.length) {
      return `<li><a href="index.html?category=${encodeURIComponent(c.id)}#trending">${escapeHtml(c.name)}</a></li>`;
    }
    return `
      <li class="footer-cat" data-cat-id="${escapeHtml(c.id)}">
        <button type="button" class="footer-cat-toggle" aria-expanded="false">
          <span>${escapeHtml(c.name)}</span>
          <svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="footer-cat-sub" role="group">
          <a href="index.html?category=${encodeURIComponent(c.id)}#trending">All ${escapeHtml(c.name)}</a>
          ${subs.map(s => `<a href="index.html?category=${encodeURIComponent(c.id)}&sub=${encodeURIComponent(s.id)}#trending">${escapeHtml(s.name)}</a>`).join('')}
        </div>
      </li>`;
  }).join('');

  root.className = 'site-footer';
  root.innerHTML = `
    <div class="footer-container">
      <div class="footer-brand">
        <h3>PrettyPick</h3>
        <p>Curated premium accessories for every style and occasion. Quality you can feel.</p>
        <div class="social-icons" aria-label="Social">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
        </div>
      </div>
      <div class="footer-col">
        <button type="button" class="footer-accordion-toggle" aria-expanded="false" aria-controls="pp-f-col-shop">
          Shop
          <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="footer-accordion-panel" id="pp-f-col-shop">
          <ul class="footer-cat-list">
            <li><a href="index.html#categories">All Categories</a></li>
            <li><a href="index.html#trending">Trending</a></li>
            <li><a href="wishlist.html">Wishlist</a></li>
            <li><a href="cart.html">Cart</a></li>
            ${categoryGroupsHtml}
          </ul>
        </div>
      </div>
      <div class="footer-col">
        <button type="button" class="footer-accordion-toggle" aria-expanded="false" aria-controls="pp-f-col-support">
          Support
          <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="footer-accordion-panel" id="pp-f-col-support">
          <ul>
            <li><a href="privacy.html">Privacy Policy</a></li>
            <li><a href="terms.html">Terms &amp; Conditions</a></li>
            <li><a href="refund.html">Refund Policy</a></li>
            <li><a href="account.html">My Account</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-col">
        <button type="button" class="footer-accordion-toggle" aria-expanded="false" aria-controls="pp-f-col-contact">
          Contact
          <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="footer-accordion-panel" id="pp-f-col-contact">
          <ul id="pp-footer-auth-links">
            <li><a href="mailto:support@prettypick.com">support@prettypick.com</a></li>
            <li><a href="login.html">Sign in</a></li>
            <li><a href="signup.html">Create account</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span id="pp-footer-year">${new Date().getFullYear()}</span> PrettyPick. All rights reserved.</p>
      <p class="footer-credit">Created by Farhan Khan</p>
    </div>
  `;

  root.querySelectorAll('.footer-accordion-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      root.querySelectorAll('.footer-accordion-toggle').forEach(other => {
        if (other === btn) return;
        other.setAttribute('aria-expanded', 'false');
        const p = document.getElementById(other.getAttribute('aria-controls'));
        if (p) p.classList.remove('open');
      });
      btn.setAttribute('aria-expanded', String(!expanded));
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.classList.toggle('open', !expanded);
    });
  });

  root.querySelectorAll('.footer-cat-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = btn.closest('.footer-cat');
      const wasOpen = parent.classList.contains('open');
      root.querySelectorAll('.footer-cat').forEach(c => {
        c.classList.remove('open');
        c.querySelector('.footer-cat-toggle')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        parent.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

function renderFooterAuthLinks(user) {
  const ul = document.getElementById('pp-footer-auth-links');
  if (!ul) return;
  const contactEmail = `<li><a href="mailto:support@prettypick.com">support@prettypick.com</a></li>`;
  if (user) {
    ul.innerHTML = `
      ${contactEmail}
      <li><a href="account.html">My Account</a></li>
      <li><a href="account.html#tab-orders">My Orders</a></li>
    `;
  } else {
    ul.innerHTML = `
      ${contactEmail}
      <li><a href="login.html">Sign in</a></li>
      <li><a href="signup.html">Create account</a></li>
    `;
  }
}

async function syncAuthUI() {
  try {
    const { auth, db } = await import('./firebase-config.js');
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js');
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js');
    onAuthStateChanged(auth, async (user) => {
      const icon = document.getElementById('pp-account-icon');
      const adminLink = document.getElementById('pp-admin-link');
      const drawerAdmin = document.getElementById('pp-drawer-admin');
      if (!icon) return;

      renderFooterAuthLinks(user);

      if (user) {
        const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
        icon.href = 'account.html';
        icon.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--gold) 0%,var(--gold-2) 100%);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;font-family:var(--font-serif);">${initial}</div>`;
        try {
          const s = await getDoc(doc(db, 'users', user.uid));
          if (s.exists() && s.data().role === 'admin' && user.emailVerified) {
            adminLink?.classList.remove('hidden');
            drawerAdmin?.classList.remove('hidden');
          }
        } catch (e) {
          console.warn('Admin check failed:', e?.code || e?.message);
        }
      } else {
        icon.href = 'login.html';
        icon.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        adminLink?.classList.add('hidden');
        drawerAdmin?.classList.add('hidden');
      }
    });
  } catch (e) {
    console.warn('Auth UI sync failed:', e?.message);
  }
}

async function loadNavDataForHeader() {
  let cats = [], subs = [];
  try {
    const { db } = await import('./firebase-config.js');
    const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js');
    const [cSnap, sSnap] = await Promise.all([
      getDocs(query(collection(db, 'categories'), where('active', '==', true))),
      getDocs(collection(db, 'subcategories'))
    ]);
    cats = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    subs = sSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.active !== false);
  } catch (e) {
    console.warn('Nav categories load failed:', e?.code || e?.message);
  }
  populateNavCategories(cats, subs);
  initFooter(cats, subs);
  try {
    const { auth } = await import('./firebase-config.js');
    renderFooterAuthLinks(auth.currentUser);
  } catch (_) {}
}

/* ---------- motion helpers ---------- */
function triggerEntryAnimation() {
  document.body.classList.add('pp-anim-init');
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('pp-entered')));
}

function initRevealObserver() {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-reveal],[data-reveal-stagger]').forEach(el => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('revealed'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal],[data-reveal-stagger]').forEach(el => io.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  showWelcomeSplash();
  triggerEntryAnimation();
  initHeader();
  syncAuthUI();
  updateGlobalBadges(false);
  initRevealObserver();
  loadNavDataForHeader();
});