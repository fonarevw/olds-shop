const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Создаем папку uploads если её нет
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('📁 Папка uploads создана');
}

// Раздаем статические файлы из папки uploads
app.use('/uploads', express.static(uploadDir));

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены'));
        }
    }
});

// Логируем запросы
app.use((req, res, next) => {
    console.log(`📡 [${req.method}] ${req.url}`);
    next();
});

// ========== API ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЙ ==========
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }
        
        const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
        console.log('✅ Файл загружен:', imageUrl);
        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
});

// ========== БАЗА ДАННЫХ ==========
let products = [];
let categories = ['Оружие', 'Броня', 'Ресурсы', 'Медицина'];
let users = [];
let orders = [];

// ========== API ТОВАРОВ ==========
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/products', (req, res) => {
    const product = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    products.push(product);
    console.log('✅ Товар добавлен:', product.name);
    res.json({ success: true, product });
});

app.put('/api/products/:id', (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        products[index] = { ...products[index], ...req.body };
        console.log('✅ Товар обновлен:', products[index].name);
        res.json({ success: true, product: products[index] });
    } else {
        res.status(404).json({ error: 'Товар не найден' });
    }
});

app.delete('/api/products/:id', (req, res) => {
    products = products.filter(p => p.id !== req.params.id);
    console.log('✅ Товар удален');
    res.json({ success: true });
});

// ========== API КАТЕГОРИЙ ==========
app.get('/api/categories', (req, res) => {
    res.json(categories);
});

app.post('/api/categories', (req, res) => {
    categories.push(req.body.name);
    res.json({ success: true, categories });
});

// ========== API ПОЛЬЗОВАТЕЛЕЙ ==========
app.get('/api/users', (req, res) => {
    const usersForAdmin = users.map(u => ({
        id: u.id,
        gameNickname: u.gameNickname,
        gameId: u.gameId,
        email: u.email,
        login: u.login,
        balance: u.balance,
        purchasesCount: u.purchases?.length || 0,
        createdAt: u.createdAt
    }));
    res.json(usersForAdmin);
});

app.get('/api/user/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
});

app.post('/api/auth/register', (req, res) => {
    const { gameNickname, gameId, email, login, password } = req.body;
    
    if (users.find(u => u.gameId === gameId)) {
        return res.status(400).json({ error: 'Игровой ID уже используется' });
    }
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email уже используется' });
    }
    if (users.find(u => u.login === login)) {
        return res.status(400).json({ error: 'Логин уже используется' });
    }
    
    const newUser = {
        id: Date.now().toString(),
        gameNickname,
        gameId,
        email,
        login,
        password,
        balance: 0,
        purchases: [],
        additionalInfo: {},
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    console.log('✅ Пользователь создан:', newUser.gameNickname);
    
    res.json({ 
        success: true, 
        user: {
            id: newUser.id,
            gameNickname: newUser.gameNickname,
            gameId: newUser.gameId,
            email: newUser.email,
            login: newUser.login,
            balance: newUser.balance,
            additionalInfo: newUser.additionalInfo,
            createdAt: newUser.createdAt
        }
    });
});

app.post('/api/auth/login', (req, res) => {
    const { credential, password } = req.body;
    
    const user = users.find(u => 
        u.gameId === credential || 
        u.email === credential || 
        u.login === credential
    );
    
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Неверные данные для входа' });
    }
    
    res.json({ 
        success: true, 
        user: {
            id: user.id,
            gameNickname: user.gameNickname,
            gameId: user.gameId,
            email: user.email,
            login: user.login,
            balance: user.balance,
            additionalInfo: user.additionalInfo || {},
            createdAt: user.createdAt
        }
    });
});

app.get('/api/user/:id/balance', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ balance: user.balance });
});

// ========== API ЗАКАЗОВ ==========
app.post('/api/orders', (req, res) => {
    const { userId, items, total, paymentMethod } = req.body;
    
    console.log('📦 Попытка создания заказа:', { userId, items, total, paymentMethod });
    
    const user = users.find(u => u.id === userId);
    if (!user) {
        console.log('❌ Пользователь не найден:', userId);
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const order = {
        id: Date.now().toString(),
        userId,
        userInfo: {
            gameNickname: user.gameNickname,
            gameId: user.gameId,
            email: user.email,
            login: user.login
        },
        items,
        total,
        paymentMethod,
        status: 'pending',
        statusHistory: [
            { status: 'pending', date: new Date().toISOString(), comment: 'Заказ создан' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    orders.push(order);
    console.log('✅ Заказ создан:', order.id);
    
    items.forEach(item => {
        user.purchases.push({
            orderId: order.id,
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            status: order.status,
            date: new Date().toISOString()
        });
    });
    
    res.json({ success: true, order });
});

app.get('/api/orders', (req, res) => {
    res.json(orders);
});

app.get('/api/user/:id/orders', (req, res) => {
    const userOrders = orders.filter(o => o.userId === req.params.id);
    res.json(userOrders);
});

app.put('/api/orders/:id/status', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
        return res.status(404).json({ error: 'Заказ не найден' });
    }
    
    const { status, comment } = req.body;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    
    order.statusHistory.push({
        status,
        date: new Date().toISOString(),
        comment: comment || `Статус изменен на ${status}`
    });
    
    const user = users.find(u => u.id === order.userId);
    if (user) {
        user.purchases.forEach(p => {
            if (p.orderId === order.id) {
                p.status = status;
            }
        });
    }
    
    res.json({ success: true, order });
});

// ========== СТАТИСТИКА ==========
app.get('/api/stats', (req, res) => {
    res.json({
        totalProducts: products.length,
        totalCategories: categories.length,
        totalUsers: users.length,
        totalOrders: orders.length
    });
});

// ========== ТЕСТОВЫЙ РОУТ ==========
app.get('/', (req, res) => {
    res.send('🚀 OLDRS SHOP API работает!');
});

// ========== ЗАПУСК ==========
const PORT = 3001;
app.listen(PORT, () => {
    console.log('\n🚀 ========== СЕРВЕР ЗАПУЩЕН ==========');
    console.log(`📡 Порт: ${PORT}`);
    console.log(`📁 Папка uploads: ${uploadDir}`);
    console.log(`📦 Товаров: ${products.length}`);
    console.log(`👥 Пользователей: ${users.length}`);
    console.log(`📋 Заказов: ${orders.length}`);
    console.log('=====================================\n');
});