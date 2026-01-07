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
exports.AttendanceService = void 0;
const attendance_model_1 = require("../models/attendance.model");
const employee_model_1 = require("../models/employee.model");
const moment_1 = __importDefault(require("moment"));
class AttendanceService {
    // ==================== SINGLE EMPLOYEE FUNCTIONS ====================
    /**
     * 1. Create attendance for an employee for a specific month
     */
    static createAttendance(companyId, iqamaNo, monthYear, daysPresent, remarks) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                // Check if employee exists and get employee details
                const employee = yield this.getActiveEmployeeConfig(companyId, iqamaNo);
                if (!employee) {
                    throw new Error(`Employee with iqamaNo ${iqamaNo} not found in company ${companyId}`);
                }
                // Check if attendance can be created for this month
                const canCreate = yield this.canCreateAttendanceForMonth(companyId, iqamaNo, monthYear);
                if (!canCreate) {
                    throw new Error(`Cannot create attendance for ${monthYear}. Employee may have resigned before this month or not joined yet.`);
                }
                // Check if attendance already exists
                const existingAttendance = yield this.checkAttendanceExists(companyId, iqamaNo, monthYear);
                if (existingAttendance) {
                    throw new Error(`Attendance already exists for ${iqamaNo} in ${monthYear}`);
                }
                // Calculate total working days for the month
                const totalWorkingDays = this.getTotalWorkingDaysInMonth(monthYear);
                const attendanceData = {
                    companyId,
                    iqamaNo: employee.iqamaNo,
                    name: employee.name,
                    monthYear,
                    totalWorkingDays,
                    daysPresent,
                    remarks
                };
                const attendance = new attendance_model_1.AttendanceModel(attendanceData);
                return yield attendance.save();
            }
            catch (error) {
                throw new Error(`Failed to create attendance: ${error.message}`);
            }
        });
    }
    /**
     * 2. Create attendance for pending months from joining date to current month
     * For pending months: total working days = days present (as per requirement)
     */
    static createAttendanceForPendingMonths(companyId, iqamaNo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                const employee = yield this.getActiveEmployeeConfig(companyId, iqamaNo);
                if (!employee) {
                    throw new Error(`Employee with iqamaNo ${iqamaNo} not found in company ${companyId}`);
                }
                const pendingMonths = yield this.getPendingMonths(companyId, iqamaNo);
                const createdAttendances = [];
                for (const monthYear of pendingMonths) {
                    try {
                        // For pending months, total working days = days present
                        const totalWorkingDays = this.getTotalWorkingDaysInMonth(monthYear);
                        const attendanceData = {
                            companyId,
                            iqamaNo: employee.iqamaNo,
                            name: employee.name,
                            monthYear,
                            totalWorkingDays,
                            daysPresent: totalWorkingDays, // For pending months, assume full attendance
                            remarks: 'Auto-generated for pending month'
                        };
                        const attendance = new attendance_model_1.AttendanceModel(attendanceData);
                        const savedAttendance = yield attendance.save();
                        createdAttendances.push(savedAttendance);
                    }
                    catch (error) {
                        console.warn(`Failed to create attendance for ${monthYear}: ${error.message}`);
                    }
                }
                return createdAttendances;
            }
            catch (error) {
                throw new Error(`Failed to create pending attendances: ${error.message}`);
            }
        });
    }
    /**
     * 3. Check if attendance exists for an employee for a month
     */
    static checkAttendanceExists(companyId, iqamaNo, monthYear) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const attendance = yield attendance_model_1.AttendanceModel.findOne({ companyId, iqamaNo, monthYear });
                return !!attendance;
            }
            catch (error) {
                throw new Error(`Failed to check attendance existence: ${error.message}`);
            }
        });
    }
    /**
     * 4. Get attendance for an employee for a specific month
     */
    static getAttendanceByMonth(companyId, iqamaNo, monthYear) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield attendance_model_1.AttendanceModel.findOne({ companyId, iqamaNo, monthYear });
            }
            catch (error) {
                throw new Error(`Failed to get attendance: ${error.message}`);
            }
        });
    }
    /**
     * 5. Get all attendance records for an employee
     */
    static getAllAttendanceForEmployee(companyId, iqamaNo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield attendance_model_1.AttendanceModel.aggregate([
                    { $match: { companyId, iqamaNo } },
                    {
                        $addFields: {
                            monthDate: {
                                $dateFromString: {
                                    dateString: {
                                        $concat: [
                                            "01-",
                                            "$monthYear"
                                        ]
                                    },
                                    format: "%d-%B-%Y"
                                }
                            }
                        }
                    },
                    { $sort: { monthDate: -1 } }
                ]);
            }
            catch (error) {
                throw new Error(`Failed to get all attendance: ${error.message}`);
            }
        });
    }
    /**
     * 6. Update attendance for an employee for a month
     */
    static updateAttendance(companyId, iqamaNo, monthYear, daysPresent, remarks) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                const updateData = {};
                if (daysPresent !== undefined) {
                    updateData.daysPresent = daysPresent;
                }
                if (remarks !== undefined) {
                    updateData.remarks = remarks;
                }
                return yield attendance_model_1.AttendanceModel.findOneAndUpdate({ companyId, iqamaNo, monthYear }, updateData, { new: true });
            }
            catch (error) {
                throw new Error(`Failed to update attendance: ${error.message}`);
            }
        });
    }
    /**
     * 7. Delete attendance for an employee for a month
     */
    static deleteAttendance(companyId, iqamaNo, monthYear) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                const result = yield attendance_model_1.AttendanceModel.deleteOne({ companyId, iqamaNo, monthYear });
                return result.deletedCount > 0;
            }
            catch (error) {
                throw new Error(`Failed to delete attendance: ${error.message}`);
            }
        });
    }
    /**
     * 8. Create attendance for current month with smart logic
     */
    static createAttendanceForCurrentMonth(companyId, iqamaNo, daysPresent, remarks) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                const employee = yield this.getActiveEmployeeConfig(companyId, iqamaNo);
                if (!employee) {
                    throw new Error(`Employee with iqamaNo ${iqamaNo} not found in company ${companyId}`);
                }
                const currentMonthYear = this.getCurrentMonthYear();
                // Check if employee resigned in current month or before
                if (employee.resignationDate) {
                    const resignationMonthYear = this.formatDateToMonthYear(employee.resignationDate);
                    if (this.isMonthBefore(currentMonthYear, resignationMonthYear)) {
                        throw new Error(`Cannot create attendance for current month. Employee resigned in ${resignationMonthYear}`);
                    }
                }
                // Check if current month attendance already exists
                const currentExists = yield this.checkAttendanceExists(companyId, iqamaNo, currentMonthYear);
                if (currentExists) {
                    throw new Error(`Attendance for current month ${currentMonthYear} already exists`);
                }
                // Get previous month
                const previousMonthYear = this.getPreviousMonthYear(currentMonthYear);
                const previousExists = yield this.checkAttendanceExists(companyId, iqamaNo, previousMonthYear);
                const createdAttendances = [];
                if (!previousExists) {
                    // Previous month doesn't exist, create all pending months up to previous month
                    const pendingAttendances = yield this.createAttendanceForPendingMonths(companyId, iqamaNo);
                    createdAttendances.push(...pendingAttendances);
                }
                // Now create current month attendance
                const currentAttendance = yield this.createAttendance(companyId, iqamaNo, currentMonthYear, daysPresent, remarks || 'Current month attendance');
                createdAttendances.push(currentAttendance);
                return createdAttendances;
            }
            catch (error) {
                throw new Error(`Failed to create current month attendance: ${error.message}`);
            }
        });
    }
    // ==================== ALL EMPLOYEES FUNCTIONS ====================
    /**
     * Generate attendance for all employees for a specific month
     */
    static generateAttendanceForAllEmployees(companyId, monthYear, daysPresent, remarks) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                const activeEmployees = yield this.getAllActiveEmployees(companyId);
                const createdAttendances = [];
                for (const employee of activeEmployees) {
                    try {
                        // Check if employee can have attendance for this month
                        const canCreate = yield this.canCreateAttendanceForMonth(companyId, employee.iqamaNo, monthYear);
                        if (!canCreate) {
                            console.warn(`Skipping ${employee.iqamaNo} for ${monthYear} - resigned before this month or not joined yet`);
                            continue;
                        }
                        // Check if attendance already exists
                        const exists = yield this.checkAttendanceExists(companyId, employee.iqamaNo, monthYear);
                        if (exists) {
                            console.warn(`Attendance already exists for ${employee.iqamaNo} in ${monthYear}`);
                            continue;
                        }
                        const attendance = yield this.createAttendance(companyId, employee.iqamaNo, monthYear, daysPresent, remarks || 'Auto-generated for all employees');
                        createdAttendances.push(attendance);
                    }
                    catch (error) {
                        console.error(`Failed to create attendance for ${employee.iqamaNo}: ${error.message}`);
                    }
                }
                return createdAttendances;
            }
            catch (error) {
                throw new Error(`Failed to generate attendance for all employees: ${error.message}`);
            }
        });
    }
    // Generate attendance for selected employees
    static generateAttendanceForSelectedEmployees(companyId, iqamaNos, monthYear, daysPresent, remarks) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                const createdAttendances = [];
                for (const iqamaNo of iqamaNos) {
                    try {
                        // Check if employee can have attendance for this month
                        const canCreate = yield this.canCreateAttendanceForMonth(companyId, iqamaNo, monthYear);
                        if (!canCreate) {
                            console.warn(`Skipping ${iqamaNo} for ${monthYear} - resigned before this month or not joined yet`);
                            continue;
                        }
                        // Check if attendance already exists
                        const exists = yield this.checkAttendanceExists(companyId, iqamaNo, monthYear);
                        if (exists) {
                            console.warn(`Attendance already exists for ${iqamaNo} in ${monthYear}`);
                            continue;
                        }
                        const attendance = yield this.createAttendance(companyId, iqamaNo, monthYear, daysPresent, remarks || 'Auto-generated for selected employees');
                        createdAttendances.push(attendance);
                    }
                    catch (error) {
                        console.error(`Failed to create attendance for ${iqamaNo}: ${error.message}`);
                    }
                }
                return createdAttendances;
            }
            catch (error) {
                throw new Error(`Failed to generate attendance for selected employees: ${error.message}`);
            }
        });
    }
    /**
     * Create attendance for pending months for all employees in a company
     */
    static createAttendanceForAllEmployeesPendingMonths(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                const activeEmployees = yield this.getAllActiveEmployees(companyId);
                const results = {};
                for (const employee of activeEmployees) {
                    try {
                        const attendances = yield this.createAttendanceForPendingMonths(companyId, employee.iqamaNo);
                        results[employee.iqamaNo] = attendances;
                    }
                    catch (error) {
                        console.error(`Failed to create pending attendances for ${employee.iqamaNo}: ${error.message}`);
                        results[employee.iqamaNo] = [];
                    }
                }
                return results;
            }
            catch (error) {
                throw new Error(`Failed to create pending attendances for all employees: ${error.message}`);
            }
        });
    }
    /**
     * Get attendance for all employees for current month in a company
     */
    static getAttendanceForAllEmployeesCurrentMonth(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                const currentMonthYear = this.getCurrentMonthYear();
                return yield attendance_model_1.AttendanceModel.find({ companyId, monthYear: currentMonthYear }).sort({ name: 1 });
            }
            catch (error) {
                throw new Error(`Failed to get current month attendance for all employees: ${error.message}`);
            }
        });
    }
    /**
     * Get attendance for all employees for a specific month in a company
     */
    static getAttendanceForAllEmployeesByMonth(companyId, monthYear) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyId) {
                    throw new Error("companyId is required");
                }
                return yield attendance_model_1.AttendanceModel.find({ companyId, monthYear }).sort({ name: 1 });
            }
            catch (error) {
                throw new Error(`Failed to get attendance for all employees: ${error.message}`);
            }
        });
    }
    // ==================== HELPER FUNCTIONS ====================
    /**
     * Calculate total working days in a month using moment.js
     */
    static getTotalWorkingDaysInMonth(monthYear) {
        const [monthName, yearStr] = monthYear.split('-');
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthIndex = months.indexOf(monthName);
        const year = parseInt(yearStr);
        // Create moment object for the first day of the month
        const startOfMonth = (0, moment_1.default)([year, monthIndex, 1]);
        // Get the number of days in the month
        const daysInMonth = startOfMonth.daysInMonth();
        // // Count working days (excluding Fridays and Saturdays - weekend in Saudi Arabia)
        // let workingDays = 0;
        // for (let day = 1; day <= daysInMonth; day++) {
        //     const currentDay = moment([year, monthIndex, day]);
        //     const dayOfWeek = currentDay.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        //     // In Saudi Arabia, weekend is Friday (5) and Saturday (6)
        //     if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        //         workingDays++;
        //     }
        // }
        // return workingDays;
        return daysInMonth;
    }
    /**
     * Get active employee configuration
     */
    static getActiveEmployeeConfig(companyId, iqamaNo) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDate = new Date();
            return yield employee_model_1.EmployeeModel.findOne({
                companyId,
                iqamaNo,
                fromDate: { $lte: currentDate },
                toDate: { $gte: currentDate }
            });
        });
    }
    /**
     * Get all active employees for a company
     */
    static getAllActiveEmployees(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDate = new Date();
            return yield employee_model_1.EmployeeModel.find({
                companyId,
                status: 'active',
                fromDate: { $lte: currentDate },
                toDate: { $gte: currentDate }
            });
        });
    }
    /**
     * Check if attendance can be created for a specific month
     */
    static canCreateAttendanceForMonth(companyId, iqamaNo, monthYear) {
        return __awaiter(this, void 0, void 0, function* () {
            const employee = yield this.getActiveEmployeeConfig(companyId, iqamaNo);
            if (!employee)
                return false;
            // Check joining date
            const joiningMonthYear = this.formatDateToMonthYear(employee.joiningDate);
            if (this.isMonthBefore(monthYear, joiningMonthYear)) {
                return false;
            }
            // Check resignation date
            if (employee.resignationDate) {
                const resignationMonthYear = this.formatDateToMonthYear(employee.resignationDate);
                if (this.isMonthAfter(monthYear, resignationMonthYear)) {
                    return false;
                }
            }
            return true;
        });
    }
    /**
     * Get pending months for an employee
     */
    static getPendingMonths(companyId, iqamaNo) {
        return __awaiter(this, void 0, void 0, function* () {
            const employee = yield this.getActiveEmployeeConfig(companyId, iqamaNo);
            if (!employee)
                return [];
            const joiningMonthYear = this.formatDateToMonthYear(employee.joiningDate);
            const currentMonthYear = this.getCurrentMonthYear();
            // Get end month (resignation date or current month)
            let endMonthYear = this.getPreviousMonthYear(currentMonthYear); // Don't include current month in pending
            if (employee.resignationDate) {
                const resignationMonthYear = this.formatDateToMonthYear(employee.resignationDate);
                endMonthYear = resignationMonthYear;
            }
            // If joining month is after end month, no pending months
            if (this.isMonthAfter(joiningMonthYear, endMonthYear)) {
                return [];
            }
            const allMonths = this.getMonthsBetween(joiningMonthYear, endMonthYear);
            const existingAttendances = yield attendance_model_1.AttendanceModel.find({ companyId, iqamaNo }).select('monthYear');
            const existingMonths = existingAttendances.map(att => att.monthYear);
            return allMonths.filter(month => !existingMonths.includes(month));
        });
    }
    /**
     * Format date to monthYear string (e.g., "January-2025")
     */
    static formatDateToMonthYear(date) {
        return (0, moment_1.default)(date).format('MMMM-YYYY');
    }
    /**
     * Get current month-year string
     */
    static getCurrentMonthYear() {
        return (0, moment_1.default)().format('MMMM-YYYY');
    }
    /**
     * Get previous month-year string
     */
    static getPreviousMonthYear(monthYear) {
        const [monthName, yearStr] = monthYear.split('-');
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthIndex = months.indexOf(monthName);
        const year = parseInt(yearStr);
        const prevMonth = (0, moment_1.default)([year, monthIndex, 1]).subtract(1, 'month');
        return prevMonth.format('MMMM-YYYY');
    }
    /**
     * Check if month1 is before month2
     */
    static isMonthBefore(month1, month2) {
        const date1 = this.parseMonthYear(month1);
        const date2 = this.parseMonthYear(month2);
        return date1.isBefore(date2);
    }
    /**
     * Check if month1 is after month2
     */
    static isMonthAfter(month1, month2) {
        const date1 = this.parseMonthYear(month1);
        const date2 = this.parseMonthYear(month2);
        return date1.isAfter(date2);
    }
    /**
     * Parse monthYear string to moment object
     */
    static parseMonthYear(monthYear) {
        return (0, moment_1.default)(monthYear, 'MMMM-YYYY');
    }
    /**
     * Get all months between two monthYear strings (inclusive)
     */
    static getMonthsBetween(startMonthYear, endMonthYear) {
        const months = [];
        const startDate = this.parseMonthYear(startMonthYear);
        const endDate = this.parseMonthYear(endMonthYear);
        const current = startDate.clone();
        while (current.isSameOrBefore(endDate)) {
            months.push(current.format('MMMM-YYYY'));
            current.add(1, 'month');
        }
        return months;
    }
}
exports.AttendanceService = AttendanceService;
