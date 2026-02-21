# Handshake

Legally binding agreements, as easy as a handshake. A mobile-first web app for creating, signing, and cryptographically securing peer-to-peer agreements.

## How It Works

1. **Create** — Sign in, pick a template (Bill of Sale, Roommate Agreement, Proof of Payment), fill in the details, and generate a QR code.
2. **Scan & Understand** — The other party scans the QR code (no account needed), reviews the contract, and taps "Explain" on any clause for a plain-language AI breakdown.
3. **Sign & Secure** — After email OTP verification, the signer agrees. An HMAC-SHA256 cryptographic receipt is generated as tamper-evident proof.

## Tech Stack

- **Frontend**: React 18, React Router, Lucide icons, QRCode.react
- **Backend**: Node.js, Express, express-rate-limit
- **Auth & Database**: Supabase (Auth + Postgres + RLS)
- **AI**: Google Gemini 1.5 Flash (clause explanation)
- **Email OTP**: SendGrid
- **Crypto**: HMAC-SHA256 receipt signing/verification

## Project Structure

```
windsurf-hackathon/
├── backend/
│   ├── lib/
│   │   ├── hmac.js          # HMAC-SHA256 receipt signing
│   │   ├── otp.js           # OTP generation, hashing, send/verify
│   │   ├── supabase.js      # Supabase service client
│   │   └── templates.js     # Agreement template definitions
│   ├── routes/
│   │   ├── agreements.js    # CRUD + signer access
│   │   ├── explain.js       # Gemini clause explanation
│   │   ├── otp.js           # Send/verify OTP
│   │   ├── receipts.js      # Receipt fetch + verify
│   │   └── sign.js          # Signing pipeline
│   ├── schema.sql           # Supabase SQL schema
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.js
│   │   ├── lib/
│   │   │   ├── api.js       # API client
│   │   │   └── supabase.js  # Supabase browser client
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CreateAgreement.js
│   │   │   ├── QRDisplay.js
│   │   │   ├── SignerView.js
│   │   │   └── Receipt.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/index.html
│   ├── .env.example
│   └── package.json
└── package.json
```

## Setup

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Supabase setup
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run `backend/schema.sql` in the Supabase SQL Editor to create all tables.
3. Copy your project URL, anon key, and service role key.

### 3. Configure environment

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```
Fill in: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `HMAC_SECRET`

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```
Fill in: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`

### 4. Run the app
```bash
npm start
```
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/agreements/templates` | List agreement templates |
| POST | `/api/agreements` | Create agreement (auth required) |
| GET | `/api/agreements` | List my agreements (auth required) |
| GET | `/api/agreements/sign/:token` | Signer access (public) |
| POST | `/api/otp/send` | Send OTP to signer email |
| POST | `/api/otp/verify` | Verify OTP code |
| POST | `/api/sign` | Sign agreement |
| POST | `/api/explain` | AI clause explanation |
| GET | `/api/receipts/:id` | Get receipt |
| POST | `/api/receipts/verify` | Verify receipt integrity |

## Jurisdiction

Canada-first. All templates include Canadian governing law clauses and explicit non-legal-advice disclaimers.
