async function getEthereumAddressForPKP(pkp) {
  if (!pkp) {
    throw new Error("PKP is required");
  }

  // Remove the 0x04 prefix from the uncompressed public key (first byte)
  const strippedPublicKey = pkp.startsWith("0x") ? pkp.slice(4) : pkp.slice(2);

  const publicKeyHash = ethers.utils.keccak256(`0x${strippedPublicKey}`);
  // Take the last 20 bytes of the hash (40 hex characters) for the Ethereum address
  const ethereumAddress = `0x${publicKeyHash.slice(-40)}`;

  return ethers.utils.getAddress(ethereumAddress);
}

async function getEncryptDecryptACL(pkp) {
  const addr = await getEthereumAddressForPKP(pkp);
  if (!addr) {
    throw new Error("Unable to get eth addresses for pkp");
  }
  return [
    {
      contractAddress: "evmBasic",
      standardContractType: "",
      chain: "base",
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "=",
        value: addr,
      },
    },
  ];
}

globalThis.GatedData = {
  getEthereumAddressForPKP,
  getEncryptDecryptACL,
};
