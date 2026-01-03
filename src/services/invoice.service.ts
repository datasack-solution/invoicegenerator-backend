import { InvoiceModel, InvoiceComponent } from "../models/invoice.model";
import { EmployeeModel } from "../models/employee.model";
import { AttendanceModel } from "../models/attendance.model";
import moment from "moment";
import { FixedSalaryModel } from "../models/fixedSalary.model";

/* ============================================================
   Utilities
============================================================ */

const sum = (values: (number | undefined)[]) =>
  values.reduce((a, b) => (a ?? 0) + (b ?? 0), 0);

/**
 * Attendance proration
 */
const calculateProrationRatio = (
  totalWorkingDays: number,
  daysPresent: number
): number => {
  if (totalWorkingDays <= 0) {
    throw new Error("Invalid totalWorkingDays in attendance");
  }

  if (daysPresent < 0 || daysPresent > totalWorkingDays) {
    throw new Error("Invalid daysPresent in attendance");
  }

  return Number((daysPresent / totalWorkingDays).toFixed(4));
};

/**
 * Invoice number generator
 */
const generateInvoiceNo = (
  iqamaNo: string,
  monthYear: string,
  version: number
) => {
  return `INV-${monthYear}-${iqamaNo}-${version}`;
};

/* ============================================================
   Calculations
============================================================ */

const calculateTotals = (
  baseSalary: { basic: number; housing: number; transport: number },
  fixedCosts: Record<string, number | undefined>,
  extraComponents: InvoiceComponent[]
) => {
  const extraEarnings = sum(
    extraComponents
      .filter(c => c.type === "earning")
      .map(c => c.amount)
  ) || 0;

  const extraDeductions = sum(
    extraComponents
      .filter(c => c.type === "deduction")
      .map(c => c.amount)
  ) || 0;

    const totalFixedCost = sum(Object.values(fixedCosts)) || 0;


  const grossEarnings =
    baseSalary.basic +
    baseSalary.housing +
    baseSalary.transport +
    totalFixedCost +
    extraEarnings;


//   const totalDeductions = totalFixedCost + extraDeductions;
const totalDeductions = 0

  const netPayable = grossEarnings;

  return {
    grossEarnings,
    totalDeductions,
    netPayable
  };
};

/* ============================================================
   Invoice Service
============================================================ */

export class InvoiceService {
  /* ==========================================================
     Finalize Past Invoices (Efficient Batch Update)
  ========================================================== */

  /**
   * Finalize all past invoices that are still marked as non-final
   * This runs efficiently using a single MongoDB update query
   */
  private static async finalizePastInvoices(): Promise<void> {
    try {
      const now = moment();
      const currentMonthYear = now.format("MMMM-YYYY");
      
      // Get all unique month-years that are before current month
      const pastMonthYears = await InvoiceModel.distinct("monthYear", {
        isFinal: false
      });
      
      const pastMonths = pastMonthYears.filter(monthYear => {
        const invoiceMonth = moment(monthYear, "MMMM-YYYY");
        return invoiceMonth.isBefore(now, "month");
      });
      
      if (pastMonths.length === 0) {
        return; // No past invoices to finalize
      }
      
      // Bulk update all past invoices to final in a single query
      const result = await InvoiceModel.updateMany(
        {
          monthYear: { $in: pastMonths },
          isFinal: false
        },
        {
          $set: {
            isFinal: true,
            finalizedAt: now.toDate()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Finalized ${result.modifiedCount} past invoices for months: ${pastMonths.join(", ")}`);
      }
    } catch (error) {
      console.error("❌ Error finalizing past invoices:", error);
      // Don't throw error to avoid breaking invoice generation
    }
  }


static async generateInvoice(params: {
  iqamaNo: string;
  monthYear: string; // "January-2026"
  extraComponents?: InvoiceComponent[];
}) {
  const { iqamaNo, monthYear } = params;
  const extraComponents = params.extraComponents ?? [];

  // 🔄 Auto-finalize past invoices (efficient batch operation)
  await InvoiceService.finalizePastInvoices();

  const now = moment();
  const invoiceMonth = moment(monthYear, "MMMM-YYYY");
  const editable = invoiceMonth.isSameOrAfter(now, "month"); //present and future months we can still re-generate invoice and can replace it. but past month we cannot do it. 

  /* --------------------------------------------
     0. Attendance (MANDATORY)
  --------------------------------------------- */

  const attendance = await AttendanceModel.findOne({
    iqamaNo,
    monthYear
  });

  if (!attendance) {
    throw new Error(
      `Attendance not found for ${iqamaNo} - ${monthYear}`
    );
  }

  const prorationRatio = calculateProrationRatio(
    attendance.totalWorkingDays,
    attendance.daysPresent
  );

  /* --------------------------------------------
     1. Existing invoice (replace / lock)
  --------------------------------------------- */

  const existingInvoice = await InvoiceModel.findOne({
    iqamaNo,
    monthYear
  });

  if (existingInvoice && !editable) {
    // 🔒 Locked → return existing
    return existingInvoice;
  }

  /* --------------------------------------------
     2. Employee configuration (MATCH MONTH)
  --------------------------------------------- */

  const monthStart = invoiceMonth.startOf("month").add(1,'day').toDate();
  const monthEnd = invoiceMonth.endOf("month").toDate();

  const employeeConfig = await EmployeeModel.findOne({
    iqamaNo,
    fromDate: { $lte: monthEnd },
    toDate: { $gte: monthStart }
  });

  if (!employeeConfig) {
    throw new Error(
      `Employee configuration not found for ${iqamaNo} - ${monthYear}`
    );
  }

  /* --------------------------------------------
     3. Version & Invoice No
  --------------------------------------------- */

  const version = existingInvoice ? existingInvoice.version : 1;

  const invoiceNo = generateInvoiceNo(
    iqamaNo,
    monthYear,
    version
  );

  /* --------------------------------------------
     4. Salary snapshot (PRORATED)
  --------------------------------------------- */

  const baseSalary = {
    basic: Number((employeeConfig.basic * prorationRatio).toFixed(2)),
    housing: Number((employeeConfig.housing * prorationRatio).toFixed(2)),
    transport: Number((employeeConfig.transport * prorationRatio).toFixed(2))
  };

  const fixedForUpdate = await FixedSalaryModel.findOne().lean();

  if (!fixedForUpdate){
     throw new Error(
      "Fixed salary configuration not found"
    ); 
  }
  

  const fixedCosts = {
    medicalInsurance: fixedForUpdate.medicalInsurance,
    iqamaRenewalCost: fixedForUpdate.iqamaRenewalCost,
    gosi: fixedForUpdate.gosi,
    fix: fixedForUpdate.fix,
    saudization: fixedForUpdate.saudization,
    serviceCharge: fixedForUpdate.serviceCharge,
    exitFee: fixedForUpdate.exitFee,
    exitReentryFee: fixedForUpdate.exitReentryFee
  };

  const totals = calculateTotals(
    baseSalary,
    fixedCosts,
    extraComponents
  );

  /* --------------------------------------------
     5. Replace OR Create (ATOMIC)
  --------------------------------------------- */

  const payload = {
    invoiceNo,

    iqamaNo,
    employeeName: employeeConfig.name,
    designation: employeeConfig.designation,

    monthYear,
    attendance,
    version,
    isFinal: !editable,

    attendanceSnapshot: {
      totalWorkingDays: attendance.totalWorkingDays,
      daysPresent: attendance.daysPresent,
      prorationRatio
    },

    baseSalary,
    fixedCosts,
    extraComponents,

    grossEarnings: totals.grossEarnings,
    totalDeductions: totals.totalDeductions,
    netPayable: totals.netPayable,

    generatedAt: now.toDate(),
    replacedAt: existingInvoice ? now.toDate() : undefined
  };

  if (existingInvoice) {
    // 🔁 REPLACE (NO DUPLICATE KEY)
    return await InvoiceModel.findByIdAndUpdate(
      existingInvoice._id,
      { $set: payload },
      { new: true }
    );
  }

  console.log("payload: ",payload)

  // ➕ CREATE (FIRST TIME)
  return await InvoiceModel.create(payload);
}


  /* ==========================================================
     Bulk Invoice Generation
  ========================================================== */

  static async bulkGenerateInvoices(params: {
    iqamaNos: string[];
    monthYear: string;
    extraComponentsMap?: Record<string, InvoiceComponent[]>;
  }) {
    const { iqamaNos, monthYear } = params;
    const extraComponentsMap = params.extraComponentsMap ?? {};

    // 🔄 Auto-finalize past invoices (efficient batch operation)
    await InvoiceService.finalizePastInvoices();

    const results: {
      iqamaNo: string;
      success: boolean;
      invoice?: any;
      error?: string;
    }[] = [];

    for (const iqamaNo of iqamaNos) {
      try {
        const invoice = await InvoiceService.generateInvoice({
          iqamaNo,
          monthYear,
          extraComponents: extraComponentsMap[iqamaNo] || []
        });

        results.push({
          iqamaNo,
          success: true,
          invoice
        });
      } catch (error: any) {
        results.push({
          iqamaNo,
          success: false,
          error: error.message || "Invoice generation failed"
        });
      }
    }

    return {
      monthYear,
      totalEmployees: iqamaNos.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      results
    };
  }

  /* ==========================================================
     Read APIs
  ========================================================== */

  /**
   * Manually trigger finalization of past invoices
   * Can be called from admin endpoints or maintenance operations
   */
  static async manuallyFinalizePastInvoices(): Promise<{
    success: boolean;
    message: string;
    finalizedCount: number;
    monthsFinalized: string[];
  }> {
    try {
      const now = moment();
      
      // Get all unique month-years that are before current month and not final
      const pastMonthYears = await InvoiceModel.distinct("monthYear", {
        isFinal: false
      });
      
      const pastMonths = pastMonthYears.filter(monthYear => {
        const invoiceMonth = moment(monthYear, "MMMM-YYYY");
        return invoiceMonth.isBefore(now, "month");
      });
      
      if (pastMonths.length === 0) {
        return {
          success: true,
          message: "No past invoices found to finalize",
          finalizedCount: 0,
          monthsFinalized: []
        };
      }
      
      // Bulk update all past invoices to final
      const result = await InvoiceModel.updateMany(
        {
          monthYear: { $in: pastMonths },
          isFinal: false
        },
        {
          $set: {
            isFinal: true,
            finalizedAt: now.toDate()
          }
        }
      );
      
      return {
        success: true,
        message: `Successfully finalized ${result.modifiedCount} past invoices`,
        finalizedCount: result.modifiedCount,
        monthsFinalized: pastMonths
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error finalizing past invoices: ${error.message}`,
        finalizedCount: 0,
        monthsFinalized: []
      };
    }
  }

  /**
   * Get statistics about invoice finalization status
   */
  // static async getFinalizationStats(): Promise<{
  //   totalInvoices: number;
  //   finalizedInvoices: number;
  //   pendingFinalization: number;
  //   pastMonthsPending: string[];
  //   currentMonthInvoices: number;
  //   futureMonthInvoices: number;
  // }> {
  //   const now = moment();
  //   const currentMonthYear = now.format("MMMM-YYYY");
    
  //   const [
  //     totalInvoices,
  //     finalizedInvoices,
  //     pendingFinalization,
  //     allMonthYears
  //   ] = await Promise.all([
  //     InvoiceModel.countDocuments(),
  //     InvoiceModel.countDocuments({ isFinal: true }),
  //     InvoiceModel.countDocuments({ isFinal: false,  monthYear: currentMonthYear }),
  //     InvoiceModel.distinct("monthYear") 
  //   ]);
    
  //   // Categorize months
  //   const pastMonthsPending: string[] = [];
  //   let currentMonthInvoices = 0;
  //   let futureMonthInvoices = 0;
    
  //   for (const monthYear of allMonthYears) {
  //     const invoiceMonth = moment(monthYear, "MMMM-YYYY");
      
  //     if (invoiceMonth.isBefore(now, "month")) {
  //       // Check if this past month has pending invoices
  //       const pendingCount = await InvoiceModel.countDocuments({
  //         monthYear,
  //         isFinal: false
  //       });
  //       if (pendingCount > 0) {
  //         pastMonthsPending.push(monthYear);
  //       }
  //     } else if (invoiceMonth.isSame(now, "month")) {
  //       currentMonthInvoices = await InvoiceModel.countDocuments({ monthYear });
  //     } else {
  //       futureMonthInvoices += await InvoiceModel.countDocuments({ monthYear });
  //     }
  //   }
    
  //   return {
  //     totalInvoices,
  //     finalizedInvoices,
  //     pendingFinalization,
  //     pastMonthsPending,
  //     currentMonthInvoices,
  //     futureMonthInvoices
  //   };
  // }


  static async getFinalizationStats(): Promise<{
  totalInvoices: number;
  finalizedInvoices: number;
  pendingFinalization: number;
  pastMonthsPending: string[];
  currentMonthInvoices: number;
  futureMonthInvoices: number;
}> {
  const now = moment().startOf("month");

  const [
    totalInvoices,
    finalizedInvoices,
    allMonthYears,
  ] = await Promise.all([
    InvoiceModel.countDocuments(),
    InvoiceModel.countDocuments({ isFinal: true }),
    InvoiceModel.distinct("monthYear"),
  ]);

  let pendingFinalization = 0;
  const pastMonthsPending: string[] = [];
  let currentMonthInvoices = 0;
  let futureMonthInvoices = 0;

  for (const monthYear of allMonthYears) {
    const invoiceMonth = moment(monthYear, "MMMM-YYYY");

    if (invoiceMonth.isBefore(now, "month")) {
      // ✅ PAST MONTH
      const pendingCount = await InvoiceModel.countDocuments({
        monthYear,
        isFinal: false,
      });

      if (pendingCount > 0) {
        pastMonthsPending.push(monthYear);
        pendingFinalization += pendingCount; // ✅ FIXED
      }
    } 
    else if (invoiceMonth.isSame(now, "month")) {
      // CURRENT MONTH
      currentMonthInvoices += await InvoiceModel.countDocuments({ monthYear });
    } 
    else {
      // FUTURE MONTH
      futureMonthInvoices += await InvoiceModel.countDocuments({ monthYear });
    }
  }

  return {
    totalInvoices,
    finalizedInvoices,
    pendingFinalization,     // ✅ NOW CORRECT
    pastMonthsPending,
    currentMonthInvoices,
    futureMonthInvoices,
  };
}



  static async getLatestInvoice(
    iqamaNo: string,
    monthYear: string
  ) {
    return InvoiceModel
      .findOne({ iqamaNo, monthYear })
      .sort({ version: -1 });
  }

  static async getInvoiceHistory(
    iqamaNo: string,
    monthYear: string
  ) {
    return InvoiceModel
      .find({ iqamaNo, monthYear })
      .sort({ version: -1 });
  }

  static async getInvoicesForEmployee(iqamaNo: string) {
    return InvoiceModel
      .find({ iqamaNo })
      .sort({ createdAt: -1 });
  }
}
