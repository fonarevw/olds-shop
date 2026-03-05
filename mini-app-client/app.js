const API_URL = 'http://192.168.1.58:3001';

let state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    products: [],
    categories: [],
    currentCategory: null,
    cartOpen: false,
    userOrders: []
};

const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCartBtn = document.getElementById('closeCartBtn');
const authModal = document.getElementById('authModal');
const profileModal = document.getElementById('profileModal');
const userProfile = document.getElementById('userProfile');
const shopLogo = document.getElementById('shopLogo');
const burgerBtn = document.getElementById('burgerBtn');
const sideMenu = document.getElementById('sideMenu');
const mainContent = document.getElementById('mainContent');

// ========== БУРГЕР МЕНЮ ==========
if (burgerBtn && sideMenu) {
    burgerBtn.addEventListener('mouseenter', () => {
        sideMenu.classList.add('pinned');
    });

    sideMenu.addEventListener('mouseleave', () => {
        sideMenu.classList.remove('pinned');
    });
}

// ========== КОРЗИНА ==========
function toggleCart(open) {
    state.cartOpen = open;
    if (cartSidebar) cartSidebar.classList.toggle('open', open);
    if (cartOverlay) cartOverlay.classList.toggle('active', open);
}

if (cartBtn) cartBtn.addEventListener('click', () => toggleCart(!state.cartOpen));
if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));

function updateCart() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = totalItems;
    
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItemsContainer || !cartTotal) return;
    
    if (state.cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">КОРЗИНА ПУСТА</p>';
        cartTotal.textContent = '0 ₽';
        return;
    }
    
    cartItemsContainer.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <img src="${item.image || 'https://via.placeholder.com/150'}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price} ₽</div>
            </div>
            <div class="cart-item-quantity">
                <button onclick="updateQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
        </div>
    `).join('');
    
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `${total} ₽`;
    
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

window.updateQuantity = function(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;
    
    item.quantity += delta;
    
    if (item.quantity <= 0) {
        state.cart = state.cart.filter(i => i.id !== productId);
    }
    
    updateCart();
};

// ========== АВТОРИЗАЦИЯ ==========
function updateUserProfile() {
    if (!userProfile) return;
    
    if (state.user && state.user.gameNickname) {
        userProfile.innerHTML = `
            <button onclick="openProfile()" class="profile-btn">
                ${state.user.gameNickname}
            </button>
        `;
    } else if (state.user && state.user.login) {
        userProfile.innerHTML = `
            <button onclick="openProfile()" class="profile-btn">
                ${state.user.login}
            </button>
        `;
    } else {
        userProfile.innerHTML = `
            <button onclick="openAuthModal()" class="login-btn">
                ВОЙТИ
            </button>
        `;
    }
}

window.openAuthModal = () => {
    if (authModal) authModal.classList.add('open');
};

window.openProfile = () => {
    if (state.user) {
        loadUserData();
        if (profileModal) profileModal.classList.add('open');
    }
};

// Закрытие модалок
const closeAuthBtn = document.getElementById('closeAuthBtn');
if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', () => {
        if (authModal) authModal.classList.remove('open');
    });
}

const closeProfileBtn = document.getElementById('closeProfileBtn');
if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', () => {
        if (profileModal) profileModal.classList.remove('open');
    });
}

// Переключение вкладок
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authTitle = document.getElementById('authTitle');

if (loginTab && registerTab) {
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        if (loginForm) loginForm.classList.add('active');
        if (registerForm) registerForm.classList.remove('active');
        if (authTitle) authTitle.textContent = '🔐 ВХОД В АККАУНТ';
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        if (registerForm) registerForm.classList.add('active');
        if (loginForm) loginForm.classList.remove('active');
        if (authTitle) authTitle.textContent = '📝 РЕГИСТРАЦИЯ';
    });
}

// РЕГИСТРАЦИЯ
const registerSubmit = document.getElementById('registerSubmit');
if (registerSubmit) {
    registerSubmit.addEventListener('click', async () => {
        const gameNickname = document.getElementById('registerGameNickname')?.value;
        const gameId = document.getElementById('registerGameId')?.value;
        const email = document.getElementById('registerEmail')?.value;
        const login = document.getElementById('registerLogin')?.value;
        const password = document.getElementById('registerPassword')?.value;
        const password2 = document.getElementById('registerPassword2')?.value;
        
        console.log('Регистрация:', { gameNickname, gameId, email, login });
        
        if (!gameNickname || !gameId || !email || !login || !password) {
            alert('ЗАПОЛНИТЕ ВСЕ ПОЛЯ');
            return;
        }
        
        if (password !== password2) {
            alert('ПАРОЛИ НЕ СОВПАДАЮТ');
            return;
        }
        
        if (password.length < 6) {
            alert('ПАРОЛЬ ДОЛЖЕН БЫТЬ МИНИМУМ 6 СИМВОЛОВ');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameNickname, gameId, email, login, password })
            });
            
            const data = await response.json();
            console.log('Ответ сервера:', data);
            
            if (data.success) {
                state.user = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                updateUserProfile();
                if (authModal) authModal.classList.remove('open');
                alert('РЕГИСТРАЦИЯ УСПЕШНА!');
            } else {
                alert(data.error || 'ОШИБКА РЕГИСТРАЦИИ');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('ОШИБКА СОЕДИНЕНИЯ');
        }
    });
}

// ВХОД
const loginSubmit = document.getElementById('loginSubmit');
if (loginSubmit) {
    loginSubmit.addEventListener('click', async () => {
        const credential = document.getElementById('loginCredential')?.value;
        const password = document.getElementById('loginPassword')?.value;
        
        console.log('Попытка входа:', credential);
        
        if (!credential || !password) {
            alert('ЗАПОЛНИТЕ ВСЕ ПОЛЯ');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential, password })
            });
            
            const data = await response.json();
            console.log('Ответ сервера:', data);
            
            if (data.success) {
                state.user = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                updateUserProfile();
                if (authModal) authModal.classList.remove('open');
                alert('ВХОД ВЫПОЛНЕН!');
            } else {
                alert(data.error || 'НЕВЕРНЫЕ ДАННЫЕ');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('ОШИБКА СОЕДИНЕНИЯ');
        }
    });
}

// ========== ЛИЧНЫЙ КАБИНЕТ ==========
async function loadUserData() {
    if (!state.user) return;
    
    try {
        // Загружаем свежие данные пользователя
        const userRes = await fetch(`${API_URL}/api/user/${state.user.id}`);
        const userData = await userRes.json();
        
        // Обновляем состояние
        state.user = { ...state.user, ...userData };
        localStorage.setItem('user', JSON.stringify(state.user));
        
        // Загружаем заказы
        const ordersRes = await fetch(`${API_URL}/api/user/${state.user.id}/orders`);
        const orders = await ordersRes.json();
        state.userOrders = orders;
        
        // Загружаем баланс
        const balanceRes = await fetch(`${API_URL}/api/user/${state.user.id}/balance`);
        const balanceData = await balanceRes.json();
        
        // Обновляем UI
        updateProfileUI(userData, balanceData.balance, orders);
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

function updateProfileUI(user, balance, orders) {
    const profileInfo = document.getElementById('profileInfo');
    const profileBalance = document.getElementById('profileBalance');
    const profileOrders = document.getElementById('profileOrders');
    const userOrdersList = document.getElementById('userOrdersList');
    
    if (profileInfo) {
        profileInfo.innerHTML = `
            <h3>${user.gameNickname || 'Н/Д'}</h3>
            <div class="profile-details">
                <p><strong>ИГРОВОЙ ID:</strong> ${user.gameId || 'Н/Д'}</p>
                <p><strong>EMAIL:</strong> ${user.email || 'Н/Д'}</p>
                <p><strong>ЛОГИН:</strong> ${user.login || 'Н/Д'}</p>
                <p><strong>ДАТА РЕГИСТРАЦИИ:</strong> ${new Date(user.createdAt).toLocaleDateString() || 'Н/Д'}</p>
            </div>
        `;
    }
    
    if (profileBalance) profileBalance.textContent = `${balance || 0} ₽`;
    if (profileOrders) profileOrders.textContent = orders.length;
    
    if (userOrdersList) {
        if (orders.length === 0) {
            userOrdersList.innerHTML = '<p style="text-align: center; padding: 20px;">У ВАС ЕЩЕ НЕТ ЗАКАЗОВ</p>';
        } else {
            userOrdersList.innerHTML = orders.map(order => `
                <div class="order-item">
                    <div class="order-header">
                        <span class="order-id">ЗАКАЗ #${order.id.slice(-6)}</span>
                        <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                    </div>
                    <div class="order-details">
                        <div class="order-items">
                            ${order.items.map(item => `
                                <div class="order-item-detail">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>${item.price * item.quantity} ₽</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="order-total">
                            <strong>ИТОГО: ${order.total} ₽</strong>
                        </div>
                        <div class="order-date">
                            ${new Date(order.createdAt).toLocaleString()}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
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

// ========== ВЫХОД ==========
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        state.user = null;
        localStorage.removeItem('user');
        updateUserProfile();
        if (profileModal) profileModal.classList.remove('open');
        alert('ВЫ ВЫШЛИ ИЗ АККАУНТА');
    });
}

// ========== ТОВАРЫ И КАТЕГОРИИ ==========
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/api/products`);
        state.products = await response.json();
        
        const hash = window.location.hash.slice(1) || 'home';
        if (hash === 'home') {
            renderHomePage();
        } else if (hash.startsWith('category/')) {
            const category = hash.replace('category/', '');
            renderCategoryPage(category);
        } else {
            renderHomePage();
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/api/categories`);
        state.categories = await response.json();
        renderCategories();
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    container.innerHTML = state.categories.map(category => `
        <a href="#category/${category}" class="category-link" onclick="navigateTo('category/${category}'); return false;">
            ${category}
        </a>
    `).join('');
}

function renderHomePage() {
    if (!mainContent) return;
    
    const heroSection = `
        <section class="hero-section">
            <div class="hero-logo">
                <div class="hero-logo-main">⚔️ OLDRS ⚔️</div>
                <div class="hero-logo-sub">SURVIVAL SHOP</div>
            </div>
            
            <div class="hero-description">
                <h1>ДОБРО ПОЖАЛОВАТЬ НА СЕРВЕР ВЫЖИВАНИЯ</h1>
                <p>OLDRS — ЭТО НЕ ПРОСТО МАГАЗИН, ЭТО ЦЕЛАЯ ЭКОСИСТЕМА ДЛЯ НАСТОЯЩИХ ВЫЖИВАЛЬЩИКОВ. МЫ ПРЕДЛАГАЕМ ЛУЧШИЕ УСЛОВИЯ ДЛЯ ИГРЫ, УНИКАЛЬНЫЕ ПРЕДМЕТЫ И САМУЮ ЧЕСТНУЮ СИСТЕМУ ДОНАТА.</p>
                
                <div class="features">
                    <div class="feature">
                        <span class="feature-icon">⚡</span>
                        <span>МГНОВЕННАЯ ВЫДАЧА</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🛡️</span>
                        <span>ГАРАНТИЯ БЕЗОПАСНОСТИ</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">💎</span>
                        <span>ЛУЧШИЕ ЦЕНЫ</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🎮</span>
                        <span>УНИКАЛЬНЫЙ ГЕЙМПЛЕЙ</span>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    const specialOffers = state.products.length > 0 ? `
        <section class="special-offers">
            <h2>🔥 СПЕЦИАЛЬНЫЕ ПРЕДЛОЖЕНИЯ</h2>
            <div class="offers-grid">
                ${renderProducts(state.products.slice(0, 3), true)}
            </div>
        </section>
    ` : '';
    
    const allProducts = `
        <section class="all-products">
            <h2>📦 ВСЕ ТОВАРЫ</h2>
            <div class="products-grid">
                ${renderProducts(state.products, false)}
            </div>
        </section>
    `;
    
    mainContent.innerHTML = heroSection + specialOffers + allProducts;
}

function renderCategoryPage(category) {
    if (!mainContent) return;
    
    const categoryProducts = state.products.filter(p => p.category === category);
    state.currentCategory = category;
    
    const pageContent = `
        <div class="category-page">
            <div class="category-header">
                <h1 class="category-title">${category}</h1>
                <span class="category-count">${categoryProducts.length} ТОВАРОВ</span>
            </div>
            <div class="products-grid">
                ${renderProducts(categoryProducts, false)}
            </div>
        </div>
    `;
    
    mainContent.innerHTML = pageContent;
}

function renderProducts(products, isSpecial = false) {
    if (products.length === 0) {
        return '<p style="text-align: center; padding: 40px;">ТОВАРЫ НЕ НАЙДЕНЫ</p>';
    }
    
    return products.map(product => `
        <div class="product-card ${isSpecial ? 'special' : ''}">
            <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <div class="price">${product.price} ₽</div>
            <button class="add-to-cart" onclick="addToCart('${product.id}')">
                В КОРЗИНУ
                <span class="btn-icon">→</span>
            </button>
        </div>
    `).join('');
}

// ========== НАВИГАЦИЯ ==========
window.navigateTo = function(path) {
    if (path === 'home') {
        renderHomePage();
        window.history.pushState({}, '', '#home');
    } else if (path.startsWith('category/')) {
        const category = path.replace('category/', '');
        renderCategoryPage(category);
        window.history.pushState({}, '', `#category/${category}`);
    }
};

window.addEventListener('popstate', () => {
    const hash = window.location.hash.slice(1) || 'home';
    if (hash === 'home') {
        renderHomePage();
    } else if (hash.startsWith('category/')) {
        const category = hash.replace('category/', '');
        renderCategoryPage(category);
    }
});

if (shopLogo) {
    shopLogo.addEventListener('click', () => {
        window.navigateTo('home');
        document.querySelectorAll('.category-link').forEach(link => {
            link.classList.remove('active');
        });
    });
}

// ========== ДОБАВЛЕНИЕ В КОРЗИНУ ==========
window.addToCart = function(productId) {
    if (!state.user) {
        alert('ПОЖАЛУЙСТА, ВОЙДИТЕ В СИСТЕМУ');
        openAuthModal();
        return;
    }
    
    const product = state.products.find(p => p.id === productId);
    const existingItem = state.cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }
    
    updateCart();
    toggleCart(true);
};

// ========== ОФОРМЛЕНИЕ ЗАКАЗА ==========
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        if (!state.user) {
            alert('ПОЖАЛУЙСТА, ВОЙДИТЕ В СИСТЕМУ');
            openAuthModal();
            return;
        }
        
        if (state.cart.length === 0) {
            alert('КОРЗИНА ПУСТА');
            return;
        }
        
        const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        console.log('📦 Оформление заказа:', {
            userId: state.user.id,
            items: state.cart,
            total: total
        });
        
        try {
            const response = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: state.user.id,
                    items: state.cart,
                    total: total,
                    paymentMethod: 'balance'
                })
            });
            
            const data = await response.json();
            console.log('📦 Ответ сервера:', data);
            
            if (response.ok) {
                alert(`ЗАКАЗ НА СУММУ ${total} ₽ ОФОРМЛЕН!`);
                
                // Очищаем корзину
                state.cart = [];
                localStorage.setItem('cart', JSON.stringify(state.cart));
                updateCart();
                toggleCart(false);
                
                // Обновляем данные пользователя (баланс и историю)
                const userRes = await fetch(`${API_URL}/api/user/${state.user.id}`);
                const userData = await userRes.json();
                state.user = { ...state.user, ...userData };
                localStorage.setItem('user', JSON.stringify(state.user));
                
            } else {
                alert(data.error || 'ОШИБКА ПРИ ОФОРМЛЕНИИ ЗАКАЗА');
            }
        } catch (error) {
            console.error('❌ Ошибка:', error);
            alert('ОШИБКА СОЕДИНЕНИЯ С СЕРВЕРОМ');
        }
    });
}
// ========== ПОПОЛНЕНИЕ/ВЫВОД ==========
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');

if (depositBtn) {
    depositBtn.addEventListener('click', () => {
        alert('ФУНКЦИЯ ПОПОЛНЕНИЯ В РАЗРАБОТКЕ');
    });
}

if (withdrawBtn) {
    withdrawBtn.addEventListener('click', () => {
        alert('ФУНКЦИЯ ВЫВОДА В РАЗРАБОТКЕ');
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('Сайт загружен');
    console.log('Сохраненный пользователь:', state.user);
    
    loadProducts();
    loadCategories();
    updateUserProfile();
    updateCart();
});