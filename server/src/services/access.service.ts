import { Wallet } from "ethers";
import {
  LitAccessControlConditionResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitAbility,
  AuthSig,
  LitResourceAbilityRequest,
} from "@lit-protocol/auth-helpers";
import * as LitJsSdk from "@lit-protocol/lit-node-client";

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
