export interface EVMAccount {
  chainId: number;
  address: string;
}

export interface SolanaAccount {
  network: string;
  address: string;
}

export interface BotAccountResponse {
  pkpAddress: string;
  evm: EVMAccount[];
  solana: SolanaAccount[];
}

export interface BotAccountMemory {
  smartAccount: string;
  signerAccount: string;
  chainId?: number;
  network?: string;
  type: "evm" | "solana";
}

export type ExecuteUserOpResponse = {
  userOperationHash: string;
  chainId: number;
};

export type ExecuteSolanaTransactionResponse = {
  txSignature: string;
};

export interface TransactionReceipt {
  transactionHash?: string;
  transactionIndex?: number;
  blockHash?: string;
  blockNumber?: number;
  from?: string;
  to?: string;
  cumulativeGasUsed?: number;
  status?: string;
  gasUsed?: number;
  contractAddress?: string | null;
  logsBloom?: string;
  effectiveGasPrice?: number;
}

export interface Log {
  data?: string;
  blockNumber?: number;
  blockHash?: string;
  transactionHash?: string;
  logIndex?: number;
  transactionIndex?: number;
  address?: string;
  topics?: string[];
}

export interface UserOperationReceipt {
  userOpHash?: string;
  entryPoint?: string;
  sender?: string;
  nonce?: number;
  paymaster?: string;
  actualGasUsed?: number;
  actualGasCost?: number;
  success?: boolean;
  receipt?: TransactionReceipt;
  logs?: Log[];
}
