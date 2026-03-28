import OpenAI from 'openai';

// We use the OpenAI SDK but point it to Groq's OpenAI-compatible endpoint
export const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});
