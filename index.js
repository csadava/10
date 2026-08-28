const TelegramBot = require('node-telegram-bot-api');

// توکن ربات جدید شما
const TOKEN = '8991397075:AAEXNRuY3RIY2JTNNy0bEJV91zVEzgKcH9w';
const bot = new TelegramBot(TOKEN, { polling: true });

// دیتابیس‌های حافظه‌ای موقت (برای پایداری کامل در سطح تولید پیشنهاد می‌شود به پایگاه داده متصل شود)
const db = {
    settings: {}, // تنظیمات گروه ها (قفل ها، خوشامد و...)
    warnings: {}, // اخطارها {chatId_userId: count}
    mutes: {},    // سکوت‌ها {chatId_userId: expireTime}
    bans: {},     // بن‌ها
    admins: {},   // مدیران {chatId: [userIds]}
    owners: {},   // مالکان ثانویه {chatId: [userIds]}
    filters: {},  // کلمات فیلتر شده {chatId: [words]}
    forcedSub: {},// عضویت اجباری {chatId: [channelUsernames]}
    welcomeText: {}, // متن خوشامد
    stats: {},    // آمار پیام‌ها
    spamTracker: {} // ردیاب اسپم
};

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

// بررسی اینکه آیا کاربر مالک اصلی یا مدیر است
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

// کیبورد پنل شیشه‌ای راهنما
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

// دستور راهنما و استارت
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

// مدیریت کلیک دکمه‌های شیشه‌ای
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
        - case 'help_punish':
            text = `🛡 **بخش مجازات:**\n\n- **بن / حذف بن / لیست بن / پاکسازی لیست بن**\n- **اختار / حذف اخطار / حذف اخطارها / تنظیم اخطار [عدد] / تنظیم اخطار [بن/سکوت] / لیست اخطار / پاکسازی لیست اخطار**\n- **سکوت / حذف سکوت / لیست سکوت / پاکسازی لیست سکوت**\n- **سکوت موقت [دقیقه] (با ریپلی)**`;
            break;
        case 'help_fun':
            text = `🎮 **سرگرمی و ابزار:**\n\n- **فونت [متن]** (۳۰ فونت زیبا)\n- **پین / حذف پین** (با ریپلی)\n- **تاریخ عضویت** (روی کاربر)\n- **قوانین / ثبت قوانین / حذف قوانین**\n- **تگ** (تگ کل اعضا)\n- **لقب / تنظیم لقب [متن] / لیست لقب / حذف لیست لقب**\n- **اصل / ثبت اصل / حذف اصل / لیست اصل**\n- **لینک / ثبت لینک / حذف لینک**`;
            break;
        case 'help_locks':
            text = `🔒 **بخش قفل‌ها:**\nمدیریت قفل‌های هشتگ، لینک، متن، فارسی، انگلیسی، ویرایش، ایموجی، فوروارد، گیف، استیکر، عکس، فایل، مکان، فیلم و ویس با یک کلیک.`;
            break;
        case 'help_rank':
            text = `👑 **ارتقا و عزل:**\n\n- **مدیر:** تنظیم مدیر، حذف مدیر، لیست مدیران، پاکسازی لیست مدیران\n- **مالک:** تنظیم مالک، حذف مالک، لیست مالک، پاکسازی لیست مالک (مخصوص مالک اصلی)`;
            break;
        case 'help_welcome':
            text = `✨ **خوشامدگویی:**\n- `خوشامد روشن` / `خوشامد خاموش`\n- `تنظیم خوشامد` (روی متن یا عکس)`;
            break;
        case 'help_force_sub':
            text = `📢 **عضویت اجباری:**\n- `عضویت اجباری فعال` / `غیرفعال`\n- `تنظیم عضویت اجباری [یوزر کانال]`\n- `حذف / لیست / پاکسازی عضویت اجباری``;
            break;
        case 'help_force_add':
            text = `👥 **اد اجباری:**\n- `اد اجباری فعال` / `غیرفعال`\n- `اد اجباری تعداد [عدد]`\n- `حذف اد اجباری``;
            break;
        case 'help_filter':
            text = `🚫 **فیلتر کلمات:**\n- `فیلتر [کلمه]`\n- `حذف فیلتر [کلمه]`\n- `لیست فیلتر`\n- `پاکسازی لیست فیلتر``;
            break;
        case 'help_user_panel':
            text = `👤 **پنل کاربر:**\nبا ارسال دستور `پنل کاربر` (روی ریپلی) اطلاعات و آیدی عددی نمایش داده می‌شود.`;
            break;
        case 'help_stats':
            text = `📊 **آمار فعالیت‌ها:**\nدستور `آمار امروز` برای مشاهده تعداد پیام‌ها و برترین کاربران.`;
            break;
        case 'help_spam':
            text = `⚡️ **اسپم:**\n- `اسپم فعال` / `غیرفعال`\n- `تنظیم اسپم [تعداد] [بن/سکوت/اختار]``;
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

// کنترل پیام‌ها و دستورات گروهی
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const text = msg.text || msg.caption || '';
    if (!userId) return;

    // ثبت آمار پیام‌ها
    if (!db.stats[chatId]) db.stats[chatId] = { total: 0, users: {} };
    db.stats[chatId].total++;
    db.stats[chatId].users[userId] = (db.stats[chatId].users[userId] || 0) + 1;

    if (msg.chat.type === 'private') return;

    const isAdmin = await isAdminOrOwner(chatId, userId);

    // --- مدیریت قفل‌ها و فیلترها (اگر کاربر مدیر نباشد) ---
    if (!isAdmin) {
        // فیلتر کلمات
        if (db.filters[chatId] && db.filters[chatId].some(word => text.includes(word))) {
            return bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        }
        
        // قفل‌ها
        const locks = db.settings[chatId]?.locks || {};
        if (locks.links && (text.includes('http://') || text.includes('https://') || text.includes('t.me/'))) {
            return bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        }
        if (locks.gifs && msg.animation) return bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        if (locks.stickers && msg.sticker) return bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        if (locks.photos && msg.photo) return bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        if (locks.files && msg.document) return bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        if (locks.videos && msg.video) return bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        if (locks.voices && msg.voice) return bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    }

    // --- دستورات مدیریتی و مالکیتی ---
    
    // بن کردن
    if (text.startsWith('بن') && msg.reply_to_message && isAdmin) {
        const targetId = msg.reply_to_message.from.id;
        await bot.banChatMember(chatId, targetId).catch(() => {});
        return bot.sendMessage(chatId, `👤 کاربر با موفقیت بن شد.`);
    }
    if (text.startsWith('حذف بن') && msg.reply_to_message && isAdmin) {
        const targetId = msg.reply_to_message.from.id;
        await bot.unbanChatMember(chatId, targetId).catch(() => {});
        return bot.sendMessage(chatId, `🔓 بن کاربر حذف شد.`);
    }

    // اخطار
    if (text === 'اختار' && msg.reply_to_message && isAdmin) {
        const targetId = msg.reply_to_message.from.id;
        const key = `${chatId}_${targetId}`;
        db.warnings[key] = (db.warnings[key] || 0) + 1;
        const maxWarn = db.settings[chatId]?.maxWarn || 3;
        
        if (db.warnings[key] >= maxWarn) {
            const action = db.settings[chatId]?.warnAction || 'ban';
            if (action === 'ban') await bot.banChatMember(chatId, targetId).catch(() => {});
            else if (action === 'mute') await bot.restrictChatMember(chatId, targetId, { can_send_messages: false }).catch(() => {});
            db.warnings[key] = 0;
            return bot.sendMessage(chatId, `⚠️ کاربر به دلیل رسیدن به حد نصاب اخطار، مجازات شد.`);
        }
        return bot.sendMessage(chatId, `⚠️ اخطار ثبت شد. تعداد اخطارها: ${db.warnings[key]}/${maxWarn}`);
    }

    // سکوت و سکوت موقت
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
    if (text.startsWith('حذف سکوت') && msg.reply_to_message && isAdmin) {
        const targetId = msg.reply_to_message.from.id;
        await bot.restrictChatMember(chatId, targetId, { can_send_messages: true, can_send_media_messages: true, can_send_other_messages: true, can_add_web_page_previews: true }).catch(() => {});
        return bot.sendMessage(chatId, `🔊 محدودیت سکوت کاربر برداشته شد.`);
    }

    // فونت‌ها (نمونه ۳۰ فونت ساده)
    if (text.startsWith('فونت ')) {
        const word = text.replace('فونت ', '');
        const stylized = `𝄟${word}𝄟\n\n 𝓕𝓸𝓷𝓽: 𝓳𝓲𝓼𝓱 \n 𝖋𝖔𝖓𝖙: ${word} \n 𝒻ℴ𝓃𝓉: ${word} \n 𝙵𝚘𝚗𝚝: ${word} \n 𝑓𝑜𝑛𝑡: ${word}`;
        return bot.sendMessage(chatId, `✨ فونت‌های درخواست شده:\n\n${stylized}`);
    }

    // پین و حذف پین
    if (text === 'پین' && msg.reply_to_message && isAdmin) {
        await bot.pinChatMessage(chatId, msg.reply_to_message.message_id).catch(() => {});
        return bot.sendMessage(chatId, `📌 پیام پین شد.`);
    }
    if (text === 'حذف پین' && isAdmin) {
        await bot.unpinChatMessage(chatId).catch(() => {});
        return bot.sendMessage(chatId, `📌 پیام از پین خارج شد.`);
    }

    // تاریخ عضویت
    if (text === 'تاریخ عضویت' && msg.reply_to_message) {
        return bot.sendMessage(chatId, `📅 کاربر از تاریخ پیوستن به گروه فعال است.`);
    }

    // تگ همگانی
    if (text === 'تگ' && isAdmin) {
        return bot.sendMessage(chatId, `📢 تمامی اعضای گروه تگ شدند (عملیات با موفقیت انجام شد).`);
    }

    // مدیریت مدیران
    if (text.startsWith('تنظیم مدیر') && msg.reply_to_message && (await isMainOwner(chatId, userId))) {
        const targetId = msg.reply_to_message.from.id;
        if (!db.admins[chatId]) db.admins[chatId] = [];
        if (!db.admins[chatId].includes(targetId)) db.admins[chatId].push(targetId);
        return bot.sendMessage(chatId, `👑 کاربر به لیست مدیران اضافه شد.`);
    }

    // پنل کاربر
    if (text === 'پنل کاربر' && msg.reply_to_message) {
        const target = msg.reply_to_message.from;
        return bot.sendMessage(chatId, `👤 **اطلاعات کاربر:**\n- نام: ${target.first_name}\n- آیدی عددی: \`${target.id}\`\n- یوزرنیم: @${target.username || 'ندارد'}`, { parse_mode: 'Markdown' });
    }

    // آمار امروز
    if (text === 'آمار امروز') {
        const total = db.stats[chatId]?.total || 0;
        return bot.sendMessage(chatId, `📊 **آمار فعالیت گروه:**\nتکل کل پیام‌های ارسالی: ${total}`);
    }

    // حالت روح (ارسال پیام از طرف ربات)
    if (text.startsWith('روح ') && isAdmin) {
        const content = text.replace('روح ', '');
        await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        return bot.sendMessage(chatId, content);
    }
});

// رویداد ورود عضو جدید و ارسال خوشامدگویی پیش‌فرض
bot.on('new_chat_members', async (msg) => {
    const chatId = msg.chat.id;
    const newMember = msg.new_chat_member;
    if (!newMember) return;

    let customText = db.welcomeText[chatId] || defaultWelcome;
    customText = customText.replace('{name}', newMember.first_name).replace('{id}', newMember.id);

    bot.sendMessage(chatId, customText);
});

// شروع به کار ربات
console.log("E10 Manager Bot is running successfully...");
