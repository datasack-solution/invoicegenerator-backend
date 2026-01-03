import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller";

const router = Router();

/* ============================================================
   Invoice Generation
============================================================ */

/**
 * Generate single invoice
 * POST /api/invoices/generate
 */
router.post(
  "/generate",
  InvoiceController.generateInvoice
);

/**
 * Bulk invoice generation
 * POST /api/invoices/bulk-generate
 */
router.post(
  "/bulk-generate",
  InvoiceController.bulkGenerateInvoices
);

/* ============================================================
   Fetch Invoices
============================================================ */

/**
 * Get latest invoice for a month
 * GET /api/invoices/latest?iqamaNo=&monthYear=
 */
router.get(
  "/latest",
  InvoiceController.getLatestInvoice
);

import moment from "moment";
import { EmployeeModel } from "../models/employee.model";
import { InvoiceService } from "../services/invoice.service";
import { OPEN_ENDED_DATE } from "../services/employeeConfig.service";
import { AttendanceService } from "../services/attendance.service";
/**
 * Get invoice generated status for all active employees (current month)
 */
router.get(
  "/invoice-generated-status-all",
  async (req, res, next) => {
    try {
      const monthYear = moment().format("MMMM-YYYY");

      // 1. Get all active employees
      const employees = await EmployeeModel.find(
        {
          status: "active",
          toDate: OPEN_ENDED_DATE,
        },
        {
          iqamaNo: 1,
        }
      ).lean();

      // 2. Check invoice status in parallel
      const results = await Promise.all(
        employees.map(async (emp) => {
          const invoice = await InvoiceService.getLatestInvoice(
            emp.iqamaNo,
            monthYear
          );
          const attendanceExists = await AttendanceService.checkAttendanceExists(emp.iqamaNo, monthYear);
          return {
            iqamaNo: emp.iqamaNo,
            generated: !!invoice,
            attendanceExist: !!attendanceExists
          };
        })
      );

      // 3. Convert to map for frontend efficiency
      const statusMap: Record<string, {invoiceExist: boolean, attendanceExist:boolean}> = {};
      results.forEach(r => {
        statusMap[String(r.iqamaNo)] = { invoiceExist: r.generated, attendanceExist: r.attendanceExist};
      });

      return res.status(200).json({
        success: true,
        monthYear,
        totalEmployees: employees.length,
        statusMap,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get invoice history for a month
 * GET /api/invoices/history?iqamaNo=&monthYear=
 */
router.get(
  "/history",
  InvoiceController.getInvoiceHistory
);

/**
 * Get all invoices for an employee
 * GET /api/invoices/employee/:iqamaNo
 */
router.get(
  "/employee/:iqamaNo",
  InvoiceController.getInvoicesForEmployee
);

/* ============================================================
   Invoice Finalization
============================================================ */

/**
 * Manually finalize all past invoices
 * POST /api/invoices/finalize-past
 */
router.post(
  "/finalize-past",
  InvoiceController.finalizePastInvoices
);

/**
 * Get finalization statistics
 * GET /api/invoices/finalization-stats
 */
router.get(
  "/finalization-stats",
  InvoiceController.getFinalizationStats
);

export default router;
