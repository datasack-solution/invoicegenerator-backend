"use strict";
// import dotenv from "dotenv";
// import app from "./app";
// import routes from './routes'
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
exports.checkIsServerStarted = exports.startServer = void 0;
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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const fixedSalary_routes_1 = __importDefault(require("./routes/fixedSalary.routes"));
const employeeConfig_routes_1 = __importDefault(require("./routes/employeeConfig.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
require('dotenv').config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/auth", auth_routes_1.default);
app.use("/api/fixed-salary", fixedSalary_routes_1.default);
app.use("/api/employee-config", employeeConfig_routes_1.default);
app.use("/api/attendance", attendance_routes_1.default);
app.use("/api/invoices", invoice_routes_1.default);
let serverStarted = false;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    app.listen(process.env.PORT, () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Server started listening on port ${process.env.PORT}`);
        serverStarted = true;
    }));
});
exports.startServer = startServer;
const checkIsServerStarted = () => {
    return serverStarted;
};
exports.checkIsServerStarted = checkIsServerStarted;
