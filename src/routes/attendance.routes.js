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
const express_1 = require("express");
const attendance_controller_1 = require("../controllers/attendance.controller");
const attendance_model_1 = require("../models/attendance.model");
const router = (0, express_1.Router)();
// ==================== SINGLE EMPLOYEE ROUTES ====================
// 1. Create attendance for specific month
router.post("/employee/create", attendance_controller_1.createAttendanceController);
// 2. Create attendance for pending months
router.post("/employee/create-pending", attendance_controller_1.createPendingAttendanceController);
// 3. Check if attendance exists
router.get("/employee/exists/:iqamaNo/:monthYear", attendance_controller_1.checkAttendanceExistsController);
// 4. Get attendance by month
router.get("/employee/:iqamaNo/:monthYear", attendance_controller_1.getAttendanceByMonthController);
// 5. Get all attendance for employee
router.get("/employee/:iqamaNo", attendance_controller_1.getAllAttendanceForEmployeeController);
// 6. Update attendance
router.put("/employee/:iqamaNo/:monthYear", attendance_controller_1.updateAttendanceController);
// 7. Delete attendance
router.delete("/employee/:iqamaNo/:monthYear", attendance_controller_1.deleteAttendanceController);
// 8. Create current month attendance
router.post("/employee/create-current-month", attendance_controller_1.createCurrentMonthAttendanceController);
// ==================== ALL EMPLOYEES ROUTES ====================
// Generate attendance for all employees for specific month
router.post("/all-employees/generate", attendance_controller_1.generateAttendanceForAllEmployeesController);
router.post("/bulk-attendance/generate", attendance_controller_1.generateAttendanceForSelectedEmployeesController);
// Create pending attendance for all employees
router.post("/all-employees/create-pending", attendance_controller_1.createPendingAttendanceForAllEmployeesController);
// Get current month attendance for all employees
router.get("/all-employees/current-month", attendance_controller_1.getCurrentMonthAttendanceForAllController);
// Get attendance for all employees by month
router.get("/all-employees/:monthYear", attendance_controller_1.getAttendanceForAllEmployeesByMonthController);
router.get("/all-attendances", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const got = yield attendance_model_1.AttendanceModel.find({ iqamaNo: "2345678901" });
        res.json(got);
    }
    catch (e) {
        res.json("error");
    }
}));
exports.default = router;
