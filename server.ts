import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// API route for Lyria Music Generation
app.post('/api/generate-music', async (req, res) => {
  try {
    const { prompt, model = 'lyria-3-clip-preview' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A prompt string is required to generate music.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in Secrets.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const selectedModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    console.log(`Generating soundtrack using ${selectedModel}: "${prompt.slice(0, 60)}..."`);

    const response = await ai.models.generateContentStream({
      model: selectedModel,
      contents: prompt,
      config: {
        responseModalities: [Modality.AUDIO],
      },
    });

    let audioBase64 = '';
    let mimeType = 'audio/wav';
    let lyrics = '';

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      return res.status(500).json({ error: 'No audio data received from the music model.' });
    }

    res.json({
      audioBase64,
      mimeType,
      lyrics,
      model: selectedModel,
    });
  } catch (error: any) {
    console.error('Music generation error:', error);
    res.status(500).json({
      error: error?.message || 'An error occurred while generating soundtrack music.',
    });
  }
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
  app.get('*', (_req, res) => {
    res.sendFile('dist/index.html', { root: '.' });
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`ECHO//9 full-stack server running on http://0.0.0.0:${port}`);
});
