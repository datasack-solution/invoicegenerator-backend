// Mongoose model for Employee (matches the interfaces above exactly — no extra fields)
import { model, Model, Schema } from "mongoose";
import { FixedSalaryDetails } from "./fixedSalary.model";
import { isProduction } from "../utils/db";

//BLUE BEAM COMPANY EMPLOYEE MODEL

export interface EmployeeProfile {
    companyId: string;
    iqamaNo: string;
    name: string;
    designation?: string;
    status: "active" | "inactive"
    joiningDate: Date;
    resignationDate?: Date
}

export interface EmployeeProrateSalaryDetails {
    basic: number,
    housing: number,
    transport: number
}

export interface EmployeeConfig extends EmployeeProfile, EmployeeProrateSalaryDetails, FixedSalaryDetails {
    _id?: string;
    fromDate: Date;
    toDate: Date;
}

export interface EmployeeConfigDocument extends EmployeeConfig { }

const EmployeeSchema = new Schema<EmployeeConfigDocument>({
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

    joiningDate: {type: Date, required: true },
    resignationDate: { type: Date, required: false },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true }
},{
    timestamps: true
});

// Ensure at most one config exists per companyId + iqamaNo + toDate
EmployeeSchema.index({ companyId: 1, iqamaNo: 1, toDate: 1 }, { unique: true });

export const EmployeeModel: Model<EmployeeConfigDocument> = model<EmployeeConfigDocument>(
    isProduction ? "Employee" : "EmployeeTest", 
    EmployeeSchema
);