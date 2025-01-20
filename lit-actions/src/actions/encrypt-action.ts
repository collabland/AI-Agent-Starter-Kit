// Add this to the top of the file, so that it can reference the global.d.ts file
/// <reference path="../global.d.ts" />

const encryptData = async (to_encrypt: Uint8Array) => {
  const accessControlConditions =
    await GatedData.getEncryptDecryptACL(publicKey);
  const res = await Lit.Actions.encrypt({
    accessControlConditions,
    to_encrypt,
  });
  return res;
};

//@ts-ignore
const go = async () => {
  if (!toEncrypt) {
    Lit.Actions.setResponse({
      response: JSON.stringify({
        message: "bad_request: invalid input",
        timestamp: Date.now().toString(),
      }),
    });
    return;
  }
  try {
    // new buffer to avoid error about shared buffer view
    const { ciphertext, dataToEncryptHash } = await encryptData(
      new TextEncoder().encode(toEncrypt)
    );
    Lit.Actions.setResponse({
      response: JSON.stringify({
        message: "Successfully encrypted data",
        ciphertext,
        dataToEncryptHash,
        timestamp: Date.now().toString(),
      }),
    });
  } catch (err) {
    Lit.Actions.setResponse({
      response: JSON.stringify({
        message: `Failed to encrypt data (${toEncrypt}): ${err.message}`,
        timestamp: Date.now().toString(),
      }),
    });
  }
};

go();
