import { CeramicDocument } from "@useorbis/db-sdk";
import { BaseService } from "./base.service.js";
import { AnyType } from "@/utils.js";
import { Lit } from "./access.service.js";
import { Memory } from "@ai16z/eliza";
import { Orbis, type ServerMessage } from "./orbis.service.js";
import { EmbeddingService } from "./embedding.service.js";

export class StorageService extends BaseService {
  private static instance: StorageService;
  private lit: Lit | null;
  private orbis: Orbis | null;
  private embeddingService: EmbeddingService;

  private constructor() {
    super();
    this.lit = null;
    this.orbis = null;
    this.embeddingService = new EmbeddingService();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public async start(): Promise<void> {
    if (!process.env.ETHEREUM_PRIVATE_KEY) {
      throw new Error("ETHEREUM_PRIVATE_KEY is required");
    }

    try {
      this.lit = new Lit();
      this.orbis = Orbis.getInstance();
      return;
    } catch (error: AnyType) {
      console.error("Error starting StorageService:", error);
      throw error;
    }
  }

  public async storeMessage(
    context: Memory,
    is_user: boolean
  ): Promise<CeramicDocument> {
    if (!this.orbis) {
      throw new Error("Orbis is not initialized");
    }

    if (!this.lit) {
      throw new Error("Lit is not initialized");
    }

    try {
      const encryptedBody = await this.lit.encrypt(
        JSON.stringify(context.content.text)
      );
      const content = {
        ...context,
        content: JSON.stringify(encryptedBody),
        createdAt: new Date().toISOString(),
        is_user,
      };
      return await this.orbis.updateOrbis(content as ServerMessage);
    } catch (error: AnyType) {
      console.error("Error storing message:", error);
      throw error;
    }
  }

  public async storeMessageWithEmbedding(
    context: Memory,
    is_user: boolean
  ): Promise<CeramicDocument[]> {
    if (!this.orbis) {
      throw new Error("Orbis is not initialized");
    }

    if (!this.lit) {
      throw new Error("Lit is not initialized");
    }

    try {
      const { chunks, embeddingsArrays } =
        await this.embeddingService.createEmbeddings(context.content.text);
      const documents: CeramicDocument[] = [];
      for (let idx = 0; idx < chunks.length; idx++) {
        const chunk = chunks[idx];
        const encryptedBody = await this.lit.encrypt(
          JSON.stringify(chunk.pageContent)
        );
        const content = {
          ...context,
          content: JSON.stringify(encryptedBody),
          embedding: embeddingsArrays[idx],
          createdAt: new Date().toISOString(),
          is_user,
        };

        const doc = await this.orbis.updateOrbis(content as ServerMessage);
        documents.push(doc);
      }
      return documents;
    } catch (error: AnyType) {
      console.error("Error storing message:", error);
      throw error;
    }
  }

  public async getConversation(): Promise<string | null> {
    if (!this.orbis) {
      throw new Error("Orbis is not initialized");
    }
    if (!this.lit) {
      throw new Error("Lit is not initialized");
    }
    if (!process.env.TABLE_ID) {
      throw new Error("TABLE_ID is not defined in the environment variables.");
    }

    try {
      await this.orbis.getAuthenticatedInstance();
      const controller = await this.orbis.getController();
      console.log("this is the controller", controller);
      const query = `
            SELECT *
            FROM ${process.env.TABLE_ID}
            WHERE controller = '${controller}';
            `;
      const context = await this.orbis.query(query);
      console.log("this is the row 90 context", context);
      if (!context) {
        return null;
      }

      const decryptedRows = await Promise.all(
        context.rows.map(async (row) => {
          const lit = new Lit();
          const { ciphertext, dataToEncryptHash } = JSON.parse(
            row.content as string
          );
          const decryptedContent = await lit.decrypt(
            ciphertext,
            dataToEncryptHash
          );
          // indicate if the message is from the user or the server
          return `
          ${row.is_user ? row.userId : row.agentId}: ${decryptedContent}`;
        })
      );
      const concatenatedContext = decryptedRows.join(" ");
      return concatenatedContext;
    } catch (error: AnyType) {
      console.error("Error getting context:", error);
      throw error;
    }
  }

  public async getEmbeddingContext(text: string): Promise<string | null> {
    if (!this.orbis) {
      throw new Error("Orbis is not initialized");
    }
    if (!this.lit) {
      throw new Error("Lit is not initialized");
    }
    if (!process.env.TABLE_ID) {
      throw new Error("TABLE_ID is not defined in the environment variables.");
    }

    try {
      const array = await this.embeddingService.createEmbedding(text);
      const formattedEmbedding = `ARRAY[${array.join(", ")}]::vector`;
      const query = `
            SELECT content, is_user, embedding <=> ${formattedEmbedding} AS similarity
            FROM ${process.env.TABLE_ID}
            ORDER BY similarity ASC
            LIMIT 5;
            `;
      const context = await this.orbis.query(query);

      if (!context) {
        return null;
      }

      const decryptedRows = await Promise.all(
        context.rows.map(async (row) => {
          const lit = new Lit();
          const { ciphertext, dataToEncryptHash } = JSON.parse(
            row.content as string
          );
          const decryptedContent = await lit.decrypt(
            ciphertext,
            dataToEncryptHash
          );
          // indicate if the message is from the user or the server
          return `
          ${row.is_user ? row.userId : row.agentId}: ${decryptedContent}`;
        })
      );
      const concatenatedContext = decryptedRows.join(" ");
      return concatenatedContext;
    } catch (error: AnyType) {
      console.error("Error getting context:", error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.orbis = null;
    this.lit = null;
  }
}
