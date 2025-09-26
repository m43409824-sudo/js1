// file.js
import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!TELEGRAM_TOKEN || !OPENAI_API_KEY) {
  console.error("❌ .env faylida TELEGRAM_TOKEN va OPENAI_API_KEY ni kiriting!");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Foydalanuvchilar ro'yxati
let users = new Set();

// ✅ Foydalanuvchini qo‘shish
bot.on("message", (msg) => {
  users.add(msg.chat.id);
});

// 📝 Oddiy savollarga javob berish
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.toLowerCase();

  if (!text) return;

  // 🔹 Agar rasm so‘rasa
  if (text.includes("rasm") || text.includes("chiz")) {
    try {
      bot.sendMessage(chatId, "⏳ O‘ylayapman, rasm chizilyapti...");

      const img = await openai.images.generate({
        model: "gpt-image-1",
        prompt: text,
        size: "512x512",
      });

      const imageUrl = img.data[0].url;
      bot.sendPhoto(chatId, imageUrl, { caption: "Mana rasm 🎨" });
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "❌ Rasm chizishda xatolik bo‘ldi.");
    }
    return;
  }

  // 🔹 Agar qo‘shiq so‘rasa
  if (text.includes("qo‘shiq") || text.includes("musiqa")) {
    try {
      bot.sendMessage(chatId, "🎵 Qo‘shiq yaratilmoqda, biroz kuting...");

      const song = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: `O'zbek tilida qisqa qo‘shiq yarat: ${text}`,
      });

      const buffer = Buffer.from(await song.arrayBuffer());
      const filePath = `song_${chatId}.mp3`;
      fs.writeFileSync(filePath, buffer);

      await bot.sendAudio(chatId, filePath, { title: "Yangi qo‘shiq 🎶" });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "❌ Qo‘shiq yaratishda xatolik bo‘ldi.");
    }
    return;
  }

  // 🔹 Oddiy javoblar
  try {
    bot.sendMessage(chatId, "🤔 O‘ylayapman...");

    const reply = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Sen foydalanuvchi bilan faqat o‘zbek tilida gaplashadigan aqlli Telegram botisan. Har doim yordam berishga tayyor bo‘l.",
        },
        { role: "user", content: text },
      ],
    });

    bot.sendMessage(chatId, reply.choices[0].message.content || "🤷‍♂️ Javob topilmadi.");
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Javob yaratishda xatolik bo‘ldi.");
  }
});

// 🔹 Admin foydalanuvchilarni ko‘rish
bot.onText(/\/users/, (msg) => {
  const chatId = msg.chat.id;
  const userList = Array.from(users).join("\n");
  bot.sendMessage(chatId, `👥 Bot foydalanuvchilari:\n${userList}`);
});

console.log("✅ Mukammal AI Bot ishga tushdi!");





































