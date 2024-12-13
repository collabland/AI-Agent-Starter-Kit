import { Bot, webhookCallback } from "grammy";
import { BaseService } from "./base.service.js";
import { ElizaService } from "./eliza.service.js";
import {
  AnyType,
  getTokenMetadataPath,
  MintResponse,
  TokenMetadata,
} from "../utils.js";
import fs from "fs";
import axios, { AxiosResponse, isAxiosError } from "axios";
import { parse as jsoncParse } from "jsonc-parser";
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
      //all command descriptions can be added here
      this.bot.api.setMyCommands([
        {
          command: "start",
          description: "Add hello world functionality to your bot",
        },
        { command: "mint", description: "Mint a token on Wow.xyz" },
        { command: "eliza", description: "Talk to the AI agent" },
      ]);
      // all command handlers can be registered here
      this.bot.command("start", (ctx) => ctx.reply("Hello!"));
      this.bot.catch(async (error) => {
        console.error("Telegram bot error:", error);
      });
      await this.elizaService.start();

      this.bot.command("mint", async (ctx) => {
        try {
          ctx.reply("Minting your token...");
          const tokenPath = getTokenMetadataPath();
          const tokenInfo = jsoncParse(
            fs.readFileSync(tokenPath, "utf8")
          ) as TokenMetadata;
          console.log("TokenInfoToMint", tokenInfo);
          console.log("Hitting Collab.Land APIs to mint token...");
          const { data: _tokenData } = await axios.post<
            AnyType,
            AxiosResponse<MintResponse>
          >(
            "https://api-qa.collab.land/accountkit/telegrambot/mint?chainId=8453",
            {
              name: tokenInfo.name,
              symbol: tokenInfo.symbol,
              metadata: {
                description: tokenInfo.description ?? "",
                website_link: tokenInfo.websiteLink ?? "",
                twitter: tokenInfo.twitter ?? "",
                discord: tokenInfo.discord ?? "",
                telegram: tokenInfo.telegram ?? "",
                media: tokenInfo.image ?? "",
                nsfw: tokenInfo.nsfw ?? false,
              },
            },
            {
              headers: {
                "X-API-KEY": process.env.COLLABLAND_API_KEY || "",
                "X-TG-BOT-TOKEN": process.env.TELEGRAM_BOT_TOKEN || "",
                "Content-Type": "application/json",
              },
            }
          );
          console.log("Mint response from Collab.Land:");
          console.dir(_tokenData, { depth: null });
          const tokenData = _tokenData.response.contract.fungible;
          ctx.reply(
            `Your token has been minted on wow.xyz 🥳
Token details:
<pre><code class="language-json">${JSON.stringify(tokenData, null, 2)}</code></pre>

You can view the token page below (it takes a few minutes to be visible)`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "View Wow.xyz Token Page",
                      url: `https://wow.xyz/${tokenData.address}`,
                    },
                  ],
                ],
              },
              parse_mode: "HTML",
            }
          );
        } catch (error) {
          if (isAxiosError(error)) {
            console.error("Failed to mint token:", error.response?.data);
          } else {
            console.error("Failed to mint token:", error);
          }
          ctx.reply("Failed to mint token");
        }
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
