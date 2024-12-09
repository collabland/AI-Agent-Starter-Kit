import { NextFunction, Request, Response, Router } from "express";

const router = Router();

//middleware to check that NODE_ENV is only local development
const checkNodeEnv = (_req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "development") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};

//handles the collabland api token creation in .env
const handlePostCollabLand = async (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Collab.Land AI Agent Starter Kit",
    timestamp: new Date().toISOString(),
  });
};

router.get("/collabland", checkNodeEnv, handlePostCollabLand);

export default router;
