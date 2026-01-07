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
exports.deleteFixedSalaryController = exports.updateFixedSalaryController = exports.getFixedSalaryController = exports.createFixedSalaryController = void 0;
const fixedSalary_service_1 = require("../services/fixedSalary.service");
const createFixedSalaryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: "Company parameter is required" });
        }
        const payloadWithCompany = Object.assign(Object.assign({}, payload), { companyId: company });
        const created = yield (0, fixedSalary_service_1.createFixedSalary)(payloadWithCompany);
        return res.status(201).json({ message: "Created", data: created });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.createFixedSalaryController = createFixedSalaryController;
const getFixedSalaryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: "Company parameter is required" });
        }
        const fixedSalary = yield (0, fixedSalary_service_1.getFixedSalary)(company);
        return res.status(200).json({ message: "Retrieved", data: fixedSalary });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.getFixedSalaryController = getFixedSalaryController;
const updateFixedSalaryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const changes = req.body;
        const updated = yield (0, fixedSalary_service_1.updateFixedSalary)(id, changes);
        if (!updated)
            return res.status(404).json({ message: "Not found" });
        return res.status(200).json({ message: "Updated", data: updated });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.updateFixedSalaryController = updateFixedSalaryController;
const deleteFixedSalaryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleted = yield (0, fixedSalary_service_1.deleteFixedSalary)(id);
        if (!deleted)
            return res.status(404).json({ message: "Not found" });
        return res.status(200).json({ message: "Deleted" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
});
exports.deleteFixedSalaryController = deleteFixedSalaryController;
