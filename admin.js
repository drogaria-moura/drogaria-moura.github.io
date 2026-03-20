// ===== CONFIGURAÇÃO FIXA =====
// O telefone do WhatsApp é definido em app.js (WHATSAPP_FIXO)
// e também fica disponível nas configurações para referência

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// ===== AUTH =====
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

// ===== DATA =====
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

function getProducts() {
  const stored = localStorage.getItem('dm_products');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('dm_products', JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}

function saveProducts(products) {
  localStorage.setItem('dm_products', JSON.stringify(products));
}

function getCategories() {
  const stored = localStorage.getItem('dm_categories');
  return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
}

function saveCategories(cats) {
  localStorage.setItem('dm_categories', JSON.stringify(cats));
}

function getConfig() {
  const stored = localStorage.getItem('dm_config');
  return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
}

function saveConfigData(cfg) {
  localStorage.setItem('dm_config', JSON.stringify(cfg));
}

// ===== INIT =====
function initAdmin() {
  showTab('produtos');
  loadConfigForm();
}

// ===== TABS =====
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`nav-${tab}`).classList.add('active');
  
  const titles = { produtos: 'Gerenciar Produtos', categorias: 'Gerenciar Categorias', configuracoes: 'Configurações da Loja' };
  document.getElementById('adminTitle').textContent = titles[tab];
  
  if (tab === 'produtos') renderAdminProducts();
  if (tab === 'categorias') renderAdminCategories();
  
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

// Product Modal
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
  const p = products.find(pr => pr.id === id);
  if (!p) return;
  
  editingProductId = id;
  document.getElementById('productModalTitle').textContent = 'Editar Produto';
  document.getElementById('productId').value = id;
  document.getElementById('pNome').value = p.nome;
  document.getElementById('pDescricao').value = p.descricao || '';
  document.getElementById('pPreco').value = p.preco;
  document.getElementById('pEstoque').value = (p.estoque !== undefined && p.estoque !== null) ? p.estoque : '';
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

function saveProduct() {
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
  
  if (editingProductId) {
    const idx = products.findIndex(p => p.id === editingProductId);
    if (idx !== -1) products[idx] = { ...products[idx], ...productData };
    showToast("✅ Produto atualizado!");
  } else {
    const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    products.push({ id: newId, ...productData });
    showToast("✅ Produto adicionado!");
  }
  
  saveProducts(products);
  closeProductModal();
  renderAdminProducts();
}

// Delete product
let deleteTarget = null;
let deleteType = null;

function deleteProduct(id) {
  deleteTarget = id;
  deleteType = 'product';
  const products = getProducts();
  const p = products.find(pr => pr.id === id);
  document.getElementById('confirmText').textContent = `Deseja excluir "${p?.nome}"?`;
  document.getElementById('confirmModal').classList.add('open');
}

function confirmDelete() {
  if (deleteType === 'product') {
    const products = getProducts().filter(p => p.id !== deleteTarget);
    saveProducts(products);
    renderAdminProducts();
    showToast("🗑️ Produto excluído!");
  } else if (deleteType === 'category') {
    const cats = getCategories().filter(c => c.id !== deleteTarget);
    saveCategories(cats);
    renderAdminCategories();
    showToast("🗑️ Categoria excluída!");
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
  const cats = getCategories();
  const c = cats.find(cat => cat.id === id);
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

function saveCat() {
  const nome = document.getElementById('catNome').value.trim();
  if (!nome) { showToast("⚠️ Informe o nome da categoria"); return; }
  
  const cats = getCategories();
  const catData = { nome, emoji: document.getElementById('catEmoji').value.trim() || '📦' };
  
  if (editingCatId) {
    const idx = cats.findIndex(c => c.id === editingCatId);
    if (idx !== -1) cats[idx] = { ...cats[idx], ...catData };
    showToast("✅ Categoria atualizada!");
  } else {
    const newId = cats.length ? Math.max(...cats.map(c => c.id)) + 1 : 1;
    cats.push({ id: newId, ...catData });
    showToast("✅ Categoria adicionada!");
  }
  
  saveCategories(cats);
  closeCatModal();
  renderAdminCategories();
}

function deleteCat(id) {
  deleteTarget = id;
  deleteType = 'category';
  const cats = getCategories();
  const c = cats.find(cat => cat.id === id);
  document.getElementById('confirmText').textContent = `Deseja excluir a categoria "${c?.nome}"?`;
  document.getElementById('confirmModal').classList.add('open');
}

// ===== CONFIG =====
function loadConfigForm() {
  const cfg = getConfig();
  document.getElementById('cfgNome').value = cfg.nome_loja;
  document.getElementById('cfgMensagem').value = cfg.mensagem_padrao;
}

function saveConfig() {
  const nome = document.getElementById('cfgNome').value.trim();
  const mensagem = document.getElementById('cfgMensagem').value;
  
  if (!nome) { showToast("⚠️ Informe o nome da loja"); return; }
  
  saveConfigData({ nome_loja: nome, mensagem_padrao: mensagem });
  showToast("✅ Configurações salvas!");
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

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', checkAuth);
