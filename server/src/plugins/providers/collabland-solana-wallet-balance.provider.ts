import { AnyType } from "@/utils.js";
import { Memory, Provider, IAgentRuntime, State } from "@ai16z/eliza";
import { chainMap } from "../../utils.js";
import { BotAccountMemory } from "../types.js";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export class CollabLandSolanaWalletBalanceProvider implements Provider {
  async get(
    _runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ): Promise<AnyType> {
    let chain: string | null = null;
    const onChainMemoryManager = _runtime.getMemoryManager("onchain")!;
    // this is newest to oldest
    const onChainMemories = await onChainMemoryManager.getMemories({
      roomId: _message.roomId,
      unique: false,
    });
    console.log(
      "[CollabLandSolanaWalletBalanceProvider] onChainMemories",
      onChainMemories
    );
    for (const memory of onChainMemories) {
      if (memory.content.chain !== undefined) {
        chain = memory.content.chain as string;
        break;
      }
    }
    // Get the chain Id
    if (chain == null) {
      return "";
    }
    console.log(
      "[CollabLandSolanaWalletBalanceProvider] chain found in memories",
      chain
    );

    const chainId = chainMap[chain as keyof typeof chainMap];
    if (!chainId) {
      return "";
    }
    console.log("[CollabLandSolanaWalletBalanceProvider] chainId", chainId);

    if (!chainId.startsWith("sol")) {
      return "";
    }

    let account: BotAccountMemory | null = null;
    for (const memory of onChainMemories) {
      if (
        memory.content.smartAccount &&
        memory.content.type === "solana" &&
        memory.content.network == chainId
      ) {
        account = memory.content as unknown as BotAccountMemory;
        break;
      }
    }

    if (!account?.smartAccount) {
      return "";
    }
    console.log(
      "[CollabLandSolanaWalletBalanceProvider] account found in memories",
      account
    );
    const connection = new Connection(
      clusterApiUrl(chainId === "sol_dev" ? "devnet" : "mainnet-beta"),
      "confirmed"
    );
    const wallet = new PublicKey(account.smartAccount);

    const balance = await connection.getBalance(wallet);
    const formattedBalance = balance / LAMPORTS_PER_SOL;
    console.log(
      "[CollabLandSolanaWalletBalanceProvider] balance",
      formattedBalance
    );
    return `Agent's balance is ${formattedBalance} SOL on ${chain}`;
  }
}
