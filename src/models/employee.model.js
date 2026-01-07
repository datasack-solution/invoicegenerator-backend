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
    basic: { type: Number, required: true },
    housing: { type: Number, required: true },
    transport: { type: Number, required: true },
    // fixed salary details
    medicalInsurance: { type: Number, required: true },
    iqamaRenewalCost: { type: Number, required: true },
    gosi: { type: Number, required: true },
    fix: { type: Number, required: true },
    saudization: { type: Number, required: true },
    serviceCharge: { type: Number, required: true }, //datasack service charge
    exitFee: { type: Number, required: false }, // optional
    exitReentryFee: { type: Number, required: false }, // optional
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
