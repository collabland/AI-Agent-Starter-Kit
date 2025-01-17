import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import { GateDataProviderResponseGet } from "../types.js";
import { StorageService } from "../services/storage.service.js";

export const gateDataProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State
  ): Promise<GateDataProviderResponseGet> => {
    try {
      // to-do: read from knowledge/facts db to get the user's eth address
      const address = "0x8071f6F971B438f7c0EA72C950430EE7655faBCe";
      if (!address) {
        return {
          success: false,
          error: "User's eth address not found",
        };
      } else if (!message.embedding) {
        return {
          success: false,
          error: "No embedding found in the message",
        };
      } else {
        const storageService = StorageService.getInstance();
        await storageService.start();

        // pass in the user's eth address to get the storage provider
        const additionalContext = await storageService.getEmbeddingContext(
          message.embedding,
          address
        );
        if (!additionalContext) {
          return {
            success: false,
            error: "Unable to get additional context",
          };
        } else {
          //to:do - update state with additional context
          return {
            success: true,
            additionalContext,
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to get storage provider",
      };
    }
  },
};
