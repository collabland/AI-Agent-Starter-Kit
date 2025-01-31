import { Router, Request, Response } from "express";
import {
  EmberService,
  type AgentSwapAction,
} from "../services/ember.service.js";

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
 * Fetches tokens information available to the Ember AGI TypeScript SDK
 */
router.get("/tokens", async (req: Request, res: Response) => {
  try {
    const ember = await EmberService.getClient();
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

    const tokens = await ember.getTokens({
      pageSize,
      filter: "", // Optional filter string
      pageToken: "", // Optional pagination token
      chainId: (req.query.chainId as string) || "1", // Ethereum chain ID
    });

    console.log("[Ember Chains] fetched chains:");
    res.status(200).json({ ok: true, tokens });
  } catch (error) {
    console.error("[Ember Chains] Error:", error);
    res.status(500).json({ error: "Failed to fetch chains" });
  }
});

/**
 * We're using the ember client to find chains, find a ethereum chain, and perform a swap between two tokens
 * Swaps are used to compensate agents in their network and decentralized applications
 */

router.post("/agent/swap", async (req: Request, res: Response) => {
  try {
    const { baseToken, quoteToken, amount, recipient } = req.body;
    const ember = new EmberService();

    const action: AgentSwapAction = {
      type: "MARKET_BUY",
      params: {
        baseToken,
        quoteToken,
        amount,
        recipient,
      },
      status: "PENDING",
    };

    const result = await ember.executeSwap(action);

    res.json({
      success: true,
      action,
      result,
    });
  } catch (error) {
    console.error("[Agent Swap] Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Agent swap failed",
    });
  }
});

export default router;
