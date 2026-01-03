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

export default router;
