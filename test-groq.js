const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env' });

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

async function main() {
  try {
    console.log('Testing Groq connection...');
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'In one sentence, confirm that Groq LPU inference is active.' }],
      max_tokens: 30,
    });
    console.log('Response:', completion.choices[0].message.content);
    console.log('✅ Groq Llama 3 API is fully functional!');
  } catch (error) {
    console.error('❌ Groq test failed:', error.message);
  }
}

main();
