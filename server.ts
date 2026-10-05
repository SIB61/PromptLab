import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const app = express();

// Enable JSON parsing with large limit for attached files/images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

interface FilePayload {
  name: string;
  type: string;
  size: number;
  content: string; // text or base64 data URL
  isBase64?: boolean;
}

interface TestPromptRequest {
  systemPrompt?: string;
  humanPrompt: string;
  files?: FilePayload[];
  model?: string;
  temperature?: number;
  topP?: number;
  responseFormat?: 'text' | 'json';
  thinkingLevel?: 'MINIMAL' | 'LOW' | 'HIGH' | 'AUTO';
}

function buildContents(humanPrompt: string, files: FilePayload[] = []) {
  const parts: any[] = [];

  // Add files first as context attachments
  if (files && files.length > 0) {
    for (const file of files) {
      if (file.isBase64 && file.content.startsWith('data:')) {
        // Multimodal image or document
        const matches = file.content.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const data = matches[2];
          parts.push({
            inlineData: {
              mimeType,
              data,
            },
          });
          parts.push({
            text: `[Attached Input File: "${file.name}" (${mimeType})]`,
          });
          continue;
        }
      }

      // Plain text or code file
      parts.push({
        text: `--- BEGIN ATTACHED FILE: ${file.name} (${file.type || 'text/plain'}) ---\n${file.content}\n--- END ATTACHED FILE: ${file.name} ---`,
      });
    }
  }

  // Add human prompt
  parts.push({
    text: humanPrompt,
  });

  return parts;
}

// Fallback model list if the requested model hits a temporary 503 high demand spike
function getModelCandidateList(preferredModel?: string): string[] {
  const primary = preferredModel || 'gemini-3.1-flash-lite';
  const candidates = [
    primary,
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];
  return Array.from(new Set(candidates));
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Non-streaming test execution endpoint with smart fallback
app.post('/api/test-prompt', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const {
    systemPrompt = '',
    humanPrompt = '',
    files = [],
    model = 'gemini-3.1-flash-lite',
    temperature = 0.7,
    topP = 0.95,
    responseFormat = 'text',
    thinkingLevel,
  }: TestPromptRequest = req.body;

  if (!humanPrompt.trim() && (!files || files.length === 0)) {
    return res.status(400).json({ error: 'Human prompt or input file is required.' });
  }

  try {
    const contents = buildContents(humanPrompt, files);

    const config: any = {
      temperature: Number(temperature),
      topP: Number(topP),
    };

    if (systemPrompt && systemPrompt.trim()) {
      config.systemInstruction = systemPrompt.trim();
    }

    if (responseFormat === 'json') {
      config.responseMimeType = 'application/json';
    }

    if (thinkingLevel && thinkingLevel !== 'AUTO') {
      if (thinkingLevel === 'MINIMAL') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      } else if (thinkingLevel === 'LOW') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (thinkingLevel === 'HIGH') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }
    }

    const modelQueue = getModelCandidateList(model);
    let response: any = null;
    let modelUsed = model || 'gemini-3.1-flash-lite';
    let lastError: any = null;

    for (const candidateModel of modelQueue) {
      try {
        response = await ai.models.generateContent({
          model: candidateModel,
          contents: { parts: contents },
          config,
        });
        modelUsed = candidateModel;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${candidateModel} failed (${err.status || err.message}). Attempting fallback...`);
      }
    }

    if (!response) {
      throw lastError || new Error('No candidate models could fulfill the request.');
    }

    const durationMs = Date.now() - startTime;
    const textOutput = response.text || '';
    const usageMetadata = response.usageMetadata;

    return res.json({
      success: true,
      output: textOutput,
      durationMs,
      model: modelUsed,
      finishReason: response.candidates?.[0]?.finishReason || 'STOP',
      usage: {
        promptTokens: usageMetadata?.promptTokenCount || Math.ceil((humanPrompt.length + systemPrompt.length) / 4),
        candidatesTokens: usageMetadata?.candidatesTokenCount || Math.ceil(textOutput.length / 4),
        totalTokens: usageMetadata?.totalTokenCount || Math.ceil((humanPrompt.length + systemPrompt.length + textOutput.length) / 4),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error generating content:', err);
    const durationMs = Date.now() - startTime;
    return res.status(500).json({
      success: false,
      error: err.message || 'An error occurred while testing the prompt.',
      durationMs,
      timestamp: new Date().toISOString(),
    });
  }
});

// SSE Streaming test execution endpoint with smart fallback
app.post('/api/test-prompt/stream', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const {
    systemPrompt = '',
    humanPrompt = '',
    files = [],
    model = 'gemini-3.1-flash-lite',
    temperature = 0.7,
    topP = 0.95,
    responseFormat = 'text',
    thinkingLevel,
  }: TestPromptRequest = req.body;

  if (!humanPrompt.trim() && (!files || files.length === 0)) {
    return res.status(400).json({ error: 'Human prompt or input file is required.' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const contents = buildContents(humanPrompt, files);

    const config: any = {
      temperature: Number(temperature),
      topP: Number(topP),
    };

    if (systemPrompt && systemPrompt.trim()) {
      config.systemInstruction = systemPrompt.trim();
    }

    if (responseFormat === 'json') {
      config.responseMimeType = 'application/json';
    }

    if (thinkingLevel && thinkingLevel !== 'AUTO') {
      if (thinkingLevel === 'MINIMAL') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      } else if (thinkingLevel === 'LOW') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (thinkingLevel === 'HIGH') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }
    }

    const modelQueue = getModelCandidateList(model);
    let responseStream: any = null;
    let modelUsed = model || 'gemini-3.1-flash-lite';
    let lastError: any = null;

    for (const candidateModel of modelQueue) {
      try {
        responseStream = await ai.models.generateContentStream({
          model: candidateModel,
          contents: { parts: contents },
          config,
        });
        modelUsed = candidateModel;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Streaming candidate ${candidateModel} failed. Attempting next fallback...`);
      }
    }

    if (!responseStream) {
      throw lastError || new Error('Stream could not be established.');
    }

    let fullText = '';
    let finalUsage: any = null;
    let finishReason = 'STOP';

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || '';
      fullText += chunkText;

      if (chunk.usageMetadata) {
        finalUsage = chunk.usageMetadata;
      }
      if (chunk.candidates?.[0]?.finishReason) {
        finishReason = chunk.candidates[0].finishReason;
      }

      // Send chunk event
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
    }

    const durationMs = Date.now() - startTime;

    // Send final completion event
    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        output: fullText,
        durationMs,
        model: modelUsed,
        finishReason,
        usage: {
          promptTokens: finalUsage?.promptTokenCount || Math.ceil((humanPrompt.length + systemPrompt.length) / 4),
          candidatesTokens: finalUsage?.candidatesTokenCount || Math.ceil(fullText.length / 4),
          totalTokens:
            finalUsage?.totalTokenCount ||
            Math.ceil((humanPrompt.length + systemPrompt.length + fullText.length) / 4),
        },
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    res.end();
  } catch (err: any) {
    console.error('Streaming error:', err);
    const durationMs = Date.now() - startTime;
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: err.message || 'Stream generation failed.',
        durationMs,
      })}\n\n`
    );
    res.end();
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Prompt Tester server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
