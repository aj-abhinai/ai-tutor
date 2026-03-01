// Google Gemini API client for image/text generation and OCR
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { IMAGE_MODEL, TEXT_MODEL, OCR_MODEL } from "./config";

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

export function getImageModel() {
  const client = getGeminiClient();
  return client.getGenerativeModel({
    model: IMAGE_MODEL,
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
    },
    safetySettings: SAFETY_SETTINGS,
  });
}

export function getTextModel() {
  const client = getGeminiClient();
  return client.getGenerativeModel({
    model: TEXT_MODEL,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  });
}

export async function generateImageWithREST(
  prompt: string,
  referenceImageBase64?: string | string[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const parts: any[] = [];
  
  const referenceImages = Array.isArray(referenceImageBase64)
    ? referenceImageBase64
    : referenceImageBase64
      ? [referenceImageBase64]
      : [];

  for (const ref of referenceImages) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: ref,
      },
    });
  }
  
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      topK: 40,
      responseModalities: ["IMAGE"],
    },
    safetySettings: SAFETY_SETTINGS.map(s => ({
      category: s.category,
      threshold: s.threshold,
    })),
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image generation failed: ${response.status} ${error}`);
  }

  const result = await response.json();
  if (!result.candidates || result.candidates.length === 0) {
    throw new Error("No response from image generation");
  }

  const candidate = result.candidates[0];
  if (!candidate.content || !candidate.content.parts) {
    throw new Error("Invalid response format");
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }

  throw new Error("No image data in response");
}

export async function extractTextFromImageWithREST(imageBase64: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${OCR_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType: "image/png",
            data: imageBase64,
          },
        },
        {
          text: "Read all visible text from the image exactly as shown. Return only the extracted text, no explanation. If no text is visible, return NO_TEXT.",
        },
      ],
    }],
    generationConfig: {
      temperature: 0,
      topP: 1,
      topK: 1,
      maxOutputTokens: 512,
      responseModalities: ["TEXT"],
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OCR text extraction failed: ${response.status} ${error}`);
  }

  const result = await response.json();
  const candidate = result?.candidates?.[0];
  const parts = candidate?.content?.parts;

  if (!parts || !Array.isArray(parts)) {
    return "";
  }

  const textPart = parts.find((part: any) => typeof part?.text === "string");
  const extracted = (textPart?.text ?? "").trim();

  if (extracted.toUpperCase() === "NO_TEXT") {
    return "";
  }

  return extracted;
}
