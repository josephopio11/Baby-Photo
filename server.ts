import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Need a larger limit for uploading images (e.g. 50MB)
app.use(express.json({ limit: "50mb" }));

app.post("/api/enhance", async (req, res) => {
  try {
    const { imageBase64, mimeType, settings } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    if (settings && settings.provider === "local") {
      const { customUrl, customModel, customApiKey } = settings;
      if (!customUrl) {
         return res.status(400).json({ error: "Local provider URL is missing." });
      }

      // Standard OpenAI API Chat Completion payload for Vision
      const payload = {
        model: customModel || "llava",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Carefully restore, upscale, and clean up this old baby photo. Remove scratches, dust, and noise. Sharpen the details to make it crisp and clear while preserving the original subject's appearance and the vintage feel." },
              { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } }
            ]
          }
        ]
      };

      const headers: any = {
        "Content-Type": "application/json"
      };

      if (customApiKey) {
        headers["Authorization"] = `Bearer ${customApiKey}`;
      }

      try {
        const fetchRes = await fetch(`${customUrl.replace(/\/$/, '')}/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });

        if (!fetchRes.ok) {
           const errorText = await fetchRes.text();
           return res.status(500).json({ error: `Local model error (${fetchRes.status}): ${errorText}` });
        }
        
        const data = await fetchRes.json();
        const msgContent = data.choices?.[0]?.message?.content || "";
        
        // As local LLMs (Ollama/LMStudio) on chat/completions return text instead of generating images,
        // we'll explicitly display their text output in the error if they don't produce a raw base64 PNG.
        if (msgContent && msgContent.includes("data:image")) {
          // If the model incredibly generated a data URI, pass it back
          return res.json({ resultImage: msgContent });
        }

         return res.status(500).json({ error: `Ollama/LMStudio successfully responded, but returned text instead of editing the image: "${msgContent}"` });
      } catch (e: any) {
         return res.status(500).json({ error: `Local API connection failed: ${e.message}` });
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Using interactions API for image editing
    const interaction = await ai.interactions.create({
      model: "gemini-3.1-flash-image-preview",
      input: [
        {
          type: "image",
          data: imageBase64,
          mime_type: mimeType || "image/jpeg",
        },
        {
          type: "text",
          text: "Carefully restore, upscale, and clean up this old baby photo. Remove scratches, dust, and noise. Sharpen the details to make it crisp and clear while preserving the original subject's appearance and the vintage feel.",
        },
      ],
    });

    let outputData = null;
    let outputMimeType = null;

    for (const step of interaction.steps) {
      if (step.type === "model_output") {
        const imageContent: any = step.content?.find((c: any) => c.type === "image");
        if (imageContent && imageContent.data) {
          outputData = imageContent.data;
          outputMimeType = imageContent.mime_type || "image/png";
        }
      }
    }

    if (outputData) {
      res.json({ resultImage: `data:${outputMimeType};base64,${outputData}` });
    } else {
      res.status(500).json({ error: "Model did not return an image." });
    }
  } catch (error: any) {
    console.error("Error enhancing image:", error);
    res.status(500).json({ error: error.message || "Failed to edit image." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
