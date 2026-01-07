import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import fixedSalaryRoutes from "./routes/fixedSalary.routes";
import employeeConfigRoutes from "./routes/employeeConfig.routes";
import attendanceRoutes from "./routes/attendance.routes";
import invoiceRoutes from "./routes/invoice.routes";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/fixed-salary", fixedSalaryRoutes);
app.use("/api/employee-config", employeeConfigRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use("/api/invoices", invoiceRoutes);

export default app;
