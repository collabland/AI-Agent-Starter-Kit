// import { AnyType } from "../utils.js";
import { BaseService } from "./base.service.js";
// import { forward, Listener } from "@ngrok/ngrok";

export class NgrokService extends BaseService {
  private static instance: NgrokService;
  // private url: string | null = null;
  // private listener: Listener | null;

  private constructor() {
    super();
    // this.listener = null;
  }

  public static getInstance(): NgrokService {
    if (!NgrokService.instance) {
      NgrokService.instance = new NgrokService();
    }
    return NgrokService.instance;
  }

  public async start(): Promise<void> {
    // ! Moved the NGROK tunnel creation to the main script
    // ! It injects a NGROK_URL env variable to the .env file in the root
    // if (!process.env.NGROK_AUTH_TOKEN) {
    //   throw new Error("NGROK_AUTH_TOKEN is required");
    // }
    // if (!process.env.PORT) {
    //   throw new Error("PORT is required");
    // }
    // if (!process.env.NGROK_DOMAIN) {
    //   throw new Error("NGROK_DOMAIN is required");
    // }
    // try {
    //   this.listener = await forward({
    //     addr: process.env.PORT,
    //     proto: "http",
    //     authtoken: process.env.NGROK_AUTH_TOKEN,
    //     domain: process.env.NGROK_DOMAIN,
    //   });
    //   this.url = this.listener.url();
    //   console.log("NGROK tunnel created:", this.url);
    //   return;
    // } catch (error: AnyType) {
    //   console.error("NGROK Error Details:", {
    //     message: error.message,
    //     response: error.response?.statusCode,
    //     body: error.response?.body,
    //   });
    //   throw new Error("Failed to create NGROK tunnel");
    // }
  }

  public getUrl(): string | undefined {
    return process.env.NGROK_URL;
  }

  public async stop(): Promise<void> {
    // if (this.listener) {
    //   await this.listener.close();
    //   this.listener = null;
    //   this.url = null;
    // }
  }
}
