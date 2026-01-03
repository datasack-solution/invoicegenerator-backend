import { InvoiceModel, InvoiceComponent } from "../models/invoice.model";
import { EmployeeModel } from "../models/employee.model";
import { AttendanceModel } from "../models/attendance.model";
import moment from "moment";
import { FixedSalaryModel } from "../models/fixedSalary.model";

/* ============================================================
   Utilities
============================================================ */

/**
 * Check whether invoice monthYear is the current month-year
 * Example: "January-2026"
 */
const isSameMonthYear = (monthYear: string, now = new Date()): boolean => {
  const currentMonthYear = now.toLocaleString("en-US", {
    month: "long",
    year: "numeric"
  }).replace(" ", "-");

  return currentMonthYear === monthYear;
};

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
     Single Invoice Generation
  ========================================================== */

//   static async generateInvoice(params: {
//     iqamaNo: string;
//     monthYear: string; // "January-2026"
//     extraComponents?: InvoiceComponent[];
//   }) {
//     const { iqamaNo, monthYear } = params;
//     const extraComponents = params.extraComponents ?? [];

//     const now = new Date();
//     const editable = isSameMonthYear(monthYear, now);

//     /* --------------------------------------------
//        0. Attendance (MANDATORY)
//     --------------------------------------------- */

//     const attendance = await AttendanceModel.findOne({
//       iqamaNo,
//       monthYear
//     });

//     if (!attendance) {
//       throw new Error(
//         `Attendance not found for ${iqamaNo} - ${monthYear}`
//       );
//     }

//     const prorationRatio = calculateProrationRatio(
//       attendance.totalWorkingDays,
//       attendance.daysPresent
//     );

//     /* --------------------------------------------
//        1. Last invoice (for replace / lock)
//     --------------------------------------------- */

//     const lastInvoice = await InvoiceModel
//       .findOne({ iqamaNo, monthYear })
//       .sort({ version: -1 });

//     if (lastInvoice && !editable) {
//       // 🔒 Locked month → return last generated invoice
//       return lastInvoice;
//     }

//     /* --------------------------------------------
//        2. Employee configuration
//     --------------------------------------------- */

//     const employeeConfig = await EmployeeModel.findOne({
//       iqamaNo,
//       fromDate: { $lte: now },
//       toDate: { $gte: now }
//     });

//     if (!employeeConfig) {
//       throw new Error(
//         `Employee configuration not found for ${iqamaNo}`
//       );
//     }

//     /* --------------------------------------------
//        3. Versioning
//     --------------------------------------------- */

//     const version = lastInvoice ? lastInvoice.version + 1 : 1;

//     /* --------------------------------------------
//        4. Salary snapshot (PRORATED)
//     --------------------------------------------- */

//     const baseSalary = {
//       basic: Number((employeeConfig.basic * prorationRatio).toFixed(2)),
//       housing: Number((employeeConfig.housing * prorationRatio).toFixed(2)),
//       transport: Number((employeeConfig.transport * prorationRatio).toFixed(2))
//     };

//     const fixedCosts = {
//       medicalInsurance: employeeConfig.medicalInsurance,
//       iqamaRenewalCost: employeeConfig.iqamaRenewalCost,
//       gosi: employeeConfig.gosi,
//       fix: employeeConfig.fix,
//       saudization: employeeConfig.saudization,
//       serviceCharge: employeeConfig.serviceCharge,
//       exitFee: employeeConfig.exitFee,
//       exitReentryFee: employeeConfig.exitReentryFee
//     };

//     const totals = calculateTotals(
//       baseSalary,
//       fixedCosts,
//       extraComponents
//     );

//     /* --------------------------------------------
//        5. Save invoice
//     --------------------------------------------- */

//     const invoiceNo = generateInvoiceNo(
//       iqamaNo,
//       monthYear,
//       version
//     );

//     const invoice = new InvoiceModel({
//       invoiceNo,

//       iqamaNo,
//       employeeName: employeeConfig.name,
//       designation: employeeConfig.designation,

//       monthYear,

//       version,
//       isFinal: !editable,

//       attendanceSnapshot: {
//         totalWorkingDays: attendance.totalWorkingDays,
//         daysPresent: attendance.daysPresent,
//         prorationRatio
//       },

//       baseSalary,
//       fixedCosts,
//       extraComponents,

//       grossEarnings: totals.grossEarnings,
//       totalDeductions: totals.totalDeductions,
//       netPayable: totals.netPayable,

//       generatedAt: now,
//     });

//     await invoice.save();
//     return invoice;
//   }


static async generateInvoice(params: {
  iqamaNo: string;
  monthYear: string; // "January-2026"
  extraComponents?: InvoiceComponent[];
}) {
  const { iqamaNo, monthYear } = params;
  const extraComponents = params.extraComponents ?? [];

  const now = moment();
  const invoiceMonth = moment(monthYear, "MMMM-YYYY");
  const editable = invoiceMonth.isSameOrAfter(now, "month");

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

  const monthStart = invoiceMonth.startOf("month").toDate();
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
