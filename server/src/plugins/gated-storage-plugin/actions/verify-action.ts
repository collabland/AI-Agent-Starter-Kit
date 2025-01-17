// import {
//     Action,
//     IAgentRuntime,
//     Memory,
//     State,
//     HandlerCallback,
// } from "@elizaos/core";
// import { GateActionContent } from "../types.ts";
// // import { nonceProvider } from "../provider.ts";
// import { WalletHandshake } from "../services/wallet.service.ts";
// import { gateDataProvider } from "../providers/provider.js";

// export const verifyAction: Action = {
//     name: "NONCE_VERIFY",
//     description: "Verifies the signature of the user for the handshake",
//     similes: ["NONCE_VERIFY", "VERIFY_MESSAGE"],
//     examples: [
//         [
//             {
//                 user: "{{user1}}",
//                 content: {
//                     text: 'Signed nonce: {"signature":"0x8fc966b1527d7d4b095702af49d714417d13225a6f53f1f6f95ad0ef3155619837ed81e298c8bd7157708d83ac5dd26a251c811ba033804651b8cd135c1f63441b","address":"0x8071f6F971B438f7c0EA72C950430EE7655faBCe"}',
//                 } as GateActionContent,
//             },
//             {
//                 user: "{{agentName}}",
//                 content: {
//                     text: "Verifying your signature for the handshake...",
//                     action: "NONCE_VERIFY",
//                 },
//             },
//         ],
//     ],

//     validate: async (
//         runtime: IAgentRuntime,
//         message: Memory,
//         _state?: State
//     ): Promise<boolean> => {
//         try {
//             const content = message.content as GateActionContent;
//             if (
//                 typeof content.text === "string" &&
//                 content.text.toLowerCase().includes("here is my signed nonce:")
//             ) {
//                 console.log("Validated signature for the handshake...");
//                 return true;
//             }
//         } catch {
//             return false;
//         }
//     },

//     handler: async (
//         runtime: IAgentRuntime,
//         message: Memory,
//         state: State,
//         _options: any,
//         callback: HandlerCallback
//     ): Promise<void | Error> => {
//         try {
//             const wallet = new WalletHandshake();
//             const nonceSeparated = message.content.text.split(
//                 "Here is my signed nonce:"
//             );
//             console.log("Nonce separated:", nonceSeparated);
//             const signedMessage = JSON.parse(nonceSeparated[1].trim()) as {
//                 nonce: string;
//                 signature: string;
//                 address: string;
//             };
//             console.log("Signed message:", signedMessage);
//             const isVerified = await wallet.verifySignature(
//                 signedMessage.nonce,
//                 signedMessage.signature,
//                 signedMessage.address
//             );
//             if (isVerified) {
//                 const provider = await gateDataProvider.get(
//                     runtime,
//                     message,
//                     state
//                 );
//                 const res = await provider.provider.verifyUser(
//                     signedMessage.address,
//                     message.userId,
//                     true
//                 );
//                 console.log("User verified:", res);
//                 await runtime.knowledgeManager.createMemory({
//                     content: {
//                         text: signedMessage.address,
//                     },
//                     roomId: message.roomId,
//                     userId: runtime.agentId,
//                     agentId: runtime.agentId,
//                 });
//                 callback({
//                     text: `Your signature has been verified!`,
//                 });
//             } else {
//                 callback({
//                     text: `Your signature could not be verified.`,
//                 });
//             }
//             return;
//         } catch (error) {
//             console.error("Error in handshake action:", error);
//             return error;
//         }
//     },
// };
