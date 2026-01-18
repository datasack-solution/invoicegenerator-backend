"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeModel = void 0;
// Mongoose model for Employee (matches the interfaces above exactly — no extra fields)
const mongoose_1 = require("mongoose");
const db_1 = require("../utils/db");
const EmployeeSchema = new mongoose_1.Schema({
    companyId: { type: String, required: true },
    iqamaNo: { type: String, required: true },
    name: { type: String, required: true },
    designation: { type: String },
    status: { type: String, required: true, enum: ["active", "inactive"] },
    basic: { type: Number, required: false }, // Optional for Neosoft
    housing: { type: Number, required: false }, // Optional for Neosoft
    transport: { type: Number, required: false }, // Optional for Neosoft
    // fixed salary details - all optional for Neosoft
    medicalInsurance: { type: Number, required: false },
    iqamaRenewalCost: { type: Number, required: false },
    gosi: { type: Number, required: false },
    fix: { type: Number, required: false },
    saudization: { type: Number, required: false },
    serviceCharge: { type: Number, required: false }, // Required for Neosoft, optional for BlueBinaries
    exitFee: { type: Number, required: false }, // optional
    exitReentryFee: { type: Number, required: false }, // optional
<<<<<<< Updated upstream
=======
    prorateServiceCharge: { type: Number, required: false }, // This is for Neosoft company
>>>>>>> Stashed changes
    joiningDate: { type: Date, required: true },
    resignationDate: { type: Date, required: false },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true }
}, {
    timestamps: true
});
// Ensure at most one config exists per companyId + iqamaNo + toDate
EmployeeSchema.index({ companyId: 1, iqamaNo: 1, toDate: 1 }, { unique: true });
exports.EmployeeModel = (0, mongoose_1.model)(db_1.isProduction ? "Employee" : "EmployeeTest", EmployeeSchema);
