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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceForAllEmployeesByMonthController = exports.getCurrentMonthAttendanceForAllController = exports.createPendingAttendanceForAllEmployeesController = exports.generateAttendanceForSelectedEmployeesController = exports.generateAttendanceForAllEmployeesController = exports.createCurrentMonthAttendanceController = exports.deleteAttendanceController = exports.updateAttendanceController = exports.getAllAttendanceForEmployeeController = exports.getAttendanceByMonthController = exports.checkAttendanceExistsController = exports.createPendingAttendanceController = exports.createAttendanceController = void 0;
const attendance_service_1 = require("../services/attendance.service");
// Single Employee Controllers
const createAttendanceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNo, monthYear, daysPresent, remarks } = req.body;
        const { company } = req.query;
        if (!iqamaNo || !monthYear || daysPresent === undefined) {
            return res.status(400).json({
                message: "iqamaNo, monthYear, and daysPresent are required"
            });
        }
        const attendance = yield attendance_service_1.AttendanceService.createAttendance(company, iqamaNo, monthYear, daysPresent, remarks);
        return res.status(201).json({
            message: "Attendance created successfully",
            data: attendance
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.createAttendanceController = createAttendanceController;
const createPendingAttendanceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNo } = req.body;
        const { company } = req.query;
        if (!iqamaNo) {
            return res.status(400).json({
                message: "iqamaNo is required"
            });
        }
        const attendances = yield attendance_service_1.AttendanceService.createAttendanceForPendingMonths(company, iqamaNo);
        return res.status(201).json({
            message: "Pending attendances created successfully",
            data: attendances,
            count: attendances.length
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.createPendingAttendanceController = createPendingAttendanceController;
const checkAttendanceExistsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNo, monthYear } = req.params;
        const { company } = req.query;
        const exists = yield attendance_service_1.AttendanceService.checkAttendanceExists(company, iqamaNo, monthYear);
        return res.status(200).json({
            message: "Attendance check completed",
            exists
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.checkAttendanceExistsController = checkAttendanceExistsController;
const getAttendanceByMonthController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNo, monthYear } = req.params;
        const { company } = req.query;
        console.log("get attendance by month");
        const attendance = yield attendance_service_1.AttendanceService.getAttendanceByMonth(company, iqamaNo, monthYear);
        if (!attendance) {
            return res.status(404).json({
                message: "Attendance not found"
            });
        }
        return res.status(200).json({
            message: "Attendance retrieved successfully",
            data: attendance
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.getAttendanceByMonthController = getAttendanceByMonthController;
const getAllAttendanceForEmployeeController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNo } = req.params;
        const { company } = req.query;
        const attendances = yield attendance_service_1.AttendanceService.getAllAttendanceForEmployee(company, iqamaNo);
        return res.status(200).json({
            message: "All attendances retrieved successfully",
            data: attendances,
            count: attendances.length
        });
    }
    catch (error) {
        console.log("error:", error);
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.getAllAttendanceForEmployeeController = getAllAttendanceForEmployeeController;
const updateAttendanceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNo, monthYear } = req.params;
        const { daysPresent, remarks } = req.body;
        const { company } = req.query;
        const attendance = yield attendance_service_1.AttendanceService.updateAttendance(company, iqamaNo, monthYear, daysPresent, remarks);
        if (!attendance) {
            return res.status(404).json({
                message: "Attendance not found"
            });
        }
        return res.status(200).json({
            message: "Attendance updated successfully",
            data: attendance
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.updateAttendanceController = updateAttendanceController;
const deleteAttendanceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNo, monthYear } = req.params;
        const { company } = req.query;
        const deleted = yield attendance_service_1.AttendanceService.deleteAttendance(company, iqamaNo, monthYear);
        if (!deleted) {
            return res.status(404).json({
                message: "Attendance not found"
            });
        }
        return res.status(200).json({
            message: "Attendance deleted successfully"
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.deleteAttendanceController = deleteAttendanceController;
const createCurrentMonthAttendanceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNo, daysPresent, remarks } = req.body;
        const { company } = req.query;
        if (!iqamaNo || daysPresent === undefined) {
            return res.status(400).json({
                message: "iqamaNo and daysPresent are required"
            });
        }
        const attendances = yield attendance_service_1.AttendanceService.createAttendanceForCurrentMonth(company, iqamaNo, daysPresent, remarks);
        return res.status(201).json({
            message: "Current month attendance created successfully",
            data: attendances,
            count: attendances.length
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.createCurrentMonthAttendanceController = createCurrentMonthAttendanceController;
// All Employees Controllers
const generateAttendanceForAllEmployeesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { monthYear, daysPresent, remarks } = req.body;
        const { company } = req.query;
        if (!monthYear || daysPresent === undefined) {
            return res.status(400).json({
                message: "monthYear and daysPresent are required"
            });
        }
        const attendances = yield attendance_service_1.AttendanceService.generateAttendanceForAllEmployees(company, monthYear, daysPresent, remarks);
        return res.status(201).json({
            message: "Attendance generated for all employees successfully",
            data: attendances,
            count: attendances.length
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.generateAttendanceForAllEmployeesController = generateAttendanceForAllEmployeesController;
// Selected Employees Controllers
const generateAttendanceForSelectedEmployeesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iqamaNos, monthYear, daysPresent, remarks } = req.body;
        const { company } = req.query;
        if (!monthYear || daysPresent === undefined) {
            return res.status(400).json({
                message: "monthYear and daysPresent are required"
            });
        }
        const attendances = yield attendance_service_1.AttendanceService.generateAttendanceForSelectedEmployees(company, iqamaNos, monthYear, daysPresent, remarks);
        return res.status(201).json({
            message: "Attendance generated for all employees successfully",
            data: attendances,
            count: attendances.length
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.generateAttendanceForSelectedEmployeesController = generateAttendanceForSelectedEmployeesController;
const createPendingAttendanceForAllEmployeesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { company } = req.query;
    try {
        const results = yield attendance_service_1.AttendanceService.createAttendanceForAllEmployeesPendingMonths(company);
        const totalCount = Object.values(results).reduce((sum, attendances) => sum + attendances.length, 0);
        return res.status(201).json({
            message: "Pending attendances created for all employees successfully",
            data: results,
            totalCount
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.createPendingAttendanceForAllEmployeesController = createPendingAttendanceForAllEmployeesController;
const getCurrentMonthAttendanceForAllController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { company } = req.query;
    try {
        const attendances = yield attendance_service_1.AttendanceService.getAttendanceForAllEmployeesCurrentMonth(company);
        return res.status(200).json({
            message: "Current month attendance for all employees retrieved successfully",
            data: attendances,
            count: attendances.length
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.getCurrentMonthAttendanceForAllController = getCurrentMonthAttendanceForAllController;
const getAttendanceForAllEmployeesByMonthController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { monthYear } = req.params;
        const { company } = req.query;
        const attendances = yield attendance_service_1.AttendanceService.getAttendanceForAllEmployeesByMonth(company, monthYear);
        return res.status(200).json({
            message: "Attendance for all employees retrieved successfully",
            data: attendances,
            count: attendances.length
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
});
exports.getAttendanceForAllEmployeesByMonthController = getAttendanceForAllEmployeesByMonthController;
