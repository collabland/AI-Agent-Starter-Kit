# 🤖 Collab-Thon AI Bot Template

A modern full-stack AI-enabled template using Next.js for frontend and Express.js for backend, with Telegram and OpenAI integrations! ✨

## 🎯 Cursor IDE Integration

This template is specially crafted for the Cursor IDE, offering:

- 🤖 AI-assisted development with inline code explanations
- 🔍 Smart environment variable setup assistance
- 💡 Intelligent error resolution
- 📝 Context-aware code completion
- 🛠️ Built-in debugging helpers

Just highlight any error message, code snippet, or variable in Cursor and ask the AI for help!

### 🎮 Quick Cursor Commands

- `Cmd/Ctrl + K`: Ask AI about highlighted code
- `Cmd/Ctrl + L`: Get code explanations
- `Cmd/Ctrl + I`: Generate code completions
- Highlight any error message to get instant fixes

## 🚀 Getting Started

1. Prerequisites:

```bash
node >= 22 🟢
pnpm >= 9.14.1 📦
```

2. Install dependencies:

```bash
pnpm install
```

3. Fire up the dev servers:

```bash
pnpm run dev
```

## 📁 Repository Structure

```
.
├── 📦 client/                 # Next.js frontend
│   ├── 📱 app/               # Next.js app router (pages, layouts)
│   ├── 🧩 components/        # React components
│   │   └── HelloWorld.tsx    # Example component with API integration
│   ├── 💅 styles/           # Global styles and Tailwind config
│   │   ├── globals.css      # Global CSS and Tailwind imports
│   │   └── tailwind.config.ts # Tailwind configuration
│   ├── 🛠️ bin/             # Client scripts
│   │   └── validate-env     # Environment variables validator
│   ├── next.config.js       # Next.js configuration (API rewrites)
│   ├── .env.example         # Example environment variables for client
│   └── tsconfig.json        # TypeScript configuration
│
├── ⚙️ server/               # Express.js backend
│   ├── 📂 src/             # Server source code
│   │   ├── 🛣️ routes/     # API route handlers
│   │   │   └── hello.ts    # Example route with middleware
│   │   └── index.ts        # Server entry point (Express setup)
│   ├── 🛠️ bin/            # Server scripts
│   │   ├── validate-env    # Environment validator
│   │   └── www-dev        # Development server launcher
│   └── tsconfig.json       # TypeScript configuration
│
├── ��� scripts/             # Project scripts
│   └── dev                 # Concurrent dev servers launcher
│
├── 📝 .env.example         # Root environment variables example for server
├── 🔧 package.json         # Root package with workspace config
└── 📦 pnpm-workspace.yaml  # PNPM workspace configuration
```

## 🔐 Environment Variables

> 💡 Pro Tip: In Cursor IDE, highlight any environment variable name and ask the AI for setup instructions!

### Client (.env)

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3001) 🌐
- `NEXT_PUBLIC_TELEGRAM_BOT_NAME`: Telegram bot name without the @ symbol, you can get it from BotFather after creating your bot (default: your_bot_username) 🤖

### Server (.env)

- `PORT`: Server port (default: 3001) 🚪
- `NODE_ENV`: Environment (development/production) 🌍
- `TELEGRAM_BOT_TOKEN`: 🤖

  1. Open Telegram and search for @BotFather
  2. Start chat and send `/newbot`
  3. Follow prompts to name your bot
  4. Copy the provided token

- `OPENAI_API_KEY`: 🧠

  1. Visit https://platform.openai.com/api-keys
  2. Click "Create new secret key"
  3. Give it a name and copy the key immediately
  4. Set usage limits in API settings if needed

- `NGROK_AUTH_TOKEN`: 🔗

  1. Create account at https://dashboard.ngrok.com/signup
  2. Go to https://dashboard.ngrok.com/get-started/your-authtoken
  3. Copy your authtoken

- `NGROK_DOMAIN`: 🔗

  1. Go to https://dashboard.ngrok.com/domains
  2. Copy your domain (without https://)

- `COLLABLAND_API_KEY`: 🤝

  1. Visit https://dev-portal-qa.collab.land/signin
  2. Click on "Get Started"
  3. Select Telegram login
  4. Login with Telegram
  5. Verify your e-mail with the OTP sent to your inbox
  6. Click on "Request API Access" on the top right corner, and set up the API key name
  7. Copy your API key

- `GAIANET_MODEL`: 🤖

  1. Visit https://docs.gaianet.ai/user-guide/nodes
  2. Choose your model (default: llama)
  3. Copy the model name

- `GAIANET_SERVER_URL`: 🌐

  1. Visit https://docs.gaianet.ai/user-guide/nodes
  2. Get server URL for your chosen model
  3. Default: https://llama8b.gaia.domains/v1

- `GAIANET_EMBEDDING_MODEL`: 🧬

  1. Visit https://docs.gaianet.ai/user-guide/nodes
  2. Choose embedding model (default: nomic-embed)
  3. Copy the model name

- `USE_GAIANET_EMBEDDING`: ⚙️

  1. Set to TRUE to enable Gaianet embeddings
  2. Set to FALSE to disable (default: TRUE)

- `JOKERACE_CONTRACT_ADDRESS`: 🎰

  1. Go to https://www.jokerace.io/contest/new
  2. Create the contest
  3. Copy the contract address

> 🔒 Note: Keep these tokens secure! Never commit them to version control. The template's `.gitignore` has your back!

## 🚀 Production Setup

1. Build both apps:

```bash
pnpm run build
```

2. Launch production servers:

```bash
pnpm start
```

3. For production deployment: 🌎

- Set `NODE_ENV=production`
- Use proper SSL certificates 🔒
- Configure CORS settings in server/src/index.ts 🛡️
- Set up error handling and logging 📝
- Use process manager like PM2 ⚡

## 🔧 Advanced Usage

### 🎯 Adding New Environment Variables

1. Client:

```javascript
const ENV_HINTS = {
  NEXT_PUBLIC_API_URL: "Your API URL (usually http://localhost:3001)",
  // Add more hints as needed! ✨
};
```

2. Server:

```javascript
const ENV_HINTS = {
  PORT: "API port (usually 3001)",
  NODE_ENV: "development or production",
  TELEGRAM_BOT_TOKEN: "Get from @BotFather",
  OPENAI_API_KEY: "Get from OpenAI dashboard",
  NGROK_AUTH_TOKEN: "Get from ngrok dashboard",
  // Add more hints as needed! ✨
};
```

3. Add TypeScript types in respective env.d.ts files 📝

### 🛣️ API Routes

1. Create new route file in server/src/routes/
2. Import and use in server/src/index.ts
3. Add corresponding client API call in client/components/

### 🎨 Frontend Components

1. Create component in client/components/
2. Use Tailwind CSS for styling ��
3. Follow existing patterns for API integration

### ⚙️ Backend Middleware

1. Create middleware in server/src/middleware/
2. Apply globally or per-route basis

### 🪙 Minting Tokens

1. Copy the token metadata template:

```bash
cp token_metadata.example.jsonc token.jsonc
```

2. Edit `token.jsonc` with your token details:
```jsonc
{
  "name": "YourToken", // Token name
  "symbol": "TOKEN", // Token symbol (2-6 chars)
  "description": "Your token description", 
  "websiteLink": "https://yoursite.com",
  "twitter": "your_twitter_handle",
  "discord": "https://discord.gg/your_server", 
  "telegram": "your_bot_telegram_username",
  "nsfw": false,
  "image": "ipfs://your_ipfs_hash" // Upload image to IPFS first
}
```

3. Update `.env` to point to your token file:
```env
TOKEN_DETAILS_PATH=token.jsonc
```

4. Start your bot and use the `/mint` command in Telegram. The bot will:
- Read your token config
- Mint on Base Sepolia testnet
- Return contract details and token page URL

> Note: Make sure you have set up your COLLABLAND_API_KEY and TELEGRAM_BOT_TOKEN in .env first.

## 📚 Sources

- Next.js App Router: https://nextjs.org/docs/app 🎯
- Express.js: https://expressjs.com/ ⚡
- Tailwind CSS: https://tailwindcss.com/docs 💅
- TypeScript: https://www.typescriptlang.org/docs/ 📘
