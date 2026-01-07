// import dotenv from "dotenv";
// import app from "./app";
// import routes from './routes'

// dotenv.config();

// const PORT = process.env.PORT || 5000;

// import { connectDB } from "./utils/db";

// app.use("/api", routes);

// const start = async () => {
//   try {
//     await connectDB();
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on http://localhost:${PORT}`);
//     });
//   } catch (err) {
//     console.error("Failed to start server:", err);
//     process.exit(1);
//   }
// };

// start();


import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import fixedSalaryRoutes from "./routes/fixedSalary.routes";
import employeeConfigRoutes from "./routes/employeeConfig.routes";
import attendanceRoutes from "./routes/attendance.routes";
import invoiceRoutes from "./routes/invoice.routes";
require('dotenv').config();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/fixed-salary", fixedSalaryRoutes);
app.use("/api/employee-config", employeeConfigRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use("/api/invoices", invoiceRoutes);


let serverStarted=false
export const startServer = async () => {
  app.listen(process.env.PORT, async () => {
    console.log(`Server started listening on port ${process.env.PORT}`);
    serverStarted=true
  });
};

export const checkIsServerStarted = ():boolean =>{
  return serverStarted
}