# Dubai Estate AI - OpenAI & n8n Integration

A Next.js-based real estate application featuring OpenAI GPT-4 integration for AI-powered assistance and n8n webhook integration for lead logging to Google Sheets.

## Features

- 🤖 **OpenAI GPT-4 Integration**: Streaming AI responses for real estate queries
- 📊 **Lead Tracking**: Automatic logging to Google Sheets via n8n webhooks
- 🏠 **Guided Flows**: Structured conversations for buyers, sellers, and referrals
- 💬 **Real-time Streaming**: Token-by-token streaming for responsive chat experience
- 📱 **Responsive Design**: Mobile-optimized with Tailwind CSS
- 🔧 **Interactive Tools**: ROI calculator and referral forms

## Environment Variables

Create a `.env.local` file in the root directory:

```env
OPENAI_API_KEY=your-openai-api-key-here
N8N_WEBHOOK_URL=your-n8n-webhook-url-here
```

## n8n Webhook Setup

1. Create a new workflow in n8n
2. Add a Webhook node as the trigger
3. Configure the webhook to receive JSON data
4. Add a Google Sheets node to append the data
5. Map the following fields:
   - Event Type
   - Intent
   - Flow
   - Timestamp
   - Additional data (ROI calculations, referral info, etc.)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dubai-estate-ai.git
cd dubai-estate-ai
```

2. Install dependencies:
```bash
npm install
```

3. Add your environment variables to `.env.local`

4. Start the development server:
```bash
npm run dev
```

## Key Components

### Chat API Route (`app/api/chat/route.ts`)
- Integrates with OpenAI's GPT-4 API
- Implements streaming responses using Server-Sent Events
- Handles error cases gracefully

### Logging API Route (`app/api/log/route.ts`)
- Forwards events to n8n webhook
- Validates webhook URL configuration
- Returns success/error status

### ChatInterface Component
- Manages conversation flows
- Implements real-time streaming UI
- Logs all user interactions
- Handles guided conversations and free-form queries

## Event Types Logged

- `user_intent`: Initial flow selection
- `roi_calculation`: ROI calculator submissions with results
- `referral_submission`: Referral form completions
- `call_request`: Call scheduling requests
- `email_request`: Email summary requests
- `ai_query`: Free-form AI questions

## Deployment

Deploy on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## License

MIT License

// === Folder Tree ===

├── .env.local
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts
│   │   └── log/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   ├── ChatInterface.jsx
│   ├── Finance.jsx
│   ├── Footer.jsx
│   ├── Header.jsx
│   ├── HelpCenter.jsx
│   ├── Hero.jsx
│   ├── HowItWorks.jsx
│   ├── Message.jsx
│   ├── ReferEarn.jsx
│   ├── Services.jsx
│   └── Tools.jsx
├── lib/
│   └── n8nLead.ts
├── next.config.js
├── package.json
├── README.md
├── tailwind.config.js
└── tsconfig.json

