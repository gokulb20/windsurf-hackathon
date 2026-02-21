#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Handshake Demo Setup');
console.log('======================\n');

// Generate HMAC secret
const hmacSecret = crypto.randomBytes(32).toString('hex');
console.log('✅ Generated HMAC Secret:');
console.log(hmacSecret);
console.log();

console.log('📋 Next Steps:');
console.log('1. Create Supabase project: https://supabase.com');
console.log('2. Run backend/schema.sql in Supabase SQL Editor');
console.log('3. Get Gemini API key: https://aistudio.google.com/app/apikey');
console.log('4. Create Gmail App Password for SMTP');
console.log('5. Copy the HMAC secret above to your .env files');
console.log('6. Fill in backend/.env and frontend/.env');
console.log('7. Run: npm start');
console.log();
console.log('🚀 Demo will be ready at http://localhost:3000');
