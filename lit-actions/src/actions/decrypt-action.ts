// Add this to the top of the file, so that it can reference the global.d.ts file
/// <reference path="../global.d.ts" />

//@ts-ignore
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

  try {
    const accessControlConditions =
      await GatedData.getEncryptDecryptACL(publicKey);
    const decrypted = await Lit.Actions.decryptToSingleNode({
      accessControlConditions,
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
