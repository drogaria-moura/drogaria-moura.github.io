// ===== CONFIGURAÇÃO FIREBASE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, getDocs, setDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// ===== AUTH =====
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

let cachedProducts = [];
let cachedCategories = [];
let cachedConfig = {};

function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem('dm_admin_auth', '1');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    initAdmin();
  } else {
    errEl.textContent = '❌ Usuário ou senha incorretos';
    setTimeout(() => errEl.textContent = '', 3000);
  }
}

function doLogout() {
  sessionStorage.removeItem('dm_admin_auth');
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

function checkAuth() {
  if (sessionStorage.getItem('dm_admin_auth') === '1') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    initAdmin();
  }
}

// ===== FIREBASE LISTENERS =====
function startListeners() {
  onSnapshot(collection(db, "produtos"), (snap) => {
    cachedProducts = snap.docs.map(d => d.data());
    renderAdminProducts();
  });

  onSnapshot(collection(db, "categorias"), (snap) => {
    cachedCategories = snap.docs.map(d => d.data());
    renderAdminCategories();
  });

  onSnapshot(doc(db, "config", "geral"), (snap) => {
    if (snap.exists()) {
      cachedConfig = snap.data();
      loadConfigForm();
    }
  });
}

function getProducts() { return cachedProducts; }
function getCategories() { return cachedCategories; }
function getConfig() { return cachedConfig; }

async function saveProducts(products) {
  for (const p of products) {
    await setDoc(doc(db, "produtos", String(p.id)), p);
  }
}

async function saveCategories(cats) {
  for (const c of cats) {
    await setDoc(doc(db, "categorias", String(c.id)), c);
  }
}

async function saveConfigData(cfg) {
  await setDoc(doc(db, "config", "geral"), cfg);
}

// ===== INIT =====
function initAdmin() {
  showTab('produtos');
  startListeners();
}

// ===== TABS =====
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`nav-${tab}`).classList.add('active');

  const titles = { produtos: 'Gerenciar Produtos', categorias: 'Gerenciar Categorias', configuracoes: 'Configurações da Loja' };
  document.getElementById('adminTitle').textContent = titles[tab];

  document.querySelector('.sidebar').classList.remove('mobile-open');
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('mobile-open');
}

// ===== STOCK HELPERS =====
function getStockClass(estoque) {
  if (estoque === undefined || estoque === null) return '';
  if (estoque === 0) return 'stock-zero';
  if (estoque <= 5) return 'stock-low';
  return 'stock-ok';
}

function getStockText(estoque) {
  if (estoque === undefined || estoque === null) return '—';
  if (estoque === 0) return '⛔ Zerado';
  if (estoque <= 5) return `⚠️ ${estoque}`;
  return `✅ ${estoque}`;
}

// ===== PRODUCTS =====
function renderAdminProducts() {
  const products = getProducts();
  const search = (document.getElementById('produtoSearch')?.value || '').toLowerCase();
  const filtered = products.filter(p =>
    !search || p.nome.toLowerCase().includes(search) || p.categoria.toLowerCase().includes(search)
  );

  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  tbody.innerHTML = filtered.map(p => {
    const imgContent = p.imagem
      ? `<img src="${p.imagem}" alt="${p.nome}" onerror="this.parentElement.textContent='${p.emoji || '💊'}'">`
      : (p.emoji || '💊');
    const stockClass = getStockClass(p.estoque);
    return `
      <tr>
        <td>
          <div class="product-cell">
            <div class="product-cell-img">${imgContent}</div>
            <div>
              <div class="product-cell-name">${p.nome}</div>
              <div class="product-cell-desc">${p.descricao || ''}</div>
            </div>
          </div>
        </td>
        <td>${p.categoria}</td>
        <td><strong>R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</strong></td>
        <td><span class="stock-cell ${stockClass}">${getStockText(p.estoque)}</span></td>
        <td>
          <span class="badge badge-${p.status}">${p.status}</span>
          ${p.promo ? '<span class="badge badge-promo" style="margin-left:4px">🔥 promo</span>' : ''}
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon btn-edit" onclick="editProduct(${p.id})">✏️ Editar</button>
            <button class="btn-icon btn-del" onclick="deleteProduct(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#9AA0A6">Nenhum produto encontrado</td></tr>`;
  }
}

let editingProductId = null;

function openProductModal() {
  editingProductId = null;
  document.getElementById('productModalTitle').textContent = 'Novo Produto';
  document.getElementById('productId').value = '';
  document.getElementById('pNome').value = '';
  document.getElementById('pDescricao').value = '';
  document.getElementById('pPreco').value = '';
  document.getElementById('pEstoque').value = '';
  document.getElementById('pImagem').value = '';
  document.getElementById('pEmoji').value = '💊';
  document.getElementById('pStatus').value = 'ativo';
  document.getElementById('pPromo').checked = false;

  populateCategoryDropdown();
  document.getElementById('productModal').classList.add('open');
  document.getElementById('pNome').focus();
}

function editProduct(id) {
  const products = getProducts();
  const p = products.find(pr => pr.id == id);
  if (!p) return;
  editingProductId = id;
  document.getElementById('productModalTitle').textContent = 'Editar Produto';
  document.getElementById('productId').value = p.id;
  document.getElementById('pNome').value = p.nome;
  document.getElementById('pDescricao').value = p.descricao || '';
  document.getElementById('pPreco').value = p.preco;
  document.getElementById('pEstoque').value = p.estoque !== null && p.estoque !== undefined ? p.estoque : '';
  document.getElementById('pImagem').value = p.imagem || '';
  document.getElementById('pEmoji').value = p.emoji || '💊';
  document.getElementById('pStatus').value = p.status;
  document.getElementById('pPromo').checked = p.promo || false;

  populateCategoryDropdown(p.categoria);
  document.getElementById('productModal').classList.add('open');
}

function populateCategoryDropdown(selected) {
  const cats = getCategories();
  const sel = document.getElementById('pCategoria');
  sel.innerHTML = cats.map(c =>
    `<option value="${c.nome}" ${selected === c.nome ? 'selected' : ''}>${c.nome}</option>`
  ).join('');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
}

async function saveProduct() {
  const nome = document.getElementById('pNome').value.trim();
  const preco = parseFloat(document.getElementById('pPreco').value);
  const estoqueVal = document.getElementById('pEstoque').value.trim();

  if (!nome) { showToast("⚠️ Informe o nome do produto"); return; }
  if (!preco || preco <= 0) { showToast("⚠️ Informe o preço"); return; }

  const estoque = estoqueVal !== '' ? parseInt(estoqueVal, 10) : null;
  const products = getProducts();

  const productData = {
    nome,
    descricao: document.getElementById('pDescricao').value.trim(),
    preco,
    estoque: estoque !== null && !isNaN(estoque) ? estoque : null,
    categoria: document.getElementById('pCategoria').value,
    emoji: document.getElementById('pEmoji').value.trim() || '💊',
    imagem: document.getElementById('pImagem').value.trim() || null,
    status: document.getElementById('pStatus').value,
    promo: document.getElementById('pPromo').checked,
  };

  try {
    if (editingProductId) {
      const existing = products.find(p => p.id == editingProductId);
      await setDoc(doc(db, "produtos", String(editingProductId)), { ...existing, ...productData });
      showToast("✅ Produto atualizado!");
    } else {
      const newId = products.length ? Math.max(...products.map(p => Number(p.id))) + 1 : 1;
      await setDoc(doc(db, "produtos", String(newId)), { id: newId, ...productData });
      showToast("✅ Produto adicionado!");
    }
    closeProductModal();
  } catch (e) {
    showToast("❌ Erro ao salvar produto");
    console.error(e);
  }
}

// Delete
let deleteTarget = null;
let deleteType = null;

function deleteProduct(id) {
  deleteTarget = id;
  deleteType = 'product';
  const p = getProducts().find(pr => pr.id == id);
  document.getElementById('confirmText').textContent = `Deseja excluir "${p?.nome}"?`;
  document.getElementById('confirmModal').classList.add('open');
}

async function confirmDelete() {
  try {
    if (deleteType === 'product') {
      await deleteDoc(doc(db, "produtos", String(deleteTarget)));
      showToast("🗑️ Produto excluído!");
    } else if (deleteType === 'category') {
      await deleteDoc(doc(db, "categorias", String(deleteTarget)));
      showToast("🗑️ Categoria excluída!");
    }
  } catch (e) {
    showToast("❌ Erro ao excluir");
    console.error(e);
  }
  closeConfirm();
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.remove('open');
  deleteTarget = null;
  deleteType = null;
}

// ===== CATEGORIES =====
function renderAdminCategories() {
  const cats = getCategories();
  const products = getProducts();
  const list = document.getElementById('categoriesList');
  if (!list) return;

  list.innerHTML = cats.map(c => {
    const count = products.filter(p => p.categoria === c.nome).length;
    return `
      <div class="cat-item">
        <div class="cat-emoji">${c.emoji || '📦'}</div>
        <div class="cat-name">${c.nome}</div>
        <div class="cat-count">${count} produto(s)</div>
        <div class="actions-cell">
          <button class="btn-icon btn-edit" onclick="editCat(${c.id})">✏️ Editar</button>
          <button class="btn-icon btn-del" onclick="deleteCat(${c.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  if (!cats.length) {
    list.innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:40px">Nenhuma categoria cadastrada</p>';
  }
}

let editingCatId = null;

function openCatModal() {
  editingCatId = null;
  document.getElementById('catModalTitle').textContent = 'Nova Categoria';
  document.getElementById('catId').value = '';
  document.getElementById('catNome').value = '';
  document.getElementById('catEmoji').value = '';
  document.getElementById('catModal').classList.add('open');
  document.getElementById('catNome').focus();
}

function editCat(id) {
  const c = getCategories().find(cat => cat.id == id);
  if (!c) return;
  editingCatId = id;
  document.getElementById('catModalTitle').textContent = 'Editar Categoria';
  document.getElementById('catId').value = id;
  document.getElementById('catNome').value = c.nome;
  document.getElementById('catEmoji').value = c.emoji || '';
  document.getElementById('catModal').classList.add('open');
}

function closeCatModal() {
  document.getElementById('catModal').classList.remove('open');
}

async function saveCat() {
  const nome = document.getElementById('catNome').value.trim();
  if (!nome) { showToast("⚠️ Informe o nome da categoria"); return; }

  const catData = { nome, emoji: document.getElementById('catEmoji').value.trim() || '📦' };

  try {
    if (editingCatId) {
      const existing = getCategories().find(c => c.id == editingCatId);
      await setDoc(doc(db, "categorias", String(editingCatId)), { ...existing, ...catData });
      showToast("✅ Categoria atualizada!");
    } else {
      const cats = getCategories();
      const newId = cats.length ? Math.max(...cats.map(c => Number(c.id))) + 1 : 1;
      await setDoc(doc(db, "categorias", String(newId)), { id: newId, ...catData });
      showToast("✅ Categoria adicionada!");
    }
    closeCatModal();
  } catch (e) {
    showToast("❌ Erro ao salvar categoria");
    console.error(e);
  }
}

function deleteCat(id) {
  deleteTarget = id;
  deleteType = 'category';
  const c = getCategories().find(cat => cat.id == id);
  document.getElementById('confirmText').textContent = `Deseja excluir a categoria "${c?.nome}"?`;
  document.getElementById('confirmModal').classList.add('open');
}

// ===== CONFIG =====
function loadConfigForm() {
  const cfg = getConfig();
  const cfgNome = document.getElementById('cfgNome');
  const cfgMsg = document.getElementById('cfgMensagem');
  if (cfgNome && cfg.nome_loja) cfgNome.value = cfg.nome_loja;
  if (cfgMsg && cfg.mensagem_padrao) cfgMsg.value = cfg.mensagem_padrao;
}

async function saveConfig() {
  const nome = document.getElementById('cfgNome').value.trim();
  const mensagem = document.getElementById('cfgMensagem').value;
  if (!nome) { showToast("⚠️ Informe o nome da loja"); return; }

  try {
    await saveConfigData({ nome_loja: nome, mensagem_padrao: mensagem });
    showToast("✅ Configurações salvas!");
  } catch (e) {
    showToast("❌ Erro ao salvar configurações");
    console.error(e);
  }
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
  toast._t = setTimeout(() => toast.classList.remove('show'), 2500);
}

// Expõe funções globalmente
window.doLogin = doLogin;
window.doLogout = doLogout;
window.showTab = showTab;
window.toggleSidebar = toggleSidebar;
window.openProductModal = openProductModal;
window.editProduct = editProduct;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
window.confirmDelete = confirmDelete;
window.closeConfirm = closeConfirm;
window.openCatModal = openCatModal;
window.editCat = editCat;
window.closeCatModal = closeCatModal;
window.saveCat = saveCat;
window.deleteCat = deleteCat;
window.saveConfig = saveConfig;
window.renderAdminProducts = renderAdminProducts;

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', checkAuth);
