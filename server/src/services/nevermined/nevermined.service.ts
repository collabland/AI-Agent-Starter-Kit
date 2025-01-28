import { Nevermined, type NeverminedOptions } from "@nevermined-io/sdk";

/**
 * SDK to interact with the Nevermined Protocol

 * https://docs.nevermined.io/docs/nevermined-sdk/getting-started/
 */
const config: NeverminedOptions = {
  // The web3 endpoint of the blockchain network to connect to, could be an Infura endpoint, Quicknode, or any other web3 provider
  web3ProviderUri:
    process.env.NEVERMINED_WEB3_PROVIDER_URI ||
    "https://sepolia-rollup.arbitrum.io/rpc",
  // The url of the marketplace api if you connect to one. It could be your own service if you run a Marketplace API
  marketplaceUri:
    process.env.NEVERMINED_MARKETPLACE_URI ||
    "https://marketplace-api.testing.nevermined.app",
  // The url to a Nevermined node. It could be your own if you run a Nevermined Node
  neverminedNodeUri:
    process.env.NEVERMINED_NODE_URI || "https://node.testing.nevermined.app",
  // The public address of the above Node
  neverminedNodeAddress:
    process.env.NEVERMINED_NODE_ADDRESS ||
    "0x5838B5512cF9f12FE9f2beccB20eb47211F9B0bc",
  marketplaceAuthToken: process.env.MARKETPLACE_AUTH_TOKEN,
  // Folder where are copied the ABIs of the Nevermined Smart Contracts
  artifactsFolder: "./artifacts",
};

/**
 * Create valid Nevermined SDK instance
 *
 * @returns {Promise<Nevermined>} Nevermined SDK instance
 */
export const neverminedService = async () => {
  const nevermined = await Nevermined.getInstance(config);

  console.log("initializing nevermind", await nevermined.utils.versions.get());

  return nevermined;
};
