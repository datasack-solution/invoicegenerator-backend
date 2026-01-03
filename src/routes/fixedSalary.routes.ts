import { Router } from "express";
import { createFixedSalaryController, updateFixedSalaryController, deleteFixedSalaryController, getFixedSalaryController } from "../controllers/fixedSalary.controller";

const router = Router();

router.post("/", createFixedSalaryController);
router.get("/", getFixedSalaryController)
router.put("/:id", updateFixedSalaryController);
router.delete("/:id", deleteFixedSalaryController);

export default router;
