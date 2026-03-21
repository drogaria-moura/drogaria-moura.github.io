// ===== CONFIGURAÇÃO FIREBASE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, getDocs, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbdRea1buoftYzpBP8QCs",
  authDomain: "drogaria-moura-c7bcc.firebaseapp.com",
  projectId: "drogaria-moura-c7bcc",
  storageBucket: "drogaria-moura-c7bcc.appspot.com",
  messagingSenderId: "632310446528",
  appId: "1:632310446528:web:bc5081469",
  measurementId: "G-SX0TTBLZTT"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ===== CONFIGURAÇÃO FIXA =====
const WHATSAPP_FIXO = "5511999999999"; // ← ALTERE PARA O NÚMERO REAL DA DROGARIA
const VALOR_MINIMO_ENTREGA = 25.00;

const DEFAULT_PRODUCTS = [
  { id: 1, nome: "Dipirona 500mg", descricao: "Analgésico e antitérmico 20 comprimidos", preco: 5.90, categoria: "Medicamentos", emoji: "💊", status: "ativo", promo: false, estoque: 50 },
  { id: 2, nome: "Paracetamol 750mg", descricao: "Alívio de dores e febre 20 comprimidos", preco: 7.50, categoria: "Medicamentos", emoji: "💊", status: "ativo", promo: true, estoque: 40 },
  { id: 3, nome: "Ibuprofeno 400mg", descricao: "Anti-inflamatório 20 comprimidos", preco: 12.90, categoria: "Medicamentos", emoji: "💊", status: "ativo", promo: false, estoque: 30 },
  { id: 4, nome: "Vitamina C 1000mg", descricao: "Efervescente sabor laranja 10 comprimidos", preco: 18.90, categoria: "Vitaminas", emoji: "🍊", status: "ativo", promo: true, estoque: 25 },
  { id: 5, nome: "Vitamina D3 2000UI", descricao: "Suporte imunológico 60 cápsulas", preco: 29.90, categoria: "Vitaminas", emoji: "☀️", status: "ativo", promo: false, estoque: 20 },
  { id: 6, nome: "Complexo B", descricao: "Vitaminas do complexo B 60 comprimidos", preco: 22.90, categoria: "Vitaminas", emoji: "🌿", status: "ativo", promo: false, estoque: 15 },
  { id: 7, nome: "Fralda Pampers M", descricao: "Pacote com 30 unidades tamanho M", preco: 49.90, categoria: "Higiene Infantil", emoji: "👶", status: "ativo", promo: false, estoque: 10 },
  { id: 8, nome: "Shampoo Infantil", descricao: "Fórmula suave sem lágrimas 200ml", preco: 16.90, categoria: "Higiene Infantil", emoji: "🧴", status: "ativo", promo: true, estoque: 18 },
  { id: 9, nome: "Pomada Hipoglós", descricao: "Proteção para assaduras 60g", preco: 14.50, categoria: "Higiene Infantil", emoji: "🧴", status: "ativo", promo: false, estoque: 22 },
  { id: 10, nome: "Álcool Gel 70%", descricao: "Antisséptico higienizador 500ml", preco: 8.90, categoria: "Promoções", emoji: "🧴", status: "ativo", promo: true, estoque: 35 },
  { id: 11, nome: "Protetor Solar FPS50", descricao: "Proteção solar corporal 120ml", preco: 35.90, categoria: "Promoções", emoji: "☀️", status: "ativo", promo: true, estoque: 12 },
  { id: 12, nome: "Omega 3 1000mg", descricao: "Ácidos graxos essenciais 60 cápsulas", preco: 42.90, categoria: "Vitaminas", emoji: "🐟", status: "ativo", promo: false, estoque: 8 },
];

const DEFAULT_CATEGORIES = [
  { id: 1, nome: "Medicamentos", emoji: "💊" },
  { id: 2, nome: "Vitaminas", emoji: "🍊" },
  { id: 3, nome: "Higiene Infantil", emoji: "👶" },
  { id: 4, nome: "Promoções", emoji: "🔥" },
];

const DEFAULT_CONFIG = {
  nome_loja: "Drogaria Moura",
  mensagem_padrao: "Olá Drogaria Moura!\n\nPEDIDO:\n{produtos}\n\nTOTAL: R$ {total}\n\nFORMA DE PAGAMENTO: {pagamento}{troco}\n\nCLIENTE: {nome}\nTELEFONE: {telefone}\nENDEREÇO: {endereco}"
};

// ===== STATE =====
let cart = [];
let currentCategory = "Todos";
let searchQuery = "";
let cachedProducts = null;
let cachedCategories = null;
let cachedConfig = null;

// ===== FIREBASE: INICIALIZAR DADOS PADRÃO SE VAZIO =====
async function initFirebaseData() {
  try {
    // Verifica se já tem produtos
    const prodSnap = await getDocs(collection(db, "produtos"));
    if (prodSnap.empty) {
      for (const p of DEFAULT_PRODUCTS) {
        await setDoc(doc(db, "produtos", String(p.id)), p);
      }
    }

    // Verifica se já tem categorias
    const catSnap = await getDocs(collection(db, "categorias"));
    if (catSnap.empty) {
      for (const c of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, "categorias", String(c.id)), c);
      }
    }

    // Verifica se já tem config
    const cfgSnap = await getDoc(doc(db, "config", "geral"));
    if (!cfgSnap.exists()) {
      await setDoc(doc(db, "config", "geral"), DEFAULT_CONFIG);
    }
  } catch (e) {
    console.error("Erro ao inicializar dados:", e);
  }
}

// ===== FIREBASE: LISTENERS EM TEMPO REAL =====
function listenToData() {
  // Produtos
  onSnapshot(collection(db, "produtos"), (snap) => {
    cachedProducts = snap.docs.map(d => d.data());
    renderCategories();
    renderProducts();
  });

  // Categorias
  onSnapshot(collection(db, "categorias"), (snap) => {
    cachedCategories = snap.docs.map(d => d.data());
    renderCategories();
    renderProducts();
  });

  // Config
  onSnapshot(doc(db, "config", "geral"), (snap) => {
    if (snap.exists()) {
      cachedConfig = snap.data();
      document.title = cachedConfig.nome_loja || "Drogaria Moura";
    }
  });
}

function getProducts() {
  return cachedProducts || DEFAULT_PRODUCTS;
}

function getCategories() {
  return cachedCategories || DEFAULT_CATEGORIES;
}

function getConfig() {
  return cachedConfig || DEFAULT_CONFIG;
}

// ===== CATEGORIES =====
function renderCategories() {
  const categories = getCategories();
  const scroll = document.getElementById('categoriesScroll');
  if (!scroll) return;

  const allBtn = `<button class="cat-btn ${currentCategory === 'Todos' ? 'active' : ''}" onclick="setCategory('Todos')">
    <span class="cat-icon">&#x1F3EA;</span><span>Todos</span>
  </button>`;

  const catBtns = categories.map(c => `
    <button class="cat-btn ${currentCategory === c.nome ? 'active' : ''}" onclick="setCategory('${c.nome}')">
      <span class="cat-icon">${c.emoji || '📦'}</span>
      <span>${c.nome}</span>
    </button>
  `).join('');

  scroll.innerHTML = allBtn + catBtns;
}

function setCategory(cat) {
  currentCategory = cat;
  renderCategories();
  renderProducts();
  document.getElementById('productsTitle').textContent = cat === 'Todos' ? 'Todos os Produtos' : cat;
}

// ===== PRODUCTS =====
function filterProducts() {
  searchQuery = document.getElementById('searchInput').value.toLowerCase();
  renderProducts();
}

function getStockBadge(estoque) {
  if (estoque === undefined || estoque === null) return '';
  if (estoque === 0) return '<span class="stock-badge stock-zero">Sem estoque</span>';
  if (estoque <= 5) return `<span class="stock-badge stock-low">⚠️ Últimas ${estoque} und.</span>`;
  return '';
}

function renderProducts() {
  const products = getProducts().filter(p => p.status !== 'inativo');
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  let filtered = products;
  if (currentCategory !== 'Todos') {
    filtered = filtered.filter(p => p.categoria === currentCategory);
  }
  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.nome.toLowerCase().includes(searchQuery) ||
      (p.descricao && p.descricao.toLowerCase().includes(searchQuery))
    );
  }

  const countEl = document.getElementById('productsCount');
  if (countEl) countEl.textContent = `${filtered.length} produto(s)`;

  if (!filtered.length) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  grid.innerHTML = filtered.map(p => {
    const inCart = cart.find(c => c.id === p.id);
    const semEstoque = (p.estoque !== undefined && p.estoque !== null && p.estoque <= 0);
    const imgContent = p.imagem
      ? `<img src="${p.imagem}" alt="${p.nome}" onerror="this.style.display='none';this.nextSibling.style.display='block'">`
      : '';
    const emojiEl = `<span class="product-emoji" style="${p.imagem ? 'display:none' : ''}">${p.emoji || '💊'}</span>`;

    return `
      <div class="product-card${semEstoque ? ' out-of-stock' : ''}" id="card-${p.id}">
        ${p.promo && !semEstoque ? '<span class="promo-badge">&#x1F525; PROMO</span>' : ''}
        ${semEstoque ? '<span class="out-badge">Esgotado</span>' : ''}
        <div class="product-img-wrap">${imgContent}${emojiEl}</div>
        <div class="product-info">
          <div class="product-category-tag">${p.categoria}</div>
          <div class="product-name">${p.nome}</div>
          ${p.descricao ? `<div class="product-desc">${p.descricao}</div>` : ''}
          ${getStockBadge(p.estoque)}
          <div class="product-price">R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</div>
          <button class="add-btn${inCart ? ' added' : ''}${semEstoque ? ' btn-esgotado' : ''}" 
            onclick="${semEstoque ? '' : `addToCart(${p.id})`}" 
            ${semEstoque ? 'disabled' : ''}>
            ${semEstoque ? '😔 Esgotado' : inCart ? '✓ Adicionado' : '+ Adicionar'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ===== CART =====
function addToCart(id) {
  const products = getProducts();
  const product = products.find(p => p.id == id);
  if (!product) return;

  if (product.estoque !== undefined && product.estoque !== null) {
    const inCart = cart.find(c => c.id == id);
    const currentQtyInCart = inCart ? inCart.qty : 0;
    if (currentQtyInCart >= product.estoque) {
      showToast(`⚠️ Estoque máximo: ${product.estoque} unidade(s)`);
      return;
    }
  }

  const existing = cart.find(c => c.id == id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  renderCart();
  renderProducts();
  showToast(`${product.nome} adicionado! 🛒`);
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id != id);
  renderCart();
  renderProducts();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id == id);
  if (!item) return;

  if (delta > 0) {
    const products = getProducts();
    const product = products.find(p => p.id == id);
    if (product && product.estoque !== undefined && product.estoque !== null) {
      if (item.qty >= product.estoque) {
        showToast(`⚠️ Estoque máximo: ${product.estoque} unidade(s)`);
        return;
      }
    }
  }

  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else { renderCart(); renderProducts(); }
}

function renderCart() {
  const total = cart.reduce((sum, c) => sum + c.preco * c.qty, 0);
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');
  const footerEl = document.getElementById('cartFooter');
  const emptyEl = document.getElementById('cartEmpty');
  const itemsEl = document.getElementById('cartItems');
  const warnEl = document.getElementById('minOrderWarning');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (countEl) countEl.textContent = cart.reduce((s, c) => s + c.qty, 0);
  if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

  if (!cart.length) {
    if (footerEl) footerEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    if (itemsEl) {
      const existing = itemsEl.querySelectorAll('.cart-item');
      existing.forEach(e => e.remove());
    }
    return;
  }

  if (footerEl) footerEl.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  const belowMin = total < VALOR_MINIMO_ENTREGA;
  if (warnEl) warnEl.style.display = belowMin ? 'block' : 'none';
  if (checkoutBtn) checkoutBtn.disabled = belowMin;

  if (itemsEl) {
    const existing = itemsEl.querySelectorAll('.cart-item');
    existing.forEach(e => e.remove());
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="cart-item-img">${item.imagem
          ? `<img src="${item.imagem}" alt="${item.nome}" onerror="this.parentElement.textContent='${item.emoji || '💊'}'">` 
          : (item.emoji || '💊')}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.nome}</div>
          <div class="cart-item-price">R$ ${(item.preco * item.qty).toFixed(2).replace('.', ',')}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart(${item.id})">🗑️</button>
        </div>
      `;
      itemsEl.appendChild(div);
    });
  }
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

// ===== PAYMENT / TROCO =====
function handlePaymentChange() {
  const selected = document.querySelector('input[name="payment"]:checked');
  const trocoSection = document.getElementById('trocoSection');
  if (selected && selected.value === 'Dinheiro') {
    trocoSection.style.display = 'block';
    const naoOpt = document.querySelector('input[name="troco"][value="nao"]');
    if (naoOpt) { naoOpt.checked = true; handleTrocoChange(); }
  } else {
    trocoSection.style.display = 'none';
  }
}

function handleTrocoChange() {
  const selected = document.querySelector('input[name="troco"]:checked');
  const trocoValorGroup = document.getElementById('trocoValorGroup');
  if (selected && selected.value === 'sim') {
    trocoValorGroup.style.display = 'block';
    setTimeout(() => document.getElementById('trocoValor').focus(), 50);
  } else {
    trocoValorGroup.style.display = 'none';
    document.getElementById('trocoValor').value = '';
  }
}

// ===== CHECKOUT =====
function showCheckout() {
  if (!cart.length) { showToast("Carrinho vazio!"); return; }

  const total = cart.reduce((sum, c) => sum + c.preco * c.qty, 0);
  if (total < VALOR_MINIMO_ENTREGA) {
    showToast(`⚠️ Valor mínimo para entrega é R$ ${VALOR_MINIMO_ENTREGA.toFixed(2).replace('.', ',')}`);
    return;
  }

  const summaryHTML = `
    <div class="order-summary-title">📦 Resumo do pedido</div>
    ${cart.map(item => `
      <div class="order-item">
        <span>${item.nome} x${item.qty}</span>
        <span>R$ ${(item.preco * item.qty).toFixed(2).replace('.', ',')}</span>
      </div>
    `).join('')}
    <div class="order-total-row">
      <span>TOTAL</span>
      <span>R$ ${total.toFixed(2).replace('.', ',')}</span>
    </div>
  `;
  document.getElementById('orderSummary').innerHTML = summaryHTML;

  document.querySelectorAll('input[name="payment"]').forEach(r => r.checked = false);
  const naoOpt = document.querySelector('input[name="troco"][value="nao"]');
  if (naoOpt) naoOpt.checked = true;
  document.getElementById('trocoSection').style.display = 'none';
  document.getElementById('trocoValorGroup').style.display = 'none';
  document.getElementById('trocoValor').value = '';

  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}

async function finalizarPedido() {
  const nome = document.getElementById('clientName').value.trim();
  const telefone = document.getElementById('clientPhone').value.trim();
  const endereco = document.getElementById('clientAddress').value.trim();
  const pagamentoEl = document.querySelector('input[name="payment"]:checked');

  if (!nome) { showToast("⚠️ Informe seu nome!"); document.getElementById('clientName').focus(); return; }
  if (!telefone) { showToast("⚠️ Informe seu telefone!"); document.getElementById('clientPhone').focus(); return; }
  if (!endereco) { showToast("⚠️ Informe seu endereço!"); document.getElementById('clientAddress').focus(); return; }
  if (!pagamentoEl) { showToast("⚠️ Escolha a forma de pagamento!"); return; }

  const pagamento = pagamentoEl.value;
  const total = cart.reduce((sum, c) => sum + c.preco * c.qty, 0);

  let trocoInfo = '';
  if (pagamento === 'Dinheiro') {
    const trocoOpt = document.querySelector('input[name="troco"]:checked');
    if (trocoOpt && trocoOpt.value === 'sim') {
      const trocoVal = document.getElementById('trocoValor').value.trim();
      if (!trocoVal || parseFloat(trocoVal) <= 0) {
        showToast("⚠️ Informe o valor para o troco!");
        document.getElementById('trocoValor').focus();
        return;
      }
      if (parseFloat(trocoVal) < total) {
        showToast("⚠️ O valor do troco deve ser maior que o total!");
        document.getElementById('trocoValor').focus();
        return;
      }
      trocoInfo = `\nTROCO PARA: R$ ${parseFloat(trocoVal).toFixed(2).replace('.', ',')}`;
    } else {
      trocoInfo = '\nSEM TROCO';
    }
  }

  const produtosList = cart.map(item =>
    `• ${item.nome} x${item.qty} — R$ ${(item.preco * item.qty).toFixed(2).replace('.', ',')}`
  ).join('\n');

  const config = getConfig();
  let mensagem = config.mensagem_padrao;
  mensagem = mensagem
    .replace('{produtos}', produtosList)
    .replace('{total}', total.toFixed(2).replace('.', ','))
    .replace('{pagamento}', pagamento)
    .replace('{troco}', trocoInfo)
    .replace('{nome}', nome)
    .replace('{telefone}', telefone)
    .replace('{endereco}', endereco);

  // Baixa estoque no Firebase
  try {
    const products = getProducts();
    for (const cartItem of cart) {
      const prod = products.find(p => p.id == cartItem.id);
      if (prod && prod.estoque !== undefined && prod.estoque !== null) {
        const novoEstoque = Math.max(0, prod.estoque - cartItem.qty);
        await setDoc(doc(db, "produtos", String(prod.id)), { ...prod, estoque: novoEstoque });
      }
    }
  } catch (e) {
    console.error("Erro ao atualizar estoque:", e);
  }

  const phone = WHATSAPP_FIXO.replace(/\D/g, '');
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');

  cart = [];
  renderCart();
  renderProducts();
  closeCheckout();

  document.getElementById('clientName').value = '';
  document.getElementById('clientPhone').value = '';
  document.getElementById('clientAddress').value = '';
  document.getElementById('trocoSection').style.display = 'none';
  document.getElementById('trocoValorGroup').style.display = 'none';
  document.getElementById('trocoValor').value = '';

  showToast("✅ Pedido enviado pelo WhatsApp!");
}

// ===== TOAST =====
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

// Expõe funções globalmente
window.setCategory = setCategory;
window.filterProducts = filterProducts;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQty = changeQty;
window.toggleCart = toggleCart;
window.showCheckout = showCheckout;
window.closeCheckout = closeCheckout;
window.finalizarPedido = finalizarPedido;
window.handlePaymentChange = handlePaymentChange;
window.handleTrocoChange = handleTrocoChange;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await initFirebaseData();
  listenToData();
  renderCart();
});
