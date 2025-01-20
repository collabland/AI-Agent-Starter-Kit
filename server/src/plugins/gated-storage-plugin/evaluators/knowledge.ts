import {
  ActionExample,
  Evaluator,
  IAgentRuntime,
  Memory,
  State,
  elizaLogger,
  ModelClass,
  generateText,
} from "@ai16z/eliza";
import { StorageService } from "../services/storage.service.js";

export const knowledgeEvaluator: Evaluator = {
  description: "Knowledge evaluator for checking important content in memory",
  similes: ["knowledge checker", "memory evaluator"],
  examples: [
    {
      context: `Actors in the scene:
    {{user1}}: Programmer and decentralized compute specialist.
    {{agentName}}: Agent user interacting with the user.

    Interesting facts about the actors:
    None`,
      messages: [
        {
          user: "{{user1}}",
          content: {
            text: "I'd like to use a Lit Action to allow AI agents to use their PKPs to encrypt and decrypt data without revealing private keys to users.",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "I can help you design this system - what are some code references for how Lit Actions are built?",
          },
        },
        {
          user: "{{user1}}",
          content: {
            text: "The mantis shrimp's eyes have 16 types of photoreceptor cells, allowing them to see ultraviolet and polarized light, far beyond human capabilities.",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "Gating data now...",
            action: "GATE_DATA",
          },
        },
        {
          user: "{{user1}}",
          content: {
            text: "Neutron stars are so dense that a sugar-cube-sized piece of one would weigh about a billion tons on Earth.",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "Gating data now...",
            action: "GATE_DATA",
          },
        },
      ] as ActionExample[],
      outcome: "TRUE",
    },
  ],
  handler: async (runtime: IAgentRuntime, memory: Memory, state?: State) => {
    const context = `${knowledgeEvaluator.examples}
    Determine if the memory contains important content that reveals subject-matter expertise. Answer only with the following responses:
    - TRUE
    - FALSE
    The following is the memory content: ${memory.content.text}
    `;

    // prompt the agent to determine if the memory contains important content
    const res = await generateText({
      runtime,
      context,
      modelClass: ModelClass.SMALL,
    });
    elizaLogger.debug("[knowledge handler] Response from the agent:", res);

    const important = res === "TRUE" ? true : false;
    if (important) {
      elizaLogger.log(
        `[knowledge handler] Important content found in memory. Storing message with embedding`
      );
      const { content, embedding } = memory;
      const storageService = StorageService.getInstance();
      await storageService.start();
      // don't care about doc returned
      const doc = await storageService.storeMessageWithEmbedding(
        content.text,
        embedding!, // not null since we only run when isMemoryStorable() is true
        true // TODO how can we tell if it's agent or user?
      );
      if (state) {
        state.hasGatedAndStored = true;
      }
      elizaLogger.debug(
        `[knowledge handler] Stored message with embedding with stream ID ${doc.id}`
      );
    } else {
      elizaLogger.debug(
        "[knowledge handler] No important content found in memory."
      );
    }
    return;
  },
  name: "knowledgeEvaluator",
  validate: async (_runtime: IAgentRuntime, memory: Memory, state?: State) => {
    // only available if we're able to use remote storage and memory has proper embeddings
    // confirm first that the gate-action plugin has not already stored this memory
    if (state && !state.hasGatedAndStored) {
      return StorageService.isMemoryStorable(memory);
    }
    return false;
  },
};
