import {
  Action,
  elizaLogger,
  IAgentRuntime,
  Memory,
  State,
} from "@ai16z/eliza";
import { GateActionContent } from "../types.js";
import { gateDataProvider } from "../providers/provider.js";
import { knowledgeEvaluator } from "../evaluators/knowledge.js";

export const gateDataAction: Action = {
  name: "GATE_DATA",
  description:
    "Encrypts important data using a secret key and stores it in a decentralized database",
  similes: ["GATE_DATA", "ENCRYPT_DATA", "PROTECT_DATA"],
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "The mantis shrimp's eyes have 16 types of photoreceptor cells, allowing them to see ultraviolet and polarized light, far beyond human capabilities.",
        } as GateActionContent,
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Gating data now...",
          action: "GATE_DATA",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Neutron stars are so dense that a sugar-cube-sized piece of one would weigh about a billion tons on Earth.",
        } as GateActionContent,
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Gating data now...",
          action: "GATE_DATA",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I have important data to encrypt",
        } as GateActionContent,
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Gating data now...",
          action: "GATE_DATA",
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
      const evaluator = await knowledgeEvaluator.handler(
        runtime,
        message,
        _state
      );
      console.log("[gate-action] validate result ", evaluator);
      // return true;
      if (typeof evaluator === "boolean") {
        return evaluator;
      }
      return false;
    } catch {
      return false;
    }
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      elizaLogger.log("[gateDataAction] Gating data now...");
      const { content, embedding } = message;

      const provider = await gateDataProvider.get(runtime, message, state);
      if (provider.success) {
        const doc1 = await provider.storageProvider.storeMessageWithEmbedding(
          content.text,
          embedding
        );
        elizaLogger.log(
          ` [gateDataAction] Stored message with embedding: ${doc1}`
        );
        return;
      }

      return new Error(provider.error);
    } catch (error) {
      console.error("Error in GATE_DATA action", error);
      return error;
    }
  },
};
