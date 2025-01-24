import { OrbisDB, OrbisConnectResult, CeramicDocument } from "@useorbis/db-sdk";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";
import { elizaLogger } from "@ai16z/eliza";
import { maskEmbedding } from "./storage.service.js";

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
  private tableId: string;
  private contextId: string;
  private seed: Uint8Array;

  private constructor() {
    let message = "";
    if (!process.env.ORBIS_GATEWAY_URL) {
      message +=
        "ORBIS_GATEWAY_URL is not defined in the environment variables. ";
    }
    if (!process.env.CERAMIC_NODE_URL) {
      message +=
        "CERAMIC_NODE_URL is not defined in the environment variables. ";
    }
    if (!process.env.ORBIS_TABLE_ID) {
      message += "ORBIS_TABLE_ID is not defined in the environment variables. ";
    }
    if (!process.env.ORBIS_ENV) {
      message += "ORBIS_ENV is not defined in the environment variables. ";
    }
    if (!process.env.ORBIS_CONTEXT_ID) {
      message +=
        "ORBIS_CONTEXT_ID is not defined in the environment variables. ";
    }
    if (!process.env.ORBIS_SEED) {
      message += "ORBIS_SEED is not defined in the environment variables. ";
    }
    if (message) {
      throw new Error(message);
    }
    this.contextId = process.env.ORBIS_CONTEXT_ID!;
    this.seed = new Uint8Array(JSON.parse(process.env.ORBIS_SEED!));
    this.tableId = process.env.ORBIS_TABLE_ID!;
    this.db = new OrbisDB({
      ceramic: {
        gateway: process.env.CERAMIC_NODE_URL!,
      },
      nodes: [
        {
          gateway: process.env.ORBIS_GATEWAY_URL!,
          env: process.env.ORBIS_ENV!,
        },
      ],
    });
  }

  static getInstance(): Orbis {
    if (!Orbis.instance) {
      Orbis.instance = new Orbis();
    }
    return Orbis.instance;
  }

  async getAuthenticatedInstance(): Promise<OrbisConnectResult> {
    const auth = await OrbisKeyDidAuth.fromSeed(this.seed);
    return await this.db.connectUser({ auth });
  }

  async getController(): Promise<string> {
    await this.getAuthenticatedInstance();
    if (!this.db.did?.id) {
      throw new Error("Ceramic DID not initialized");
    }
    return this.db.did?.id;
  }

  async updateOrbis(content: ServerMessage): Promise<CeramicDocument> {
    try {
      await this.getAuthenticatedInstance();

      const res = await this.db
        .insert(this.tableId)
        .value(content)
        .context(this.contextId)
        .run();
      return res;
    } catch (err) {
      elizaLogger.warn(
        "[orbis.service] failed to store data ",
        JSON.stringify(content, maskEmbedding, 2)
      );
      throw err;
    }
  }

  async queryKnowledgeEmbeddings(embedding: number[]): Promise<{
    columns: Array<string>;
    rows: ServerMessage[];
  } | null> {
    const formattedEmbedding = `ARRAY[${embedding.join(", ")}]::vector`;
    const query = `
          SELECT stream_id, content, is_user, embedding <=> ${formattedEmbedding} AS similarity
          FROM ${this.tableId}
          ORDER BY similarity ASC
          LIMIT 5;
          `;
    const context = await this.queryKnowledgeIndex(query);
    return context;
  }

  private async queryKnowledgeIndex(text: string): Promise<{
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
