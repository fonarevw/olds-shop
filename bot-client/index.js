const { Telegraf } = require('telegraf');

// ⚠️ ТВОЙ ТОКЕН КЛИЕНТ-БОТА
const BOT_TOKEN = '8621135110:AAGOQ7-lRJl4BvyyYKqA9tDF4qSMGKMM2QM';
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply('👋 Добро пожаловать в OLDRS SHOP!', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛒 Открыть магазин', web_app: { url: 'http://192.168.1.58:4000' } }],
                [{ text: '👤 Мой профиль', callback_data: 'profile' }],
                [{ text: '📦 Мои заказы', callback_data: 'my_orders' }],
                [{ text: '💰 Пополнить баланс', callback_data: 'deposit' }]
            ]
        }
    });
});

bot.action('profile', (ctx) => {
    ctx.reply('👤 Профиль:\nДля просмотра профиля зайдите в магазин');
});

bot.action('my_orders', (ctx) => {
    ctx.reply('📦 Ваши заказы:\nИстория заказов доступна в магазине');
});

bot.action('deposit', (ctx) => {
    ctx.reply('💰 Пополнение баланса:\nВыберите способ оплаты в магазине');
});

bot.help((ctx) => {
    ctx.reply('Команды:\n/start - главное меню\n/shop - открыть магазин\n/profile - профиль\n/balance - баланс');
});

bot.launch();
console.log('🛍️ Клиентский бот запущен...');
console.log('📱 Токен:', BOT_TOKEN);