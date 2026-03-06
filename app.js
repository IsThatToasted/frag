const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('fragranceCart') || '[]'),
  filters: {
    collection: 'All',
    style: null,
    search: '',
    sort: 'featured',
  },
};

const els = {
  productGrid: document.getElementById('productGrid'),
  productCardTemplate: document.getElementById('productCardTemplate'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  resultsText: document.getElementById('resultsText'),
  cartButton: document.getElementById('cartButton'),
  cartCount: document.getElementById('cartCount'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartOverlay: document.getElementById('cartOverlay'),
  closeCart: document.getElementById('closeCart'),
  cartItems: document.getElementById('cartItems'),
  cartSubtotal: document.getElementById('cartSubtotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  filterChips: () => Array.from(document.querySelectorAll('.filter-chip')),
};

async function init() {
  bindEvents();
  await loadProducts();
  renderProducts();
  renderCart();
}

function bindEvents() {
  els.searchInput.addEventListener('input', (e) => {
    state.filters.search = e.target.value.trim().toLowerCase();
    renderProducts();
  });

  els.sortSelect.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    renderProducts();
  });

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (chip) {
      const type = chip.dataset.filterType;
      const value = chip.dataset.filterValue;
      handleFilterChip(type, value, chip);
    }

    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      addToCart(addBtn.dataset.productId);
    }

    const qtyBtn = e.target.closest('.qty-btn');
    if (qtyBtn) {
      const id = qtyBtn.dataset.productId;
      const delta = Number(qtyBtn.dataset.delta || 0);
      updateQty(id, delta);
    }

    const removeBtn = e.target.closest('.remove-btn');
    if (removeBtn) {
      removeFromCart(removeBtn.dataset.productId);
    }
  });

  els.cartButton.addEventListener('click', openCart);
  els.cartOverlay.addEventListener('click', closeCart);
  els.closeCart.addEventListener('click', closeCart);

  els.checkoutBtn.addEventListener('click', () => {
    alert('Static demo checkout. Replace this with your real checkout integration later.');
  });
}

async function loadProducts() {
  try {
    const res = await fetch('products.json');
    state.products = await res.json();
  } catch (err) {
    console.error(err);
    els.productGrid.innerHTML = '<div class="empty-state">Could not load <code>products.json</code>. Make sure the file exists in the same folder as the site.</div>';
  }
}

function handleFilterChip(type, value, clickedChip) {
  if (type === 'collection') {
    state.filters.collection = value;
    document.querySelectorAll('[data-filter-type="collection"]').forEach((chip) => chip.classList.remove('active'));
    clickedChip.classList.add('active');
  } else if (type === 'style') {
    const currentlyActive = clickedChip.classList.contains('active');
    document.querySelectorAll('[data-filter-type="style"]').forEach((chip) => chip.classList.remove('active'));
    state.filters.style = currentlyActive ? null : value;
    if (!currentlyActive) clickedChip.classList.add('active');
  }
  renderProducts();
}

function getFilteredProducts() {
  let items = [...state.products];

  if (state.filters.collection !== 'All') {
    items = items.filter((p) => p.collection === state.filters.collection);
  }

  if (state.filters.style) {
    items = items.filter((p) => (p.styleTags || []).includes(state.filters.style));
  }

  if (state.filters.search) {
    items = items.filter((p) => {
      const haystack = [
        p.name,
        p.brand,
        p.collection,
        p.notes,
        ...(p.styleTags || []),
      ].join(' ').toLowerCase();
      return haystack.includes(state.filters.search);
    });
  }

  switch (state.filters.sort) {
    case 'price-asc':
      items.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      items.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      items.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      items.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
      break;
  }

  return items;
}

function renderProducts() {
  const items = getFilteredProducts();
  els.resultsText.textContent = `${items.length} fragrance${items.length === 1 ? '' : 's'} shown`;

  if (!items.length) {
    els.productGrid.innerHTML = '<div class="empty-state">No fragrances match the current filters.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const product of items) {
    const node = els.productCardTemplate.content.firstElementChild.cloneNode(true);

    const img = node.querySelector('.product-image');
    const badge = node.querySelector('.product-badge');
    const brand = node.querySelector('.product-brand');
    const name = node.querySelector('.product-name');
    const notes = node.querySelector('.product-notes');
    const size = node.querySelector('.product-size');
    const price = node.querySelector('.product-price');
    const btn = node.querySelector('.add-to-cart-btn');

    img.src = product.image;
    img.alt = product.name;
    brand.textContent = product.brand;
    name.textContent = product.name;
    notes.textContent = product.notes;
    size.textContent = product.size;
    price.textContent = money(product.price);
    btn.dataset.productId = product.id;

    if (product.badge) {
      badge.textContent = product.badge;
      badge.classList.add('show');
    }

    fragment.appendChild(node);
  }

  els.productGrid.innerHTML = '';
  els.productGrid.appendChild(fragment);
}

function addToCart(productId) {
  const found = state.cart.find((item) => item.id === productId);
  if (found) {
    found.qty += 1;
  } else {
    state.cart.push({ id: productId, qty: 1 });
  }
  persistCart();
  renderCart();
  openCart();
}

function updateQty(productId, delta) {
  const found = state.cart.find((item) => item.id === productId);
  if (!found) return;
  found.qty += delta;
  if (found.qty <= 0) {
    state.cart = state.cart.filter((item) => item.id !== productId);
  }
  persistCart();
  renderCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.id !== productId);
  persistCart();
  renderCart();
}

function renderCart() {
  const expanded = state.cart.map((item) => {
    const product = state.products.find((p) => p.id === item.id);
    return product ? { ...product, qty: item.qty } : null;
  }).filter(Boolean);

  const totalQty = expanded.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = expanded.reduce((sum, item) => sum + item.qty * item.price, 0);

  els.cartCount.textContent = totalQty;
  els.cartSubtotal.textContent = money(subtotal);

  if (!expanded.length) {
    els.cartItems.innerHTML = '<div class="empty-state">Your cart is empty.</div>';
    return;
  }

  els.cartItems.innerHTML = expanded.map((item) => `
    <article class="cart-item">
      <img class="cart-thumb" src="${item.image}" alt="${item.name}">
      <div>
        <h4>${item.name}</h4>
        <p>${item.size} · ${money(item.price)}</p>
        <div class="qty-wrap">
          <button class="qty-btn" data-product-id="${item.id}" data-delta="-1" type="button">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-product-id="${item.id}" data-delta="1" type="button">+</button>
        </div>
      </div>
      <button class="remove-btn" data-product-id="${item.id}" type="button">Remove</button>
    </article>
  `).join('');
}

function persistCart() {
  localStorage.setItem('fragranceCart', JSON.stringify(state.cart));
}

function openCart() {
  els.cartDrawer.classList.add('open');
  els.cartDrawer.setAttribute('aria-hidden', 'false');
}

function closeCart() {
  els.cartDrawer.classList.remove('open');
  els.cartDrawer.setAttribute('aria-hidden', 'true');
}

function money(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

init();
