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
exports.InvoiceService = void 0;
const invoice_model_1 = require("../models/invoice.model");
const attendance_model_1 = require("../models/attendance.model");
const moment_1 = __importDefault(require("moment"));
const companyUtils_1 = require("../utils/companyUtils");
const employeeConfig_service_1 = require("./employeeConfig.service");
/* ============================================================
   Utilities
============================================================ */
const sum = (values) => values.reduce((a, b) => (a !== null && a !== void 0 ? a : 0) + (b !== null && b !== void 0 ? b : 0), 0);
/**
 * Attendance proration
 */
const calculateProrationRatio = (totalWorkingDays, daysPresent) => {
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
const generateInvoiceNo = (iqamaNo, monthYear, version, company) => {
    return `INV-${company}-${monthYear}-${iqamaNo}-${version}`;
};
/* ============================================================
   Calculations
============================================================ */
const calculateTotals = (baseSalary, fixedCosts, extraComponents, companyId) => {
    const extraEarnings = sum(extraComponents
        .filter(c => c.type === "earning")
        .map(c => c.amount)) || 0;
    const extraDeductions = sum(extraComponents
        .filter(c => c.type === "deduction")
        .map(c => c.amount)) || 0;
    let grossEarnings;
    let totalDeductions;
    if ((0, companyUtils_1.isNeosoftCompany)(companyId)) {
        // Neosoft: Only prorated service charge + extra earnings
        grossEarnings = (baseSalary.prorateServiceCharge || 0) + extraEarnings;
        totalDeductions = extraDeductions; // Only extra deductions
    }
    else {
        // BlueBinaries: Original logic
        const totalFixedCost = sum(Object.values(fixedCosts)) || 0;
        grossEarnings =
            baseSalary.basic +
                baseSalary.housing +
                baseSalary.transport +
                (baseSalary.prorateServiceCharge || 0) +
                totalFixedCost +
                extraEarnings;
        totalDeductions = 0; // No deductions in original logic
    }
    const netPayable = grossEarnings - totalDeductions;
    return {
        grossEarnings,
        totalDeductions,
        netPayable
    };
};
/* ============================================================
   Invoice Service
============================================================ */
class InvoiceService {
    /* ==========================================================
       Finalize Past Invoices (Efficient Batch Update)
    ========================================================== */
    /**
     * Finalize all past invoices that are still marked as non-final for a specific company
     * This runs efficiently using a single MongoDB update query
     */
    static finalizePastInvoices(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = (0, moment_1.default)();
                // Get all unique month-years that are before current month for this company
                const pastMonthYears = yield invoice_model_1.InvoiceModel.distinct("monthYear", {
                    companyId,
                    isFinal: false
                });
                const pastMonths = pastMonthYears.filter(monthYear => {
                    const invoiceMonth = (0, moment_1.default)(monthYear, "MMMM-YYYY");
                    return invoiceMonth.isBefore(now, "month");
                });
                if (pastMonths.length === 0) {
                    return; // No past invoices to finalize
                }
                // Bulk update all past invoices to final in a single query for this company
                const result = yield invoice_model_1.InvoiceModel.updateMany({
                    companyId,
                    monthYear: { $in: pastMonths },
                    isFinal: false
                }, {
                    $set: {
                        isFinal: true,
                        finalizedAt: now.toDate()
                    }
                });
                if (result.modifiedCount > 0) {
                    console.log(`✅ Finalized ${result.modifiedCount} past invoices for company ${companyId} for months: ${pastMonths.join(", ")}`);
                }
            }
            catch (error) {
                console.error("❌ Error finalizing past invoices:", error);
                // Don't throw error to avoid breaking invoice generation
            }
        });
    }
    static generateInvoice(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { companyId, iqamaNo, monthYear, daysPresent, remarks, invoiceRemarks } = params;
            const extraComponents = (_a = params.extraComponents) !== null && _a !== void 0 ? _a : [];
            if (!companyId) {
                throw new Error("companyId is required");
            }
            // 🔄 Auto-finalize past invoices (efficient batch operation)
            yield InvoiceService.finalizePastInvoices(companyId);
            const now = (0, moment_1.default)();
            const invoiceMonth = (0, moment_1.default)(monthYear, "MMMM-YYYY");
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
            const session = yield invoice_model_1.InvoiceModel.db.startSession();
            session.startTransaction();
            /* --------------------------------------------
               1. Existing invoice (replace / lock)
            --------------------------------------------- */
            const existingInvoice = yield invoice_model_1.InvoiceModel.findOne({
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
            // Use the new period-based employee lookup
            const employees = yield (0, employeeConfig_service_1.getEmployeesForPeriod)(companyId, monthYear);
            const employeeConfig = employees.find(emp => emp.iqamaNo === iqamaNo);
            if (!employeeConfig) {
                throw new Error(`Employee configuration not found for ${iqamaNo} - ${monthYear}. Employee may not have been active during this period.`);
            }
            /* --------------------------------------------
               3. Version & Invoice No
            --------------------------------------------- */
            const version = existingInvoice ? existingInvoice.version + 1 : 1;
            const invoiceNo = generateInvoiceNo(iqamaNo, monthYear, version, companyId);
            try {
                let attendance = yield attendance_model_1.AttendanceModel.findOne({
                    companyId,
                    iqamaNo,
                    monthYear
                });
                if (!attendance) {
                    attendance = yield attendance_model_1.AttendanceModel.create([{
                            companyId,
                            iqamaNo,
                            monthYear,
                            totalWorkingDays,
                            daysPresent,
                            name: employeeConfig.name,
                            remarks,
                        }], { session }).then(r => r[0]);
                }
                else if (editable) {
                    // 🔁 UPDATE attendance (current / future month)
                    attendance.totalWorkingDays = totalWorkingDays;
                    attendance.daysPresent = daysPresent;
                    attendance.remarks = remarks;
                    yield attendance.save({ session });
                }
                if (!attendance) {
                    throw new Error("Attendance creation failed unexpectedly");
                }
                if (!editable && daysPresent !== undefined) {
                    throw new Error("Attendance cannot be modified for past month invoices");
                }
                const prorationRatio = calculateProrationRatio(attendance.totalWorkingDays, attendance.daysPresent);
                // Validate prorationRatio
                if (isNaN(prorationRatio)) {
                    throw new Error(`Invalid prorationRatio: totalWorkingDays=${attendance.totalWorkingDays}, daysPresent=${attendance.daysPresent}`);
                }
                /* --------------------------------------------
                   4. Salary snapshot (PRORATED)
                --------------------------------------------- */
                let baseSalary;
                let fixedCosts;
                if ((0, companyUtils_1.isNeosoftCompany)(companyId)) {
                    // Neosoft: Only service charge, prorated by attendance
                    baseSalary = {
                        basic: 0,
                        housing: 0,
                        transport: 0,
                        prorateServiceCharge: Number(((employeeConfig.serviceCharge || 0) * prorationRatio).toFixed(2))
                    };
                    fixedCosts = {
                        medicalInsurance: 0,
                        iqamaRenewalCost: 0,
                        gosi: 0,
                        fix: 0,
                        saudization: 0,
                        serviceCharge: Number(((employeeConfig.serviceCharge || 0) * prorationRatio).toFixed(2)),
                        exitFee: 0,
                        exitReentryFee: 0
                    };
                }
                else {
                    // BlueBinaries: Original logic
                    baseSalary = {
                        basic: Number(((employeeConfig.basic || 0) * prorationRatio).toFixed(2)),
                        housing: Number(((employeeConfig.housing || 0) * prorationRatio).toFixed(2)),
                        transport: Number(((employeeConfig.transport || 0) * prorationRatio).toFixed(2))
                    };
                    fixedCosts = {
                        medicalInsurance: employeeConfig.medicalInsurance || 0,
                        iqamaRenewalCost: employeeConfig.iqamaRenewalCost || 0,
                        gosi: employeeConfig.gosi || 0,
                        fix: employeeConfig.fix || 0,
                        saudization: employeeConfig.saudization || 0,
                        serviceCharge: employeeConfig.serviceCharge || 0,
                        exitFee: employeeConfig.exitFee || 0,
                        exitReentryFee: employeeConfig.exitReentryFee || 0
                    };
                }
                // Validate baseSalary calculations
                if (isNaN(baseSalary.basic) || isNaN(baseSalary.housing) || isNaN(baseSalary.transport)) {
                    throw new Error(`Invalid baseSalary calculation: basic=${baseSalary.basic}, housing=${baseSalary.housing}, transport=${baseSalary.transport}, prorationRatio=${prorationRatio}`);
                }
                if (baseSalary.prorateServiceCharge !== undefined && isNaN(baseSalary.prorateServiceCharge)) {
                    throw new Error(`Invalid prorateServiceCharge calculation: ${baseSalary.prorateServiceCharge}, prorationRatio=${prorationRatio}`);
                }
                const totals = calculateTotals(baseSalary, fixedCosts, extraComponents, companyId);
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
                let invoice;
                if (existingInvoice) {
                    invoice = yield invoice_model_1.InvoiceModel.findByIdAndUpdate(existingInvoice._id, { $set: payload }, { new: true, session });
                }
                else {
                    // // ➕ CREATE (FIRST TIME)
                    invoice = yield invoice_model_1.InvoiceModel.create([payload], { session })
                        .then(r => r[0]);
                }
                yield session.commitTransaction();
                return invoice;
                // // ➕ CREATE (FIRST TIME)
                // const invoice = await InvoiceModel.create(payload);
                // return invoice
            }
            catch (err) {
                yield session.abortTransaction();
                throw err;
            }
            finally {
                session.endSession();
            }
        });
    }
    /* ==========================================================
       Bulk Invoice Generation
    ========================================================== */
    static bulkGenerateInvoices(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { companyId, iqamaNos, monthYear } = params;
            const extraComponentsMap = (_a = params.extraComponentsMap) !== null && _a !== void 0 ? _a : {};
            const remarks = (_b = params.remarks) !== null && _b !== void 0 ? _b : "Bulk auto attendance";
            if (!companyId) {
                throw new Error("companyId is required");
            }
            // 🔄 Auto-finalize past invoices
            yield InvoiceService.finalizePastInvoices(companyId);
            // await InvoiceService.finalizePastInvoices();
            const invoiceMonth = (0, moment_1.default)(monthYear, "MMMM-YYYY");
            if (!invoiceMonth.isValid()) {
                throw new Error("Invalid monthYear format");
            }
            const totalWorkingDays = invoiceMonth.daysInMonth();
            const results = [];
            for (const iqamaNo of iqamaNos) {
                try {
                    const invoice = yield InvoiceService.generateInvoice({
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
                }
                catch (error) {
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
        });
    }
    static deleteInvoice(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { companyId, iqamaNo, monthYear } = params;
            if (!companyId) {
                throw new Error("companyId is required");
            }
            const now = (0, moment_1.default)().startOf("month");
            const invoiceMonth = (0, moment_1.default)(monthYear, "MMMM-YYYY");
            if (!invoiceMonth.isValid()) {
                throw new Error("Invalid monthYear format");
            }
            /* --------------------------------------------
               1. Fetch invoice
            --------------------------------------------- */
            const invoice = yield invoice_model_1.InvoiceModel.findOne({
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
            const session = yield invoice_model_1.InvoiceModel.db.startSession();
            session.startTransaction();
            try {
                /* --------------------------------------------
                   5. Delete invoice
                --------------------------------------------- */
                yield invoice_model_1.InvoiceModel.deleteOne({ _id: invoice._id }, { session });
                /* --------------------------------------------
                   6. Delete attendance (SAFE)
                --------------------------------------------- */
                const attendance = yield attendance_model_1.AttendanceModel.findOne({
                    companyId,
                    iqamaNo,
                    monthYear
                }).session(session);
                if (attendance) {
                    yield attendance_model_1.AttendanceModel.deleteOne({ _id: attendance._id }, { session });
                }
                yield session.commitTransaction();
                return {
                    success: true,
                    message: `Invoice and attendance deleted for ${iqamaNo} - ${monthYear}`
                };
            }
            catch (error) {
                yield session.abortTransaction();
                throw error;
            }
            finally {
                session.endSession();
            }
        });
    }
    /* ==========================================================
       Read APIs
    ========================================================== */
    /**
     * Manually trigger finalization of past invoices for a specific company
     * Can be called from admin endpoints or maintenance operations
     */
    static manuallyFinalizePastInvoices(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                const now = (0, moment_1.default)();
                // Get all unique month-years that are before current month and not final for this company
                const pastMonthYears = yield invoice_model_1.InvoiceModel.distinct("monthYear", {
                    companyId,
                    isFinal: false
                });
                const pastMonths = pastMonthYears.filter(monthYear => {
                    const invoiceMonth = (0, moment_1.default)(monthYear, "MMMM-YYYY");
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
                const result = yield invoice_model_1.InvoiceModel.updateMany({
                    companyId,
                    monthYear: { $in: pastMonths },
                    isFinal: false
                }, {
                    $set: {
                        isFinal: true,
                        finalizedAt: now.toDate()
                    }
                });
                return {
                    success: true,
                    message: `Successfully finalized ${result.modifiedCount} past invoices`,
                    finalizedCount: result.modifiedCount,
                    monthsFinalized: pastMonths
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: `Error finalizing past invoices: ${error.message}`,
                    finalizedCount: 0,
                    monthsFinalized: []
                };
            }
        });
    }
    static getFinalizationStats(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!companyId) {
                throw new Error("companyId is required");
            }
            const now = (0, moment_1.default)().startOf("month");
            const [totalInvoices, finalizedInvoices, allMonthYears,] = yield Promise.all([
                invoice_model_1.InvoiceModel.countDocuments({ companyId }),
                invoice_model_1.InvoiceModel.countDocuments({ companyId, isFinal: true }),
                invoice_model_1.InvoiceModel.distinct("monthYear", { companyId }),
            ]);
            let pendingFinalization = 0;
            const pastMonthsPending = [];
            let currentMonthInvoices = 0;
            let futureMonthInvoices = 0;
            for (const monthYear of allMonthYears) {
                const invoiceMonth = (0, moment_1.default)(monthYear, "MMMM-YYYY");
                if (invoiceMonth.isBefore(now, "month")) {
                    // ✅ PAST MONTH
                    const pendingCount = yield invoice_model_1.InvoiceModel.countDocuments({
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
                    currentMonthInvoices += yield invoice_model_1.InvoiceModel.countDocuments({ companyId, monthYear });
                }
                else {
                    // FUTURE MONTH
                    futureMonthInvoices += yield invoice_model_1.InvoiceModel.countDocuments({ companyId, monthYear });
                }
            }
            return {
                totalInvoices,
                finalizedInvoices,
                pendingFinalization, // ✅ NOW CORRECT
                pastMonthsPending,
                currentMonthInvoices,
                futureMonthInvoices,
            };
        });
    }
    static getLatestInvoice(companyId, iqamaNo, monthYear) {
        return __awaiter(this, void 0, void 0, function* () {
            return invoice_model_1.InvoiceModel
                .findOne({ companyId, iqamaNo, monthYear })
                .sort({ version: -1 });
        });
    }
    static getInvoiceHistory(companyId, iqamaNo, monthYear) {
        return __awaiter(this, void 0, void 0, function* () {
            return invoice_model_1.InvoiceModel
                .find({ companyId, iqamaNo, monthYear })
                .sort({ version: -1 });
        });
    }
    static getInvoicesForEmployee(companyId, iqamaNo) {
        return __awaiter(this, void 0, void 0, function* () {
            return invoice_model_1.InvoiceModel
                .find({ companyId, iqamaNo })
                .sort({ createdAt: -1 });
        });
    }
    /**
     * Get invoice status for all employees in a company for a specific month
     */
    static getInvoiceStatusForAllEmployees(companyId, monthYear) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all employees for the company
                const employees = yield employee_model_1.EmployeeModel.find({ companyId }).lean();
                // Get all invoices for the specified month/year
                const invoices = yield invoice_model_1.InvoiceModel.find({
                    companyId,
                    monthYear
                }).lean();
                // Get all attendance records for the specified month/year
                const attendanceRecords = yield attendance_model_1.AttendanceModel.find({
                    companyId,
                    monthYear
                }).lean();
                // Check if the month is locked (finalized)
                const selectedDate = (0, moment_1.default)(monthYear, 'MMMM-YYYY');
                const currentDate = (0, moment_1.default)();
                const isLocked = selectedDate.isBefore(currentDate, 'month');
                // Build status map
                const statusMap = {};
                employees.forEach((employee) => {
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
            }
            catch (error) {
                console.error('Error getting invoice status for all employees:', error);
                return {};
            }
        });
    }
}
exports.InvoiceService = InvoiceService;
