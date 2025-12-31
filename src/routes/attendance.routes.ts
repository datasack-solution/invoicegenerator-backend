import { Router } from "express";
import {
    // Single Employee Controllers
    createAttendanceController,
    createPendingAttendanceController,
    checkAttendanceExistsController,
    getAttendanceByMonthController,
    getAllAttendanceForEmployeeController,
    updateAttendanceController,
    deleteAttendanceController,
    createCurrentMonthAttendanceController,
    
    // All Employees Controllers
    generateAttendanceForAllEmployeesController,
    createPendingAttendanceForAllEmployeesController,
    getCurrentMonthAttendanceForAllController,
    getAttendanceForAllEmployeesByMonthController
} from "../controllers/attendance.controller";

const router = Router();

// ==================== SINGLE EMPLOYEE ROUTES ====================

// 1. Create attendance for specific month
router.post("/create", createAttendanceController);

// 2. Create attendance for pending months
router.post("/create-pending", createPendingAttendanceController);

// 3. Check if attendance exists
router.get("/exists/:iqamaNo/:monthYear", checkAttendanceExistsController);

// 4. Get attendance by month
router.get("/:iqamaNo/:monthYear", getAttendanceByMonthController);

// 5. Get all attendance for employee
router.get("/employee/:iqamaNo", getAllAttendanceForEmployeeController);

// 6. Update attendance
router.put("/:iqamaNo/:monthYear", updateAttendanceController);

// 7. Delete attendance
router.delete("/:iqamaNo/:monthYear", deleteAttendanceController);

// 8. Create current month attendance
router.post("/create-current-month", createCurrentMonthAttendanceController);

// ==================== ALL EMPLOYEES ROUTES ====================

// Generate attendance for all employees for specific month
router.post("/all-employees/generate", generateAttendanceForAllEmployeesController);

// Create pending attendance for all employees
router.post("/all-employees/create-pending", createPendingAttendanceForAllEmployeesController);

// Get current month attendance for all employees
router.get("/all-employees/current-month", getCurrentMonthAttendanceForAllController);

// Get attendance for all employees by month
router.get("/all-employees/:monthYear", getAttendanceForAllEmployeesByMonthController);

export default router;