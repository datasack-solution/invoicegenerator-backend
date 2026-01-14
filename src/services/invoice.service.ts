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
  baseSalary: { basic: number; housing: number; transport: number, prorateServiceCharge: number },
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
    (baseSalary.prorateServiceCharge || 0) +
    totalFixedCost +
    extraEarnings;

  //   const totalDeductions = totalFixedCost + extraDeductions;
  const totalDeductions = 0

  const netPayable = grossEarnings;

  // Validate that we don't have NaN values
  if (isNaN(grossEarnings) || isNaN(totalDeductions) || isNaN(netPayable)) {
    throw new Error(`Invalid calculation result: grossEarnings=${grossEarnings}, totalDeductions=${totalDeductions}, netPayable=${netPayable}`);
  }

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
   * Finalize all past invoices that are still marked as non-final for a specific company
   * This runs efficiently using a single MongoDB update query
   */
  private static async finalizePastInvoices(companyId: string): Promise<void> {
    try {
      const now = moment();
      const currentMonthYear = now.format("MMMM-YYYY");

      // Get all unique month-years that are before current month for this company
      const pastMonthYears = await InvoiceModel.distinct("monthYear", {
        companyId,
        isFinal: false
      });

      const pastMonths = pastMonthYears.filter(monthYear => {
        const invoiceMonth = moment(monthYear, "MMMM-YYYY");
        return invoiceMonth.isBefore(now, "month");
      });

      if (pastMonths.length === 0) {
        return; // No past invoices to finalize
      }

      // Bulk update all past invoices to final in a single query for this company
      const result = await InvoiceModel.updateMany(
        {
          companyId,
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
        console.log(`✅ Finalized ${result.modifiedCount} past invoices for company ${companyId} for months: ${pastMonths.join(", ")}`);
      }
    } catch (error) {
      console.error("❌ Error finalizing past invoices:", error);
      // Don't throw error to avoid breaking invoice generation
    }
  }


  static async generateInvoice(params: {
    companyId: string;
    iqamaNo: string;
    monthYear: string; // "January-2026"
    daysPresent: number,
    remarks: string;
    invoiceRemarks?: string; // Add invoice remarks parameter
    extraComponents?: InvoiceComponent[];
  }) {
    const { companyId, iqamaNo, monthYear, daysPresent, remarks, invoiceRemarks } = params;
    const extraComponents = params.extraComponents ?? [];

    if (!companyId) {
      throw new Error("companyId is required");
    }

    // 🔄 Auto-finalize past invoices (efficient batch operation)
    await InvoiceService.finalizePastInvoices(companyId);

    const now = moment();
    const invoiceMonth = moment(monthYear, "MMMM-YYYY");
    const editable = invoiceMonth.isSameOrAfter(now, "month"); //present and future months we can still re-generate invoice and can replace it. but past month we cannot do it. 

    /* --------------------------------------------
       0. Attendance (MANDATORY)
    --------------------------------------------- */

    // const attendance = await AttendanceModel.findOne({
    //   iqamaNo,
    //   monthYear
    // });

    // if (!attendance) {
    //   throw new Error(
    //     `Attendance not found for ${iqamaNo} - ${monthYear}`
    //   );
    // }

    /* --------------------------------------------
     0. Attendance (CREATE OR REUSE)
  --------------------------------------------- */

    const totalWorkingDays = invoiceMonth.daysInMonth();

    const session = await InvoiceModel.db.startSession();
    session.startTransaction();

    /* --------------------------------------------
       1. Existing invoice (replace / lock)
    --------------------------------------------- */

    const existingInvoice = await InvoiceModel.findOne({
      companyId,
      iqamaNo,
      monthYear
    }, null, session);

    if (existingInvoice && !editable) {
      // 🔒 Locked → return existing
      console.log("🔒 Invoice locked for past month, cannot regenerate:", iqamaNo, monthYear);
      return existingInvoice;
    }

    /* --------------------------------------------
       2. Employee configuration (MATCH MONTH)
    --------------------------------------------- */

    const monthStart = invoiceMonth.startOf("month").add(1, 'day').toDate();
    const monthEnd = invoiceMonth.endOf("month").toDate();

    const employeeConfig = await EmployeeModel.findOne({
      companyId,
      iqamaNo,
      fromDate: { $lte: monthEnd },
      toDate: { $gte: monthStart }
    }, null, session);

    if (!employeeConfig) {
      throw new Error(
        `Employee configuration not found for ${iqamaNo} - ${monthYear}`
      );
    }

    /* --------------------------------------------
       3. Version & Invoice No
    --------------------------------------------- */

    const version = existingInvoice ? existingInvoice.version + 1 : 1;

    const invoiceNo = generateInvoiceNo(
      iqamaNo,
      monthYear,
      version
    );


    try {
      let attendance = await AttendanceModel.findOne({
        companyId,
        iqamaNo,
        monthYear
      });

      if (!attendance) {
        attendance = await AttendanceModel.create(
          [{
            companyId,
            iqamaNo,
            monthYear,
            totalWorkingDays,
            daysPresent,
            name: employeeConfig.name,
            remarks,
          }],
          { session }
        ).then(r => r[0]);
      } else if (editable) {
        // 🔁 UPDATE attendance (current / future month)
        attendance.totalWorkingDays = totalWorkingDays;
        attendance.daysPresent = daysPresent;
        attendance.remarks = remarks;

        await attendance.save({ session });
      }

      if (!attendance) {
        throw new Error("Attendance creation failed unexpectedly");
      }

      if (!editable && daysPresent !== undefined) {
        throw new Error(
          "Attendance cannot be modified for past month invoices"
        );
      }


      const prorationRatio = calculateProrationRatio(
        attendance.totalWorkingDays,
        attendance.daysPresent
      );

      // Validate prorationRatio
      if (isNaN(prorationRatio)) {
        throw new Error(`Invalid prorationRatio: totalWorkingDays=${attendance.totalWorkingDays}, daysPresent=${attendance.daysPresent}`);
      }

      /* --------------------------------------------
         4. Salary snapshot (PRORATED)
      --------------------------------------------- */

      const baseSalary = {
        basic: Number(((employeeConfig.basic || 0) * prorationRatio).toFixed(2)),
        housing: Number(((employeeConfig.housing || 0) * prorationRatio).toFixed(2)),
        transport: Number(((employeeConfig.transport || 0) * prorationRatio).toFixed(2)),
        prorateServiceCharge: Number(((employeeConfig.prorateServiceCharge || 0) * prorationRatio).toFixed(2))
      };

      // Validate baseSalary calculations
      if (isNaN(baseSalary.basic) || isNaN(baseSalary.housing) || isNaN(baseSalary.transport) || isNaN(baseSalary.prorateServiceCharge)) {
        throw new Error(`Invalid baseSalary calculation: basic=${baseSalary.basic}, housing=${baseSalary.housing}, transport=${baseSalary.transport}, prorateServiceCharge=${baseSalary.prorateServiceCharge}, prorationRatio=${prorationRatio}`);
      }

      // const fixedForUpdate = await FixedSalaryModel.findOne().lean();

      // if (!fixedForUpdate) {
      //   throw new Error(
      //     "Fixed salary configuration not found"
      //   );
      // }

      const fixedCosts = {
        medicalInsurance: employeeConfig.medicalInsurance || 0,
        iqamaRenewalCost: employeeConfig.iqamaRenewalCost || 0,
        gosi: employeeConfig.gosi || 0,
        fix: employeeConfig.fix || 0,
        saudization: employeeConfig.saudization || 0,
        serviceCharge: employeeConfig.serviceCharge || 0,
        exitFee: employeeConfig.exitFee || 0,
        exitReentryFee: employeeConfig.exitReentryFee || 0
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
        companyId,
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

        remarks: invoiceRemarks, // Add invoice remarks to payload

        generatedAt: now.toDate(),
        replacedAt: existingInvoice ? now.toDate() : undefined
      };

      let invoice: any;

      if (existingInvoice) {
        invoice = await InvoiceModel.findByIdAndUpdate(
          existingInvoice._id,
          { $set: payload },
          { new: true, session }
        );
      } else {
        // // ➕ CREATE (FIRST TIME)
        invoice = await InvoiceModel.create([payload], { session })
          .then(r => r[0]);
      }

      await session.commitTransaction();
      return invoice;

      // // ➕ CREATE (FIRST TIME)
      // const invoice = await InvoiceModel.create(payload);
      // return invoice
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }


  /* ==========================================================
     Bulk Invoice Generation
  ========================================================== */

  static async bulkGenerateInvoices(params: {
    companyId: string;
    iqamaNos: string[];
    monthYear: string;
    extraComponentsMap?: Record<string, InvoiceComponent[]>;
    remarks?: string;
  }) {
    const { companyId, iqamaNos, monthYear } = params;
    const extraComponentsMap = params.extraComponentsMap ?? {};
    const remarks = params.remarks ?? "Bulk auto attendance";

    if (!companyId) {
      throw new Error("companyId is required");
    }

    // 🔄 Auto-finalize past invoices
    await InvoiceService.finalizePastInvoices(companyId);
    // await InvoiceService.finalizePastInvoices();

    const invoiceMonth = moment(monthYear, "MMMM-YYYY");
    if (!invoiceMonth.isValid()) {
      throw new Error("Invalid monthYear format");
    }

    const totalWorkingDays = invoiceMonth.daysInMonth();

    const results: {
      iqamaNo: string;
      success: boolean;
      invoice?: any;
      error?: string;
    }[] = [];

    for (const iqamaNo of iqamaNos) {
      try {
        const invoice = await InvoiceService.generateInvoice({
          companyId,
          iqamaNo,
          monthYear,
          daysPresent: totalWorkingDays, // ✅ FULL ATTENDANCE
          remarks,
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

  static async deleteInvoice(params: {
    companyId: string;
    iqamaNo: string;
    monthYear: string; // "January-2026"
  }) {
    const { companyId, iqamaNo, monthYear } = params;

    if (!companyId) {
      throw new Error("companyId is required");
    }

    const now = moment().startOf("month");
    const invoiceMonth = moment(monthYear, "MMMM-YYYY");

    if (!invoiceMonth.isValid()) {
      throw new Error("Invalid monthYear format");
    }

    /* --------------------------------------------
       1. Fetch invoice
    --------------------------------------------- */

    const invoice = await InvoiceModel.findOne({
      companyId,
      iqamaNo,
      monthYear
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    /* --------------------------------------------
       2. BLOCK finalized invoices
    --------------------------------------------- */

    if (invoice.isFinal) {
      throw new Error("Finalized invoice cannot be deleted");
    }

    /* --------------------------------------------
       3. BLOCK past month invoices
    --------------------------------------------- */

    if (invoiceMonth.isBefore(now, "month")) {
      throw new Error("Past month invoices cannot be deleted");
    }

    /* --------------------------------------------
       4. TRANSACTION START
    --------------------------------------------- */

    const session = await InvoiceModel.db.startSession();
    session.startTransaction();

    try {
      /* --------------------------------------------
         5. Delete invoice
      --------------------------------------------- */

      await InvoiceModel.deleteOne(
        { _id: invoice._id },
        { session }
      );

      /* --------------------------------------------
         6. Delete attendance (SAFE)
      --------------------------------------------- */

      const attendance = await AttendanceModel.findOne({
        companyId,
        iqamaNo,
        monthYear
      }).session(session);

      if (attendance) {
        await AttendanceModel.deleteOne(
          { _id: attendance._id },
          { session }
        );
      }

      await session.commitTransaction();

      return {
        success: true,
        message: `Invoice and attendance deleted for ${iqamaNo} - ${monthYear}`
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }


  /* ==========================================================
     Read APIs
  ========================================================== */

  /**
   * Manually trigger finalization of past invoices for a specific company
   * Can be called from admin endpoints or maintenance operations
   */
  static async manuallyFinalizePastInvoices(companyId: string): Promise<{
    success: boolean;
    message: string;
    finalizedCount: number;
    monthsFinalized: string[];
  }> {
    try {
      if (!companyId) {
        throw new Error("companyId is required");
      }

      const now = moment();

      // Get all unique month-years that are before current month and not final for this company
      const pastMonthYears = await InvoiceModel.distinct("monthYear", {
        companyId,
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

      // Bulk update all past invoices to final for this company
      const result = await InvoiceModel.updateMany(
        {
          companyId,
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

  static async getFinalizationStats(companyId: string): Promise<{
    totalInvoices: number;
    finalizedInvoices: number;
    pendingFinalization: number;
    pastMonthsPending: string[];
    currentMonthInvoices: number;
    futureMonthInvoices: number;
  }> {
    if (!companyId) {
      throw new Error("companyId is required");
    }

    const now = moment().startOf("month");

    const [
      totalInvoices,
      finalizedInvoices,
      allMonthYears,
    ] = await Promise.all([
      InvoiceModel.countDocuments({ companyId }),
      InvoiceModel.countDocuments({ companyId, isFinal: true }),
      InvoiceModel.distinct("monthYear", { companyId }),
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
          companyId,
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
        currentMonthInvoices += await InvoiceModel.countDocuments({ companyId, monthYear });
      }
      else {
        // FUTURE MONTH
        futureMonthInvoices += await InvoiceModel.countDocuments({ companyId, monthYear });
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
    companyId: string,
    iqamaNo: string,
    monthYear: string
  ) {
    return InvoiceModel
      .findOne({ companyId, iqamaNo, monthYear })
      .sort({ version: -1 });
  }

  static async getInvoiceHistory(
    companyId: string,
    iqamaNo: string,
    monthYear: string
  ) {
    return InvoiceModel
      .find({ companyId, iqamaNo, monthYear })
      .sort({ version: -1 });
  }

  static async getInvoicesForEmployee(companyId: string, iqamaNo: string) {
    return InvoiceModel
      .find({ companyId, iqamaNo })
      .sort({ createdAt: -1 });
  }

  /**
   * Get invoice status for all employees in a company for a specific month
   */
  static async getInvoiceStatusForAllEmployees(
    companyId: string, 
    monthYear: string
  ): Promise<Record<string, {
    invoiceExist: boolean;
    attendanceExist: boolean;
    lastGeneratedAt: Date | null;
    isLocked?: boolean;
  }>> {
    try {
      // Get all employees for the company
      const employees = await EmployeeModel.find({ companyId }).lean();
      
      // Get all invoices for the specified month/year
      const invoices = await InvoiceModel.find({ 
        companyId, 
        monthYear 
      }).lean();

      // Get all attendance records for the specified month/year
      const attendanceRecords = await AttendanceModel.find({ 
        companyId, 
        monthYear 
      }).lean();

      // Check if the month is locked (finalized)
      const selectedDate = moment(monthYear, 'MMMM-YYYY');
      const currentDate = moment();
      const isLocked = selectedDate.isBefore(currentDate, 'month');

      // Build status map
      const statusMap: Record<string, any> = {};

      employees.forEach((employee: any) => {
        const iqamaNo = employee.iqamaNo;
        const invoice = invoices.find(inv => inv.iqamaNo === iqamaNo);
        const attendance = attendanceRecords.find(att => att.iqamaNo === iqamaNo);

        statusMap[iqamaNo] = {
          invoiceExist: !!invoice,
          attendanceExist: !!attendance,
          lastGeneratedAt: invoice ? invoice.generatedAt : null,
          isLocked
        };
      });

      return statusMap;
    } catch (error) {
      console.error('Error getting invoice status for all employees:', error);
      return {};
    }
  }
}
