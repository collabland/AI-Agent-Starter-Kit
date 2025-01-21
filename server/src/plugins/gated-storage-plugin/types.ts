import { Content } from "@ai16z/eliza";

export interface GateDataConfig {
  provider: {
    table_id: string;
    orbis_gateway: string;
    ceramic_gateway: string;
    private_key: string;
    context_id: string;
  };
}

export interface GateActionContent extends Content {
  text: string;
}

export interface GateDataProviderResponseGet {
  success: boolean;
  additionalContext?: string;
  error?: string;
}

export interface NonceProviderResponseGet {
  success: boolean;
  nonce?: string;
  error?: string;
}
