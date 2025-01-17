import { Provider } from "@ai16z/eliza";
import { GateDataProviderResponseGet } from "../types.js";
import { StorageService } from "../services/storage.service.js";

export const gateDataProvider: Provider = {
  get: async (): Promise<GateDataProviderResponseGet> => {
    try {
      const storageService = StorageService.getInstance();
      await storageService.start();
      return {
        success: true,
        storageProvider: storageService,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch weather data",
      };
    }
  },
};
