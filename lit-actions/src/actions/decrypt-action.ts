// Add this to the top of the file, so that it can reference the global.d.ts file
/// <reference path="../global.d.ts" />

const go = async () => {
  if (!ciphertext || !dataToEncryptHash || !chain) {
    Lit.Actions.setResponse({
      response: JSON.stringify({
        message: `bad_request: missing input`,
        timestamp: Date.now().toString(),
      }),
    });
    return;
  }
  // const accessControlConditions = [
  //   {
  //     contractAddress: "evmBasic",
  //     standardContractType: "",
  //     chain: "base",
  //     method: "eth_getBalance",
  //     parameters: [":userAddress", "latest"],
  //     returnValueTest: {
  //       comparator: "<=",
  //       value: "1000000000000000000", // 1 ETH
  //     },
  //   },
  // ];

  // always true since 1651276942 is 2025-01-18 08:42:54 UTC
  const encryptDecryptACL = [
    {
      contractAddress: "evmBasic",
      standardContractType: "timestamp",
      chain: "base",
      method: "eth_getBlockByNumber",
      parameters: ["latest"],
      returnValueTest: {
        comparator: ">=",
        value: "1",
      },
    },
  ];

  try {
    const decrypted = await Lit.Actions.decryptAndCombine({
      accessControlConditions: encryptDecryptACL,
      ciphertext,
      dataToEncryptHash,
      authSig: null,
      chain,
    });
    // do nothing on nodes without data
    if (!decrypted) {
      return;
    }
    Lit.Actions.setResponse({
      response: JSON.stringify({
        message: "Successfully decrypted data",
        decrypted,
        timestamp: Date.now().toString(),
      }),
    });
  } catch (err) {
    Lit.Actions.setResponse({
      response: JSON.stringify({
        message: `failed to decrypt data: ${err.message}`,
        timestamp: Date.now().toString(),
      }),
    });
  }
};

go();
