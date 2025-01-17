import { CeramicDocument } from "@useorbis/db-sdk";
import { Orbis, type ServerMessage } from "./orbis.service.js";
import axios, { AxiosInstance } from "axios";
import { AnyType } from "../../../utils.js";
import fs from "fs";
import { getCollablandApiUrl } from "../../../utils.js";
import path, { resolve } from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const chainId = 8453;

export class StorageService {
  private static instance: StorageService;
  private orbis: Orbis | null;
  private client: AxiosInstance | null;
  private encryptActionHash: string | null;
  private decryptActionHash: string | null;

  private constructor() {
    this.orbis = null;
    this.client = null;
    this.encryptActionHash = null;
    this.decryptActionHash = null;
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
      this.orbis = Orbis.getInstance();
      this.client = axios.create({
        baseURL: getCollablandApiUrl(),
        headers: {
          "X-API-KEY": process.env.COLLABLAND_API_KEY || "",
          "X-TG-BOT-TOKEN": process.env.TELEGRAM_BOT_TOKEN || "",
          "Content-Type": "application/json",
        },
        timeout: 5 * 60 * 1000,
      });
      const actionHashes = JSON.parse(
        (
          await fs.readFileSync(
            resolve(
              __dirname,
              "..",
              "..",
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
      this.encryptActionHash = actionHashes["encrypt-action.js"].IpfsHash;
      this.decryptActionHash = actionHashes["decrypt-action.js"].IpfsHash;
      return;
    } catch (error: AnyType) {
      console.error("Error starting StorageService:", error);
      throw error;
    }
  }

  public async storeMessage(
    context: string,
    is_user: boolean
  ): Promise<CeramicDocument> {
    if (!this.orbis) {
      throw new Error("Orbis is not initialized");
    }
    if (!this.encryptActionHash) {
      throw new Error("Encrypt action hash is not initialized");
    }
    if (!this.client) {
      throw new Error("Client is not initialized");
    }
    try {
      // data will be JSON.stringify({ ciphertext, dataToEncryptHash })
      const { data } = await this.client.post(
        `/telegrambot/executeLitActionUsingPKP?chainId=${chainId}`,
        {
          actionIpfs: this.encryptActionHash,
          actionJsParams: context,
        }
      );
      const content = {
        content: data,
        is_user,
      };
      return await this.orbis.updateOrbis(content as ServerMessage);
    } catch (error: AnyType) {
      console.error("Error storing message:", error);
      throw error;
    }
  }

  public async storeMessageWithEmbedding(
    context: string,
    embeddings: number[],
    is_user: boolean
  ): Promise<CeramicDocument> {
    if (!this.orbis) {
      throw new Error("Orbis is not initialized");
    }
    if (!this.encryptActionHash) {
      throw new Error("Encrypt action hash is not initialized");
    }
    if (!this.client) {
      throw new Error("Client is not initialized");
    }

    try {
      // data will be JSON.stringify({ ciphertext, dataToEncryptHash })
      const { data } = await this.client.post(
        `/telegrambot/executeLitActionUsingPKP?chainId=${chainId}`,
        {
          actionIpfs: this.decryptActionHash,
          actionJsParams: context,
        }
      );
      const content = {
        content: data,
        embedding: embeddings,
        is_user,
      };
      const doc = await this.orbis.updateOrbis(content as ServerMessage);
      return doc;
    } catch (error: AnyType) {
      console.error("Error storing message:", error);
      throw error;
    }
  }

  public async getEmbeddingContext(array: number[]): Promise<string | null> {
    if (!this.orbis) {
      throw new Error("Orbis is not initialized");
    }
    if (!process.env.TABLE_ID) {
      throw new Error("TABLE_ID is not defined in the environment variables.");
    }

    try {
      const formattedEmbedding = `ARRAY[${array.join(", ")}]::vector`;
      const query = `
            SELECT content, is_user, embedding <=> ${formattedEmbedding} AS similarity
            FROM ${process.env.TABLE_ID}
            ORDER BY similarity ASC
            LIMIT 5;
            `;
      const context = await this.orbis.queryKnowledgeIndex(query);

      if (!context) {
        return null;
      }

      const decryptedRows = await Promise.all(
        context.rows.map(async (row) => {
          // data will be JSON.stringify({ ciphertext, dataToEncryptHash })
          if (!this.client) {
            throw new Error("Client is not initialized");
          }
          const { data } = await this.client.post(
            `/telegrambot/executeLitActionUsingPKP?chainId=${chainId}`,
            {
              actionIpfs: this.decryptActionHash,
              actionJsParams: row.content,
            }
          );
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
  }
}
