import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";

// 🔑 Tokenlarni .env faylga yozing
// TELEGRAM_TOKEN=telegram_bot_token
// OPENAI_API_KEY=openai_api_key

import dotenv from "dotenv";
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔹 Foydalanuvchi yozsa – javob doim o‘zbek tilida
async function getAIResponse(message) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Sen yordamchi botsan. Har doim faqat o‘zbek tilida gapir. She’r, maqola, qo‘shiq, savol-javob va vazifa yechishda yordam berasan." },
        { role: "user", content: message }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Xatolik:", error);
    return "Kechirasiz, serverda xatolik yuz berdi 😔";
  }
}

// 🔹 Rasm yaratish
async function getAIImage(prompt) {
  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "512x512"
    });

    return response.data[0].url;
  } catch (error) {
    console.error("Rasm xatosi:", error);
    return null;
  }
}

// 🔹 /start komandasi
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Salom! Men AI botman.\n\nMen faqat o‘zbek tilida gapiraman.\n\nMenga savol bering, she’r yozdiring, maqola so‘rang, qo‘shiq tuzdiring yoki rasm yarating!"
  );
});

// 🔹 Matnni qayta ishlash
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  // Agar foydalanuvchi "rasm" yozsa
  if (text.toLowerCase().startsWith("rasm")) {
    const prompt = text.replace("rasm", "").trim() || "O‘zbekistondagi chiroyli tog‘ manzarasi";
    bot.sendMessage(chatId, "🎨 Rasm yaratilmoqda, biroz kuting...");

    const imageUrl = await getAIImage(prompt);
    if (imageUrl) {
      bot.sendPhoto(chatId, imageUrl, { caption: "Mana sizning rasmingiz ✨" });
    } else {
      bot.sendMessage(chatId, "❌ Rasm yaratishda xatolik bo‘ldi.");
    }
    return;
  }

  // Oddiy savol-javob, qo‘shiq, maqola va hokazo
  bot.sendChatAction(chatId, "typing");
  const answer = await getAIResponse(text);
  bot.sendMessage(chatId, answer);
});
