
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "https://jonathanibabao77.github.io",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "20kb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Lyrics backend is running." });
});

app.post("/api/generate-lyrics", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "The server API key is not configured."
      });
    }

    const { topic, language, style, mood } = req.body || {};

    if (typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({
        error: "Please enter a song topic."
      });
    }

    const safeLanguage =
      language === "Filipino" ? "Filipino" : "English";
    const safeStyle =
      typeof style === "string" ? style.slice(0, 100) : "Pop";
    const safeMood =
      typeof mood === "string" ? mood.slice(0, 100) : "Inspirational";

    const ai = new GoogleGenAI({ apiKey });

    const prompt = [
      "Write original song lyrics. Do not imitate a named artist or copy existing songs.",
      `Language: ${safeLanguage}`,
      `Topic: ${topic.trim().slice(0, 1000)}`,
      `Music style: ${safeStyle}`,
      `Mood: ${safeMood}`,
      "Use clear section headings such as Verse 1, Chorus, Verse 2, and Bridge.",
      "Return only the lyrics with section headings."
    ].join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt
    });

    return res.json({ lyrics: response.text || "" });
  
  } catch (error) {
    console.error("Lyrics generation error:", {
      message: error.message,
      status: error.status,
      code: error.code
    });

    const isBusy =
      error.status === 503 ||
      error.code === 503 ||
      error.status === "UNAVAILABLE";

    return res.status(isBusy ? 503 : 500).json({
      error: isBusy
        ? "Gemini is temporarily busy. Please try again shortly."
        : "Lyrics generation failed. Please check the server logs and try again."
    });
  }

});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Lyrics backend listening on port ${PORT}`);
});
