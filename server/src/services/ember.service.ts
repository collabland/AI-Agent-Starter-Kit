import { BaseService } from "./base.service.js";
import EmberClient from "@emberai/sdk-typescript";
import { OrderType, SwapTokensResponse } from "@emberai/sdk-typescript";
import { privateKeyToAccount } from "viem/accounts";

export interface AgentSwapAction {
  type: "SWAP" | "YIELD" | "BALANCE_CHECK";
  params: {
    baseToken: string;
    quoteToken: string;
    amount: string;
    recipient: string;
  };
  status: "PENDING" | "EXECUTED" | "FAILED";
}

/**
 * EmberService class - https://www.emberai.xyz/
 * Bridging the gap between Agents and dApps
 */
export class EmberService extends BaseService {
  private static client: EmberClient;

  public constructor() {
    super();
  }

  public static getClient(): EmberClient {
    if (!EmberService.client) {
      EmberService.client = new EmberClient({
        endpoint: process.env.EMBER_ENDPOINT_URL || "api.emberai.xyz:443",
        apiKey: process.env.EMBER_API_KEY || "",
      });
    }
    return EmberService.client;
  }

  /**
   * executeSwap - Executes a swap between two tokens
   * @param action
   * @returns
   */
  public async executeSwap(
    action: AgentSwapAction
  ): Promise<SwapTokensResponse | void> {
    this.start();

    try {
      const client = EmberService.getClient();

      const { chains } = await client.getChains({
        pageSize: 10,
        filter: "",
        pageToken: "",
      });

      const ethereum = chains.find((c) => c.name.toLowerCase() === "ethereum");
      if (!ethereum) throw new Error("Chain not found");

      // Get tokens on Ethereum
      const { tokens } = await client.getTokens({
        chainId: ethereum.chainId,
        pageSize: 100,
        filter: "",
        pageToken: "",
      });

      // Find USDC and WETH tokens
      const baseToken = tokens.find(
        (token) => token.symbol === action.params.baseToken
      );
      const quoteToken = tokens.find(
        (token) => token.symbol === action.params.quoteToken
      );

      if (!baseToken || !quoteToken) {
        throw new Error("Required tokens not found");
      }

      const account = privateKeyToAccount(
        action.params.recipient as `0x${string}`
      );

      const swap = await client.swapTokens({
        type: OrderType.MARKET_BUY,
        baseToken: {
          chainId: ethereum.chainId,
          tokenId: baseToken?.tokenId as string,
        },
        quoteToken: {
          chainId: ethereum.chainId,
          tokenId: quoteToken?.tokenId as string,
        },
        amount: action.params.amount,
        recipient: account.address,
      });

      action.status = "EXECUTED";
      // this.actions.push(action);

      return swap;
    } catch (error) {
      action.status = "FAILED";
      throw error;
    }
  }

  public async start(): Promise<void> {
    console.log("[EmberService] Starting service...");

    try {
      if (!EmberService.client) {
        EmberService.client = EmberService.getClient();
      }
    } catch (error) {
      console.error("[EmberService] Error:", error);
      throw new Error("Ember service failed to start.");
    }
  }

  public async stop(): Promise<void> {
    console.log("[EmberService] Stopping service...");
  }
}
