import { Router, Request, Response } from "express";
import { EmberService } from "../services/ember.service.js";

const router = Router();

/**
 * Initiates the Ember AGI TypeScript SDK
 * https://github.com/EmberAGI/ember-sdk-typescript
 */
router.get("/init", async (req: Request, res: Response) => {
  try {
    const ember = await EmberService.getClient();

    console.log("[Ember Init] initialized ember client:", { query: req.query });
    res.json({ ok: true, ember });
  } catch (error) {
    console.error("[Ember Init] Error:", error);
    res.status(500).json({ error: "Ember initialization failed" });
  }
});

/**
 * Fetches chains from the Ember AGI TypeScript SDK
 */
router.get("/chains", async (req: Request, res: Response) => {
  try {
    const ember = await EmberService.getClient();
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

    const chains = await ember.getChains({
      pageSize,
      filter: "", // Optional filter string
      pageToken: "", // Optional pagination token
    });

    console.log("[Ember Chains] fetched chains:");
    res.status(200).json({ ok: true, chains });
  } catch (error) {
    console.error("[Ember Chains] Error:", error);
    res.status(500).json({ error: "Failed to fetch chains" });
  }
});

/**
 * We're using the ember client to find chains, find a ethereum chain, and perform a swap between two tokens
 * Swaps are used to compensate agents in their network and decentralized applications
 */
router.post("/swap", async (req: Request, res: Response) => {
  try {
    const { token1, token2, amount, fromChain, fromAddress, toAddress } =
      req.body;

    const ember = await EmberService.getClient();

    if (
      !token1 ||
      !token2 ||
      !amount ||
      !fromChain ||
      !fromAddress ||
      !toAddress
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
    }

    // Initialize Ember client
    const client = new EmberClient({
      endpoint: process.env.EMBER_ENDPOINT_URL || "api.emberai.xyz:443",
      apiKey: process.env.EMBER_API_KEY || "",
    });

    // Setup blockchain client
    const transport = http(process.env.RPC_URL || "https://eth.llamarpc.com");
    const publicClient = createPublicClient({
      chain: mainnet,
      transport,
    });

    // Initialize wallet
    const account = privateKeyToAccount(
      process.env.PRIVATE_KEY as `0x${string}`
    );
    const walletClient = createWalletClient({
      account,
      chain: mainnet,
      transport,
    });

    // Get chain info
    const { chains } = await client.getChains({
      pageSize: 10,
      filter: "",
      pageToken: "",
    });

    // Verify chain support
    const selectedChain = chains.find((chain) => chain.chainId === fromChain);
    if (!selectedChain) {
      throw new Error(`Chain ${fromChain} not supported`);
    }

    // Get available tokens
    const { tokens } = await client.getTokens({
      chainId: selectedChain.chainId,
      pageSize: 100,
      filter: "",
      pageToken: "",
    });

    // Find requested tokens
    const baseToken = tokens.find((t) => t.tokenId === token1);
    const quoteToken = tokens.find((t) => t.tokenId === token2);

    if (!baseToken || !quoteToken) {
      throw new Error("One or more tokens not found");
    }

    // Create swap request
    const swap = await client.swapTokens({
      type: OrderType.MARKET_BUY,
      baseToken: {
        chainId: selectedChain.chainId,
        tokenId: baseToken.tokenId,
      },
      quoteToken: {
        chainId: selectedChain.chainId,
        tokenId: quoteToken.tokenId,
      },
      amount,
      recipient: toAddress,
    });

    // Verify transaction plan
    if (
      !swap.transactionPlan ||
      swap.transactionPlan.type !== TransactionType.EVM_TX
    ) {
      throw new Error("Invalid transaction plan");
    }

    // Get gas estimate
    const gasEstimate = await publicClient.estimateGas({
      account: fromAddress,
      to: swap.transactionPlan.to as `0x${string}`,
      data: swap.transactionPlan.data as `0x${string}`,
      value: BigInt(swap.transactionPlan.value || "0"),
    });

    // Execute swap transaction
    const hash = await walletClient.sendTransaction({
      to: swap.transactionPlan.to as `0x${string}`,
      data: swap.transactionPlan.data as `0x${string}`,
      value: BigInt(swap.transactionPlan.value || "0"),
      gas: gasEstimate,
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    res.json({
      success: true,
      swap: {
        status: swap.status,
        estimation: {
          baseTokenDelta: swap.estimation?.baseTokenDelta,
          quoteTokenDelta: swap.estimation?.quoteTokenDelta,
          effectivePrice: swap.estimation?.effectivePrice,
        },
        fees: swap.feeBreakdown,
        transaction: {
          hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status === "success" ? "success" : "failed",
        },
      },
    });
  } catch (error) {
    console.error("[Ember Swap] Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Swap failed",
    });
  }
});

export default router;
