"use strict";
// import { Request, Response } from "express";
// import { InvoiceService } from "../services/invoice.service";
// import { InvoiceComponent } from "../models/invoice.model";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const invoice_service_1 = require("../services/invoice.service");
const moment_1 = __importDefault(require("moment"));
/* ============================================================
   Helpers
============================================================ */
const isValidMonthYear = (monthYear) => {
    // Expected format: "January-2026"
    return /^[A-Za-z]+-\d{4}$/.test(monthYear);
};
const validateExtraComponents = (components) => {
    for (const comp of components) {
        if (!comp.key || !comp.label) {
            throw new Error("Component key and label are required");
        }
        if (!["earning", "deduction"].includes(comp.type)) {
            throw new Error(`Invalid component type: ${comp.type}`);
        }
        if (typeof comp.amount !== "number" || comp.amount < 0) {
            throw new Error(`Invalid amount for component "${comp.label}"`);
        }
    }
};
/* ============================================================
   Controller
============================================================ */
class InvoiceController {
    /**
     * POST /api/invoices/generate
     */
    static generateInvoice(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { iqamaNo, monthYear, daysPresent, remarks, invoiceRemarks, extraComponents } = req.body;
                const { company } = req.query;
                if (!company) {
                    return res.status(400).json({ message: "Company parameter is required" });
                }
                if (!iqamaNo) {
                    return res
                        .status(400)
                        .json({ message: "iqamaNo is required" });
                }
                if (!monthYear || !isValidMonthYear(monthYear)) {
                    return res
                        .status(400)
                        .json({ message: "Invalid monthYear format" });
                }
                if (!daysPresent) {
                    return res
                        .status(400)
                        .json({ message: "No of present days is required" });
                }
                if (extraComponents) {
                    validateExtraComponents(extraComponents);
                }
                const invoice = yield invoice_service_1.InvoiceService.generateInvoice({
                    companyId: company,
                    iqamaNo,
                    monthYear,
                    daysPresent,
                    remarks,
                    invoiceRemarks, // Add invoice remarks
                    extraComponents
                });
                return res.status(201).json({
                    success: true,
                    data: invoice
                });
            }
            catch (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message || "Invoice generation failed"
                });
            }
        });
    }
    /**
     * POST /api/invoices/bulk-generate
     */
    static bulkGenerateInvoices(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { iqamaNos, monthYear, extraComponentsMap, remarks } = req.body;
                const { company } = req.query;
                if (!company) {
                    return res.status(400).json({ message: "Company parameter is required" });
                }
                if (!Array.isArray(iqamaNos) || iqamaNos.length === 0) {
                    return res.status(400).json({
                        message: "iqamaNos must be a non-empty array"
                    });
                }
                if (!monthYear || !isValidMonthYear(monthYear)) {
                    return res.status(400).json({
                        message: "Invalid monthYear format"
                    });
                }
                const report = yield invoice_service_1.InvoiceService.bulkGenerateInvoices({
                    companyId: company,
                    iqamaNos,
                    monthYear,
                    extraComponentsMap,
                    remarks
                });
                return res.status(201).json({
                    success: true,
                    data: report
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message || "Bulk invoice generation failed"
                });
            }
        });
    }
    /**
   * DELETE /api/invoices/delete-invoice
   */
    static deleteInvoice(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { iqamaNo, monthYear } = req.body;
                const { company } = req.query;
                if (!company) {
                    return res.status(400).json({ message: "Company parameter is required" });
                }
                if (!iqamaNo) {
                    return res.status(400).json({ message: "iqamaNo is required" });
                }
                if (!monthYear || !isValidMonthYear(monthYear)) {
                    return res.status(400).json({
                        message: "Invalid monthYear format"
                    });
                }
                const report = yield invoice_service_1.InvoiceService.deleteInvoice({
                    companyId: company,
                    iqamaNo,
                    monthYear,
                });
                return res.status(200).json(report);
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message || "delete invoice failed"
                });
            }
        });
    }
    /**
     * GET /api/invoices/latest?iqamaNo=&monthYear=&company=
     */
    static getLatestInvoice(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const iqamaNo = req.query.iqamaNo;
                const monthYear = req.query.monthYear;
                const company = req.query.company;
                if (!company) {
                    return res.status(400).json({ message: "Company parameter is required" });
                }
                if (!iqamaNo || !monthYear || !isValidMonthYear(monthYear)) {
                    return res.status(400).json({
                        message: "Invalid iqamaNo or monthYear"
                    });
                }
                const invoice = yield invoice_service_1.InvoiceService.getLatestInvoice(company, iqamaNo, monthYear);
                if (!invoice) {
                    return res.status(404).json({
                        message: "Invoice not found"
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: invoice
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message || "Failed to fetch invoice"
                });
            }
        });
    }
    /**
     * GET /api/invoices/history?iqamaNo=&monthYear=&company=
     */
    static getInvoiceHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const iqamaNo = req.query.iqamaNo;
                const monthYear = req.query.monthYear;
                const company = req.query.company;
                if (!company) {
                    return res.status(400).json({ message: "Company parameter is required" });
                }
                if (!iqamaNo || !monthYear || !isValidMonthYear(monthYear)) {
                    return res.status(400).json({
                        message: "Invalid iqamaNo or monthYear"
                    });
                }
                const invoices = yield invoice_service_1.InvoiceService.getInvoiceHistory(company, iqamaNo, monthYear);
                return res.status(200).json({
                    success: true,
                    data: invoices
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message || "Failed to fetch invoice history"
                });
            }
        });
    }
    /**
     * GET /api/invoices/employee/:iqamaNo?company=
     */
    static getInvoicesForEmployee(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { iqamaNo } = req.params;
                const { company } = req.query;
                if (!company) {
                    return res.status(400).json({ message: "Company parameter is required" });
                }
                if (!iqamaNo) {
                    return res
                        .status(400)
                        .json({ message: "iqamaNo is required" });
                }
                const invoices = yield invoice_service_1.InvoiceService.getInvoicesForEmployee(company, iqamaNo);
                return res.status(200).json({
                    success: true,
                    data: invoices
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message || "Failed to fetch invoices"
                });
            }
        });
    }
    /**
     * POST /api/invoices/finalize-past
     * Manually trigger finalization of all past invoices for a company
     */
    static finalizePastInvoices(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { company } = req.query;
                if (!company) {
                    return res.status(400).json({ message: "Company parameter is required" });
                }
                const result = yield invoice_service_1.InvoiceService.manuallyFinalizePastInvoices(company);
                return res.status(200).json({
                    success: result.success,
                    message: result.message,
                    data: {
                        finalizedCount: result.finalizedCount,
                        monthsFinalized: result.monthsFinalized
                    }
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message || "Failed to finalize past invoices"
                });
            }
        });
    }
    /**
     * GET /api/invoices/finalization-stats?company=
     * Get statistics about invoice finalization status for a company
     */
    static getFinalizationStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { company } = req.query;
                if (!company) {
                    return res.status(400).json({ message: "Company parameter is required" });
                }
                const stats = yield invoice_service_1.InvoiceService.getFinalizationStats(company);
                return res.status(200).json({
                    success: true,
                    data: stats
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message || "Failed to fetch finalization stats"
                });
            }
        });
    }
    /**
     * GET /api/invoices/invoice-generated-status-all?company=&monthYear=
     * Get invoice generation status for all employees in a company for a specific month
     */
    static getInvoiceGeneratedStatusAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { company, monthYear } = req.query;
                if (!company) {
                    return res.status(400).json({ message: "Company parameter is required" });
                }
                // Use current month if monthYear not provided
                const targetMonthYear = monthYear || (0, moment_1.default)().format('MMMM-YYYY');
                const statusMap = yield invoice_service_1.InvoiceService.getInvoiceStatusForAllEmployees(company, targetMonthYear);
                return res.status(200).json({
                    success: true,
                    statusMap,
                    monthYear: targetMonthYear,
                    message: `Invoice status for ${targetMonthYear}`
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message || "Failed to fetch invoice status"
                });
            }
        });
    }
}
exports.InvoiceController = InvoiceController;
