const { Telegraf } = require('telegraf');

// ⚠️ ТВОЙ ТОКЕН АДМИН-БОТА
const BOT_TOKEN = '8638865067:AAFVVTMDSHf4tKxfuKB9ZWSZpM9uKlbW0xM';
const bot = new Telegraf(BOT_TOKEN);

// ID администраторов (замени на свой Telegram ID)
const ADMIN_IDS = [489929575]; // ⚠️ ВСТАВЬ СВОЙ TELEGRAM ID

bot.start((ctx) => {
    const userId = ctx.from.id;
    
    if (!ADMIN_IDS.includes(userId)) {
        return ctx.reply('⛔ Доступ запрещен. Вы не администратор.');
    }
    
    ctx.reply('🔧 Панель управления OLDRS SHOP', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📊 Открыть админ-панель', web_app: { url: 'http://192.168.1.58:5001' } }],
                [{ text: '📦 Товары', callback_data: 'products' }],
                [{ text: '📁 Категории', callback_data: 'categories' }],
                [{ text: '📋 Заказы', callback_data: 'orders' }],
                [{ text: '📈 Статистика', callback_data: 'stats' }]
            ]
        }
    });
});

// Обработка кнопок
bot.action('products', (ctx) => {
    ctx.reply('Управление товарами:\n/add_product - добавить товар\n/edit_product - редактировать\n/delete_product - удалить');
});

bot.action('categories', (ctx) => {
    ctx.reply('Управление категориями:\n/add_category - добавить категорию');
});

bot.action('orders', (ctx) => {
    ctx.reply('Заказы:\n/pending - ожидают\n/active - активные\n/completed - выполненные');
});

bot.action('stats', (ctx) => {
    ctx.reply('Статистика пока в разработке');
});

// Команды для добавления товара (упрощенно)
bot.command('add_product', (ctx) => {
    ctx.reply('Используй админ-панель по кнопке "Открыть админ-панель"');
});

bot.launch();
console.log('🔧 Админ-бот запущен...');
console.log('📱 Токен:', BOT_TOKEN);