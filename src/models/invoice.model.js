"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceModel = void 0;
const mongoose_1 = require("mongoose");
const attendance_model_1 = require("./attendance.model");
const db_1 = require("../utils/db");
/* ---------- Schema ---------- */
const InvoiceSchema = new mongoose_1.Schema({
    companyId: { type: String, required: true },
    invoiceNo: { type: String, required: true, unique: true },
    iqamaNo: { type: String, required: true },
    employeeName: { type: String, required: true },
    designation: String,
    monthYear: { type: String, required: true },
    attendance: attendance_model_1.AttendanceSchema,
    // month: { type: Number, required: false },
    // year: { type: Number, required: false },
    version: { type: Number, required: true },
    isFinal: { type: Boolean, default: false },
    generatedInMonth: { type: Number, required: false },
    generatedInYear: { type: Number, required: false },
    periodStart: { type: Date, required: false },
    periodEnd: { type: Date, required: false },
    baseSalary: {
        basic: Number,
        housing: Number,
        transport: Number
    },
    fixedCosts: {
        medicalInsurance: Number,
        iqamaRenewalCost: Number,
        gosi: Number,
        fix: Number,
        saudization: Number,
        serviceCharge: Number,
        exitFee: Number,
        exitReentryFee: Number
    },
    extraComponents: [
        {
            key: String,
            label: String,
            type: { type: String, enum: ["earning", "deduction"] },
            amount: Number
        }
    ],
    grossEarnings: Number,
    totalDeductions: Number,
    netPayable: Number,
    remarks: { type: String, required: false }, // Optional remarks field
    generatedAt: { type: Date, default: Date.now },
    replaceAt: { type: Date, required: false, default: Date.now },
    finalizedAt: { type: Date, required: false } // When invoice was marked as final
}, { timestamps: true });
/* ---------- Index ---------- */
// Group invoices by company + employee + month
InvoiceSchema.index({ companyId: 1, iqamaNo: 1, monthYear: 1, version: 1 }, { unique: true });
exports.InvoiceModel = (0, mongoose_1.model)(db_1.isProduction ? "Invoice" : "InvoiceTest", InvoiceSchema);
