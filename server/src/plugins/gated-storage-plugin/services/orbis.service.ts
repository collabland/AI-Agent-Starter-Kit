import { OrbisDB, OrbisConnectResult, CeramicDocument } from "@useorbis/db-sdk";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";
import { Memory, Content } from "@ai16z/eliza";

export type ServerMessage = {
  content: string;
  createdAt: string;
  embedding: number[];
  is_user: boolean;
};

export type VerifiedContent = {
  address: string;
  user_id: string;
  verified: boolean;
};

export class Orbis {
  private static instance: Orbis;
  private db: OrbisDB;

  private constructor() {
    if (!process.env.ORBIS_GATEWAY_URL) {
      throw new Error(
        "ORBIS_GATEWAY_URL is not defined in the environment variables."
      );
    }
    if (!process.env.CERAMIC_NODE_URL) {
      throw new Error(
        "CERAMIC_NODE_URL is not defined in the environment variables."
      );
    }
    this.db = new OrbisDB({
      ceramic: {
        gateway: process.env.CERAMIC_NODE_URL,
      },
      nodes: [
        {
          gateway: process.env.ORBIS_GATEWAY_URL,
        },
      ],
    });
  }

  public static getInstance(): Orbis {
    if (!Orbis.instance) {
      Orbis.instance = new Orbis();
    }
    return Orbis.instance;
  }

  public async getAuthenticatedInstance(): Promise<OrbisConnectResult> {
    if (!process.env.ORBIS_SEED) {
      throw new Error(
        "ORBIS_SEED is not defined in the environment variables."
      );
    }
    const seed = new Uint8Array(JSON.parse(process.env.ORBIS_SEED));
    const auth = await OrbisKeyDidAuth.fromSeed(seed);
    return await this.db.connectUser({ auth });
  }

  public async getController(): Promise<string> {
    await this.getAuthenticatedInstance();
    if (!this.db.did?.id) {
      throw new Error("Ceramic DID not initialized");
    }
    return this.db.did?.id;
  }

  public async updateOrbis(content: ServerMessage): Promise<CeramicDocument> {
    if (!process.env.ORBIS_TABLE_ID) {
      throw new Error(
        "ORBIS_TABLE_ID is not defined in the environment variables."
      );
    }
    if (!process.env.ORBIS_CONTEXT_ID) {
      throw new Error(
        "ORBIS_CONTEXT_ID is not defined in the environment variables."
      );
    }
    await this.getAuthenticatedInstance();

    return await this.db
      .insert(process.env.ORBIS_TABLE_ID)
      .value(content)
      .context(process.env.ORBIS_CONTEXT_ID)
      .run();
  }

  public async createVerifiedEntry(
    content: VerifiedContent
  ): Promise<CeramicDocument> {
    if (!process.env.VERIFIED_TABLE) {
      throw new Error("Missing verified table");
    }
    if (!process.env.ORBIS_CONTEXT_ID) {
      throw new Error(
        "ORBIS_CONTEXT_ID is not defined in the environment variables."
      );
    }
    try {
      await this.getAuthenticatedInstance();
      return await this.db
        .insert(process.env.VERIFIED_TABLE)
        .value(content)
        .context(process.env.ORBIS_CONTEXT_ID)
        .run();
    } catch (error) {
      console.error("Error storing message:", error);
      throw error;
    }
  }

  public async queryKnowledgeIndex(text: string): Promise<{
    columns: Array<string>;
    rows: ServerMessage[];
  } | null> {
    await this.getAuthenticatedInstance();
    const result = await this.db.select().raw(text).run();
    return result as {
      columns: Array<string>;
      rows: ServerMessage[];
    } | null;
  }
}
