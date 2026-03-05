const API_URL = 'http://192.168.1.58:3001';

let state = {
    products: [],
    categories: [],
    orders: [],
    users: [],
    currentSection: 'dashboard',
    currentCategory: null,
    editingProduct: null,
    deleteTarget: null,
    selectedUser: null
};

// DOM элементы
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.content-section');
const deleteModal = document.getElementById('deleteModal');
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');
const logoutBtn = document.getElementById('logoutBtn');
const backToCategories = document.getElementById('backToCategories');
const addProductInCategoryBtn = document.getElementById('addProductInCategoryBtn');
const currentCategoryTitle = document.getElementById('currentCategoryTitle');
const categoryProductsSection = document.getElementById('category-products-section');

// Элементы для изображений
const fileTab = document.getElementById('fileTab');
const urlTab = document.getElementById('urlTab');
const filePanel = document.getElementById('filePanel');
const urlPanel = document.getElementById('urlPanel');
const selectFileBtn = document.getElementById('selectFileBtn');
const imageFileInput = document.getElementById('productImageFile');
const imageUrlInput = document.getElementById('productImageUrl');
const previewImg = document.getElementById('previewImg');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const fileName = document.getElementById('fileName');

// Модалка пользователя
const userModal = document.getElementById('userModal');
const closeUserModal = document.getElementById('closeUserModal');
const userModalBody = document.getElementById('userModalBody');

// ========== НАВИГАЦИЯ ==========
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        sections.forEach(s => s.classList.remove('active'));
        
        if (section === 'categories') {
            document.getElementById('categories-section').classList.add('active');
            loadCategories();
        } else {
            document.getElementById(`${section}-section`).classList.add('active');
        }
        
        state.currentSection = section;
        state.currentCategory = null;
        
        switch(section) {
            case 'dashboard': loadDashboard(); break;
            case 'orders': loadOrders(); break;
            case 'users': loadUsers(); break;
        }
    });
});

// ========== ВЫХОД ==========
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('ВЫЙТИ ИЗ АДМИН-ПАНЕЛИ?')) {
            window.location.href = 'http://localhost:4000';
        }
    });
}

// ========== НАЗАД К КАТЕГОРИЯМ ==========
if (backToCategories) {
    backToCategories.addEventListener('click', () => {
        document.getElementById('categories-section').classList.add('active');
        if (categoryProductsSection) {
            categoryProductsSection.classList.remove('active');
        }
        state.currentCategory = null;
        loadCategories();
    });
}

// ========== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ЗАГРУЗКИ ==========
if (fileTab && urlTab && filePanel && urlPanel) {
    fileTab.addEventListener('click', () => {
        fileTab.classList.add('active');
        urlTab.classList.remove('active');
        filePanel.classList.add('active');
        urlPanel.classList.remove('active');
    });
    
    urlTab.addEventListener('click', () => {
        urlTab.classList.add('active');
        fileTab.classList.remove('active');
        urlPanel.classList.add('active');
        filePanel.classList.remove('active');
    });
}

// ========== ВЫБОР ФАЙЛА ==========
if (selectFileBtn && imageFileInput) {
    selectFileBtn.addEventListener('click', () => {
        imageFileInput.click();
    });
    
    imageFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (fileName) fileName.textContent = file.name;
            
            // Показываем превью
            const reader = new FileReader();
            reader.onload = function(e) {
                if (previewImg && previewPlaceholder) {
                    previewImg.src = e.target.result;
                    previewImg.style.display = 'block';
                    previewPlaceholder.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
            
            // Очищаем URL поле
            if (imageUrlInput) imageUrlInput.value = '';
        }
    });
}

// ========== ВВОД URL ==========
if (imageUrlInput) {
    imageUrlInput.addEventListener('input', function(e) {
        const url = e.target.value;
        if (url) {
            if (previewImg && previewPlaceholder) {
                previewImg.src = url;
                previewImg.style.display = 'block';
                previewPlaceholder.style.display = 'none';
                previewImg.onerror = function() {
                    previewImg.style.display = 'none';
                    previewPlaceholder.style.display = 'flex';
                };
            }
            
            // Очищаем файловый input
            if (imageFileInput) {
                imageFileInput.value = '';
                if (fileName) fileName.textContent = 'Файл не выбран';
            }
        } else {
            if (previewImg && previewPlaceholder) {
                previewImg.style.display = 'none';
                previewPlaceholder.style.display = 'flex';
            }
        }
    });
}

// ========== СБРОС ФОРМЫ ИЗОБРАЖЕНИЯ ==========
function resetImageForm() {
    if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
    if (previewPlaceholder) {
        previewPlaceholder.style.display = 'flex';
    }
    if (imageFileInput) imageFileInput.value = '';
    if (imageUrlInput) imageUrlInput.value = '';
    if (fileName) fileName.textContent = 'Файл не выбран';
    
    // Сбрасываем на вкладку файла
    if (fileTab && urlTab && filePanel && urlPanel) {
        fileTab.classList.add('active');
        urlTab.classList.remove('active');
        filePanel.classList.add('active');
        urlPanel.classList.remove('active');
    }
}

// ========== ЗАГРУЗКА ИЗОБРАЖЕНИЯ НА СЕРВЕР ==========
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.imageUrl;
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
    return null;
}

// ========== ЗАКРЫТИЕ МОДАЛКИ ПОЛЬЗОВАТЕЛЯ ==========
if (closeUserModal) {
    closeUserModal.addEventListener('click', () => {
        if (userModal) userModal.classList.remove('open');
    });
}

window.addEventListener('click', (e) => {
    if (e.target === userModal) {
        userModal.classList.remove('open');
    }
});

// ========== ДАШБОРД ==========
async function loadDashboard() {
    try {
        const [productsRes, categoriesRes, usersRes, ordersRes] = await Promise.all([
            fetch(`${API_URL}/api/products`),
            fetch(`${API_URL}/api/categories`),
            fetch(`${API_URL}/api/users`).catch(() => ({ json: () => [] })),
            fetch(`${API_URL}/api/orders`).catch(() => ({ json: () => [] }))
        ]);
        
        const products = await productsRes.json();
        const categories = await categoriesRes.json();
        const users = await usersRes.json();
        const orders = await ordersRes.json();
        
        const statProducts = document.getElementById('statProducts');
        const statCategories = document.getElementById('statCategories');
        const statUsers = document.getElementById('statUsers');
        const statOrders = document.getElementById('statOrders');
        
        if (statProducts) statProducts.textContent = products.length;
        if (statCategories) statCategories.textContent = categories.length;
        if (statUsers) statUsers.textContent = users.length;
        if (statOrders) statOrders.textContent = orders.length;
        
        // Топ донатеры
        const topDonaters = users
            .sort((a, b) => (b.balance || 0) - (a.balance || 0))
            .slice(0, 5);
        
        const topDonatersHtml = topDonaters.map((user, index) => `
            <div class="donater-item" onclick="showUserDetails('${user.id}')" style="cursor: pointer;">
                <span class="donater-rank">#${index + 1}</span>
                <span class="donater-name">${user.gameNickname || user.login || 'Н/Д'}</span>
                <span class="donater-amount">${user.balance || 0} ₽</span>
            </div>
        `).join('');
        
        const topDonatersEl = document.getElementById('topDonaters');
        if (topDonatersEl) {
            topDonatersEl.innerHTML = topDonatersHtml || '<p class="loading">НЕТ ДАННЫХ</p>';
        }
        
    } catch (error) {
        console.error('Ошибка загрузки дашборда:', error);
    }
}

// ========== КАТЕГОРИИ ==========
async function loadCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">ЗАГРУЗКА...</div>';
    
    try {
        const [categoriesRes, productsRes] = await Promise.all([
            fetch(`${API_URL}/api/categories`),
            fetch(`${API_URL}/api/products`)
        ]);
        
        state.categories = await categoriesRes.json();
        state.products = await productsRes.json();
        
        renderCategories();
    } catch (error) {
        container.innerHTML = '<div class="loading">ОШИБКА ЗАГРУЗКИ</div>';
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    if (state.categories.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px;">КАТЕГОРИЙ НЕТ</p>';
        return;
    }
    
    container.innerHTML = state.categories.map(category => {
        const productsInCategory = state.products.filter(p => p.category === category);
        
        return `
            <div class="category-card" ondblclick="openCategory('${category}')">
                <h3>${category}</h3>
                <p>ТОВАРОВ В КАТЕГОРИИ: ${productsInCategory.length}</p>
                <span class="product-count">${productsInCategory.length} шт</span>
                <div class="category-actions">
                    <button onclick="openCategory('${category}'); event.stopPropagation();">📦 ТОВАРЫ</button>
                    <button onclick="deleteCategory('${category}'); event.stopPropagation();">🗑️ УДАЛИТЬ</button>
                </div>
            </div>
        `;
    }).join('');
}

// ========== ОТКРЫТЬ КАТЕГОРИЮ С ТОВАРАМИ ==========
window.openCategory = function(category) {
    state.currentCategory = category;
    const titleEl = document.getElementById('currentCategoryTitle');
    const categoryField = document.getElementById('productCategory');
    
    if (titleEl) titleEl.textContent = `ТОВАРЫ КАТЕГОРИИ: ${category}`;
    if (categoryField) categoryField.value = category;
    
    const categoriesSection = document.getElementById('categories-section');
    if (categoriesSection) categoriesSection.classList.remove('active');
    
    if (categoryProductsSection) {
        categoryProductsSection.classList.add('active');
    }
    
    loadCategoryProducts(category);
};

async function loadCategoryProducts(category) {
    const container = document.getElementById('categoryProductsList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">ЗАГРУЗКА...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/products`);
        const allProducts = await response.json();
        const categoryProducts = allProducts.filter(p => p.category === category);
        
        renderCategoryProducts(categoryProducts);
    } catch (error) {
        container.innerHTML = '<div class="loading">ОШИБКА ЗАГРУЗКИ</div>';
    }
}

function renderCategoryProducts(products) {
    const container = document.getElementById('categoryProductsList');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px;">В ЭТОЙ КАТЕГОРИИ НЕТ ТОВАРОВ</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <div class="price">${product.price} ₽</div>
            <div class="description">${product.description || 'НЕТ ОПИСАНИЯ'}</div>
            <div class="product-actions">
                <button onclick="editProduct('${product.id}')">✏️ РЕДАКТИРОВАТЬ</button>
                <button onclick="deleteProduct('${product.id}')" class="delete-btn">🗑️ УДАЛИТЬ</button>
            </div>
        </div>
    `).join('');
}

// ========== ФОРМА ТОВАРА ==========
if (addProductInCategoryBtn) {
    addProductInCategoryBtn.addEventListener('click', () => {
        state.editingProduct = null;
        const titleEl = document.getElementById('formTitle');
        if (titleEl) titleEl.textContent = 'ДОБАВЛЕНИЕ ТОВАРА';
        
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productDescription').value = '';
        
        resetImageForm();
        
        document.getElementById('productForm').style.display = 'block';
    });
}

const cancelProductBtn = document.getElementById('cancelProductBtn');
if (cancelProductBtn) {
    cancelProductBtn.addEventListener('click', () => {
        document.getElementById('productForm').style.display = 'none';
        state.editingProduct = null;
        resetImageForm();
    });
}

const saveProductBtn = document.getElementById('saveProductBtn');
if (saveProductBtn) {
    saveProductBtn.addEventListener('click', async () => {
        const nameField = document.getElementById('productName');
        const priceField = document.getElementById('productPrice');
        const descField = document.getElementById('productDescription');
        
        let imageUrl = '';
        
        // Если выбран файл - загружаем его
        if (imageFileInput && imageFileInput.files.length > 0) {
            const file = imageFileInput.files[0];
            const uploadedUrl = await uploadImage(file);
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            } else {
                alert('ОШИБКА ЗАГРУЗКИ ФАЙЛА');
                return;
            }
        } 
        // Если указан URL - используем его
        else if (imageUrlInput && imageUrlInput.value) {
            imageUrl = imageUrlInput.value;
        } 
        // Если ничего не выбрано - заглушка
        else {
            imageUrl = 'https://via.placeholder.com/150';
        }
        
        const productData = {
            name: nameField ? nameField.value : '',
            price: priceField ? parseInt(priceField.value) : 0,
            category: state.currentCategory,
            description: descField ? descField.value : '',
            image: imageUrl
        };
        
        if (!productData.name || !productData.price) {
            alert('ЗАПОЛНИТЕ ОБЯЗАТЕЛЬНЫЕ ПОЛЯ');
            return;
        }
        
        try {
            if (state.editingProduct) {
                await fetch(`${API_URL}/api/products/${state.editingProduct}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            } else {
                await fetch(`${API_URL}/api/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            }
            
            document.getElementById('productForm').style.display = 'none';
            
            if (state.currentCategory) {
                loadCategoryProducts(state.currentCategory);
            }
            loadDashboard();
            loadCategories();
            resetImageForm();
            
        } catch (error) {
            alert('ОШИБКА СОХРАНЕНИЯ');
        }
    });
}

window.editProduct = function(productId) {
    fetch(`${API_URL}/api/products`)
        .then(res => res.json())
        .then(products => {
            const product = products.find(p => p.id === productId);
            if (!product) return;
            
            state.editingProduct = productId;
            document.getElementById('formTitle').textContent = 'РЕДАКТИРОВАНИЕ ТОВАРА';
            
            document.getElementById('productName').value = product.name || '';
            document.getElementById('productPrice').value = product.price || '';
            document.getElementById('productDescription').value = product.description || '';
            
            // Загружаем изображение
            if (product.image && product.image !== 'https://via.placeholder.com/150') {
                // Пробуем определить, это файл или URL
                if (product.image.startsWith('http://localhost:3001/uploads/')) {
                    // Это загруженный файл - показываем но не даем редактировать как файл
                    if (imageUrlInput) {
                        imageUrlInput.value = product.image;
                        // Переключаем на вкладку URL
                        if (urlTab && fileTab && urlPanel && filePanel) {
                            urlTab.click();
                        }
                        const event = new Event('input', { bubbles: true });
                        imageUrlInput.dispatchEvent(event);
                    }
                } else {
                    // Это внешняя ссылка
                    if (imageUrlInput) {
                        imageUrlInput.value = product.image;
                        if (urlTab && fileTab && urlPanel && filePanel) {
                            urlTab.click();
                        }
                        const event = new Event('input', { bubbles: true });
                        imageUrlInput.dispatchEvent(event);
                    }
                }
            } else {
                resetImageForm();
            }
            
            document.getElementById('productForm').style.display = 'block';
        });
};

window.deleteProduct = function(productId) {
    state.deleteTarget = { type: 'product', id: productId };
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('open');
};

// ========== УПРАВЛЕНИЕ КАТЕГОРИЯМИ ==========
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryForm = document.getElementById('categoryForm');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');

if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => {
        if (categoryForm) categoryForm.style.display = 'block';
        const nameField = document.getElementById('categoryName');
        if (nameField) nameField.value = '';
    });
}

if (cancelCategoryBtn) {
    cancelCategoryBtn.addEventListener('click', () => {
        if (categoryForm) categoryForm.style.display = 'none';
    });
}

if (saveCategoryBtn) {
    saveCategoryBtn.addEventListener('click', async () => {
        const nameField = document.getElementById('categoryName');
        const categoryName = nameField ? nameField.value : '';
        
        if (!categoryName) {
            alert('ВВЕДИТЕ НАЗВАНИЕ КАТЕГОРИИ');
            return;
        }
        
        try {
            await fetch(`${API_URL}/api/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: categoryName })
            });
            
            if (categoryForm) categoryForm.style.display = 'none';
            loadCategories();
            loadDashboard();
        } catch (error) {
            alert('ОШИБКА СОЗДАНИЯ КАТЕГОРИИ');
        }
    });
}

window.deleteCategory = function(categoryName) {
    if (confirm(`УДАЛИТЬ КАТЕГОРИЮ "${categoryName}"? ЭТО НЕ УДАЛИТ ТОВАРЫ В НЕЙ.`)) {
        alert('ФУНКЦИЯ УДАЛЕНИЯ КАТЕГОРИЙ В РАЗРАБОТКЕ');
    }
};

// ========== ПОЛЬЗОВАТЕЛИ ==========
async function loadUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">ЗАГРУЗКА...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/users`);
        const users = await response.json();
        state.users = users;
        
        renderUsers(users);
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        container.innerHTML = '<div class="loading">ОШИБКА ЗАГРУЗКИ</div>';
    }
}

function renderUsers(users) {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px;">ПОЛЬЗОВАТЕЛЕЙ НЕТ</p>';
        return;
    }
    
    container.innerHTML = users.map(user => {
        const initial = (user.gameNickname || user.login || 'U').charAt(0).toUpperCase();
        
        return `
            <div class="user-card" onclick="showUserDetails('${user.id}')">
                <div class="user-card-header">
                    <div class="user-avatar">
                        ${initial}
                    </div>
                    <div class="user-info">
                        <div class="user-nickname">${user.gameNickname || 'Н/Д'}</div>
                        <div class="user-gameid">ID: ${user.gameId || 'Н/Д'}</div>
                    </div>
                </div>
                <div class="user-card-footer">
                    <span class="user-balance">${user.balance || 0} ₽</span>
                    <span class="user-orders-count">📦 ${user.purchasesCount || 0}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ========== ПОКАЗАТЬ ДЕТАЛИ ПОЛЬЗОВАТЕЛЯ ==========
window.showUserDetails = async function(userId) {
    try {
        const response = await fetch(`${API_URL}/api/user/${userId}`);
        const user = await response.json();
        
        state.selectedUser = user;
        
        const initial = (user.gameNickname || user.login || 'U').charAt(0).toUpperCase();
        const regDate = user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Н/Д';
        
        const purchasesHtml = user.purchases && user.purchases.length > 0 
            ? user.purchases.map(p => `
                <div class="purchase-item">
                    <div>
                        <strong>${p.productName}</strong> x${p.quantity}
                    </div>
                    <div>
                        ${p.price * p.quantity} ₽
                        <small>${new Date(p.date).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('')
            : '<p style="text-align: center; padding: 20px;">НЕТ ПОКУПОК</p>';
        
        userModalBody.innerHTML = `
            <div class="user-profile-header">
                <div class="user-profile-avatar">
                    ${initial}
                </div>
                <div class="user-profile-title">
                    <h3>${user.gameNickname || 'Н/Д'}</h3>
                    <p>ID: ${user.id}</p>
                </div>
            </div>
            
            <div class="user-details-grid">
                <div class="user-detail-item">
                    <div class="user-detail-label">ИГРОВОЙ ID</div>
                    <div class="user-detail-value">${user.gameId || 'Н/Д'}</div>
                </div>
                <div class="user-detail-item">
                    <div class="user-detail-label">ЛОГИН</div>
                    <div class="user-detail-value">${user.login || 'Н/Д'}</div>
                </div>
                <div class="user-detail-item">
                    <div class="user-detail-label">EMAIL</div>
                    <div class="user-detail-value">${user.email || 'Н/Д'}</div>
                </div>
                <div class="user-detail-item">
                    <div class="user-detail-label">БАЛАНС</div>
                    <div class="user-detail-value">${user.balance || 0} ₽</div>
                </div>
                <div class="user-detail-item">
                    <div class="user-detail-label">ДАТА РЕГИСТРАЦИИ</div>
                    <div class="user-detail-value">${regDate}</div>
                </div>
                <div class="user-detail-item">
                    <div class="user-detail-label">ВСЕГО ЗАКАЗОВ</div>
                    <div class="user-detail-value">${user.purchases?.length || 0}</div>
                </div>
            </div>
            
            <div class="user-additional-info">
                <h4>ИСТОРИЯ ПОКУПОК</h4>
                <div class="user-purchases-list">
                    ${purchasesHtml}
                </div>
            </div>
        `;
        
        if (userModal) userModal.classList.add('open');
        
    } catch (error) {
        console.error('Ошибка загрузки деталей пользователя:', error);
        alert('ОШИБКА ЗАГРУЗКИ ДАННЫХ');
    }
};

// ========== ЗАКАЗЫ ==========
async function loadOrders(status = 'all') {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">ЗАГРУЗКА...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/orders`).catch(() => ({ json: () => [] }));
        let orders = await response.json();
        
        if (status !== 'all') {
            orders = orders.filter(o => o.status === status);
        }
        
        renderOrders(orders);
    } catch (error) {
        container.innerHTML = '<div class="loading">ОШИБКА ЗАГРУЗКИ</div>';
    }
}

function renderOrders(orders) {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px;">ЗАКАЗОВ НЕТ</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">ЗАКАЗ #${order.id.slice(-6)}</span>
                <span class="order-status ${order.status || 'pending'}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-info">
                <div class="order-info-item">
                    <strong>ПОЛЬЗОВАТЕЛЬ</strong>
                    ${order.userInfo?.gameNickname || order.userId || 'НЕИЗВЕСТНО'}
                </div>
                <div class="order-info-item">
                    <strong>СУММА</strong>
                    ${order.total || 0} ₽
                </div>
                <div class="order-info-item">
                    <strong>ТОВАРОВ</strong>
                    ${order.items?.length || 0}
                </div>
                <div class="order-info-item">
                    <strong>ДАТА</strong>
                    ${new Date(order.createdAt).toLocaleString()}
                </div>
            </div>
            <div class="order-actions">
                <select onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ ОЖИДАНИЕ</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>🔄 В ОБРАБОТКЕ</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>✅ ВЫПОЛНЕН</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ ОТМЕНЁН</option>
                </select>
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const statuses = {
        'pending': '⏳ ОЖИДАНИЕ',
        'processing': '🔄 В ОБРАБОТКЕ',
        'completed': '✅ ВЫПОЛНЕН',
        'cancelled': '❌ ОТМЕНЁН'
    };
    return statuses[status] || '⏳ ОЖИДАНИЕ';
}

window.updateOrderStatus = async function(orderId, status) {
    try {
        await fetch(`${API_URL}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        const activeTab = document.querySelector('.order-tab.active');
        if (activeTab) {
            loadOrders(activeTab.dataset.status || 'all');
        } else {
            loadOrders('all');
        }
    } catch (error) {
        alert('ОШИБКА ОБНОВЛЕНИЯ СТАТУСА');
    }
};

const orderTabs = document.querySelectorAll('.order-tab');
orderTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        orderTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadOrders(tab.dataset.status);
    });
});

// ========== УДАЛЕНИЕ ==========
if (confirmDelete) {
    confirmDelete.addEventListener('click', async () => {
        if (!state.deleteTarget) return;
        
        try {
            if (state.deleteTarget.type === 'product') {
                await fetch(`${API_URL}/api/products/${state.deleteTarget.id}`, {
                    method: 'DELETE'
                });
                
                if (state.currentCategory) {
                    loadCategoryProducts(state.currentCategory);
                }
                loadDashboard();
                loadCategories();
            }
            
            if (deleteModal) deleteModal.classList.remove('open');
            state.deleteTarget = null;
        } catch (error) {
            alert('ОШИБКА УДАЛЕНИЯ');
        }
    });
}

if (cancelDelete) {
    cancelDelete.addEventListener('click', () => {
        if (deleteModal) deleteModal.classList.remove('open');
        state.deleteTarget = null;
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('Админ-панель загружена');
    loadDashboard();
    
    window.openCategory = openCategory;
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
    window.deleteCategory = deleteCategory;
    window.updateOrderStatus = updateOrderStatus;
    window.showUserDetails = showUserDetails;
});