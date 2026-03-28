const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  try {
    console.log('Testing OpenAI connection...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "OpenAI is working!"' }],
      max_tokens: 10,
    });
    console.log('Response:', completion.choices[0].message.content);
    console.log('✅ OpenAI test passed.');
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
  }
}

main();
