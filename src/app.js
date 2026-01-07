"use strict";
// import express from "express";
// import cors from "cors";
// import authRoutes from "./routes/auth.routes";
// import fixedSalaryRoutes from "./routes/fixedSalary.routes";
// import employeeConfigRoutes from "./routes/employeeConfig.routes";
// import attendanceRoutes from "./routes/attendance.routes";
// import invoiceRoutes from "./routes/invoice.routes";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./utils/db"));
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use("/api/auth", authRoutes);
// app.use("/api/fixed-salary", fixedSalaryRoutes);
// app.use("/api/employee-config", employeeConfigRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/invoices", invoiceRoutes);
// export default app;
// global error handling to prevent crashes
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
// call the function to connect to the DB and then start the server
(0, db_1.default)();
