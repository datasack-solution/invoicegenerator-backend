import { Router } from "express";
import { healthCheck } from "../controllers/health.controller";
import fixedSalaryRoutes from "./fixedSalary.routes";
import employeeConfigRoutes from "./employeeConfig.routes";

const router = Router();

router.get("/health", healthCheck);
router.use("/fixed-salary", fixedSalaryRoutes);
router.use("/employee-config", employeeConfigRoutes);

export default router;
