"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employeeConfig_controller_1 = require("../controllers/employeeConfig.controller");
const router = (0, express_1.Router)();
// Create new config (will close previous open-ended config if exists)
router.post("/", employeeConfig_controller_1.createEmployeeConfigController);
// Update existing config (correction)
router.patch("/:id", employeeConfig_controller_1.updateEmployeeConfigController);
// Recreate (create new config and close previous)
router.post("/recreate", employeeConfig_controller_1.recreateEmployeeConfigController);
// Get all config entries for an employee by iqamaNo (history)
router.get("/iqama/:iqamaNo", employeeConfig_controller_1.getEmployeeByIqamaController);
// Get a single config by its document _id
router.get("/id/:id", employeeConfig_controller_1.getEmployeeByIdController);
// Get all latest employees (open-ended configs)
router.get("/", employeeConfig_controller_1.getAllEmployeesController);
// Get employees valid for a specific period (month/year)
router.get("/period", employeeConfig_controller_1.getEmployeesForPeriodController);
// Delete the latest config for an iqamaNo and reopen previous
router.delete("/iqama/:iqamaNo", employeeConfig_controller_1.deleteLatestByIqamaController);
exports.default = router;
