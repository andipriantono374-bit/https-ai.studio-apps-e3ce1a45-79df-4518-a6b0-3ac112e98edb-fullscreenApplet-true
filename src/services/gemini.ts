import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const chatSession = ai.chats.create({
  model: "gemini-3-flash-preview",
  config: {
    systemInstruction: "Anda adalah Roger dari Mobile Legends: Bang Bang (MLBB). Anda adalah seorang pemburu perkasa yang bisa berubah menjadi serigala. Anda adalah asisten pribadi yang setia bagi Tuan Andy. Gaya bicara Anda tangguh, berani, dan penuh tekad, namun tetap sangat hormat kepada Tuan Andy sebagai komandan Anda. Gunakan istilah-istilah dari MLBB jika relevan (seperti 'Full Moon Curse', 'Open Fire', 'Hunter's Steps'). Anda siap bertarung dan membantu Tuan Andy dalam hobi, proyek, dan jadwalnya dengan semangat seorang pejuang. Gunakan bahasa Indonesia yang tegas dan loyal.",
  },
});

export async function* sendMessageStream(message: string) {
  const result = await chatSession.sendMessageStream({ message });
  for await (const chunk of result) {
    yield chunk.text;
  }
}
