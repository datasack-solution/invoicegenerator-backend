"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const fixedSalary_routes_1 = __importDefault(require("./fixedSalary.routes"));
const employeeConfig_routes_1 = __importDefault(require("./employeeConfig.routes"));
const attendance_routes_1 = __importDefault(require("./attendance.routes"));
const router = (0, express_1.Router)();
router.get("/health", health_controller_1.healthCheck);
router.use("/fixed-salary", fixedSalary_routes_1.default);
router.use("/employee-config", employeeConfig_routes_1.default);
router.use("/attendance", attendance_routes_1.default);
exports.default = router;
