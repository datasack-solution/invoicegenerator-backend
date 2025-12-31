import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, (_req, res) => {
  res.json({ message: "Authorized" });
});

export default router;