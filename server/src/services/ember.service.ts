import { BaseService } from "./base.service.js";
import EmberClient from "@emberai/sdk-typescript";
import { OrderType, SwapTokensResponse } from "@emberai/sdk-typescript";

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

  private constructor() {
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

  public async executeSwap(
    action: AgentSwapAction
  ): Promise<SwapTokensResponse | void> {
    try {
      const client = EmberService.client;
      const { chains } = await client.getChains({
        pageSize: 10,
        filter: "",
        pageToken: "",
      });

      const ethereum = chains.find((c) => c.name.toLowerCase() === "ethereum");
      if (!ethereum) throw new Error("Chain not found");

      const swap = await client.swapTokens({
        type: OrderType.MARKET_BUY,
        baseToken: {
          chainId: ethereum.chainId,
          tokenId: action.params.baseToken,
        },
        quoteToken: {
          chainId: ethereum.chainId,
          tokenId: action.params.quoteToken,
        },
        amount: action.params.amount,
        recipient: action.params.recipient,
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
