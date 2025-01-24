# 🤖 AI Agent Starter Kit

A modern full-stack AI-enabled template using Next.js for frontend and Express.js for backend, with Telegram and OpenAI integrations! ✨

> [!IMPORTANT]
> The AI Agent Starter Kit is powered by the Collab.Land AccountKit APIs
> 
> More information here: https://accountkit-docs-qa.collab.land/

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
├── 📦 scripts/             # Project scripts
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

- `ELIZA_CHARACTER_PATH`: 🤖

  1. Default: "character.json"
  2. Points to a JSON file containing your AI agent's personality configuration
  3. Example paths:
     - character.json (default Ace personality)
     - vaitalik.json (Vitalik personality)
     - custom/my-agent.json (your custom personality)

- `TOKEN_DETAILS_PATH`: Points to a JSON/JSONC file containing your token metadata for minting

  1. Default: "token_metadata.example.jsonc"
  2. Steps:
  3. Copy the template: `cp token_metadata.example.jsonc token.jsonc`
  4. Set this env var to point to your file
  5. Example: `token.jsonc`

- `TWITTER_CLIENT_ID` & `TWITTER_CLIENT_SECRET`: Authentication credentials for Twitter API integration

  1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
  2. Create a new project/app if you haven't already
  3. Navigate to "Keys and Tokens" section
  4. Under "OAuth 2.0 Client ID and Client Secret":
     - Copy "Client ID" → `TWITTER_CLIENT_ID`
     - Generate "Client Secret" → `TWITTER_CLIENT_SECRET`
  5. Configure OAuth settings:
     - Add callback URL: `http://localhost:3001/auth/twitter/callback` (development)
     - Add your production callback URL if deploying
  6. Format: Alphanumeric strings
  7. Example:
     ```env
     TWITTER_CLIENT_ID=Abc123XyzClientID
     TWITTER_CLIENT_SECRET=Xyz789AbcClientSecret
     ```

- `DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET`: Authentication credentials for Discord API integration

  1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
  2. Click "New Application" or select existing one
  3. Navigate to "OAuth2" section in left sidebar
  4. Under "Client Information":
     - Copy "Client ID" → `DISCORD_CLIENT_ID`
     - Copy "Client Secret" → `DISCORD_CLIENT_SECRET`
  5. Configure OAuth settings:
     - Add redirect URL: `http://localhost:3001/auth/discord/callback` (development)
     - Add your production redirect URL if deploying
     - Select required scopes (typically `identify` and `email`)
  6. Format: Alphanumeric strings
  7. Example:
     ```env
     DISCORD_CLIENT_ID=123456789012345678
     DISCORD_CLIENT_SECRET=abcdef123456789xyz
     ```

- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: Authentication credentials for GitHub OAuth integration

  1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
  2. Click "New OAuth App" or select existing one
  3. Under "OAuth Apps" settings:
     - Application name: Your app name
     - Homepage URL: `http://localhost:3001` (development)
     - Authorization callback URL: `http://localhost:3001/auth/github/callback`
  4. After creating/selecting the app:
     - Copy "Client ID" → `GITHUB_CLIENT_ID`
     - Generate new "Client Secret" → `GITHUB_CLIENT_SECRET`
  5. Configure OAuth scopes:
     - Recommended scopes: `read:user`, `user:email`
  6. Format: Alphanumeric strings
  7. Example:
     ```env
     GITHUB_CLIENT_ID=1234567890abcdef1234
     GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
     ```

- `ORBIS_CONTEXT_ID`, `ORBIS_TABLE_ID`, & `ORBIS_ENV`: OrbisDB table identifiers to enable gated memory storage functionality

  1. Visit the [Orbis Studio](https://studio.useorbis.com/) and log in with your browser wallet. Once logged in, set up a new context under the `Contexts` tab. Assign that value to `ORBIS_CONTEXT_ID` in your .env file

  2. On the right-hand side of the same page, you should see a variable called "Environment ID" - this is the DID representation of the address you used to sign into the hosted Orbis studio. Assign this value to `ORBIS_ENV` in your .env file

  3. Generate an OrbisDB seed to self-authenticate onto the Ceramic network and save to `ORBIS_SEED`:
    ```sh
    pnpm gen-seed
    ```

  4. Finally, deploy your OrbisDB data model we will use to create and query via vector search. Copy the value prefixed with "k" into your `.env` file next to `ORBIS_TABLE_ID`:
    ```sh
    pnpm deploy-model
    ```

  5. You can use the default provided values for `ORBIS_GATEWAY_URL` AND `CERAMIC_NODE_URL` provided in your .env.example file as-is

**Note**: For production, update the Homepage URL and callback URL to your production domain.

**Security Notes**:

- Never commit these values to version control
- Use different credentials for development and production
- Rotate secrets periodically
- Store production secrets in secure environment variables

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
2. Use Tailwind CSS for styling
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
  "image": "ipfs://your_ipfs_hash", // Upload image to IPFS first
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

## 📝 Contributing

### Commit Message Format

Follow these commit message guidelines to automate changelog generation:

- `feat: add new feature` - New features (generates under 🚀 Features)
- `fix: resolve bug` - Bug fixes (generates under 🐛 Bug Fixes)
- `docs: update readme` - Documentation changes (generates under 📝 Documentation)
- `chore: update deps` - Maintenance (generates under 🧰 Maintenance)

Example:

```bash
git commit -m "feat: add OAuth support for Discord"
git commit -m "fix: resolve token validation issue"
```

## 🔥 Developing Lit Actions

### Setup

1. Navigate to lit-actions directory:

```bash
cd lit-actions
pnpm install
```

2. Configure environment:

```bash
cp .env.example .env
```

Required variables:

- `PINATA_JWT`: Your Pinata JWT for IPFS uploads
- `PINATA_URL`: Pinata gateway URL

### Development Workflow

1. Create new action in `src/actions/`:

```typescript
/// <reference path="../global.d.ts" />

const go = async () => {
  // Access Lit SDK APIs
  const tokenId = await Lit.Actions.pubkeyToTokenId({ publicKey });

  // Sign data
  const signature = await Lit.Actions.signEcdsa({
    publicKey,
    toSign,
    sigName,
  });

  // Return response
  Lit.Actions.setResponse({
    response: JSON.stringify({ result: "success" }),
  });
};

go();
```

2. Start development server:

```bash
pnpm run dev
```

This will:

- Build TypeScript → JavaScript
- Bundle with dependencies
- Inject SDK shims
- Upload to IPFS
- Watch for changes

### Adding SDK Shims

1. Create shim in `shims/`:

```javascript
// shims/my-sdk.shim.js
import { MySDK } from "my-sdk";
globalThis.MySDK = MySDK;
```

2. Update types in `src/global.d.ts`:

```typescript
declare global {
  const MySDK: typeof MySDK;
}
```

### Building & Deployment

```bash
# Build only
pnpm run build

# Build & deploy to IPFS
pnpm run start
```

IPFS hashes are saved to `actions/ipfs.json`:

```json
{
  "my-action.js": {
    "IpfsHash": "Qm...",
    "PinSize": 12345,
    "Timestamp": "2025-01-03T..."
  }
}
```

### Available APIs

The Lit Actions runtime provides:

- **Lit.Actions**

  - `signEcdsa()`: Sign data with PKP
  - `pubkeyToTokenId()`: Convert public key to token ID
  - `getPermittedAuthMethods()`: Get permitted auth methods
  - `checkConditions()`: Check access control conditions
  - `setResponse()`: Return data to client
  - Full API in `src/global.d.ts`

- **Built-in SDKs**
  - `ethers`: Ethereum interactions
  - `Buffer`: Buffer utilities

### Best Practices

1. **Type Safety**

   - Always reference `global.d.ts`
   - Define types for parameters
   - Use TypeScript features

2. **SDK Management**

   - Create minimal shims
   - Document SDK versions
   - Test SDK compatibility

3. **Action Structure**

   - One action per file
   - Clear async/await flow
   - Proper error handling

4. **Deployment**
   - Test locally first
   - Verify IPFS uploads
   - Keep actions small

### Scripts

```bash
pnpm run dev        # Development mode
pnpm run build     # Build actions
pnpm run start     # Deploy to IPFS
pnpm run lint      # Fix code style
pnpm run watch     # Watch mode
```

### Project Structure

```
lit-actions/
├── actions/           # Built JS + IPFS hashes
├── shims/            # SDK shims
├── src/
│   ├── actions/      # TypeScript sources
│   ├── global.d.ts   # Type definitions
│   └── index.ts      # IPFS deployment
├── esbuild.js        # Build config
└── package.json
```

For more details, check the [Lit Protocol docs](https://developer.litprotocol.com/v3/).
