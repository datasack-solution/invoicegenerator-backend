// import { Request, Response } from "express";
// import { InvoiceService } from "../services/invoice.service";
// import { InvoiceComponent } from "../models/invoice.model";

// /* ============================================================
//    Helpers
// ============================================================ */

// const isValidMonth = (month: number) => month >= 1 && month <= 12;

// const isValidYear = (year: number) => year >= 2000 && year <= 2100;

// const validateExtraComponents = (components: InvoiceComponent[]) => {
//   for (const comp of components) {
//     if (!comp.key || !comp.label) {
//       throw new Error("Component key and label are required");
//     }
//     if (!["earning", "deduction"].includes(comp.type)) {
//       throw new Error(`Invalid component type: ${comp.type}`);
//     }
//     if (typeof comp.amount !== "number" || comp.amount < 0) {
//       throw new Error(`Invalid amount for component ${comp.label}`);
//     }
//   }
// };

// /* ============================================================
//    Controller
// ============================================================ */

// export class InvoiceController {
//   /**
//    * POST /api/invoices/generate
//    */
//   static async generateInvoice(req: Request, res: Response) {
//     try {
//       const { iqamaNo, month, year, extraComponents } = req.body;

//       if (!iqamaNo) {
//         return res.status(400).json({ message: "iqamaNo is required" });
//       }

//       if (!isValidMonth(month) || !isValidYear(year)) {
//         return res.status(400).json({ message: "Invalid month or year" });
//       }

//       if (extraComponents) {
//         validateExtraComponents(extraComponents);
//       }

//       const invoice = await InvoiceService.generateInvoice({
//         iqamaNo,
//         month,
//         year,
//         extraComponents
//       });

//       return res.status(201).json({
//         success: true,
//         data: invoice
//       });
//     } catch (error: any) {
//       return res.status(400).json({
//         success: false,
//         message: error.message || "Failed to generate invoice"
//       });
//     }
//   }

//   /**
//    * GET /api/invoices/latest?iqamaNo=&month=&year=
//    */
//   static async getLatestInvoice(req: Request, res: Response) {
//     try {
//       const iqamaNo = req.query.iqamaNo as string;
//       const month = Number(req.query.month);
//       const year = Number(req.query.year);

//       if (!iqamaNo || !isValidMonth(month) || !isValidYear(year)) {
//         return res.status(400).json({ message: "Invalid query parameters" });
//       }

//       const invoice = await InvoiceService.getLatestInvoice(
//         iqamaNo,
//         month,
//         year
//       );

//       if (!invoice) {
//         return res.status(404).json({ message: "Invoice not found" });
//       }

//       return res.status(200).json({
//         success: true,
//         data: invoice
//       });
//     } catch (error: any) {
//       return res.status(500).json({
//         success: false,
//         message: error.message || "Failed to fetch invoice"
//       });
//     }
//   }

//   /**
//    * GET /api/invoices/history?iqamaNo=&month=&year=
//    */
//   static async getInvoiceHistory(req: Request, res: Response) {
//     try {
//       const iqamaNo = req.query.iqamaNo as string;
//       const month = Number(req.query.month);
//       const year = Number(req.query.year);

//       if (!iqamaNo || !isValidMonth(month) || !isValidYear(year)) {
//         return res.status(400).json({ message: "Invalid query parameters" });
//       }

//       const invoices = await InvoiceService.getInvoiceHistory(
//         iqamaNo,
//         month,
//         year
//       );

//       return res.status(200).json({
//         success: true,
//         data: invoices
//       });
//     } catch (error: any) {
//       return res.status(500).json({
//         success: false,
//         message: error.message || "Failed to fetch invoice history"
//       });
//     }
//   }

//   /**
//    * GET /api/invoices/employee/:iqamaNo
//    */
//   static async getInvoicesForEmployee(req: Request, res: Response) {
//     try {
//       const { iqamaNo } = req.params;

//       if (!iqamaNo) {
//         return res.status(400).json({ message: "iqamaNo is required" });
//       }

//       const invoices = await InvoiceService.getInvoicesForEmployee(iqamaNo);

//       return res.status(200).json({
//         success: true,
//         data: invoices
//       });
//     } catch (error: any) {
//       return res.status(500).json({
//         success: false,
//         message: error.message || "Failed to fetch invoices"
//       });
//     }
//   }

//     /**
//    * POST /api/invoices/bulk-generate
//    */
//   static async bulkGenerateInvoices(req: Request, res: Response) {
//     try {
//       const { iqamaNos, month, year, extraComponentsMap } = req.body;

//       if (!Array.isArray(iqamaNos) || iqamaNos.length === 0) {
//         return res.status(400).json({
//           message: "iqamaNos must be a non-empty array"
//         });
//       }

//       if (month < 1 || month > 12 || year < 2000) {
//         return res.status(400).json({
//           message: "Invalid month or year"
//         });
//       }

//       const report = await InvoiceService.bulkGenerateInvoices({
//         iqamaNos,
//         month,
//         year,
//         extraComponentsMap
//       });

//       return res.status(201).json({
//         success: true,
//         data: report
//       });
//     } catch (error: any) {
//       return res.status(500).json({
//         success: false,
//         message: error.message || "Bulk generation failed"
//       });
//     }
//   }

// }


import { Request, Response } from "express";
import { InvoiceService } from "../services/invoice.service";
import moment from "moment";
import { InvoiceComponent } from "../models/invoice.model";

/* ============================================================
   Helpers
============================================================ */

const isValidMonthYear = (monthYear: string): boolean => {
  // Expected format: "January-2026"
  return /^[A-Za-z]+-\d{4}$/.test(monthYear);
};

const validateExtraComponents = (components: InvoiceComponent[]) => {
  for (const comp of components) {
    if (!comp.key || !comp.label) {
      throw new Error("Component key and label are required");
    }

    if (!["earning", "deduction"].includes(comp.type)) {
      throw new Error(`Invalid component type: ${comp.type}`);
    }

    if (typeof comp.amount !== "number" || comp.amount < 0) {
      throw new Error(
        `Invalid amount for component "${comp.label}"`
      );
    }
  }
};

/* ============================================================
   Controller
============================================================ */

export class InvoiceController {
  /**
   * POST /api/invoices/generate
   */
  static async generateInvoice(req: Request, res: Response) {
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

      const invoice = await InvoiceService.generateInvoice({
        companyId: company as string,
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
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Invoice generation failed"
      });
    }
  }

  /**
   * POST /api/invoices/bulk-generate
   */
  static async bulkGenerateInvoices(req: Request, res: Response) {
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

      const report = await InvoiceService.bulkGenerateInvoices({
        companyId: company as string,
        iqamaNos,
        monthYear,
        extraComponentsMap,
        remarks
      });

      return res.status(201).json({
        success: true,
        data: report
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Bulk invoice generation failed"
      });
    }
  }


  /**
 * DELETE /api/invoices/delete-invoice
 */
  static async deleteInvoice(req: Request, res: Response) {
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

      const report = await InvoiceService.deleteInvoice({
        companyId: company as string,
        iqamaNo,
        monthYear,
      });

      return res.status(200).json(report);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "delete invoice failed"
      });
    }
  }

  /**
   * GET /api/invoices/latest?iqamaNo=&monthYear=&company=
   */
  static async getLatestInvoice(req: Request, res: Response) {
    try {
      const iqamaNo = req.query.iqamaNo as string;
      const monthYear = req.query.monthYear as string;
      const company = req.query.company as string;

      if (!company) {
        return res.status(400).json({ message: "Company parameter is required" });
      }

      if (!iqamaNo || !monthYear || !isValidMonthYear(monthYear)) {
        return res.status(400).json({
          message: "Invalid iqamaNo or monthYear"
        });
      }

      const invoice = await InvoiceService.getLatestInvoice(
        company,
        iqamaNo,
        monthYear
      );

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch invoice"
      });
    }
  }

  /**
   * GET /api/invoices/history?iqamaNo=&monthYear=&company=
   */
  static async getInvoiceHistory(req: Request, res: Response) {
    try {
      const iqamaNo = req.query.iqamaNo as string;
      const monthYear = req.query.monthYear as string;
      const company = req.query.company as string;

      if (!company) {
        return res.status(400).json({ message: "Company parameter is required" });
      }

      if (!iqamaNo || !monthYear || !isValidMonthYear(monthYear)) {
        return res.status(400).json({
          message: "Invalid iqamaNo or monthYear"
        });
      }

      const invoices = await InvoiceService.getInvoiceHistory(
        company,
        iqamaNo,
        monthYear
      );

      return res.status(200).json({
        success: true,
        data: invoices
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch invoice history"
      });
    }
  }

  /**
   * GET /api/invoices/employee/:iqamaNo?company=
   */
  static async getInvoicesForEmployee(req: Request, res: Response) {
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

      const invoices = await InvoiceService.getInvoicesForEmployee(
        company as string,
        iqamaNo
      );

      return res.status(200).json({
        success: true,
        data: invoices
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch invoices"
      });
    }
  }

  /**
   * POST /api/invoices/finalize-past
   * Manually trigger finalization of all past invoices for a company
   */
  static async finalizePastInvoices(req: Request, res: Response) {
    try {
      const { company } = req.query;

      if (!company) {
        return res.status(400).json({ message: "Company parameter is required" });
      }

      const result = await InvoiceService.manuallyFinalizePastInvoices(company as string);

      return res.status(200).json({
        success: result.success,
        message: result.message,
        data: {
          finalizedCount: result.finalizedCount,
          monthsFinalized: result.monthsFinalized
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to finalize past invoices"
      });
    }
  }

  /**
   * GET /api/invoices/finalization-stats?company=
   * Get statistics about invoice finalization status for a company
   */
  static async getFinalizationStats(req: Request, res: Response) {
    try {
      const { company } = req.query;

      if (!company) {
        return res.status(400).json({ message: "Company parameter is required" });
      }

      const stats = await InvoiceService.getFinalizationStats(company as string);

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch finalization stats"
      });
    }
  }

  /**
   * GET /api/invoices/invoice-generated-status-all?company=&monthYear=
   * Get invoice generation status for all employees in a company for a specific month
   */
  static async getInvoiceGeneratedStatusAll(req: Request, res: Response) {
    try {
      const { company, monthYear } = req.query;

      if (!company) {
        return res.status(400).json({ message: "Company parameter is required" });
      }

      // Use current month if monthYear not provided
      const targetMonthYear = monthYear as string || moment().format('MMMM-YYYY');

      const statusMap = await InvoiceService.getInvoiceStatusForAllEmployees(
        company as string, 
        targetMonthYear
      );

      return res.status(200).json({
        success: true,
        statusMap,
        monthYear: targetMonthYear,
        message: `Invoice status for ${targetMonthYear}`
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch invoice status"
      });
    }
  }
}
