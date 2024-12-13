import { Plugin } from "@ai16z/eliza";
import { GetBotAccountAction } from "./actions/get-bot-account.action.js";
import { GetChainAction } from "./actions/get-chain.action.js";
import { CollabLandWalletBalanceProvider } from "./providers/collabland-wallet-balance.provider.js";
import { SendETHAction } from "./actions/send-eth.action.js";
export const collablandPlugin: Plugin = {
  name: "collabland",
  description: "Integrate Collab.Land smart account for the bot",

  actions: [
    new GetChainAction(),
    new GetBotAccountAction(),
    new SendETHAction(),
  ],
  providers: [new CollabLandWalletBalanceProvider()],
};
