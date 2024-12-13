/* eslint-disable @typescript-eslint/no-explicit-any */

import { resolve } from "path";
const __dirname = new URL(".", import.meta.url).pathname;

export type AnyType = any;
export const chainMap = {
  ethereum: 11155111,
  base: 84532,
  linea: 59141,
};

export const getTokenMetadataPath = () => {
  const path = resolve(
    __dirname,
    "..",
    "..",
    process.env.TOKEN_DETAILS_PATH || "token_metadata.example.jsonc"
  );
  console.log("tokenMetadataPath:", path);
  return path;
};

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  websiteLink: string;
  twitter: string;
  discord: string;
  telegram: string;
  nsfw: boolean;
  image: string;
}

export interface MintResponse {
  response: {
    contract: {
      fungible: {
        object: string;
        name: string;
        symbol: string;
        media: string | null;
        address: string;
        decimals: number;
      };
    };
  };
}
