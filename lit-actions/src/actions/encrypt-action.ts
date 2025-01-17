// Add this to the top of the file, so that it can reference the global.d.ts file
/// <reference path="../global.d.ts" />

const go = async () => {
  if (!encryptRequest) {
    return "Missing input";
  }
  try {
    const to_encrypt = new Uint8Array(encryptRequest.toEncrypt);
    const encrypted = await Lit.Actions.encrypt({
      accessControlConditions: encryptRequest.accessControlConditions,
      to_encrypt,
    });
    Lit.Actions.setResponse({
      response: JSON.stringify({
        message: "Successfully encrypted data",
        encrypted,
        timestamp: Date.now().toString(),
      }),
    });
    return encrypted;
  } catch (err) {
    Lit.Actions.setResponse({
      response: JSON.stringify({
        message: `Failed to encrypt data (${encryptRequest.toEncrypt}): ${err.message}`,
        timestamp: Date.now().toString(),
      }),
    });
    return err.message || "Failed to encrypt data";
  }
};

go();
