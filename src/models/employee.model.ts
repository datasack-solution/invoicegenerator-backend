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
<<<<<<< Updated upstream
    basic: number,
    housing: number,
    transport: number
=======
    basic?: number, // Optional for Neosoft
    housing?: number, // Optional for Neosoft
    transport?: number, // Optional for Neosoft
    prorateServiceCharge?: number, // For Neosoft proration
>>>>>>> Stashed changes
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
    prorateServiceCharge: {type: Number, required: false}, // This is for Neosoft company

>>>>>>> Stashed changes
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