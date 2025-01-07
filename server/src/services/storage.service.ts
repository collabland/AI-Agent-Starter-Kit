import { OrbisDB, OrbisConnectResult, CeramicDocument } from "@useorbis/db-sdk";
import { BaseService } from "./base.service.js";
import { AnyType } from "@/utils.js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Memory, Content } from "@ai16z/eliza";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { Wallet } from "ethers";
import {
  LitAccessControlConditionResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitAbility,
  AuthSig,
  LitResourceAbilityRequest,
} from "@lit-protocol/auth-helpers";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";

type ServerMessage = Memory & {
  content: Content | string;
  createdAt: string;
  is_user: boolean;
};

const accessControlConditions = [
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
];

const chain = "ethereum";

export class Orbis {
  private static instance: Orbis;
  private db: OrbisDB;

  private constructor() {
    // if (!process.env.ENV_ID) {
    //   throw new Error("ENV_ID is not defined in the environment variables.");
    // }
    this.db = new OrbisDB({
      ceramic: {
        gateway: "https://ceramic-orbisdb-mainnet-direct.hirenodes.io/",
      },
      nodes: [
        {
          gateway: "http://localhost:7008",
          //   env: process.env.ENV_ID,
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

export class Lit {
  litNodeClient;
  chain;

  constructor() {
    this.chain = chain;
    this.litNodeClient = new LitJsSdk.LitNodeClientNodeJs({
      alertWhenUnauthorized: false,
      litNetwork: "datil-dev",
      debug: true,
    });
  }

  async connect() {
    return await this.litNodeClient.connect();
  }
  async disconnect() {
    return await this.litNodeClient.disconnect();
  }
  async encrypt(message: string) {
    await this.connect();
    // Encrypt the message
    const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
      {
        accessControlConditions,
        dataToEncrypt: message,
      },
      this.litNodeClient
    );
    await this.disconnect();

    // Return the ciphertext and dataToEncryptHash
    return {
      ciphertext,
      dataToEncryptHash,
    };
  }

  async decrypt(
    ciphertext: string,
    dataToEncryptHash: string
  ): Promise<string> {
    // Get the session signatures
    await this.connect();
    const sessionSigs = await this.getSessionSignatures();

    // Decrypt the message
    const decryptedString = await LitJsSdk.decryptToString(
      {
        accessControlConditions,
        chain: this.chain,
        ciphertext,
        dataToEncryptHash,
        sessionSigs,
      },
      this.litNodeClient
    );

    await this.disconnect();
    // Return the decrypted string
    return decryptedString;
  }

  async getDelegationAuthSig() {
    if (!process.env.ETHEREUM_PRIVATE_KEY) {
      throw new Error("ETHEREUM_PRIVATE_KEY is required");
    }
    try {
      const wallet = new Wallet(process.env.ETHEREUM_PRIVATE_KEY);
      const { capacityDelegationAuthSig } =
        await this.litNodeClient.createCapacityDelegationAuthSig({
          dAppOwnerWallet: wallet,
          uses: "1",
          capacityTokenId: process.env.LIT_TOKEN_ID,
        });
      return capacityDelegationAuthSig;
    } catch (error) {
      console.error("Error connecting to LitContracts:", error);
      throw error;
    }
  }
  async getSessionSignatures() {
    if (!process.env.ETHEREUM_PRIVATE_KEY) {
      throw new Error("ETHEREUM_PRIVATE_KEY is required");
    }
    // Connect to the wallet
    const ethWallet = new Wallet(process.env.ETHEREUM_PRIVATE_KEY);

    // Get the latest blockhash
    const latestBlockhash = await this.litNodeClient.getLatestBlockhash();

    // Define the authNeededCallback function
    const authNeededCallback = async (params: {
      uri?: string;
      expiration?: string;
      resourceAbilityRequests?: LitResourceAbilityRequest[];
    }): Promise<AuthSig> => {
      if (!params.uri) {
        throw new Error("uri is required");
      }
      if (!params.expiration) {
        throw new Error("expiration is required");
      }

      if (!params.resourceAbilityRequests) {
        throw new Error("resourceAbilityRequests is required");
      }

      // Create the SIWE message
      const toSign = await createSiweMessageWithRecaps({
        uri: params.uri,
        expiration: params.expiration,
        resources: params.resourceAbilityRequests,
        walletAddress: ethWallet.address,
        nonce: latestBlockhash,
        litNodeClient: this.litNodeClient,
      });

      // Generate the authSig
      const authSig = await generateAuthSig({
        signer: ethWallet,
        toSign,
      });

      return authSig;
    };

    // Define the Lit resource
    const litResource = new LitAccessControlConditionResource("*");

    // Get the delegation auth sig
    const capacityDelegationAuthSig = await this.getDelegationAuthSig();

    // Get the session signatures
    const sessionSigs = await this.litNodeClient.getSessionSigs({
      chain: this.chain,
      resourceAbilityRequests: [
        {
          resource: litResource,
          ability: LitAbility.AccessControlConditionDecryption,
        },
      ],
      authNeededCallback,
      capacityDelegationAuthSig,
    });
    return sessionSigs;
  }
}

export class StorageService extends BaseService {
  private static instance: StorageService;
  private lit: Lit | null;
  private orbis: Orbis | null;

  private constructor() {
    super();
    this.lit = null;
    this.orbis = null;
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

  public async createEmbeddings(text: string) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not defined in the environment variables."
      );
    }
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    console.log("Splitting query into chunks...");
    const chunks = await textSplitter.createDocuments([text]);
    const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
      chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
    );

    return { chunks, embeddingsArrays };
  }

  public async storeMessage(
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
      const { chunks, embeddingsArrays } = await this.createEmbeddings(
        context.content.text
      );
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

  public async getContext(text: string): Promise<string | null> {
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
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
      });
      console.log("Splitting query into chunks...");
      // 5. Split text into chunks (documents)
      const chunks = await textSplitter.createDocuments([text]);

      const array = await new OpenAIEmbeddings().embedDocuments(
        chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
      );
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
          ${row.is_user ? "User" : "Bot"}: ${decryptedContent}`;
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
