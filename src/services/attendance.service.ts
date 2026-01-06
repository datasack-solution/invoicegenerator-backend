import { AttendanceModel, AttendanceDocument, Attendance } from "../models/attendance.model";
import { EmployeeModel, EmployeeConfigDocument } from "../models/employee.model";
import moment from "moment";

export class AttendanceService {

    // ==================== SINGLE EMPLOYEE FUNCTIONS ====================

    /**
     * 1. Create attendance for an employee for a specific month
     */
    static async createAttendance(
        iqamaNo: string,
        monthYear: string,
        daysPresent: number,
        remarks?: string
    ): Promise<AttendanceDocument> {
        try {
            // Check if employee exists and get employee details
            const employee = await this.getActiveEmployeeConfig(iqamaNo);
            if (!employee) {
                throw new Error(`Employee with iqamaNo ${iqamaNo} not found`);
            }

            // Check if attendance can be created for this month
            const canCreate = await this.canCreateAttendanceForMonth(iqamaNo, monthYear);
            if (!canCreate) {
                throw new Error(`Cannot create attendance for ${monthYear}. Employee may have resigned before this month or not joined yet.`);
            }

            // Check if attendance already exists
            const existingAttendance = await this.checkAttendanceExists(iqamaNo, monthYear);
            if (existingAttendance) {
                throw new Error(`Attendance already exists for ${iqamaNo} in ${monthYear}`);
            }

            // Calculate total working days for the month
            const totalWorkingDays = this.getTotalWorkingDaysInMonth(monthYear);

            const attendanceData: Omit<Attendance, '_id'> = {
                iqamaNo: employee.iqamaNo,
                name: employee.name,
                monthYear,
                totalWorkingDays,
                daysPresent,
                remarks
            };

            const attendance = new AttendanceModel(attendanceData);
            return await attendance.save();
        } catch (error: any) {
            throw new Error(`Failed to create attendance: ${error.message}`);
        }
    }

    /**
     * 2. Create attendance for pending months from joining date to current month
     * For pending months: total working days = days present (as per requirement)
     */
    static async createAttendanceForPendingMonths(iqamaNo: string): Promise<AttendanceDocument[]> {
        try {
            const employee = await this.getActiveEmployeeConfig(iqamaNo);
            if (!employee) {
                throw new Error(`Employee with iqamaNo ${iqamaNo} not found`);
            }

            const pendingMonths = await this.getPendingMonths(iqamaNo);
            const createdAttendances: AttendanceDocument[] = [];

            for (const monthYear of pendingMonths) {
                try {
                    // For pending months, total working days = days present
                    const totalWorkingDays = this.getTotalWorkingDaysInMonth(monthYear);

                    const attendanceData: Omit<Attendance, '_id'> = {
                        iqamaNo: employee.iqamaNo,
                        name: employee.name,
                        monthYear,
                        totalWorkingDays,
                        daysPresent: totalWorkingDays, // For pending months, assume full attendance
                        remarks: 'Auto-generated for pending month'
                    };

                    const attendance = new AttendanceModel(attendanceData);
                    const savedAttendance = await attendance.save();
                    createdAttendances.push(savedAttendance);
                } catch (error: any) {
                    console.warn(`Failed to create attendance for ${monthYear}: ${error.message}`);
                }
            }

            return createdAttendances;
        } catch (error: any) {
            throw new Error(`Failed to create pending attendances: ${error.message}`);
        }
    }

    /**
     * 3. Check if attendance exists for an employee for a month
     */
    static async checkAttendanceExists(iqamaNo: string, monthYear: string): Promise<boolean> {
        try {
            const attendance = await AttendanceModel.findOne({ iqamaNo, monthYear });
            return !!attendance;
        } catch (error: any) {
            throw new Error(`Failed to check attendance existence: ${error.message}`);
        }
    }

    /**
     * 4. Get attendance for an employee for a specific month
     */
    static async getAttendanceByMonth(iqamaNo: string, monthYear: string): Promise<AttendanceDocument | null> {
        try {
            return await AttendanceModel.findOne({ iqamaNo, monthYear });
        } catch (error: any) {
            throw new Error(`Failed to get attendance: ${error.message}`);
        }
    }

    /**
     * 5. Get all attendance records for an employee
     */
    static async getAllAttendanceForEmployee(iqamaNo: string): Promise<AttendanceDocument[]> {
        try {
            return await AttendanceModel.aggregate([
                { $match: { iqamaNo } },
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
        } catch (error: any) {
            throw new Error(`Failed to get all attendance: ${error.message}`);
        }
    }

    /**
     * 6. Update attendance for an employee for a month
     */
    static async updateAttendance(
        iqamaNo: string,
        monthYear: string,
        daysPresent?: number,
        remarks?: string
    ): Promise<AttendanceDocument | null> {
        try {
            const updateData: any = {};

            if (daysPresent !== undefined) {
                updateData.daysPresent = daysPresent;
            }

            if (remarks !== undefined) {
                updateData.remarks = remarks;
            }

            return await AttendanceModel.findOneAndUpdate(
                { iqamaNo, monthYear },
                updateData,
                { new: true }
            );
        } catch (error: any) {
            throw new Error(`Failed to update attendance: ${error.message}`);
        }
    }

    /**
     * 7. Delete attendance for an employee for a month
     */
    static async deleteAttendance(iqamaNo: string, monthYear: string): Promise<boolean> {
        try {
            const result = await AttendanceModel.deleteOne({ iqamaNo, monthYear });
            return result.deletedCount > 0;
        } catch (error: any) {
            throw new Error(`Failed to delete attendance: ${error.message}`);
        }
    }

    /**
     * 8. Create attendance for current month with smart logic
     */
    static async createAttendanceForCurrentMonth(
        iqamaNo: string,
        daysPresent: number,
        remarks?: string
    ): Promise<AttendanceDocument[]> {
        try {
            const employee = await this.getActiveEmployeeConfig(iqamaNo);
            if (!employee) {
                throw new Error(`Employee with iqamaNo ${iqamaNo} not found`);
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
            const currentExists = await this.checkAttendanceExists(iqamaNo, currentMonthYear);
            if (currentExists) {
                throw new Error(`Attendance for current month ${currentMonthYear} already exists`);
            }

            // Get previous month
            const previousMonthYear = this.getPreviousMonthYear(currentMonthYear);
            const previousExists = await this.checkAttendanceExists(iqamaNo, previousMonthYear);

            const createdAttendances: AttendanceDocument[] = [];

            if (!previousExists) {
                // Previous month doesn't exist, create all pending months up to previous month
                const pendingAttendances = await this.createAttendanceForPendingMonths(iqamaNo);
                createdAttendances.push(...pendingAttendances);
            }

            // Now create current month attendance
            const currentAttendance = await this.createAttendance(
                iqamaNo,
                currentMonthYear,
                daysPresent,
                remarks || 'Current month attendance'
            );
            createdAttendances.push(currentAttendance);

            return createdAttendances;
        } catch (error: any) {
            throw new Error(`Failed to create current month attendance: ${error.message}`);
        }
    }

    // ==================== ALL EMPLOYEES FUNCTIONS ====================

    /**
     * Generate attendance for all employees for a specific month
     */
    static async generateAttendanceForAllEmployees(
        monthYear: string,
        daysPresent: number,
        remarks?: string
    ): Promise<AttendanceDocument[]> {
        try {
            const activeEmployees = await this.getAllActiveEmployees();
            const createdAttendances: AttendanceDocument[] = [];

            for (const employee of activeEmployees) {
                try {
                    // Check if employee can have attendance for this month
                    const canCreate = await this.canCreateAttendanceForMonth(employee.iqamaNo, monthYear);
                    if (!canCreate) {
                        console.warn(`Skipping ${employee.iqamaNo} for ${monthYear} - resigned before this month or not joined yet`);
                        continue;
                    }

                    // Check if attendance already exists
                    const exists = await this.checkAttendanceExists(employee.iqamaNo, monthYear);
                    if (exists) {
                        console.warn(`Attendance already exists for ${employee.iqamaNo} in ${monthYear}`);
                        continue;
                    }

                    const attendance = await this.createAttendance(
                        employee.iqamaNo,
                        monthYear,
                        daysPresent,
                        remarks || 'Auto-generated for all employees'
                    );
                    createdAttendances.push(attendance);
                } catch (error: any) {
                    console.error(`Failed to create attendance for ${employee.iqamaNo}: ${error.message}`);
                }
            }

            return createdAttendances;
        } catch (error: any) {
            throw new Error(`Failed to generate attendance for all employees: ${error.message}`);
        }
    }


    // Generate attendance for selected employees
    static async generateAttendanceForSelectedEmployees(
        iqamaNos: string[],
        monthYear: string,
        daysPresent: number,
        remarks?: string
    ): Promise<AttendanceDocument[]> {
        try {
            // const activeEmployees = await this.getAllActiveEmployees();
            const createdAttendances: AttendanceDocument[] = [];

            for (const iqamaNo of iqamaNos) {
                try {
                    // Check if employee can have attendance for this month
                    const canCreate = await this.canCreateAttendanceForMonth(iqamaNo, monthYear);
                    if (!canCreate) {
                        console.warn(`Skipping ${iqamaNo} for ${monthYear} - resigned before this month or not joined yet`);
                        continue;
                    }

                    // Check if attendance already exists
                    const exists = await this.checkAttendanceExists(iqamaNo, monthYear);
                    if (exists) {
                        console.warn(`Attendance already exists for ${iqamaNo} in ${monthYear}`);
                        continue;
                    }

                    const attendance = await this.createAttendance(
                        iqamaNo,
                        monthYear,
                        daysPresent,
                        remarks || 'Auto-generated for all employees'
                    );
                    createdAttendances.push(attendance);
                } catch (error: any) {
                    console.error(`Failed to create attendance for ${iqamaNo}: ${error.message}`);
                }
            }

            return createdAttendances;
        } catch (error: any) {
            throw new Error(`Failed to generate attendance for all employees: ${error.message}`);
        }
    }

    /**
     * Create attendance for pending months for all employees
     */
    static async createAttendanceForAllEmployeesPendingMonths(): Promise<{ [iqamaNo: string]: AttendanceDocument[] }> {
        try {
            const activeEmployees = await this.getAllActiveEmployees();
            const results: { [iqamaNo: string]: AttendanceDocument[] } = {};

            for (const employee of activeEmployees) {
                try {
                    const attendances = await this.createAttendanceForPendingMonths(employee.iqamaNo);
                    results[employee.iqamaNo] = attendances;
                } catch (error: any) {
                    console.error(`Failed to create pending attendances for ${employee.iqamaNo}: ${error.message}`);
                    results[employee.iqamaNo] = [];
                }
            }

            return results;
        } catch (error: any) {
            throw new Error(`Failed to create pending attendances for all employees: ${error.message}`);
        }
    }

    /**
     * Get attendance for all employees for current month
     */
    static async getAttendanceForAllEmployeesCurrentMonth(): Promise<AttendanceDocument[]> {
        try {
            const currentMonthYear = this.getCurrentMonthYear();
            return await AttendanceModel.find({ monthYear: currentMonthYear }).sort({ name: 1 });
        } catch (error: any) {
            throw new Error(`Failed to get current month attendance for all employees: ${error.message}`);
        }
    }

    /**
     * Get attendance for all employees for a specific month
     */
    static async getAttendanceForAllEmployeesByMonth(monthYear: string): Promise<AttendanceDocument[]> {
        try {
            return await AttendanceModel.find({ monthYear }).sort({ name: 1 });
        } catch (error: any) {
            throw new Error(`Failed to get attendance for all employees: ${error.message}`);
        }
    }

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Calculate total working days in a month using moment.js
     */
    private static getTotalWorkingDaysInMonth(monthYear: string): number {
        const [monthName, yearStr] = monthYear.split('-');
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthIndex = months.indexOf(monthName);
        const year = parseInt(yearStr);

        // Create moment object for the first day of the month
        const startOfMonth = moment([year, monthIndex, 1]);

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
        return daysInMonth
    }

    /**
     * Get active employee configuration
     */
    private static async getActiveEmployeeConfig(iqamaNo: string): Promise<EmployeeConfigDocument | null> {
        const currentDate = new Date();
        return await EmployeeModel.findOne({
            iqamaNo,
            fromDate: { $lte: currentDate },
            toDate: { $gte: currentDate }
        });
    }

    /**
     * Get all active employees
     */
    private static async getAllActiveEmployees(): Promise<EmployeeConfigDocument[]> {
        const currentDate = new Date();
        return await EmployeeModel.find({
            status: 'active',
            fromDate: { $lte: currentDate },
            toDate: { $gte: currentDate }
        });
    }

    /**
     * Check if attendance can be created for a specific month
     */
    private static async canCreateAttendanceForMonth(iqamaNo: string, monthYear: string): Promise<boolean> {
        const employee = await this.getActiveEmployeeConfig(iqamaNo);
        if (!employee) return false;

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
    }

    /**
     * Get pending months for an employee
     */
    private static async getPendingMonths(iqamaNo: string): Promise<string[]> {
        const employee = await this.getActiveEmployeeConfig(iqamaNo);
        if (!employee) return [];

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
        const existingAttendances = await AttendanceModel.find({ iqamaNo }).select('monthYear');
        const existingMonths = existingAttendances.map(att => att.monthYear);

        return allMonths.filter(month => !existingMonths.includes(month));
    }

    /**
     * Format date to monthYear string (e.g., "January-2025")
     */
    private static formatDateToMonthYear(date: Date): string {
        return moment(date).format('MMMM-YYYY');
    }

    /**
     * Get current month-year string
     */
    private static getCurrentMonthYear(): string {
        return moment().format('MMMM-YYYY');
    }

    /**
     * Get previous month-year string
     */
    private static getPreviousMonthYear(monthYear: string): string {
        const [monthName, yearStr] = monthYear.split('-');
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthIndex = months.indexOf(monthName);
        const year = parseInt(yearStr);

        const prevMonth = moment([year, monthIndex, 1]).subtract(1, 'month');
        return prevMonth.format('MMMM-YYYY');
    }

    /**
     * Check if month1 is before month2
     */
    private static isMonthBefore(month1: string, month2: string): boolean {
        const date1 = this.parseMonthYear(month1);
        const date2 = this.parseMonthYear(month2);
        return date1.isBefore(date2);
    }

    /**
     * Check if month1 is after month2
     */
    private static isMonthAfter(month1: string, month2: string): boolean {
        const date1 = this.parseMonthYear(month1);
        const date2 = this.parseMonthYear(month2);
        return date1.isAfter(date2);
    }

    /**
     * Parse monthYear string to moment object
     */
    private static parseMonthYear(monthYear: string): moment.Moment {
        return moment(monthYear, 'MMMM-YYYY');
    }

    /**
     * Get all months between two monthYear strings (inclusive)
     */
    private static getMonthsBetween(startMonthYear: string, endMonthYear: string): string[] {
        const months: string[] = [];
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