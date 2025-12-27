import { Router } from "express";
import {
	createEmployeeConfigController,
	updateEmployeeConfigController,
	recreateEmployeeConfigController,
	getEmployeeByIqamaController,
	getAllEmployeesController,
	getEmployeeByIdController,
	deleteLatestByIqamaController
} from "../controllers/employeeConfig.controller";

const router = Router();

// Create new config (will close previous open-ended config if exists)
router.post("/", createEmployeeConfigController);

// Update existing config (correction)
router.patch("/:id", updateEmployeeConfigController);

// Recreate (create new config and close previous)
router.post("/recreate", recreateEmployeeConfigController);

// Get all config entries for an employee by iqamaNo (history)
router.get("/iqama/:iqamaNo", getEmployeeByIqamaController);

// Get a single config by its document _id
router.get("/id/:id", getEmployeeByIdController);

// Get all latest employees (open-ended configs)
router.get("/", getAllEmployeesController);

// Delete the latest config for an iqamaNo and reopen previous
router.delete("/iqama/:iqamaNo", deleteLatestByIqamaController);

export default router;
