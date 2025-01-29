import { BaseService } from "./base.service.js";
import EmberClient from "@emberai/sdk-typescript";

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

  public async start(): Promise<void> {
    try {
      console.log("[EmberService] Starting service...");

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
