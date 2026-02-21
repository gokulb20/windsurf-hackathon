# Quick Demo Setup

## 1. Get API Keys (5 minutes)

### Supabase (Free tier)
1. Go to [supabase.com](https://supabase.com) → Sign up → New Project
2. Copy: Project URL, anon key, service role key
3. Run `backend/schema.sql` in Supabase SQL Editor

### Gemini (Free tier)
1. Go to [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Create API key

### Gmail SMTP (Free)
1. Enable 2FA on your Gmail
2. Generate App Password: Google Account → Security → App Passwords
3. Use email + app password

## 2. Configure Environment

**Backend** (`backend/.env`):
```bash
PORT=5000
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# HMAC (generate random string)
HMAC_SECRET=your_random_secret_here_32_chars
```

**Frontend** (`frontend/.env`):
```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Run Demo

```bash
npm start
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 4. Demo Flow

1. **Create Account** → Sign up with any email
2. **Create Agreement** → Pick "Bill of Sale" → Fill details → Generate QR
3. **Sign Flow** → Open QR link in new tab (incognito) → Review → Explain → OTP → Sign
4. **Receipt** → View cryptographic proof

## Test Data Suggestions

- **Bill of Sale**: Laptop, $500, "John Doe" → "Jane Smith"
- **Roommate**: Rent split, utilities, quiet hours
- **Proof of Payment**: Freelance work, completed website, $1500

## Troubleshooting

- **Email not sending**: Check Gmail app password, try less secure apps setting
- **Supabase errors**: Verify schema.sql ran completely
- **CORS issues**: Ensure FRONTEND_URL matches your frontend URL
