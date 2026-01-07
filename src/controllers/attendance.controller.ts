import { Request, Response } from "express";
import { AttendanceService } from "../services/attendance.service";

// Single Employee Controllers
export const createAttendanceController = async (req: Request, res: Response) => {
    try {
        const { iqamaNo, monthYear, daysPresent, remarks } = req.body;
        const {company} = req.query

        if (!iqamaNo || !monthYear || daysPresent === undefined) {
            return res.status(400).json({
                message: "iqamaNo, monthYear, and daysPresent are required"
            });
        }

        const attendance = await AttendanceService.createAttendance(company as string, iqamaNo, monthYear, daysPresent, remarks);
        
        return res.status(201).json({
            message: "Attendance created successfully",
            data: attendance
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const createPendingAttendanceController = async (req: Request, res: Response) => {
    try {
        const { iqamaNo } = req.body;
        const {company} = req.query

        if (!iqamaNo) {
            return res.status(400).json({
                message: "iqamaNo is required"
            });
        }

        const attendances = await AttendanceService.createAttendanceForPendingMonths(company as string, iqamaNo);
        
        return res.status(201).json({
            message: "Pending attendances created successfully",
            data: attendances,
            count: attendances.length
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const checkAttendanceExistsController = async (req: Request, res: Response) => {
    try {
        const { iqamaNo, monthYear } = req.params;
                const {company} = req.query


        const exists = await AttendanceService.checkAttendanceExists(company as string, iqamaNo, monthYear);
        
        return res.status(200).json({
            message: "Attendance check completed",
            exists
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const getAttendanceByMonthController = async (req: Request, res: Response) => {
    try {
        const { iqamaNo, monthYear } = req.params;
                        const {company} = req.query

        console.log("get attendance by month")

        const attendance = await AttendanceService.getAttendanceByMonth(company as string, iqamaNo, monthYear);
        
        if (!attendance) {
            return res.status(404).json({
                message: "Attendance not found"
            });
        }

        return res.status(200).json({
            message: "Attendance retrieved successfully",
            data: attendance
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const getAllAttendanceForEmployeeController = async (req: Request, res: Response) => {
    try {
        const { iqamaNo } = req.params;
        const {company} = req.query

        const attendances = await AttendanceService.getAllAttendanceForEmployee(company as string,iqamaNo);
        return res.status(200).json({
            message: "All attendances retrieved successfully",
            data: attendances,
            count: attendances.length
        });
    } catch (error:any) {
        console.log("error:",error)
        return res.status(400).json({
            message: error.message
        });
    }
};

export const updateAttendanceController = async (req: Request, res: Response) => {
    try {
        const { iqamaNo, monthYear } = req.params;
        const { daysPresent, remarks } = req.body;
                        const {company} = req.query


        const attendance = await AttendanceService.updateAttendance(company as string,iqamaNo, monthYear, daysPresent, remarks);
        
        if (!attendance) {
            return res.status(404).json({
                message: "Attendance not found"
            });
        }

        return res.status(200).json({
            message: "Attendance updated successfully",
            data: attendance
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const deleteAttendanceController = async (req: Request, res: Response) => {
    try {
        const { iqamaNo, monthYear } = req.params;
                        const {company} = req.query

        const deleted = await AttendanceService.deleteAttendance(company as string, iqamaNo, monthYear);
        
        if (!deleted) {
            return res.status(404).json({
                message: "Attendance not found"
            });
        }

        return res.status(200).json({
            message: "Attendance deleted successfully"
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const createCurrentMonthAttendanceController = async (req: Request, res: Response) => {
    try {
        const { iqamaNo, daysPresent, remarks } = req.body;
        const {company} = req.query

        if (!iqamaNo || daysPresent === undefined) {
            return res.status(400).json({
                message: "iqamaNo and daysPresent are required"
            });
        }

        const attendances = await AttendanceService.createAttendanceForCurrentMonth(company as string, iqamaNo, daysPresent, remarks);
        
        return res.status(201).json({
            message: "Current month attendance created successfully",
            data: attendances,
            count: attendances.length
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

// All Employees Controllers
export const generateAttendanceForAllEmployeesController = async (req: Request, res: Response) => {
    try {
        const { monthYear, daysPresent, remarks } = req.body;
        const {company} = req.query

        if (!monthYear || daysPresent === undefined) {
            return res.status(400).json({
                message: "monthYear and daysPresent are required"
            });
        }

        const attendances = await AttendanceService.generateAttendanceForAllEmployees(company as string, monthYear, daysPresent, remarks);
        
        return res.status(201).json({
            message: "Attendance generated for all employees successfully",
            data: attendances,
            count: attendances.length
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

// Selected Employees Controllers
export const generateAttendanceForSelectedEmployeesController = async (req: Request, res: Response) => {
    try {
        const {iqamaNos, monthYear, daysPresent, remarks } = req.body;
        const {company} = req.query

        if (!monthYear || daysPresent === undefined) {
            return res.status(400).json({
                message: "monthYear and daysPresent are required"
            });
        }

        const attendances = await AttendanceService.generateAttendanceForSelectedEmployees(company  as string, iqamaNos,monthYear, daysPresent, remarks);
        
        return res.status(201).json({
            message: "Attendance generated for all employees successfully",
            data: attendances,
            count: attendances.length
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const createPendingAttendanceForAllEmployeesController = async (req: Request, res: Response) => {
    const {company}=req.query
    try {
        const results = await AttendanceService.createAttendanceForAllEmployeesPendingMonths(company as string);
        
        const totalCount = Object.values(results).reduce((sum, attendances) => sum + attendances.length, 0);
        
        return res.status(201).json({
            message: "Pending attendances created for all employees successfully",
            data: results,
            totalCount
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const getCurrentMonthAttendanceForAllController = async (req: Request, res: Response) => {
    const {company} = req.query
    try {
        const attendances = await AttendanceService.getAttendanceForAllEmployeesCurrentMonth(company as string);
        
        return res.status(200).json({
            message: "Current month attendance for all employees retrieved successfully",
            data: attendances,
            count: attendances.length
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const getAttendanceForAllEmployeesByMonthController = async (req: Request, res: Response) => {
    try {
        const { monthYear } = req.params;
    const {company} = req.query

        const attendances = await AttendanceService.getAttendanceForAllEmployeesByMonth(company as string, monthYear);
        
        return res.status(200).json({
            message: "Attendance for all employees retrieved successfully",
            data: attendances,
            count: attendances.length
        });
    } catch (error:any) {
        return res.status(400).json({
            message: error.message
        });
    }
};