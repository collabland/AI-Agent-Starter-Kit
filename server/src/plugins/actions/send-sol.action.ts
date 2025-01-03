/* eslint-disable no-unused-vars */

import {
  ActionExample,
  composeContext,
  generateObject,
  getEmbeddingZeroVector,
  Handler,
  Memory,
  ModelClass,
  Validator,
} from "@ai16z/eliza";
import { CollabLandBaseAction } from "./collabland.action.js";
import { randomUUID } from "crypto";
import { chainMap } from "../../utils.js";
import {
  BotAccountMemory,
  ExecuteSolanaTransactionResponse,
} from "../types.js";
import { CollabLandSolanaWalletBalanceProvider } from "../providers/collabland-solana-wallet-balance.provider.js";
import {
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";

// User: Hi
// Agent: Hello, I'm a blockchain assistant, what chain would you want to look into?
// User: Let's do linea
// Agent: Okay, linea
// ...

const extractChainTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

# Example response:
\`\`\`json
{
    "account": "string",
    "amount": "string",
    "canFund": "boolean"
}
\`\`\`
# Explanation of the above JSON fields:
- account: The account to send the SOL to (only address, no symbols or SOL symbol).
- amount: The amount of SOL to send (only number, no symbols or SOL symbol).
- canFund: Whether agent's account has enough SOL to send.

# These are only the available chains to find:
{{availableChains}}

# Here is the user's request which you need to process:
"{{userRequest}}"

# Here's your smart account details:
{{accountDetails}}

# Here's the agent's current SOL balance:
{{agentBalance}}

# These are the recent messages:
{{recentMessages}}

Given the recent messages and the available, amount of SOL to send, and the account to send to. Use the available chains only, if not available return null!

For \`canFund\`, if the agent's current SOL balance is less than the amount requested by the user, then return false, else return true.

Always prioritize the recent messages, and then the older messages. If the user had recently mentioned to switch to a chain, then use that chain.

Respond with a JSON markdown block containing only the extracted values, use null for any values that cannot be determined.`;

export class SendSOLAction extends CollabLandBaseAction {
  constructor() {
    const name = "SEND_SOL";
    const similes = ["SEND_SOL", "SEND_SOL_TO_ACCOUNT", "SEND_SOL_TO_ADDRESS"];
    const description =
      "Extracts the chain, amount of SOL to send, and the account to send to from the recent messages, which the user has requested to send SOL to.";
    const handler: Handler = async (
      _runtime,
      _message,
      _state,
      _options,
      _callback
    ): Promise<boolean> => {
      try {
        console.log("[SendSOLAction] message", _message);
        console.log("[SendSOLAction] options", _options);
        console.log("[SendSOLAction] state", _state);

        const availableChains = Object.entries(chainMap)
          .map(([chain]) => {
            return `- ${chain}`;
          })
          .join("\n");
        console.log("[SendSOLAction] availableChains", availableChains);
        let chain: string | null = null;
        const onChainMemoryManager = _runtime.getMemoryManager("onchain")!;
        // this is newest to oldest
        const onChainMemories = await onChainMemoryManager.getMemories({
          roomId: _message.roomId,
          unique: false,
          count: 1000,
        });
        console.log("[SendSOLAction] onChainMemories", onChainMemories);
        for (const memory of onChainMemories) {
          if (memory.content.chain !== undefined) {
            chain = memory.content.chain as string;
            break;
          }
        }
        // Get the chain Id
        if (chain == null) {
          _callback?.({
            text: "I cannot proceed because I don't know the chain you're looking for. I support Solana and others.",
          });
          return false;
        }
        console.log("[SendSOLAction] chain found in memories", chain);

        const chainId = chainMap[chain as keyof typeof chainMap];
        if (!chainId) {
          _callback?.({
            text: "I cannot proceed because I don't know the chain you're looking for. I support Solana and others.",
          });
          return false;
        }

        console.log("[SendSOLAction] chainId", chainId);

        let account: BotAccountMemory | null = null;
        for (const memory of onChainMemories) {
          if (
            memory.content.smartAccount &&
            memory.content.type === "solana" && // Has to be Solana for sending SOL
            memory.content.network == chainId
          ) {
            account = memory.content as unknown as BotAccountMemory;
            console.log("[SendSOLAction] account found", account);
            break;
          }
        }

        if (!account?.smartAccount) {
          console.log("[SendSOLAction] account not found");
          _callback?.({
            text: "I cannot proceed because I can't determine my account. Can you help me with which chain you want me to send SOL to?",
            action: "GET_SMART_ACCOUNT",
          });
          return false;
        }
        const balance = await new CollabLandSolanaWalletBalanceProvider().get(
          _runtime,
          _message,
          _state
        );
        console.log("[SendSOLAction] balance", balance);
        const extractContext = composeContext({
          state: {
            ..._state!,
            availableChains: availableChains,
            userRequest: _message.content.text,
            accountDetails: JSON.stringify(
              { ...account, text: undefined },
              null,
              4
            ),
            agentBalance: balance,
          },
          template: extractChainTemplate,
        });
        console.log("[SendSOLAction] extractContext", extractContext);
        const extractedFundData = await generateObject({
          context: extractContext,
          modelClass: ModelClass.SMALL,
          runtime: _runtime,
        });
        console.log("[SendSOLAction] extractedFundData", extractedFundData);
        if (
          !extractedFundData.canFund ||
          !extractedFundData.amount ||
          !extractedFundData.account
        ) {
          _callback?.({
            text: "I cannot proceed with the request, I didn't find the necessary information to send SOL, or I lack enough SOL to send.",
          });
          return false;
        }

        // Create memory
        const fundIntentMemory: Memory = {
          id: randomUUID(),
          agentId: _message.agentId,
          userId: _message.userId,
          roomId: _message.roomId,
          content: {
            text: "",
            network: chain,
            account: extractedFundData.account,
            amount: extractedFundData.amount,
            canFund: extractedFundData.canFund,
          },
          createdAt: Date.now(),
          embedding: getEmbeddingZeroVector(),
        };
        console.log(
          "[SendETHAction] creating fundIntentMemory",
          fundIntentMemory
        );
        await onChainMemoryManager.createMemory(fundIntentMemory);

        console.log("Hitting Collab.Land APIs to submit Solana transaction...");
        const connection = new Connection(
          clusterApiUrl(chainId === "sol_dev" ? "devnet" : "mainnet-beta"),
          "confirmed"
        );
        const recipientAccount = new PublicKey(extractedFundData.account);
        const botAccount = new PublicKey(account.smartAccount);
        const amount = Math.floor(
          LAMPORTS_PER_SOL * parseFloat(extractedFundData.amount)
        );
        console.log("[SendSOLAction] amount", amount);
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: botAccount,
            toPubkey: recipientAccount,
            lamports: amount,
          })
        );
        console.log("[SendSOLAction] transaction", transaction);
        transaction.feePayer = botAccount;
        console.log(
          "[SendSOLAction] transaction.feePayer:",
          transaction.feePayer
        );
        transaction.recentBlockhash = (
          await connection.getLatestBlockhash()
        ).blockhash;
        console.log(
          "[SendSOLAction] transaction.recentBlockhash",
          transaction.recentBlockhash
        );
        const serializedTransaction = transaction
          .serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          })
          .toString("base64");
        console.log(
          "[SendSOLAction] serializedTransaction",
          serializedTransaction
        );
        const payload = {
          serializedTransactionBase64: serializedTransaction,
        };
        console.log("[SendSOLAction] payload", payload);
        const { data: _resData } =
          await this.client.post<ExecuteSolanaTransactionResponse>(
            `/telegrambot/solana/submitTransaction?network=${chainId}`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                "X-TG-BOT-TOKEN": process.env.TELEGRAM_BOT_TOKEN,
                "X-API-KEY": process.env.COLLABLAND_API_KEY,
                Accept: "application/json",
              },
              timeout: 10 * 60 * 1000,
            }
          );
        console.log("[SendSOLAction] response from Collab.Land API", _resData);
        await onChainMemoryManager.removeMemory(fundIntentMemory.id!);
        const fundPendingMemory: Memory = {
          id: randomUUID(),
          agentId: _message.agentId,
          userId: _message.userId,
          roomId: _message.roomId,
          content: {
            text: "",
            chain: chain,
            account: extractedFundData.account,
            amount: extractedFundData.amount,
            canFund: extractedFundData.canFund,
            txSignature: _resData.txSignature,
            status: "PENDING",
          },
        };
        await onChainMemoryManager.createMemory(fundPendingMemory);
        _callback?.({
          text: `Your request to send ${extractedFundData.amount} SOL to ${extractedFundData.account} has been sent from my account ${account.smartAccount} on ${chain}.\nStatus: Pending\nTransaction Signature: ${_resData.txSignature}`,
        });
        console.log(
          "Hitting Collab.Land APIs for confirming Solana transaction..."
        );
        const { data: _txReceiptData } = await this.client.get(
          `/telegrambot/solana/transactionResponse?network=${chainId}&txSignatureBase64=${_resData.txSignature}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-TG-BOT-TOKEN": process.env.TELEGRAM_BOT_TOKEN,
              "X-API-KEY": process.env.COLLABLAND_API_KEY,
            },
            timeout: 10 * 60 * 1000,
          }
        );
        console.log(
          "[SendSOLAction] response from Collab.Land API",
          _txReceiptData
        );
        await onChainMemoryManager.removeMemory(fundPendingMemory.id!);
        await onChainMemoryManager.createMemory(
          {
            id: randomUUID(),
            agentId: _message.agentId,
            userId: _message.userId,
            roomId: _message.roomId,
            content: {
              text: "",
              chain: chain,
              account: extractedFundData.account,
              amount: extractedFundData.amount,
              canFund: extractedFundData.canFund,
              txReceipt: _txReceiptData.response,
              txSignature: _resData.txSignature,
              status: "EXECUTED",
            },
          },
          true
        );
        _callback?.({
          text: `Your request to send ${extractedFundData.amount} SOL to ${extractedFundData.account} has been sent from my account ${account.smartAccount} on ${chain}.\nStatus: Executed\nTransaction Signature: ${_resData.txSignature}\nTransaction Receipt: ${JSON.stringify(_txReceiptData.response)}`,
        });
        return true;
      } catch (error) {
        this.handleError(error);
        return false;
      }
    };
    const validate: Validator = async (
      _,
      _message,
      _state
    ): Promise<boolean> => {
      // if (_state?.chainId) {
      //   console.log(
      //     "[GetChainAction] State already has chainId:",
      //     _state.chainId
      //   );
      //   return false;
      // }
      // console.log("[GetChainAction] State does not have chainId");
      return true;
    };
    const examples: ActionExample[][] = [
      [
        {
          user: "{{user1}}",
          content: {
            text: "Can you send me 0.01 ETH to my account 0x1234567890?",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "",
            action: "SEND_ETH",
          },
        },
      ],
      [
        {
          user: "{{user1}}",
          content: {
            text: "Send me 0.01 ETH",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "I cannot proceed with the request, I didn't find the necessary information to send ETH, or I lack enough ETH to send.",
          },
        },
        {
          user: "{{user1}}",
          content: {
            text: "Send to my 0.01 ETH to my account 0x1234567890",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "",
            action: "SEND_ETH",
          },
        },
      ],
    ];
    super(name, description, similes, examples, handler, validate);
  }
}
