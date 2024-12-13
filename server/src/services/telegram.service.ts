import { Bot, webhookCallback } from "grammy";
import { BaseService } from "./base.service.js";
import { ElizaService } from "./eliza.service.js";

export class TelegramService extends BaseService {
  private static instance: TelegramService;
  private bot: Bot;
  private webhookUrl: string;
  private elizaService: ElizaService;

  private constructor(webhookUrl?: string) {
    super();
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is required");
    }
    if (webhookUrl != null) {
      this.webhookUrl = `${webhookUrl}/telegram/webhook`;
    }
    this.bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
    this.elizaService = ElizaService.getInstance(this.bot);
  }

  public static getInstance(webhookUrl?: string): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService(webhookUrl);
    }
    return TelegramService.instance;
  }

  public async setWebhook(webhookUrl: string): Promise<void> {
    this.webhookUrl = `${webhookUrl}/telegram/webhook`;
    await this.bot.api.setWebhook(this.webhookUrl);
    console.log("Telegram webhook set:", this.webhookUrl);
  }

  public getWebhookCallback() {
    return webhookCallback(this.bot, "express", {
      timeoutMilliseconds: 10 * 60 * 1000,
      onTimeout: "return",
    });
  }

  public async start(): Promise<void> {
    try {
      // all command handlers can be registered here
      this.bot.command("start", (ctx) => ctx.reply("Hello!"));
      this.bot.catch(async (error) => {
        console.error("Telegram bot error:", error);
      });
      await this.elizaService.start();

      this.bot.command("mint", async (ctx) => {
        ctx.reply("Minting...");
        const tokenInfo = {
          symbol: "TODO: Token Symbol",
          name: "TODO: Token Name",
          metadata: {
            // media: "TODO: add media url",
            description: "TODO: add description",
            website_link: "https://wow.xyz",
            twitter: "TODO: add twitter link",
            discord: "TODO: add discord link",
            telegram: "TODO: add telegram link",
          },
        };
        console.log("TokenInfoToMint", tokenInfo);
        // use fetch to call collabland backend to mint token and send response to telegram and log response
        const response = await fetch(
          "http://https://api-qa.collab.land/accountkit/telegrambot/mint?chainId=8453",
          {
            method: "POST",
            headers: {
              "X-API-KEY": process.env.COLLABLAND_API_KEY || "",
              "X-TG-BOT-TOKEN": process.env.TELEGRAM_BOT_TOKEN || "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(tokenInfo),
          }
        );
        const data = await response.json();
        console.log(data);
        // ctx.reply(JSON.stringify(data));
        // TODO: add a link to the token on the website

        // @ts-expect-error
        ctx.reply(`Minting completed, ${data.response.fungible.address}`);
      });
    } catch (error) {
      console.error("Failed to start Telegram bot:", error);
      throw error;
    }
  }

  public getBotInfo() {
    return this.bot.api.getMe();
  }

  public async stop(): Promise<void> {
    try {
      await this.bot.api.deleteWebhook();
    } catch (error) {
      console.error("Error stopping Telegram bot:", error);
    }
  }
}
