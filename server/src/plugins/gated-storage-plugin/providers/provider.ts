import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import { StorageService } from "../services/storage.service.js";

export const gateDataProvider: Provider = {
  get: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State
  ): Promise<Error | string> => {
    try {
      if (!message.embedding) {
        return "";
      } else {
        const storageService = StorageService.getInstance();
        if (!storageService.isConfigured()) {
          return "";
        }

        // pass in the user's eth address to get the storage provider
        const additionalContext = await storageService.getEmbeddingContext(
          message.embedding
        );
        if (additionalContext) {
          return (
            "[Important information from gated memory]: " + additionalContext
          );
        }
      }
      return "";
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "Unable to get storage provider";
    }
  },
};
