import { CeramicDocument } from "@useorbis/db-sdk";
import { Orbis, type ServerMessage } from "./orbis.service.js";
import axios, { AxiosInstance } from "axios";
import fs from "fs";
import { getCollablandApiUrl } from "../../../utils.js";
import path, { resolve } from "path";
import { toUtf8Bytes } from "ethers";

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
      return;
    } catch (error) {
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
          actionJsParams: {
            encryptRequest: {
              accessControlConditions: [
                {
                  contractAddress: "",
                  standardContractType: "",
                  chain: "ethereum",
                  method: "eth_getBalance",
                  parameters: [":userAddress", "latest"],
                  returnValueTest: {
                    comparator: ">=",
                    value: "1000000000000", // 0.000001 ETH
                  },
                },
              ],
              toEncrypt: toUtf8Bytes(context),
            },
          },
        }
      );
      const content = {
        content: data,
        is_user,
      };
      return await this.orbis.updateOrbis(content as ServerMessage);
    } catch (error) {
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
          actionJsParams: {
            encryptRequest: {
              accessControlConditions: [
                {
                  contractAddress: "",
                  standardContractType: "",
                  chain: "ethereum",
                  method: "eth_getBalance",
                  parameters: [":userAddress", "latest"],
                  returnValueTest: {
                    comparator: ">=",
                    value: "1000000000000", // 0.000001 ETH
                  },
                },
              ],
              toEncrypt: toUtf8Bytes(context),
            },
          },
        }
      );
      const content = {
        content: data as string,
        embedding: embeddings,
        is_user,
      };
      const doc = await this.orbis.updateOrbis(content as ServerMessage);
      return doc;
    } catch (error) {
      console.error("Error storing message:", error);
      throw error;
    }
  }

  public async getEmbeddingContext(array: number[]): Promise<string | null> {
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
            SELECT content, is_user, embedding <=> ${formattedEmbedding} AS similarity
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
          // data will be JSON.stringify({ ciphertext, dataToEncryptHash })
          if (!this.client) {
            throw new Error("Client is not initialized");
          }
          const { cipherText, dataToEncryptHash } = JSON.parse(row.content);
          const { data } = await this.client.post(
            `/telegrambot/executeLitActionUsingPKP?chainId=${chainId}`,
            {
              actionIpfs: this.decryptActionHash,
              actionJsParams: {
                decryptRequest: {
                  accessControlConditions: [
                    {
                      contractAddress: "",
                      standardContractType: "",
                      chain: "ethereum",
                      method: "eth_getBalance",
                      parameters: [":userAddress", "latest"],
                      returnValueTest: {
                        comparator: ">=",
                        value: "1000000000000", // 0.000001 ETH
                      },
                    },
                  ],
                  cipherText,
                  dataToEncryptHash,
                  chain: "ethereum",
                },
              },
            }
          );
        })
      );
      const concatenatedContext = decryptedRows.join(" ");
      return concatenatedContext;
    } catch (error) {
      console.error("Error getting context:", error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.orbis = null;
  }
}
