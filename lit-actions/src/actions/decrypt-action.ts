// Add this to the top of the file, so that it can reference the global.d.ts file
/// <reference path="../global.d.ts" />

const decrypt = async (message) => {
  console.log("[action] Lit.decrypt");
  // to do
  Lit.Actions.setResponse({
    response: JSON.stringify({
      encrypted: "to do",
    }),
  });
  // Returns the signature
  return "done";
};

decrypt(onmessage);
