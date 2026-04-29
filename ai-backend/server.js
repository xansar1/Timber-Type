import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("AI Backend Running 🚀");
});

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString("base64");

    // 🔥 AI REQUEST
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an interior design AI. Always respond in clean JSON format."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this room image and return JSON with: style, colors, suggestions"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    let resultText = data.choices?.[0]?.message?.content;

    // 🔥 Try parsing JSON safely
    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch {
      parsed = { raw: resultText };
    }

    // 🧹 Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    res.json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing failed" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(Server running on port ${process.env.PORT});
});
