import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helloRouter from "./routes/hello.js";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { NgrokService } from "./services/ngrok.service.js";
import { TelegramService } from "./services/telegram.service.js";
import { IService } from "./services/base.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const services: IService[] = [];

dotenv.config({
  path: resolve(__dirname, "../../.env"),
});

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());
app.use("/hello", helloRouter);

// Register webhook endpoint first
const telegramService = TelegramService.getInstance();
app.use("/telegram/webhook", telegramService.getWebhookCallback());

app.listen(port, async () => {
  try {
    console.log(`Server running on PORT: ${port}`);
    console.log("Server Environment:", process.env.NODE_ENV);

    const ngrokService = NgrokService.getInstance();
    await ngrokService.start();
    services.push(ngrokService);

    const ngrokUrl = ngrokService.getUrl()!;
    console.log("NGROK URL:", ngrokUrl);

    await telegramService.start();
    await telegramService.setWebhook(ngrokUrl);
    services.push(telegramService);

    const botInfo = await telegramService.getBotInfo();
    console.log("Telegram Bot URL:", `https://t.me/${botInfo.username}`);
  } catch (e) {
    console.error("Failed to start server:", e);
    process.exit(1);
  }
});

// catch-all routes
app.use("/", async (_req, res) => {
  console.log("Getting hello world...");
  res
    .status(200)
    .json({ message: "Hello World", timestamp: new Date().toISOString() });
});

async function gracefulShutdown() {
  console.log("Shutting down gracefully...");
  await Promise.all(services.map((service) => service.stop()));
  process.exit(0);
}

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
