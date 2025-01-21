import { Bot, webhookCallback } from "grammy";
import { BaseService } from "./base.service.js";
import { ElizaService } from "./eliza.service.js";
import {
  AnyType,
  getCollablandApiUrl,
  getTokenMetadataPath,
  MintResponse,
  TokenMetadata,
} from "../utils.js";
import fs from "fs";
import axios, { AxiosResponse, isAxiosError } from "axios";
import { parse as jsoncParse } from "jsonc-parser";
import path, { resolve } from "path";
import { keccak256, getBytes, toUtf8Bytes } from "ethers";
import { TwitterService } from "./twitter.service.js";
import { NgrokService } from "./ngrok.service.js";

// hack to avoid 400 errors sending params back to telegram. not even close to perfect
const htmlEscape = (_key: AnyType, val: AnyType) => {
  if (typeof val === "string") {
    return val
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;"); // single quote
  }
  return val;
};

const __dirname = path.dirname(new URL(import.meta.url).pathname);
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
    const client = axios.create({
      baseURL: getCollablandApiUrl(),
      headers: {
        "X-API-KEY": process.env.COLLABLAND_API_KEY || "",
        "X-TG-BOT-TOKEN": process.env.TELEGRAM_BOT_TOKEN || "",
        "Content-Type": "application/json",
      },
      timeout: 5 * 60 * 1000,
    });
    try {
      //all command descriptions can be added here
      this.bot.api.setMyCommands([
        {
          command: "start",
          description: "Add any hello world functionality to your bot",
        },
        { command: "mint", description: "Mint a token on Wow.xyz" },
        { command: "eliza", description: "Talk to the AI agent" },
        { command: "lit", description: "Execute a Lit action" },
      ]);
      // all command handlers can be registered here
      this.bot.command("start", (ctx) => ctx.reply("Hello!"));
      this.bot.catch(async (error) => {
        console.error("Telegram bot error:", error);
      });
      await this.elizaService.start();

      this.bot.command("mint", async (ctx) => {
        const ngrokURL = await NgrokService.getInstance().getUrl();
        try {
          ctx.reply("Minting your token...");
          const tokenPath = getTokenMetadataPath();
          const tokenInfo = jsoncParse(
            fs.readFileSync(tokenPath, "utf8")
          ) as TokenMetadata;
          console.log("TokenInfoToMint", tokenInfo);
          console.log("Hitting Collab.Land APIs to mint token...");
          const { data: _tokenData } = await client.post<
            AnyType,
            AxiosResponse<MintResponse>
          >(`/telegrambot/evm/mint?chainId=8453`, {
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
          });
          console.log("Mint response from Collab.Land:");
          console.dir(_tokenData, { depth: null });
          const tokenData = _tokenData.response.contract.fungible;
          await ctx.reply(
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
          const twitterClient = await TwitterService.getInstance().getScraper();
          const twitterBotInfo = await twitterClient.me();
          await ctx.reply(
            `🐦 Posting a tweet about the new token...\n\n` +
              `Twitter account details:\n<pre lang="json"><code>${JSON.stringify(
                twitterBotInfo,
                null,
                2
              )}</code></pre>`,
            {
              parse_mode: "HTML",
            }
          );
          const claimURL = `${process.env.NEXT_PUBLIC_HOSTNAME}/claim/${tokenData.address}`;
          const botUsername = twitterBotInfo?.username;
          console.log("botUsername:", botUsername);
          console.log("claimURL:", claimURL);
          const slug =
            Buffer.from(claimURL).toString("base64url") +
            ":" +
            Buffer.from(botUsername!).toString("base64url");
          console.log("slug:", slug);
          const cardURL = `${ngrokURL}/auth/twitter/card/${slug}/index.html`;
          console.log("cardURL:", cardURL);
          const twtRes = await twitterClient.sendTweet(
            `I just minted a token on Base using Wow!\nThe ticker is $${tokenData.symbol}\nClaim early alpha here: ${cardURL}`
          );
          if (twtRes.ok) {
            const tweetId = (await twtRes.json()) as AnyType;
            console.log("Tweet posted successfully:", tweetId);
            const tweetURL = `https://twitter.com/${twitterBotInfo?.username}/status/${tweetId?.data?.create_tweet?.tweet_results?.result?.rest_id}`;
            console.log("Tweet URL:", tweetURL);
            await ctx.reply(
              `Tweet posted successfully!\n\n` +
                `🎉 Tweet details: ${tweetURL}`,
              {
                parse_mode: "HTML",
              }
            );
          } else {
            console.error("Failed to post tweet:", await twtRes.json());
            await ctx.reply("Failed to post tweet");
          }
        } catch (error) {
          if (isAxiosError(error)) {
            console.error("Failed to mint token:", error.response?.data);
          } else {
            console.error("Failed to mint token:", error);
          }
          ctx.reply("Failed to mint token");
        }
      });
      this.bot.command("lit", async (ctx) => {
        try {
          const action = ctx.match;
          console.log("action:", action);
          const actionHashes = JSON.parse(
            (
              await fs.readFileSync(
                resolve(
                  __dirname,
                  "..",
                  "..",
                  "..",
                  "lit-actions",
                  "actions",
                  `ipfs.json`
                )
              )
            ).toString()
          );
          console.log("actionHashes:", actionHashes);
          const actionHash = actionHashes[action];
          console.log("actionHash:", actionHash);
          if (!actionHash) {
            ctx.reply(`Action not found: ${action}`);
            return;
          }
          let jsParams;
          // ! NOTE: You can change the chainId to any chain you want to execute the action on
          const chainId = 8453;
          switch (action) {
            case "hello-action": {
              // ! NOTE: The message to sign can be any normal message, or raw TX
              // ! In order to sign EIP-191 message, you need to encode it properly, Lit protocol does raw signatures
              const messageToSign =
                ctx.from?.username ?? ctx.from?.first_name ?? "";
              const messageToSignDigest = keccak256(toUtf8Bytes(messageToSign));
              jsParams = {
                helloName: messageToSign,
                toSign: Array.from(getBytes(messageToSignDigest)),
              };
              break;
            }
            case "decrypt-action": {
              const toEncrypt = `encrypt-decrypt-test-${new Date().toUTCString()}`;
              ctx.reply(`Invoking encrypt action with ${toEncrypt}`);
              const { data } = await client.post(
                `/telegrambot/executeLitActionUsingPKP?chainId=${chainId}`,
                {
                  actionIpfs: actionHashes["encrypt-action"].IpfsHash,
                  actionJsParams: {
                    toEncrypt,
                  },
                }
              );
              console.log("encrypt response ", data);
              const { ciphertext, dataToEncryptHash } = JSON.parse(
                data.response.response
              );
              jsParams = {
                ciphertext,
                dataToEncryptHash,
                chain: "base",
              };
              break;
            }
            case "encrypt-action": {
              const message =
                ctx.from?.username ?? ctx.from?.first_name ?? "test data";
              // ! NOTE: You can send any jsParams you want here, it depends on your Lit action code
              jsParams = {
                toEncrypt: `${message}-${new Date().toUTCString()}`,
              };
              break;
            }
            default: {
              // they typed something random or a dev forgot to update this list
              ctx.reply(`Action not handled: ${action}`);
              return;
            }
          }
          await ctx.reply(
            "Executing action..." +
              `\n\nAction Hash: <code>${actionHash.IpfsHash}</code>\n\nParams:\n<pre lang="json"><code>${JSON.stringify(
                jsParams,
                htmlEscape,
                2
              )}</code></pre>`,
            {
              parse_mode: "HTML",
            }
          );
          console.log(
            `[telegram.service] executing lit action with hash ${actionHash.IpfsHash} on chain ${chainId}`
          );
          const { data } = await client.post(
            `/telegrambot/executeLitActionUsingPKP?chainId=${chainId}`,
            {
              actionIpfs: actionHash.IpfsHash,
              actionJsParams: jsParams,
            }
          );
          console.log(
            `Action with hash ${actionHash.IpfsHash} executed on Lit Nodes 🔥`
          );
          console.log("Result:", data);
          ctx.reply(
            `Action executed on Lit Nodes 🔥\n\n` +
              `Action: <code>${actionHash.IpfsHash}</code>\n` +
              `Result:\n<pre lang="json"><code>${JSON.stringify(
                data,
                null,
                2
              )}</code></pre>`,
            {
              parse_mode: "HTML",
            }
          );
        } catch (error) {
          if (isAxiosError(error)) {
            console.error(
              "Failed to execute Lit action:",
              error.response?.data
            );
            ctx.reply(
              "Failed to execute Lit action" +
                `\n\nError: <pre lang="json"><code>${JSON.stringify(
                  error.response?.data,
                  null,
                  2
                )}</code></pre>`,
              {
                parse_mode: "HTML",
              }
            );
          } else {
            console.error("Failed to execute Lit action:", error);
            ctx.reply(
              "Failed to execute Lit action" +
                `\n\nError: <pre lang="json"><code>${JSON.stringify(
                  error?.message,
                  null,
                  2
                )}</code></pre>`,
              {
                parse_mode: "HTML",
              }
            );
          }
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
