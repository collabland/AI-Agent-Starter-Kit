import { OrbisDB, OrbisConnectResult, CeramicDocument } from "@useorbis/db-sdk";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";
import { Memory, Content } from "@ai16z/eliza";

export type ServerMessage = Memory & {
  content: Content | string;
  createdAt: string;
  is_user: boolean;
};

export class Orbis {
  private static instance: Orbis;
  private db: OrbisDB;

  private constructor() {
    if (!process.env.ENV_ID) {
      throw new Error("ENV_ID is not defined in the environment variables.");
    }
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
          env: process.env.ENV_ID,
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
    if (!process.env.TABLE_ID) {
      throw new Error("TABLE_ID is not defined in the environment variables.");
    }
    if (!process.env.CONTEXT_ID) {
      throw new Error(
        "CONTEXT_ID is not defined in the environment variables."
      );
    }
    await this.getAuthenticatedInstance();

    return await this.db
      .insert(process.env.TABLE_ID)
      .value(content)
      .context(process.env.CONTEXT_ID)
      .run();
  }

  public async query(text: string): Promise<{
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
