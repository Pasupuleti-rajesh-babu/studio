"use client";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Use the same key as ApiKeyContext for consistency
const API_KEY_STORAGE_KEY = 'habitlocal_gemini_api_key'; 

/** Call Gemini Flash and return plain text */
export async function runGemini(prompt: string): Promise<string> {
  const apiKey = typeof window !== 'undefined' ? window.localStorage.getItem(API_KEY_STORAGE_KEY) : null;
  if (!apiKey) {
    console.error("Missing Gemini API key in localStorage (key: " + API_KEY_STORAGE_KEY + ")");
    throw new Error("Missing Gemini API key. Please set it in the app settings.");
  }

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({ 
    model: "gemini-1.5-flash-latest",
    safetySettings: [ // Optional: configure safety settings if needed
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    }
  );

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("Invalid Gemini API key. Please check and update your key in settings.");
    }
    throw new Error("Failed to get response from AI. Ensure your API key is valid and has quota.");
  }
}
