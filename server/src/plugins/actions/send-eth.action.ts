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
import { CollabLandWalletBalanceProvider } from "../providers/collabland-wallet-balance.provider.js";
import { ethers, parseEther } from "ethers";

// User: Hi
// Agent: Hello, I'm a blockchain assistant, what chain would you want to look into?
// User: Let's do linea
// Agent: Okay, linea
// ...

type ExecuteUserOpResponse = {
  userOperationHash: string;
  chainId: number;
};

interface TransactionReceipt {
  transactionHash?: string;
  transactionIndex?: number;
  blockHash?: string;
  blockNumber?: number;
  from?: string;
  to?: string;
  cumulativeGasUsed?: number;
  status?: string;
  gasUsed?: number;
  contractAddress?: string | null;
  logsBloom?: string;
  effectiveGasPrice?: number;
}

interface Log {
  data?: string;
  blockNumber?: number;
  blockHash?: string;
  transactionHash?: string;
  logIndex?: number;
  transactionIndex?: number;
  address?: string;
  topics?: string[];
}

interface UserOperationReceipt {
  userOpHash?: string;
  entryPoint?: string;
  sender?: string;
  nonce?: number;
  paymaster?: string;
  actualGasUsed?: number;
  actualGasCost?: number;
  success?: boolean;
  receipt?: TransactionReceipt;
  logs?: Log[];
}

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
- account: The account to send the ETH to (only address, no symbols or ETH symbol).
- amount: The amount of ETH to send (only number, no symbols or ETH symbol).
- canFund: Whether agent's account has enough ETH to send.

# These are only the available chains to find:
{{availableChains}}

# Here is the user's request which you need to process:
"{{userRequest}}"

# Here's your smart account details:
{{accountDetails}}

# Here's the agent's current ETH balance:
{{agentBalance}}

# These are the recent messages:
{{recentMessages}}

Given the recent messages and the available, amount of ETH to send, and the account to send to. Use the available chains only, if not available return null!

For \`canFund\`, if the agent's current ETH balance is less than the amount requested by the user, then return false, else return true.

Always prioritize the recent messages, and then the older messages. If the user had recently mentioned to switch to a chain, then use that chain.

Respond with a JSON markdown block containing only the extracted values, use null for any values that cannot be determined.`;

export class SendETHAction extends CollabLandBaseAction {
  constructor() {
    const name = "SEND_ETH";
    const similes = ["SEND_ETH", "SEND_ETH_TO_ACCOUNT", "SEND_ETH_TO_ADDRESS"];
    const description =
      "Extracts the chain, amount of ETH to send, and the account to send to from the recent messages, which the user has requested to send ETH to.";
    const handler: Handler = async (
      _runtime,
      _message,
      _state,
      _options,
      _callback
    ): Promise<boolean> => {
      try {
        console.log("[SendETHAction] message", _message);
        console.log("[SendETHAction] options", _options);
        console.log("[SendETHAction] state", _state);

        const availableChains = Object.entries(chainMap)
          .map(([chain]) => {
            return `- ${chain}`;
          })
          .join("\n");
        console.log("[SendETHAction] availableChains", availableChains);
        let chain: string | null = null;
        const onChainMemoryManager = _runtime.getMemoryManager("onchain")!;
        // this is newest to oldest
        const onChainMemories = await onChainMemoryManager.getMemories({
          roomId: _message.roomId,
          unique: false,
        });
        console.log("[SendETHAction] onChainMemories", onChainMemories);
        for (const memory of onChainMemories) {
          if (memory.content.chain !== undefined) {
            chain = memory.content.chain as string;
            break;
          }
        }
        // Get the chain Id
        if (chain == null) {
          _callback?.({
            text: "I cannot proceed because I don't know the chain you're looking for. I support Ethereum, Linea, Base, and others.",
          });
          return false;
        }
        console.log("[SendETHAction] chain found in memories", chain);

        const chainId = chainMap[chain as keyof typeof chainMap];
        if (!chainId) {
          _callback?.({
            text: "I cannot proceed because I don't know the chain you're looking for. I support Ethereum, Linea, Base, and others.",
          });
          return false;
        }

        let account = null;
        for (const memory of onChainMemories) {
          if (
            memory.content.smartAccount &&
            memory.content.chainId === chainId
          ) {
            account = memory.content;
            break;
          }
        }

        if (!account?.smartAccount) {
          _callback?.({
            text: "I cannot proceed because I can't determine my account. Can you help me with which chain you want me to send ETH to?",
            action: "GET_SMART_ACCOUNT",
          });
          return false;
        }
        const balance = await new CollabLandWalletBalanceProvider().get(
          _runtime,
          _message,
          _state
        );
        console.log("[SendETHAction] balance", balance);
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
        console.log("[SendETHAction] extractContext", extractContext);
        const extractedFundData = await generateObject({
          context: extractContext,
          modelClass: ModelClass.SMALL,
          runtime: _runtime,
        });
        console.log("[SendETHAction] extractedFundData", extractedFundData);
        //FIXME: Need to double-check canFund, since the AI can hallucinate
        if (extractedFundData.canFund === false) {
          const _canFund =
            BigInt(parseEther(balance)) >=
            BigInt(parseEther(extractedFundData.amount));
          console.log("[SendETHAction] _canFund", _canFund);
          extractedFundData.canFund = _canFund;
        }
        if (
          !extractedFundData.canFund ||
          !extractedFundData.amount ||
          !extractedFundData.account
        ) {
          _callback?.({
            text: "I cannot proceed with the request, I didn't find the necessary information to send ETH, or I lack enough ETH to send.",
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
            chain: chain,
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

        console.log("Hitting Collab.Land APIs to submit user operation...");
        const payload = {
          contractAddress: extractedFundData.account,
          value:
            "0x" + ethers.parseEther(extractedFundData.amount).toString(16),
          calldata: "",
        };
        console.log("[SendETHAction] payload", payload);
        const { data: _resData } =
          await this.client.post<ExecuteUserOpResponse>(
            `/telegrambot/submitUserOperation?chainId=${chainId}`,
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
        console.log("[SendETHAction] response from Collab.Land API", _resData);
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
            userOpHash: _resData.userOperationHash,
            status: "PENDING",
          },
        };
        await onChainMemoryManager.createMemory(fundPendingMemory);
        _callback?.({
          text: `Your request to send ${extractedFundData.amount} ETH to ${extractedFundData.account} has been sent from my account ${account.smartAccount} on ${chain}.\nStatus: Pending\nUser Operation Hash: ${_resData.userOperationHash}`,
        });
        console.log(
          "Hitting Collab.Land APIs for confirming user operation..."
        );
        const { data: _userOpReceiptData } =
          await this.client.get<UserOperationReceipt>(
            `/telegrambot/userOperationReceipt?chainId=${_resData.chainId}&userOperationHash=${_resData.userOperationHash}`,
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
          "[SendETHAction] response from Collab.Land API",
          _userOpReceiptData
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
              userOpHash: _resData.userOperationHash,
              txHash: _userOpReceiptData.receipt?.transactionHash,
              status: "EXECUTED",
            },
          },
          true
        );
        _callback?.({
          text: `Your request to send ${extractedFundData.amount} ETH to ${extractedFundData.account} has been sent from my account ${account.smartAccount} on ${chain}.\nStatus: Executed\nUser Operation Hash: ${_userOpReceiptData.userOpHash}\nTransaction Hash: ${_userOpReceiptData.receipt?.transactionHash}`,
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
