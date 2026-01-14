"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedSalaryModel = void 0;
const mongoose_1 = require("mongoose");
const db_1 = require("../utils/db");
const FixedSalarySchema = new mongoose_1.Schema({
    companyId: { type: String, required: true, unique: true }, // One fixed salary config per company
    medicalInsurance: { type: Number, required: true },
    iqamaRenewalCost: { type: Number, required: true },
    gosi: { type: Number, required: true },
    fix: { type: Number, required: true },
    saudization: { type: Number, required: true },
    serviceCharge: { type: Number, required: true },
    exitFee: { type: Number, required: false },
    exitReentryFee: { type: Number, required: false }
}, {
    timestamps: true
});
exports.FixedSalaryModel = (0, mongoose_1.model)(db_1.isProduction ? "FixedSalary" : "FixedSalaryTest", FixedSalarySchema);
