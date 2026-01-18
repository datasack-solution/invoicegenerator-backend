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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLatestByIqama = exports.getById = exports.getEmployeesForPeriod = exports.getAllLatest = exports.getByIqama = exports.recreateEmployeeConfig = exports.updateEmployeeConfig = exports.createEmployeeConfig = exports.OPEN_ENDED_DATE = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const employee_model_1 = require("../models/employee.model");
const fixedSalary_model_1 = require("../models/fixedSalary.model");
const companyUtils_1 = require("../utils/companyUtils");
// Helpers to normalize dates to UTC day boundaries
const startOfDayUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
const endOfDayUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
exports.OPEN_ENDED_DATE = endOfDayUTC(new Date("9999-12-31T00:00:00.000Z"));
// export const createEmployeeConfig = async (payload: CreatePayload) => {
//   const session = await mongoose.startSession();
//   try {
//     let created: any = null;
//     await session.withTransaction(async () => {
//       // Remove _id from payload to avoid conflicts
//       const { _id, ...cleanPayload } = payload;
//       const rawFrom = cleanPayload.fromDate ? new Date(cleanPayload.fromDate) : new Date();
//       const fromDate = startOfDayUTC(rawFrom);
//       const toDate = cleanPayload.toDate ? endOfDayUTC(new Date(cleanPayload.toDate)) : OPEN_ENDED_DATE;
//       const joiningDate = cleanPayload.joiningDate ? new Date(cleanPayload.joiningDate) : new Date();
//       const resignationDate = cleanPayload.resignationDate ? new Date(cleanPayload.resignationDate) : undefined;
//       cleanPayload.joiningDate = joiningDate;  
//       cleanPayload.resignationDate = resignationDate;  
//       // Always read the single FixedSalary document (first one) and merge its fields
//       const fixed = await FixedSalaryModel.findOne().lean();
//       let finalPayload = cleanPayload;
//       if (fixed) {
//         // Remove _id from fixed salary data
//         const { _id: fixedId, ...fixedData } = fixed;
//         finalPayload = { ...finalPayload, ...fixedData };
//       }
//       // Find previous open-ended config for same iqamaNo and close it FIRST to avoid unique index conflict
//       const prev = await EmployeeModel.findOne({ iqamaNo: finalPayload.iqamaNo, toDate: OPEN_ENDED_DATE }).session(session);
//       if (prev) {
//         const prevTo = new Date(fromDate);
//         // subtract one day in UTC
//         prevTo.setUTCDate(prevTo.getUTCDate() - 1);
//         prev.toDate = endOfDayUTC(prevTo);
//         await prev.save({ session });
//       }
//       // create new config document; let Mongoose assign _id (avoid duplicate _id errors)
//       created = await EmployeeModel.create([
//         {
//           iqamaNo: finalPayload.iqamaNo,
//           name: finalPayload.name,
//           designation: finalPayload.designation,
//           status: finalPayload.status,
//           basic: finalPayload.basic,
//           housing: finalPayload.housing,
//           transport: finalPayload.transport,
//           medicalInsurance: finalPayload.medicalInsurance,
//           iqamaRenewalCost: finalPayload.iqamaRenewalCost,
//           gosi: finalPayload.gosi,
//           fix: finalPayload.fix,
//           saudization: finalPayload.saudization,
//           serviceCharge: finalPayload.serviceCharge,
//           exitFee: finalPayload.exitFee,
//           exitReentryFee: finalPayload.exitReentryFee,
//           fromDate,
//           toDate,
//           joiningDate,
//           resignationDate
//         }
//       ], { session });
//     });
//     return created?.[0] ?? null;
//   } finally {
//     session.endSession();
//   }
// };
const createEmployeeConfig = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
    try {
        let created = null;
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            const { _id, useDefaultFixedSalary, companyId } = payload, cleanPayload = __rest(payload, ["_id", "useDefaultFixedSalary", "companyId"]);
            if (!companyId) {
                throw new Error("companyId is required");
            }
            // Company-specific validation
            if ((0, companyUtils_1.isNeosoftCompany)(companyId)) {
                const errors = (0, companyUtils_1.validateNeosoftEmployee)(cleanPayload);
                if (errors.length > 0) {
                    throw new Error(`Validation failed: ${errors.join(", ")}`);
                }
            }
            else if ((0, companyUtils_1.isBlueBinariesCompany)(companyId)) {
                const errors = (0, companyUtils_1.validateBlueBinariesEmployee)(cleanPayload);
                if (errors.length > 0) {
                    throw new Error(`Validation failed: ${errors.join(", ")}`);
                }
            }
            const rawFrom = cleanPayload.fromDate ? new Date(cleanPayload.fromDate) : new Date();
            const fromDate = startOfDayUTC(rawFrom);
            const toDate = cleanPayload.toDate
                ? endOfDayUTC(new Date(cleanPayload.toDate))
                : exports.OPEN_ENDED_DATE;
            const joiningDate = cleanPayload.joiningDate
                ? new Date(cleanPayload.joiningDate)
                : new Date();
            const resignationDate = cleanPayload.resignationDate
                ? new Date(cleanPayload.resignationDate)
                : undefined;
            cleanPayload.joiningDate = joiningDate;
            cleanPayload.resignationDate = resignationDate;
            let finalPayload = Object.assign(Object.assign({}, cleanPayload), { companyId });
            // Company-specific logic for salary configuration
            if ((0, companyUtils_1.isNeosoftCompany)(companyId)) {
                // For Neosoft: Only serviceCharge is required, get from fixedSalary if not provided
                if (!finalPayload.serviceCharge && finalPayload.serviceCharge !== 0) {
                    const fixed = yield fixedSalary_model_1.FixedSalaryModel.findOne({ companyId }).lean();
                    if (fixed && fixed.serviceCharge) {
                        finalPayload.serviceCharge = fixed.serviceCharge;
                    }
                }
                // Set other fields to 0 or undefined for Neosoft
                finalPayload.basic = 0;
                finalPayload.housing = 0;
                finalPayload.transport = 0;
                finalPayload.medicalInsurance = 0;
                finalPayload.iqamaRenewalCost = 0;
                finalPayload.gosi = 0;
                finalPayload.fix = 0;
                finalPayload.saudization = 0;
                finalPayload.exitFee = 0;
                finalPayload.exitReentryFee = 0;
            }
            else {
                // For BlueBinaries: Use existing logic with fixed salary merge
                if (useDefaultFixedSalary) {
                    const fixed = yield fixedSalary_model_1.FixedSalaryModel.findOne({ companyId }).lean();
                    if (!fixed) {
                        throw new Error("Default fixed salary configuration not found for this company");
                    }
                    const { _id: fixedId, companyId: fixedCompanyId } = fixed, fixedData = __rest(fixed, ["_id", "companyId"]);
                    finalPayload = Object.assign(Object.assign(Object.assign({}, finalPayload), fixedData), { fix: payload.fix, gosi: payload.gosi });
                }
            }
            // 🔒 Close previous open-ended config for same company + iqamaNo
            const prev = yield employee_model_1.EmployeeModel.findOne({
                companyId,
                iqamaNo: finalPayload.iqamaNo,
                toDate: exports.OPEN_ENDED_DATE
            }).session(session);
            if (prev) {
                const prevTo = new Date(fromDate);
                prevTo.setUTCDate(prevTo.getUTCDate() - 1);
                prev.toDate = endOfDayUTC(prevTo);
                yield prev.save({ session });
            }
            created = yield employee_model_1.EmployeeModel.create([Object.assign(Object.assign({}, finalPayload), { fromDate,
                    toDate })], { session });
        }));
        return (_a = created === null || created === void 0 ? void 0 : created[0]) !== null && _a !== void 0 ? _a : null;
    }
    finally {
        session.endSession();
    }
});
exports.createEmployeeConfig = createEmployeeConfig;
const updateEmployeeConfig = (id, changes) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        let updated = null;
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            // Remove _id from changes to avoid immutable field error
            const { _id } = changes, updateChanges = __rest(changes, ["_id"]);
            let finalChanges = updateChanges;
            // Load existing document to compute resulting iqamaNo and toDate
            const existing = yield employee_model_1.EmployeeModel.findById(id).session(session);
            if (!existing)
                throw new Error("Config not found");
            const newIqamaNo = (_a = finalChanges.iqamaNo) !== null && _a !== void 0 ? _a : existing.iqamaNo;
            const newToDate = finalChanges.toDate ? endOfDayUTC(new Date(finalChanges.toDate)) : endOfDayUTC(new Date(existing.toDate));
            const companyId = existing.companyId; // Use existing companyId
            // Check uniqueness: no other doc should have same companyId + iqamaNo + toDate
            const conflict = yield employee_model_1.EmployeeModel.findOne({
                companyId,
                iqamaNo: newIqamaNo,
                toDate: newToDate,
                _id: { $ne: id }
            }).session(session);
            if (conflict) {
                throw new Error("Duplicate config: another entry exists with same iqamaNo and toDate");
            }
            updated = yield employee_model_1.EmployeeModel.findByIdAndUpdate(id, finalChanges, { new: true, session });
        }));
        return updated;
    }
    finally {
        session.endSession();
    }
});
exports.updateEmployeeConfig = updateEmployeeConfig;
// export const updateEmployeeConfig = async (
//   id: string,
//   changes: any & { useDefaultFixedSalary?: boolean }
// ) => {
//   const session = await mongoose.startSession();
//   try {
//     let updated: any = null;
//     await session.withTransaction(async () => {
//       const { _id, useDefaultFixedSalary, ...updateChanges } = changes;
//       let finalChanges = updateChanges;
//       if (useDefaultFixedSalary) {
//         const fixed = await FixedSalaryModel.findOne().lean();
//         if (!fixed) {
//           throw new Error("Default fixed salary configuration not found");
//         }
//         const { _id: fixedId, ...fixedData } = fixed;
//         finalChanges = { ...finalChanges, ...fixedData };
//       }
//       const existing = await EmployeeModel.findById(id).session(session);
//       if (!existing) throw new Error("Config not found");
//       const newIqamaNo = finalChanges.iqamaNo ?? existing.iqamaNo;
//       const newToDate = finalChanges.toDate
//         ? endOfDayUTC(new Date(finalChanges.toDate))
//         : endOfDayUTC(new Date(existing.toDate));
//       const conflict = await EmployeeModel.findOne({
//         iqamaNo: newIqamaNo,
//         toDate: newToDate,
//         _id: { $ne: id }
//       }).session(session);
//       if (conflict) {
//         throw new Error("Duplicate config: another entry exists with same iqamaNo and toDate");
//       }
//       updated = await EmployeeModel.findByIdAndUpdate(
//         id,
//         finalChanges,
//         { new: true, session }
//       );
//     });
//     return updated;
//   } finally {
//     session.endSession();
//   }
// };
const recreateEmployeeConfig = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // For recreation we force the new config's fromDate to the 1st day of the next month (UTC)
    const baseDate = payload.fromDate ? new Date(payload.fromDate) : new Date();
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();
    // first day of next month
    const nextMonthFirst = startOfDayUTC(new Date(Date.UTC(year, month + 1, 1)));
    const newPayload = Object.assign(Object.assign({}, payload), { fromDate: nextMonthFirst.toISOString() });
    return (0, exports.createEmployeeConfig)(newPayload);
});
exports.recreateEmployeeConfig = recreateEmployeeConfig;
// Get all config entries for an iqamaNo in a company (history)
const getByIqama = (companyId, iqamaNo) => __awaiter(void 0, void 0, void 0, function* () {
    return employee_model_1.EmployeeModel.find({ companyId, iqamaNo }).sort({ fromDate: -1 }).lean();
});
exports.getByIqama = getByIqama;
// Get latest (open-ended) configs for all employees in a company
const getAllLatest = (companyId) => __awaiter(void 0, void 0, void 0, function* () {
    return employee_model_1.EmployeeModel.find({ companyId, toDate: exports.OPEN_ENDED_DATE }).lean();
});
exports.getAllLatest = getAllLatest;
// Get employees valid for a specific month/year period
const getEmployeesForPeriod = (companyId, monthYear) => __awaiter(void 0, void 0, void 0, function* () {
    // Parse monthYear (e.g., "January-2024") to get the period boundaries
    const [monthName, yearStr] = monthYear.split('-');
    const year = parseInt(yearStr);
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth(); // 0-based month
    // Get the first day of the month and last day of the month in UTC
    const periodStart = startOfDayUTC(new Date(Date.UTC(year, monthIndex, 1)));
    const periodEnd = endOfDayUTC(new Date(Date.UTC(year, monthIndex + 1, 0))); // Last day of month
    console.log(`🔍 DEBUG: Querying employees for period: ${monthYear}`);
    console.log(`📅 DEBUG: Period boundaries: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);
    // Find ALL employee configs for this company
    const allEmployees = yield employee_model_1.EmployeeModel.find({ companyId }).sort({ iqamaNo: 1, fromDate: 1 }).lean();
    console.log(`📋 DEBUG: Found ${allEmployees.length} total employee configs for company ${companyId}`);
    // Group by iqamaNo and find the correct config for each employee
    const employeeMap = new Map();
    // Group configs by iqamaNo first
    const configsByEmployee = new Map();
    allEmployees.forEach(emp => {
        if (!configsByEmployee.has(emp.iqamaNo)) {
            configsByEmployee.set(emp.iqamaNo, []);
        }
        configsByEmployee.get(emp.iqamaNo).push(emp);
    });
    console.log(`👥 DEBUG: Found configs for ${configsByEmployee.size} unique employees`);
    // For each employee, find the config that was active during the requested period
    configsByEmployee.forEach((configs, iqamaNo) => {
        console.log(`\n👤 DEBUG: Processing employee ${iqamaNo} with ${configs.length} configs:`);
        // Sort configs by fromDate to process them chronologically
        configs.sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime());
        configs.forEach((config, index) => {
            const configStart = new Date(config.fromDate);
            const configEnd = new Date(config.toDate);
            console.log(`   Config ${index + 1}: ${configStart.toISOString()} to ${configEnd.toISOString()}, Basic: ${config.basic}`);
        });
        let activeConfig = null;
        for (const config of configs) {
            const configStart = new Date(config.fromDate);
            const configEnd = new Date(config.toDate);
            // Check if this config was active during any part of the requested period
            // Config is active if:
            // 1. It starts before or during the period (configStart <= periodEnd)
            // 2. It ends after or during the period (configEnd >= periodStart)
            const startsBeforeOrDuringPeriod = configStart <= periodEnd;
            const endsAfterOrDuringPeriod = configEnd >= periodStart;
            const isActiveInPeriod = startsBeforeOrDuringPeriod && endsAfterOrDuringPeriod;
            console.log(`   Config check: starts <= periodEnd? ${startsBeforeOrDuringPeriod}, ends >= periodStart? ${endsAfterOrDuringPeriod}, active? ${isActiveInPeriod}`);
            if (isActiveInPeriod) {
                // This config overlaps with the period
                if (!activeConfig) {
                    console.log(`   ✅ Setting as first active config`);
                    activeConfig = config;
                }
                else {
                    // If we have multiple overlapping configs, choose the one that started later
                    // This handles the case where a new config starts during the month
                    const activeConfigStart = new Date(activeConfig.fromDate);
                    if (configStart > activeConfigStart) {
                        console.log(`   🔄 Replacing with newer config (${configStart.toISOString()} > ${activeConfigStart.toISOString()})`);
                        activeConfig = config;
                    }
                    else {
                        console.log(`   ⏭️ Keeping existing config (${configStart.toISOString()} <= ${activeConfigStart.toISOString()})`);
                    }
                }
            }
        }
        if (activeConfig) {
            console.log(`   🎯 Final choice for ${iqamaNo}: Basic ${activeConfig.basic}, Period: ${new Date(activeConfig.fromDate).toISOString()} to ${new Date(activeConfig.toDate).toISOString()}`);
            employeeMap.set(iqamaNo, activeConfig);
        }
        else {
            console.log(`   ❌ No active config found for ${iqamaNo} in period ${monthYear}`);
        }
    });
    const result = Array.from(employeeMap.values());
    console.log(`\n🎯 DEBUG: Final result: ${result.length} employees for ${monthYear}`);
    return result;
});
exports.getEmployeesForPeriod = getEmployeesForPeriod;
// Get by document id
const getById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return employee_model_1.EmployeeModel.findById(id).lean();
});
exports.getById = getById;
// Delete latest config for iqamaNo in a company and reopen previous (set toDate to OPEN_ENDED_DATE)
const deleteLatestByIqama = (companyId, iqamaNo) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        let result = null;
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            // Find the latest open-ended config for this company
            const latest = yield employee_model_1.EmployeeModel.findOne({ companyId, iqamaNo, toDate: exports.OPEN_ENDED_DATE }).session(session);
            if (!latest) {
                throw new Error("No latest config found for iqamaNo in this company");
            }
            // Delete it
            result = yield employee_model_1.EmployeeModel.findByIdAndDelete(latest._id, { session });
            // Find previous latest by fromDate descending for this company
            const prev = yield employee_model_1.EmployeeModel.findOne({ companyId, iqamaNo }).sort({ fromDate: -1 }).session(session);
            if (prev) {
                // Set prev.toDate to open-ended
                prev.toDate = exports.OPEN_ENDED_DATE;
                yield prev.save({ session });
            }
        }));
        return result;
    }
    finally {
        session.endSession();
    }
});
exports.deleteLatestByIqama = deleteLatestByIqama;
