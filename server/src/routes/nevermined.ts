import { Router, Request, Response } from "express";
import { neverminedService } from "../services/nevermined/nevermined.service.js";

const router = Router();

//handles the collabland api token creation in .env
const initializeNevermined = async (_req: Request, res: Response) => {
  console.log("Initializing Nevermined SDK ...");

  res.status(200).json({
    message: "Nevermined SDK server configuration",
    info: neverminedService(),
  });
};

router.get("/init", initializeNevermined);

export default router;
