"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceModel = exports.AttendanceSchema = void 0;
const mongoose_1 = require("mongoose");
const db_1 = require("../utils/db");
exports.AttendanceSchema = new mongoose_1.Schema({
    companyId: { type: String, required: true },
    iqamaNo: { type: String, required: true },
    name: { type: String, required: true },
    monthYear: { type: String, required: true }, //January-2025
    totalWorkingDays: { type: Number, required: true },
    daysPresent: { type: Number, required: true },
    remarks: { type: String }
});
// Unique index for companyId + iqamaNo + monthYear
exports.AttendanceSchema.index({ companyId: 1, iqamaNo: 1, monthYear: 1 }, { unique: true });
exports.AttendanceModel = (0, mongoose_1.model)(db_1.isProduction ? "Attendance" : "AttendanceTest", exports.AttendanceSchema);
//Attendance service functions
// Below func for single employee
// 1. create attendance - create attendance for an employee for a month (any month in the year or any year)
// 2. create attendance for pending months till now - pending attendance from employee joining month to current month
// 3. Check attendance exists for an employee for a month
// 4. get attendance for an employee for a month by iqamaNo
// 5. get all attendance for an employee
// 6. update attendance for an employee for a month
// 7. delete attendance for an employee for a month 
// 8. create attendance for an employee for a current month (check for attendance for previous month, if exist, single click to add current month, or else add upto the current month,and also check the resignation date lies on this month, if yes, create attendance for this month, but not allow from next month)
// If resignation date exists, no attendance can be created beyond that month
// Below func for all employees
// Single function to generate attendanc for all the employees for a month
// create attendance for pending months till now from each employee joining date to current month
// get attendance for all the employee for the current month
// get attendance by iqamaNo
// ....
