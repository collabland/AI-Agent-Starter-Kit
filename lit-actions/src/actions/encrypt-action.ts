// Add this to the top of the file, so that it can reference the global.d.ts file
/// <reference path="../global.d.ts" />

const encrypt = async (message) => {
  console.log("[action] Lit.encrypt");
  const encrypted = await Lit.Actions.encrypt({
    accessControlConditions: [
      {
        contractAddress: "0x932261f9Fc8DA46C4a22e31B45c4De60623848bF",
        standardContractType: "ERC721",
        chain: "ethereum",
        method: "balanceOf",
        parameters: [":userAddress"],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ],
    to_encrypt: message,
  });
  Lit.Actions.setResponse({
    response: JSON.stringify({
      encrypted,
    }),
  });
  // Returns the signature
  return encrypted;
};

encrypt(onmessage);
