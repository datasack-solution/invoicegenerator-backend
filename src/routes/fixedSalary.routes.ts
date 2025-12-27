import { Router } from "express";
import { createFixedSalaryController, updateFixedSalaryController, deleteFixedSalaryController } from "../controllers/fixedSalary.controller";

const router = Router();

router.post("/", createFixedSalaryController);
router.put("/:id", updateFixedSalaryController);
router.delete("/:id", deleteFixedSalaryController);

export default router;
