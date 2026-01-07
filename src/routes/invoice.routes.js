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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const moment_1 = __importDefault(require("moment"));
const employee_model_1 = require("../models/employee.model");
const invoice_service_1 = require("../services/invoice.service");
const employeeConfig_service_1 = require("../services/employeeConfig.service");
const attendance_service_1 = require("../services/attendance.service");
const router = (0, express_1.Router)();
/* ============================================================
   Invoice Generation
============================================================ */
/**
 * Generate single invoice
 * POST /api/invoices/generate
 */
router.post("/generate", invoice_controller_1.InvoiceController.generateInvoice);
/**
 * Bulk invoice generation
 * POST /api/invoices/bulk-generate
 */
router.post("/bulk-generate", invoice_controller_1.InvoiceController.bulkGenerateInvoices);
/* ============================================================
   Fetch Invoices
============================================================ */
/**
 * Get latest invoice for a month
 * GET /api/invoices/latest?iqamaNo=&monthYear=
 */
router.get("/latest", invoice_controller_1.InvoiceController.getLatestInvoice);
/**
 * Get invoice generated status for all active employees (current month)
 */
router.get("/invoice-generated-status-all", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const company = req.query.company;
    try {
        const monthYear = (0, moment_1.default)().format("MMMM-YYYY");
        // 1. Get all active employees
        const employees = yield employee_model_1.EmployeeModel.find({
            status: "active",
            toDate: employeeConfig_service_1.OPEN_ENDED_DATE,
            companyId: company
        }, {
            iqamaNo: 1,
            companyId: 1
        }).lean();
        // 2. Check invoice status in parallel
        const results = yield Promise.all(employees.map((emp) => __awaiter(void 0, void 0, void 0, function* () {
            const invoice = yield invoice_service_1.InvoiceService.getLatestInvoice(company, emp.iqamaNo, monthYear);
            const attendanceExists = yield attendance_service_1.AttendanceService.checkAttendanceExists(company, emp.iqamaNo, monthYear);
            return {
                iqamaNo: emp.iqamaNo,
                generated: !!invoice,
                attendanceExist: !!attendanceExists,
                lastGeneratedAt: invoice ? invoice === null || invoice === void 0 ? void 0 : invoice.updatedAt : null
            };
        })));
        // 3. Convert to map for frontend efficiency
        const statusMap = {};
        results.forEach(r => {
            statusMap[String(r.iqamaNo)] = { invoiceExist: r.generated, attendanceExist: r.attendanceExist, lastGeneratedAt: r.lastGeneratedAt };
        });
        return res.status(200).json({
            success: true,
            monthYear,
            totalEmployees: employees.length,
            statusMap,
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * Get invoice history for a month
 * GET /api/invoices/history?iqamaNo=&monthYear=
 */
router.get("/history", invoice_controller_1.InvoiceController.getInvoiceHistory);
/**
 * Get all invoices for an employee
 * GET /api/invoices/employee/:iqamaNo
 */
router.get("/employee/:iqamaNo", invoice_controller_1.InvoiceController.getInvoicesForEmployee);
/* ============================================================
   Invoice Finalization
============================================================ */
/**
 * Manually finalize all past invoices
 * POST /api/invoices/finalize-past
 */
router.post("/finalize-past", invoice_controller_1.InvoiceController.finalizePastInvoices);
/**
 * Get finalization statistics
 * GET /api/invoices/finalization-stats
 */
router.get("/finalization-stats", invoice_controller_1.InvoiceController.getFinalizationStats);
/* ============================================================
   Invoice Deletion
============================================================ */
/**
 * Delete invoice (current month only)
 * DELETE /api/invoices/delete-invoice
 */
router.delete("/delete-invoice", invoice_controller_1.InvoiceController.deleteInvoice);
exports.default = router;
