import { CeramicDocument } from "@useorbis/db-sdk";
import { Orbis, type ServerMessage } from "./orbis.service.js";
import axios, { AxiosInstance } from "axios";
import fs from "fs";
import { getCollablandApiUrl } from "../../../utils.js";
import path, { resolve } from "path";
import { elizaLogger, getEmbeddingZeroVector, Memory } from "@ai16z/eliza";
import { ElizaService } from "src/services/eliza.service.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const chainId = 8453;

const OPENAI_EMBEDDINGS = Boolean(process.env.USE_OPENAI_EMBEDDING ?? "false");

export class StorageService {
  private static instance: StorageService;
  private orbis: Orbis | null;
  private client: AxiosInstance | null;
  private encryptActionHash: string | null;
  private decryptActionHash: string | null;
  private started: boolean;

  private constructor() {
    this.orbis = null;
    this.client = null;
    this.encryptActionHash = null;
    this.decryptActionHash = null;
    this.started = false;
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public async start(): Promise<void> {
    if (this.started) {
      return;
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
      this.encryptActionHash = actionHashes["encrypt-action"].IpfsHash;
      this.decryptActionHash = actionHashes["decrypt-action"].IpfsHash;
      this.started = true;
      return;
    } catch (error) {
      console.error("Error starting StorageService:", error);
      throw error;
    }
  }

  public async storeMessageWithEmbedding(
    context: string,
    embedding: number[],
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
    if (!OPENAI_EMBEDDINGS) {
      throw new Error(
        "Not use OPENAI embeddings. Use `isMemoryStorable()` to check before calling"
      );
    }
    if (embedding == getEmbeddingZeroVector()) {
      throw new Error(
        "Message embedding must not be the zero vector to persist"
      );
    }
    elizaLogger.debug("[storage.service] attempting to encrypt data");
    try {
      // data will be JSON.stringify({ ciphertext, dataToEncryptHash })
      const { data } = await this.client.post(
        `/telegrambot/executeLitActionUsingPKP?chainId=${chainId}`,
        {
          actionIpfs: this.encryptActionHash,
          actionJsParams: {
            toEncrypt: context,
          },
        }
      );
      if (data?.response?.response) {
        const { ciphertext, dataToEncryptHash, message } = JSON.parse(
          data.response.response
        );
        elizaLogger.debug(`[storage.service] encryption message=${message}`);
        if (ciphertext && dataToEncryptHash) {
          const content = {
            content: JSON.stringify({ ciphertext, dataToEncryptHash }),
            embedding,
            is_user,
          };
          const doc = await this.orbis.updateOrbis(content as ServerMessage);
          return doc;
        } else {
          throw new Error(`Encryption failed: data=${JSON.stringify(data)}`);
        }
      } else {
        elizaLogger.warn(
          "[storage.service] did not get any response from lit action to persist"
        );
        throw new Error("Failed to encrypt data");
      }
    } catch (error) {
      elizaLogger.error("[storage.service] Error storing message:", error);
      throw error;
    }
  }

  public async getEmbeddingContext(
    array: number[],
    address: string
  ): Promise<string | null> {
    if (!this.orbis) {
      throw new Error("Orbis is not initialized");
    }
    if (!process.env.ORBIS_TABLE_ID) {
      throw new Error(
        "ORBIS_TABLE_ID is not defined in the environment variables."
      );
    }

    try {
      const formattedEmbedding = `ARRAY[${array.join(", ")}]::vector`;
      const query = `
            SELECT stream_id, content, is_user, embedding <=> ${formattedEmbedding} AS similarity
            FROM ${process.env.ORBIS_TABLE_ID}
            ORDER BY similarity ASC
            LIMIT 5;
            `;
      const context = await this.orbis.queryKnowledgeIndex(query);

      if (!context) {
        return null;
      }

      const decryptedRows = await Promise.all(
        context.rows.map(async (row) => {
          if (!this.client) {
            throw new Error("Client is not initialized");
          }
          try {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const castRow = row as any;
            const streamId = castRow?.stream_id;
            if (!row?.content) {
              elizaLogger.warn(
                `[storage.service] embedding missing content for stream_id=${castRow?.stream_id}`
              );
              return null;
            }
            const { ciphertext, dataToEncryptHash } = JSON.parse(row.content);
            if (!ciphertext || !dataToEncryptHash) {
              elizaLogger.warn(
                `[storage.service] retrieved embedding missing ciphertext or dataToEncryptHash for stream_id=${streamId}`
              );
              return null;
            }
            const { data } = await this.client.post(
              `/telegrambot/executeLitActionUsingPKP?chainId=${chainId}`,
              {
                actionIpfs: this.decryptActionHash,
                actionJsParams: {
                  ciphertext,
                  dataToEncryptHash,
                  chain: "base",
                },
              }
            );
            if (data?.response?.response) {
              const res = JSON.parse(data.response.response);
              elizaLogger.debug(
                `[storage.service] Decrypt message="${res.message}" for stream_id=${streamId}`
              );
              return res.decrypted;
            } else {
              elizaLogger.warn(
                "[storage.service] failed to retrieve decrypted data for row ",
                data?.response
              );
              return null;
            }
          } catch (err) {
            elizaLogger.warn(
              `[storage.service] exception decrypting data `,
              err
            );
            return null;
          }
        })
      );
      if (decryptedRows) {
        const concatenatedContext = decryptedRows?.join(" ");
        return concatenatedContext;
      }
      return null;
    } catch (error) {
      console.error("Error getting embedded context:", error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.orbis = null;
  }

  public static isMemoryStorable(memory: Memory): boolean {
    if (OPENAI_EMBEDDINGS && memory?.embedding != getEmbeddingZeroVector()) {
      return true;
    }
    return false;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const maskEmbedding = (key: any, value: any): any => {
  if (key == "embedding") {
    if (value == getEmbeddingZeroVector()) {
      return "[masked zero embedding]";
    } else {
      return "[maskedEmbedding]";
    }
  }
  return value;
};
