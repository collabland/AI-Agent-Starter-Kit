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
import { gateDataProvider } from "../providers/provider.js";

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
      modelClass: ModelClass.MEDIUM,
    });
    elizaLogger.debug("[knowledge handler] Response from the agent:", res);

    const important = res === "TRUE" ? true : false;
    // Example evaluation logic
    if (important) {
      const { content, embedding } = memory;

      const provider = await gateDataProvider.get(runtime, memory, state);
      if (provider.success) {
        const doc1 = await provider.storageProvider.storeMessageWithEmbedding(
          content.text,
          embedding,
          true // TODO how can we tell if it's agent or user?
        );

        elizaLogger.log(
          `[knowledge handler] Important content found in memory. Stored message with embedding: ${doc1}`
        );
      }
    } else {
      elizaLogger.debug(
        "[knowledge handler] No important content found in memory."
      );
    }
    return important;
  },
  name: "knowledgeEvaluator",
  validate: async (_runtime: IAgentRuntime, memory: Memory, _state?: State) => {
    // Validation logic for the evaluator
    return true;
  },
};
