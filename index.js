const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const TOKEN = '8991397075:AAEXNRuY3RIY2JTNNy0bEJV91zVEzgKcH9w';
const bot = new TelegramBot(TOKEN, { polling: true });

// مسیر فایل دیتابیس (اگر روی رایلی ولوم متصل کنید، این مسیر را به پوشه ولوم هدایت کنید)
const DB_FILE = path.join(__dirname, 'database.json');

// بارگذاری دیتابیس از فایل
let db = {
    settings: {},
    warnings: {},
    mutes: {},
    bans: {},
    admins: {},
    owners: {},
    filters: {},
    forcedSub: {},
    welcomeText: {},
    stats: {},
    spamTracker: {}
};

function loadDatabase() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            db = JSON.parse(data);
        } catch (e) {
            console.error("خطا در خواندن دیتابیس:", e);
        }
    }
}

function saveDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
        console.error("خطا در ذخیره دیتابیس:", e);
    }
}

loadDatabase();

// متن پیش‌فرض خوشامدگویی
const defaultWelcome = `╔═══『 ⚔️ E10 CLAN ⚔️ 』═══╗

        𓆩 WELCOME 𓆪

👤 Player : {name}
🆔 ID : {id}

🔥 خوش آمدی به خانواده E10 🔥

اینجا جاییه که جنگجوهای واقعی کنار هم جمع میشن.
⚔️ تمرین کن، قوی‌تر شو و برای پیروزی بجنگ.

🏆 هدف ما:
Rank Up | Team Work | Victory

🚫 احترام به اعضا = قانون اول E10

☠️ E10 CLAN
『 ONE TEAM • ONE DREAM • ONE VICTORY 』

╚══════════════════╝`;

async function isAdminOrOwner(chatId, userId) {
    try {
        const chatMember = await bot.getChatMember(chatId, userId);
        if (chatMember.status === 'creator') return true;
        if (db.owners[chatId] && db.owners[chatId].includes(userId)) return true;
        if (chatMember.status === 'administrator') return true;
        if (db.admins[chatId] && db.admins[chatId].includes(userId)) return true;
        return false;
    } catch (e) {
        return false;
    }
}

async function isMainOwner(chatId, userId) {
    try {
        const chatMember = await bot.getChatMember(chatId, userId);
        return chatMember.status === 'creator';
    } catch (e) {
        return false;
    }
}

function getHelpKeyboard() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛡 مجازات', callback_data: 'help_punish' }, { text: '🎮 سرگرمی و ابزار', callback_data: 'help_fun' }],
                [{ text: '🔒 قفل‌ها', callback_data: 'help_locks' }, { text: '👑 ارتقا و عزل', callback_data: 'help_rank' }],
                [{ text: '✨ خوشامدگویی', callback_data: 'help_welcome' }, { text: '📢 عضویت اجباری', callback_data: 'help_force_sub' }],
                [{ text: '👥 اد اجباری', callback_data: 'help_force_add' }, { text: '🚫 فیلتر کلمات', callback_data: 'help_filter' }],
                [{ text: '👤 پنل کاربر', callback_data: 'help_user_panel' }, { text: '📊 آمار فعالیت‌ها', callback_data: 'help_stats' }],
                [{ text: '⚡️ اسپم', callback_data: 'help_spam' }]
            ]
        }
    };
}

bot.onText(/\/start|\bراهنما\b/i, async (msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') {
        return bot.sendMessage(chatId, "سلام! لطفا ربات رو مدیر گپتون کنید تا فعال بشه این ربات مخصوص کلن E10 است و ساخته شده توسط اعضای E10 ⚔️");
    }
    
    bot.sendMessage(chatId, "📋 **منوی مدیریت E10 Manager**\nلطفاً یکی از بخش‌های زیر را انتخاب کنید:", {
        parse_mode: 'Markdown',
        ...getHelpKeyboard()
    });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const userId = query.from.id;

    if (!(await isAdminOrOwner(chatId, userId))) {
        return bot.answerCallbackQuery(query.id, { text: '⚠️ این دستورات فقط برای مدیران و مالکان قابل استفاده است!', show_alert: true });
    }

    let text = '';
    let keyboard = { reply_markup: { inline_keyboard: [[{ text: '🔙 بازگشت', callback_data: 'help_back' }]] } };

    switch (data) {
        case 'help_punish':
            text = `🛡 **بخش مجازات:**\n\n- **بن / حذف بن**\n- **اختار / حذف اخطار / تنظیم اخطار**\n- **سکوت / حذف سکوت / سکوت موقت [دقیقه]**`;
            break;
        case 'help_fun':
            text = `🎮 **سرگرمی و ابزار:**\n- **فونت [متن]**\n- **پین / حذف پین**\n- **تاریخ عضویت**\n- **تگ**\n- **پنل کاربر**`;
            break;
        case 'help_locks':
            text = `🔒 **بخش قفل‌ها:**\nمدیریت قفل‌های لینک، گیف، استیکر، عکس و...`;
            break;
        case 'help_rank':
            text = `👑 **ارتقا و عزل:**\nتنظیم مدیر و تنظیم مالک ثانویه.`;
            break;
        case 'help_back':
            return bot.editMessageText("📋 **منوی مدیریت E10 Manager**\nلطفاً یکی از بخش‌های زیر را انتخاب کنید:", {
                chat_id: chatId,
                message_id: query.message.message_id,
                parse_mode: 'Markdown',
                ...getHelpKeyboard()
            });
    }

    bot.editMessageText(text, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        ...keyboard
    });
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const text = msg.text || msg.caption || '';
    if (!userId) return;

    if (!db.stats[chatId]) db.stats[chatId] = { total: 0, users: {} };
    db.stats[chatId].total++;
    saveDatabase();

    if (msg.chat.type === 'private') return;

    const isAdmin = await isAdminOrOwner(chatId, userId);

    if (!isAdmin) {
        if (db.filters[chatId] && db.filters[chatId].some(word => text.includes(word))) {
            return bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        }
    }

    // بن
    if (text.startsWith('بن') && msg.reply_to_message && isAdmin) {
        const targetId = msg.reply_to_message.from.id;
        await bot.banChatMember(chatId, targetId).catch(() => {});
        return bot.sendMessage(chatId, `👤 کاربر بن شد.`);
    }

    // اخطار
    if (text === 'اختار' && msg.reply_to_message && isAdmin) {
        const targetId = msg.reply_to_message.from.id;
        const key = `${chatId}_${targetId}`;
        db.warnings[key] = (db.warnings[key] || 0) + 1;
        saveDatabase();
        return bot.sendMessage(chatId, `⚠️ اخطار ثبت شد. تعداد: ${db.warnings[key]}`);
    }

    // سکوت
    if (text.startsWith('سکوت') && msg.reply_to_message && isAdmin) {
        const parts = text.split(' ');
        const targetId = msg.reply_to_message.from.id;
        if (parts.length > 1 && !isNaN(parts[1])) {
            const minutes = parseInt(parts[1]);
            const until = Math.floor(Date.now() / 1000) + (minutes * 60);
            await bot.restrictChatMember(chatId, targetId, { until_date: until, can_send_messages: false }).catch(() => {});
            return bot.sendMessage(chatId, `🔇 کاربر به مدت ${minutes} دقیقه سکوت شد.`);
        } else {
            await bot.restrictChatMember(chatId, targetId, { can_send_messages: false }).catch(() => {});
            return bot.sendMessage(chatId, `🔇 کاربر سکوت شد.`);
        }
    }

    // فونت
    if (text.startsWith('فونت ')) {
        const word = text.replace('فونت ', '');
        return bot.sendMessage(chatId, `✨ فونت: 𝄟${word}𝄟 | 𝓕𝓸𝓷𝓽: ${word} | 𝙵𝚘𝚗𝚝: ${word}`);
    }

    // پنل کاربر
    if (text === 'پنل کاربر' && msg.reply_to_message) {
        const target = msg.reply_to_message.from;
        return bot.sendMessage(chatId, `👤 نام: ${target.first_name}\n🆔 آیدی: \`${target.id}\``, { parse_mode: 'Markdown' });
    }
});

bot.on('new_chat_members', async (msg) => {
    const chatId = msg.chat.id;
    const newMember = msg.new_chat_member;
    if (!newMember) return;

    let customText = db.welcomeText[chatId] || defaultWelcome;
    customText = customText.replace('{name}', newMember.first_name).replace('{id}', newMember.id);
    bot.sendMessage(chatId, customText);
});

console.log("E10 Manager with Persistent Storage is running...");
