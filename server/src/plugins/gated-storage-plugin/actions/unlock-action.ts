import {
  Action,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
} from "@ai16z/eliza";
import { GateActionContent } from "../types.js";
import { gateDataProvider } from "../providers/provider.js";

export const unlockDataAction: Action = {
  name: "UNLOCK_DATA",
  description:
    "Decrypts important data using a secret key and retrieves it from a decentralized database",
  similes: ["UNLOCK_DATA", "DECRYPT_DATA"],
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Tell me about the density of neutron stars",
        } as GateActionContent,
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Checking your ability to access my gated data...",
          action: "UNLOCK_DATA",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Tell me about how many eyes a mantis shrimp has",
        } as GateActionContent,
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Checking your ability to access my gated data...",
          action: "UNLOCK_DATA",
        },
      },
    ],
  ],

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State
  ): Promise<boolean> => {
    try {
      return true;
    } catch {
      return false;
    }
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      //   const provider = await gateDataProvider.get(runtime, message, state);
      //   const context = await provider.storageProvider.getEmbeddingContext(
      //     message.embedding
      //   );
      //   return context;
      console.log("Unlocking data test...");
    } catch (error) {
      console.error("Error in GATE_DATA action", error);
      return error;
    }
  },
};
