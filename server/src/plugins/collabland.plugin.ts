import { Plugin } from "@ai16z/eliza";
import { GetBotAccountAction } from "./actions/get-bot-account.action.js";
import { GetChainAction } from "./actions/get-chain.action.js";
import { CollabLandWalletBalanceProvider } from "./providers/collabland-wallet-balance.provider.js";
import { SendETHAction } from "./actions/send-eth.action.js";
import { CollabLandSolanaWalletBalanceProvider } from "./providers/collabland-solana-wallet-balance.provider.js";
import { SendSOLAction } from "./actions/send-sol.action.js";
export const collablandPlugin: Plugin = {
  name: "collabland",
  description: "Integrate Collab.Land smart account for the bot",

  actions: [
    new GetChainAction(),
    new GetBotAccountAction(),
    new SendETHAction(),
    new SendSOLAction(),
  ],
  providers: [
    new CollabLandWalletBalanceProvider(),
    new CollabLandSolanaWalletBalanceProvider(),
  ],
};
