# Gemini AI Chat

A full-stack AI chat application built with React, Node.js/Express, and Google Gemini.

## Project Structure

```
windsurf-hackathon/
├── backend/          # Node.js + Express API
│   ├── routes/
│   │   └── chat.js   # Gemini AI chat route
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/         # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatMessage.js
│   │   │   └── ChatMessage.css
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   └── package.json
└── package.json      # Root scripts
```

## Setup

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` and add your [Google Gemini API key](https://aistudio.google.com/app/apikey):
```
PORT=5000
GEMINI_API_KEY=your_api_key_here
```

### 3. Run the app
```bash
# Run backend and frontend together
npm start

# Or separately:
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/chat` | Send message to Gemini |

### POST `/api/chat`
```json
{
  "message": "Hello!",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "model", "content": "..." }
  ]
}
```
