import { ethers as Ethers } from "ethers";

declare global {
  export declare namespace Lit {
    export namespace Actions {
      /**
       * Check if a given IPFS ID is permitted to sign using a given PKP tokenId
       * @function isPermittedAction
       * @param {Object} params
       * @param {string} params.tokenId The tokenId to check
       * @param {string} params.ipfsId The IPFS ID of some JS code (a lit action)
       * @returns {Promise<boolean>} A boolean indicating whether the IPFS ID is permitted to sign using the PKP tokenId
       */
      function isPermittedAction({
        tokenId,
        ipfsId,
      }: {
        tokenId: string;
        ipfsId: string;
      }): Promise<boolean>;
      /**
       * Check if a given wallet address is permitted to sign using a given PKP tokenId
       * @function isPermittedAddress
       * @param {Object} params
       * @param {string} params.tokenId The tokenId to check
       * @param {string} params.address The wallet address to check
       * @returns {Promise<boolean>} A boolean indicating whether the wallet address is permitted to sign using the PKP tokenId
       */
      function isPermittedAddress({
        tokenId,
        address,
      }: {
        tokenId: string;
        address: string;
      }): Promise<boolean>;
      /**
       * Check if a given auth method is permitted to sign using a given PKP tokenId
       * @function isPermittedAuthMethod
       * @param {Object} params
       * @param {string} params.tokenId The tokenId to check
       * @param {number} params.authMethodType The auth method type.  This is an integer.  This mapping shows the initial set but this set may be expanded over time without updating this contract: https://github.com/LIT-Protocol/LitNodeContracts/blob/main/contracts/PKPPermissions.sol#L25
       * @param {Uint8Array} params.userId The id of the auth method to check expressed as an array of unsigned 8-bit integers (a Uint8Array)
       * @returns {Promise<boolean>} A boolean indicating whether the auth method is permitted to sign using the PKP tokenId
       */
      function isPermittedAuthMethod({
        tokenId,
        authMethodType,
        userId,
      }: {
        tokenId: string;
        authMethodType: number;
        userId: Uint8Array;
      }): Promise<boolean>;
      /**
       * Get the full list of actions that are permitted to sign using a given PKP tokenId
       * @function getPermittedActions
       * @param {Object} params
       * @param {string} params.tokenId The tokenId to check
       * @returns {Promise<Array<string>>} An array of IPFS IDs of lit actions that are permitted to sign using the PKP tokenId
       */
      function getPermittedActions({
        tokenId,
      }: {
        tokenId: string;
      }): Promise<Array<string>>;
      /**
       * Get the full list of addresses that are permitted to sign using a given PKP tokenId
       * @function getPermittedAddresses
       * @param {Object} params
       * @param {string} params.tokenId The tokenId to check
       * @returns {Promise<Array<string>>} An array of addresses that are permitted to sign using the PKP tokenId
       */
      function getPermittedAddresses({
        tokenId,
      }: {
        tokenId: string;
      }): Promise<Array<string>>;
      /**
       * Get the full list of auth methods that are permitted to sign using a given PKP tokenId
       * @function getPermittedAuthMethods
       * @param {Object} params
       * @param {string} params.tokenId The tokenId to check
       * @returns {Promise<Array<Object>>} An array of auth methods that are permitted to sign using the PKP tokenId.  Each auth method is an object with the following properties: auth_method_type, id, and user_pubkey (used for web authn, this is the pubkey of the user's authentication keypair)
       */
      function getPermittedAuthMethods({
        tokenId,
      }: {
        tokenId: string;
      }): Promise<Array<any>>;
      /**
       * Get the permitted auth method scopes for a given PKP tokenId and auth method type + id
       * @function getPermittedAuthMethodScopes
       * @param {Object} params
       * @param {string} params.tokenId The tokenId to check
       * @param {string} params.authMethodType The auth method type to look up
       * @param {Uint8Array} params.userId The id of the auth method to check expressed as an array of unsigned 8-bit integers (a Uint8Array)
       * @param {number} params.maxScopeId The maximum scope id to check.  This is an integer.
       * @returns {Promise<Array<boolean>>} An array of booleans that define if a given scope id is turned on.  The index of the array is the scope id.  For example, if the array is [true, false, true], then scope ids 0 and 2 are turned on, but scope id 1 is turned off.
       */
      function getPermittedAuthMethodScopes({
        tokenId,
        authMethodType,
        userId,
        maxScopeId,
      }: {
        tokenId: string;
        authMethodType: string;
        userId: Uint8Array;
        maxScopeId: number;
      }): Promise<Array<boolean>>;
      /**
       * Converts a PKP public key to a PKP token ID by hashing it with keccak256
       * @function pubkeyToTokenId
       * @param {Object} params
       * @param {string} params.publicKey The public key to convert
       * @returns {Promise<string>} The token ID as a string
       */
      function pubkeyToTokenId({
        publicKey,
      }: {
        publicKey: string;
      }): Promise<string>;
      /**
       * Gets latest nonce for the given address on a supported chain
       * @function getLatestNonce
       * @param {Object} params
       * @param {string} params.address The wallet address for getting the nonce
       * @param {string} params.chain The chain of which the nonce is fetched
       * @returns {Promise<string>} The token ID as a string
       */
      function getLatestNonce({
        address,
        chain,
      }: {
        address: string;
        chain: string;
      }): Promise<string>;
      /**
       * Ask the Lit Node to sign any data using the ECDSA Algorithm with it's private key share.  The resulting signature share will be returned to the Lit JS SDK which will automatically combine the shares and give you the full signature to use.
       * @function signEcdsa
       * @param {Object} params
       * @param {Uint8Array} params.toSign The data to sign.  Should be an array of 8-bit integers.
       * @param {string} params.publicKey The public key of the PKP you wish to sign with
       * @param {string} params.sigName You can put any string here.  This is used to identify the signature in the response by the Lit JS SDK.  This is useful if you are signing multiple messages at once.  When you get the final signature out, it will be in an object with this signature name as the key.
       * @returns {Promise<string>} This function will return the string "success" if it works.  The signature share is returned behind the scenes to the Lit JS SDK which will automatically combine the shares and give you the full signature to use.
       */
      function signEcdsa({
        toSign,
        publicKey,
        sigName,
      }: {
        toSign: Uint8Array;
        publicKey: string;
        sigName: string;
      }): Promise<string>;
      /**
       * Ask the Lit Node to sign a message using the eth_personalSign algorithm.  The resulting signature share will be returned to the Lit JS SDK which will automatically combine the shares and give you the full signature to use.
       * @function ethPersonalSignMessageEcdsa
       * @param {Object} params
       * @param {string} params.message The message to sign.  Should be a string.
       * @param {string} params.publicKey The public key of the PKP you wish to sign with
       * @param {string} params.sigName You can put any string here.  This is used to identify the signature in the response by the Lit JS SDK.  This is useful if you are signing multiple messages at once.  When you get the final signature out, it will be in an object with this signature name as the key.
       * @returns {Promise<string>} This function will return the string "success" if it works.  The signature share is returned behind the scenes to the Lit JS SDK which will automatically combine the shares and give you the full signature to use.
       */
      function ethPersonalSignMessageEcdsa({
        message,
        publicKey,
        sigName,
      }: {
        message: string;
        publicKey: string;
        sigName: string;
      }): Promise<string>;
      /**
       * Checks a condition using the Lit condition checking engine.  This is the same engine that powers our Access Control product.  You can use this to check any condition that you can express in our condition language.  This is a powerful tool that allows you to build complex conditions that can be checked in a decentralized way.  Visit https://developer.litprotocol.com and click on the "Access Control" section to learn more.
       * @function checkConditions
       * @param {Object} params
       * @param {Array<Object>} params.conditions An array of access control condition objects
       * @param {Object} params.authSig The AuthSig to use for the condition check.  For example, if you were checking for NFT ownership, this AuthSig would be the signature from the NFT owner's wallet.
       * @param {string} params.chain The chain this AuthSig comes from
       * @returns {Promise<boolean>} A boolean indicating whether the condition check passed or failed
       */
      function checkConditions({
        conditions,
        authSig,
        chain,
      }: {
        conditions: Array<any>;
        authSig: any;
        chain: string;
      }): Promise<boolean>;
      /**
       * Set the response returned to the client
       * @function setResponse
       * @param {Object} params
       * @param {string} params.response The response to send to the client.  You can put any string here, like you could use JSON.stringify on a JS object and send it here.
       */
      function setResponse({ response }: { response: string }): any;
      /**
       * Call a child Lit Action
       * @function call
       * @param {Object} params
       * @param {string} params.ipfsId The IPFS ID of the Lit Action to call
       * @param {Object=} params.params Optional parameters to pass to the child Lit Action
       * @returns {Promise<string>} The response from the child Lit Action.  Note that any signatures performed by the child Lit Action will be automatically combined and returned with the parent Lit Action to the Lit JS SDK client.
       */
      function call({
        ipfsId,
        params,
      }: {
        ipfsId: string;
        params?: any | undefined;
      }): Promise<string>;
      /**
       * Call a smart contract
       * @function callContract
       * @param {Object} params
       * @param {string} params.chain The name of the chain to use.  Check out the lit docs "Supported Blockchains" page to find the name.  For example, "ethereum"
       * @param {string} params.txn The RLP Encoded txn, as a hex string
       * @returns {Promise<string>} The response from calling the contract
       */
      function callContract({
        chain,
        txn,
      }: {
        chain: string;
        txn: string;
      }): Promise<string>;
      /**
       * Convert a Uint8Array to a string.  This is a re-export of this function: https://www.npmjs.com/package/uint8arrays#tostringarray-encoding--utf8
       * @function uint8arrayToString
       * @param {Uint8Array} array The Uint8Array to convert
       * @param {string} encoding The encoding to use.  Defaults to "utf8"
       * @returns {string} The string representation of the Uint8Array
       */
      function uint8arrayToString(...args: any[]): string;
      /**
       * Convert a string to a Uint8Array.  This is a re-export of this function: https://www.npmjs.com/package/uint8arrays#fromstringstring-encoding--utf8
       * @function uint8arrayFromString
       * @param {string} string The string to convert
       * @param {string} encoding The encoding to use.  Defaults to "utf8"
       * @returns {Uint8Array} The Uint8Array representation of the string
       */
      function uint8arrayFromString(...args: any[]): Uint8Array;
      function aesDecrypt({
        symmetricKey,
        ciphertext,
      }: {
        symmetricKey: any;
        ciphertext: any;
      }): any;
      /**
       * Claim a key through a key identifier, the result of the claim will be added to `claim_id`
       * under the `keyId` given.
       * @param {Object} params
       * @param {string} params.keyId user id of the claim
       */
      function claimKey({ keyId }: { keyId: string }): any;
      /**
       * Broadcast a message to all connected clients and collect their responses
       * @param {string} name  The name of the broadcast
       * @param {string} value  The value to broadcast
       * @returns {string} The collected responses as a json array
       */
      function broadcastAndCollect({ name, value }: string): string;
      /**
   * Decrypt and combine the provided
   * @param {object[]} accessControlConditions The access control conditions
   * @param {string} ciphertext The ciphertext to decrypt
   * @param {string} dataToEncryptHash The hash of the data to <encrypt />
   @ @param {string} authSig The auth signature
    * @param {string} chain The chain
   * @returns {string} The combined data
   */
      function decryptAndCombine({
        accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        authSig,
        chain,
      }): Promise<string>;
      /**
   * Decrypt to a single node.
   * @param {object[]} accessControlConditions The access control conditions
   * @param {string} ciphertext The ciphertext to decrypt
   * @param {string} dataToEncryptHash The hash of the data to <encrypt />
   @ @param { any} authSig The auth signature
    * @param {string} chain The chain
   * @returns {string} The combined data
   */
      function decryptToSingleNode({
        accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        authSig,
        chain,
      }: {
        accessControlConditions: object[];
        ciphertext: string;
        dataToEncryptHash: string;
        chain: string;
        authSig: any;
      }): Promise<string>;
      /**
       * @param {Uint8array} toSign the message to sign
       * @param {string} publicKey the public key of the PKP
       * @param {string} sigName the name of the signature
       * @returns {Uint8array} The resulting signature
       */
      function signAndCombineEcdsa({
        toSign,
        publicKey,
        sigName,
      }: Uint8array): Uint8array;
      /**
       *
       * @param {bool} waitForResponse Whether to wait for a response or not - if false, the function will return immediately.
       * @returns {bool} Whether the node can run the code in the next block or not.
       */
      function runOnce({ waitForResponse, name }: bool, async_fn: any): bool;
      /**
       *
       * @param {string} chain The chain to get the RPC URL for
       * @returns {string} The RPC URL for the chain
       */
      function getRpcUrl({ chain }: { chain: string }): Promise<string>;
      /**
       *
       * @param {object[]} accessControlConditions  The access control conditions
       * @param {Uint8Array} to_encrypt The message to encrypt
       * @returns { {ciphertext: string, dataToEncryptHash: string} } Contains two items: The ciphertext result after encryption, named "ciphertext" and the dataToEncryptHash, named "dataToEncryptHash"
       */
      function encrypt({
        accessControlConditions,
        to_encrypt,
      }: {
        accessControlConditions: object[];
        to_encrypt: Uint8Array;
      }): {
        ciphertext: string;
        dataToEncryptHash: string;
      };
    }

    export namespace Auth {
      /**
       * Array of action IPFS IDs.
       * @type {Array<`Qm${string}` | string>}
       */
      const actionIpfsIds: Array<`Qm${string}` | string>;

      /**
       * Array of authentication method contexts.
       * @type {Array<{
       *   userId: string;
       *   appId: string;
       *   authMethodType: number;
       *   lastRetrievedAt: string;
       *   expiration: number;
       *   usedForSignSessionKeyRequest: boolean;
       * }>}
       */
      const authMethodContexts: {
        userId: string;
        appId: string;
        authMethodType: number;
        lastRetrievedAt: string;
        expiration: number;
        usedForSignSessionKeyRequest: boolean;
      }[];

      /**
       * Array of resources.
       * @type {Array<any>}
       */
      const resources: Array<any>;

      /**
       * Custom authentication resource.
       * @type {string | `"\\(true,${string})\\"`}
       */
      const customAuthResource: string | `"\\(true,${string})\\"`;
    }
  }
  // default SDKs injected by Lit
  export type ethers = Ethers;
  export const ethers: typeof Ethers;

  // TODO: add custom shims here
  export type Buffer = Buffer;
  export const Buffer: typeof Buffer;
  export namespace GatedData {
    function getEthereumAddressForPKP(pkp: string): Promise<string>;
    function getEncryptDecryptACL(pkp: string): Promise<object[]>;
  }

  // TODO: JSParams go here
  const helloName: string;
  const publicKey: string;
  const toSign: Uint8Array;
  const sigName: string;

  // encrypt-action
  const toEncrypt: string;
  // decrypt-action
  const ciphertext: string;
  const dataToEncryptHash: string;
  const chain: string;
}
