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

export default router;
