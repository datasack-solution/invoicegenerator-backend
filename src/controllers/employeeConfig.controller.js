"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLatestByIqamaController = exports.getEmployeeByIdController = exports.getEmployeesForPeriodController = exports.getAllEmployeesController = exports.getEmployeeByIqamaController = exports.recreateEmployeeConfigController = exports.updateEmployeeConfigController = exports.createEmployeeConfigController = void 0;
const employeeConfig_service_1 = require("../services/employeeConfig.service");
const createEmployeeConfigController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: "Company parameter is required" });
        }
        const payloadWithCompany = Object.assign(Object.assign({}, payload), { companyId: company });
        const created = yield (0, employeeConfig_service_1.createEmployeeConfig)(payloadWithCompany);
        return res.status(201).json({ message: "Created", data: created });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.createEmployeeConfigController = createEmployeeConfigController;
const updateEmployeeConfigController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const changes = req.body;
        const updated = yield (0, employeeConfig_service_1.updateEmployeeConfig)(id, changes);
        if (!updated)
            return res.status(404).json({ message: "Not found" });
        return res.status(200).json({ message: "Updated", data: updated });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.updateEmployeeConfigController = updateEmployeeConfigController;
const recreateEmployeeConfigController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: "Company parameter is required" });
        }
        const payloadWithCompany = Object.assign(Object.assign({}, payload), { companyId: company });
        const created = yield (0, employeeConfig_service_1.recreateEmployeeConfig)(payloadWithCompany);
        return res.status(201).json({ message: "Recreated", data: created });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.recreateEmployeeConfigController = recreateEmployeeConfigController;
const getEmployeeByIqamaController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNo } = req.params;
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: "Company parameter is required" });
        }
        const data = yield (0, employeeConfig_service_1.getByIqama)(company, iqamaNo);
        return res.status(200).json({ data });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.getEmployeeByIqamaController = getEmployeeByIqamaController;
const getAllEmployeesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: "Company parameter is required" });
        }
        const data = yield (0, employeeConfig_service_1.getAllLatest)(company);
        return res.status(200).json({ data });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.getAllEmployeesController = getAllEmployeesController;
const getEmployeesForPeriodController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { company, monthYear } = req.query;
        if (!company) {
            return res.status(400).json({ message: "Company parameter is required" });
        }
        if (!monthYear) {
            return res.status(400).json({ message: "monthYear parameter is required (format: 'January-2024')" });
        }
        const data = yield (0, employeeConfig_service_1.getEmployeesForPeriod)(company, monthYear);
        return res.status(200).json({ data });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.getEmployeesForPeriodController = getEmployeesForPeriodController;
const getEmployeeByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = yield (0, employeeConfig_service_1.getById)(id);
        if (!data)
            return res.status(404).json({ message: "Not found" });
        return res.status(200).json({ data });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.getEmployeeByIdController = getEmployeeByIdController;
const deleteLatestByIqamaController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNo } = req.params;
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: "Company parameter is required" });
        }
        const result = yield (0, employeeConfig_service_1.deleteLatestByIqama)(company, iqamaNo);
        return res.status(200).json({ message: "Deleted latest config", result });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.deleteLatestByIqamaController = deleteLatestByIqamaController;
