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

export const formatFacts = (facts: Memory[]) => {
  const messageStrings = facts
    .reverse()
    .map((fact: Memory) => fact.content.text);
  const finalMessageStrings = messageStrings.join("\n");
  return finalMessageStrings;
};

export const knowledgeEvaluator: Evaluator = {
  alwaysRun: true,
  description: "Knowledge evaluator for checking important content in memory",
  similes: ["knowledge checker", "memory evaluator"],
  examples: [
    {
      context: `Actors in the scene:
    {{user1}}: Programmer and decentralized compute specialist.
    {{agentName}}: Agent user interacting with the user.

    Facts about the actors:
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
      outcome: `{ "knowledge": "You can use Lit Actions to perform PKP signing, encryption, and decryption", "type": "fact", "already_known": false },`,
    },
  ],
  handler: async (runtime: IAgentRuntime, memory: Memory, _state?: State) => {
    const context = `
        Determine if the memory contains important content that reveals subject-matter expertise. Answer only with the following responses:
        - TRUE
        - FALSE
        The following is the memory content: ${memory.content.text}
        `;
    // prompt the agent to determine if the memory contains important content
    const res = await generateText({
      runtime,
      context,
      modelClass: ModelClass.LARGE,
    });
    elizaLogger.log("Response from the agent:", res);

    // Example evaluation logic
    if (res === "TRUE") {
      elizaLogger.log("Important content found in memory.");
      return true;
    } else {
      elizaLogger.log("No important content found in memory.");
      return false;
    }
  },
  name: "knowledgeEvaluator",
  validate: async (
    _runtime: IAgentRuntime,
    _memory: Memory,
    _state?: State
  ) => {
    // Validation logic for the evaluator
    return true;
  },
};
